import { useLayoutEffect, useRef, useState, type Ref } from "react";
import { PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";
import { hasVisualOverflow, recipientHasTooManyExplicitLines } from "./validation";

type PrintMode = "address" | "test";
type AddressTextProps = { recipient: string; sender: string; recipientRef?: Ref<HTMLDivElement>; senderRef?: Ref<HTMLDivElement> };

function AddressText({ recipient, sender, recipientRef, senderRef }: AddressTextProps) {
  return <div className="address-content" aria-label="Address print content">
    <div className="additional-zone">{sender && <div className="sender-text" ref={senderRef}>{sender}</div>}</div>
    <div className="recipient-zone">{recipient && <div className="recipient-text" ref={recipientRef}>{recipient}</div>}</div>
  </div>;
}

function PrintableDocument({ mode, recipient, sender, recipientRef, senderRef }: AddressTextProps & { mode: PrintMode }) {
  const geometry = printGeometryCssVariables();
  return <section className={`print-document print-document--${mode}`} style={geometry} aria-label={mode === "address" ? "Printable address sheet" : "Printable test page"}>
    {mode === "address" ? <div className="print-address-field"><AddressText recipient={recipient} sender={sender} recipientRef={recipientRef} senderRef={senderRef} /></div> : <><div className="test-field-guide"><span className="field-guide-label">Address field<br />85 × 45 mm</span></div><div className="test-recipient-guide"><span>Recipient zone<br />85 × 27.3 mm</span></div></>}
    {mode === "test" && <div className="test-content"><p className="test-title">WindowFit test page</p><p>Print at 100% / Actual size. Disable browser headers and footers if they affect your print.</p><p>Fold only after checking the address field against your envelope. No exact fold line is shown because it is not defined by this layout fixture.</p><div className="calibration" aria-label="100 millimetre calibration reference"><span className="calibration-line" /><span>100 mm</span></div><p className="calibration-copy">This line should measure exactly 100 mm after printing.</p><p>Use this page to verify your browser, printer and envelope before printing an address.</p></div>}
  </section>;
}

export default function App() {
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("address");
  const recipientRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef<HTMLDivElement>(null);
  const [recipientOverflows, setRecipientOverflows] = useState(false);
  const [senderOverflows, setSenderOverflows] = useState(false);
  const hasTooManyRecipientLines = recipientHasTooManyExplicitLines(recipient, PRINT_GEOMETRY.recipientZone.maxLines);
  const cannotPrint = recipient === "" || hasTooManyRecipientLines || recipientOverflows || senderOverflows;
  const printLimitMessage = recipient === "" ? "Enter a recipient address before printing." : hasTooManyRecipientLines ? "This layout supports up to 6 recipient lines. Reduce the entered line breaks before printing." : recipientOverflows ? "A recipient line is too long for the supported address field. Shorten that line before printing." : senderOverflows ? "The additional line is too long for its supported zone. Shorten it before printing." : null;

  useLayoutEffect(() => {
    const recipientNode = recipientRef.current;
    const senderNode = senderRef.current;
    setRecipientOverflows(Boolean(recipientNode && hasVisualOverflow(recipientNode)));
    setSenderOverflows(Boolean(senderNode && hasVisualOverflow(senderNode)));
  }, [recipient, sender]);

  function openPrint(mode: PrintMode) { setPrintMode(mode); requestAnimationFrame(() => window.print()); }

  return <div className="app-shell">
    <header className="app-header no-print"><span className="brand">WindowFit</span><span className="format-label">A4 · German window-letter layout</span></header>
    <main id="main" className="workbench">
      <section className="controls no-print" aria-labelledby="windowfit-title">
        <p className="eyebrow">Address → Preview → Print → Fold</p><h1 id="windowfit-title">Put the address where the window is.</h1><p className="intro">For one supported A4 German window-letter layout. Designed for printing at 100% / Actual size.</p>
        <label htmlFor="recipient">Recipient address</label><textarea id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} rows={6} placeholder={"Ada Example\nExample Street 1\n12345 Exampletown"} aria-describedby={cannotPrint ? "print-limit" : undefined} />
        {printLimitMessage && <p id="print-limit" className="line-limit" role="status">{printLimitMessage}</p>}
        <label htmlFor="sender">Sender or additional line <span>(optional)</span></label><input id="sender" value={sender} onChange={(event) => setSender(event.target.value)} placeholder="Your name · return address" />
        <div className="actions"><button className="primary-action" type="button" onClick={() => openPrint("address")} disabled={cannotPrint}>Print / PDF</button><button className="secondary-action" type="button" onClick={() => openPrint("test")}>Test page</button></div><p className="trust-note">Your address stays in your browser. Use the test page to verify your printer and envelope.</p>
      </section>
      <section className="preview-panel no-print" aria-labelledby="preview-heading"><div className="preview-heading"><h2 id="preview-heading">Live A4 preview</h2><span>Screen preview only</span></div><div className="preview-scale"><PrintableDocument mode="address" recipient={recipient} sender={sender} recipientRef={recipientRef} senderRef={senderRef} /></div><p className="preview-note">The print layout uses millimetres. This preview is scaled only to fit your screen.</p></section>
    </main>
    <div className="print-only"><PrintableDocument mode={printMode} recipient={recipient} sender={sender} /></div>
  </div>;
}
