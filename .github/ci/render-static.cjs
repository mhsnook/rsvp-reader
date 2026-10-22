'use strict'

// Turn two directories of collected static-check output into markdown
// fragments plus a gate sidecar. Section order comes from the numeric filename
// prefix, so fragments render consistently whatever order the jobs finish in.

const fs = require('fs')
const path = require('path')
const { parsers, differential, readLines, countSummary, listBlock } = require('./delta.cjs')

// How many issues to print before collapsing to "… and N more".
const CAP = 50

module.exports = function render({ head, base, out }) {
	fs.mkdirSync(out, { recursive: true })
	const write = (name, markdown, gate) => {
		fs.writeFileSync(path.join(out, `${name}.md`), markdown)
		fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(gate, null, 2))
	}

	// A whole tree's output directory is absent when that job died before the
	// static checks ran. Diffing nothing against nothing renders "no change",
	// which is the most dangerous thing this report can say, so name the tree
	// that is missing and let the gate fail both checks.
	const missingTree = !fs.existsSync(head) ? 'The PR' : !fs.existsSync(base) ? 'The base branch' : null
	if (missingTree) {
		for (const [name, check, title] of [
			['10-typecheck', 'typecheck', 'Type errors'],
			['20-lint', 'lint', 'Lint'],
		]) {
			write(
				name,
				`#### ${title}\n\n⚠️ ${missingTree} job produced no measurement, so there is nothing to compare. Check the job log.`,
				{ check, missing: true }
			)
		}
		return
	}

	// ── Type errors ──────────────────────────────────────────────────────
	const tc = differential(
		readLines(`${base}/typecheck.txt`),
		readLines(`${head}/typecheck.txt`),
		parsers.tsc
	)
	write(
		'10-typecheck',
		[
			'#### Type errors',
			'',
			countSummary(tc, 'error(s)'),
			listBlock('New', tc.added, CAP),
			listBlock('Resolved', tc.resolved, CAP),
		]
			.filter((l) => l !== null)
			.join('\n'),
		{ check: 'typecheck', new: tc.added.length, resolved: tc.resolved.length, total: tc.head }
	)

	// ── Lint ─────────────────────────────────────────────────────────────
	const lint = differential(
		readLines(`${base}/lint.txt`),
		readLines(`${head}/lint.txt`),
		parsers.unix
	)
	write(
		'20-lint',
		[
			'#### Lint',
			'',
			countSummary(lint, 'issue(s)'),
			listBlock('New', lint.added, CAP),
			listBlock('Resolved', lint.resolved, CAP),
			'',
			'_Lint is report-only while the repo still carries issues. It becomes a gate once the total reaches 0._',
		]
			.filter((l) => l !== null)
			.join('\n'),
		{ check: 'lint', new: lint.added.length, resolved: lint.resolved.length, total: lint.head }
	)
}
