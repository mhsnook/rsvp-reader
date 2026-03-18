export interface ORPParts {
	before: string
	orp: string
	after: string
}

export function getORP(word: string): ORPParts {
	if (!word) return { before: '', orp: '', after: '' }
	const len = word.length
	let pos: number
	if (len <= 1) pos = 0
	else if (len <= 5) pos = 1
	else if (len <= 9) pos = 2
	else if (len <= 13) pos = 3
	else pos = Math.floor(len * 0.28)
	return {
		before: word.slice(0, pos),
		orp: word[pos],
		after: word.slice(pos + 1),
	}
}

/** A word is a "long number" if it contains 4+ digit characters total */
export function hasLongNumber(word: string): boolean {
	const digitCount = (word.match(/\d/g) || []).length
	return digitCount >= 4
}

/**
 * Convert straight/ASCII quotes to smart (curly) quotes using
 * word-position heuristics:
 *   - " at the start of a word → \u201c (left double)
 *   - " at the end of a word   → \u201d (right double)
 *   - ' at the start of a word before a letter → \u2018 (left single)
 *   - ' elsewhere (contractions, closers) → \u2019 (right single)
 *
 * This runs before tokenization so the quote-depth tracker only has to
 * deal with unambiguous smart-quote characters.
 */
export function smartifyQuotes(text: string): string {
	// Double quotes: " at word boundary
	// Opening: after whitespace, start of string, or opening paren/bracket
	text = text.replace(/(^|[\s(\[{])"(?=\S)/gm, '$1\u201c')
	// Closing: before whitespace, end of string, or punctuation
	text = text.replace(/"(?=[\s,.;:!?\-)\]}\n]|$)/gm, '\u201d')
	// Any remaining straight double quotes — guess by toggle parity
	// within each paragraph
	text = text.replace(/(^|[\n])([^\n]*)/g, (_match, prefix, line) => {
		let open = false
		const result = line.replace(/"/g, () => {
			open = !open
			return open ? '\u201c' : '\u201d'
		})
		return prefix + result
	})

	// Single quotes: trickier due to apostrophes
	// Opening: after whitespace/start before a letter (not mid-word)
	text = text.replace(/(^|[\s(\[{])'(?=[a-zA-Z])/gm, '$1\u2018')
	// Closing: after a letter before whitespace/punctuation/end
	// But NOT contractions like don't, it's, etc.
	// A closing single quote is typically: letter + ' + (space or punctuation)
	text = text.replace(/(?<=[a-zA-Z])'(?=[\s,.;:!?\-)\]}\n]|$)/gm, '\u2019')
	// Any remaining straight single quotes become right single (apostrophe)
	// since that's by far the most common case (contractions)
	text = text.replace(/'/g, '\u2019')

	return text
}

/**
 * Tokenize text into words with per-word delay multipliers.
 *
 * Delays: comma → 1.3x, period/semicolon/!/? → 1.8x, ellipsis → 2.5x,
 * paragraph → 4x, long numbers (4+ digits) → 2x.
 * Em-dashes are joined to the preceding word.
 * Slashes split into two words with the slash visible on both sides.
 * No paragraph pause if it ends with ':' or next starts with '>'.
 *
 * Straight quotes are converted to smart quotes before parsing.
 * Quote depth resets at paragraph boundaries to avoid false positives
 * from unbalanced quotes in extracted text.
 */
export function tokenize(text: string): {
	words: string[]
	delays: number[]
	quoteDepth: number[]
} {
	// Pre-process: convert straight quotes to smart quotes
	text = smartifyQuotes(text)

	const paragraphs = text.split(/\n\s*\n/)
	const words: string[] = []
	const delays: number[] = []
	const quoteDepth: number[] = []
	let depth = 0

	for (let p = 0; p < paragraphs.length; p++) {
		const rawWords = paragraphs[p].split(/\s+/).filter((w) => w.length > 0)
		if (rawWords.length === 0) continue

		// Reset quote depth at paragraph boundaries — real quotes almost
		// always close within the same paragraph. Unbalanced quotes from
		// OCR or text extraction would otherwise taint everything that follows.
		depth = 0

		// Dashes (em-dash, en-dash, double-hyphen) attach to the previous word
		// as a suffix but never grab the next word.
		// Standalone dots (from spaced ellipsis like ". . .") also attach.
		const paraWords: string[] = []
		const isDash = (s: string) => s === '—' || s === '–' || s === '--'
		const startsDash = (s: string) =>
			s.startsWith('—') || s.startsWith('–') || s.startsWith('--')
		const isDot = (s: string) => s === '.' || s === '..'
		for (let i = 0; i < rawWords.length; i++) {
			const w = rawWords[i]
			if (isDash(w) && paraWords.length > 0) {
				paraWords[paraWords.length - 1] += w
			} else if (startsDash(w) && paraWords.length > 0) {
				paraWords[paraWords.length - 1] += w
			} else if (isDot(w) && paraWords.length > 0) {
				paraWords[paraWords.length - 1] += w
			} else {
				paraWords.push(w)
			}
		}

		// Split on slashes: "amazing/excellent" -> "amazing/" + "/excellent"
		const slashSplit: string[] = []
		for (const w of paraWords) {
			// Only split if slash is between word chars (not URLs like http://)
			const parts = w.split(/(?<=\w)\/(?=\w)/)
			if (parts.length > 1) {
				for (let j = 0; j < parts.length; j++) {
					const prefix = j > 0 ? '/' : ''
					const suffix = j < parts.length - 1 ? '/' : ''
					slashSplit.push(prefix + parts[j] + suffix)
				}
			} else {
				slashSplit.push(w)
			}
		}

		for (const w of slashSplit) {
			// Opening smart quotes: \u201c ("), \u2018 ('), \u00ab («)
			const opens = (w.match(/^[\u201c\u2018\u00ab]+/) || [''])[0].length
			// Closing smart quotes: \u201d ("), \u2019 ('), \u00bb (»)
			const closes = (w.match(/[\u201d\u2019\u00bb]+$/) || [''])[0].length

			depth += opens
			words.push(w)
			quoteDepth.push(depth)
			depth = Math.max(0, depth - closes)

			let d = 1
			const stripped = w.replace(/[)}\]\u201d\u2019\u00bb]+$/, '')
			if (/\.{2,}$/.test(stripped) || /\u2026$/.test(stripped)) d = 2.5
			else if (/[.!?]$/.test(stripped)) d = 1.8
			else if (/[,;]$/.test(stripped)) d = 1.3
			if (hasLongNumber(w)) d = Math.max(d, 2)

			delays.push(d)

			// Reset quote depth at sentence boundaries too — unbalanced quotes
			// from OCR/extraction within a paragraph would otherwise taint all
			// subsequent sentences. Multi-sentence quotes are rare in practice.
			if (d >= 1.8) depth = 0
		}

		if (p < paragraphs.length - 1 && words.length > 0) {
			const lastWord = slashSplit[slashSplit.length - 1]
			const nextPara = paragraphs[p + 1]?.trim() || ''
			const endsWithColon = lastWord.endsWith(':')
			const nextIsBlockquote = nextPara.startsWith('>')

			if (!endsWithColon && !nextIsBlockquote) {
				delays[delays.length - 1] = Math.max(delays[delays.length - 1], 4)
			}
		}
	}

	return { words, delays, quoteDepth }
}
