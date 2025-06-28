// src/pages/AssistantPage.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Trash2, MessageCircle, Dumbbell, Heart, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingPage from '../components/LoadingPage';

const API_BASE_URL = 'http://localhost:5000';

const AssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Start a new chat session
  const startNewChatSession = useCallback(async () => {
    console.log('[AssistantPage] Starting new chat session...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('[AssistantPage] /api/chat/start response:', response);
      if (!response.ok) {
        throw new Error('Failed to start chat session');
      }
      const data = await response.json();
      console.log('[AssistantPage] New session data:', data);
      setSessionId(data.sessionId);
      setMessages([
        {
          ...data.message,
          timestamp: new Date(data.message.timestamp)
        }
      ]);
      setIsApiAvailable(true);
    } catch (error) {
      console.error('[AssistantPage] Error starting chat session:', error);
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

  useEffect(() => {
    console.log('[AssistantPage] Messages updated:', messages);
    scrollToBottom();
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    console.log('[AssistantPage] Component mounted, starting session.');
    startNewChatSession();
  }, [startNewChatSession]);

  // Send message to backend
  const sendMessageToAPI = async (message, onChunk = null) => {
    if (!sessionId) {
      throw new Error('No active chat session');
    }
    console.log('[AssistantPage] Sending message to API:', message, 'sessionId:', sessionId);
    
    // Try streaming first, fallback to regular request
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
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
      
      console.log('[AssistantPage] /api/chat/message response:', response);
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream')) {
        console.log('[AssistantPage] Starting streaming response...');
        
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
                  console.log('[AssistantPage] Stream chunk:', data);
                  
                  if (data.type === 'chunk') {
                    fullResponse += data.text;
                    if (onChunk) {
                      onChunk(fullResponse);
                    }
                  } else if (data.type === 'complete') {
                    console.log('[AssistantPage] Streaming completed');
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
                  console.warn('[AssistantPage] Failed to parse SSE data:', parseError);
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
        console.log('[AssistantPage] Bot reply data:', data);
        return data;
      }
    } catch (streamError) {
      console.warn('[AssistantPage] Streaming failed, falling back to regular request:', streamError);
      
      // Fallback to non-streaming request
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
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
      console.log('[AssistantPage] Fallback bot reply data:', data);
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    console.log('[AssistantPage] User sending message:', inputMessage);
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
        console.warn('[AssistantPage] API is offline, using fallback.');
      } else {
        setIsApiAvailable(true);
      }
    } catch (error) {
      console.error('[AssistantPage] Error sending message:', error);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    console.log('[AssistantPage] Clearing chat...');
    try {
      if (sessionId) {
        const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('[AssistantPage] /api/chat/:sessionId DELETE response:', response);
      }
      startNewChatSession();
    } catch (error) {
      console.error('[AssistantPage] Error clearing chat:', error);
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

  const formatTime = (timestamp) => {
    return timestamp instanceof Date
      ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickQuestions = [
    { icon: Dumbbell, text: "Show me a beginner workout", question: "Can you give me a beginner-friendly workout routine?" },
    { icon: Heart, text: "Cardio vs Strength?", question: "What's better for weight loss - cardio or strength training?" },
    { icon: Target, text: "Nutrition tips", question: "What are the best nutrition tips for muscle building?" }
  ];

  if (loading) return <LoadingPage />;

  return (
    <div style={{ minHeight: '100vh', background: '#f4fafd' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#1DA1F2', color: 'white', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1.5rem 1.5rem 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', background: '#fff', color: '#1DA1F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Flex.AI</h1>
              <p style={{ color: 'white', margin: 0 }}>Your personal workout answers are here</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', color: 'white', background: 'rgba(29,161,242,0.2)', border: 'none', borderRadius: '0.75rem', cursor: 'pointer' }}
            title="Clear chat"
          >
            <Trash2 style={{ width: '1.25rem', height: '1.25rem' }} />
            <span style={{ display: 'none' }}>Clear Chat</span>
          </button>
        </div>
        {/* Quick Questions */}
        <div style={{ background: '#fff', borderBottom: '1px solid #1DA1F2', padding: '1rem' }}>
          <p style={{ color: '#1DA1F2', marginBottom: '0.75rem', fontSize: '1rem' }}>Quick starter:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {quickQuestions.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputMessage(item.question);
                  handleSendMessage();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#1DA1F2', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '1rem', cursor: 'pointer' }}
              >
                <item.icon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Messages Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f4fafd' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexDirection: message.sender === 'user' ? 'row-reverse' : 'row' }}
            >
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#1DA1F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {message.sender === 'user' ? (
                  <User style={{ width: '1.5rem', height: '1.5rem' }} />
                ) : (
                  <Bot style={{ width: '1.5rem', height: '1.5rem' }} />
                )}
              </div>
              <div style={{ maxWidth: '32rem', display: 'flex', flexDirection: 'column', alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '1rem 1.5rem', borderRadius: '1.5rem', background: '#1DA1F2', color: 'white', fontSize: '1rem', marginBottom: 0 }}>
                  {message.sender === 'bot' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({children}) => <p style={{ margin: 0 }}>{children}</p>,
                        strong: ({children}) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
                        em: ({children}) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                        ul: ({children}) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>,
                        ol: ({children}) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
                        li: ({children}) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                        h1: ({children}) => <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{children}</h1>,
                        h2: ({children}) => <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>{children}</h2>,
                        h3: ({children}) => <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{children}</h3>,
                        code: ({children}) => <code style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.9rem' }}>{children}</code>,
                        blockquote: ({children}) => <blockquote style={{ borderLeft: '3px solid rgba(255,255,255,0.5)', paddingLeft: '1rem', margin: '0.5rem 0', fontStyle: 'italic' }}>{children}</blockquote>,
                        table: ({children}) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.5rem 0', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', overflow: 'hidden' }}>{children}</table>,
                        thead: ({children}) => <thead style={{ background: 'rgba(255,255,255,0.2)' }}>{children}</thead>,
                        tbody: ({children}) => <tbody>{children}</tbody>,
                        tr: ({children}) => <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</tr>,
                        th: ({children}) => <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>{children}</th>,
                        td: ({children}) => <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{children}</td>
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ margin: 0 }}>{message.text}</p>
                  )}
                </div>
                <p style={{ color: '#1DA1F2', fontSize: '0.85rem', margin: '0.5rem 0 0 0', padding: '0 0.5rem' }}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#1DA1F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div style={{ background: '#fff', border: '1px solid #1DA1F2', borderRadius: '1.5rem', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(29,161,242,0.08)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: '0.75rem', height: '0.75rem', background: '#1DA1F2', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }}></div>
                  <div style={{ width: '0.75rem', height: '0.75rem', background: '#1DA1F2', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.1s' }}></div>
                  <div style={{ width: '0.75rem', height: '0.75rem', background: '#1DA1F2', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <div style={{ background: '#fff', borderTop: '1px solid #1DA1F2', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Flex.Ai"
                style={{ width: '100%', padding: '1rem 1.5rem', border: '1px solid #1DA1F2', borderRadius: '1.5rem', fontSize: '1rem', background: '#fff', color: '#1DA1F2', outline: 'none', resize: 'none', minHeight: '56px', maxHeight: '128px' }}
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{ padding: '1rem', background: '#1DA1F2', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '1.25rem', opacity: !inputMessage.trim() || isTyping ? 0.5 : 1 }}
            >
              <Send style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
          </div>
          <p style={{ color: '#1DA1F2', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center' }}>
            {isApiAvailable ? "Powered by Google Gemini AI" : "Running in offline mode"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;