package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func spaFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":       {Data: []byte("<!doctype html>INDEX")},
		"assets/app.js":    {Data: []byte("APPJS")},
		"favicon.ico":      {Data: []byte("ICON")},
		"sub/dir/file.txt": {Data: []byte("NESTED")},
	}
}

func newTestSPA(t *testing.T) *spaHandler {
	t.Helper()
	h, err := newSPAHandler(spaFS())
	if err != nil {
		t.Fatalf("newSPAHandler: %v", err)
	}
	return h
}

func TestSPAHandlerMissingIndexErrors(t *testing.T) {
	if _, err := newSPAHandler(fstest.MapFS{}); err == nil {
		t.Fatal("newSPAHandler without index.html: want error")
	}
}

func TestSPAServesRealAsset(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "APPJS" {
		t.Fatalf("body = %q, want APPJS", rec.Body.String())
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "public, max-age=31536000, immutable" {
		t.Fatalf("asset Cache-Control = %q, want immutable long cache", cc)
	}
}

func TestSPADeepLinkServesIndex(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/demo", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("deep link status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "<!doctype html>INDEX" {
		t.Fatalf("deep link body = %q, want index", rec.Body.String())
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "no-cache" {
		t.Fatalf("index Cache-Control = %q, want no-cache", cc)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "text/html; charset=utf-8" {
		t.Fatalf("index Content-Type = %q", ct)
	}
}

func TestSPARootServesIndex(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("root status = %d, want 200", rec.Code)
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "no-cache" {
		t.Fatalf("root index Cache-Control = %q, want no-cache", cc)
	}
}

func TestSPAMissingAssetWildcardAccept404(t *testing.T) {
	// Spec scenario ("Missing asset 404s"): a missing asset requested with
	// Accept: */* (what browsers send for scripts/modules) MUST 404, not be
	// masked by the SPA shell. */* is not an HTML opt-in, so no fallback.
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/missing.js", nil)
	req.Header.Set("Accept", "*/*")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("missing asset with */* status = %d, want 404 (no SPA masking)", rec.Code)
	}
}

func TestSPAExistingAssetWildcardAcceptServed(t *testing.T) {
	// A real asset requested with Accept: */* must still be served as-is — the
	// */* rule only affects the MISS path (no fallback), never real files.
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	req.Header.Set("Accept", "*/*")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("existing asset with */* status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "APPJS" {
		t.Fatalf("existing asset body = %q, want APPJS", rec.Body.String())
	}
}

func TestSPADeepLinkWildcardAccept404(t *testing.T) {
	// Even an extension-less client route gets 404 under Accept: */* — only an
	// explicit text/html navigation request triggers the SPA fallback. (Real
	// browsers send text/html for top-level navigations; see the deep-link
	// test which covers the 200 path.)
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/demo/board", nil)
	req.Header.Set("Accept", "*/*")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("extensionless route with */* status = %d, want 404 (not an HTML opt-in)", rec.Code)
	}
}

func TestSPAMissingAssetReturns404(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/missing.js", nil)
	req.Header.Set("Accept", "application/javascript")
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("missing asset (no HTML accept) status = %d, want 404", rec.Code)
	}
}

func TestSPANoAcceptHeader404(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	// No Accept header at all -> does not accept HTML -> 404, not fallback.
	req := httptest.NewRequest(http.MethodGet, "/nope.png", nil)
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("missing file, no Accept, status = %d, want 404", rec.Code)
	}
}

func TestSPADirectoryFallsBackToIndex(t *testing.T) {
	h := newTestSPA(t)
	// "sub" is a directory; fileExists must treat it as non-file so a browser
	// navigation to /sub serves the SPA shell rather than a directory listing.
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/sub", nil)
	req.Header.Set("Accept", "text/html")
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("directory path status = %d, want 200 (index fallback)", rec.Code)
	}
	if rec.Body.String() != "<!doctype html>INDEX" {
		t.Fatalf("directory path body = %q, want index", rec.Body.String())
	}
}

func TestSPANestedRealFileServed(t *testing.T) {
	h := newTestSPA(t)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/sub/dir/file.txt", nil)
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("nested file status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "NESTED" {
		t.Fatalf("nested file body = %q", rec.Body.String())
	}
	// Non-asset real file (not under assets/) gets the no-cache policy.
	if cc := rec.Header().Get("Cache-Control"); cc != "no-cache" {
		t.Fatalf("nested file Cache-Control = %q, want no-cache", cc)
	}
}
