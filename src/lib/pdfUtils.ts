import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import type Tesseract from 'tesseract.js'; // Only import type for Tesseract

// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Dynamically import tesseract.js only on the client-side
async function getTesseract(): Promise<typeof Tesseract | null> {
  if (typeof window !== 'undefined') {
    const TesseractModule = await import('tesseract.js');
    return TesseractModule.default;
  }
  return null;
}

const MIN_TEXT_CONTENT_LENGTH_PER_PAGE = 50; // Characters to consider a page non-empty

async function ocrPageWithTesseract(imageBuffer: ArrayBuffer | string, lang: string = 'eng'): Promise<string> {
  const Tesseract = await getTesseract();
  if (!Tesseract) {
    throw new Error("Tesseract.js is not available in this environment.");
  }
  
  // It's good practice to create a new worker for each page if memory is a concern,
  // or reuse a single worker if processing many pages sequentially and quickly.
  // For simplicity and to ensure clean state, creating a new worker.
  const worker = await Tesseract.createWorker(lang);
  try {
    const { data: { text } } = await worker.recognize(imageBuffer as any); // Use `any` if imageBuffer type conflicts, Tesseract types can be specific
    return text;
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const lowTextContentPages: number[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageText = textContent.items.map((item: any) => item.str).join(' ');

    if (pageText.trim().length < MIN_TEXT_CONTENT_LENGTH_PER_PAGE) {
      console.warn(`Page ${i}: Low text content (${pageText.trim().length} chars). Attempting OCR.`);
      try {
        const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better OCR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imageDataUrl = canvas.toDataURL('image/png'); // PNG is generally good for OCR
            const ocrText = await ocrPageWithTesseract(imageDataUrl);
            
            if (ocrText.trim().length > pageText.trim().length) {
                console.log(`Page ${i}: OCR successful, extracted ${ocrText.trim().length} chars.`);
                pageText = ocrText;
                fullText += `\n\n--- Page ${i} (OCR Extracted) ---\n${pageText}\n`;
            } else {
                console.warn(`Page ${i}: OCR did not yield more text than direct extraction. Using direct text.`);
                fullText += `\n\n--- Page ${i} ---\n${pageText}\n`; // Still add the original text
            }
        } else {
          throw new Error('Failed to get canvas context');
        }
      } catch (ocrError: any) {
        console.error(`Page ${i}: OCR failed. Error: ${ocrError.message}. Falling back to original text content (if any).`);
        lowTextContentPages.push(i);
        fullText += `\n\n--- Page ${i} (OCR Failed) ---\n${pageText}\n`; // Add original text as fallback
      }
    } else {
      fullText += `\n\n--- Page ${i} ---\n${pageText}\n`;
    }
  }

  if (lowTextContentPages.length > 0) {
    console.warn(`OCR was attempted on pages: ${lowTextContentPages.join(', ')} due to low initial text content. Check console for success/failure per page.`);
  }

  return fullText.trim();
}
