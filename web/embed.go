// Package web owns the built SPA assets and exposes them as an embedded
// filesystem. The embed lives here (not under internal/server) because
// //go:embed cannot reference parent directories: only a package that owns the
// web/dist directory can embed it. internal/server consumes Dist via
// dependency injection (see server.New).
package web

import "embed"

// Dist holds the built Vite SPA (web/dist). It is populated at build time by
// `bun --cwd web run build`. A placeholder web/dist/index.html is committed so
// this package compiles on a clean checkout before the frontend is built.
//
// The all: prefix ensures files Vite may emit with a leading underscore or dot
// are still embedded.
//
//go:embed all:dist
var Dist embed.FS
