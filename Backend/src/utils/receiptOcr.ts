import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface UntypedReceiptFile {
  name?: string | null;
  type?: string | null;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface ExtractTextResult {
  text: string;
  method: "pdf-text-layer" | "raw-text";
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function looksLikeTextBuffer(buffer: Uint8Array): boolean {
  const sample = buffer.subarray(0, 800);
  let controlBytes = 0;
  for (const byte of sample) {
    if (byte === 0) continue;
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) controlBytes += 1;
  }
  return controlBytes === 0;
}

export async function extractTextFromReceipt(
  file: UntypedReceiptFile,
): Promise<ExtractTextResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error("Receipt exceeds 10MB upload limit"), { status: 413 });
  }

  const name = (file.name ?? "").toLowerCase();
  const mime = (file.type ?? "").toLowerCase();
  const isPdf = name.endsWith(".pdf") || mime === "application/pdf";

  if (isPdf) {
    const raw = await file.arrayBuffer();
    const loadingTask = getDocument({ data: new Uint8Array(raw) });
    const pdf = await loadingTask.promise;
    let text = "";
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        if (content.items?.length) {
          for (const item of content.items) {
            if ("str" in item && typeof item.str === "string") {
              text += item.str;
              text += " ";
            }
          }
          text += "\n";
        }
      }
    } finally {
      await loadingTask.destroy().catch(() => undefined);
    }
    const trimmed = text.trim();
    if (!trimmed) {
      throw Object.assign(
        new Error("PDF has no extractable text layer — upload a clearer scan or a text export"),
        { status: 422 },
      );
    }
    return { text: trimmed, method: "pdf-text-layer" };
  }

  const raw = await file.arrayBuffer();
  const bytes = new Uint8Array(raw);
  const isPdfContent =
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  if (isPdfContent) {
    return extractTextFromReceipt({ ...file, name: "receipt.pdf", type: "application/pdf" });
  }

  if (!looksLikeTextBuffer(bytes)) {
    throw Object.assign(
      new Error("Unrecognized file format — upload a PDF, image, or a text/CSV export"),
      { status: 415 },
    );
  }

  const text = new TextDecoder("utf-8").decode(bytes).trim();
  if (!text) {
    throw Object.assign(new Error("Uploaded file is empty"), { status: 422 });
  }
  return { text, method: "raw-text" };
}
