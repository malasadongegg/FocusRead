import { strFromU8, unzipSync } from 'fflate'

export interface ImportedText { title: string; text: string; warning?: string }
const MAX_BYTES = 30 * 1024 * 1024
const MAX_EXTRACTED = 100 * 1024 * 1024

function pathFrom(base: string, href: string) {
  const parts = `${base}${decodeURIComponent(href.split('#')[0])}`.split('/')
  const result: string[] = []
  for (const part of parts) if (part === '..') result.pop(); else if (part && part !== '.') result.push(part)
  return result.join('/')
}

export function extractEpub(bytes: Uint8Array): string {
  let extractedBytes = 0
  const entries = unzipSync(bytes, { filter: file => {
    if (!/\.(xml|opf|xhtml|html|htm)$/iu.test(file.name)) return false
    extractedBytes += file.originalSize
    if (extractedBytes > MAX_EXTRACTED) throw new Error('The EPUB expands beyond the import size limit.')
    return true
  } })
  if (Object.values(entries).reduce((size, entry) => size + entry.byteLength, 0) > MAX_EXTRACTED) throw new Error('The EPUB expands beyond the import size limit.')
  const container = entries['META-INF/container.xml']
  if (!container) throw new Error('This EPUB has no package index.')
  const parser = new DOMParser()
  const containerXml = parser.parseFromString(strFromU8(container), 'application/xml')
  const opfPath = containerXml.querySelector('rootfile')?.getAttribute('full-path')
  if (!opfPath || !entries[opfPath]) throw new Error('This EPUB has no readable package file.')
  const opf = parser.parseFromString(strFromU8(entries[opfPath]), 'application/xml')
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const manifest = new Map(Array.from(opf.querySelectorAll('manifest item')).map(item => [item.getAttribute('id'), item.getAttribute('href')]))
  const sections: string[] = []
  for (const item of Array.from(opf.querySelectorAll('spine itemref'))) {
    const href = manifest.get(item.getAttribute('idref'))
    if (!href) continue
    const entry = entries[pathFrom(base, href)]
    if (!entry) continue
    const xml = parser.parseFromString(strFromU8(entry), 'application/xhtml+xml')
    if (xml.querySelector('parsererror')) continue
    const blocks = Array.from(xml.querySelectorAll('h1,h2,h3,h4,p,li,blockquote')).map(element => element.textContent?.replace(/\s+/gu, ' ').trim()).filter(Boolean)
    if (blocks.length) sections.push(blocks.join('\n\n'))
  }
  if (!sections.length) throw new Error('No readable EPUB chapters were found.')
  return sections.join('\n\n\n')
}

export async function importDocument(file: File): Promise<ImportedText> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds the 30 MB import limit.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  const title = file.name.replace(/\.[^.]+$/u, '')
  if (extension === 'txt' || extension === 'md') return { title, text: await file.text() }
  if (extension === 'epub') return { title, text: extractEpub(new Uint8Array(await file.arrayBuffer())) }
  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const pages: string[] = []
    try {
      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number)
        const content = await page.getTextContent()
        let text = ''
        for (const item of content.items) if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ')
        pages.push(text.trim())
      }
    } finally { await document.destroy() }
    const text = pages.filter(Boolean).join('\n\n')
    if (text.trim().split(/\s+/u).length < 10) throw new Error('This PDF has little extractable text. Scanned pages need OCR before reading.')
    return { title, text, warning: 'PDF text extraction may change columns, headings, or reading order. Review the text before starting.' }
  }
  throw new Error('Choose a TXT, Markdown, EPUB, or PDF file.')
}
