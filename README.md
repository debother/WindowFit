# WindowFit

Put the address where the window is.

WindowFit V0.1 is a fully client-side A4 address-positioning utility for one German window-letter layout. It uses the browser print dialog, not a PDF service.

## Physical geometry

The sole source of physical dimensions is `src/geometry.ts`:

- A4: 210 × 297 mm
- complete address field: x = 20 mm, y = 45 mm, 85 × 45 mm
- additional / return-information zone: 85 × 17.7 mm
- recipient zone: y = 62.7 mm, 85 × 27.3 mm, max. 6 lines
- text start: x = 25 mm
- calibration line: 100 mm

The two zones make up the full 45 mm address field. Exact fold positions are intentionally not rendered because no verified fold geometry was supplied.

## Development

`npm install` · `npm run test` · `npm run build` · `npm run lint`

For local inspection: `npm run preview -- --host 127.0.0.1`.

## Physical print gate

Automated testing does not verify printer, browser print scaling, paper feed, folding or a real envelope. Print the test page at **100% / Actual size**, disable headers/footers where necessary, measure the 100 mm line, then test the folded sheet in the intended envelope.

## Manual QA checklist

- [ ] Chromium, Firefox and Safari/WebKit: enter, edit and clear recipient and optional sender text.
- [ ] At 375 px, 320 px and with enlarged browser text: no horizontal page overflow; controls and both actions remain usable.
- [ ] A4 print: choose **100% / Actual size** and disable browser headers/footers where necessary.
- [ ] Print the test page and measure the reference line. It must measure 100 mm.
- [ ] Print a normal address sheet, fold it and insert it into the intended supported window envelope.
- [ ] Check that the address remains visible after realistic small paper movement in the envelope.
