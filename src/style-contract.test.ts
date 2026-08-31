import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");

describe("print and responsive CSS contracts", () => {
  it("keeps print output isolated, A4-sized and in millimetres", () => {
    expect(css).toContain("@media print");
    expect(css).toContain("@page { size:A4 portrait; margin:0; }");
    expect(css).toContain(".no-print { display:none !important; }");
    expect(css).toContain("width:210mm; height:297mm");
    expect(css).toContain("left:var(--address-left-mm)");
    expect(css).toContain("width:var(--calibration-length-mm)");
  });

  it("contains no-obvious-overflow contracts for 375px and 320px layouts", () => {
    expect(css).toContain("* { box-sizing: border-box; }");
    expect(css).toContain("textarea, input { width:100%;");
    expect(css).toContain(".preview-scale { overflow:hidden;");
    expect(css).toContain("@media (max-width:720px)");
    expect(css).toContain(".workbench { grid-template-columns:1fr;");
    expect(css).toContain("@media (max-width:360px)");
    expect(css).toContain(".actions button { width:100%; }");
  });
});
