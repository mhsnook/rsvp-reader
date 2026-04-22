import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	type ChangeEvent,
	type DragEvent,
} from 'react'
import { getORP, tokenize } from './tokenizer'

declare global {
	interface Window {
		pdfjsLib: {
			GlobalWorkerOptions: { workerSrc: string }
			getDocument: (opts: { data: ArrayBuffer }) => {
				promise: Promise<{
					numPages: number
					getPage: (n: number) => Promise<{
						getViewport: (opts: { scale: number }) => {
							height: number
							width: number
						}
						getTextContent: () => Promise<{
							items: Array<{ str: string; transform: number[] }>
						}>
					}>
				}>
			}
		}
	}
}

const FONT_URLS = [
	'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
]

type FontChoice = 'mono' | 'serif' | 'dyslexic'

const FONT_CONFIG: Record<
	FontChoice,
	{ family: string; label: string; orpWidth: number }
> = {
	mono: {
		family: "'Space Mono', monospace",
		label: 'Monospace',
		// 1ch = exactly 1 character width in monospace
		orpWidth: 10,
	},
	serif: {
		family: 'Georgia, Times, serif',
		label: 'Serif',
		// ch = width of "0" which is wider than average chars in proportional fonts
		orpWidth: 6,
	},
	dyslexic: {
		family: "'OpenDyslexic', sans-serif",
		label: 'Dyslexia-friendly',
		orpWidth: 6,
	},
}

const LS_KEY = 'rsvp-reading-positions'
const LS_TEXT_KEY = 'rsvp-texts'
const LS_THEME_KEY = 'rsvp-theme'
const LS_FONT_KEY = 'rsvp-font'

type Screen = 'input' | 'read'

interface SavedPosition {
	name: string
	idx: number
	wpm: number
	wordCount: number
	updatedAt: number
}

type SavedPositions = Record<string, SavedPosition>

function hashText(words: string[]): string {
	const sample = words.slice(0, 100).join(' ')
	let h = 0
	for (let i = 0; i < sample.length; i++) {
		h = ((h << 5) - h + sample.charCodeAt(i)) | 0
	}
	return 'rsvp_' + (h >>> 0).toString(36)
}

function loadPositions(): SavedPositions {
	try {
		return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
	} catch {
		return {}
	}
}

function savePosition(
	hash: string,
	name: string,
	idx: number,
	wpm: number,
	wordCount: number,
) {
	const all = loadPositions()
	all[hash] = { name, idx, wpm, wordCount, updatedAt: Date.now() }
	localStorage.setItem(LS_KEY, JSON.stringify(all))
}

function saveText(hash: string, text: string) {
	try {
		const all = JSON.parse(localStorage.getItem(LS_TEXT_KEY) || '{}')
		all[hash] = text
		localStorage.setItem(LS_TEXT_KEY, JSON.stringify(all))
	} catch {
		// Storage full — silently skip
	}
}

function loadText(hash: string): string | null {
	try {
		const all = JSON.parse(localStorage.getItem(LS_TEXT_KEY) || '{}')
		return all[hash] || null
	} catch {
		return null
	}
}


function loadTheme(): 'light' | 'dark' {
	try {
		const v = localStorage.getItem(LS_THEME_KEY)
		return v === 'dark' ? 'dark' : 'light'
	} catch {
		return 'light'
	}
}

function loadFont(): FontChoice {
	try {
		const v = localStorage.getItem(LS_FONT_KEY)
		if (v === 'mono' || v === 'serif' || v === 'dyslexic') return v
	} catch {}
	return 'mono'
}

async function loadPdfJs(): Promise<Window['pdfjsLib']> {
	if (window.pdfjsLib) return window.pdfjsLib
	return new Promise((resolve, reject) => {
		const s = document.createElement('script')
		s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
		s.onload = () => {
			window.pdfjsLib.GlobalWorkerOptions.workerSrc =
				'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
			resolve(window.pdfjsLib)
		}
		s.onerror = reject
		document.head.appendChild(s)
	})
}

