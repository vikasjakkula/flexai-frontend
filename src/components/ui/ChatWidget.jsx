import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const BOT_AVATAR = '🤖';
const USER_AVATAR = '👤';

const BOT_WELCOME = {
  type: 'bot',
  text: `Hey, I'm your AI assistant! 😊\n\nHow can I help you today?`,
};

const BOT_RESPONSES = [
  "That's a great question! Let me help you with that.",
  "I understand what you're looking for. Here's what I can suggest...",
  "Thanks for asking! I'm here to help you with any questions.",
  "I'd be happy to assist you with that. Let me provide some guidance.",
  "That's interesting! Here's what I think about that topic.",
];

export default function ChatWidget() {
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

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const botText = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      setMessages((msgs) => [...msgs, { type: 'bot', text: botText }]);
    }, 1000 + Math.random() * 2000);
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (!e.target.closest('.chat-widget')) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="chat-widget" style={{ zIndex: 1000 }}>
      <button
        className={`chat-button${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
      >
        💬
      </button>
      <div className={`chat-popup${open ? ' active' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">{BOT_AVATAR}</div>
            <div className="chat-info">
              <h3>AI Assistant</h3>
              <p>How can I help you today?</p>
            </div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.type}`}>
              <div className="message-avatar">{msg.type === 'user' ? USER_AVATAR : BOT_AVATAR}</div>
              <div className="message-content">
                {msg.text.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>{line}<br /></React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {typing && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Enter a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKey}
              disabled={typing}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!input.trim() || typing}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 