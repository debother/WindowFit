import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { DERIVED_GEOMETRY, PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";
import { hasVisualOverflow, recipientHasTooManyExplicitLines } from "./validation";

function setOverflow(element: Element, dimensions: { scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }) {
  for (const [property, value] of Object.entries(dimensions)) Object.defineProperty(element, property, { configurable: true, value });
}

describe("WindowFit V0.1 remediation", () => {
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

  it("exports only the corrected print geometry variables", () => {
    const vars = printGeometryCssVariables();
    expect(vars["--address-field-left-mm"]).toBe("20mm");
    expect(vars["--address-field-top-mm"]).toBe("45mm");
    expect(vars["--recipient-zone-top-mm"]).toBe("62.7mm");
    expect(vars["--text-inset-left-mm"]).toBe("5mm");
    expect(vars["--calibration-length-mm"]).toBe("100mm");
    expect(Object.values(vars)).not.toContain("62.5mm");
    expect(Object.values(vars)).not.toContain("8.85mm");
  });

  it("blocks empty recipient output and never puts the UI placeholder in print DOM", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/enter a recipient/i);
    expect(document.querySelector(".print-only .recipient-text")).not.toBeInTheDocument();
    expect(document.querySelector(".print-only")).not.toHaveTextContent("Recipient address");
  });

  it("preserves recipient text literally and blocks more than six explicit lines", () => {
    render(<App />);
    const text = " Ada  Example \nÄpfelstraße 7\n12345 Köln";
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: text } });
    expect(document.querySelector(".recipient-text")?.textContent).toBe(text);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(screen.getByRole("status")).toHaveTextContent(/up to 6 recipient lines/i);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
    expect(document.querySelector(".recipient-text")?.textContent).toBe("1\n2\n3\n4\n5\n6\n7");
  });

  it("uses measured visual overflow as a block without changing recipient content", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "A short recipient line" } });
    const measured = document.querySelector(".preview-scale .recipient-text")!;
    setOverflow(measured, { scrollWidth: 81, clientWidth: 80, scrollHeight: 10, clientHeight: 27 });
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "An intentionally overlong recipient line" } });
    expect(screen.getByRole("status")).toHaveTextContent(/recipient line is too long/i);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
    expect(measured.textContent).toBe("An intentionally overlong recipient line");
  });

  it("keeps sender separate, optional and blocks its measured overflow", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "Ada Example" } });
    expect(document.querySelectorAll(".sender-text")).toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/sender or additional/i), { target: { value: "Ada Example · Return address" } });
    expect(document.querySelector(".sender-text")?.textContent).toBe("Ada Example · Return address");
    const measured = document.querySelector(".preview-scale .sender-text")!;
    setOverflow(measured, { scrollWidth: 81, clientWidth: 80, scrollHeight: 10, clientHeight: 17 });
    fireEvent.change(screen.getByLabelText(/sender or additional/i), { target: { value: "An intentionally overlong additional line" } });
    expect(screen.getByRole("status")).toHaveTextContent(/additional line is too long/i);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
    expect(measured.textContent).toBe("An intentionally overlong additional line");
  });

  it("keeps sender and recipient in separate printed zones", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "Ada Example" } });
    fireEvent.change(screen.getByLabelText(/sender or additional/i), { target: { value: "Return line" } });
    const address = document.querySelector(".print-only .address-content")!;
    expect(address.querySelector(".additional-zone .sender-text")?.textContent).toBe("Return line");
    expect(address.querySelector(".recipient-zone .recipient-text")?.textContent).toBe("Ada Example");
  });

  it("allows six recipient lines and a fitting sender because their zones are separate", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "1\n2\n3\n4\n5\n6" } });
    fireEvent.change(screen.getByLabelText(/sender or additional/i), { target: { value: "Return line" } });
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeEnabled();
  });

  it("isolates native test-page printing from normal address output", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Test page" }));
    expect(print).toHaveBeenCalledTimes(1);
    const testDocument = document.querySelector(".print-only .print-document--test")!;
    const fieldGuide = testDocument.querySelector(":scope > .test-field-guide")!;
    const recipientGuide = testDocument.querySelector(":scope > .test-recipient-guide")!;
    expect(fieldGuide).toBeInTheDocument();
    expect(recipientGuide).toBeInTheDocument();
    expect(fieldGuide.parentElement).toBe(testDocument);
    expect(recipientGuide.parentElement).toBe(testDocument);
    expect(fieldGuide.querySelector(".test-recipient-guide")).not.toBeInTheDocument();
    expect(testDocument).toHaveStyle({ "--address-field-left-mm": "20mm", "--address-field-top-mm": "45mm", "--address-field-width-mm": "85mm", "--address-field-height-mm": "45mm", "--recipient-zone-top-mm": "62.7mm", "--recipient-zone-height-mm": "27.3mm" });
    expect(testDocument).toHaveTextContent("Address field");
    expect(testDocument).toHaveTextContent("Recipient zone");
    expect(testDocument.querySelector(".calibration-line")).toBeInTheDocument();
    vi.unstubAllGlobals(); print.mockRestore();
  });

  it("keeps overflow detection and explicit line counting deterministic", () => {
    expect(hasVisualOverflow({ scrollWidth: 80, clientWidth: 80, scrollHeight: 27, clientHeight: 27 })).toBe(false);
    expect(hasVisualOverflow({ scrollWidth: 81, clientWidth: 80, scrollHeight: 27, clientHeight: 27 })).toBe(true);
    expect(hasVisualOverflow({ scrollWidth: 80, clientWidth: 80, scrollHeight: 28, clientHeight: 27 })).toBe(true);
    expect(recipientHasTooManyExplicitLines("1\n2\n3\n4\n5\n6", 6)).toBe(false);
    expect(recipientHasTooManyExplicitLines("1\n2\n3\n4\n5\n6\n7", 6)).toBe(true);
  });

  it("does not persist address data", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "Not persisted" } });
    expect(window.localStorage.length).toBe(0);
    expect(document.querySelectorAll("link[href^='http'], script[src^='http']")).toHaveLength(0);
  });
});
