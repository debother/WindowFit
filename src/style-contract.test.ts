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

  it("positions both test guides independently from authoritative page variables", () => {
    const sharedGuideRule = css.match(/\.test-field-guide, \.test-recipient-guide \{([^}]*)\}/)?.[1] ?? "";
    const fieldGuideRule = css.match(/(?:^|})\.test-field-guide \{([^}]*)\}/)?.[1] ?? "";
    const recipientGuideRule = css.match(/(?:^|})\.test-recipient-guide \{([^}]*)\}/)?.[1] ?? "";
    expect(sharedGuideRule).toContain("position:absolute");
    expect(sharedGuideRule).toContain("left:var(--address-field-left-mm)");
    expect(sharedGuideRule).toContain("width:var(--address-field-width-mm)");
    expect(fieldGuideRule).toContain("top:var(--address-field-top-mm)");
    expect(fieldGuideRule).toContain("height:var(--address-field-height-mm)");
    expect(recipientGuideRule).toContain("top:var(--recipient-zone-top-mm)");
    expect(recipientGuideRule).toContain("height:var(--recipient-zone-height-mm)");
  });

  it("preserves print unconstrained flow for multi-page letter pagination", () => {
    const letterFlowRule = css.match(/\.letter-body-flow \{([^}]*)\}/)?.[1] ?? "";
    expect(letterFlowRule).toContain("padding-top:var(--letter-content-top-mm)");
    expect(letterFlowRule).not.toContain("position:absolute");
    expect(letterFlowRule).not.toContain("overflow:hidden");
    expect(letterFlowRule).not.toContain("bottom:20mm");

    expect(css).toContain(".print-document { width:210mm; min-height:297mm; display:block; page-break-after:auto; }");
    expect(css).toContain(".print-document--test { width:210mm; height:297mm; overflow:hidden; page-break-after:avoid; }");
  });
});