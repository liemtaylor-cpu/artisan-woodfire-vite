import { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

const WELCOME = {
  owner:   "Hi! I'm your operations assistant. I have live access to your staff, inventory, sales, and menu. Ask me anything — or say \"generate a schedule\" to build a weekly rota.",
  manager: "Hi! I'm your operations assistant. I can see your staff roster with competency scores, inventory levels, tonight's sales, and your menu. Ask me anything, or ask me to generate a schedule.",
  employee: "Hey! I'm your kitchen assistant. Ask me about prep recipes, techniques, the wood fire, or anything you need help with during service.",
};

const QUICK_ACTIONS = {
  owner:   ["Generate this week's schedule", "What's low on stock?", "Tonight's revenue so far", "Who's best for wood fire?"],
  manager: ["Generate this week's schedule", "What's low on stock?", "Who covers expo tonight?", "Competency gaps on the line?"],
  employee: ["How do I make the dough?", "Wood fire startup steps", "How do I make the pesto?", "What's on my duties today?"],
};

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-0.5">AI</div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-orange-600 text-white rounded-br-sm'
          : 'bg-stone-100 text-stone-800 rounded-bl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

const AiChat = ({ role }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !started) {
      setStarted(true);
      setMessages([{ role: 'assistant', content: WELCOME[role] || WELCOME.employee }]);
    }
  }, [open, started, role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setStreaming(true);

    // add placeholder while waiting
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }));

    try {
      const data = await api.aiChat(apiMessages, role);

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: data.reply };
        return copy;
      });
    } catch (err) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME[role] || WELCOME.employee }]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-40 w-[min(380px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
          style={{ height: 'min(540px, calc(100vh - 10rem))' }}>

          {/* Header */}
          <div className="bg-orange-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-orange-400 flex items-center justify-center text-white text-xs font-bold">AI</div>
              <div>
                <p className="text-white font-semibold text-sm">Kitchen AI</p>
                <p className="text-orange-200 text-xs capitalize">{role} mode</p>
              </div>
            </div>
            <button onClick={clearChat} className="text-orange-200 hover:text-white text-xs transition-colors">Clear</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-0.5">AI</div>
                <div className="bg-stone-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions — only when no user messages yet */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {(QUICK_ACTIONS[role] || QUICK_ACTIONS.employee).map(a => (
                <button key={a} onClick={() => sendMessage(a)}
                  className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1.5 hover:bg-orange-100 transition-colors text-left">
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-stone-100 shrink-0 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={role === 'employee' ? 'Ask about prep, recipes…' : 'Ask anything about operations…'}
              disabled={streaming}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
            />
            <button onClick={() => sendMessage()} disabled={streaming || !input.trim()}
              className="w-9 h-9 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;
