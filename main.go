// Command slop-simulator runs the single Go HTTP server that serves the Slop
// Simulator SPA: a Vite reverse proxy in development (APP_ENV=dev) and embedded
// static assets in production. It listens on PORT (default 8080), binding
// 0.0.0.0 so it is reachable across the network.
package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/fx/slop-simulator/internal/server"
	"github.com/fx/slop-simulator/web"
)

func main() { // main: untestable process bootstrap; logic lives in buildServer/run.
	log.SetFlags(0)
	if err := run(os.Getenv, distSub, http.ListenAndServe); err != nil {
		log.Fatal(err)
	}
}

// listenFunc abstracts http.ListenAndServe so run is testable.
type listenFunc func(addr string, handler http.Handler) error

// distSub returns the embedded SPA filesystem rooted at the dist directory.
func distSub() (fs.FS, error) {
	return fs.Sub(web.Dist, "dist")
}

// run resolves configuration from the environment, builds the server handler,
// and starts listening. getenv and listen are injected so the wiring can be
// unit-tested without touching the real process environment or network.
func run(getenv func(string) string, distFS func() (fs.FS, error), listen listenFunc) error {
	handler, addr, err := buildServer(getenv, distFS)
	if err != nil {
		return err
	}
	log.Printf("slop-simulator listening on %s (APP_ENV=%q)", addr, getenv("APP_ENV"))
	return listen(addr, handler)
}

// buildServer translates environment configuration into a ready HTTP handler
// and a listen address, without starting the server.
func buildServer(getenv func(string) string, distFS func() (fs.FS, error)) (http.Handler, string, error) {
	port := getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := "0.0.0.0:" + port

	cfg := server.Config{
		Dev:        getenv("APP_ENV") == "dev",
		ViteTarget: viteTarget(getenv),
	}
	if !cfg.Dev {
		dist, err := distFS()
		if err != nil {
			return nil, "", err
		}
		cfg.DistFS = dist
	}

	handler, err := server.New(cfg)
	if err != nil {
		return nil, "", err
	}
	return handler, addr, nil
}

// viteTarget resolves the Vite dev server URL, honoring a VITE_TARGET override
// and otherwise defaulting to the conventional local Vite port.
func viteTarget(getenv func(string) string) string {
	if t := getenv("VITE_TARGET"); t != "" {
		return t
	}
	return "http://127.0.0.1:5173"
}
