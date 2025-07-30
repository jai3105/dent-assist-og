
import React, { useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getTraumaCareGuide } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { TraumaCareGuide } from '../../types';
import { ChevronLeft, AlertTriangle, LifeBuoy, ShieldAlert, Smile, HeartCrack, Frown, HeartPulse, UserX, Puzzle, Check, Search, Wand2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const traumaTypes = [
    { key: 'knocked_out_tooth', labelKey: 'trauma.knockedOutTooth', icon: <Smile size={48} /> },
    { key: 'chipped_tooth', labelKey: 'trauma.chippedTooth', icon: <HeartCrack size={48} /> },
    { key: 'toothache', labelKey: 'trauma.toothache', icon: <Frown size={48} /> },
    { key: 'bitten_lip_tongue', labelKey: 'trauma.bittenLipTongue', icon: <HeartPulse size={48} /> },
    { key: 'jaw_injury', labelKey: 'trauma.jawInjury', icon: <UserX size={48} /> },
    { key: 'lost_filling_crown', labelKey: 'trauma.lostFillingCrown', icon: <Puzzle size={48} /> },
];

const TraumaCard: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; }> = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl w-full text-center transition-all duration-300 transform hover:scale-105 bg-surface-dark text-text-primary-dark shadow-md border border-border-dark hover:bg-border-dark hover:border-brand-primary"
        aria-label={`Get guidance for ${label}`}
    >
        <div className="text-brand-primary">{icon}</div>
        <span className="font-bold text-lg mt-2">{label}</span>
    </button>
);

const UrgencyIndicator: React.FC<{ level: TraumaCareGuide['urgency'] }> = ({ level }) => {
    const { t } = useTranslation();
    const styles = {
        Low: { text: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500' },
        Moderate: { text: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
        High: { text: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500' },
    };
    const currentStyle = styles[level] || styles.Moderate;
    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${currentStyle.bg} ${currentStyle.border} border-l-4`} role="alert">
            <div className={`text-4xl ${currentStyle.text}`} aria-hidden="true"><ShieldAlert /></div>
            <div>
                <p className="text-sm text-text-secondary-dark">{t('trauma.guide.urgency')}</p>
                <p className={`font-bold text-2xl ${currentStyle.text}`}>{level}</p>
            </div>
        </div>
    );
};

const InteractiveChecklist: React.FC<{ items: string[] }> = ({ items }) => {
    const [checkedState, setCheckedState] = useState(new Array(items.length).fill(false));

    const handleCheckChange = (position: number) => {
        const updatedCheckedState = checkedState.map((item, index) => index === position ? !item : item);
        setCheckedState(updatedCheckedState);
    };
    
    return (
        <div className="space-y-3">
            {items.map((step, index) => (
                 <div key={index} onClick={() => handleCheckChange(index)} className={`p-3 rounded-lg flex items-start gap-4 cursor-pointer transition-all ${checkedState[index] ? 'bg-green-500/10' : 'bg-background-dark hover:bg-border-dark'}`}>
                    <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checkedState[index] ? 'bg-green-500 border-green-400' : 'border-border-dark'}`}>
                        {checkedState[index] && <Check size={16} className="text-white"/>}
                    </div>
                    <p className={`flex-1 ${checkedState[index] ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>{step}</p>
                </div>
            ))}
        </div>
    );
};


export const TraumaCareCompanion: React.FC = () => {
    const { t } = useTranslation();
    const [selectedTrauma, setSelectedTrauma] = useState<string | null>(null);
    const [customQuery, setCustomQuery] = useState('');
    const [guide, setGuide] = useState<TraumaCareGuide | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetGuidance = useCallback(async (traumaQuery: string) => {
        if (!traumaQuery.trim()) return;
        setSelectedTrauma(traumaQuery);
        setIsLoading(true);
        setError(null);
        setGuide(null);
        try {
            const result = await getTraumaCareGuide(traumaQuery);
            if (result.error) {
                setError(result.error);
            } else {
                setGuide(result);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch guidance. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetView = () => {
        setSelectedTrauma(null);
        setGuide(null);
        setError(null);
        setIsLoading(false);
        setCustomQuery('');
    };

    if (!selectedTrauma) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
                <div className="text-center">
                    <LifeBuoy className="mx-auto h-16 w-16 text-brand-primary mb-2" />
                    <h1 className="text-4xl font-extrabold text-text-primary-dark">{t('trauma.title')}</h1>
                    <p className="text-text-secondary-dark mt-2">{t('trauma.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {traumaTypes.map(trauma => (
                        <TraumaCard
                            key={trauma.key}
                            label={t(trauma.labelKey)}
                            icon={trauma.icon}
                            onClick={() => handleGetGuidance(t(trauma.labelKey))}
                        />
                    ))}
                </div>
                 <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark mb-4 text-center">{t('trauma.custom.title')}</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={customQuery}
                            onChange={e => setCustomQuery(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleGetGuidance(customQuery)}
                            placeholder={t('trauma.custom.placeholder')}
                            className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleGetGuidance(customQuery)}
                            disabled={isLoading || !customQuery.trim()}
                            className="bg-brand-secondary text-amber-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-400 disabled:bg-amber-800 flex items-center gap-2"
                        >
                           <Wand2 size={18}/> {t('trauma.custom.button')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <button onClick={resetView} className="flex items-center gap-2 text-brand-primary hover:underline mb-4 font-semibold">
                <ChevronLeft size={20} /> {t('trauma.guide.back')}
            </button>

            <div className="bg-surface-dark p-6 sm:p-8 rounded-lg shadow-lg border border-border-dark">
                <h2 className="text-3xl font-bold text-text-primary-dark mb-6">{selectedTrauma}</h2>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-12" aria-live="polite">
                        <Spinner />
                        <p className="mt-4 text-text-secondary-dark font-semibold">{t('trauma.guide.loading')}</p>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4" role="alert">
                        <AlertTriangle />
                        <div><h3 className="font-bold">{t('trauma.guide.error')}</h3><p>{error}</p></div>
                    </div>
                )}

                {guide && (
                    <div className="space-y-8">
                        <UrgencyIndicator level={guide.urgency} />
                        
                        <div>
                            <h3 className="text-xl font-semibold text-brand-primary mb-3">{t('trauma.guide.steps')}</h3>
                            <InteractiveChecklist items={guide.firstAidSteps} />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-semibold text-brand-primary mb-3">{t('trauma.guide.avoid')}</h3>
                             <ul className="list-disc list-inside space-y-2 text-text-secondary-dark bg-background-dark p-4 rounded-lg">
                                {guide.whatToAvoid.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        
                        <div className="p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                            <h3 className="text-xl font-semibold text-brand-primary mb-3">{t('trauma.guide.seeDentist')}</h3>
                            <p className="text-text-secondary-dark">{guide.whenToSeeDentist}</p>
                        </div>
                        
                        <div className="mt-4 pt-6 border-t border-border-dark text-center">
                            <ReactRouterDOM.Link 
                                to="/public/dentradar"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-brand-aurora-start/40 transition-shadow"
                            >
                                <Search size={20} />
                                {t('trauma.guide.findDentist')}
                            </ReactRouterDOM.Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
