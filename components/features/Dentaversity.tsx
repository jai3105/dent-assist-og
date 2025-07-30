
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDentaversityModule, generateDentaversityImage, generateLearningPath, generateMnemonic } from '../../services/geminiService';
import type { DentaversityModule, DentaversityQuizQuestion, LearningPath, Mnemonic } from '../../types';
import { Spinner } from '../common/Spinner';
import { BookOpen, BrainCircuit, Check, GraduationCap, Lightbulb, PencilRuler, X, Search, Bookmark, History, Trash2, Image as ImageIcon, Milestone, Wand2, Brain } from 'lucide-react';

const QuizView: React.FC<{ quiz: DentaversityQuizQuestion[] }> = ({ quiz }) => {
    const [answers, setAnswers] = useState<(string | null)[]>(Array(quiz.length).fill(null));
    const [showResults, setShowResults] = useState(false);

    const handleAnswer = (questionIndex: number, option: string) => {
        if (showResults) return;
        setAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = option;
            return newAnswers;
        });
    };

    const handleSubmit = () => setShowResults(true);

    const score = answers.reduce((acc, answer, i) => acc + (answer === quiz[i].answer ? 1 : 0), 0);

    return (
        <div className="space-y-6">
            {quiz.map((q, qIndex) => (
                <div key={qIndex} className="bg-background-dark p-4 rounded-lg border border-border-dark">
                    <p className="font-semibold text-text-primary-dark mb-3">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                            const isSelected = answers[qIndex] === option;
                            let buttonClass = 'w-full text-left p-3 rounded-md text-sm transition-colors border ';
                            if (showResults) {
                                const isCorrect = option === q.answer;
                                if (isCorrect) {
                                    buttonClass += 'bg-green-500/20 border-green-500 text-green-300';
                                } else if (isSelected) {
                                    buttonClass += 'bg-red-500/20 border-red-500 text-red-300';
                                } else {
                                    buttonClass += 'bg-surface-dark border-border-dark text-text-secondary-dark';
                                }
                            } else {
                                buttonClass += isSelected ? 'bg-brand-primary/30 border-brand-primary text-brand-primary' : 'bg-surface-dark border-border-dark hover:bg-border-dark text-text-secondary-dark';
                            }
                            return (
                                <button key={oIndex} onClick={() => handleAnswer(qIndex, option)} className={buttonClass} disabled={showResults}>
                                    {option}
                                    {showResults && isSelected && option !== q.answer && <X className="inline-block ml-2" size={16} />}
                                    {showResults && option === q.answer && <Check className="inline-block ml-2" size={16} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            
            {!showResults && (
                <button onClick={handleSubmit} className="w-full bg-brand-primary py-3 rounded-lg text-white font-bold hover:bg-teal-500">
                    Submit Answers
                </button>
            )}

            {showResults && (
                <div className="text-center p-6 bg-surface-dark rounded-lg">
                    <h3 className="text-2xl font-bold">Quiz Results</h3>
                    <p className="text-4xl font-extrabold text-brand-primary my-3">{score} / {quiz.length}</p>
                    <p className="text-text-secondary-dark">You answered {score} out of {quiz.length} questions correctly.</p>
                </div>
            )}
        </div>
    );
};

const MnemonicHelper: React.FC = () => {
    const [text, setText] = useState('');
    const [mnemonic, setMnemonic] = useState<Mnemonic | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setMnemonic(null);
        const result = await generateMnemonic(text);
        setMnemonic(result);
        setIsLoading(false);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><Brain className="text-brand-secondary"/> AI Mnemonic Helper</h3>
            <div className="bg-background-dark p-4 rounded-lg border border-border-dark">
                <textarea 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Paste a list or concept to memorize here..."
                    rows={4}
                    className="w-full bg-surface-dark border border-border-dark rounded-md p-2 text-sm"
                />
                <button onClick={handleGenerate} disabled={isLoading || !text.trim()} className="mt-2 w-full bg-brand-secondary text-amber-900 font-bold py-2 rounded-lg hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isLoading ? <Spinner/> : <><Wand2 size={16}/> Create Mnemonic</>}
                </button>
                {mnemonic && (
                    <div className="mt-4 animate-fade-in">
                        {mnemonic.error ? <p className="text-red-400">{mnemonic.error}</p> : (
                            <div className="bg-surface-dark p-3 rounded-md">
                                <p className="font-bold text-brand-primary text-lg">{mnemonic.mnemonic}</p>
                                <p className="text-text-secondary-dark mt-1 text-sm">{mnemonic.explanation}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const suggestedTopics = [
    'Dental Implant Osseointegration',
    'Class II Composite Restoration Techniques',
    'Periodontal Ligament Anatomy',
    'Pharmacology of Local Anesthetics'
];

const STORAGE_KEY = 'dentaversityHistory';

export const DentaVersity: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
    const [activeModule, setActiveModule] = useState<DentaversityModule | null>(null);
    const [history, setHistory] = useState<DentaversityModule[]>([]);
    const [view, setView] = useState<'generate' | 'module' | 'history' | 'bookmarks'>('generate');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(STORAGE_KEY);
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
            setHistory([]);
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history to localStorage", e);
        }
    }, [history]);
    
    const handleGenerateModule = useCallback(async (selectedTopic: string) => {
        if (!selectedTopic.trim()) return;
        setIsLoading(true);
        setError(null);
        setLearningPath(null);
        setActiveModule(null);
        setView('module');

        try {
            const [moduleData, imageBytes] = await Promise.all([
                getDentaversityModule(selectedTopic),
                generateDentaversityImage(selectedTopic)
            ]);

            if (moduleData.error) {
                throw new Error(moduleData.error);
            }

            const newModule: DentaversityModule = {
                ...moduleData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                imageUrl: imageBytes,
                isBookmarked: false,
            };

            setActiveModule(newModule);
            setHistory(prev => [newModule, ...prev.filter(m => m.title.toLowerCase() !== newModule.title.toLowerCase())].slice(0, 50));
        } catch (e: any) {
            setError(e.message || 'Failed to generate module and/or image.');
            setView('generate');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleGeneratePath = async (goal: string) => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setError(null);
        setLearningPath(null);
        try {
            const path = await generateLearningPath(goal);
            if(path.error) throw new Error(path.error);
            setLearningPath(path);
        } catch(e: any) {
            setError(e.message || 'Failed to generate learning path.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectModuleFromHistory = (module: DentaversityModule) => {
        setActiveModule(module);
        setView('module');
    }

    const handleToggleBookmark = (moduleId: string) => {
        setHistory(prev => prev.map(m => m.id === moduleId ? { ...m, isBookmarked: !m.isBookmarked } : m));
        if(activeModule?.id === moduleId) {
            setActiveModule(prev => prev ? {...prev, isBookmarked: !prev.isBookmarked} : null);
        }
    }

    const handleDeleteFromHistory = (moduleId: string) => {
        if(window.confirm("Are you sure you want to delete this from your history?")) {
            setHistory(prev => prev.filter(m => m.id !== moduleId));
        }
    }

    const bookmarkedModules = useMemo(() => history.filter(m => m.isBookmarked), [history]);

    const renderGenerateView = () => (
        <div className="text-center p-8 animate-fade-in">
            <GraduationCap className="mx-auto h-16 w-16 text-brand-primary mb-4"/>
            <h2 className="text-3xl font-bold text-text-primary-dark">AI Learning Hub</h2>
            <p className="text-text-secondary-dark mt-2 mb-6">Enter a dental topic to generate a personalized study module with visual aids.</p>
            <div className="max-w-xl mx-auto">
                <div className="bg-surface-dark p-2 rounded-lg border border-border-dark flex items-center shadow-sm focus-within:ring-2 focus-within:ring-brand-primary">
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleGenerateModule(topic)} placeholder="e.g., 'Mandibular Nerve Block'" className="flex-1 bg-transparent p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none" />
                    <button onClick={() => handleGenerateModule(topic)} disabled={!topic.trim() || isLoading} className="bg-brand-primary text-white rounded-md w-32 h-10 flex items-center justify-center disabled:bg-teal-800 hover:bg-teal-500 font-semibold">
                        {isLoading ? <Spinner /> : 'Generate'}
                    </button>
                </div>
            </div>
            
            <div className="my-8 text-text-secondary-dark font-semibold">OR</div>

            <div className="max-w-xl mx-auto">
                <h3 className="text-center font-semibold text-text-primary-dark mb-3">Let AI build a study plan for you</h3>
                <div className="bg-surface-dark p-2 rounded-lg border border-border-dark flex items-center shadow-sm focus-within:ring-2 focus-within:ring-brand-secondary">
                     <input type="text" value={learningPath?.goal || ''} onChange={e => setLearningPath({ goal: e.target.value, steps: [] })} placeholder="Learning Goal, e.g., 'Master Endodontics'" className="flex-1 bg-transparent p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none" />
                    <button onClick={() => handleGeneratePath(learningPath?.goal || '')} disabled={!learningPath?.goal.trim() || isLoading} className="bg-brand-secondary text-amber-900 rounded-md w-32 h-10 flex items-center justify-center disabled:opacity-50 hover:bg-amber-400 font-semibold">
                        {isLoading ? <Spinner /> : 'Create Path'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 mt-4">{error}</p>}

            {learningPath && learningPath.steps.length > 0 && (
                 <div className="mt-8 text-left max-w-xl mx-auto animate-fade-in">
                    <h3 className="text-xl font-bold text-text-primary-dark mb-4">Your Learning Path: {learningPath.goal}</h3>
                    <div className="space-y-3">
                        {learningPath.steps.map((step, index) => (
                             <div key={index} className="p-4 bg-surface-dark rounded-lg border border-border-dark">
                                <p className="font-semibold text-brand-primary">Step {index + 1}: {step.title}</p>
                                <p className="text-sm text-text-secondary-dark mt-1">{step.description}</p>
                                <button onClick={() => handleGenerateModule(step.topicToGenerate)} className="text-sm font-semibold text-brand-secondary hover:underline mt-2">Generate this module &raquo;</button>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderModuleView = () => {
        if (isLoading) {
            return <div className="flex flex-col items-center justify-center p-20 gap-4"><Spinner /><p className="text-text-secondary-dark font-semibold">Generating your AI-powered module...</p></div>;
        }
        if (error && !activeModule) {
            return <p className="text-red-400 text-center bg-red-500/10 p-3 rounded-lg">{error}</p>;
        }
        if (!activeModule) return renderGenerateView();

        return (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-brand-primary">{activeModule.title}</h2>
                    <button onClick={() => handleToggleBookmark(activeModule.id)} className="flex items-center gap-2 bg-surface-dark px-3 py-1.5 rounded-md text-text-secondary-dark hover:bg-border-dark">
                        <Bookmark size={16} className={activeModule.isBookmarked ? 'text-yellow-400 fill-current' : ''} /> {activeModule.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                         <div>
                            <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><Lightbulb className="text-brand-secondary"/> Key Concepts</h3>
                            <ul className="list-disc list-inside space-y-2 text-text-secondary-dark">{activeModule.keyConcepts.map((c,i) => <li key={i}>{c}</li>)}</ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><BookOpen className="text-brand-secondary"/> Detailed Explanations</h3>
                            <div className="space-y-4">{activeModule.detailedExplanations.map((d,i) => (<div key={i}><p className="font-semibold text-text-primary-dark">{d.concept}</p><p className="text-text-secondary-dark">{d.explanation}</p></div>))}</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><BrainCircuit className="text-brand-secondary"/> Clinical Significance</h3>
                            <p className="text-text-secondary-dark">{activeModule.clinicalSignificance}</p>
                        </div>
                         <MnemonicHelper />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {activeModule.imageUrl && (
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><ImageIcon className="text-brand-secondary"/> Visual Aid</h3>
                                <img src={`data:image/jpeg;base64,${activeModule.imageUrl}`} alt={`Visual aid for ${activeModule.title}`} className="w-full rounded-lg bg-black border border-border-dark"/>
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary-dark mb-3 flex items-center gap-2"><PencilRuler className="text-brand-secondary"/> Knowledge Check</h3>
                            <QuizView quiz={activeModule.quiz} />
                        </div>
                        {activeModule.relatedTopics && activeModule.relatedTopics.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary-dark mb-3">Explore Related Topics</h3>
                                <div className="space-y-2">
                                    {activeModule.relatedTopics.map(topic => (
                                        <button key={topic} onClick={() => handleGenerateModule(topic)} className="w-full text-left bg-surface-dark p-3 rounded-lg hover:bg-border-dark text-sm text-text-secondary-dark">{topic}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryView = (modules: DentaversityModule[], title: string) => (
        <div className="animate-fade-in">
             <h2 className="text-3xl font-bold text-text-primary-dark mb-6">{title}</h2>
             {modules.length === 0 ? (
                <p className="text-center text-text-secondary-dark py-12">No modules found.</p>
             ) : (
                <div className="space-y-4">
                    {modules.map(module => (
                        <div key={module.id} className="bg-surface-dark p-4 rounded-lg flex items-center justify-between hover:bg-border-dark transition-colors">
                            <div onClick={() => handleSelectModuleFromHistory(module)} className="cursor-pointer flex-grow">
                                <p className="font-bold text-text-primary-dark">{module.title}</p>
                                <p className="text-xs text-text-secondary-dark">Generated on {new Date(module.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleToggleBookmark(module.id)} title="Bookmark"><Bookmark size={18} className={module.isBookmarked ? 'text-yellow-400 fill-current' : 'text-text-secondary-dark'} /></button>
                                <button onClick={() => handleDeleteFromHistory(module.id)} title="Delete"><Trash2 size={18} className="text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 bg-surface-dark p-4 rounded-lg h-fit sticky top-24">
                <h3 className="text-lg font-bold mb-4">Denta-versity</h3>
                <nav className="space-y-2">
                    <button onClick={() => { setView('generate'); setLearningPath(null); }} className={`w-full text-left p-2 rounded-md font-semibold flex items-center gap-3 ${view === 'generate' ? 'bg-brand-primary text-white' : 'hover:bg-border-dark'}`}><Search size={18}/> New Module</button>
                    <button onClick={() => setView('history')} className={`w-full text-left p-2 rounded-md font-semibold flex items-center gap-3 ${view === 'history' ? 'bg-brand-primary text-white' : 'hover:bg-border-dark'}`}><History size={18}/> History</button>
                    <button onClick={() => setView('bookmarks')} className={`w-full text-left p-2 rounded-md font-semibold flex items-center gap-3 ${view === 'bookmarks' ? 'bg-brand-primary text-white' : 'hover:bg-border-dark'}`}>
                        <Bookmark size={18}/> Bookmarks
                    </button>
                </nav>
            </aside>
            <main className="md:col-span-3">
                {view === 'generate' && renderGenerateView()}
                {view === 'module' && renderModuleView()}
                {view === 'history' && renderHistoryView(history, "Module History")}
                {view === 'bookmarks' && renderHistoryView(bookmarkedModules, "Bookmarked Modules")}
            </main>
        </div>
    );
};
