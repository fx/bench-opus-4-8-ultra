// Package server wires the single Go HTTP server that serves the Slop
// Simulator SPA. It selects between development (reverse proxy to the Vite dev
// server) and production (embedded static assets with SPA fallback) at runtime
// based on configuration, registers the server-owned routes (/healthz and the
// reserved /api/* namespace), and falls through to the SPA handler for
// everything else.
package server

import (
	"io/fs"
	"net/http"
)

// Config configures a server instance.
type Config struct {
	// Dev selects development mode. When true, non-API requests are reverse
	// proxied to the Vite dev server at ViteTarget; otherwise the embedded SPA
	// is served. It is derived from APP_ENV=dev by the caller.
	Dev bool

	// ViteTarget is the base URL of the Vite dev server (e.g.
	// "http://127.0.0.1:5173"). Only used when Dev is true.
	ViteTarget string

	// DistFS is the filesystem rooted at the built SPA's dist directory (i.e.
	// it contains index.html and assets/). It is injected by the caller from
	// the web package's embed.FS. Only used when Dev is false.
	DistFS fs.FS
}

// New builds the HTTP handler for the server described by cfg. API routes and
// /healthz are registered first; a catch-all then serves the SPA — via the
// dev reverse proxy when cfg.Dev, or the embedded-asset handler otherwise.
func New(cfg Config) (http.Handler, error) {
	mux := http.NewServeMux()

	// Liveness probe: server-owned, served by Go in both modes.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// Reserved future API namespace. No endpoints are defined yet, so any
	// request under /api/ gets a clear 404 rather than falling through to the
	// SPA fallback (which would mask missing endpoints behind index.html).
	mux.HandleFunc("/api/", func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "not found", http.StatusNotFound)
	})

	// Catch-all: the SPA. Dev proxies to Vite; prod serves embedded assets.
	var spa http.Handler
	if cfg.Dev {
		proxy, err := newViteProxy(cfg.ViteTarget)
		if err != nil {
			return nil, err
		}
		spa = proxy
	} else {
		handler, err := newSPAHandler(cfg.DistFS)
		if err != nil {
			return nil, err
		}
		spa = handler
	}
	mux.Handle("/", spa)

	return mux, nil
}
