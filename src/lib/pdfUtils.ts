// NOTE: This file uses 'pdfjs-dist'. Ensure it's added to your project's dependencies:
// npm install pdfjs-dist
// or yarn add pdfjs-dist
// pdfjs-dist v3+ ships with its own types, so @types/pdfjs-dist is usually not needed.

// Due to Next.js dynamic import behavior with worker files, using a stable CDN link for the worker.
// In a production app, you'd typically copy the worker file to your public directory.
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
// For Next.js, it's better to set workerSrc like this if you copy the worker to public folder
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Set workerSrc to load from CDN. This should be done in client-side code.
// The version in the URL should match the installed pdfjs-dist version.
if (typeof window !== 'undefined') {
    // Using unpkg as a CDN example.
    // Ensure pdfjsLib.version is available; it's part of the pdfjsLib object.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}


export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Typings for getDocument and PDFDocumentProxy are available from pdfjs-dist
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // textContent.items is an array of TextItem, which has a 'str' property
    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return fullText.trim();
}
