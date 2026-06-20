#!/usr/bin/env bash
#
# Go coverage gate: enforces 100% statement coverage for all first-party Go
# code, with a single, explicitly-justified exclusion.
#
# `go test -coverprofile` reports per-function coverage. This is a purely
# per-function gate: every function reported by `go tool cover -func` MUST be at
# 100.0% EXCEPT functions on the justified exclusion list below. The script
# fails (exit 1) if ANY non-excluded function is below 100%. It does NOT compute
# an aggregate/total percentage — the trailing `total:` line is ignored — so a
# below-100% overall figure caused solely by an excluded function does not fail
# the gate, while any gap in covered code does.
#
# Justified exclusions:
#   - main.go ... main : the process bootstrap. It only wires os.Getenv, the
#     real embedded FS, and http.ListenAndServe together and calls log.Fatal on
#     error — none of which can be exercised without starting the real process.
#     All of its logic is extracted into run/buildServer/viteTarget/distSub,
#     which ARE covered at 100%. Excluding only main() is the minimal carve-out.
#
set -euo pipefail

PROFILE="${1:-coverage.out}"

if [[ ! -f "$PROFILE" ]]; then
  echo "coverage gate: profile '$PROFILE' not found" >&2
  exit 1
fi

# Functions allowed to be below 100%. Match is a substring on the
# "file:line:\tFuncName\t" lines emitted by `go tool cover -func`. Keep this
# list minimal and justified (see header).
EXCLUDE_REGEX='/main\.go:[0-9]+:[[:space:]]+main[[:space:]]'

func_output="$(go tool cover -func="$PROFILE")"

fail=0
while IFS= read -r line; do
  # Ignore the trailing "total:" summary line; this gate checks each function
  # individually and never evaluates an aggregate total.
  [[ "$line" == total:* ]] && continue

  # Lines look like: path/file.go:NN:\tFuncName\tPCT%
  pct="${line##*$'\t'}"   # last tab-separated field, e.g. "100.0%"
  pct="${pct%\%}"          # strip trailing %

  if [[ "$line" =~ $EXCLUDE_REGEX ]]; then
    echo "coverage gate: excluding (justified) -> $line"
    continue
  fi

  if [[ "$pct" != "100.0" ]]; then
    echo "coverage gate: BELOW 100% -> $line" >&2
    fail=1
  fi
done <<< "$func_output"

if [[ "$fail" -ne 0 ]]; then
  echo "coverage gate: FAILED — first-party Go code is not 100% covered" >&2
  exit 1
fi

echo "coverage gate: PASS — all non-excluded Go functions at 100.0%"
