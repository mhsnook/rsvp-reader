#!/usr/bin/env bash
# Collect normalised static-check output into $1.
#
# Runs once on the head tree and once on the base tree, always from that tree's
# own root. Output is one sorted line per issue, so the diff engine can treat
# the two runs as comparable sets.
#
# This repo has no formatter, so there is no formatter pass here and no
# `format.txt`. Adding one is a separate decision: it would rewrite every file
# in the repository in a single commit.

# Deliberately no `-e`: every check here exits non-zero when it finds issues,
# which is the normal case, not a script failure.
set -uo pipefail

OUT="${1:?usage: collect-static.sh <output-dir>}"
mkdir -p "$OUT"

# Byte-order sorting, so the two trees produce comparable lists even if the two
# runners ever differ in locale.
export LC_ALL=C

# Paths kept out of the lint delta. `dist/` is build output — eslint.config.js
# ignores it too, and the list is repeated here so that a PR editing that ignore
# rule cannot move its own baseline. `.github/ci/` is this machinery, which is
# not linted by the repo's config.
EXCLUDE='^(dist/|\.github/ci/)'

# Read-only checks run concurrently. The typechecker is the long pole and the
# linter finishes underneath it, so this is close to free.
(
	# This is `pnpm typecheck`, spelled out. The commands are invoked directly
	# rather than through the package scripts because this script also runs on
	# the base tree, which may not have the script yet — the base job checks out
	# `.github/ci/` from head, but not package.json.
	#
	# `tsc -b --noEmit`: the repo builds through project references
	# (tsconfig.app.json plus tsconfig.node.json), so a plain `tsc --noEmit`
	# would have to name one project and would miss the other. Both projects
	# already set `noEmit`, and TypeScript 5.9 accepts the flag alongside `-b`,
	# so this is the build's own typecheck with nothing written.
	#
	# Keep the grep: it drops the summary lines, which change with the error
	# count and would diff as noise.
	pnpm exec tsc -b --noEmit 2>&1 | grep ': error TS' | sort >"$OUT/typecheck.txt"
	status=${PIPESTATUS[0]}

	# A typechecker that failed but printed nothing the grep recognises would
	# leave an empty file, which reads as zero errors and merges clean. Record
	# the failure as an issue instead.
	if [ "$status" -ne 0 ] && [ ! -s "$OUT/typecheck.txt" ]; then
		echo "typecheck:0:0: error TS0000: the typechecker exited $status without recognisable error lines — see the job log" \
			>"$OUT/typecheck.txt"
	fi
) &
(
	# ESLint through the local unix formatter, which prints
	# `file:line:col: message [rule]` with repo-root-relative paths. ESLint's
	# own absolute paths would carry the runner's workspace directory into the
	# comparison.
	pnpm exec eslint . -f .github/ci/eslint-unix.cjs >"$OUT/.eslint.raw" 2>&1
	status=$?
	grep -E '^[^:[:space:]][^:]*:[0-9]+:[0-9]+:' "$OUT/.eslint.raw" |
		grep -Ev "$EXCLUDE" |
		sort -u >"$OUT/lint.txt"

	# ESLint exits 1 when it found issues, which is the normal case, and 2 when
	# it could not run at all — a bad config, a missing plugin, a formatter path
	# that does not resolve. Exit 2 with no parseable lines would otherwise read
	# as a clean tree.
	if [ "$status" -gt 1 ] && [ ! -s "$OUT/lint.txt" ]; then
		echo "lint:0:0: eslint exited $status without producing issue lines — see the job log [error/internal]" \
			>"$OUT/lint.txt"
	fi
) &
wait

# Never let a missing file break the render step.
for f in typecheck lint; do
	[ -f "$OUT/$f.txt" ] || : >"$OUT/$f.txt"
done

wc -l "$OUT"/typecheck.txt "$OUT"/lint.txt
