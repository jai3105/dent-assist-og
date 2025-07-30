import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcedureInfo } from '../../types';
import { getProcedureInformation, startProcedureChat } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { BookHeart, CheckCircle, ListOrdered, MessageSquare, Search, Send, Bot, User, AlertTriangle } from 'lucide-react';
import type { Chat } from '@google/genai';

const commonProcedures = [
    "Dental Fillings", "Root Canal Treatment", "Tooth Extraction", "Dental Crowns", "Dental Implants", "Teeth Whitening", "Braces", "Scaling and Polishing"
];

const ProcedureInfoDisplay: React.FC<{ info: ProcedureInfo }> = ({ info }) => (
    <div className="space-y-6">
        <div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-text-primary-dark mb-3"><BookHeart className="text-brand-primary" /> What is it?</h3>
            <p className="text-text-secondary-dark">{info.description}</p>
        </div>
        <div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-text-primary-dark mb-3"><ListOrdered className="text-brand-primary" /> Procedure Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-text-secondary-dark">
                {info.procedureSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
        </div>
        <div>
            <h3 className="flex items-center gap-3 text-2xl font-bold text-text-primary-dark mb-3"><CheckCircle className="text-brand-primary" /> Aftercare</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary-dark">
                {info.postOpCare.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
        </div>
    </div>
);

const ChatInterface: React.FC<{ procedureName: string }> = ({ procedureName }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const chatInstance = startProcedureChat(procedureName);
        setChat(chatInstance);
        setHistory([{ role: 'model', text: `Hi! I can answer any other questions you have about ${procedureName}. What's on your mind?` }]);
    }, [procedureName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;
        const userMessage = { role: 'user' as const, text: input };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });
            setHistory(prev => [...prev, { role: 'model', text: response.text }]);
        } catch (e) {
            console.error(e);
            setHistory(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble responding right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-dark p-6 rounded-lg border border-border-dark flex flex-col h-[70vh]">
            <h3 className="flex items-center gap-3 text-2xl font-bold text-text-primary-dark mb-4 border-b border-border-dark pb-3"><MessageSquare className="text-brand-secondary"/> Ask a Follow-up Question</h3>
            <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'model' ? 'justify-start' : 'justify-end'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-white"/></div>}
                        <div className={`px-4 py-2 rounded-lg max-w-md shadow-sm ${msg.role === 'model' ? 'bg-surface-dark' : 'bg-brand-primary text-white'}`}>{msg.text}</div>
                        {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User size={18} className="text-brand-secondary"/></div>}
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-lg bg-surface-dark"><Spinner/></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex items-center gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="e.g., How long does it take?" className="flex-1 bg-surface-dark border border-border-dark rounded-full py-2 px-4 text-sm text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-brand-primary p-2.5 rounded-full text-white disabled:bg-teal-800"><Send size={18}/></button>
            </div>
        </div>
    );
};

export const ProcedurePedia: React.FC = () => {
    const [query, setQuery] = useState('');
    const [info, setInfo] = useState<ProcedureInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async (procedure: string) => {
        if (!procedure.trim()) return;
        setIsLoading(true);
        setError(null);
        setInfo(null);
        try {
            const result = await getProcedureInformation(procedure);
            if (result.error) {
                setError(result.error);
            } else {
                setInfo(result);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">ProcedurePedia</h1>
                <p className="text-text-secondary-dark mt-2 max-w-2xl mx-auto">Demystifying dental treatments. Search for a procedure to get a simple, AI-powered explanation.</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 bg-surface-dark p-2 rounded-lg shadow-lg border border-border-dark focus-within:ring-2 focus-within:ring-brand-primary">
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch(query)} placeholder="Search for a procedure like 'Root Canal'..." className="flex-grow bg-transparent p-2 text-lg text-text-primary-dark focus:outline-none" />
                    <button onClick={() => handleSearch(query)} disabled={isLoading || !query.trim()} className="bg-brand-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-teal-500 disabled:bg-teal-800 flex items-center gap-2"><Search size={18}/>Search</button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-12"><Spinner /></div>
            ) : error ? (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4 max-w-2xl mx-auto"><AlertTriangle/><div><h3 className="font-bold">An Error Occurred</h3><p>{error}</p></div></div>
            ) : info ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-3 bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark">
                        <ProcedureInfoDisplay info={info} />
                    </div>
                    <div className="lg:col-span-2">
                        <ChatInterface procedureName={info.title} />
                    </div>
                </div>
            ) : (
                <div className="text-center pt-8">
                    <h3 className="text-lg font-semibold text-text-primary-dark mb-4">Or choose a common procedure:</h3>
                    <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                        {commonProcedures.map(p => <button key={p} onClick={() => handleSearch(p)} className="px-4 py-2 bg-surface-dark rounded-full text-text-secondary-dark font-medium hover:bg-border-dark hover:text-white transition-colors">{p}</button>)}
                    </div>
                </div>
            )}
        </div>
    );
};