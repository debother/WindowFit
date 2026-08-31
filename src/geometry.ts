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

/** Continuation page (Page 2+) safe area constants (WindowFit layout policy). */
export const CONTINUATION_GEOMETRY = Object.freeze({
  topSafeMm: 20,
  bottomSafeMm: 20,
  page1BottomSafeMm: 20,
});

/** Arithmetic derived directly from the authoritative fixtures above. */
export const DERIVED_GEOMETRY = Object.freeze({
  additionalZoneTopMm: PRINT_GEOMETRY.addressField.topMm,
  recipientZoneTopMm: PRINT_GEOMETRY.addressField.topMm + PRINT_GEOMETRY.additionalZone.heightMm,
  addressFieldHeightMm: PRINT_GEOMETRY.additionalZone.heightMm + PRINT_GEOMETRY.recipientZone.heightMm,
  textInsetLeftMm: PRINT_GEOMETRY.text.leftMm - PRINT_GEOMETRY.addressField.leftMm,
  textContentWidthMm: PRINT_GEOMETRY.addressField.widthMm - (PRINT_GEOMETRY.text.leftMm - PRINT_GEOMETRY.addressField.leftMm),
  recipientLineHeightMm: PRINT_GEOMETRY.recipientZone.heightMm / PRINT_GEOMETRY.recipientZone.maxLines,
  letterContentTopMm: 103,
  letterContentLeftMm: 25,
  letterContentRightMm: 20,
  continuationTopSafeMm: CONTINUATION_GEOMETRY.topSafeMm,
  continuationBottomSafeMm: CONTINUATION_GEOMETRY.bottomSafeMm,
  page1BottomSafeMm: CONTINUATION_GEOMETRY.page1BottomSafeMm,
  continuationContentHeightMm: PRINT_GEOMETRY.paper.heightMm - CONTINUATION_GEOMETRY.topSafeMm - CONTINUATION_GEOMETRY.bottomSafeMm,
  page1LetterContentHeightMm: PRINT_GEOMETRY.paper.heightMm - 103 - CONTINUATION_GEOMETRY.page1BottomSafeMm,
  foldTopMm: 105,
  foldBottomMm: 210,
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
    "--letter-content-top-mm": `${DERIVED_GEOMETRY.letterContentTopMm}mm`,
    "--letter-content-left-mm": `${DERIVED_GEOMETRY.letterContentLeftMm}mm`,
    "--letter-content-right-mm": `${DERIVED_GEOMETRY.letterContentRightMm}mm`,
    "--continuation-top-safe-mm": `${DERIVED_GEOMETRY.continuationTopSafeMm}mm`,
    "--continuation-bottom-safe-mm": `${DERIVED_GEOMETRY.continuationBottomSafeMm}mm`,
    "--page1-bottom-safe-mm": `${DERIVED_GEOMETRY.page1BottomSafeMm}mm`,
    "--continuation-content-height-mm": `${DERIVED_GEOMETRY.continuationContentHeightMm}mm`,
    "--page1-letter-content-height-mm": `${DERIVED_GEOMETRY.page1LetterContentHeightMm}mm`,
    "--fold-top-mm": `${DERIVED_GEOMETRY.foldTopMm}mm`,
    "--fold-bottom-mm": `${DERIVED_GEOMETRY.foldBottomMm}mm`,
  } as GeometryCssProperties;
}