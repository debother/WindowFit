import { useState } from "react";
import { printGeometryCssVariables } from "./geometry";

type PrintMode = "address" | "test";

function AddressText({ recipient, sender }: { recipient: string; sender: string }) {
  return (
    <div className="address-text" aria-label="Address print content">
      {sender && <div className="sender-line">{sender}</div>}
      {recipient ? <div className="recipient-lines">{recipient}</div> : <div className="recipient-placeholder">Recipient address</div>}
    </div>
  );
}

function PrintableDocument({ mode, recipient, sender }: { mode: PrintMode; recipient: string; sender: string }) {
  const geometry = printGeometryCssVariables();
  return (
    <section className={`print-document print-document--${mode}`} style={geometry} aria-label={mode === "address" ? "Printable address sheet" : "Printable test page"}>
      <div className="print-address-field">
        {mode === "address" ? <AddressText recipient={recipient} sender={sender} /> : <div className="test-window-guide"><span>Address window guide</span></div>}
      </div>
      {mode === "test" && <div className="test-content">
        <p className="test-title">WindowFit test page</p>
        <p>Print at 100% / Actual size. Disable browser headers and footers if they affect your print.</p>
        <p>Fold only after checking the window guide against your envelope. No exact fold line is shown because it is not defined by this layout fixture.</p>
        <div className="calibration" aria-label="100 millimetre calibration reference">
          <span className="calibration-line" />
          <span>100 mm</span>
        </div>
        <p className="calibration-copy">This line should measure exactly 100 mm after printing.</p>
        <p>Use this page to verify your browser, printer and envelope before printing an address.</p>
      </div>}
    </section>
  );
}

export default function App() {
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("address");
  const recipientLineCount = recipient === "" ? 0 : recipient.split("\n").length;
  const hasTooManyRecipientLines = recipientLineCount > 6;

  function openPrint(mode: PrintMode) {
    setPrintMode(mode);
    requestAnimationFrame(() => window.print());
  }

  return <div className="app-shell">
    <header className="app-header no-print"><span className="brand">WindowFit</span><span className="format-label">A4 · German window-letter layout</span></header>
    <main id="main" className="workbench">
      <section className="controls no-print" aria-labelledby="windowfit-title">
        <p className="eyebrow">Address → Preview → Print → Fold</p>
        <h1 id="windowfit-title">Put the address where the window is.</h1>
        <p className="intro">For one supported A4 German window-letter layout. Designed for printing at 100% / Actual size.</p>
        <label htmlFor="recipient">Recipient address</label>
        <textarea id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} rows={6} placeholder={"Ada Example\nExample Street 1\n12345 Exampletown"} aria-describedby={hasTooManyRecipientLines ? "line-limit" : undefined} />
        {hasTooManyRecipientLines && <p id="line-limit" className="line-limit" role="status">This layout supports up to 6 recipient lines. Reduce the entered line breaks before printing.</p>}
        <label htmlFor="sender">Sender or additional line <span>(optional)</span></label>
        <input id="sender" value={sender} onChange={(event) => setSender(event.target.value)} placeholder="Your name · return address" />
        <div className="actions">
          <button className="primary-action" type="button" onClick={() => openPrint("address")} disabled={hasTooManyRecipientLines}>Print / PDF</button>
          <button className="secondary-action" type="button" onClick={() => openPrint("test")}>Test page</button>
        </div>
        <p className="trust-note">Your address stays in your browser. Use the test page to verify your printer and envelope.</p>
      </section>
      <section className="preview-panel no-print" aria-labelledby="preview-heading">
        <div className="preview-heading"><h2 id="preview-heading">Live A4 preview</h2><span>Screen preview only</span></div>
        <div className="preview-scale"><PrintableDocument mode="address" recipient={recipient} sender={sender} /></div>
        <p className="preview-note">The print layout uses millimetres. This preview is scaled only to fit your screen.</p>
      </section>
    </main>
    <div className="print-only"><PrintableDocument mode={printMode} recipient={recipient} sender={sender} /></div>
  </div>;
}
