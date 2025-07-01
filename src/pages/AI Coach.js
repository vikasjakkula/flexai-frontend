// src/pages/AssistantPage.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Trash2, Dumbbell, Heart, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingPage from '../components/LoadingPage';

// Backend API base URL - use relative path for Vercel deployment
const API_BASE_URL = 'http://localhost:5000/api';

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
      const response = await fetch(`${API_BASE_URL}/chat/start`, {
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
  const sendMessageToAPI = async (message, onChunk) => {
    if (!sessionId) {
      throw new Error('No active chat session');
    }
    console.log('[AssistantPage] Sending message to API:', message, 'sessionId:', sessionId);
    
    // Try streaming first, fallback to regular request
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
        console.log('[AssistantPage] Regular bot reply data:', data);
        return data;
      }
    } catch (streamError) {
      console.warn('[AssistantPage] Streaming failed, falling back to regular request:', streamError);
      
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
        const response = await fetch(`${API_BASE_URL}/chat/${sessionId}`, {
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
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          <Bot style={{ display: 'inline', marginRight: '0.5rem' }} />
          FLEX.AI Assistant
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
          Your AI-powered fitness companion
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <Dumbbell size={20} />
            <span>Workouts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <Heart size={20} />
            <span>Nutrition</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <Target size={20} />
            <span>Goals</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: 'white', 
        borderRadius: '1rem', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div style={{ 
          background: '#1DA1F2', 
          color: 'white', 
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bot size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Fitness Assistant</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                {isApiAvailable ? "🟢 Gemini AI Active" : "🔴 Offline Mode"}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            title="Clear chat"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div style={{ 
          height: '500px', 
          overflowY: 'auto', 
          padding: '1rem',
          background: '#f8f9fa'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                background: message.sender === 'user' ? '#1DA1F2' : 'white',
                color: message.sender === 'user' ? 'white' : '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {message.sender === 'bot' && (
                    <Bot size={16} style={{ marginTop: '2px', color: '#1DA1F2' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <ReactMarkdown style={{ 
                      margin: 0, 
                      lineHeight: 1.5,
                      fontSize: '0.95rem'
                    }}>
                      {message.text}
                    </ReactMarkdown>
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      fontSize: '0.75rem', 
                      opacity: 0.7,
                      textAlign: 'right'
                    }}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <User size={16} style={{ marginTop: '2px' }} />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Bot size={16} style={{ color: '#1DA1F2' }} />
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1DA1F2',
                    animation: 'typing 1.4s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1DA1F2',
                    animation: 'typing 1.4s infinite ease-in-out 0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1DA1F2',
                    animation: 'typing 1.4s infinite ease-in-out 0.4s'
                  }}></div>
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
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.5rem', 
                  border: '1px solid #1DA1F2', 
                  borderRadius: '1.5rem', 
                  fontSize: '1rem', 
                  background: '#fff', 
                  color: '#1DA1F2', 
                  outline: 'none', 
                  resize: 'none', 
                  minHeight: '56px', 
                  maxHeight: '128px' 
                }}
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{ 
                padding: '1rem', 
                background: '#1DA1F2', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                cursor: 'pointer', 
                fontSize: '1.25rem', 
                opacity: !inputMessage.trim() || isTyping ? 0.5 : 1 
              }}
            >
              <Send style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
          </div>
          <p style={{ color: '#1DA1F2', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center' }}>
            {isApiAvailable ? "Powered by Google Gemini AI" : "Running in offline mode"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default AssistantPage;