async function extractPdfText(file: File): Promise<string> {
	const lib = await loadPdfJs()
	const buf = await file.arrayBuffer()
	const pdf = await lib.getDocument({ data: buf }).promise

	// Margin fraction: items in the top/bottom 12% of page height are
	// candidates for header/footer stripping.
	const MARGIN = 0.12

	// First pass: collect text items with position info per page, and
	// gather margin-zone text to detect repeating headers/footers.
	const pageItems: Array<Array<{ str: string; y: number }>> = []
	const pageHeights: number[] = []
	const marginTexts = new Map<string, number>() // text → page count

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i)
		const viewport = page.getViewport({ scale: 1 })
		const content = await page.getTextContent()
		const items = content.items.map((x) => ({
			str: x.str,
			// PDF y-coordinates are bottom-up; transform[5] is y position
			y: x.transform[5],
		}))
		pageItems.push(items)
		pageHeights.push(viewport.height)

		// Collect unique margin-zone strings from this page
		const h = viewport.height
		const seen = new Set<string>()
		for (const item of items) {
			const trimmed = item.str.trim()
			if (!trimmed) continue
			const inTop = item.y > h * (1 - MARGIN)
			const inBottom = item.y < h * MARGIN
			if ((inTop || inBottom) && !seen.has(trimmed)) {
				seen.add(trimmed)
				marginTexts.set(trimmed, (marginTexts.get(trimmed) || 0) + 1)
			}
		}
	}

	// A margin string is a repeating header/footer if it appears on 3+ pages
	// (or on most pages for short documents).
	const threshold = Math.min(3, Math.ceil(pdf.numPages * 0.4))
	const repeating = new Set<string>()
	for (const [txt, count] of marginTexts) {
		if (count >= threshold) repeating.add(txt)
	}

	// Second pass: build clean text, stripping margin items and
	// detecting paragraph breaks from y-coordinate gaps.
	const pageTexts: string[] = []
	for (let i = 0; i < pageItems.length; i++) {
		const items = pageItems[i]
		const h = pageHeights[i]

		// Filter out headers/footers first
		const kept: Array<{ str: string; y: number }> = []
		for (const item of items) {
			const trimmed = item.str.trim()
			if (!trimmed) continue
			const inTop = item.y > h * (1 - MARGIN)
			const inBottom = item.y < h * MARGIN
			if (inTop || inBottom) {
				if (repeating.has(trimmed)) continue
				if (/^\d{1,4}$/.test(trimmed)) continue
			}
			kept.push(item)
		}

		if (kept.length === 0) continue

		// Detect paragraph breaks: when consecutive items have a y-gap
		// larger than ~1.5x the typical line spacing, insert a blank line.
		// PDF y is bottom-up, so text flows with decreasing y values.
		const gaps: number[] = []
		for (let j = 1; j < kept.length; j++) {
			const gap = Math.abs(kept[j - 1].y - kept[j].y)
			if (gap > 0) gaps.push(gap)
		}
		// Median gap ≈ normal line spacing; paragraph break if > 1.5x that
		const sorted = [...gaps].sort((a, b) => a - b)
		const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0
		const paraThreshold = median * 1.5

		let text = kept[0].str
		for (let j = 1; j < kept.length; j++) {
			const gap = Math.abs(kept[j - 1].y - kept[j].y)
			if (paraThreshold > 0 && gap > paraThreshold) {
				text += '\n\n' + kept[j].str
			} else {
				text += ' ' + kept[j].str
			}
		}
		pageTexts.push(text)
	}

	return pageTexts.join('\n\n')
}

/** Theme color tokens derived from dark/light mode */
function useThemeColors(dark: boolean) {
	return dark
		? {
				bg: 'bg-gray-950',
				text: 'text-gray-100',
				textStrong: 'text-white',
				textMuted: 'text-gray-400',
				textFaint: 'text-gray-600',
				border: 'border-gray-800',
				controlsBg: 'bg-gray-900',
				cardBg: 'bg-gray-900',
				inputBg: 'bg-gray-900',
				inputBorder: 'border-gray-700',
				beforeText: 'text-gray-500',
				afterText: 'text-gray-200',
				progressBg: 'bg-gray-800',
				ctxCurrent: 'text-white font-bold',
				ctxPast: 'text-gray-700',
				ctxFuture: 'text-gray-500',
				divider: 'bg-gray-800',
				btnBorder: 'border-gray-700',
				btnText: 'text-gray-400',
				btnHoverBorder: 'hover:border-gray-600',
				btnHoverText: 'hover:text-gray-300',
				guideLine: 'rgba(255,255,255,0.07)',
				orpShadow: '0 0 24px rgba(245,158,11,0.4)',
			}
		: {
				bg: 'bg-sky-50',
				text: 'text-slate-800',
				textStrong: 'text-slate-900',
				textMuted: 'text-slate-400',
				textFaint: 'text-slate-300',
				border: 'border-slate-200',
				controlsBg: 'bg-white',
				cardBg: 'bg-white',
				inputBg: 'bg-white',
				inputBorder: 'border-slate-200',
				beforeText: 'text-slate-400',
				afterText: 'text-slate-800',
				progressBg: 'bg-sky-100',
				ctxCurrent: 'text-slate-800 font-bold',
				ctxPast: 'text-slate-300',
				ctxFuture: 'text-slate-500',
				divider: 'bg-slate-200',
				btnBorder: 'border-slate-200',
				btnText: 'text-slate-400',
				btnHoverBorder: 'hover:border-slate-300',
				btnHoverText: 'hover:text-slate-500',
				guideLine: 'rgba(0,0,0,0.06)',
				orpShadow: '0 0 20px rgba(245,158,11,0.3)',
			}
}

