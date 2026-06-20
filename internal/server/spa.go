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

	// Not a real file. Only fall back to the SPA shell for client-side
	// navigation — never for a missing asset, so broken asset references
	// surface as real 404s instead of being masked by a 200 index.html.
	//
	// A request is navigation when it both accepts HTML and targets an
	// asset-less path (no file extension). The path check is essential because
	// browsers request missing scripts/modules with `Accept: */*` (which
	// accepts HTML); without it, `/assets/missing.js` would wrongly serve the
	// SPA shell. Deep links like `/demo` have no extension and still fall back.
	if !acceptsHTML(r) || isAssetPath(upath) {
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

// acceptsHTML reports whether the request's Accept header opts into HTML,
// covering "text/html" and the wildcard "*/*" that browsers send.
func acceptsHTML(r *http.Request) bool {
	accept := r.Header.Get("Accept")
	return strings.Contains(accept, "text/html") || strings.Contains(accept, "*/*")
}

// isAssetPath reports whether upath looks like a static asset rather than a
// client-side route, i.e. its final segment has a file extension (e.g.
// "assets/app.js", "favicon.ico"). Such paths must never serve the SPA shell
// on a miss — they get a real 404 — whereas extension-less paths like "demo"
// are treated as navigation and fall back to index.html.
func isAssetPath(upath string) bool {
	base := upath
	if i := strings.LastIndexByte(base, '/'); i >= 0 {
		base = base[i+1:]
	}
	return strings.Contains(base, ".")
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
