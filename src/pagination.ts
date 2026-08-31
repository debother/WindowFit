export function paginateLetterContent(
  letterText: string,
  placeDate?: string,
  subject?: string,
  options?: {
    page1MaxHeightMm?: number;
    continuationMaxHeightMm?: number;
    mmToPx?: (mm: number) => number;
  }
): string[] {
  if (!letterText || !letterText.trim()) {
    return [""];
  }

  const p1MaxMm = options?.page1MaxHeightMm ?? 174; // 297 - 103 - 20
  const pContMaxMm = options?.continuationMaxHeightMm ?? 257; // 297 - 20 - 20
  const pxPerMm = typeof window !== "undefined" && window.document ? 96 / 25.4 : 3.78;

  const p1MaxPx = p1MaxMm * pxPerMm;
  const pContMaxPx = pContMaxMm * pxPerMm;

  // If we have a real browser DOM with measurement capability
  if (typeof document !== "undefined" && document.body) {
    const measureContainer = document.createElement("div");
    measureContainer.className = "letter-body-flow";
    measureContainer.style.position = "absolute";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.left = "-99999px";
    measureContainer.style.top = "0";
    measureContainer.style.width = "210mm";
    measureContainer.style.paddingTop = "0";
    measureContainer.style.paddingBottom = "0";
    measureContainer.style.boxSizing = "border-box";
    document.body.appendChild(measureContainer);

    let headerPx = 0;
    if (placeDate || subject) {
      const hDiv = document.createElement("div");
      if (placeDate) {
        const pd = document.createElement("div");
        pd.className = "letter-place-date";
        pd.textContent = placeDate;
        hDiv.appendChild(pd);
      }
      if (subject) {
        const sub = document.createElement("div");
        sub.className = "letter-subject";
        sub.textContent = subject;
        hDiv.appendChild(sub);
      }
      measureContainer.appendChild(hDiv);
      headerPx = hDiv.offsetHeight;
      measureContainer.removeChild(hDiv);
    }

    const testBlock = document.createElement("div");
    testBlock.className = "letter-text";
    measureContainer.appendChild(testBlock);

    // Test if DOM measurement actually gives non-zero heights (in jsdom it might be 0)
    testBlock.textContent = "Test";
    const hasRealLayout = testBlock.offsetHeight > 0;

    if (hasRealLayout) {
      const page1AvailPx = Math.max(0, p1MaxPx - headerPx);
      const pages: string[] = [];
      const paragraphs = letterText.split("\n");
      let curPageLines: string[] = [];
      let curMaxPx = page1AvailPx;

      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const candidate = (curPageLines.length > 0 ? curPageLines.join("\n") + "\n" : "") + para;
        testBlock.textContent = candidate;
        const h = testBlock.offsetHeight;

        if (h <= curMaxPx) {
          curPageLines.push(para);
        } else {
          // Check if breaking words in this paragraph allows part of it on the current page
          const words = para.split(" ");
          if (words.length > 1) {
            const fittedWords: string[] = [];
            const remainingWords: string[] = [...words];

            for (let w = 0; w < words.length; w++) {
              const wordCandidate =
                (curPageLines.length > 0 ? curPageLines.join("\n") + "\n" : "") +
                (fittedWords.length > 0 ? fittedWords.join(" ") + " " : "") +
                words[w];
              testBlock.textContent = wordCandidate;
              if (testBlock.offsetHeight <= curMaxPx) {
                fittedWords.push(words[w]);
                remainingWords.shift();
              } else {
                break;
              }
            }

            if (fittedWords.length > 0) {
              curPageLines.push(fittedWords.join(" "));
              pages.push(curPageLines.join("\n"));
              curPageLines = [];
              curMaxPx = pContMaxPx;
              paragraphs.splice(i + 1, 0, remainingWords.join(" "));
              continue;
            }
          }

          // If nothing fit or it was a single word, push current page and start next page
          if (curPageLines.length > 0) {
            pages.push(curPageLines.join("\n"));
            curPageLines = [para];
            curMaxPx = pContMaxPx;
          } else {
            // Even an empty page cannot fit this single line: must put it on current page to prevent infinite loop
            curPageLines.push(para);
            pages.push(curPageLines.join("\n"));
            curPageLines = [];
            curMaxPx = pContMaxPx;
          }
        }
      }

      if (curPageLines.length > 0) {
        pages.push(curPageLines.join("\n"));
      }

      measureContainer.removeChild(testBlock);
      document.body.removeChild(measureContainer);
      return pages.length > 0 ? pages : [""];
    }

    measureContainer.removeChild(testBlock);
    document.body.removeChild(measureContainer);
  }

  // Fallback (e.g. for JSDOM or SSR where layout engine doesn't compute heights):
  // 1 line ≈ 75 characters at 11pt, line height = 5.82mm
  // Header: ~20mm if present
  const headerMm = (placeDate ? 8 : 0) + (subject ? 12 : 0);
  const p1AvailMm = Math.max(20, p1MaxMm - headerMm);
  const linesPerPage1 = Math.floor(p1AvailMm / 5.82);
  const linesPerPageCont = Math.floor(pContMaxMm / 5.82);

  const rawLines = letterText.split("\n");
  const expandedLines: string[] = [];
  for (const raw of rawLines) {
    if (raw.length === 0) {
      expandedLines.push("");
    } else {
      let remaining = raw;
      while (remaining.length > 75) {
        let breakIdx = remaining.lastIndexOf(" ", 75);
        if (breakIdx <= 0) breakIdx = 75;
        expandedLines.push(remaining.substring(0, breakIdx));
        remaining = remaining.substring(breakIdx).trimStart();
      }
      expandedLines.push(remaining);
    }
  }

  const pages: string[] = [];
  let curLines: string[] = [];
  let curLimit = linesPerPage1;

  for (const line of expandedLines) {
    if (curLines.length < curLimit) {
      curLines.push(line);
    } else {
      pages.push(curLines.join("\n"));
      curLines = [line];
      curLimit = linesPerPageCont;
    }
  }

  if (curLines.length > 0 || pages.length === 0) {
    pages.push(curLines.join("\n"));
  }

  return pages;
}