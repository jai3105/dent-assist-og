
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Manuscript, ParaphraseResult, GroundingChunk, JournalFinderResult, PlagiarismResult } from '../../types';
import { generateManuscriptSection, paraphraseText, suggestReferencesForManuscript, findJournalsForManuscript, checkPlagiarism } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Book, PenSquare, Sparkles, RefreshCcw, Search, Download, Trash2, FileText, Check, Newspaper, X, FileCheck2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const initialSections = {
    'abstract': { title: 'Abstract', content: '' },
    'introduction': { title: 'Introduction', content: '' },
    'methods': { title: 'Materials and Methods', content: '' },
    'results': { title: 'Results', content: '' },
    'discussion': { title: 'Discussion', content: '' },
    'conclusion': { title: 'Conclusion', content: '' },
    'references': { title: 'References', content: '' },
};

const AiToolbar: React.FC<{
    onAction: (action: string) => void;
    isLoading: boolean;
    selectionActive: boolean;
    abstractExists: boolean;
    manuscriptExists: boolean;
}> = ({ onAction, isLoading, selectionActive, abstractExists, manuscriptExists }) => {
    const { t } = useTranslation();
    const buttonClass = "flex items-center gap-2 bg-border-dark px-3 py-1.5 rounded-md text-sm text-text-secondary-dark hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    return (
        <div className="bg-surface-dark p-2 rounded-lg border border-border-dark flex flex-wrap gap-2 items-center sticky top-4 z-10">
            <span className="text-sm font-semibold text-text-secondary-dark mr-2">{t('dentascribe.aiTools')}</span>
            <button onClick={() => onAction('generate')} disabled={isLoading} className={buttonClass}><Sparkles size={16}/> {t('dentascribe.generate')}</button>
            <button onClick={() => onAction('paraphrase')} disabled={isLoading || !selectionActive} className={buttonClass}><RefreshCcw size={16}/> {t('dentascribe.paraphrase')}</button>
            <button onClick={() => onAction('references')} disabled={isLoading} className={buttonClass}><Search size={16}/> {t('dentascribe.findReferences')}</button>
            <button onClick={() => onAction('findJournal')} disabled={isLoading || !abstractExists} className={buttonClass} title={!abstractExists ? t('dentascribe.findJournalTooltip') : t('dentascribe.findJournal')}><Newspaper size={16}/> {t('dentascribe.findJournal')}</button>
            <button onClick={() => onAction('plagiarismCheck')} disabled={isLoading || !manuscriptExists} className={buttonClass} title={!manuscriptExists ? t('dentascribe.plagiarismTooltip') : ''}><FileCheck2 size={16}/> {t('dentascribe.plagiarismCheck')}</button>
        </div>
    );
};

const JournalFinderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    result: JournalFinderResult | null;
}> = ({ isOpen, onClose, isLoading, result }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-4xl border border-border-dark max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark flex items-center gap-3"><Newspaper className="text-brand-primary"/> {t('dentascribe.journalFinder.title')}</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <Spinner />
                            <p className="mt-4 text-text-secondary-dark font-semibold">{t('dentascribe.journalFinder.loading')}</p>
                        </div>
                    )}
                    {result?.error && <p className="text-red-400">{result.error}</p>}
                    {result?.suggestions && (
                        <div className="space-y-4">
                            {result.suggestions.map((journal, index) => (
                                <div key={index} className="bg-background-dark p-4 rounded-lg border border-border-dark">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-brand-primary">{journal.journalName}</h3>
                                        <span className="text-sm font-semibold bg-brand-secondary/20 text-brand-secondary px-2 py-0.5 rounded-full flex-shrink-0">{journal.impactFactor}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary-dark mt-2">{journal.scope}</p>
                                    <div className="mt-3 p-3 bg-brand-primary/10 rounded-md">
                                        <p className="text-sm font-semibold text-brand-primary">{t('dentascribe.journalFinder.goodFit')}</p>
                                        <p className="text-xs text-text-secondary-dark">{journal.relevance}</p>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <a href={journal.url} target="_blank" rel="noopener noreferrer" className="bg-border-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold text-sm hover:bg-slate-600">
                                            {t('dentascribe.journalFinder.visit')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlagiarismReportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    result: PlagiarismResult | null;
}> = ({ isOpen, onClose, isLoading, result }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const score = result?.plagiarismScore || 0;
    const scoreColor = score > 50 ? 'text-red-400' : score > 20 ? 'text-yellow-400' : 'text-green-400';
    const circumference = 2 * Math.PI * 45; // r = 45

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-4xl border border-border-dark max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark flex items-center gap-3"><FileCheck2 className="text-brand-primary"/> {t('dentascribe.plagiarismModal.title')}</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <Spinner />
                            <p className="mt-4 text-text-secondary-dark font-semibold">{t('dentascribe.plagiarismModal.loading')}</p>
                        </div>
                    )}
                    {result?.error && <p className="text-red-400">{result.error}</p>}
                    {result && !result.error && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-background-dark p-6 rounded-lg">
                                <div className="flex justify-center items-center relative">
                                     <svg className="w-32 h-32" viewBox="0 0 100 100">
                                        <circle className="text-border-dark" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                        <circle className={`${scoreColor} transform -rotate-90 origin-center`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}/>
                                     </svg>
                                    <span className={`absolute text-3xl font-bold ${scoreColor}`}>{score}%</span>
                                </div>
                               <div className="md:col-span-2">
                                   <h3 className="font-bold text-lg text-text-primary-dark">{t('dentascribe.plagiarismModal.summary')}</h3>
                                   <p className="text-sm text-text-secondary-dark mt-2">{result.summary || t('dentascribe.plagiarismModal.noPlagiarism')}</p>
                               </div>
                           </div>
                           
                           {result.plagiarizedPassages.length > 0 && (
                               <div>
                                   <h3 className="font-bold text-lg text-text-primary-dark mb-3">{t('dentascribe.plagiarismModal.passagesFound')}</h3>
                                   <div className="space-y-4">
                                       {result.plagiarizedPassages.map((passage, index) => (
                                           <div key={index} className="bg-background-dark p-4 rounded-lg border border-border-dark">
                                               <h4 className="font-semibold text-sm text-text-primary-dark">{t('dentascribe.plagiarismModal.passage')}</h4>
                                               <p className="text-sm text-text-secondary-dark italic bg-red-500/10 p-2 rounded-md mt-1">"{passage.text}"</p>
                                               <h4 className="font-semibold text-sm text-text-primary-dark mt-3">{t('dentascribe.plagiarismModal.source')}</h4>
                                               <a href={passage.source} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline break-all">{passage.sourceTitle || passage.source}</a>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export const DentaScribe: React.FC = () => {
    const { t } = useTranslation();
    const [manuscript, setManuscript] = useState<Manuscript>({ title: '', topic: '', sections: initialSections });
    const [activeSection, setActiveSection] = useState('introduction');
    const [isLoading, setIsLoading] = useState(false);
    const [selection, setSelection] = useState<string>('');
    const [references, setReferences] = useState<GroundingChunk[]>([]);
    const [refSummary, setRefSummary] = useState('');
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const [journalFinderResult, setJournalFinderResult] = useState<JournalFinderResult | null>(null);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);
    const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
    const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);

    const handleManuscriptUpdate = (field: 'title' | 'topic', value: string) => {
        setManuscript(prev => ({ ...prev, [field]: value }));
    };

    const handleSectionContentChange = (content: string) => {
        setManuscript(prev => ({
            ...prev,
            sections: { ...prev.sections, [activeSection]: { ...prev.sections[activeSection], content } },
        }));
    };
    
    const handleSelectionChange = () => {
        const textarea = editorRef.current;
        if (textarea) {
            const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            setSelection(selectedText);
        }
    };

    const handleAiAction = useCallback(async (action: string) => {
        const currentContent = manuscript.sections[activeSection].content;
        try {
            switch (action) {
                case 'generate':
                    setIsLoading(true);
                    const generatedText = await generateManuscriptSection(manuscript.sections[activeSection].title, manuscript.topic, currentContent);
                    handleSectionContentChange(currentContent ? `${currentContent}\n\n${generatedText}` : generatedText);
                    break;
                case 'paraphrase':
                    if (selection) {
                        setIsLoading(true);
                        const { paraphrasedText, error } = await paraphraseText(selection);
                        if (error) throw new Error(error);
                        const newContent = currentContent.replace(selection, paraphrasedText);
                        handleSectionContentChange(newContent);
                    }
                    break;
                case 'references':
                    setIsLoading(true);
                    const { summary, sources } = await suggestReferencesForManuscript(manuscript.topic);
                    setRefSummary(summary);
                    setReferences(sources);
                    break;
                 case 'findJournal':
                    const abstractContent = manuscript.sections.abstract.content;
                    if (!abstractContent.trim()) {
                        alert('Please write an abstract before searching for journals.');
                        return;
                    }
                    setIsLoading(true);
                    setJournalFinderResult(null);
                    setIsJournalModalOpen(true);
                    const result = await findJournalsForManuscript(abstractContent);
                    setJournalFinderResult(result);
                    break;
                case 'plagiarismCheck':
                    const fullText = Object.values(manuscript.sections).map(s => s.content).join('\n\n');
                    if (!fullText.trim()) {
                        alert('Please write some content in your manuscript before checking for plagiarism.');
                        return;
                    }
                    setIsCheckingPlagiarism(true);
                    setPlagiarismResult(null);
                    setIsPlagiarismModalOpen(true);
                    const plagiarismRes = await checkPlagiarism(fullText);
                    setPlagiarismResult(plagiarismRes);
                    setIsCheckingPlagiarism(false);
                    break;
            }
        } catch (error) {
            console.error(error);
            if (action === 'findJournal') {
                setJournalFinderResult({ suggestions: [], error: error instanceof Error ? error.message : 'Unknown error' });
            } else if (action === 'plagiarismCheck') {
                 setPlagiarismResult({ plagiarismScore: 0, summary: 'An error occurred during the check.', plagiarizedPassages: [], error: error instanceof Error ? error.message : 'Unknown error' });
            } else {
                alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [activeSection, manuscript.topic, manuscript.sections, selection]);
    
    const handleExport = () => {
        const title = manuscript.title || 'Untitled Manuscript';
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
                    h1 { font-size: 24pt; }
                    h2 { font-size: 18pt; }
                    h3 { font-size: 14pt; font-weight: bold; }
                    p { margin-bottom: 12pt; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <h2>Topic: ${manuscript.topic || 'No topic specified'}</h2>
        `;

        Object.values(manuscript.sections).forEach(section => {
            const paragraphs = section.content
                ? section.content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
                : '<p>No content.</p>';
                
            htmlContent += `
                <h3>${section.title}</h3>
                ${paragraphs}
            `;
        });

        htmlContent += `
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${manuscript.title.replace(/ /g, '_') || 'manuscript'}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const clearManuscript = () => {
        if(window.confirm('Are you sure you want to start a new manuscript? All current content will be lost.')) {
            setManuscript({ title: '', topic: '', sections: initialSections });
            setActiveSection('introduction');
            setReferences([]);
            setRefSummary('');
        }
    };
    
    const manuscriptExists = useMemo(() => {
        return Object.values(manuscript.sections).some(s => s.content.trim() !== '');
    }, [manuscript.sections]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full max-h-[calc(100vh-8.5rem)]">
            <aside className="lg:col-span-1 bg-surface-dark p-4 rounded-lg flex flex-col h-full border border-border-dark">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary-dark">{t('sidebar.dentascribe.label')}</h2>
                    <button onClick={clearManuscript} title={t('dentascribe.newManuscript')} className="text-text-secondary-dark hover:text-red-400 p-2"><Trash2 size={18}/></button>
                </div>
                <div className="space-y-3 mb-4">
                    <input type="text" placeholder={t('dentascribe.titlePlaceholder')} value={manuscript.title} onChange={e => handleManuscriptUpdate('title', e.target.value)} className="w-full bg-background-dark p-2 rounded-md text-sm border border-border-dark" />
                    <input type="text" placeholder={t('dentascribe.topicPlaceholder')} value={manuscript.topic} onChange={e => handleManuscriptUpdate('topic', e.target.value)} className="w-full bg-background-dark p-2 rounded-md text-sm border border-border-dark" />
                </div>
                <h3 className="text-sm font-semibold text-text-secondary-dark mb-2">{t('dentascribe.sections')}</h3>
                <nav className="space-y-1 flex-grow">
                    {Object.entries(manuscript.sections).map(([key, section]) => (
                        <button key={key} onClick={() => setActiveSection(key)} className={`w-full text-left p-2 rounded-md text-sm font-medium flex justify-between items-center ${activeSection === key ? 'bg-brand-primary text-white' : 'hover:bg-border-dark'}`}>
                            {section.title}
                            {section.content && <Check size={16} />}
                        </button>
                    ))}
                </nav>
                <button onClick={handleExport} className="w-full mt-4 bg-brand-secondary text-amber-900 font-bold py-2 rounded-lg hover:bg-amber-400 flex items-center justify-center gap-2"><Download size={16}/> {t('dentascribe.exportMarkdown')}</button>
            </aside>
            <main className="lg:col-span-3 flex flex-col h-full gap-4">
                <AiToolbar 
                    onAction={handleAiAction} 
                    isLoading={isLoading} 
                    selectionActive={!!selection}
                    abstractExists={!!manuscript.sections.abstract.content.trim()}
                    manuscriptExists={manuscriptExists}
                />
                <div className="bg-surface-dark p-4 rounded-lg flex-grow flex flex-col border border-border-dark">
                    <h2 className="text-2xl font-bold text-text-primary-dark mb-4">{manuscript.sections[activeSection].title}</h2>
                    <textarea
                        ref={editorRef}
                        value={manuscript.sections[activeSection].content}
                        onChange={e => handleSectionContentChange(e.target.value)}
                        onSelect={handleSelectionChange}
                        placeholder={t('dentascribe.editorPlaceholder', { section: manuscript.sections[activeSection].title.toLowerCase() })}
                        className="w-full h-full flex-grow bg-background-dark p-4 rounded-md text-text-secondary-dark border border-border-dark focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                    />
                </div>
                {(references.length > 0 || refSummary) && (
                     <div className="bg-surface-dark p-4 rounded-lg border border-border-dark max-h-60 overflow-y-auto">
                        <h3 className="text-lg font-bold text-brand-secondary mb-2">{t('dentascribe.referenceSuggestions')}</h3>
                        {refSummary && <p className="text-sm text-text-secondary-dark mb-3 italic">{refSummary}</p>}
                        <ul className="space-y-2">
                           {references.filter(r=>r.web?.uri).map((ref, i) => (
                               <li key={i}><a href={ref.web?.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">{ref.web?.title || ref.web?.uri}</a></li>
                           ))}
                        </ul>
                    </div>
                )}
            </main>
            <JournalFinderModal
                isOpen={isJournalModalOpen}
                onClose={() => setIsJournalModalOpen(false)}
                isLoading={isLoading && !journalFinderResult}
                result={journalFinderResult}
            />
             <PlagiarismReportModal
                isOpen={isPlagiarismModalOpen}
                onClose={() => setIsPlagiarismModalOpen(false)}
                isLoading={isCheckingPlagiarism}
                result={plagiarismResult}
            />
        </div>
    );
};
