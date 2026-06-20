package server

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

// testDistFS is a minimal in-memory SPA filesystem used by prod-mode tests.
func testDistFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":    {Data: []byte("<!doctype html><div id=root></div>")},
		"assets/app.js": {Data: []byte("console.log('app')")},
		"favicon.ico":   {Data: []byte("icon")},
	}
}

func TestNewProdServesHealthz(t *testing.T) {
	h, err := New(Config{DistFS: testDistFS()})
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Body.String(); got != "ok" {
		t.Fatalf("body = %q, want %q", got, "ok")
	}
	if ct := rec.Header().Get("Content-Type"); ct != "text/plain; charset=utf-8" {
		t.Fatalf("content-type = %q", ct)
	}
}

func TestHealthzServedInDevToo(t *testing.T) {
	h, err := New(Config{Dev: true, ViteTarget: "http://127.0.0.1:5173"})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("dev /healthz status = %d, want 200", rec.Code)
	}
}

func TestNewReservedAPINamespace404(t *testing.T) {
	h, err := New(Config{DistFS: testDistFS()})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/anything", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("/api/* status = %d, want 404 (must not fall through to SPA)", rec.Code)
	}
}

func TestNewProdServesEmbeddedIndex(t *testing.T) {
	h, err := New(Config{DistFS: testDistFS()})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET / status = %d, want 200", rec.Code)
	}
	body, _ := io.ReadAll(rec.Body)
	if string(body) == "" {
		t.Fatal("GET / returned empty body")
	}
}

func TestNewProdMissingIndexErrors(t *testing.T) {
	// An empty FS has no index.html, so the SPA handler must fail to build and
	// New must surface the error rather than returning a broken handler.
	_, err := New(Config{DistFS: fstest.MapFS{}})
	if err == nil {
		t.Fatal("New with empty DistFS: want error, got nil")
	}
}

func TestNewDevInvalidViteTargetErrors(t *testing.T) {
	_, err := New(Config{Dev: true, ViteTarget: "://bad-url"})
	if err == nil {
		t.Fatal("New with invalid ViteTarget: want error, got nil")
	}
}
