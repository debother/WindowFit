import type { CSSProperties } from "react";

/** The sole source of physical geometry for WindowFit V0.1, in millimetres. */
export const PRINT_GEOMETRY = Object.freeze({
  paper: Object.freeze({ widthMm: 210, heightMm: 297 }),
  addressField: Object.freeze({ widthMm: 85, heightMm: 45, topMm: 62.7 }),
  addressZone: Object.freeze({ maxLines: 6, maxHeightMm: 27.3 }),
  calibrationLineMm: 100,
});

// Derived only from the contract fixtures above. The horizontal location is centred
// because no independent left-edge reference was supplied for V0.1.
export const DERIVED_GEOMETRY = Object.freeze({
  addressFieldLeftMm: (PRINT_GEOMETRY.paper.widthMm - PRINT_GEOMETRY.addressField.widthMm) / 2,
  verticalClearanceMm: (PRINT_GEOMETRY.addressField.heightMm - PRINT_GEOMETRY.addressZone.maxHeightMm) / 2,
});

export type GeometryCssProperties = CSSProperties & Record<`--${string}`, string>;

export function printGeometryCssVariables(): GeometryCssProperties {
  return {
    "--paper-width-mm": `${PRINT_GEOMETRY.paper.widthMm}mm`,
    "--paper-height-mm": `${PRINT_GEOMETRY.paper.heightMm}mm`,
    "--address-left-mm": `${DERIVED_GEOMETRY.addressFieldLeftMm}mm`,
    "--address-top-mm": `${PRINT_GEOMETRY.addressField.topMm}mm`,
    "--address-width-mm": `${PRINT_GEOMETRY.addressField.widthMm}mm`,
    "--address-height-mm": `${PRINT_GEOMETRY.addressField.heightMm}mm`,
    "--address-clearance-mm": `${DERIVED_GEOMETRY.verticalClearanceMm}mm`,
    "--calibration-length-mm": `${PRINT_GEOMETRY.calibrationLineMm}mm`,
  } as GeometryCssProperties;
}
