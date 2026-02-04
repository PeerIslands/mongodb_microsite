import { useState, useRef, useEffect } from 'react';
import { formatMarkdown } from '@/utils/markdownFormatter';
import '@/styles/components/AIChatbot.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tierUsed?: string;
  confidence?: number;
  suggestExpand?: boolean;
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! 👋 I can help you find information about our accelerators, success stories, events, and blogs. What would you like to know?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchDepth, setCurrentSearchDepth] = useState(20);
  const [lastUserQuestion, setLastUserQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (customQuestion?: string, searchDepth: number = 20) => {
    const questionToSend = customQuestion || inputValue.trim();
    
    if (!questionToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: questionToSend
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customQuestion) {
      setInputValue('');
    }
    setIsLoading(true);
    setLastUserQuestion(questionToSend);
    setCurrentSearchDepth(searchDepth);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionToSend,
          search_depth: searchDepth,
          conversation_history: messages.slice(-8).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();

      // Log the full response for debugging
      console.log('Chatbot API Response:', data);

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          tierUsed: data.tier_used,
          confidence: data.confidence,
          suggestExpand: data.suggest_expand
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Show the actual error message if available
        const errorMsg = data.error 
          ? `Sorry, I encountered an error: ${data.error}` 
          : 'Sorry, I encountered an error. Please try again.';
        console.error('Chatbot error:', data.error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMsg
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExpandSearch = () => {
    const newDepth = currentSearchDepth === 20 ? 40 : 
                     currentSearchDepth === 40 ? 100 : 
                     null;
    
    if (newDepth) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '🔍 Let me search more thoroughly for you...'
      }]);
      
      // Re-query with deeper search
      setTimeout(() => {
        handleSendMessage(lastUserQuestion, newDepth);
      }, 500);
    } else {
      // Already searched everything
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I've already searched all our content. If you need more specific information, please try rephrasing your question or contact our support team."
      }]);
    }
  };

  const handleSatisfied = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Great! I'm glad I could help. Feel free to ask me anything else! 😊"
    }]);
  };

  const suggestedQuestions = [
    "What accelerators do you offer?",
    "Tell me about your success stories",
    "What events are coming up?",
    "What industries do you serve?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-bubble ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open PeerAI chat assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            fill="currentColor"
          />
        </svg>
        <span className="chat-bubble-badge">Ask AI</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <h3 className="chat-header-title">PeerAI Assistant</h3>
                <p className="chat-header-subtitle">Ask me anything</p>
              </div>
            </div>
            <button
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <div className="chat-message-content">
                    {message.role === 'assistant' ? (
                      <div className="markdown-formatted">
                        {formatMarkdown(message.content)}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
                
                {/* Feedback buttons for Tier 2 responses */}
                {message.role === 'assistant' && 
                 message.suggestExpand && 
                 index === messages.length - 1 && 
                 !isLoading && (
                  <div className="message-feedback">
                    <p className="feedback-question">Was this helpful?</p>
                    <div className="feedback-buttons">
                      <button 
                        className="feedback-btn feedback-yes" 
                        onClick={handleSatisfied}
                      >
                        👍 Yes, perfect!
                      </button>
                      <button 
                        className="feedback-btn feedback-no" 
                        onClick={handleExpandSearch}
                      >
                        👎 Search deeper
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div className="chat-message-content">
                  <div className="chat-loading">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />

            {/* Suggested Questions (show only if conversation is fresh) */}
            {messages.length <= 1 && !isLoading && (
              <div className="chat-suggestions">
                <p className="chat-suggestions-title">Try asking:</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="chat-suggestion-chip"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chat-send-button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;

