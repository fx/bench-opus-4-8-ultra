package server

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestNewViteProxyInvalidTarget(t *testing.T) {
	if _, err := newViteProxy("://nope"); err == nil {
		t.Fatal("newViteProxy with invalid URL: want error")
	}
}

func TestViteProxyForwardsRequest(t *testing.T) {
	// Fake Vite upstream that echoes the path and the rewritten Host header so
	// we can assert the proxy reached it and rewrote Host to the upstream.
	var gotHost, gotPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotHost = r.Host
		gotPath = r.URL.Path
		w.Header().Set("X-From-Vite", "1")
		_, _ = io.WriteString(w, "vite-says-hi")
	}))
	defer upstream.Close()

	proxy, err := newViteProxy(upstream.URL)
	if err != nil {
		t.Fatalf("newViteProxy: %v", err)
	}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/@vite/client", nil)
	req.Host = "go-server:8080"
	proxy.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("proxied status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "vite-says-hi" {
		t.Fatalf("proxied body = %q", rec.Body.String())
	}
	if rec.Header().Get("X-From-Vite") != "1" {
		t.Fatal("upstream response headers not forwarded")
	}
	if gotPath != "/@vite/client" {
		t.Fatalf("upstream saw path %q, want /@vite/client", gotPath)
	}
	// Director must rewrite Host to the exact upstream origin, not pass the Go
	// host through.
	upstreamURL, err := url.Parse(upstream.URL)
	if err != nil {
		t.Fatalf("parse upstream URL: %v", err)
	}
	if gotHost != upstreamURL.Host {
		t.Fatalf("upstream Host = %q, want %q (rewritten to the Vite origin)", gotHost, upstreamURL.Host)
	}
}

func TestDevServerProxiesThroughCatchAll(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = io.WriteString(w, "INDEX-FROM-VITE")
	}))
	defer upstream.Close()

	h, err := New(Config{Dev: true, ViteTarget: upstream.URL})
	if err != nil {
		t.Fatalf("New dev: %v", err)
	}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("dev / status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "INDEX-FROM-VITE" {
		t.Fatalf("dev / body = %q, want proxied content", rec.Body.String())
	}
}
