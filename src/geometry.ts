import type { CSSProperties } from "react";

/** Authoritative physical fixtures for the single WindowFit V0.1 layout. */
export const PRINT_GEOMETRY = Object.freeze({
  paper: Object.freeze({ widthMm: 210, heightMm: 297 }),
  addressField: Object.freeze({ leftMm: 20, topMm: 45, widthMm: 85, heightMm: 45 }),
  additionalZone: Object.freeze({ heightMm: 17.7 }),
  recipientZone: Object.freeze({ heightMm: 27.3, maxLines: 6 }),
  text: Object.freeze({ leftMm: 25 }),
  calibrationLineMm: 100,
});

/** Arithmetic derived directly from the authoritative fixtures above. */
export const DERIVED_GEOMETRY = Object.freeze({
  additionalZoneTopMm: PRINT_GEOMETRY.addressField.topMm,
  recipientZoneTopMm: PRINT_GEOMETRY.addressField.topMm + PRINT_GEOMETRY.additionalZone.heightMm,
  addressFieldHeightMm: PRINT_GEOMETRY.additionalZone.heightMm + PRINT_GEOMETRY.recipientZone.heightMm,
  textInsetLeftMm: PRINT_GEOMETRY.text.leftMm - PRINT_GEOMETRY.addressField.leftMm,
  textContentWidthMm: PRINT_GEOMETRY.addressField.widthMm - (PRINT_GEOMETRY.text.leftMm - PRINT_GEOMETRY.addressField.leftMm),
  recipientLineHeightMm: PRINT_GEOMETRY.recipientZone.heightMm / PRINT_GEOMETRY.recipientZone.maxLines,
});

export type GeometryCssProperties = CSSProperties & Record<`--${string}`, string>;

export function printGeometryCssVariables(): GeometryCssProperties {
  return {
    "--paper-width-mm": `${PRINT_GEOMETRY.paper.widthMm}mm`,
    "--paper-height-mm": `${PRINT_GEOMETRY.paper.heightMm}mm`,
    "--address-field-left-mm": `${PRINT_GEOMETRY.addressField.leftMm}mm`,
    "--address-field-top-mm": `${PRINT_GEOMETRY.addressField.topMm}mm`,
    "--address-field-width-mm": `${PRINT_GEOMETRY.addressField.widthMm}mm`,
    "--address-field-height-mm": `${DERIVED_GEOMETRY.addressFieldHeightMm}mm`,
    "--additional-zone-height-mm": `${PRINT_GEOMETRY.additionalZone.heightMm}mm`,
    "--recipient-zone-top-mm": `${DERIVED_GEOMETRY.recipientZoneTopMm}mm`,
    "--recipient-zone-height-mm": `${PRINT_GEOMETRY.recipientZone.heightMm}mm`,
    "--text-inset-left-mm": `${DERIVED_GEOMETRY.textInsetLeftMm}mm`,
    "--text-content-width-mm": `${DERIVED_GEOMETRY.textContentWidthMm}mm`,
    "--recipient-line-height-mm": `${DERIVED_GEOMETRY.recipientLineHeightMm}mm`,
    "--calibration-length-mm": `${PRINT_GEOMETRY.calibrationLineMm}mm`,
  } as GeometryCssProperties;
}
