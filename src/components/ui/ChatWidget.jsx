import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ChatWidget.css';

const API_BASE_URL = 'https://flexai-backend.onrender.com/api';
const BOT_AVATAR = '🏋️‍♂️';

function getUserAvatar(user) {
  if (user && user.user_metadata && user.user_metadata.avatar_url) {
    return <img src={user.user_metadata.avatar_url} alt="User" className="user-avatar-img" style={{ width: 28, height: 28, borderRadius: '50%' }} />;
  }
  return '👤';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Scroll to bottom of chat
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Start a new chat session
  const startNewChatSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to start chat session');
      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages([
        {
          ...data.message,
          type: 'bot',
          timestamp: new Date(data.message.timestamp)
        }
      ]);
      setIsApiAvailable(true);
    } catch (error) {
      setIsApiAvailable(false);
      setMessages([
        {
          id: 1,
          text: "Hi! I'm your AI fitness assistant FLEX.AI. Help with basic fitness tips! (Offline mode)",
          type: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      startNewChatSession();
    }
  }, [open, messages.length]);

  // Send message to backend (with streaming support)
  const sendMessageToAPI = async (message, onChunk) => {
    if (!sessionId) throw new Error('No active chat session');
    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, stream: true }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'chunk') {
                    fullResponse += data.text;
                    if (onChunk) onChunk(fullResponse);
                  } else if (data.type === 'complete') {
                    return {
                      message: {
                        id: Date.now(),
                        text: data.fullText,
                        type: 'bot',
                        timestamp: new Date().toISOString()
                      }
                    };
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (parseError) {}
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (streamError) {
      // Fallback to non-streaming request
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, stream: false }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      return data;
    }
  };

  // Fallback responses if API fails
  const simulateFitnessAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return "Quick workout tip: Try 10 push-ups, 15 squats, 30-sec plank. Repeat 3x! 💪 (Offline mode)";
    }
    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition')) {
      return "Quick nutrition tip: Fill half your plate with veggies, quarter with protein, quarter with complex carbs! 🥗 (Offline mode)";
    }
    if (lowerMessage.includes('motivation')) {
      return "You're already winning by asking! 🏆 Every small step counts. Keep going, champion! (Offline mode)";
    }
    return "I'm in offline mode right now. Try asking about workouts, nutrition, or motivation! 🤖";
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = {
      id: Date.now(),
      text: input,
      type: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setTyping(true);
    // Create a temporary bot message for streaming
    const tempBotMessageId = Date.now() + 1;
    const tempBotMessage = {
      id: tempBotMessageId,
      text: '',
      type: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempBotMessage]);
    try {
      const data = await sendMessageToAPI(currentInput, (chunkText) => {
        setMessages(prev => prev.map(msg =>
          msg.id === tempBotMessageId
            ? { ...msg, text: chunkText }
            : msg
        ));
      });
      // Replace temporary message with final message
      const finalBotMessage = {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      };
      setMessages(prev => prev.map(msg =>
        msg.id === tempBotMessageId
          ? finalBotMessage
          : msg
      ));
      if (data.isOffline) {
        setIsApiAvailable(false);
      } else {
        setIsApiAvailable(true);
      }
    } catch (error) {
      setIsApiAvailable(false);
      setMessages(prev => prev.filter(msg => msg.id !== tempBotMessageId));
      const fallbackText = simulateFitnessAIResponse(currentInput);
      const errorResponse = {
        id: Date.now() + 1,
        text: fallbackText,
        type: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setTyping(false);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
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

  // Clear chat and start new session
  const clearChat = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      startNewChatSession();
    } catch (error) {
      setMessages([
        {
          id: 1,
          text: "Hi! I'm your AI fitness assistant. Ask me anything about workouts, nutrition, or fitness! 💪",
          type: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

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
              <p>{isApiAvailable ? 'How can I help you today?' : 'Offline mode: Basic fitness tips only.'}</p>
            </div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.type}`}>
              <div className="message-avatar">{msg.type === 'user' ? getUserAvatar(user) : BOT_AVATAR}</div>
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
            <button
              className="chat-clear"
              onClick={clearChat}
              title="Clear chat"
              style={{ marginLeft: 8 }}
            >
              🚮
            </button>
          </div>
          <div className="chat-status" style={{ color: isApiAvailable ? '#38bdf8' : '#f87171', fontSize: '0.85rem', marginTop: 4 }}>
            {isApiAvailable ? 'Powered by Google Gemini AI' : 'Running in offline mode'}
          </div>
        </div>
      </div>
    </div>
  );
} 