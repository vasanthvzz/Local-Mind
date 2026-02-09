import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Loader2, FileText, ShieldAlert, Sparkles, Plus, Trash2, PanelLeft, StopCircle } from 'lucide-react';
import { Conversation, Message, QueryType, SenderType } from '../types';
import { api } from '../services/APIService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  activeConversationId: string | null;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activeConversationId,
  onNewChat,
  onDeleteChat,
  isSidebarOpen,
  onToggleSidebar
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Load chat history
  useEffect(() => {
    const loadData = async () => {
      if (!activeConversationId) {
        setConversation(null);
        setMessages([]);
        return;
      }
      setLoading(true);
      try {
        const msgs = await api.getMessages(activeConversationId);
        const active = await api.getConversation(activeConversationId);
        setConversation(active);
        setMessages(msgs);
      } catch (error) {
        console.error("Failed to load chat data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeConversationId]);

  // Scroll to bottom when switching conversations (instant, no animation)
  useEffect(() => {
    if (activeConversationId && !loading && messages.length > 0) {
      // Instantly set scroll position to bottom without any animation
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
    prevConversationIdRef.current = activeConversationId;
  }, [activeConversationId, loading]);

  // Auto-scroll when new messages arrive in the current conversation
  useEffect(() => {
    const isSameConversation = prevConversationIdRef.current === activeConversationId;
    const messageCountIncreased = messages.length > prevMessageCountRef.current;

    if (isSameConversation && messageCountIncreased) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const handleSend = async () => {
    // Immediate check with ref to prevent rapid multiple sends
    if (!input.trim() || !activeConversationId || loading || isProcessingRef.current) return;

    // Immediately set processing flag to block subsequent calls
    isProcessingRef.current = true;

    const text = input;
    setInput('');
    setLoading(true);

    const tempUserMsgId = crypto.randomUUID();
    const tempAssistantId = crypto.randomUUID();

    const optimisticUserMsg: Message = {
      id: tempUserMsgId,
      conversation_id: activeConversationId,
      text: text,
      sender: SenderType.USER,
      created_at: new Date().toISOString()
    };

    const assistantPlaceholder: Message = {
      id: tempAssistantId,
      conversation_id: activeConversationId,
      text: '',
      sender: SenderType.ASSISTANT,
      created_at: new Date().toISOString()
    };

    // 1. Optimistically Update UI immediately
    setMessages(prev => [...prev, optimisticUserMsg, assistantPlaceholder]);

    let trackingAssistantId: string = tempAssistantId;

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const { userMessage: sentUserMsg, assistantId: sentAssistantId } = await api.sendMessageStream(
        activeConversationId,
        text,
        conversation?.conv_type || QueryType.GENERAL,
        (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === trackingAssistantId
              ? { ...m, text: m.text + chunk }
              : m
          ));
        },
        abortControllerRef.current.signal
      );

      // Update IDs with real ones from backend if available
      setMessages(prev => prev.map(m => {
        if (m.id === tempUserMsgId && sentUserMsg.id && sentUserMsg.id !== tempUserMsgId) {
          return { ...m, id: sentUserMsg.id };
        }
        if (m.id === tempAssistantId && sentAssistantId && sentAssistantId !== tempAssistantId) {
          return { ...m, id: sentAssistantId };
        }
        return m;
      }));

      if (sentAssistantId) {
        trackingAssistantId = sentAssistantId;
      }

    } catch (error) {
      console.error("Failed to send message", error);
      // Only rollback if not aborted by user
      if (error.name !== 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== tempUserMsgId && m.id !== tempAssistantId));
      }
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    isProcessingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && !isProcessingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative transition-colors duration-300">
      {/* Header */}
      <header className="h-14 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors ${!isSidebarOpen ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white' : ''}`}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {conversation && (
            <>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${conversation.conv_type === QueryType.STRICT_RAG ? 'bg-red-500' :
                conversation.conv_type === QueryType.RAG ? 'bg-green-500' : 'bg-blue-500'
                }`} />
              <h2 className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate">{conversation.title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 capitalize font-medium hidden sm:block">
                {conversation.conv_type.replace('_', ' ')}
              </span>
            </>
          )}
        </div>

        {conversation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteChat(activeConversationId!)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors"
              title="Delete Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {!activeConversationId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Sparkles className="w-6 h-6 text-black dark:text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Local Mind</h2>
          <p className="max-w-md mb-8 text-gray-500 dark:text-gray-400">Select a conversation from the sidebar or start a new query to interact with your knowledge base.</p>
          <button
            onClick={onNewChat}
            className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Start New Chat
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={messagesContainerRef} key={activeConversationId} className="flex-1 overflow-y-auto p-4 space-y-6 animate-fadeIn">
            {messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-fadeIn fill-mode-forwards" style={{ animationDelay: '0.1s' }}>
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-transform duration-500">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4">
                  Welcome to Local Mind
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed mb-8">
                  I am your personal AI agent, ready to assist you.
                  <br className="hidden sm:block" />
                  Ask me anything about your documents or start a general discussion.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold block text-gray-900 dark:text-white mb-1">🔒 Private & Secure</span>
                    Your data stays local and never leaves your machine.
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold block text-gray-900 dark:text-white mb-1">🧠 Knowledge Base</span>
                    Connect your documents for context-aware answers.
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl mx-auto ${msg.sender === SenderType.USER ? 'flex-row-reverse' : ''
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${msg.sender === SenderType.USER
                    ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                    : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white'
                    }`}>
                    {msg.sender === SenderType.USER ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === SenderType.USER ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.sender === SenderType.USER
                      ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-transparent dark:border-gray-800'
                      }`}>
                      {msg.sender === SenderType.ASSISTANT ? (
                        <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:font-semibold prose-headings:my-2 prose-ul:my-1 prose-li:my-0 break-words leading-normal">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}

                      {msg.sender === SenderType.ASSISTANT && msg.text === '' && (
                        <div className="flex items-center gap-1 h-5">
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot typing-dot-1"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot typing-dot-2"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot typing-dot-3"></span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900">
            <div className="max-w-3xl mx-auto relative">
              <textarea
                value={input}
                onChange={(e) => !loading && setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={loading ? "AI is responding..." : "Type your message..."}
                disabled={loading}
                readOnly={loading}
                className={`w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl pl-4 pr-14 py-3.5 resize-none h-[56px] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white border border-gray-200 dark:border-gray-800 transition-all text-sm shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button
                onClick={loading ? handleStop : handleSend}
                disabled={!loading && !input.trim()}
                className={`absolute right-2 top-2 p-2 rounded-lg transition-colors shadow-sm disabled:shadow-none ${loading
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white dark:text-black'
                  }`}
                title={loading ? "Stop generation" : "Send message"}
              >
                {loading ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="max-w-3xl mx-auto mt-2 flex justify-center gap-4 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">
              <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Strict: {conversation?.conv_type === 'strict_rag' ? 'On' : 'Off'}</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Context: {conversation?.conv_type === 'general' ? 'None' : 'Active'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};