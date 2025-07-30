
import React, { useState, useRef, useEffect } from 'react';
import { getAiForgeResponse } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { AiPersona } from '../../types';
import { Bot, User, BrainCircuit, Send } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start my-4 gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
            {isModel && (
                 <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    <Bot className="text-white"/>
                </div>
            )}
            <div className={`px-4 py-3 rounded-xl max-w-2xl shadow-sm ${isModel ? 'bg-surface-dark text-text-primary-dark' : 'bg-brand-primary text-white'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
             {!isModel && (
                 <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    <User className="text-brand-secondary"/>
                </div>
            )}
        </div>
    );
};

export const Dentforge: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: t('dentforge.welcomeMessage') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<AiPersona>('Default');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages(prev => {
        if(prev.length > 0 && prev[0].role === 'model') {
            const newMessages = [...prev];
            newMessages[0] = { ...newMessages[0], text: t('dentforge.welcomeMessage') };
            return newMessages;
        }
        return prev;
    });
  }, [t]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const history = messages.map(msg => ({ role: msg.role, parts: [{text: msg.text}] }));
        const responseText = await getAiForgeResponse(history, input, persona);
        const modelMessage: Message = { role: 'model', text: responseText };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error('Error getting response from DentForge:', error);
        const errorMessage: Message = { role: 'model', text: t('dentforge.error') };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const personas: { name: AiPersona, key: string, descKey: string }[] = [
      { name: 'Default', key: 'dentforge.persona.default', descKey: 'dentforge.persona.default.desc' },
      { name: 'Friendly Colleague', key: 'dentforge.persona.friendly', descKey: 'dentforge.persona.friendly.desc' },
      { name: 'Seasoned Professor', key: 'dentforge.persona.professor', descKey: 'dentforge.persona.professor.desc' },
      { name: 'Succinct Summarizer', key: 'dentforge.persona.summarizer', descKey: 'dentforge.persona.summarizer.desc' },
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto pr-4">
        {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
        {isLoading && (
            <div className="flex items-start my-4 justify-start gap-3">
                 <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    <Bot className="text-white"/>
                </div>
                <div className="px-4 py-3 rounded-xl bg-surface-dark text-text-primary-dark">
                    <Spinner/>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 p-2 rounded-lg border border-border-dark shadow-sm bg-surface-dark">
        <div className="flex items-center flex-wrap gap-2 px-2 pb-2 border-b border-border-dark">
            <span className="text-xs font-semibold text-text-secondary-dark flex items-center gap-1"><BrainCircuit size={14} /> {t('dentforge.persona.title')}</span>
            {personas.map(p => (
                <button 
                    key={p.name}
                    onClick={() => setPersona(p.name)}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${persona === p.name ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark hover:bg-border-dark'}`}
                    title={t(p.descKey)}
                >
                    {t(p.key)}
                </button>
            ))}
        </div>
        <div className="flex items-center mt-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder={t('dentforge.inputPlaceholder')}
              className="flex-1 bg-transparent p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || input.trim() === ''}
              className="bg-brand-primary text-white rounded-md w-10 h-10 flex items-center justify-center disabled:bg-teal-800 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors"
            >
              <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};