/**
 * Extract clean, full text from a PDF File or ArrayBuffer.
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  // Strategy 1: Dynamic client-side PDF.js text extraction
  if (typeof window !== "undefined") {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.0.379"}/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item: any) => item.str)
          .filter((s: string) => s && s.trim().length > 0);
        fullText += pageStrings.join(" ") + "\n";
      }

      const cleaned = fullText.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
      if (cleaned.length > 20) {
        return cleaned;
      }
    } catch (err) {
      console.warn("PDF.js extraction warning, falling back to stream parsing:", err);
    }
  }

  // Strategy 2: Robust Stream & Token Fallback Parser (extracts Tj, TJ, ET/BT, uncompressed text tokens)
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let raw = "";
    for (let i = 0; i < bytes.length; i++) {
      const charCode = bytes[i];
      if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
        raw += String.fromCharCode(charCode);
      }
    }

    const textParts: string[] = [];

    // Match (string) Tj
    const tjMatches = raw.match(/\(([^()]{2,})\)\s*Tj/g);
    if (tjMatches) {
      tjMatches.forEach((m) => {
        const inner = m.replace(/^\(/, "").replace(/\)\s*Tj$/, "");
        if (inner.trim().length > 1) {
          textParts.push(inner.trim());
        }
      });
    }

    // Match [(string) ... ] TJ
    const tjArrayMatches = raw.match(/\[([^\]]+)\]\s*TJ/g);
    if (tjArrayMatches) {
      tjArrayMatches.forEach((m) => {
        const strings = m.match(/\(([^()]+)\)/g);
        if (strings) {
          const joined = strings.map((s) => s.slice(1, -1)).join("");
          if (joined.trim().length > 1) {
            textParts.push(joined.trim());
          }
        }
      });
    }

    // Match raw text inside BT ... ET text blocks
    const btMatches = raw.match(/BT[\s\S]*?ET/g);
    if (btMatches) {
      btMatches.forEach((bt) => {
        const strMatches = bt.match(/\(([^()]{2,})\)/g);
        if (strMatches) {
          strMatches.forEach((s) => {
            const inner = s.slice(1, -1).trim();
            if (inner.length > 1 && !textParts.includes(inner)) {
              textParts.push(inner);
            }
          });
        }
      });
    }

    const fallbackResult = textParts.join(" ").replace(/\s+/g, " ").trim();
    if (fallbackResult.length > 15) {
      return fallbackResult;
    }
  } catch (err) {
    console.warn("Stream token fallback failed:", err);
  }

  return "";
}
