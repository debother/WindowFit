import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { DERIVED_GEOMETRY, PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";

describe("WindowFit", () => {
  it("keeps the authoritative product fixtures in one deterministic module", () => {
    expect(PRINT_GEOMETRY).toEqual({ paper: { widthMm: 210, heightMm: 297 }, addressField: { widthMm: 85, heightMm: 45, topMm: 62.7 }, addressZone: { maxLines: 6, maxHeightMm: 27.3 }, calibrationLineMm: 100 });
    expect(DERIVED_GEOMETRY.addressFieldLeftMm).toBe(62.5);
    expect(DERIVED_GEOMETRY.verticalClearanceMm).toBeCloseTo(8.85);
  });

  it("renders address text literally, retaining user line breaks", () => {
    render(<App />);
    const text = "Ada  Example\nÄpfelstraße 7\n12345 Köln";
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: text } });
    expect(screen.getAllByLabelText("Address print content")[0].querySelector(".recipient-lines")?.textContent).toBe(text);
    expect(document.querySelector(".recipient-lines")).toHaveClass("recipient-lines");
  });

  it("adds a sender only when supplied", () => {
    render(<App />);
    expect(document.querySelectorAll(".sender-line")).toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/sender or additional/i), { target: { value: "Ada Example · Return address" } });
    expect(document.querySelectorAll(".sender-line")).toHaveLength(2);
    expect(screen.getAllByText("Ada Example · Return address")).toHaveLength(2);
  });

  it("keeps an understandable empty state", () => {
    render(<App />);
    expect(screen.getByLabelText("Recipient address")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeEnabled();
  });

  it("does not silently print more than the six supported recipient lines", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "1\n2\n3\n4\n5\n6\n7" } });
    expect(screen.getByRole("status")).toHaveTextContent(/up to 6 recipient lines/i);
    expect(screen.getByRole("button", { name: "Print / PDF" })).toBeDisabled();
    expect(screen.getAllByLabelText("Address print content")[0].querySelector(".recipient-lines")?.textContent).toBe("1\n2\n3\n4\n5\n6\n7");
  });

  it("opens the native print flow in address and independently selected test modes", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Test page" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".print-only .print-document--test")).toBeInTheDocument();
    expect(document.querySelector(".print-only .print-document--address")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Print / PDF" }));
    expect(document.querySelector(".print-only .print-document--address")).toBeInTheDocument();
    vi.unstubAllGlobals(); print.mockRestore();
  });

  it("does not persist input and has no application network code", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Recipient address"), { target: { value: "Not persisted" } });
    expect(window.localStorage.length).toBe(0);
    expect(document.querySelectorAll("link[href^='http'], script[src^='http']")).toHaveLength(0);
  });

  it("keeps print variables physical even though preview has a visual scale", () => {
    const vars = printGeometryCssVariables();
    expect(vars["--address-top-mm"]).toBe("62.7mm");
    expect(vars["--address-width-mm"]).toBe("85mm");
    expect(vars["--calibration-length-mm"]).toBe("100mm");
    render(<App />);
    expect(document.querySelector(".preview-scale .print-document")).toHaveClass("print-document--address");
    expect(document.querySelector(".print-only .print-document")).toHaveClass("print-document--address");
  });
});
