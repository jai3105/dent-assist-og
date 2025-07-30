
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { findCdeCourses, generateCdePresentation } from '../../services/geminiService';
import type { CDECourse, CdeCreditLog, PresentationOutline } from '../../types';
import { Spinner } from '../common/Spinner';
import { Award, Search, Plus, BookUp, FileText, Wand2, X, Calendar, Edit, Trash2, Lightbulb } from 'lucide-react';

const CDE_LOG_KEY = 'cdeCreditLog_v1';

const CourseCard: React.FC<{ course: CDECourse }> = ({ course }) => (
    <div className="bg-surface-dark p-5 rounded-lg border border-border-dark transition-all hover:border-brand-primary hover:shadow-lg">
        <h3 className="font-bold text-lg text-text-primary-dark">{course.title}</h3>
        <p className="text-sm text-text-secondary-dark font-semibold">{course.provider}</p>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-dark">
            <div>
                <p className="text-xs text-text-secondary-dark">Credits: <span className="font-bold text-brand-secondary">{course.credits}</span></p>
                <p className="text-xs text-text-secondary-dark">Date: <span className="font-bold text-text-primary-dark">{course.date}</span></p>
            </div>
            <a href={course.url} target="_blank" rel="noopener noreferrer" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-teal-500">View Course</a>
        </div>
    </div>
);

const LogEntryForm: React.FC<{ onSave: (log: Omit<CdeCreditLog, 'id'>) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [credits, setCredits] = useState('');
    const [date, setDate] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !credits || !date) return;
        onSave({ courseTitle: title, creditsEarned: Number(credits), completionDate: date });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background-dark rounded-lg border border-border-dark space-y-3">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Course or Event Title" className="w-full bg-surface-dark p-2 rounded-md text-sm" required />
            <div className="flex gap-3">
                <input type="number" value={credits} onChange={e => setCredits(e.target.value)} placeholder="Credits Earned" className="w-1/2 bg-surface-dark p-2 rounded-md text-sm" required />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-1/2 bg-surface-dark p-2 rounded-md text-sm" required />
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="bg-border-dark px-3 py-1.5 rounded-md text-sm">Cancel</button><button type="submit" className="bg-brand-primary text-white px-3 py-1.5 rounded-md text-sm">Save Log</button></div>
        </form>
    );
};

const PresentationModal: React.FC<{ isOpen: boolean; onClose: () => void; topic: string; }> = ({ isOpen, onClose, topic }) => {
    const [outline, setOutline] = useState<PresentationOutline | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen && topic) {
            const generate = async () => {
                setIsLoading(true);
                setOutline(null);
                const result = await generateCdePresentation(topic);
                setOutline(result);
                setIsLoading(false);
            };
            generate();
        }
    }, [isOpen, topic]);
    
    if (!isOpen) return null;
    
    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl w-full max-w-3xl border border-border-dark flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark flex items-center gap-3"><Wand2 className="text-brand-primary"/> AI Presentation Generator</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {isLoading && <div className="text-center p-12"><Spinner /></div>}
                    {outline?.error && <p className="text-red-400">{outline.error}</p>}
                    {outline && !outline.error && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-center text-brand-secondary">{outline.mainTitle}</h3>
                            {outline.slides.map((slide, i) => (
                                <div key={i} className="bg-background-dark p-4 rounded-lg">
                                    <p className="font-semibold text-brand-primary">Slide {i+1}: {slide.title}</p>
                                    <ul className="list-disc list-inside text-sm text-text-secondary-dark mt-2 space-y-1">{slide.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CdeAi: React.FC = () => {
    const [interest, setInterest] = useState('');
    const [courses, setCourses] = useState<CDECourse[]>([]);
    const [log, setLog] = useState<CdeCreditLog[]>(() => {
        try { return JSON.parse(localStorage.getItem(CDE_LOG_KEY) || '[]') } catch { return [] }
    });
    const [showLogForm, setShowLogForm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [presentationTopic, setPresentationTopic] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        localStorage.setItem(CDE_LOG_KEY, JSON.stringify(log));
    }, [log]);
    
    const totalCredits = useMemo(() => log.reduce((sum, item) => sum + item.creditsEarned, 0), [log]);

    const handleSearch = useCallback(async () => {
        if (!interest) return;
        setIsSearching(true);
        setError('');
        setCourses([]);
        try {
            const results = await findCdeCourses(interest);
            setCourses(results);
        } catch (e: any) {
            setError(e.message || "Failed to find courses.");
        } finally {
            setIsSearching(false);
        }
    }, [interest]);

    const handleSaveLog = (newLog: Omit<CdeCreditLog, 'id'>) => {
        setLog(prev => [{ ...newLog, id: Date.now().toString() }, ...prev]);
        setShowLogForm(false);
    };

    const handleDeleteLog = (id: string) => {
        if(window.confirm("Are you sure you want to delete this log entry?")) {
            setLog(prev => prev.filter(item => item.id !== id));
        }
    };
    
    const openPresentationGenerator = (topic: string) => {
        setPresentationTopic(topic);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">CDE-AI Planner</h1>
                <p className="text-text-secondary-dark mt-2 max-w-2xl mx-auto">Discover CDE opportunities, track your credits, and synthesize your learnings with AI.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                        <h2 className="text-xl font-bold text-text-primary-dark mb-4">Find CDE Courses</h2>
                        <div className="flex items-center gap-2">
                            <input type="text" value={interest} onChange={e => setInterest(e.target.value)} placeholder="Enter interest, e.g., 'Digital Implantology'" className="flex-grow bg-background-dark p-3 rounded-md text-sm" />
                            <button onClick={handleSearch} disabled={isSearching || !interest} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center justify-center">
                                {isSearching ? <Spinner /> : <Search size={20}/>}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <div className="space-y-4">
                        {courses.map(c => <CourseCard key={c.id} course={c} />)}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                        <h2 className="text-xl font-bold text-text-primary-dark mb-2">My CDE Log</h2>
                        <p className="text-4xl font-extrabold text-brand-primary">{totalCredits} <span className="text-lg font-semibold text-text-secondary-dark">Credits</span></p>
                        <div className="mt-4">
                            {!showLogForm && <button onClick={() => setShowLogForm(true)} className="w-full bg-brand-primary/20 text-brand-primary font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2"><Plus size={16}/> Log a Completed Course</button>}
                            {showLogForm && <LogEntryForm onSave={handleSaveLog} onCancel={() => setShowLogForm(false)}/>}
                        </div>
                        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                            {log.map(item => (
                                <div key={item.id} className="p-3 bg-background-dark rounded-md border border-border-dark">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-text-primary-dark text-sm pr-2">{item.courseTitle}</p>
                                        <div className="flex-shrink-0 flex items-center gap-1">
                                            <button onClick={() => openPresentationGenerator(item.courseTitle)} title="Generate Presentation" className="p-1 text-text-secondary-dark hover:text-brand-primary"><Lightbulb size={16}/></button>
                                            <button onClick={() => handleDeleteLog(item.id)} title="Delete Log" className="p-1 text-text-secondary-dark hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary-dark mt-1">{item.completionDate} &bull; <span className="font-bold text-brand-secondary">{item.creditsEarned} credits</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <PresentationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} topic={presentationTopic} />
        </div>
    );
};
