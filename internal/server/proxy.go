package server

import (
	"net/http"
	"net/http/httputil"
	"net/url"
)

// newViteProxy builds a reverse proxy to the Vite dev server at target. It
// proxies every non-API request — static SPA routes, Vite client assets
// (/@vite/client, /@react-refresh, /src/*), and the HMR websocket upgrade.
// httputil.ReverseProxy proxies WebSocket connections natively (Go 1.12+), so
// Vite's HMR socket works through the single Go port without manual hijacking.
func newViteProxy(target string) (http.Handler, error) {
	u, err := url.Parse(target)
	if err != nil {
		return nil, err
	}
	proxy := httputil.NewSingleHostReverseProxy(u)

	// Preserve the upstream director (sets scheme/host/path) and additionally
	// rewrite the Host header to the Vite origin so its dev middleware and
	// websocket upgrade see a consistent host.
	orig := proxy.Director
	proxy.Director = func(r *http.Request) {
		orig(r)
		r.Host = u.Host
	}

	return proxy, nil
}
