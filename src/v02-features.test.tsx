import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { DERIVED_GEOMETRY, PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";

describe("WindowFit V0.2 Sprint Goals Comprehensive Suite", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => undefined);
  });

  it("1. German default: renders German UI text on initial load", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Adresse dort, wo das Fenster ist.");
    expect(screen.getByText("A4 · Deutscher Fensterbrief-Aufbau")).toBeInTheDocument();
    expect(screen.getByLabelText("Empfängeradresse")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Testseite" })).toBeInTheDocument();
  });

  it("2. English switch: toggles to English without reload or network", () => {
    render(<App />);
    const enBtn = screen.getByRole("button", { name: "EN" });
    fireEvent.click(enBtn);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Put the address where the window is.");
    expect(screen.getByText("A4 · German window-letter layout")).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test page" })).toBeInTheDocument();
  });

  it("3. Language switching does not alter geometry variables", () => {
    const varsDe = printGeometryCssVariables();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    const varsEn = printGeometryCssVariables();

    expect(varsDe).toEqual(varsEn);
    expect(varsEn["--address-field-left-mm"]).toBe("20mm");
    expect(varsEn["--address-field-top-mm"]).toBe("45mm");
    expect(varsEn["--address-field-width-mm"]).toBe("85mm");
    expect(varsEn["--additional-zone-height-mm"]).toBe("17.7mm");
    expect(varsEn["--recipient-zone-top-mm"]).toBe("62.7mm");
    expect(varsEn["--recipient-zone-height-mm"]).toBe("27.3mm");
    expect(varsEn["--text-inset-left-mm"]).toBe("5mm");
    expect(varsEn["--calibration-length-mm"]).toBe("100mm");
  });

  it("4. Window visualization is screen-only and does not appear in print DOM", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel\nBerlin" } });

    expect(document.querySelector(".screen-guide-window")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/fensterposition anzeigen/i));

    const previewGuide = document.querySelector(".preview-scale .screen-guide-window");
    expect(previewGuide).toBeInTheDocument();
    expect(previewGuide).toHaveClass("no-print");

    const printGuide = document.querySelector(".print-only .screen-guide-window");
    expect(printGuide).not.toBeInTheDocument();
  });

  it("5. Fold guidance is screen-only and does not appear in print DOM", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel\nBerlin" } });

    expect(document.querySelector(".screen-guide-folds")).not.toBeInTheDocument();
    expect(document.querySelector(".fold-guide-card")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/falthilfe anzeigen/i));

    const previewFolds = document.querySelector(".preview-scale .screen-guide-folds");
    expect(previewFolds).toBeInTheDocument();
    expect(previewFolds).toHaveClass("no-print");

    const foldCard = document.querySelector(".fold-guide-card");
    expect(foldCard).toBeInTheDocument();
    expect(foldCard?.closest(".no-print")).toBeInTheDocument();

    const printFolds = document.querySelector(".print-only .screen-guide-folds");
    expect(printFolds).not.toBeInTheDocument();
  });

  it("6. Existing address-only print mode remains intact", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), {
      target: { value: "Musterfirma\nPostfach 1234\n10115 Berlin" },
    });
    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), { target: { value: "Absender GmbH" } });

    const printDoc = document.querySelector(".print-only .print-document--address")!;
    expect(printDoc).toBeInTheDocument();
    expect(printDoc.querySelector(".sender-text")?.textContent).toBe("Absender GmbH");
    expect(printDoc.querySelector(".recipient-text")?.textContent).toBe("Musterfirma\nPostfach 1234\n10115 Berlin");
    expect(printDoc.querySelector(".letter-body-flow")).not.toBeInTheDocument();
  });

  it("7. Optional letter mode is hidden by default", () => {
    render(<App />);
    expect(screen.queryByLabelText(/ort und datum/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/betreff/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/brieftext/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Brieftext hinzufügen" })).toBeInTheDocument();
  });

  it("8. Letter mode can be activated via toggle button", () => {
    render(<App />);
    const toggleBtn = screen.getByRole("button", { name: "+ Brieftext hinzufügen" });
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/ort und datum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/betreff/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brieftext/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "− Brieftext ausblenden" })).toBeInTheDocument();
  });

  it("9. Letter content appears in print document with right-aligned place/date", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Empfänger Name\nStraße 1\n12345 Ort" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));

    fireEvent.change(screen.getByLabelText(/ort und datum/i), { target: { value: "Frankfurt am Main, 31.08.2026" } });
    fireEvent.change(screen.getByLabelText(/betreff/i), { target: { value: "Wichtige Mitteilung" } });
    fireEvent.change(screen.getByLabelText(/brieftext/i), {
      target: { value: "Sehr geehrte Damen und Herren,\n\ndies ist der Inhalt." },
    });

    const printDoc = document.querySelector(".print-only .print-document--address")!;
    expect(printDoc.querySelector(".letter-place-date")?.textContent).toBe("Frankfurt am Main, 31.08.2026");
    expect(printDoc.querySelector(".letter-subject")?.textContent).toBe("Wichtige Mitteilung");
    expect(printDoc.querySelector(".letter-text")?.textContent).toContain("dies ist der Inhalt.");
  });

  it("9b. Place and date value survives DE/EN UI switching without loss", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    const placeDateInput = screen.getByLabelText(/ort und datum/i);
    fireEvent.change(placeDateInput, { target: { value: "München, 01.09.2026" } });

    // Switch to English
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    const enInput = screen.getByLabelText(/place and date/i) as HTMLInputElement;
    expect(enInput.value).toBe("München, 01.09.2026");

    // Switch back to German
    fireEvent.click(screen.getByRole("button", { name: "DE" }));
    const deInput = screen.getByLabelText(/ort und datum/i) as HTMLInputElement;
    expect(deInput.value).toBe("München, 01.09.2026");
  });

  it("10. Letter content starts safely below protected address region (>= 90 mm from top)", () => {
    expect(DERIVED_GEOMETRY.addressFieldHeightMm).toBe(45);
    const addressFieldBottom = PRINT_GEOMETRY.addressField.topMm + DERIVED_GEOMETRY.addressFieldHeightMm;
    expect(addressFieldBottom).toBe(90);
    expect(DERIVED_GEOMETRY.letterContentTopMm).toBeGreaterThanOrEqual(90);
    expect(DERIVED_GEOMETRY.letterContentTopMm).toBe(103);
  });

  it("11. Recipient six-line limit remains intact in both languages", () => {
    render(<App />);
    const recipientInput = screen.getByLabelText("Empfängeradresse");
    fireEvent.change(recipientInput, { target: { value: "1\n2\n3\n4\n5\n6" } });
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeEnabled();

    fireEvent.change(recipientInput, { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/6 empfängerzeilen/i);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByRole("status")).toHaveTextContent(/up to 6 recipient lines/i);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
  });

  it("12. Test page remains intact and renders layout guides", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Testseite" }));

    const testDoc = document.querySelector(".print-only .print-document--test")!;
    expect(testDoc.querySelector(".test-field-guide")).toBeInTheDocument();
    expect(testDoc.querySelector(".test-recipient-guide")).toBeInTheDocument();
  });

  it("13. 100 mm calibration line remains intact in test page", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Testseite" }));
    const testDoc = document.querySelector(".print-only .print-document--test")!;
    expect(testDoc.querySelector(".calibration-line")).toBeInTheDocument();
    expect(testDoc).toHaveTextContent("100 mm");
  });

  it("14. No address, place/date, or letter content persistence in localStorage or sessionStorage", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Secret Address" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    fireEvent.change(screen.getByLabelText(/ort und datum/i), { target: { value: "Dieburg, 31.08.2026" } });
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: "Secret Body Text" } });

    expect(window.localStorage.getItem("recipient")).toBeNull();
    expect(window.localStorage.getItem("placeDate")).toBeNull();
    expect(window.localStorage.getItem("letterText")).toBeNull();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("15. No external content transmission or external scripts", () => {
    render(<App />);
    expect(document.querySelectorAll("link[href^='http'], script[src^='http']")).toHaveLength(0);
  });

  it("16. Single page layout renders cleanly for short letters", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma A\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    fireEvent.change(screen.getByLabelText(/ort und datum/i), { target: { value: "Berlin, 01.09.2026" } });
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: "Kurzer Text auf einer Seite." } });

    const printDoc = document.querySelector(".print-only .print-document--address")!;
    expect(printDoc).toHaveClass("print-document");
  });

  it("17. Content allocation: preserves entire multi-paragraph letter text in print DOM without truncation (Note: physical print pagination is verified via CDP PDF tests)", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Firma A\nStr. 1\n12345 Stadt" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));

    const longText = Array.from({ length: 50 }, (_, i) => `Absatz ${i + 1}: Dies ist ein langer Fließtext für Mehrseiten-Briefe.`).join("\n\n");
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: longText } });

    const printDoc = document.querySelector(".print-only .print-document--address")!;
    const content = printDoc.querySelector(".letter-text")?.textContent;
    expect(content).toContain("Absatz 1:");
    expect(content).toContain("Absatz 25:");
    expect(content).toContain("Absatz 50:");
  });

  it("18. No UI controls in print output", () => {
    render(<App />);
    const printOnly = document.querySelector(".print-only")!;
    expect(printOnly.querySelector("button")).not.toBeInTheDocument();
    expect(printOnly.querySelector("input")).not.toBeInTheDocument();
    expect(printOnly.querySelector("textarea")).not.toBeInTheDocument();
    expect(printOnly.querySelector(".lang-switch")).not.toBeInTheDocument();
    expect(printOnly.querySelector(".guide-toggles")).not.toBeInTheDocument();
  });

  it("19. Live preview renders separate sheet viewports with deterministic pagination wrappers", () => {
    render(<App />);
    const previewScale = document.querySelector(".preview-scale");
    expect(previewScale).toBeInTheDocument();
    const sheets = document.querySelectorAll(".preview-sheet-wrapper");
    expect(sheets.length).toBeGreaterThanOrEqual(1);

    const firstViewport = sheets[0].querySelector(".preview-sheet-viewport");
    expect(firstViewport).toBeInTheDocument();
    const firstContent = sheets[0].querySelector(".preview-sheet-content");
    expect(firstContent).toBeInTheDocument();
  });

  it("20. Offscreen print measurement container is marked no-print", () => {
    render(<App />);
    const measureNode = document.querySelector(".print-measure");
    expect(measureNode).toBeInTheDocument();
    expect(measureNode).toHaveClass("no-print");
    expect(measureNode).toHaveAttribute("aria-hidden", "true");
  });
});