export default function RSVPReader() {
	const [words, setWords] = useState<string[]>([])
	const [delays, setDelays] = useState<number[]>([])
	const [quoteDepths, setQuoteDepths] = useState<number[]>([])
	const [idx, setIdx] = useState(0)
	const [wpm, setWpm] = useState(300)
	const [playing, setPlaying] = useState(false)
	const [screen, setScreen] = useState<Screen>('input')
	const [pasteText, setPasteText] = useState('')
	const [loading, setLoading] = useState(false)
	const [dragOver, setDragOver] = useState(false)
	const [showInfo, setShowInfo] = useState(false)
	const [textName, setTextName] = useState('')
	const [textHash, setTextHash] = useState('')
	const [savedTexts, setSavedTexts] = useState<SavedPositions>({})
	const [dark, setDark] = useState(false)
	const [font, setFont] = useState<FontChoice>('mono')
	const [showFontPicker, setShowFontPicker] = useState(false)
	const [jumpInput, setJumpInput] = useState<string | null>(null)
	const [focusMode, setFocusMode] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const idxRef = useRef(idx)
	idxRef.current = idx
	const wpmRef = useRef(wpm)
	wpmRef.current = wpm

	const c = useThemeColors(dark)

	const toggleTheme = useCallback(() => {
		setDark((d) => {
			const next = !d
			localStorage.setItem(LS_THEME_KEY, next ? 'dark' : 'light')
			return next
		})
	}, [])

	const fc = FONT_CONFIG[font]

	const pickFont = useCallback((f: FontChoice) => {
		setFont(f)
		localStorage.setItem(LS_FONT_KEY, f)
		setShowFontPicker(false)
	}, [])

	useEffect(() => {
		for (const url of FONT_URLS) {
			const link = document.createElement('link')
			link.rel = 'stylesheet'
			link.href = url
			document.head.appendChild(link)
		}
		setSavedTexts(loadPositions())
		setDark(loadTheme() === 'dark')
		setFont(loadFont())
	}, [])

	useEffect(() => {
		if (screen !== 'read' || !textHash || words.length === 0) return
		const id = setInterval(() => {
			savePosition(
				textHash,
				textName,
				idxRef.current,
				wpmRef.current,
				words.length,
			)
		}, 3000)
		return () => clearInterval(id)
	}, [screen, textHash, textName, words.length])

	const rewind = useCallback(() => {
		const n = Math.max(1, Math.floor((wpmRef.current / 60) * 5))
		setIdx((i) => Math.max(0, i - n))
		setPlaying(false)
	}, [])

	const forward = useCallback(() => {
		const n = Math.max(1, Math.floor((wpmRef.current / 60) * 5))
		setIdx((i) => Math.min(words.length - 1, i + n))
		setPlaying(false)
	}, [words.length])

	useEffect(() => {
		if (screen !== 'read') return
		const handler = (e: globalThis.KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault()
				setPlaying((p) => !p)
			}
			if (e.code === 'ArrowLeft') {
				e.preventDefault()
				rewind()
			}
			if (e.code === 'ArrowRight') {
				e.preventDefault()
				forward()
			}
			if (e.code === 'ArrowUp') {
				e.preventDefault()
				setWpm((w) => Math.min(1000, w + 20))
			}
			if (e.code === 'ArrowDown') {
				e.preventDefault()
				setWpm((w) => Math.max(80, w - 20))
			}
			if (e.key === 'f' || e.key === 'F') {
				e.preventDefault()
				setFocusMode((f) => !f)
			}
			if (e.code === 'Escape' && focusMode) {
				e.preventDefault()
				setFocusMode(false)
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [screen, rewind, forward, focusMode])

	useEffect(() => {
		if (!playing || words.length === 0) return
		const baseMs = 60000 / wpm
		const wordDelay = baseMs * (delays[idx] || 1)
		const id = setTimeout(() => {
			setIdx((i) => {
				if (i >= words.length - 1) {
					setPlaying(false)
					return i
				}
				return i + 1
			})
		}, wordDelay)
		return () => clearTimeout(id)
	}, [playing, wpm, words.length, idx, delays])

	const startReading = useCallback(
		(text: string, name: string) => {
			const { words: w, delays: d, quoteDepth: q } = tokenize(text)
			if (w.length === 0) return
			const hash = hashText(w)
			const saved = loadPositions()[hash]

			setWords(w)
			setDelays(d)
			setQuoteDepths(q)
			setTextName(name)
			setTextHash(hash)
			setPlaying(false)
			setScreen('read')

			if (saved && saved.idx > 0 && saved.idx < w.length) {
				setIdx(saved.idx)
				setWpm(saved.wpm)
			} else {
				setIdx(0)
			}

			savePosition(hash, name, saved?.idx || 0, saved?.wpm || wpm, w.length)
			saveText(hash, text)
			setSavedTexts(loadPositions())
		},
		[wpm],
	)

	const handleFile = async (file: File | undefined) => {
		if (!file) return
		setLoading(true)
		try {
			const text =
				file.type === 'application/pdf'
					? await extractPdfText(file)
					: await file.text()
			startReading(text, file.name)
		} catch (e) {
			alert('Could not read file: ' + (e as Error).message)
		} finally {
			setLoading(false)
		}
	}

	const handleBack = () => {
		if (textHash && words.length > 0) {
			savePosition(textHash, textName, idx, wpm, words.length)
		}
		setScreen('input')
		setPlaying(false)
		setFocusMode(false)
		setSavedTexts(loadPositions())
	}

	const progress = words.length > 1 ? idx / (words.length - 1) : 0
	const pct = Math.round(progress * 100)
	const minsLeft = Math.ceil((words.length - idx) / wpm)
	const { before, orp, after } = getORP(words[idx] || '')
	const currentWord = words[idx] || ''
	const inQuote = (quoteDepths[idx] || 0) > 0
	const wordOpensQuote = /^[""'«]/.test(currentWord)
	const wordClosesQuote = /[""'»]$/.test(currentWord)


	// Compute sentence boundaries for sidebar navigation
	const sentences = useMemo(() => {
		if (words.length === 0) return []
		const result: { start: number; preview: string; paraStart: boolean }[] = []
		let sentStart = 0
		let nextIsParaStart = true // first sentence starts a paragraph
		for (let i = 0; i < words.length; i++) {
			// Sentence ends at punctuation (delay >= 1.8) or paragraph break (delay >= 4)
			if (delays[i] >= 1.8 || i === words.length - 1) {
				const preview = words
					.slice(sentStart, Math.min(sentStart + 8, i + 1))
					.join(' ')
				result.push({ start: sentStart, preview, paraStart: nextIsParaStart })
				// If this word ends a paragraph (delay >= 4), the next sentence starts a new one
				nextIsParaStart = delays[i] >= 4
				sentStart = i + 1
			}
		}
		return result
	}, [words, delays])

	const currentSentenceIdx = useMemo(() => {
		for (let i = sentences.length - 1; i >= 0; i--) {
			if (idx >= sentences[i].start) return i
		}
		return 0
	}, [idx, sentences])

	// Hovered sentence index for tooltip (null = no tooltip)
	const [hoveredSentence, setHoveredSentence] = useState<number | null>(null)
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const getSentenceText = useCallback(
		(sentIdx: number) => {
			if (sentences.length === 0 || sentIdx < 0) return ''
			const start = sentences[sentIdx].start
			const end =
				sentIdx + 1 < sentences.length
					? sentences[sentIdx + 1].start
					: words.length
			return words.slice(start, end).join(' ')
		},
		[sentences, words],
	)

	const sidebarRef = useRef<HTMLDivElement>(null)

	// Auto-scroll sidebar to keep current sentence visible
	useEffect(() => {
		const el = sidebarRef.current
		if (!el) return
		const active = el.querySelector('[data-active="true"]') as HTMLElement
		if (active) {
			active.scrollIntoView({ block: 'center', behavior: 'smooth' })
		}
	}, [currentSentenceIdx])

	const savedList = Object.entries(savedTexts)
		.map(([hash, data]) => ({ hash, ...data }))
		.sort((a, b) => b.updatedAt - a.updatedAt)

	const themeToggle = (
		<button
			onClick={toggleTheme}
			className={`${c.btnBorder} ${c.btnText} ${c.btnHoverText} border rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans`}
		>
			{dark ? '☀ light' : '● dark'}
		</button>
	)

	const fontButton = (
		<button
			onClick={() => setShowFontPicker(true)}
			className={`${c.btnBorder} ${c.btnText} ${c.btnHoverText} border rounded-md px-3 py-1.5 text-xs cursor-pointer`}
			style={{ fontFamily: fc.family }}
		>
			Aa
		</button>
	)

	const fontPickerModal = showFontPicker && (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			onClick={() => setShowFontPicker(false)}
		>
			<div className="absolute inset-0 bg-black/40" aria-hidden />
			<div
				className={`relative ${c.cardBg} ${c.text} rounded-2xl max-w-sm w-full p-6 shadow-xl`}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={() => setShowFontPicker(false)}
					className={`absolute top-4 right-4 ${c.btnText} ${c.btnHoverText} text-lg cursor-pointer`}
				>
					×
				</button>
				<h2 className={`text-lg font-bold ${c.textStrong} mb-4`}>
					Reading Font
				</h2>
				<div className="flex flex-col gap-3">
					{(
						Object.entries(FONT_CONFIG) as [
							FontChoice,
							(typeof FONT_CONFIG)[FontChoice],
						][]
					).map(([key, cfg]) => (
						<button
							key={key}
							onClick={() => pickFont(key)}
							className={`text-left rounded-xl px-5 py-4 border cursor-pointer transition-colors ${
								font === key
									? 'border-amber-500 bg-amber-500/10'
									: `${c.inputBorder} ${c.inputBg} ${c.btnHoverBorder}`
							}`}
						>
							<p
								className={`text-2xl font-bold mb-1 ${font === key ? 'text-amber-600' : c.text}`}
								style={{ fontFamily: cfg.family }}
							>
								The quick brown fox
							</p>
							<p className={`text-xs ${c.textMuted}`}>{cfg.label}</p>
						</button>
					))}
				</div>
			</div>
		</div>
	)

	if (screen === 'input') {
		return (
			<div
				className={`min-h-screen ${c.bg} ${c.text} font-sans flex items-center justify-center p-4 md:p-8 transition-colors duration-300`}
			>
				<div className="max-w-lg w-full">
					<div className="mb-8 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h1 className={`text-2xl font-bold ${c.textStrong} font-display`}>
								RSVP Reader
							</h1>
							<button
								onClick={() => setShowInfo(true)}
								className={`${c.btnText} ${c.btnHoverText} w-6 h-6 rounded-full border ${c.btnBorder} flex items-center justify-center text-xs cursor-pointer`}
								title="What is this?"
							>
								?
							</button>
						</div>
						<div className="flex items-center gap-2">
							{fontButton}
							{themeToggle}
						</div>
					</div>
					{fontPickerModal}
					<p className={`${c.textMuted} text-sm mb-6 -mt-4`}>
						Drop in a PDF or text file, or paste below to begin.{' '}
						<span className={c.textFaint}>
							(All data stays on your device.)
						</span>
					</p>

					{/* Info modal */}
					{showInfo && (
						<div
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
							onClick={() => setShowInfo(false)}
						>
							<div className="absolute inset-0 bg-black/40" aria-hidden />
							<div
								className={`relative ${c.cardBg} ${c.text} rounded-2xl max-w-md w-full p-6 shadow-xl`}
								onClick={(e) => e.stopPropagation()}
							>
								<button
									onClick={() => setShowInfo(false)}
									className={`absolute top-4 right-4 ${c.btnText} ${c.btnHoverText} text-lg cursor-pointer`}
								>
									×
								</button>
								<h2 className={`text-lg font-bold ${c.textStrong} mb-3`}>
									What is RSVP?
								</h2>
								<div
									className={`text-sm ${c.textMuted} leading-relaxed space-y-3`}
								>
									<p>
										<strong className={c.text}>
											Rapid Serial Visual Presentation
										</strong>{' '}
										shows you one word at a time, with a highlighted anchor
										letter so your eyes stay fixed in one spot. Words come to
										you instead of you scanning across a page.
									</p>
									<p>
										Most people can comfortably read at 300–500 wpm this way —
										much faster than normal reading — because your eyes never
										need to move.
									</p>
									<p>
										This is a free tool — use it as much as you like. Your text
										never leaves your device. Your reading position is
										bookmarked in your browser, so you can come back later and
										pick up where you left off. Just drop the same file in the
										same browser, and it will resume automatically.
									</p>
									<a
										href="https://www.youtube.com/watch?v=NdKcDPBQ-Lw"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-500 font-medium"
									>
										▶ Watch a quick explanation on YouTube
									</a>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-col gap-3.5">
						<div
							className={`border rounded-xl px-6 py-5 cursor-pointer flex items-center gap-4 transition-colors ${
								dragOver
									? 'border-amber-500 bg-amber-50/10'
									: `${c.inputBorder} ${c.cardBg}`
							}`}
							onDragOver={(e: DragEvent) => {
								e.preventDefault()
								setDragOver(true)
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e: DragEvent) => {
								e.preventDefault()
								setDragOver(false)
								handleFile(e.dataTransfer.files[0])
							}}
							onClick={() => fileInputRef.current?.click()}
						>
							<span className="text-xl">📄</span>
							<div>
								<p className="font-semibold text-sm">
									{loading
										? 'Extracting text…'
										: 'Drop file or click to select'}
								</p>
								<p className={`${c.textMuted} text-xs mt-0.5`}>
									.pdf · .txt · .md
								</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf,.txt,.md"
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									handleFile(e.target.files?.[0])
								}
								className="hidden"
							/>
						</div>

						<div className={`flex items-center gap-3 ${c.textFaint} text-xs`}>
							<div className={`flex-1 h-px ${c.divider}`} />
							or
							<div className={`flex-1 h-px ${c.divider}`} />
						</div>

						<textarea
							className={`${c.inputBg} border ${c.inputBorder} rounded-xl ${c.text} p-4 text-sm resize-y min-h-28 font-sans outline-none leading-relaxed w-full`}
							value={pasteText}
							onChange={(e) => setPasteText(e.target.value)}
							placeholder="Paste any text here…"
						/>

						<button
							className={`rounded-xl py-3.5 text-sm font-bold tracking-wide w-full transition-colors ${
								pasteText.trim()
									? 'bg-amber-500 text-white cursor-pointer hover:bg-amber-600'
									: `${c.progressBg} ${c.textFaint} cursor-default`
							}`}
							onClick={() =>
								pasteText.trim() &&
								startReading(
									pasteText,
									pasteText.trim().split(/\s+/).slice(0, 5).join(' ') + '…',
								)
							}
						>
							Start Reading →
						</button>
					</div>

					{savedList.length > 0 && (
						<div className="mt-10">
							<p className="text-[9px] tracking-[0.35em] text-amber-600 uppercase mb-3">
								Continue Reading
							</p>
							<div className="flex flex-col gap-2">
								{savedList.map((s) => {
									const hasText = !!loadText(s.hash)
									return (
										<div
											key={s.hash}
											className={`${c.cardBg} border ${c.inputBorder} rounded-lg px-4 py-3 text-sm flex items-center gap-3`}
										>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{s.name}</p>
												<p className={`${c.textMuted} text-xs`}>
													{Math.round((s.idx / s.wordCount) * 100)}% ·{' '}
													{s.wordCount.toLocaleString()} words · {s.wpm} wpm
												</p>
											</div>
											{hasText ? (
												<button
													onClick={() => {
														const text = loadText(s.hash)
														if (text) startReading(text, s.name)
													}}
													className={`${c.btnText} ${c.btnHoverText} text-xs shrink-0 cursor-pointer`}
												>
													Resume →
												</button>
											) : (
												<p className={`${c.textFaint} text-xs shrink-0`}>
													Re-upload to resume →
												</p>
											)}
										</div>
									)
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div
			className={`${c.bg} ${c.text} font-sans h-screen overflow-hidden transition-colors duration-300 grid
				${focusMode
					? 'grid-cols-1 grid-rows-1'
					: `grid-cols-1 grid-rows-[auto_auto_1fr_auto_auto]
					   md:grid-cols-[160px_1fr_220px] md:grid-rows-[1fr_64px]`
				}`}
		>
			{/* Progress panel: horizontal strip on mobile, vertical sidebar on desktop */}
			{!focusMode && <div
				className={`
					border-b md:border-b-0 md:border-r ${c.border}
					px-4 py-2 md:p-5
					flex md:flex-col
					items-center md:items-stretch md:justify-center
					gap-3 md:gap-0
					order-1 md:order-none
				`}
			>
				<p className="text-[9px] tracking-[0.35em] text-amber-600 uppercase md:mb-5 shrink-0">
					Progress
				</p>
				{/* Horizontal bar on mobile */}
				<div className="flex-1 md:hidden h-2 relative">
					<div
						className={`${c.progressBg} rounded-md h-full relative overflow-hidden`}
					>
						<div
							className="absolute top-0 left-0 bottom-0 transition-[width] duration-400 ease-out"
							style={{
								width: `${pct}%`,
								background:
									'linear-gradient(to right, rgba(245,158,11,0.12), transparent)',
								borderRight: '1px solid rgba(245,158,11,0.3)',
							}}
						/>
						<div
							className="absolute top-0 bottom-0 w-0.5 bg-amber-500 transition-[left] duration-400 ease-out"
							style={{
								left: `${pct}%`,
								boxShadow: '0 0 8px rgba(245,158,11,0.5)',
							}}
						/>
					</div>
				</div>
				{/* Vertical bar on desktop */}
				<div className="hidden md:flex flex-1 flex-col max-h-80">
					<div
						className={`flex-1 ${c.progressBg} rounded-md relative overflow-hidden`}
					>
						<div
							className="absolute top-0 left-0 right-0 transition-[height] duration-400 ease-out"
							style={{
								height: `${pct}%`,
								background:
									'linear-gradient(to bottom, rgba(245,158,11,0.12), transparent)',
								borderBottom: '1px solid rgba(245,158,11,0.3)',
							}}
						/>
						<div
							className="absolute left-0 right-0 h-0.5 bg-amber-500 transition-[top] duration-400 ease-out"
							style={{
								top: `${pct}%`,
								boxShadow: '0 0 8px rgba(245,158,11,0.5)',
							}}
						/>
					</div>
				</div>
				<div
					className={`text-xs ${c.textMuted} leading-loose md:mt-5 md:h-20 overflow-hidden shrink-0`}
				>
					<p className={`${c.text} font-semibold`}>{pct}%</p>
					<p className="hidden md:block">
						{jumpInput !== null ? (
							<form
								onSubmit={(e) => {
									e.preventDefault()
									const n = parseInt(jumpInput, 10)
									if (!isNaN(n) && n >= 0 && n < words.length) {
										setIdx(n)
										setPlaying(false)
									}
									setJumpInput(null)
								}}
								className="inline"
							>
								<input
									type="text"
									inputMode="numeric"
									autoFocus
									value={jumpInput}
									onChange={(e) => setJumpInput(e.target.value)}
									onBlur={() => setJumpInput(null)}
									className={`w-16 text-xs px-1 py-0 border rounded ${c.text} bg-transparent border-amber-500 outline-none`}
								/>{' '}
								/ {words.length.toLocaleString()}
							</form>
						) : (
							<span
								onClick={() => setJumpInput(String(idx))}
								className="cursor-pointer hover:underline"
								title="Click to jump to index"
							>
								{idx.toLocaleString()} / {words.length.toLocaleString()} words
							</span>
						)}
					</p>
					<p className="hidden md:block">
						~{minsLeft < 1 ? '<1' : minsLeft}m left @ {wpm}wpm
					</p>
				</div>
			</div>}

			{/* Center: reader with focus guides */}
			<div
				className={`flex flex-col items-center justify-center relative ${
					focusMode ? 'w-full h-full' : 'order-3 md:order-none min-h-[200px] cursor-pointer'
				}`}
				onClick={() => { if (!focusMode) setFocusMode(true) }}
			>
				{/* Focus guides: horizontal rails + vertical ORP line */}
				<div
					className="absolute pointer-events-none"
					style={{
						inset: 0,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{/* Top horizontal rail */}
					<div
						style={{
							position: 'absolute',
							top: 'calc(50% - 3.2rem)',
							left: 0,
							right: 0,
							height: '1px',
							background: c.guideLine,
						}}
					/>
					{/* Bottom horizontal rail */}
					<div
						style={{
							position: 'absolute',
							top: 'calc(50% + 3.2rem)',
							left: 0,
							right: 0,
							height: '1px',
							background: c.guideLine,
						}}
					/>
					{/* Vertical ORP line — above */}
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: 0,
							bottom: 'calc(50% + 3.2rem)',
							width: '1px',
							background: c.guideLine,
						}}
					/>
					{/* Vertical ORP line — below */}
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: 'calc(50% + 3.2rem)',
							bottom: 0,
							width: '1px',
							background: c.guideLine,
						}}
					/>
					{/* Small ticks where vertical meets horizontal */}
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: 'calc(50% - 3.2rem)',
							width: '1px',
							height: '8px',
							background: c.guideLine,
							transform: 'translateY(-100%)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							left: '50%',
							top: 'calc(50% + 3.2rem)',
							width: '1px',
							height: '8px',
							background: c.guideLine,
						}}
					/>
				</div>

				{/*
				 * Word display — ORP is always at exact horizontal AND vertical center.
				 * Fixed height + line-height prevents vertical jumping between words.
				 */}
				<div className="relative w-full" style={{ height: '4.5rem' }}>
					{/* Ghost quotes when inside a quotation */}
					{inQuote && !wordOpensQuote && (
						<div
							className={`absolute ${c.textMuted} pointer-events-none select-none`}
							style={{
								left: '1.5rem',
								top: '50%',
								transform: 'translateY(-50%)',
								fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
								fontFamily: fc.family,
								opacity: 0.5,
							}}
						>
							&ldquo;
						</div>
					)}
					{inQuote && !wordClosesQuote && (
						<div
							className={`absolute ${c.textMuted} pointer-events-none select-none`}
							style={{
								right: '1.5rem',
								top: '50%',
								transform: 'translateY(-50%)',
								fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
								fontFamily: fc.family,
								opacity: 0.5,
							}}
						>
							&rdquo;
						</div>
					)}
					<div
						className="absolute"
						style={{
							left: '50%',
							top: '50%',
							transform: `translate(-${fc.orpWidth + 0.5}ch, -50%)`,
							fontFamily: fc.family,
							fontSize: 'clamp(2rem, 5vw, 3.5rem)',
							fontWeight: 700,
							lineHeight: '4.5rem',
							whiteSpace: 'pre',
							userSelect: 'none',
						}}
					>
						<span
							className={`inline-block text-right ${c.beforeText}`}
							style={{ width: `${fc.orpWidth}ch` }}
						>
							{before}
						</span>
						<span
							className="text-amber-500"
							style={{ textShadow: c.orpShadow }}
						>
							{orp}
						</span>
						<span className={c.afterText}>{after}</span>
					</div>
				</div>

				{/* Text name */}
				{textName && !focusMode && (
					<p
						className={`absolute bottom-4 text-[11px] ${c.textFaint} truncate max-w-xs`}
					>
						{textName}
					</p>
				)}

				{/* Floating controls in focus mode */}
				{focusMode && (
					<div
						className="absolute bottom-4 left-4 flex items-center gap-2 z-30"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleBack}
							className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
						>
							← back
						</button>
						<button
							onClick={rewind}
							className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
						>
							↩ 5s
						</button>
						<button
							onClick={() => setPlaying((p) => !p)}
							className="bg-amber-500 text-white rounded-md px-5 py-1.5 text-sm font-bold cursor-pointer min-w-[72px] hover:bg-amber-600"
						>
							{playing ? '⏸' : '▶'}
						</button>
						<button
							onClick={forward}
							className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
						>
							5s ↪
						</button>
						<button
							onClick={() => setFocusMode(false)}
							className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText} ml-2`}
							title="Exit focus mode (f)"
						>
							✕
						</button>
					</div>
				)}
			</div>

			{/* Sentence navigation: horizontal scroll on mobile, vertical sidebar on desktop */}
			{!focusMode && <div
				className={`
					border-t md:border-t-0 md:border-l ${c.border}
					px-3 py-2 md:p-3
					flex md:flex-col overflow-hidden
					order-2 md:order-none
					items-center md:items-stretch
					gap-2 md:gap-0
				`}
			>
				<p className="text-[9px] tracking-[0.35em] text-amber-600 uppercase md:mb-3 shrink-0 whitespace-nowrap">
					Sentences
				</p>
				<div
					ref={sidebarRef}
					className="overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex-1 flex md:block gap-1 md:gap-0 md:space-y-0.5"
				>
					{sentences.map((s, i) => {
						const isCurrent = i === currentSentenceIdx
						const isPast = i < currentSentenceIdx
						return (
							<div key={s.start} className="relative">
								<button
									data-active={isCurrent}
									onClick={() => {
										setIdx(s.start)
										setPlaying(false)
									}}
									onMouseEnter={() => setHoveredSentence(i)}
									onMouseLeave={() => setHoveredSentence(null)}
									onTouchStart={() => {
										longPressTimer.current = setTimeout(
											() => setHoveredSentence(i),
											400,
										)
									}}
									onTouchEnd={() => {
										if (longPressTimer.current)
											clearTimeout(longPressTimer.current)
										setHoveredSentence(null)
									}}
									className={`block whitespace-nowrap md:whitespace-normal md:w-full text-left text-[11px] leading-snug px-2 py-1 rounded md:truncate transition-colors cursor-pointer shrink-0 ${
										s.paraStart && i > 0 ? 'md:mt-3 ml-3 md:ml-0' : ''
									} ${
										isCurrent
											? `${c.ctxCurrent} ${dark ? 'bg-gray-800' : 'bg-sky-100'}`
											: isPast
												? c.ctxPast
												: c.ctxFuture
									} ${dark ? 'hover:bg-gray-800' : 'hover:bg-sky-100'}`}
								>
									{s.preview}
								</button>
								{hoveredSentence === i && (
									<div
										className={`absolute z-20 ${c.bg} ${c.text} border ${c.border} rounded-lg px-3 py-2 text-xs max-w-xs shadow-lg pointer-events-none`}
										style={{
											bottom: '100%',
											left: 0,
											marginBottom: '0.25rem',
											whiteSpace: 'normal',
										}}
									>
										{getSentenceText(i)}
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>}

			{/* Controls bar */}
			{!focusMode && <div
				className={`flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-6 py-2 md:py-0 border-t ${c.border} ${c.controlsBg} order-4 md:order-none md:col-span-3`}
			>
				<button
					onClick={handleBack}
					className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
				>
					← back
				</button>
				<button
					onClick={rewind}
					className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
				>
					↩ 5s
				</button>
				<button
					onClick={() => setPlaying((p) => !p)}
					className="bg-amber-500 text-white rounded-md px-5 py-1.5 text-sm font-bold cursor-pointer min-w-[72px] hover:bg-amber-600"
				>
					{playing ? '⏸' : '▶'}
				</button>
				<button
					onClick={forward}
					className={`border ${c.btnBorder} ${c.btnText} rounded-md px-3 py-1.5 text-xs cursor-pointer font-sans ${c.btnHoverBorder} ${c.btnHoverText}`}
				>
					5s ↪
				</button>

				<div className="flex items-center gap-2.5 flex-1 min-w-[140px] max-w-72">
					<span className={`text-xs ${c.textMuted} whitespace-nowrap`}>
						{wpm} wpm
					</span>
					<input
						type="range"
						min={80}
						max={1000}
						step={20}
						value={wpm}
						onChange={(e) => setWpm(Number(e.target.value))}
						className="flex-1 accent-amber-500 h-1"
					/>
				</div>

				{fontButton}
				{themeToggle}

				{fontPickerModal}

				{/* Mobile: clickable index for jump-to */}
				<span
					onClick={() => {
						const input = window.prompt(
							`Jump to word index (0–${words.length - 1}):`,
							String(idx),
						)
						if (input !== null) {
							const n = parseInt(input, 10)
							if (!isNaN(n) && n >= 0 && n < words.length) {
								setIdx(n)
								setPlaying(false)
							}
						}
					}}
					className={`md:hidden text-[11px] ${c.textMuted} cursor-pointer hover:underline ml-auto`}
					title="Tap to jump to index"
				>
					#{idx.toLocaleString()}
				</span>

				<p
					className={`hidden md:block ml-auto text-[11px] ${c.textFaint} tracking-wide`}
				>
					space · pause &nbsp;·&nbsp; ←→ skip &nbsp;·&nbsp; ↑↓ speed &nbsp;·&nbsp; f focus
				</p>
			</div>}
		</div>
	)
}
