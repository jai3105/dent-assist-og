
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeSymptoms } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { SymptomAnalysis } from '../../types';
import { HeartPulse, ShieldAlert, Siren, Stethoscope, AlertTriangle, User, Bot, Send } from 'lucide-react';
import type { Content } from "@google/genai";

const UrgencyIndicator: React.FC<{ urgency: SymptomAnalysis['urgency'] }> = ({ urgency }) => {
    const styles = {
        'Non-urgent': {
            icon: <HeartPulse />,
            text: 'text-green-300',
            bg: 'bg-green-500/20',
            border: 'border-green-500/50'
        },
        'See a dentist soon': {
            icon: <Stethoscope />,
            text: 'text-yellow-300',
            bg: 'bg-yellow-500/20',
            border: 'border-yellow-500/50'
        },
        'Urgent dental care recommended': {
            icon: <Siren />,
            text: 'text-red-300',
            bg: 'bg-red-500/20',
            border: 'border-red-500/50'
        },
    };
    const currentStyle = styles[urgency] || styles['See a dentist soon'];

    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${currentStyle.bg} ${currentStyle.border} border-l-4`}>
            <div className={`text-4xl ${currentStyle.text}`}>{currentStyle.icon}</div>
            <div>
                <p className={`font-bold text-lg ${currentStyle.text}`}>{urgency}</p>
            </div>
        </div>
    );
};


// New ChatMessage component
const ChatMessage: React.FC<{ message: { role: 'user' | 'model'; text: string; analysis?: SymptomAnalysis } }> = ({ message }) => {
    const isModel = message.role === 'model';

    if (isModel) {
        return (
            <div className="flex items-start gap-3 my-4">
                <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    <Bot className="text-white" />
                </div>
                <div className="flex-1 space-y-4">
                    {message.text && (
                        <div className="bg-surface-dark text-text-primary-dark rounded-lg p-4 shadow-sm border border-border-dark">
                            <p className="font-semibold">{message.text}</p>
                        </div>
                    )}
                    {message.analysis && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-amber-900/50 border-l-4 border-brand-secondary text-amber-200 p-4 rounded-r-lg flex items-center gap-3">
                                <ShieldAlert size={24} className="flex-shrink-0" />
                                <div><h4 className="font-bold">Disclaimer</h4><p className="text-sm">{message.analysis.disclaimer}</p></div>
                            </div>
                            <UrgencyIndicator urgency={message.analysis.urgency} />
                            <div className="bg-surface-dark p-6 rounded-lg border border-border-dark">
                                <h3 className="text-xl font-bold text-brand-primary mb-3">Possible Conditions</h3>
                                <div className="space-y-3">
                                    {message.analysis.possibleConditions.map((cond, i) => (
                                        <div key={i} className="p-3 bg-background-dark rounded-md">
                                            <p className="font-semibold text-text-primary-dark">{cond.name}</p>
                                            <p className="text-sm text-text-secondary-dark">{cond.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-surface-dark p-6 rounded-lg border border-border-dark">
                                <h3 className="text-xl font-bold text-brand-primary mb-3">Recommended Actions</h3>
                                <ul className="list-disc list-inside space-y-2 text-text-secondary-dark">
                                    {message.analysis.recommendedActions.map((action, i) => <li key={i}>{action}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 my-4 justify-end">
            <div className="bg-brand-primary text-white rounded-lg p-4 max-w-xl shadow-sm">
                <p>{message.text}</p>
            </div>
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                <User className="text-brand-secondary" />
            </div>
        </div>
    );
};


export const SymptomChecker: React.FC = () => {
    // State for the new conversational UI
    const [conversation, setConversation] = useState<Array<{ role: 'user' | 'model'; text: string; analysis?: SymptomAnalysis }>>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [conversation]);

    const handleSendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const newUserMessage = { role: 'user' as const, text: messageText };
        const newConversation = [...conversation, newUserMessage];
        setConversation(newConversation);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        // Convert conversation to the format expected by the API
        const history: Content[] = newConversation.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
        
        // Remove the 'text' from the last model message in history if it contained an analysis
        // The AI should respond based on the user's new message, not its own previous analysis text
        if (history.length > 1) {
            const lastMessage = history[history.length - 2];
            const lastConvMessage = newConversation[newConversation.length - 2];
            if (lastConvMessage.role === 'model' && lastConvMessage.analysis) {
                lastMessage.parts = [{ text: lastConvMessage.analysis.followUpQuestion || '' }];
            }
        }

        try {
            const result = await analyzeSymptoms(messageText, history);
            if (result.error) {
                setError(result.error);
                setConversation(prev => prev.slice(0, -1)); // Remove the user message if AI fails
            } else {
                const newAiMessage = {
                    role: 'model' as const,
                    text: result.followUpQuestion || (result.isComplete ? "I have provided my analysis. Please consult a dentist for a diagnosis." : ""),
                    analysis: result
                };
                setConversation(prev => [...prev, newAiMessage]);
                if (result.isComplete) {
                    setIsComplete(true);
                }
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            setConversation(prev => prev.slice(0, -1)); // Rollback user message on error
        } finally {
            setIsLoading(false);
        }
    }, [conversation, isLoading]);
    
    const startOver = () => {
        setConversation([]);
        setUserInput('');
        setIsLoading(false);
        setError(null);
        setIsComplete(false);
    }

    const isChatStarted = conversation.length > 0;

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
            <div className="text-center mb-4">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">AI Symptom Checker</h1>
                <p className="text-text-secondary-dark mt-2">Describe your dental symptoms to get AI-powered insights. This is not a diagnosis.</p>
            </div>

            <div className="flex-grow bg-surface-dark rounded-lg shadow-lg border border-border-dark flex flex-col overflow-hidden">
                <div className="flex-grow p-6 overflow-y-auto">
                    {!isChatStarted && (
                        <div className="text-center text-text-secondary-dark flex flex-col items-center justify-center h-full">
                            <HeartPulse size={48} className="mb-4" />
                            <p className="font-semibold">Ready to help!</p>
                            <p>Type your symptoms below to begin.</p>
                        </div>
                    )}
                    {conversation.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                    {isLoading && (
                         <div className="flex items-start gap-3 my-4">
                            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                <Bot className="text-white" />
                            </div>
                            <div className="bg-background-dark text-text-primary-dark rounded-lg p-4 shadow-sm border border-border-dark">
                               <Spinner/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {error && (
                    <div className="p-4 m-4 bg-red-900/20 border border-red-500 text-red-300 rounded-lg flex items-center gap-4">
                        <AlertTriangle />
                        <div><h3 className="font-bold">An Error Occurred</h3><p>{error}</p></div>
                    </div>
                )}
                
                <div className="p-4 border-t border-border-dark">
                    {isComplete ? (
                        <div className="text-center">
                            <p className="text-text-secondary-dark mb-2">The session is complete. Please consult a dentist.</p>
                             <button onClick={startOver} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500">
                                Start Over
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                             <input
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSendMessage(userInput)}
                                placeholder={isChatStarted ? "Answer the question here..." : "Describe your symptoms..."}
                                className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                disabled={isLoading}
                            />
                             <button
                                onClick={() => handleSendMessage(userInput)}
                                disabled={isLoading || !userInput.trim()}
                                className="bg-brand-primary text-white font-bold p-3 rounded-lg hover:bg-teal-500 disabled:bg-teal-800"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
