import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { DERIVED_GEOMETRY, PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";
import { hasVisualOverflow, recipientHasTooManyExplicitLines } from "./validation";

function setOverflow(
  element: Element,
  dimensions: { scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }
) {
  for (const [property, value] of Object.entries(dimensions)) {
    Object.defineProperty(element, property, { configurable: true, value });
  }
}

describe("WindowFit V0.1 protected baseline & V0.2 extensions", () => {
  it("keeps the confirmed two-zone geometry and its arithmetic invariants", () => {
    expect(PRINT_GEOMETRY.paper).toEqual({ widthMm: 210, heightMm: 297 });
    expect(PRINT_GEOMETRY.addressField).toEqual({ leftMm: 20, topMm: 45, widthMm: 85, heightMm: 45 });
    expect(PRINT_GEOMETRY.additionalZone.heightMm).toBe(17.7);
    expect(PRINT_GEOMETRY.recipientZone.heightMm).toBe(27.3);
    expect(PRINT_GEOMETRY.text.leftMm).toBe(25);
    expect(PRINT_GEOMETRY.calibrationLineMm).toBe(100);
    expect(DERIVED_GEOMETRY.recipientZoneTopMm).toBe(62.7);
    expect(DERIVED_GEOMETRY.addressFieldHeightMm).toBe(45);
    expect(DERIVED_GEOMETRY.textInsetLeftMm).toBe(5);
    expect(PRINT_GEOMETRY.addressField.topMm + PRINT_GEOMETRY.additionalZone.heightMm).toBe(62.7);
    expect(PRINT_GEOMETRY.additionalZone.heightMm + PRINT_GEOMETRY.recipientZone.heightMm).toBe(45);
    expect(PRINT_GEOMETRY.text.leftMm - PRINT_GEOMETRY.addressField.leftMm).toBe(5);
  });

  it("exports the corrected print geometry variables including letter flow top", () => {
    const vars = printGeometryCssVariables();
    expect(vars["--address-field-left-mm"]).toBe("20mm");
    expect(vars["--address-field-top-mm"]).toBe("45mm");
    expect(vars["--recipient-zone-top-mm"]).toBe("62.7mm");
    expect(vars["--text-inset-left-mm"]).toBe("5mm");
    expect(vars["--calibration-length-mm"]).toBe("100mm");
    expect(vars["--letter-content-top-mm"]).toBe("103mm");
    expect(Object.values(vars)).not.toContain("62.5mm");
    expect(Object.values(vars)).not.toContain("8.85mm");
  });

  it("defaults to German UI and allows switching to English", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Adresse dort, wo das Fenster ist.");
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeInTheDocument();
    expect(screen.getByLabelText("Empfängeradresse")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Put the address where the window is.");
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient address")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "DE" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Adresse dort, wo das Fenster ist.");
  });

  it("blocks empty recipient output and never puts the UI placeholder in print DOM", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/empfängeradresse/i);
    expect(document.querySelector(".print-only .recipient-text")).not.toBeInTheDocument();
    expect(document.querySelector(".print-only")).not.toHaveTextContent("Empfängeradresse");
  });

  it("preserves recipient text literally and blocks more than six explicit lines", () => {
    render(<App />);
    const text = " Ada  Beispiel \nÄpfelstraße 7\n12345 Köln";
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: text } });
    expect(document.querySelector(".recipient-text")?.textContent).toBe(text);
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(screen.getByRole("status")).toHaveTextContent(/6 empfängerzeilen/i);
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeDisabled();
    expect(document.querySelector(".recipient-text")?.textContent).toBe("1\n2\n3\n4\n5\n6\n7");
  });

  it("uses measured visual overflow as a block without changing recipient content", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Eine kurze Zeile" } });
    const measured = document.querySelector(".preview-scale .recipient-text")!;
    setOverflow(measured, { scrollWidth: 81, clientWidth: 80, scrollHeight: 10, clientHeight: 27 });
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Eine absichtlich zu lange Zeile" } });
    expect(screen.getByRole("status")).toHaveTextContent(/empfängerzeile ist zu lang/i);
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeDisabled();
    expect(measured.textContent).toBe("Eine absichtlich zu lange Zeile");
  });

  it("keeps sender separate, optional and blocks its measured overflow", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel" } });
    expect(document.querySelectorAll(".sender-text")).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), {
      target: { value: "Ada Beispiel · Rücksendeangabe" },
    });
    expect(document.querySelector(".sender-text")?.textContent).toBe("Ada Beispiel · Rücksendeangabe");

    const measured = document.querySelector(".preview-scale .sender-text")!;
    setOverflow(measured, { scrollWidth: 81, clientWidth: 80, scrollHeight: 10, clientHeight: 17 });
    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), {
      target: { value: "Eine absichtlich zu lange Zusatzzeile" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(/zusatzzeile ist zu lang/i);
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeDisabled();
    expect(measured.textContent).toBe("Eine absichtlich zu lange Zusatzzeile");
  });

  it("keeps sender and recipient in separate printed zones", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel" } });
    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), { target: { value: "Rücksendezeile" } });
    const address = document.querySelector(".print-only .address-content")!;
    expect(address.querySelector(".additional-zone .sender-text")?.textContent).toBe("Rücksendezeile");
    expect(address.querySelector(".recipient-zone .recipient-text")?.textContent).toBe("Ada Beispiel");
  });

  it("allows six recipient lines and a fitting sender because their zones are separate", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "1\n2\n3\n4\n5\n6" } });
    fireEvent.change(screen.getByLabelText(/absender oder zusatzzeile/i), { target: { value: "Rücksendezeile" } });
    expect(screen.getByRole("button", { name: "Drucken / PDF" })).toBeEnabled();
  });

  it("isolates native test-page printing from normal address output", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Testseite" }));
    expect(print).toHaveBeenCalledTimes(1);
    const testDocument = document.querySelector(".print-only .print-document--test")!;
    const fieldGuide = testDocument.querySelector(":scope > .test-field-guide")!;
    const recipientGuide = testDocument.querySelector(":scope > .test-recipient-guide")!;
    expect(fieldGuide).toBeInTheDocument();
    expect(recipientGuide).toBeInTheDocument();
    expect(fieldGuide.parentElement).toBe(testDocument);
    expect(recipientGuide.parentElement).toBe(testDocument);
    expect(testDocument).toHaveTextContent("Adressfeld");
    expect(testDocument).toHaveTextContent("Empfängerzone");
    expect(testDocument.querySelector(".calibration-line")).toBeInTheDocument();
    vi.unstubAllGlobals();
    print.mockRestore();
  });

  it("provides screen-only envelope window visualization that does not contaminate print output", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel" } });
    expect(document.querySelector(".screen-guide-window")).not.toBeInTheDocument();

    const windowGuideCheckbox = screen.getByLabelText(/fensterposition anzeigen/i);
    fireEvent.click(windowGuideCheckbox);
    expect(document.querySelector(".preview-scale .screen-guide-window")).toBeInTheDocument();
    expect(document.querySelector(".preview-scale .screen-guide-window")).toHaveClass("no-print");
    expect(document.querySelector(".print-only .screen-guide-window")).not.toBeInTheDocument();
  });

  it("provides screen-only folding guidance that does not contaminate print output", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel" } });
    expect(document.querySelector(".screen-guide-folds")).not.toBeInTheDocument();
    expect(document.querySelector(".fold-guide-card")).not.toBeInTheDocument();

    const foldGuideCheckbox = screen.getByLabelText(/falthilfe anzeigen/i);
    fireEvent.click(foldGuideCheckbox);
    expect(document.querySelector(".preview-scale .screen-guide-folds")).toBeInTheDocument();
    expect(document.querySelector(".preview-scale .screen-guide-folds")).toHaveClass("no-print");
    expect(document.querySelector(".fold-guide-card")).toBeInTheDocument();
    expect(document.querySelector(".print-only .screen-guide-folds")).not.toBeInTheDocument();
  });

  it("manages optional letter composition with progressive disclosure and clean print flow below address", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Ada Beispiel\n12345 Stadt" } });

    // Letter fields hidden by default
    expect(screen.queryByLabelText(/betreff/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/brieftext/i)).not.toBeInTheDocument();

    // Toggle open letter composition
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    expect(screen.getByLabelText(/betreff/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brieftext/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/betreff/i), { target: { value: "Kündigung Vertrag 98765" } });
    fireEvent.change(screen.getByLabelText(/brieftext/i), {
      target: { value: "Sehr geehrte Damen und Herren,\n\nhiermit kündige ich fristgerecht." },
    });

    // Content appears in preview and print DOM
    const printDoc = document.querySelector(".print-only .print-document--address")!;
    expect(printDoc.querySelector(".letter-body-flow")).toBeInTheDocument();
    expect(printDoc.querySelector(".letter-subject")).toHaveTextContent("Kündigung Vertrag 98765");
    expect(printDoc.querySelector(".letter-text")).toHaveTextContent("Sehr geehrte Damen und Herren");

    // Address area remains intact and distinct from letter flow
    expect(printDoc.querySelector(".print-address-field")).toBeInTheDocument();
    expect(printDoc.querySelector(".recipient-text")?.textContent).toBe("Ada Beispiel\n12345 Stadt");
  });

  it("keeps overflow detection and explicit line counting deterministic", () => {
    expect(hasVisualOverflow({ scrollWidth: 80, clientWidth: 80, scrollHeight: 27, clientHeight: 27 })).toBe(false);
    expect(hasVisualOverflow({ scrollWidth: 81, clientWidth: 80, scrollHeight: 27, clientHeight: 27 })).toBe(true);
    expect(hasVisualOverflow({ scrollWidth: 80, clientWidth: 80, scrollHeight: 28, clientHeight: 27 })).toBe(true);
    expect(recipientHasTooManyExplicitLines("1\n2\n3\n4\n5\n6", 6)).toBe(false);
    expect(recipientHasTooManyExplicitLines("1\n2\n3\n4\n5\n6\n7", 6)).toBe(true);
  });

  it("does not persist address or letter content in storage or make network calls", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Empfängeradresse"), { target: { value: "Private Address" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Brieftext hinzufügen" }));
    fireEvent.change(screen.getByLabelText(/brieftext/i), { target: { value: "Private Letter" } });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.querySelectorAll("link[href^='http'], script[src^='http']")).toHaveLength(0);
  });
});