import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const BOT_AVATAR = (
  <span style={{ fontSize: 22, marginRight: 8, display: 'flex', alignItems: 'center' }}> 
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2D3748"/><path d="M8.5 10.5a3.5 3.5 0 1 1 7 0v1.25a3.5 3.5 0 1 1-7 0V10.5Z" fill="#60A5FA"/><rect x="7" y="16" width="10" height="2" rx="1" fill="#60A5FA"/></svg>
  </span>
);
const USER_AVATAR = '👤';

const BOT_WELCOME = {
  type: 'bot',
  text: `Hi! Ask me anything about workouts, fitness , heatly tips anyhow, how can i help you today !`,
  time: new Date(),
};

function formatTime(date) {
  if (!date) return '';
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  m = m < 10 ? '0' + m : m;
  return `${h}:${m} ${ampm}`;
}

export default function GeminiChatBot({ mobile }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([BOT_WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input, time: new Date() };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setTyping(true);
    // Placeholder Gemini API call
    setTimeout(() => {
      setTyping(false);
      setMessages((msgs) => [
        ...msgs,
        { type: 'bot', text: "(Gemini would reply here)", time: new Date() },
      ]);
    }, 1200);
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Close on outside click (desktop only)
  useEffect(() => {
    if (!open || mobile) return;
    const handleClick = (e) => {
      if (!e.target.closest('.gemini-chat-popup')) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, mobile]);

  const handleClear = () => {
    setMessages([{
      ...BOT_WELCOME,
      time: new Date(),
    }]);
  };

  // Styles
  const darkBg = {
    background: '#181F2A',
    color: '#E2E8F0',
    borderRadius: 16,
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    width: 420,
    maxWidth: '95vw',
    height: 420,
    display: open ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden',
    position: mobile ? 'static' : 'absolute',
    bottom: mobile ? undefined : 80,
    right: mobile ? undefined : 0,
    left: mobile ? 0 : undefined,
    margin: mobile ? '0 auto' : undefined,
    zIndex: 1000,
  };

  return (
    <div className="chat-widget" style={mobile ? { position: 'static', zIndex: 1000 } : { zIndex: 1000 }}>
      <button
        className={mobile ? 'chat-button w-full my-2' : 'chat-button'}
        style={mobile ? { width: '100%', borderRadius: 12 } : {}}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Gemini chat"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ marginRight: 8 }}><rect width="24" height="24" rx="6" fill="#2D3748"/><path d="M8.5 10.5a3.5 3.5 0 1 1 7 0v1.25a3.5 3.5 0 1 1-7 0V10.5Z" fill="#60A5FA"/><rect x="7" y="16" width="10" height="2" rx="1" fill="#60A5FA"/></svg>
        <span style={{ fontWeight: 600, fontSize: 16, verticalAlign: 'middle' }}>Gemini Chat</span>
      </button>
      <div className={"gemini-chat-popup"} style={darkBg}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottom: '1px solid #232B3B', background: '#202736' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {BOT_AVATAR}
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#60A5FA' }}>AI Fitness Assistant</div>
              <div style={{ fontSize: 13, color: '#38E38E', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, background: '#38E38E', borderRadius: '50%', display: 'inline-block' }}></span>
                Gemini AI Active
              </div>
            </div>
          </div>
          <button onClick={handleClear} style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>🗑 Clear</button>
        </div>
        {/* Messages */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#181F2A' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18 }}>
              <div style={{ background: '#232B3B', color: '#E2E8F0', borderRadius: 18, padding: '16px 22px', fontSize: 17, maxWidth: '80%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ marginRight: 6, marginBottom: -2 }}><rect width="24" height="24" rx="6" fill="#2D3748"/><path d="M8.5 10.5a3.5 3.5 0 1 1 7 0v1.25a3.5 3.5 0 1 1-7 0V10.5Z" fill="#60A5FA"/><rect x="7" y="16" width="10" height="2" rx="1" fill="#60A5FA"/></svg>
                  {msg.text}
                </span>
                <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 8, textAlign: 'right' }}>{formatTime(msg.time)}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ color: '#60A5FA', marginBottom: 10 }}>Gemini is typing...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div style={{ padding: 18, background: '#202736', borderTop: '1px solid #232B3B', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            style={{ flex: 1, background: 'transparent', border: '1px solid #232B3B', color: '#E2E8F0', borderRadius: 24, padding: '12px 18px', fontSize: 16, outline: 'none' }}
            placeholder="Ask Flex.Ai"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKey}
            disabled={typing}
          />
          <button
            style={{ marginLeft: 12, background: '#60A5FA', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, cursor: 'pointer', opacity: input.trim() && !typing ? 1 : 0.5 }}
            onClick={handleSend}
            disabled={!input.trim() || typing}
            aria-label="Send message"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
} 