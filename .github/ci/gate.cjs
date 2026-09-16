'use strict'

// The one place the pass/fail policy lives.
//
// Reporting and gating are deliberately separate: the comment always posts, so
// a contributor can see the full picture even on a red build. This step then
// decides, from the same numbers, whether the build should fail.

const fs = require('fs')
const path = require('path')

// Strictness per check.
//   'report-only'      never fails — the comment is the whole point
//   'no-new'           fails when this PR adds any issue of this kind
//   { maxNew: N }      allows up to N new issues
//   { maxTotal: N }    fails on the absolute count, ignoring the delta
//   { maxGzDelta: B }  bundle only — fails when gzipped size grows by over B,
//                      written as bytes, '20KiB', or '5%' of the base size
//
// Lint is report-only because the repository already has 6 issues. Adopting
// 'no-new' now would be honest but premature: the number is small enough to
// clear in one pass, and the point of the first weeks is to make it visible.
// Tighten to 'no-new' once the total reaches 0.
//
// The bundle is report-only. This is a single-page reader with one eager chunk,
// and nobody has yet decided what a regression looks like here. A budget
// invented today would be a number nobody agreed to.
//
// There is no `format` entry: the repository has no formatter.
const POLICY = {
	build: 'no-new',
	typecheck: 'no-new',
	lint: 'report-only',
	tests: 'no-new',
	bundle: 'report-only',
}

// Checks whose sidecar must exist. `verdict` catches a check that reported
// "I could not measure this"; this list catches one that reported nothing at
// all, because the job died before writing a fragment. Without it, a crashed
// head job passes the gate.
const REQUIRED = ['typecheck', 'lint', 'tests']

/**
 * Read a budget written as bytes, `20KiB`, or `5%` of the base size.
 *
 * Percentages are convenient on a large bundle and misleading on a small one,
 * where 5% is a few hundred bytes of ordinary build noise. Prefer bytes unless
 * the bundle is big.
 */
function budget(limit, baseBytes) {
	if (typeof limit === 'number') return limit
	if (typeof limit !== 'string') return Infinity
	const pct = limit.match(/^([\d.]+)\s*%$/)
	if (pct) return (Number(pct[1]) / 100) * (baseBytes ?? 0)
	const size = limit.match(/^([\d.]+)\s*(B|KB|KiB|MB|MiB)?$/i)
	if (!size) return Infinity
	const unit = (size[2] ?? 'B').toLowerCase()
	const scale = { b: 1, kb: 1000, kib: 1024, mb: 1e6, mib: 1024 * 1024 }[unit] ?? 1
	return Number(size[1]) * scale
}

function verdict(check, data) {
	const rule = POLICY[check] ?? 'report-only'
	if (rule === 'report-only') return null

	// A step that produced no measurement did not pass — it crashed. Treat the
	// absence as a failure for every gated check, or a broken build reads as
	// "no change" and merges clean.
	if (data.missing) return 'the step produced no measurement (crashed or was skipped)'

	// Whose fault the failure is belongs in the comment, not here: a broken base
	// branch still means this PR cannot be verified, so it still blocks.
	if (check === 'build') {
		if (data.headOk) return null
		return data.baseOk ?
				'this PR breaks the build'
			:	'neither this PR nor the base branch builds — repair the base branch first'
	}

	if (check === 'tests') {
		return data.failed > 0 ? `${data.failed} failing test(s)` : null
	}

	if (check === 'bundle') {
		const limit = budget(rule.maxGzDelta ?? Infinity, data.eagerGzBase)
		const grew = data.eagerGzDelta ?? 0
		return grew > limit ?
				`eager bundle grew ${(grew / 1024).toFixed(2)} kB gzipped, over the ${(limit / 1024).toFixed(0)} kB budget`
			:	null
	}

	if (rule === 'no-new') {
		return data.new > 0 ? `${data.new} new issue(s)` : null
	}
	if (typeof rule.maxNew === 'number') {
		return data.new > rule.maxNew ?
				`${data.new} new issue(s), over the limit of ${rule.maxNew}`
			:	null
	}
	if (typeof rule.maxTotal === 'number') {
		return data.total > rule.maxTotal ?
				`${data.total} total issue(s), over the limit of ${rule.maxTotal}`
			:	null
	}
	return null
}

function main(dir) {
	if (!fs.existsSync(dir)) {
		console.error(`No fragments at ${dir} — every check job failed before reporting.`)
		process.exit(1)
	}

	const sidecars = fs
		.readdirSync(dir, { recursive: true })
		.filter((f) => typeof f === 'string' && f.endsWith('.json'))
		.sort()

	const failures = []
	const seen = new Set()
	for (const f of sidecars) {
		const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
		seen.add(data.check)
		const reason = verdict(data.check, data)
		if (reason) failures.push(`${data.check}: ${reason}`)
		else if ((POLICY[data.check] ?? 'report-only') === 'report-only')
			console.log(`➖ ${data.check} (report only, not gated)`)
		else console.log(`✅ ${data.check}`)
	}

	for (const check of REQUIRED) {
		if (!seen.has(check)) failures.push(`${check}: no report was produced at all`)
	}

	if (!failures.length) {
		console.log('\nAll gated checks passed.')
		return
	}
	console.error('\nBlocking:')
	for (const f of failures) console.error(`  ❌ ${f}`)
	console.error('\nSee the "### PR checks" comment on the pull request for detail.')
	process.exit(1)
}

if (require.main === module) main(process.argv[2] ?? '/tmp/fragments')

module.exports = { POLICY, REQUIRED, budget, verdict }
