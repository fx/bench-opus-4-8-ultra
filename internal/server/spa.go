package server

import (
	"io/fs"
	"net/http"
	"strings"
)

// spaHandler serves a built single-page application from an embedded
// filesystem. Real files are served directly (hashed assets get a long
// immutable cache, index.html is always revalidated). Requests that don't map
// to a real file fall back to index.html when the client accepts text/html
// (client-side routing / deep links); otherwise — e.g. a missing .js or image
// reference — a genuine 404 is returned so broken asset references are not
// masked by the SPA fallback.
type spaHandler struct {
	fsys      fs.FS
	fileSrv   http.Handler
	indexHTML []byte
}

// newSPAHandler builds an spaHandler over distFS, which must contain
// index.html at its root. It fails if index.html cannot be read.
func newSPAHandler(distFS fs.FS) (*spaHandler, error) {
	index, err := fs.ReadFile(distFS, "index.html")
	if err != nil {
		return nil, err
	}
	return &spaHandler{
		fsys:      distFS,
		fileSrv:   http.FileServerFS(distFS),
		indexHTML: index,
	}, nil
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	upath := strings.TrimPrefix(r.URL.Path, "/")
	if upath == "" {
		upath = "index.html"
	}

	if h.fileExists(upath) {
		setCacheHeaders(w, upath)
		h.fileSrv.ServeHTTP(w, r)
		return
	}

	// Not a real file. Only fall back to the SPA shell for navigation requests
	// — those that explicitly accept text/html. A missing asset (e.g. a
	// reference to a hashed .js that no longer exists) is requested with
	// Accept: */* (or no Accept), so it gets a genuine 404 instead of being
	// masked by a 200 index.html, surfacing the broken reference.
	if !acceptsHTML(r) {
		http.NotFound(w, r)
		return
	}

	setCacheHeaders(w, "index.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(h.indexHTML)
}

// fileExists reports whether name resolves to a regular file in the embedded
// filesystem. Directories are treated as non-files so directory requests fall
// through to the SPA fallback rather than serving a listing.
func (h *spaHandler) fileExists(name string) bool {
	info, err := fs.Stat(h.fsys, name)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

// acceptsHTML reports whether the request explicitly opts into HTML via a
// "text/html" token in its Accept header. The wildcard "*/*" deliberately does
// NOT count: browsers send "*/*" when fetching scripts, modules, and images, so
// treating it as an HTML opt-in would mask a missing asset behind a 200
// index.html instead of a real 404. Navigation requests (full page loads /
// deep links) send "text/html" and so still fall back to the SPA shell.
func acceptsHTML(r *http.Request) bool {
	return strings.Contains(r.Header.Get("Accept"), "text/html")
}

// setCacheHeaders applies the production caching policy: content-hashed assets
// under assets/ are immutable for a year; everything else (notably
// index.html) must always be revalidated so deploys take effect immediately.
func setCacheHeaders(w http.ResponseWriter, name string) {
	if strings.HasPrefix(name, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
}
