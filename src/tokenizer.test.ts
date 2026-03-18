import { describe, it, expect } from 'vitest'
import { getORP, hasLongNumber, smartifyQuotes, tokenize } from './tokenizer'

describe('getORP', () => {
	it('handles empty string', () => {
		expect(getORP('')).toEqual({ before: '', orp: '', after: '' })
	})

	it('single character word', () => {
		expect(getORP('a')).toEqual({ before: '', orp: 'a', after: '' })
	})

	it('short word (2-5 chars) has ORP at index 1', () => {
		const r = getORP('hello')
		expect(r).toEqual({ before: 'h', orp: 'e', after: 'llo' })
	})

	it('medium word (6-9 chars) has ORP at index 2', () => {
		const r = getORP('amazing')
		expect(r).toEqual({ before: 'am', orp: 'a', after: 'zing' })
	})

	it('longer word (10-13 chars) has ORP at index 3', () => {
		const r = getORP('outstanding')
		expect(r).toEqual({ before: 'out', orp: 's', after: 'tanding' })
	})
})

describe('hasLongNumber', () => {
	it('returns false for regular words', () => {
		expect(hasLongNumber('hello')).toBe(false)
	})

	it('returns false for short numbers', () => {
		expect(hasLongNumber('123')).toBe(false)
	})

	it('returns true for 4+ digit numbers', () => {
		expect(hasLongNumber('1234')).toBe(true)
		expect(hasLongNumber('1,000,000')).toBe(true)
	})

	it('returns true for time-like numbers', () => {
		expect(hasLongNumber('3:00:51.25')).toBe(true)
	})
})

describe('smartifyQuotes', () => {
	it('converts opening straight double quotes', () => {
		expect(smartifyQuotes('"hello')).toBe('\u201chello')
	})

	it('converts closing straight double quotes', () => {
		expect(smartifyQuotes('hello"')).toBe('hello\u201d')
	})

	it('converts a balanced pair of straight double quotes', () => {
		expect(smartifyQuotes('"hello world"')).toBe('\u201chello world\u201d')
	})

	it('converts multiple quoted phrases', () => {
		const result = smartifyQuotes('she said "hi" and "bye"')
		expect(result).toBe('she said \u201chi\u201d and \u201cbye\u201d')
	})

	it('converts opening straight single quotes', () => {
		expect(smartifyQuotes("'hello")).toBe('\u2018hello')
	})

	it('handles apostrophes in contractions', () => {
		const result = smartifyQuotes("don't")
		// The apostrophe should become right single quote (U+2019)
		expect(result).toBe('don\u2019t')
	})

	it('handles nested quotes: double containing single', () => {
		const result = smartifyQuotes(`"she said 'hello' to me"`)
		expect(result).toBe('\u201cshe said \u2018hello\u2019 to me\u201d')
	})

	it('leaves already-smart quotes unchanged', () => {
		const input = '\u201chello\u201d'
		expect(smartifyQuotes(input)).toBe(input)
	})
})

