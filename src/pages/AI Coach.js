// src/pages/AssistantPage.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Trash2, Dumbbell, Heart, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingPage from '../components/LoadingPage';

// Backend API base URL - use relative path for Vercel deployment
const API_BASE_URL = 'https://flexai-backend.onrender.com/api';

const AssistantPage = () => {
  // State hooks
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Start a new chat session
  const startNewChatSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to start chat session');
      }
      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages([
        {
          ...data.message,
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
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Effect: scroll and loading
  useEffect(() => {
    scrollToBottom();
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [messages]);

  // Effect: start session on mount
  useEffect(() => {
    startNewChatSession();
  }, [startNewChatSession]);

  // Send message to backend (with streaming support)
  const sendMessageToAPI = async (message, onChunk) => {
    if (!sessionId) {
      throw new Error('No active chat session');
    }
    try {
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Streaming (SSE)
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
                    if (onChunk) {
                      onChunk(fullResponse);
                    }
                  } else if (data.type === 'complete') {
                    return {
                      message: {
                        id: Date.now(),
                        text: data.fullText,
                        sender: 'bot',
                        timestamp: new Date().toISOString()
                      }
                    };
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  // ignore parse error
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback to regular JSON response
        const data = await response.json();
        return data;
      }
    } catch (streamError) {
      // Fallback to non-streaming request
      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

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
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Create a temporary bot message for streaming
    const tempBotMessageId = Date.now() + 1;
    const tempBotMessage = {
      id: tempBotMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempBotMessage]);

    try {
      // Send message to backend API with streaming
      const data = await sendMessageToAPI(currentInput, (chunkText) => {
        // Update the temporary message with each chunk
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

      // Remove temporary message and add error response
      setMessages(prev => prev.filter(msg => msg.id !== tempBotMessageId));

      // Use fallback response
      const fallbackText = simulateFitnessAIResponse(currentInput);
      const errorResponse = {
        id: Date.now() + 1,
        text: fallbackText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key for sending
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat and start new session
  const clearChat = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      startNewChatSession();
    } catch (error) {
      setMessages([
        {
          id: 1,
          text: "Hi! I'm your AI fitness assistant. Ask me anything about workouts, nutrition, or fitness! 💪",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  // Format time for message timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Loading state
  if (loading) {
    return <LoadingPage />;
  }

  return (
    // Main container with gym video background
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 1rem',
        position: 'relative',
        color: '#f9fafb',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 1
      }}
    >
      {/* 
        Video Background
        NOTE: The video will play on localhost:3000 if the file 'bgvideo.mp4' exists in your public directory.
        Make sure 'bgvideo.mp4' is placed in the 'public' folder of your React project.
        When running 'npm start' (localhost:3000), the video will be served from '/bgvideo.mp4'.
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 10
        }}
      >
        <source src="bgvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better text readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 11
        }}
      />

      {/* Header */}
      <div className="text-center mb-8" style={{ position: 'relative', zIndex: 20 }}>
        <h1
          style={{
            color: '#ffffff',
            textShadow: '0 2px 6px rgba(0,0,0,0.8)',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Bot className="inline-block mr-2" />
          FLEX.AI Assistant
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.125rem' }}>
          Your AI-powered fitness companion
        </p>
        {/* Feature tags */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Dumbbell size={20} />
            <span>Workouts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Heart size={20} />
            <span>Nutrition</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Target size={20} />
            <span>Goals</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(0, 0, 0, 0.75)',
          borderRadius: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          color: '#fff',
          backdropFilter: 'blur(6px)',
          position: 'relative',
          zIndex: 30
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            background: '#111827',
            color: '#38bdf8',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bot size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>AI Fitness Assistant</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                {isApiAvailable ? "🟢 Gemini AI Active" : "🔴 Offline Mode"}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#38bdf8',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s'
            }}
            title="Clear chat"
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            height: '500px',
            overflowY: 'auto',
            padding: '1rem',
            background: '#111827'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1.25rem',
                  background: message.sender === 'user' ? '#38bdf8' : '#1f2937',
                  color: message.sender === 'user' ? 'white' : '#f3f4f6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {/* Bot icon for bot messages */}
                  {message.sender === 'bot' && (
                    <Bot size={16} style={{ marginTop: '2px', color: '#38bdf8' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <ReactMarkdown>
                      {message.text}
                    </ReactMarkdown>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7, textAlign: 'right' }}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {/* User icon for user messages */}
                  {message.sender === 'user' && (
                    <User size={16} style={{ marginTop: '2px' }} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '1.25rem',
                  background: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Bot size={16} style={{ color: '#38bdf8' }} />
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {/* Animated typing dots */}
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-typingDot"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-typingDot [animation-delay:.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-typingDot [animation-delay:.4s]"></span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            background: '#1f2937',
            borderTop: '1px solid #38bdf8',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Flex.Ai"
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  border: '1px solid #38bdf8',
                  borderRadius: '9999px',
                  color: '#38bdf8',
                  background: '#111827',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '56px',
                  maxHeight: '128px',
                  transition: 'box-shadow 0.2s'
                }}
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                padding: '1rem',
                background: '#38bdf8',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                cursor: (!inputMessage.trim() || isTyping) ? 'not-allowed' : 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!inputMessage.trim() || isTyping) ? 0.5 : 1,
                transition: 'background 0.2s'
              }}
              onMouseOver={e => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = '#0ea5e9';
              }}
              onMouseOut={e => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = '#38bdf8';
              }}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <p style={{ color: '#38bdf8', fontSize: '0.95rem', marginTop: '1rem', textAlign: 'center' }}>
            {isApiAvailable ? "Powered by Google Gemini AI" : "Running in offline mode"}
          </p>
        </div>
      </div>

      {/* Tailwind custom animation for typing dots */}
      <style>
        {`
          @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
          }
          .animate-typingDot {
            animation: typingDot 1.4s infinite ease-in-out;
          }
          .animate-typingDot:nth-child(2) {
            animation-delay: .2s;
          }
          .animate-typingDot:nth-child(3) {
            animation-delay: .4s;
          }
        `}
      </style>
    </div>
  );
};

export default AssistantPage;