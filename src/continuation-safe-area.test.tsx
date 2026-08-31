import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { CONTINUATION_GEOMETRY, DERIVED_GEOMETRY, printGeometryCssVariables } from "./geometry";
import { paginateLetterContent } from "./pagination";

describe("WindowFit V0.2 Continuation Page Safe-Area Suite (Gate 5)", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => undefined);
  });

  it("1. Geometry exports explicit continuation safe area constants (WindowFit layout policy B)", () => {
    expect(CONTINUATION_GEOMETRY.topSafeMm).toBe(20);
    expect(CONTINUATION_GEOMETRY.bottomSafeMm).toBe(20);
    expect(CONTINUATION_GEOMETRY.page1BottomSafeMm).toBe(20);
    expect(DERIVED_GEOMETRY.continuationTopSafeMm).toBe(20);
    expect(DERIVED_GEOMETRY.continuationBottomSafeMm).toBe(20);
    expect(DERIVED_GEOMETRY.continuationContentHeightMm).toBe(257); // 297 - 20 - 20
    expect(DERIVED_GEOMETRY.page1LetterContentHeightMm).toBe(174); // 297 - 103 - 20

    const vars = printGeometryCssVariables();
    expect(vars["--continuation-top-safe-mm"]).toBe("20mm");
    expect(vars["--continuation-bottom-safe-mm"]).toBe("20mm");
    expect(vars["--page1-bottom-safe-mm"]).toBe("20mm");
    expect(vars["--continuation-content-height-mm"]).toBe("257mm");
    expect(vars["--page1-letter-content-height-mm"]).toBe("174mm");
  });

  it("2. Short letter: 1-page document with content ending comfortably on Page 1", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: "Kurzer Text für eine Seite." } });

    const previewSheets = document.querySelectorAll(".preview-sheet-wrapper");
    expect(previewSheets).toHaveLength(1);
    const printPages = document.querySelectorAll(".print-only .print-page");
    expect(printPages).toHaveLength(1);
    expect(printPages[0]).toHaveClass("print-page--first");
  });

  it("3. 2-page document: content fits across exactly 2 pages", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));

    // Generate ~35 lines: ~25 lines on page 1 + ~10 lines on page 2
    const lines = Array.from({ length: 35 }, (_, i) => `Zeile ${i + 1}: Fließtext für Seite 1 und Seite 2.`).join("\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: lines } });

    const previewSheets = document.querySelectorAll(".preview-sheet-wrapper");
    expect(previewSheets).toHaveLength(2);
    const printPages = document.querySelectorAll(".print-only .print-page");
    expect(printPages).toHaveLength(2);
    expect(printPages[0]).toHaveClass("print-page--first");
    expect(printPages[1]).toHaveClass("print-page--continuation");
  });

  it("4. 3-page document: content flows safely across 3 pages", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));

    // Generate ~80 lines: ~25 lines (page 1) + ~44 lines (page 2) + ~11 lines (page 3)
    const lines = Array.from({ length: 80 }, (_, i) => `Zeile ${i + 1}: Fließtext für Dreiseiten-Dokument.`).join("\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: lines } });

    const previewSheets = document.querySelectorAll(".preview-sheet-wrapper");
    expect(previewSheets).toHaveLength(3);
    const printPages = document.querySelectorAll(".print-only .print-page");
    expect(printPages).toHaveLength(3);
  });

  it("5. 4+ page document: content flows safely across 4 or more pages", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));

    const lines = Array.from({ length: 130 }, (_, i) => `Zeile ${i + 1}: Ausführlicher Fließtext für 4+ Seiten.`).join("\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: lines } });

    const previewSheets = document.querySelectorAll(".preview-sheet-wrapper");
    expect(previewSheets.length).toBeGreaterThanOrEqual(4);
    const printPages = document.querySelectorAll(".print-only .print-page");
    expect(printPages.length).toBe(previewSheets.length);
  });

  it("6. Continuation pages (Page 2+) do NOT repeat address, sender, place/date or subject", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Max Empfänger\nMusterweg 5\n54321 Stadt" } });
    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), { target: { value: "Anna Absender · Hauptstr. 1 · 12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    fireEvent.change(screen.getByLabelText(/ort und datum/i), { target: { value: "Frankfurt am Main, 31.08.2026" } });
    fireEvent.change(screen.getByLabelText(/betreff/i), { target: { value: "Wichtiger Vertrag" } });

    const lines = Array.from({ length: 45 }, (_, i) => `Absatz ${i + 1}: Mehrseitiger Briefinhalt.`).join("\n\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: lines } });

    const printPages = document.querySelectorAll(".print-only .print-page");
    expect(printPages.length).toBeGreaterThanOrEqual(2);

    // Page 1 contains address, sender, place/date, subject
    expect(printPages[0].querySelector(".print-address-field")).toBeInTheDocument();
    expect(printPages[0].querySelector(".sender-text")?.textContent).toBe("Anna Absender · Hauptstr. 1 · 12345 Stadt");
    expect(printPages[0].querySelector(".recipient-text")?.textContent).toBe("Max Empfänger\nMusterweg 5\n54321 Stadt");
    expect(printPages[0].querySelector(".letter-place-date")?.textContent).toBe("Frankfurt am Main, 31.08.2026");
    expect(printPages[0].querySelector(".letter-subject")?.textContent).toBe("Wichtiger Vertrag");

    // Page 2+ must NOT contain any of these
    for (let p = 1; p < printPages.length; p++) {
      expect(printPages[p].querySelector(".print-address-field")).not.toBeInTheDocument();
      expect(printPages[p].querySelector(".sender-text")).not.toBeInTheDocument();
      expect(printPages[p].querySelector(".recipient-text")).not.toBeInTheDocument();
      expect(printPages[p].querySelector(".letter-place-date")).not.toBeInTheDocument();
      expect(printPages[p].querySelector(".letter-subject")).not.toBeInTheDocument();
      expect(printPages[p].querySelector(".continuation-body-flow")).toBeInTheDocument();
    }
  });

  it("7. Paragraph spanning boundary preserves entire text without loss or clipping", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Paragraf ${i + 1}: Ungekürzter Fließtext mit wichtigen Details.`).join("\n\n");
    const pages = paginateLetterContent(text, "Ort, Datum", "Betreff");
    const combined = pages.join("\n\n");

    expect(combined).toContain("Paragraf 1:");
    expect(combined).toContain("Paragraf 15:");
    expect(combined).toContain("Paragraf 30:");
  });

  it("8. Sign-off and final lines flow to next page if remaining safe text area is insufficient", () => {
    // Fill Page 1 almost completely, then add sign-off lines
    const fillLines = Array.from({ length: 25 }, (_, i) => `Zeile ${i + 1}`).join("\n");
    const signOff = "\n\nMit freundlichen Grüßen,\nMax Mustermann\nGeschäftsführer";
    const pages = paginateLetterContent(fillLines + signOff, "Ort, Datum", "Betreff");

    expect(pages.length).toBeGreaterThan(1);
    const lastPage = pages[pages.length - 1];
    expect(lastPage).toContain("Mit freundlichen Grüßen");
    expect(lastPage).toContain("Geschäftsführer");
  });

  it("9. Protects human-good print invocation invariant: valid recipient + multi-page letter -> button enabled -> click calls window.print", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    render(<App />);
    const recipientInput = screen.getByLabelText("Empfängeradresse");
    const printBtn = screen.getByRole("button", { name: "Drucken / PDF" });

    // Initial empty -> disabled
    expect(printBtn).toBeDisabled();
    fireEvent.click(printBtn);
    expect(print).not.toHaveBeenCalled();

    // Valid recipient -> enabled -> click calls print
    fireEvent.change(recipientInput, {
      target: { value: "Ada Beispiel\nBeispielstr. 1\n12345 Stadt" },
    });
    expect(printBtn).toBeEnabled();
    fireEvent.click(printBtn);
    expect(print).toHaveBeenCalledTimes(1);

    // Multi-page letter content added -> button remains enabled -> click calls print
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    const longLetter = Array.from({ length: 40 }, (_, i) => `Absatz ${i + 1}: Ausführlicher Fließtext.`).join("\n\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: longLetter } });

    expect(printBtn).toBeEnabled();
    fireEvent.click(printBtn);
    expect(print).toHaveBeenCalledTimes(2);

    // >6 lines recipient -> disabled
    fireEvent.change(recipientInput, { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(printBtn).toBeDisabled();
    fireEvent.click(printBtn);
    expect(print).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
    print.mockRestore();
  });
});