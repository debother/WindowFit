import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");

describe("WindowFit print CSS contracts", () => {
  it("uses an unpadded 85 × 45 mm field with distinct sender and recipient zones", () => {
    expect(css).toContain("left:var(--address-field-left-mm)");
    expect(css).toContain("top:var(--address-field-top-mm)");
    expect(css).toContain("width:var(--address-field-width-mm)");
    expect(css).toContain("height:var(--address-field-height-mm)");
    expect(css).not.toContain("padding:var(--address-clearance-mm)");
    expect(css).toContain("height:var(--additional-zone-height-mm)");
    expect(css).toContain("top:var(--additional-zone-height-mm)");
    expect(css).toContain("height:var(--recipient-zone-height-mm)");
    expect(css).toContain("left:var(--text-inset-left-mm)");
    expect(css).toContain("width:var(--text-content-width-mm)");
    expect(css).toContain("white-space:pre");
    expect(css).toContain("overflow:hidden");
  });

  it("keeps print geometry physical and preview transforms outside the print document", () => {
    expect(css).toContain("@page { size:A4 portrait; margin:0; }");
    expect(css).toContain("width:210mm; height:297mm");
    expect(css).toContain(".preview-scale .print-document { transform:scale");
    expect(css).toContain(".no-print { display:none !important; }");
    expect(css).toContain(".print-only { display:block; }");
    expect(css).toContain("width:var(--calibration-length-mm)");
    expect(css).not.toContain("62.5mm");
    expect(css).not.toContain("8.85mm");
  });
});
