# WindowFit

> Put the address where the window is.

**Live tool:** [windowfit.debother.com](https://windowfit.debother.com/)

WindowFit V0.2 is a focused, fully client-side A4 address-positioning and letter-composition utility for a supported German window-letter layout (DIN 5008 Type B window positioning). It runs entirely in your browser without accounts, backend servers, uploads, or tracking, and prints directly via the standard browser print dialog.

## Features

- **Address positioning:** Exact physical alignment for German standard window envelopes (DIN 5008 Form B).
- **Sender line:** Optional return-address or reference line in the separate upper address zone.
- **Optional letter text:** Draft or paste your letter text, place/date, and subject directly into the layout.
- **Live A4 preview:** Scaled, multi-page screen preview showing exactly where content and fold lines fall.
- **Bilingual interface:** Seamless switching between German (default) and English.
- **Local-first privacy:** Your address and letter data stay completely inside your browser.

## Physical geometry

The sole source of physical print dimensions is `src/geometry.ts`:

- **A4 paper:** 210 × 297 mm
- **Complete address field:** x = 20 mm, y = 45 mm, 85 × 45 mm
- **Additional / sender zone:** 85 × 17.7 mm (font size: 2.6 mm / 3.2 mm line height)
- **Recipient zone:** y = 62.7 mm, 85 × 27.3 mm, max. 6 lines
- **Text inset:** x = 25 mm (5 mm clearance from left field edge)
- **Letter body top margin:** y = 103.46 mm (below fold line 1)
- **Calibration line:** 100 mm

## Physical print gate

Automated tests cannot verify printer driver settings, browser scaling quirks, paper feed, or envelope fit.

1. Print the built-in **Test page** at **100% / Actual size**.
2. Measure the printed calibration reference line with a physical ruler — it must measure exactly **100 mm**.
3. Disable browser headers and footers in the print dialog.
4. Fold the sheet along the fold lines and verify that the address sits cleanly inside your physical envelope window.

## Development

```bash
npm install
npm run test
npm run lint
npm run build
```

For local inspection: `npm run preview -- --host 127.0.0.1`.

## License

MIT License. Copyright (c) 2026 Florian Hoffarth.

---

Made by [debother.](https://debother.com/)
