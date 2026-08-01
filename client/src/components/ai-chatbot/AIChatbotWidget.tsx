import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, HelpCircle, Shield, MessageCircle, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'moderation' | 'community' | 'technical';
}

const faqDatabase: FAQItem[] = [
  {
    question: "How do I report inappropriate content?",
    answer: "You can report any content by clicking the three-dot menu on a post or comment and selecting 'Report'. Our moderation team will review it within 24 hours.",
    category: 'moderation'
  },
  {
    question: "How do I create a community?",
    answer: "To create a community, go to the communities page, click 'Create Community', and follow the setup wizard. You'll need to choose a name, description, and set your community rules.",
    category: 'community'
  },
  {
    question: "Why was my post removed?",
    answer: "Posts are removed if they violate our community guidelines. Common reasons include hate speech, harassment, copyright violations, or sharing personal information. You can appeal the decision through your moderation queue.",
    category: 'moderation'
  },
  {
    question: "How do I add moderators to my community?",
    answer: "As a community owner, go to your community settings, select 'Members', and assign moderator roles to trusted members. Moderators can help manage posts, ban users, and enforce community rules.",
    category: 'community'
  },
  {
    question: "I'm having trouble logging in",
    answer: "Try resetting your password first. If that doesn't work, ensure your email is verified. You can also check if you have 2FA enabled and have access to your authentication device.",
    category: 'technical'
  },
  {
    question: "How do I monetize my content?",
    answer: "You can monetize through creator subscriptions, tip jars, affiliate marketing, and brand collaborations. Check out our creator dashboard for all available monetization options.",
    category: 'general'
  }
];

// AI chatbot responses for common queries
const generateAIResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for common keywords and return appropriate responses
  if (lowerMessage.includes('report') || lowerMessage.includes('inappropriate')) {
    return faqDatabase[0].answer;
  }
  if (lowerMessage.includes('create community') || lowerMessage.includes('start a group')) {
    return faqDatabase[1].answer;
  }
  if (lowerMessage.includes('post removed') || lowerMessage.includes('taken down')) {
    return faqDatabase[2].answer;
  }
  if (lowerMessage.includes('add moderator') || lowerMessage.includes('make someone admin')) {
    return faqDatabase[3].answer;
  }
  if (lowerMessage.includes('login') || lowerMessage.includes('sign in') || lowerMessage.includes('cannot access')) {
    return faqDatabase[4].answer;
  }
  if (lowerMessage.includes('monetize') || lowerMessage.includes('make money') || lowerMessage.includes('earn')) {
    return faqDatabase[5].answer;
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! 👋 I'm your AI assistant. I can help with customer service questions, community management, and technical issues. What can I assist you with today?";
  }
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  // Default response for unrecognized queries
  return "I understand you have a question. I'm here to help with common issues related to account management, community guidelines, content moderation, and technical support. Could you please provide more details about your specific question, or would you like to connect with a human agent for further assistance?";
};

export default function AIChatbotWidget() {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! 👋 I'm your AI assistant. I can help with customer service questions, community management, and technical issues. What can I assist you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    let responseText: string;

    try {
      // Call the dedicated chat endpoint with conversation history
      const response = await api.post('/ai/content/chat', {
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: currentInput },
        ],
      });

      responseText = response.data?.content || generateAIResponse(currentInput);
    } catch {
      // Fall back to keyword-based FAQ matching when API is unavailable
      responseText = generateAIResponse(currentInput);
    }

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general':
        return <HelpCircle className="w-4 h-4" />;
      case 'moderation':
        return <Shield className="w-4 h-4" />;
      case 'community':
        return <MessageCircle className="w-4 h-4" />;
      case 'technical':
        return <Settings className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-full max-w-md h-[600px] shadow-2xl z-50 flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-800 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Zynkra AI Assistant — Preview</h3>
                <p className="text-sm opacity-90">Customer service & community management</p>
              </div>
            </div>
            <div className="mt-2 text-right">
              <Link to="/ai/on-device" className="text-xs underline opacity-90 hover:opacity-100">
                Try on-device AI →
              </Link>
            </div>
          </div>

          {/* Tabs for chat vs FAQ */}
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Live Chat
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col p-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] flex items-start gap-2 ${
                          message.role === 'user'
                            ? 'flex-row-reverse'
                            : 'flex-row'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="mt-4 flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Frequently Asked Questions
                </h4>
                {Array.from(new Set(faqDatabase.map(faq => faq.category))).map(category => (
                  <div key={category} className="space-y-2">
                    <h5 className="font-medium text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category}
                    </h5>
                    {faqDatabase
                      .filter(faq => faq.category === category)
                      .map((faq, index) => (
                        <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                          <button
                            onClick={() => {
                              setInputValue(faq.question);
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }}
                            className="text-left w-full"
                          >
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {faq.question}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Click to ask this question
                            </p>
                          </button>
                        </Card>
                      ))}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </>
  );
}