import { useLayoutEffect, useRef, useState, type Ref } from "react";
import { PRINT_GEOMETRY, printGeometryCssVariables } from "./geometry";
import { type Language, translations } from "./i18n";
import { hasVisualOverflow, recipientHasTooManyExplicitLines } from "./validation";

type PrintMode = "address" | "test";

type AddressTextProps = {
  recipient: string;
  sender: string;
  subject?: string;
  letterText?: string;
  recipientRef?: Ref<HTMLDivElement>;
  senderRef?: Ref<HTMLDivElement>;
  showWindowGuide?: boolean;
  showFoldGuide?: boolean;
  lang: Language;
};

function AddressText({ recipient, sender, recipientRef, senderRef }: AddressTextProps) {
  return (
    <div className="address-content" aria-label="Address print content">
      <div className="additional-zone">
        {sender && <div className="sender-text" ref={senderRef}>{sender}</div>}
      </div>
      <div className="recipient-zone">
        {recipient && <div className="recipient-text" ref={recipientRef}>{recipient}</div>}
      </div>
    </div>
  );
}

function PrintableDocument({
  mode,
  recipient,
  sender,
  subject,
  letterText,
  recipientRef,
  senderRef,
  showWindowGuide,
  showFoldGuide,
  lang,
}: AddressTextProps & { mode: PrintMode }) {
  const geometry = printGeometryCssVariables();
  const t = translations[lang];

  return (
    <section
      className={`print-document print-document--${mode}`}
      style={geometry}
      aria-label={mode === "address" ? "Printable address sheet" : "Printable test page"}
    >
      {mode === "address" ? (
        <>
          <div className="print-address-field">
            <AddressText
              recipient={recipient}
              sender={sender}
              recipientRef={recipientRef}
              senderRef={senderRef}
              lang={lang}
            />
          </div>

          {(subject || letterText) && (
            <div className="letter-body-flow">
              {subject && <div className="letter-subject">{subject}</div>}
              {letterText && <div className="letter-text">{letterText}</div>}
            </div>
          )}

          {showWindowGuide && (
            <div className="screen-guide-window no-print" aria-hidden="true">
              <span className="screen-guide-label">{t.windowGuideLabel}</span>
            </div>
          )}

          {showFoldGuide && (
            <div className="screen-guide-folds no-print" aria-hidden="true">
              <div className="screen-fold-line screen-fold-line--top">
                <span>{t.foldGuideTopLabel}</span>
              </div>
              <div className="screen-fold-line screen-fold-line--bottom">
                <span>{t.foldGuideBottomLabel}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="test-field-guide">
            <span className="field-guide-label">{t.testFieldGuideLabel}</span>
          </div>
          <div className="test-recipient-guide">
            <span>{t.testRecipientGuideLabel}</span>
          </div>
          <div className="test-content">
            <p className="test-title">{t.testTitle}</p>
            <p>{t.testP1}</p>
            <p>{t.testP2}</p>
            <div className="calibration" aria-label="100 millimetre calibration reference">
              <span className="calibration-line" />
              <span>{t.testCalibration}</span>
            </div>
            <p className="calibration-copy">{t.testCalibrationCopy}</p>
            <p>{t.testP3}</p>
          </div>
        </>
      )}
    </section>
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>("de");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [showLetter, setShowLetter] = useState(false);
  const [subject, setSubject] = useState("");
  const [letterText, setLetterText] = useState("");
  const [showWindowGuide, setShowWindowGuide] = useState(false);
  const [showFoldGuide, setShowFoldGuide] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("address");

  const recipientRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef<HTMLDivElement>(null);
  const [recipientOverflows, setRecipientOverflows] = useState(false);
  const [senderOverflows, setSenderOverflows] = useState(false);

  const t = translations[lang];

  const hasTooManyRecipientLines = recipientHasTooManyExplicitLines(
    recipient,
    PRINT_GEOMETRY.recipientZone.maxLines
  );
  const cannotPrint =
    recipient === "" || hasTooManyRecipientLines || recipientOverflows || senderOverflows;

  const printLimitMessage =
    recipient === ""
      ? t.validationEnterRecipient
      : hasTooManyRecipientLines
      ? t.validationMaxLines
      : recipientOverflows
      ? t.validationRecipientOverflow
      : senderOverflows
      ? t.validationSenderOverflow
      : null;

  useLayoutEffect(() => {
    const recipientNode = recipientRef.current;
    const senderNode = senderRef.current;
    setRecipientOverflows(Boolean(recipientNode && hasVisualOverflow(recipientNode)));
    setSenderOverflows(Boolean(senderNode && hasVisualOverflow(senderNode)));
  }, [recipient, sender]);

  function openPrint(mode: PrintMode) {
    setPrintMode(mode);
    requestAnimationFrame(() => window.print());
  }

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <div className="brand-group">
          <span className="brand">{t.brand}</span>
          <span className="format-label">{t.formatLabel}</span>
        </div>
        <nav className="lang-switch" aria-label="Language / Sprache">
          <button
            type="button"
            className={`lang-btn ${lang === "de" ? "lang-btn--active" : ""}`}
            onClick={() => setLang("de")}
            aria-pressed={lang === "de"}
            lang="de"
          >
            DE
          </button>
          <span className="lang-sep" aria-hidden="true">·</span>
          <button
            type="button"
            className={`lang-btn ${lang === "en" ? "lang-btn--active" : ""}`}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            lang="en"
          >
            EN
          </button>
        </nav>
      </header>

      <main id="main" className="workbench">
        <section className="controls no-print" aria-labelledby="windowfit-title">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 id="windowfit-title">{t.title}</h1>
          <p className="intro">{t.intro}</p>

          <label htmlFor="recipient">{t.recipientLabel}</label>
          <textarea
            id="recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            rows={6}
            placeholder={t.recipientPlaceholder}
            aria-describedby={cannotPrint ? "print-limit" : undefined}
          />
          {printLimitMessage && (
            <p id="print-limit" className="line-limit" role="status">
              {printLimitMessage}
            </p>
          )}

          <label htmlFor="sender">
            {t.senderLabel} <span>{t.senderOptional}</span>
          </label>
          <input
            id="sender"
            value={sender}
            onChange={(event) => setSender(event.target.value)}
            placeholder={t.senderPlaceholder}
          />

          <div className="guide-toggles">
            <label className="toggle-checkbox">
              <input
                type="checkbox"
                checked={showWindowGuide}
                onChange={(e) => setShowWindowGuide(e.target.checked)}
              />
              <span>{t.showWindowGuide}</span>
            </label>
            <label className="toggle-checkbox">
              <input
                type="checkbox"
                checked={showFoldGuide}
                onChange={(e) => setShowFoldGuide(e.target.checked)}
              />
              <span>{t.showFoldGuide}</span>
            </label>
          </div>

          <div className="letter-toggle-section">
            <button
              type="button"
              className="btn-text-toggle"
              onClick={() => setShowLetter(!showLetter)}
            >
              {showLetter ? t.removeLetterAction : t.addLetterAction}
            </button>
          </div>

          {showLetter && (
            <div className="letter-fields">
              <label htmlFor="subject">
                {t.subjectLabel} <span>{t.subjectOptional}</span>
              </label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.subjectPlaceholder}
              />

              <label htmlFor="letter-text">{t.letterTextLabel}</label>
              <textarea
                id="letter-text"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                rows={8}
                placeholder={t.letterTextPlaceholder}
              />
            </div>
          )}

          <div className="actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => openPrint("address")}
              disabled={cannotPrint}
            >
              {t.printAction}
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => openPrint("test")}
            >
              {t.testPageAction}
            </button>
          </div>

          {showFoldGuide && (
            <div className="fold-guide-card" aria-label={t.foldGuideHeading}>
              <p className="fold-guide-title">{t.foldGuideHeading}</p>
              <ol className="fold-guide-steps">
                <li>{t.foldStep1}</li>
                <li>{t.foldStep2}</li>
                <li>{t.foldStep3}</li>
              </ol>
            </div>
          )}

          <p className="trust-note">{t.trustNote}</p>
        </section>

        <section className="preview-panel no-print" aria-labelledby="preview-heading">
          <div className="preview-heading">
            <h2 id="preview-heading">{t.previewHeading}</h2>
            <span>{t.previewScreenOnly}</span>
          </div>
          <div className="preview-scale">
            <PrintableDocument
              mode="address"
              recipient={recipient}
              sender={sender}
              subject={showLetter ? subject : undefined}
              letterText={showLetter ? letterText : undefined}
              recipientRef={recipientRef}
              senderRef={senderRef}
              showWindowGuide={showWindowGuide}
              showFoldGuide={showFoldGuide}
              lang={lang}
            />
          </div>
          <p className="preview-note">{t.previewNote}</p>
        </section>
      </main>

      <div className="print-only">
        <PrintableDocument
          mode={printMode}
          recipient={recipient}
          sender={sender}
          subject={showLetter ? subject : undefined}
          letterText={showLetter ? letterText : undefined}
          lang={lang}
        />
      </div>
    </div>
  );
}