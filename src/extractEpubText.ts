import JSZip from 'jszip'
import { tokenize } from './tokenizer'

export interface Chapter {
	title: string
	startIdx: number
}

const BLOCK_TAGS = new Set([
	'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
	'BLOCKQUOTE', 'LI', 'OL', 'UL', 'TR', 'SECTION', 'ARTICLE',
	'HEADER', 'FOOTER', 'FIGURE', 'FIGCAPTION', 'HR', 'BR', 'DT', 'DD',
])
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'HEAD', 'NAV', 'SVG'])

function extractText(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) {
		return (node.textContent || '').replace(/\s+/g, ' ')
	}
	if (node.nodeType !== Node.ELEMENT_NODE) return ''
	const el = node as Element
	if (SKIP_TAGS.has(el.tagName.toUpperCase())) return ''

	const childTexts: string[] = []
	for (const child of Array.from(el.childNodes)) {
		childTexts.push(extractText(child))
	}
	const inner = childTexts.join('')
	if (BLOCK_TAGS.has(el.tagName.toUpperCase())) {
		return '\n\n' + inner + '\n\n'
	}
	return inner
}

function extractChapterTitle(doc: Document, fallback: string): string {
	// Try heading tags in order of specificity
	for (const tag of ['h1', 'h2', 'h3']) {
		const el = doc.getElementsByTagName(tag)[0]
		if (el) {
			const text = (el.textContent || '').trim()
			if (text) return text
		}
	}
	// Try <title> from head
	const title = doc.getElementsByTagName('title')[0]
	if (title) {
		const text = (title.textContent || '').trim()
		if (text) return text
	}
	return fallback
}

export async function extractEpubContent(
	file: File,
): Promise<{ text: string; chapters: Chapter[] }> {
	const zip = await JSZip.loadAsync(await file.arrayBuffer())

	// 1. Find OPF path from container.xml
	const containerXml = await zip.file('META-INF/container.xml')?.async('text')
	if (!containerXml) throw new Error('Invalid EPUB: missing container.xml')
	const containerDoc = new DOMParser().parseFromString(
		containerXml,
		'text/xml',
	)
	const rootfile = containerDoc.getElementsByTagName('rootfile')[0]
	const opfPath = rootfile?.getAttribute('full-path')
	if (!opfPath) throw new Error('Invalid EPUB: no rootfile path')

	// 2. Parse OPF for manifest + spine
	const opfXml = await zip.file(opfPath)?.async('text')
	if (!opfXml) throw new Error('Invalid EPUB: missing OPF file')
	const opfDoc = new DOMParser().parseFromString(opfXml, 'text/xml')
	const opfDir = opfPath.includes('/')
		? opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
		: ''

	// Build manifest map: id -> href
	const manifest = new Map<string, string>()
	const items = opfDoc.getElementsByTagName('item')
	for (let i = 0; i < items.length; i++) {
		const id = items[i].getAttribute('id')
		const href = items[i].getAttribute('href')
		if (id && href) manifest.set(id, href)
	}

	// Get spine order
	const spineRefs: string[] = []
	const itemrefs = opfDoc.getElementsByTagName('itemref')
	for (let i = 0; i < itemrefs.length; i++) {
		const idref = itemrefs[i].getAttribute('idref')
		if (idref) spineRefs.push(idref)
	}

	// 3. Extract text from each spine item
	const chapterData: { title: string; text: string }[] = []
	for (const idref of spineRefs) {
		const href = manifest.get(idref)
		if (!href) continue
		const filePath = opfDir + decodeURIComponent(href)
		const content = await zip.file(filePath)?.async('text')
		if (!content) continue
		const doc = new DOMParser().parseFromString(
			content,
			'application/xhtml+xml',
		)
		const body = doc.getElementsByTagName('body')[0]
		if (!body) continue
		const text = extractText(body).replace(/\n{3,}/g, '\n\n').trim()
		if (!text) continue

		const fallbackName = href.replace(/.*\//, '').replace(/\.\w+$/, '')
		const title = extractChapterTitle(doc, fallbackName)
		chapterData.push({ title, text })
	}

	// 4. Compute chapter word indices by tokenizing each chapter
	const chapters: Chapter[] = []
	const texts: string[] = []
	let wordOffset = 0

	for (const ch of chapterData) {
		chapters.push({ title: ch.title, startIdx: wordOffset })
		const { words } = tokenize(ch.text)
		wordOffset += words.length
		texts.push(ch.text)
	}

	return { text: texts.join('\n\n'), chapters }
}
