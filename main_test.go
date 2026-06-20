package main

import (
	"errors"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

// envMap builds a getenv function backed by a map.
func envMap(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func okDistFS() (fs.FS, error) {
	return fstest.MapFS{"index.html": {Data: []byte("INDEX")}}, nil
}

func TestDistSubReadsEmbeddedIndex(t *testing.T) {
	// Exercises the real embedded FS + fs.Sub wiring against the committed
	// placeholder web/dist/index.html.
	dist, err := distSub()
	if err != nil {
		t.Fatalf("distSub: %v", err)
	}
	if _, err := fs.Stat(dist, "index.html"); err != nil {
		t.Fatalf("embedded dist missing index.html: %v", err)
	}
}

func TestViteTargetDefault(t *testing.T) {
	got := viteTarget(envMap(nil))
	if got != "http://127.0.0.1:5173" {
		t.Fatalf("default viteTarget = %q", got)
	}
}

func TestViteTargetOverride(t *testing.T) {
	got := viteTarget(envMap(map[string]string{"VITE_TARGET": "http://example:9999"}))
	if got != "http://example:9999" {
		t.Fatalf("override viteTarget = %q", got)
	}
}

func TestBuildServerProdDefaultPort(t *testing.T) {
	h, addr, err := buildServer(envMap(nil), okDistFS)
	if err != nil {
		t.Fatalf("buildServer: %v", err)
	}
	if addr != "0.0.0.0:8080" {
		t.Fatalf("addr = %q, want 0.0.0.0:8080", addr)
	}
	// Handler must serve healthz.
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("healthz status = %d", rec.Code)
	}
}

func TestBuildServerPortOverride(t *testing.T) {
	_, addr, err := buildServer(envMap(map[string]string{"PORT": "9090"}), okDistFS)
	if err != nil {
		t.Fatalf("buildServer: %v", err)
	}
	if addr != "0.0.0.0:9090" {
		t.Fatalf("addr = %q, want 0.0.0.0:9090", addr)
	}
}

func TestBuildServerDevSkipsDist(t *testing.T) {
	// In dev mode distFS must NOT be consulted; pass a fataling distFS to prove
	// it isn't called.
	called := false
	failDist := func() (fs.FS, error) {
		called = true
		return nil, errors.New("should not be called in dev")
	}
	h, addr, err := buildServer(envMap(map[string]string{"APP_ENV": "dev"}), failDist)
	if err != nil {
		t.Fatalf("buildServer dev: %v", err)
	}
	if called {
		t.Fatal("distFS was consulted in dev mode")
	}
	if addr != "0.0.0.0:8080" {
		t.Fatalf("dev addr = %q", addr)
	}
	if h == nil {
		t.Fatal("dev handler is nil")
	}
}

func TestBuildServerDistError(t *testing.T) {
	failDist := func() (fs.FS, error) { return nil, errors.New("boom") }
	_, _, err := buildServer(envMap(nil), failDist)
	if err == nil {
		t.Fatal("buildServer with failing distFS: want error")
	}
}

func TestBuildServerNewError(t *testing.T) {
	// Empty dist FS -> server.New fails to read index.html -> error propagates.
	emptyDist := func() (fs.FS, error) { return fstest.MapFS{}, nil }
	_, _, err := buildServer(envMap(nil), emptyDist)
	if err == nil {
		t.Fatal("buildServer with empty dist: want error from server.New")
	}
}

func TestRunInvokesListen(t *testing.T) {
	var gotAddr string
	var gotHandler http.Handler
	listen := func(addr string, h http.Handler) error {
		gotAddr = addr
		gotHandler = h
		return nil
	}
	err := run(envMap(map[string]string{"PORT": "1234"}), okDistFS, listen)
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if gotAddr != "0.0.0.0:1234" {
		t.Fatalf("listen addr = %q", gotAddr)
	}
	if gotHandler == nil {
		t.Fatal("listen received nil handler")
	}
}

func TestRunPropagatesBuildError(t *testing.T) {
	failDist := func() (fs.FS, error) { return nil, errors.New("boom") }
	listenCalled := false
	listen := func(string, http.Handler) error {
		listenCalled = true
		return nil
	}
	err := run(envMap(nil), failDist, listen)
	if err == nil {
		t.Fatal("run with failing distFS: want error")
	}
	if listenCalled {
		t.Fatal("listen called despite build error")
	}
}

func TestRunPropagatesListenError(t *testing.T) {
	wantErr := errors.New("listen failed")
	listen := func(string, http.Handler) error { return wantErr }
	err := run(envMap(nil), okDistFS, listen)
	if !errors.Is(err, wantErr) {
		t.Fatalf("run err = %v, want %v", err, wantErr)
	}
}
