# WindowFit

Put the address where the window is.

WindowFit V0.1 is a fully client-side A4 address-positioning utility for one German window-letter layout. It uses the browser print dialog, not a PDF service.

## Physical geometry

The sole source of physical dimensions is `src/geometry.ts`:

- A4: 210 × 297 mm
- address field: 85 × 45 mm
- reference from upper paper edge: 62.7 mm
- recipient zone: max. 6 lines / 27.3 mm
- calibration line: 100 mm

The address field is horizontally centred because the V0.1 product contract contains no left-edge reference. Its centred position (62.5 mm) and the 8.85 mm clearance are transparent derivations from the supplied fixtures. Exact fold positions are intentionally not rendered because no verified fold geometry was supplied.

## Development

`npm install` · `npm run test` · `npm run build` · `npm run lint`

For responsive audit: run `npm run preview -- --host 127.0.0.1` in one terminal, then `npm run check:responsive` in another.

## Physical print gate

Automated testing does not verify printer, browser print scaling, paper feed, folding or a real envelope. Print the test page at **100% / Actual size**, disable headers/footers where necessary, measure the 100 mm line, then test the folded sheet in the intended envelope.

## Manual QA checklist

- [ ] Chromium, Firefox and Safari/WebKit: enter, edit and clear recipient and optional sender text.
- [ ] At 375 px, 320 px and with enlarged browser text: no horizontal page overflow; controls and both actions remain usable.
- [ ] A4 print: choose **100% / Actual size** and disable browser headers/footers where necessary.
- [ ] Print the test page and measure the reference line. It must measure 100 mm.
- [ ] Print a normal address sheet, fold it and insert it into the intended supported window envelope.
- [ ] Check that the address remains visible after realistic small paper movement in the envelope.
