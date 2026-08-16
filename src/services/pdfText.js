import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const MAX_PAGES = 40
const MAX_CHARACTERS = 60000

export async function extractPdfText(file, onProgress) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  const pageLimit = Math.min(pdf.numPages, MAX_PAGES)
  const pages = []

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text) pages.push(`Page ${pageNumber}\n${text}`)
    onProgress?.(Math.round((pageNumber / pageLimit) * 100))

    if (pages.join('\n\n').length >= MAX_CHARACTERS) break
  }

  const text = pages.join('\n\n').slice(0, MAX_CHARACTERS)
  if (text.replace(/Page \d+/g, '').trim().length < 80) {
    throw new Error('This PDF appears to contain scanned images. Please upload a text-based PDF for now.')
  }

  return { text, pages: pdf.numPages, processedPages: pageLimit }
}
