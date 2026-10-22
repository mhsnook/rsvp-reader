'use strict'

// ESLint formatter: one line per issue, `file:line:col: message [rule]`.
//
// ESLint 9 dropped the built-in `unix` formatter, and the replacement is a
// separate npm package. This repo has no other need for it, so the format is
// reproduced here instead of adding a dependency and moving the lockfile.
//
// Two differences from the old built-in, both deliberate:
//
//   - Paths are repo-root-relative. ESLint reports absolute paths, which carry
//     the runner's workspace directory into the diff.
//   - Warnings and errors are both emitted, tagged, so the delta sees every
//     issue the linter found.

const path = require('path')

module.exports = function unix(results) {
	const lines = []
	for (const result of results) {
		const file = path.relative(process.cwd(), result.filePath)
		for (const m of result.messages) {
			const severity = m.severity === 1 ? 'warning' : 'error'
			const rule = m.ruleId ? ` [${severity}/${m.ruleId}]` : ` [${severity}]`
			lines.push(`${file}:${m.line ?? 0}:${m.column ?? 0}: ${m.message}${rule}`)
		}
	}
	return lines.length ? lines.join('\n') + '\n' : ''
}
