import { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import './App.css';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
  'https://render-jeemate.onrender.com';

const API_URL = `${API_BASE_URL}/api/solve`;

// ── KaTeX math renderer ───────────────────────────────────────────────────────
function renderKatex(latex, displayMode) {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'html',
      trust: false,
    });
  } catch {
    return `<span class="katex-error">${latex}</span>`;
  }
}

// Splits text into plain-text and math segments, renders math with KaTeX.
function MathRenderer({ text }) {
  if (!text) return null;

  const parts = [];
  // Match $$...$$ (display) or $...$ (inline), in that order
  const re = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let m;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: 'text', v: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith('$$')) {
      parts.push({ t: 'display', v: raw.slice(2, -2) });
    } else {
      parts.push({ t: 'inline', v: raw.slice(1, -1) });
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ t: 'text', v: text.slice(last) });

  // If Gemini returns raw LaTeX without $...$ delimiters, render the whole thing as KaTeX.
  // This prevents UI showing strings like "\text{Given:} ... \frac{...}{...}".
  const hasMathDelimiters = parts.some(p => p.t === 'display' || p.t === 'inline');
  if (!hasMathDelimiters) {
    const raw = String(text).trim();
    const looksLikeLatex =
      /\\[a-zA-Z]+/.test(raw) || /\\[{()}[\]]/.test(raw) || /\\_/.test(raw) || /\\\^/.test(raw);
    if (looksLikeLatex) {
      const displayMode = raw.includes('\n') || raw.length > 80;
      return (
        <span
          className={displayMode ? 'katex-display-block' : undefined}
          dangerouslySetInnerHTML={{ __html: renderKatex(raw, displayMode) }}
        />
      );
    }
  }

  return (
    <span>
      {parts.map((p, i) => {
        if (p.t === 'display') {
          return (
            <span
              key={i}
              className="katex-display-block"
              dangerouslySetInnerHTML={{ __html: renderKatex(p.v, true) }}
            />
          );
        }
        if (p.t === 'inline') {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderKatex(p.v, false) }}
            />
          );
        }
        // plain text — handle \\ line breaks Gemini emits
        const lines = p.v.split('\\\\');
        return (
          <span key={i}>
            {lines.map((seg, j) => (
              <span key={j}>{j > 0 && <br />}{seg}</span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

// ── Solution card ─────────────────────────────────────────────────────────────
function SolutionCard({ data }) {
  const { solution, model, meta } = data;

  return (
    <div className="sol-card">
      {/* Chips row */}
      <div className="sol-meta-row">
        {solution.subject && <span className="sol-chip chip-subject">{solution.subject}</span>}
        {solution.topic   && <span className="sol-chip chip-topic">{solution.topic}</span>}
        <span className="sol-chip chip-model">{model}</span>
        {meta?.chunks_used > 0 && (
          <span className="sol-chip chip-notes">{meta.chunks_used} notes</span>
        )}
      </div>

      {/* Extracted question */}
      {solution.extracted_question && (
        <div className="sol-section">
          <span className="sol-label">Question</span>
          <div className="sol-block question-block">
            <MathRenderer text={solution.extracted_question} />
          </div>
        </div>
      )}

      {/* Given + Find side by side */}
      {(solution.given || solution.find) && (
        <div className="sol-pair">
          {solution.given && (
            <div className="sol-section sol-half">
              <span className="sol-label">Given</span>
              <div className="sol-block">
                <MathRenderer text={solution.given} />
              </div>
            </div>
          )}
          {solution.find && (
            <div className="sol-section sol-half">
              <span className="sol-label">Find</span>
              <div className="sol-block">
                <MathRenderer text={solution.find} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulas used */}
      {solution.formulas_used?.length > 0 && (
        <div className="sol-section">
          <span className="sol-label">Formulas Used</span>
          <div className="formula-list">
            {solution.formulas_used.map((f, i) => (
              <div key={i} className="formula-row">
                <MathRenderer text={String(f)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {solution.steps?.length > 0 && (
        <div className="sol-section">
          <span className="sol-label">Solution Steps</span>
          <div className="steps-list">
            {solution.steps.map((step, i) => (
              <div key={i} className="step-row">
                <span className="step-num">{i + 1}</span>
                <div className="step-text">
                  <MathRenderer text={step} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer */}
      {solution.answer && (
        <div className="sol-section">
          <span className="sol-label">Answer</span>
          <div className="answer-block">
            <MathRenderer text={solution.answer} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── User bubble ───────────────────────────────────────────────────────────────
function UserBubble({ msg }) {
  return (
    <div className="bubble-user">
      {msg.image && (
        <div className="bubble-img">
          <img src={msg.image} alt="uploaded question" />
        </div>
      )}
      {msg.text && <p className="bubble-text">{msg.text}</p>}
    </div>
  );
}

// ── Error bubble ──────────────────────────────────────────────────────────────
function ErrorBubble({ text }) {
  return (
    <div className="bubble-error">
      <span className="error-icon">⚠</span>
      <span>{text}</span>
    </div>
  );
}

// ── Response area ─────────────────────────────────────────────────────────────
function ResponseArea({ messages, bottomRef }) {
  return (
    <div className="response-area">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-grid">
            {[
              'Solve: ∫x·eˣ dx using integration by parts',
              'Projectile motion — derive range formula',
              'Chemical bonding: ionic vs covalent',
              'Probability: Bayes theorem with example',
            ].map((s, i) => (
              <div key={i} className="suggestion-chip">{s}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((m, i) => {
            if (m.role === 'user')     return <UserBubble key={i} msg={m} />;
            if (m.role === 'solution') return <SolutionCard key={i} data={m.data} />;
            if (m.role === 'error')    return <ErrorBubble key={i} text={m.text} />;
            return null;
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ── ChatGPT-style input bar ───────────────────────────────────────────────────
function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const fileRef = useRef(null);
  const taRef  = useRef(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
  }, [text]);

  // With image: can send even without text (image-only).
  // Without image: require ≥10 chars so backend doesn't reject.
  const canSend = !disabled && (!!image || text.trim().length >= 10);
  const tooShort = !image && text.trim().length > 0 && text.trim().length < 10;

  function handleSend() {
    if (!canSend) return;
    const body = {};
    if (image) body.image = image;
    // Only pass text when it meets the backend's 10-char minimum
    if (text.trim().length >= 10) body.text = text.trim();
    onSend(body);
    setText('');
    setImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="input-outer">
      {image && (
        <div className="image-thumb-row">
          <div className="image-thumb">
            <img src={image} alt="preview" />
            <button className="remove-thumb" onClick={() => setImage(null)}>✕</button>
          </div>
          <span className="thumb-label">Image ready to send</span>
        </div>
      )}
      <div className={`input-box${disabled ? ' input-disabled' : ''}`}>
        {/* + attach */}
        <button
          className="input-action attach"
          onClick={() => fileRef.current?.click()}
          title="Upload image of question"
          type="button"
          disabled={disabled}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <input type="file" ref={fileRef} accept="image/*"
          onChange={handleFile} style={{ display: 'none' }} />

        {/* Textarea */}
        <textarea
          ref={taRef}
          className="input-ta"
          placeholder="Type a question or upload an image..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={disabled}
        />

        {/* Send ↑ */}
        <button
          className={`input-action send${canSend ? ' send-active' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          title="Send (Enter)"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      {tooShort && (
        <p className="input-warn">Need at least 10 characters for text questions.</p>
      )}
      <p className="input-hint">JEEmate may make errors — verify all solutions before use.</p>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend({ text, image }) {
    // Push user bubble immediately
    setMessages(prev => [...prev, { role: 'user', text: text || '', image: image || null }]);
    setLoading(true);

    try {
      const body = {};
      if (text)  body.text        = text;
      if (image) body.imageBase64 = image; // data-URL — backend strips the prefix

      const res  = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.hint || `Server error ${res.status}`);
      }

      setMessages(prev => [...prev, { role: 'solution', data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      {/* ── Header ── */}
      <header className="top-bar">
        <div className="brand">
          <svg className="brand-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          JEEmate
        </div>
        <div className="exam-tags">
          <span className="tag">JEE</span>
          <span className="tag">EAMCET</span>
          <span className="tag">CBSE</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <h1 className="hero-title">Generate Complex Steps Using AI</h1>
        <p className="hero-sub">Upload questions · get hints · instant AI step-by-step solutions</p>
      </section>

      <div className="divider" />

      {/* ── Messages ── */}
      <ResponseArea messages={messages} bottomRef={bottomRef} />

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-row">
          <div className="ai-avatar-sm">AI</div>
          <span className="dot-pulse" />
          <span className="dot-pulse" style={{ animationDelay: '0.15s' }} />
          <span className="dot-pulse" style={{ animationDelay: '0.3s' }} />
          <span className="loading-label">Generating solution…</span>
        </div>
      )}

      {/* ── Input ── */}
      <InputBar onSend={handleSend} disabled={loading} />
    </div>
  );
}
