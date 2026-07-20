// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { extractEpubContent } from './extractEpubText'

/** Build a minimal EPUB file as a File object */
async function buildEpub(
	chapters: { filename: string; title: string; body: string }[],
): Promise<File> {
	const zip = new JSZip()

	// mimetype
	zip.file('mimetype', 'application/epub+zip')

	// container.xml
	zip.file(
		'META-INF/container.xml',
		`<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
	)

	// Build manifest items and spine refs
	const manifestItems = chapters
		.map(
			(ch, i) =>
				`<item id="ch${i}" href="${ch.filename}" media-type="application/xhtml+xml"/>`,
		)
		.join('\n    ')
	const spineRefs = chapters
		.map((_, i) => `<itemref idref="ch${i}"/>`)
		.join('\n    ')

	// content.opf
	zip.file(
		'OEBPS/content.opf',
		`<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineRefs}
  </spine>
</package>`,
	)

	// XHTML chapter files
	for (const ch of chapters) {
		zip.file(
			`OEBPS/${ch.filename}`,
			`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title}</title></head>
<body>
  ${ch.body}
</body>
</html>`,
		)
	}

	const blob = await zip.generateAsync({ type: 'blob' })
	return new File([blob], 'test.epub', { type: 'application/epub+zip' })
}

describe('extractEpubContent', () => {
	it('extracts text in spine order', async () => {
		const file = await buildEpub([
			{
				filename: 'ch1.xhtml',
				title: 'Chapter One',
				body: '<p>First chapter text.</p>',
			},
			{
				filename: 'ch2.xhtml',
				title: 'Chapter Two',
				body: '<p>Second chapter text.</p>',
			},
		])

		const { text, chapters } = await extractEpubContent(file)

		// Text should contain both chapters in order
		expect(text).toContain('First chapter text.')
		expect(text).toContain('Second chapter text.')
		expect(text.indexOf('First')).toBeLessThan(text.indexOf('Second'))

		// Should have 2 chapters
		expect(chapters).toHaveLength(2)
		expect(chapters[0].title).toBe('Chapter One')
		expect(chapters[1].title).toBe('Chapter Two')
	})

	it('computes correct chapter startIdx values', async () => {
		const file = await buildEpub([
			{
				filename: 'ch1.xhtml',
				title: 'First',
				body: '<p>One two three.</p>',
			},
			{
				filename: 'ch2.xhtml',
				title: 'Second',
				body: '<p>Four five.</p>',
			},
		])

		const { chapters } = await extractEpubContent(file)

		// First chapter starts at 0
		expect(chapters[0].startIdx).toBe(0)
		// Second chapter starts after the words of the first
		expect(chapters[1].startIdx).toBeGreaterThan(0)
	})

	it('preserves paragraph breaks from block elements', async () => {
		const file = await buildEpub([
			{
				filename: 'ch1.xhtml',
				title: 'Test',
				body: '<p>Paragraph one.</p><p>Paragraph two.</p>',
			},
		])

		const { text } = await extractEpubContent(file)

		// Block elements should produce paragraph separation
		expect(text).toMatch(/Paragraph one\.\s+Paragraph two\./)
	})

	it('excludes script and style content', async () => {
		const file = await buildEpub([
			{
				filename: 'ch1.xhtml',
				title: 'Test',
				body: '<style>.foo { color: red; }</style><script>alert("hi")</script><p>Visible text.</p>',
			},
		])

		const { text } = await extractEpubContent(file)

		expect(text).toContain('Visible text.')
		expect(text).not.toContain('color: red')
		expect(text).not.toContain('alert')
	})

	it('extracts chapter title from h1', async () => {
		const file = await buildEpub([
			{
				filename: 'ch1.xhtml',
				title: 'Fallback Title',
				body: '<h1>The Real Title</h1><p>Content.</p>',
			},
		])

		const { chapters } = await extractEpubContent(file)
		expect(chapters[0].title).toBe('The Real Title')
	})

	it('skips empty chapters', async () => {
		const file = await buildEpub([
			{
				filename: 'empty.xhtml',
				title: 'Empty',
				body: '',
			},
			{
				filename: 'ch1.xhtml',
				title: 'Real Chapter',
				body: '<p>Some content here.</p>',
			},
		])

		const { chapters } = await extractEpubContent(file)
		// The empty chapter should be skipped
		expect(chapters).toHaveLength(1)
		expect(chapters[0].title).toBe('Real Chapter')
		expect(chapters[0].startIdx).toBe(0)
	})
})