describe('tokenize', () => {
	describe('basic splitting', () => {
		it('splits text into words', () => {
			const { words } = tokenize('hello world')
			expect(words).toEqual(['hello', 'world'])
		})

		it('handles multiple spaces', () => {
			const { words } = tokenize('hello   world')
			expect(words).toEqual(['hello', 'world'])
		})
	})

	describe('delays', () => {
		it('assigns base delay of 1 for normal words', () => {
			const { delays } = tokenize('hello world')
			expect(delays).toEqual([1, 1])
		})

		it('assigns 1.8x delay after sentence-ending punctuation', () => {
			const { delays } = tokenize('end. start')
			expect(delays[0]).toBe(1.8)
		})

		it('assigns 1.3x delay after comma', () => {
			const { delays } = tokenize('first, second')
			expect(delays[0]).toBe(1.3)
		})

		it('assigns 1.3x delay after semicolon', () => {
			const { delays } = tokenize('first; second')
			expect(delays[0]).toBe(1.3)
		})

		it('assigns 2.5x delay after ellipsis (three dots)', () => {
			const { delays } = tokenize('wait... okay')
			expect(delays[0]).toBe(2.5)
		})

		it('assigns 2.5x delay after unicode ellipsis', () => {
			const { delays } = tokenize('wait\u2026 okay')
			expect(delays[0]).toBe(2.5)
		})

		it('assigns 2x delay for long numbers', () => {
			const { delays } = tokenize('call 1234 now')
			expect(delays[1]).toBe(2)
		})

		it('assigns paragraph delay of 4x', () => {
			const { delays } = tokenize('end.\n\nStart')
			expect(delays[0]).toBe(4)
		})

		it('no paragraph delay when ending with colon', () => {
			const { delays } = tokenize('items:\n\nfirst')
			expect(delays[0]).toBe(1)
		})
	})

	describe('dash handling', () => {
		it('attaches standalone em-dash to previous word', () => {
			const { words } = tokenize('hello \u2014 world')
			expect(words).toEqual(['hello\u2014', 'world'])
		})

		it('attaches standalone en-dash to previous word', () => {
			const { words } = tokenize('hello \u2013 world')
			expect(words).toEqual(['hello\u2013', 'world'])
		})

		it('attaches word starting with em-dash to previous word', () => {
			const { words } = tokenize('hello \u2014world')
			expect(words).toEqual(['hello\u2014world'])
		})
	})

	describe('ellipsis dot reattachment', () => {
		it('attaches standalone dots to previous word', () => {
			const { words } = tokenize('wait . . . okay')
			expect(words).toEqual(['wait...', 'okay'])
		})

		it('does not attach dot as first word', () => {
			const { words } = tokenize('. hello')
			expect(words).toEqual(['.', 'hello'])
		})
	})

	describe('slash splitting', () => {
		it('splits word on slash with slash visible on both sides', () => {
			const { words } = tokenize('amazing/excellent')
			expect(words).toEqual(['amazing/', '/excellent'])
		})

		it('handles multiple slashes', () => {
			const { words } = tokenize('a/b/c')
			expect(words).toEqual(['a/', '/b/', '/c'])
		})

		it('does not split URL-like patterns', () => {
			// http:// has slash after colon, not between word chars
			const { words } = tokenize('http://example')
			expect(words).toEqual(['http://example'])
		})
	})

	describe('quote depth tracking', () => {
		it('tracks opening smart quotes', () => {
			const { quoteDepth } = tokenize('\u201chello world\u201d')
			expect(quoteDepth).toEqual([1, 1])
		})

		it('returns to depth 0 after closing quote', () => {
			const { quoteDepth } = tokenize('\u201chello\u201d world')
			expect(quoteDepth).toEqual([1, 0])
		})

		it('resets quote depth at paragraph boundary', () => {
			const { quoteDepth } = tokenize('\u201chello\n\nworld')
			// First paragraph: \u201chello opens depth to 1
			// Second paragraph: depth resets to 0
			expect(quoteDepth).toEqual([1, 0])
		})

		it('unbalanced opening quote does not leak across paragraphs', () => {
			const { quoteDepth } = tokenize(
				'\u201cstart of quote\n\nnext paragraph here\n\nthird paragraph too',
			)
			// First paragraph words at depth 1
			expect(quoteDepth[0]).toBe(1) // \u201cstart
			expect(quoteDepth[1]).toBe(1) // of
			expect(quoteDepth[2]).toBe(1) // quote
			// Second paragraph resets
			expect(quoteDepth[3]).toBe(0) // next
			expect(quoteDepth[4]).toBe(0) // paragraph
			expect(quoteDepth[5]).toBe(0) // here
			// Third paragraph also at 0
			expect(quoteDepth[6]).toBe(0)
		})

		it('tracks nested quotes', () => {
			const { quoteDepth } = tokenize('\u201c\u2018inner\u2019\u201d')
			expect(quoteDepth).toEqual([2])
		})

		it('handles balanced quotes within a paragraph', () => {
			const { quoteDepth } = tokenize('she said \u201chello\u201d and left')
			// she=0, said=0, \u201chello\u201d=1, and=0, left=0
			expect(quoteDepth).toEqual([0, 0, 1, 0, 0])
		})

		it('tracks straight double quotes via smartifyQuotes', () => {
			const { quoteDepth } = tokenize('"hello world"')
			expect(quoteDepth).toEqual([1, 1])
		})

		it('returns to depth 0 after straight closing quote', () => {
			const { quoteDepth } = tokenize('"hello" world')
			expect(quoteDepth).toEqual([1, 0])
		})

		it('handles nested straight quotes: double containing single', () => {
			const { quoteDepth } = tokenize(
				`"long quote whee John said 'shorter thing'."`,
			)
			// "long=1 quote=1 whee=1 John=1 said=1 'shorter=2 thing'.=2 (closes back)
			expect(quoteDepth[0]).toBe(1) // \u201clong
			expect(quoteDepth[5]).toBe(2) // \u2018shorter
			expect(quoteDepth[6]).toBe(2) // thing\u2019.\u201d
		})

		it('handles multiple straight-quoted phrases', () => {
			const { quoteDepth } = tokenize('she said "hi" and "bye" ok')
			// she=0 said=0 "hi"=1 and=0 "bye"=1 ok=0
			expect(quoteDepth).toEqual([0, 0, 1, 0, 1, 0])
		})

		it('resets quote depth at sentence boundaries', () => {
			// Unbalanced opening quote in first sentence should not leak
			// into the next sentence within the same paragraph.
			const { quoteDepth } = tokenize(
				'\u201cunclosed quote here. next sentence is clean',
			)
			// First sentence: depth 1 throughout
			expect(quoteDepth[0]).toBe(1) // \u201cunclosed
			expect(quoteDepth[1]).toBe(1) // quote
			expect(quoteDepth[2]).toBe(1) // here.
			// After sentence boundary (period), depth resets
			expect(quoteDepth[3]).toBe(0) // next
			expect(quoteDepth[4]).toBe(0) // sentence
			expect(quoteDepth[5]).toBe(0) // is
			expect(quoteDepth[6]).toBe(0) // clean
		})
	})
})
