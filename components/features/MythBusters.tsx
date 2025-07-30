
import React, { useState, useCallback } from 'react';
import { bustDentalMyth } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { MythBusterAnalysis } from '../../types';
import { Check, Ghost, Wand2, X, AlertTriangle } from 'lucide-react';

const popularMyths = [
    "Is charcoal toothpaste better for whitening teeth?",
    "Do you only need to go to the dentist if your teeth hurt?",
    "Does chewing sugar-free gum replace brushing?",
    "Is it true that the harder you brush, the cleaner your teeth?",
    "Are dental x-rays dangerous?",
    "Can you get rid of a cavity by brushing really well?",
];

const VerdictCard: React.FC<{ analysis: MythBusterAnalysis }> = ({ analysis }) => {
    const styles = {
        Fact: { icon: <Check size={48} />, bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500' },
        Fiction: { icon: <X size={48} />, bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500' },
        "It's Complicated": { icon: <Wand2 size={48} />, bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500' },
    };
    const currentStyle = styles[analysis.verdict];
    
    return (
        <div className={`p-6 rounded-lg border-2 ${currentStyle.border} ${currentStyle.bg}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`flex-shrink-0 w-24 h-24 rounded-full flex items-center justify-center ${currentStyle.bg} border-4 ${currentStyle.border}`}>
                    {currentStyle.icon}
                </div>
                <div>
                    <p className={`text-4xl font-extrabold ${currentStyle.text}`}>{analysis.verdict}</p>
                    <p className="text-text-primary-dark mt-1 text-lg">Regarding: "{analysis.myth}"</p>
                </div>
            </div>
            <p className="text-text-secondary-dark mt-6 whitespace-pre-wrap">{analysis.explanation}</p>
        </div>
    );
};


export const MythBusters: React.FC = () => {
    const [query, setQuery] = useState('');
    const [analysis, setAnalysis] = useState<MythBusterAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBustMyth = useCallback(async (myth: string) => {
        if (!myth.trim()) return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setQuery(myth);
        try {
            const result = await bustDentalMyth(myth);
            if (result.error) {
                setError(result.error);
            } else {
                setAnalysis(result);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <Ghost className="mx-auto h-16 w-16 text-brand-secondary mb-2" />
                <h1 className="text-4xl font-extrabold text-text-primary-dark">Dental Myth Busters</h1>
                <p className="text-text-secondary-dark mt-2">Fact or fiction? Let our AI separate dental truth from toothy tales.</p>
            </div>
            
            <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                <label htmlFor="myth-input" className="block text-lg font-semibold text-text-primary-dark mb-2">Ask about a dental myth</label>
                <div className="flex items-center gap-2">
                    <input
                        id="myth-input"
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="e.g., 'Are fruit juices good for teeth?'"
                        className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleBustMyth(query)}
                        disabled={isLoading || !query.trim()}
                        className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-teal-800"
                    >
                        {isLoading ? <Spinner/> : 'Bust!'}
                    </button>
                </div>
            </div>

            {isLoading && (
                 <div className="text-center p-8"><Spinner /></div>
            )}
            
            {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4">
                    <AlertTriangle />
                    <div><h3 className="font-bold">An Error Occurred</h3><p>{error}</p></div>
                </div>
            )}

            {analysis && (
                <div className="animate-fade-in"><VerdictCard analysis={analysis} /></div>
            )}

            {!isLoading && !analysis && (
                <div className="pt-4">
                    <h3 className="text-center font-semibold text-text-primary-dark mb-4">Or explore a common myth:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {popularMyths.map(myth => (
                            <button key={myth} onClick={() => handleBustMyth(myth)} className="text-left bg-surface-dark p-4 rounded-lg hover:bg-border-dark transition-colors duration-200 text-sm text-text-secondary-dark font-medium">
                                {myth}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
