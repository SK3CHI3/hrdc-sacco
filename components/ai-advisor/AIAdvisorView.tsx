'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Send,
  Bot,
  User,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';
import { Header } from '@/components/layout/Header';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface AIAdvisorProps {
  role: string;
  userName: string;
}

export function AIAdvisorView({ role, userName }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${userName}. I am your Alexis AI advisor. I can help you analyze financial trends, detect discrepancies, or generate comprehensive reports based on current SACCO data. How can I assist you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = {
    MEMBER: [
      'What is my loan eligibility?',
      'How can I improve my savings?',
      'Generate my financial health report',
      'Analyze my repayment history'
    ],
    AUDITOR: [
      'Detect transaction discrepancies',
      'Check RLS policy compliance',
      'Generate monthly audit summary',
      'Identify high-risk accounts'
    ],
    ADMIN: [
      'Liquidity forecast for Q3',
      'Analyze member growth trends',
      'Risk assessment of current loans',
      'Generate SACCO performance report'
    ],
    SUPER_ADMIN: [
      'Full system health audit',
      'Strategic growth recommendations',
      'Revenue and expense analysis',
      'Regulatory compliance report'
    ]
  }[role] || [
    'Analyze current trends',
    'Generate summary report',
    'Security status check'
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I am processing your request for "${text}". I have analyzed the current database records and I am generating the insights for you. Based on the current trends, everything looks stable, but I recommend a deeper review of the recent high-volume transactions.`
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Financial Advisor
            </h1>
            <p className="text-slate-500 font-medium">Powered by Alexis Intelligence</p>
          </div>
          <Button variant="outline" className="border-2 font-bold gap-2">
            <FileText className="h-4 w-4" />
            Generate Full Report
          </Button>
        </div>

        <Card className="flex-1 flex flex-col card-premium overflow-hidden border-2 shadow-xl shadow-slate-200/50 min-h-[600px]">
          {/* Chat History */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/50"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-200' : 'bg-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="h-5 w-5 text-slate-600" /> : <Bot className="h-5 w-5 text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-1 items-center h-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t bg-white">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs font-bold px-3 py-2 rounded-full border-2 border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Type your question or request a report..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary/50 transition-all font-medium pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-white text-[10px] text-slate-400 border-slate-200">
                    Enter ↵
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 rounded-xl shadow-lg shadow-primary/20"
              >
                {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Alexis AI • Real-time Financial Analysis Engine
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
