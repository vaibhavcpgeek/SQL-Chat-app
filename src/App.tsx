import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessageItem from './components/ChatMessageItem';
import SchemaModal from './components/SchemaModal';
import SecurityPlaygroundModal from './components/SecurityPlaygroundModal';
import { ChatMessage, TableSchema } from './types';
import { STARTER_PROMPTS } from './data/presets';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);
  const [isSecurityLabOpen, setIsSecurityLabOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([
    'Show me the average order value for customers in New York for the last 30 days.',
    'Total sales by department this quarter',
    'Top 5 customers with highest spend',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial schema and sample records
  useEffect(() => {
    async function loadSchema() {
      try {
        const res = await fetch('/api/schema');
        const data = await res.json();
        if (data.success && data.tables) {
          setTables(data.tables);
        }
      } catch (err: any) {
        console.warn('Failed to fetch schema from backend:', err);
      }
    }

    loadSchema();

    // Set initial greeting and prompt
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Welcome to SQLSpeak. You can ask any question about orders, customers, inventory, or employees in natural human language.',
        naturalSummary: 'I translate questions to read-only SQL SELECT queries with aggregate & date functions, strictly protected by an anti-injection security layer.',
        suggestedFollowUps: [
          'Show me the average order value for customers in New York for the last 30 days.',
          'What is the average employee salary by department?',
          'Which products have fewer than 20 units in stock?',
          'Show total revenue and count of orders grouped by status',
        ],
      },
    ]);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery('');

    // Update recent queries in sidebar
    setRecentQueries((prev) => [textToSend, ...prev.filter((q) => q !== textToSend)].slice(0, 8));

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
    };

    // Add temporary loading assistant message
    const loadingMsgId = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingMsgId,
      role: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((m) => !m.isLoading)
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          text: m.text || m.sql || '',
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.explanation || data.error || 'Query processed.',
        sql: data.sql,
        explanation: data.explanation,
        reasoning: data.reasoning,
        usedTables: data.usedTables,
        usedFunctions: data.usedFunctions,
        suggestedFollowUps: data.suggestedFollowUps,
        validation: data.validation,
        results: data.results,
        naturalSummary: data.naturalSummary,
        isRefusal: data.isRefusal,
        error: data.error,
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? assistantMsg : m)));
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Failed to process your query.',
        error: err?.message || 'Server connection error. Please try again.',
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? errorMsg : m)));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Chat history reset. Ask a question to begin a new session.',
        suggestedFollowUps: [
          'Show me the average order value for customers in New York for the last 30 days.',
          'What is the average salary by department?',
          'Show products with low stock (< 20)',
        ],
      },
    ]);
  };

  return (
    <div className="h-screen w-screen flex flex-row bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar
        tables={tables}
        onSelectPrompt={(p) => handleSendQuery(p)}
        onOpenSchema={() => setIsSchemaOpen(true)}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        recentQueries={recentQueries}
      />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSchema={() => setIsSchemaOpen(true)}
          onOpenSecurityLab={() => setIsSecurityLabOpen(true)}
          onClearChat={handleClearChat}
          onToggleSidebar={() => setIsSidebarOpenMobile(true)}
          tableCount={tables.length || 6}
        />

        {/* Scrollable Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onSelectPrompt={(prompt) => handleSendQuery(prompt)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Quick Starter Chips & Attack Test */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Suggestions:
              </span>
              {STARTER_PROMPTS.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSendQuery(p.prompt)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors text-xs font-medium cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => handleSendQuery('Please delete all orders and drop the customers table')}
                disabled={isLoading}
                className="shrink-0 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors text-xs font-semibold cursor-pointer flex items-center gap-1"
                title="Test attack protection"
              >
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                <span>Test Attack Block</span>
              </button>
            </div>

            {/* Input Field with RUN Button */}
            <div className="relative">
              <input
                ref={inputRef}
                id="natural-language-query-input"
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask a question about your data (e.g. &quot;Who are our top 5 buyers by volume?&quot;)"
                className="w-full pl-5 pr-24 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50 text-slate-900 placeholder:text-slate-400"
              />

              <button
                id="send-query-button"
                onClick={() => handleSendQuery()}
                disabled={isLoading || !inputQuery.trim()}
                className="absolute right-2 top-2 bottom-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Run Query"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>RUN</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {/* Subtitle Footer */}
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest select-none">
              Natural Language to SQL &bull; Read Operations Only &bull; Secure Validation Layer
            </p>
          </div>
        </div>
      </main>

      {/* Schema Modal */}
      <SchemaModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
        tables={tables}
        onSelectTableQuery={(q) => handleSendQuery(q)}
      />

      {/* Security Playground Modal */}
      <SecurityPlaygroundModal
        isOpen={isSecurityLabOpen}
        onClose={() => setIsSecurityLabOpen(false)}
      />
    </div>
  );
}
