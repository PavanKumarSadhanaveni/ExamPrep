
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

async function ocrPageWithTesseract(imageBuffer: ArrayBuffer | string, lang: string = 'eng+tel+hin'): Promise<string> {
  const Tesseract = await getTesseract();
  if (!Tesseract) {
    throw new Error("Tesseract.js is not available in this environment.");
  }
  
  // Using a more inclusive default language set: English, Telugu, Hindi.
  // Tesseract.js will attempt to load these. Ensure your environment can access these language packs.
  // For tesseract.js, language codes are typically 3-letter ISO 639-2 codes.
  // 'tel' for Telugu, 'hin' for Hindi.
  const worker = await Tesseract.createWorker(lang);
  try {
    const { data: { text } } = await worker.recognize(imageBuffer as any); // Use `any` if imageBuffer type conflicts
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
    
    // Direct text extraction from pdfjs-dist
    let pageText = textContent.items.map((item: any) => (item as any).str).join(' ');


    if (pageText.trim().length < MIN_TEXT_CONTENT_LENGTH_PER_PAGE) {
      console.warn(`Page ${i}: Low text content (${pageText.trim().length} chars) from direct extraction. Attempting OCR.`);
      try {
        const viewport = page.getViewport({ scale: 2.0 }); // Increased scale for better OCR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imageDataUrl = canvas.toDataURL('image/png'); // PNG is generally good for OCR
            
            // OCR will now use 'eng+tel+hin' by default if this path is taken
            const ocrText = await ocrPageWithTesseract(imageDataUrl); 
            
            if (ocrText.trim().length > pageText.trim().length) {
                console.log(`Page ${i}: OCR provided more text (${ocrText.trim().length} chars) than direct extraction. Using OCR text.`);
                pageText = ocrText; // Replace pageText with OCR output if it's better
                fullText += `\n\n--- Page ${i} (OCR Extracted) ---\n${pageText}\n`;
            } else {
                console.warn(`Page ${i}: OCR did not yield significantly more text. Sticking with direct extraction result (if any). Original direct: ${pageText.trim().length}, OCR: ${ocrText.trim().length}`);
                fullText += `\n\n--- Page ${i} (Direct Text, OCR less effective) ---\n${pageText}\n`;
            }
        } else {
          console.error(`Page ${i}: Failed to get canvas context for OCR.`);
          fullText += `\n\n--- Page ${i} (Direct Text, Canvas fail) ---\n${pageText}\n`;
        }
      } catch (ocrError: any) {
        console.error(`Page ${i}: OCR attempt failed. Error: ${ocrError.message}. Falling back to original direct text content (if any).`);
        lowTextContentPages.push(i);
        fullText += `\n\n--- Page ${i} (Direct Text, OCR Error) ---\n${pageText}\n`; // Add original text as fallback
      }
    } else {
      // Sufficient text from direct extraction
      fullText += `\n\n--- Page ${i} (Direct Text) ---\n${pageText}\n`;
    }
  }

  if (lowTextContentPages.length > 0) {
    console.warn(`OCR was attempted on pages: ${lowTextContentPages.join(', ')} due to low initial text content. Check console for success/failure per page.`);
  }

  // The AI flows will receive this fullText. Prompts should be robust enough
  // to handle the page separators or they can be removed/normalized before sending to AI.
  return fullText.trim();
}
