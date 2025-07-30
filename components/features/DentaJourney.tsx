import React, { useState, useCallback, useEffect } from 'react';
import { generateWellnessJourney } from '../../services/geminiService';
import type { WellnessJourney, JourneyTask } from '../../types';
import { Spinner } from '../common/Spinner';
import { Map, Zap, Check, Wand2, PartyPopper, Trash2 } from 'lucide-react';

const wellnessGoals = [
    "Achieve visibly whiter teeth",
    "Establish a consistent flossing habit",
    "Improve overall gum health and reduce bleeding",
    "Prepare my teeth and gums for orthodontic treatment",
    "Reduce tooth sensitivity",
];

const JOURNEY_STORAGE_KEY = 'dentaJourneys_v1';

const TaskItem: React.FC<{ task: JourneyTask; onToggle: (id: string) => void }> = ({ task, onToggle }) => (
    <div onClick={() => onToggle(task.id)} className={`p-4 rounded-lg flex items-start gap-4 cursor-pointer transition-all ${task.isCompleted ? 'bg-green-500/10' : 'bg-background-dark hover:bg-border-dark'}`}>
        <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.isCompleted ? 'bg-green-500 border-green-400' : 'border-border-dark'}`}>
            {task.isCompleted && <Check size={16} className="text-white"/>}
        </div>
        <div>
            <p className={`font-semibold ${task.isCompleted ? 'line-through text-text-secondary-dark' : 'text-text-primary-dark'}`}>{task.title}</p>
            <p className="text-sm text-text-secondary-dark">{task.description}</p>
        </div>
    </div>
);

const JourneyDisplay: React.FC<{ journey: WellnessJourney; onToggleTask: (phaseIndex: number, taskId: string) => void; onDelete: () => void; }> = ({ journey, onToggleTask, onDelete }) => {
    const totalTasks = journey.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
    const completedTasks = journey.phases.reduce((acc, phase) => acc + phase.tasks.filter(t => t.isCompleted).length, 0);
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark animate-fade-in">
            <div className="flex justify-between items-start text-center mb-2">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-brand-primary">Your Journey to: {journey.goal}</h2>
                </div>
                <button onClick={onDelete} title="Delete Journey" className="p-2 text-text-secondary-dark hover:text-red-500 rounded-full hover:bg-red-500/10">
                    <Trash2 size={18} />
                </button>
            </div>
            <p className="text-center text-text-secondary-dark">{journey.introductoryMessage}</p>
            
            <div className="my-6">
                <div className="flex justify-between text-sm font-semibold text-text-secondary-dark mb-1">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-background-dark rounded-full h-2.5"><div className="bg-brand-secondary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            </div>
            
            <div className="space-y-6">
                {journey.phases.map((phase, pIndex) => (
                    <div key={pIndex}>
                        <h3 className="text-xl font-semibold text-text-primary-dark border-b-2 border-brand-primary/20 pb-2 mb-4">{phase.duration}: {phase.title}</h3>
                        <p className="text-sm text-text-secondary-dark mb-4 italic">{phase.focus}</p>
                        <div className="space-y-3">
                            {phase.tasks.map(task => <TaskItem key={task.id} task={task} onToggle={(taskId) => onToggleTask(pIndex, taskId)} />)}
                        </div>
                    </div>
                ))}
            </div>
            
            {progress === 100 && (
                 <div className="mt-8 text-center p-6 bg-brand-secondary/10 rounded-lg border border-brand-secondary">
                    <PartyPopper size={48} className="mx-auto text-brand-secondary mb-3"/>
                    <h3 className="text-2xl font-bold text-brand-secondary">Congratulations!</h3>
                    <p className="text-text-secondary-dark mt-2">{journey.finalMessage}</p>
                </div>
            )}
        </div>
    );
};

export const DentaJourney: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [journeys, setJourneys] = useState<WellnessJourney[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedJourneys = localStorage.getItem(JOURNEY_STORAGE_KEY);
            if (savedJourneys) {
                setJourneys(JSON.parse(savedJourneys));
            }
        } catch (e) { console.error("Failed to load journeys from localStorage", e); }
    }, []);

    useEffect(() => {
        localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
    }, [journeys]);
    
    const handleGenerateJourney = useCallback(async (selectedGoal: string) => {
        if (!selectedGoal.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateWellnessJourney(selectedGoal);
            if (result.error) throw new Error(result.error);
            const newJourney: WellnessJourney = { ...result, id: Date.now().toString() };
            setJourneys(prev => [newJourney, ...prev]);
            setGoal('');
        } catch (e: any) {
            setError(e.message || "Failed to generate your wellness journey.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleToggleTask = (journeyId: string, phaseIndex: number, taskId: string) => {
        setJourneys(prev => prev.map(journey => {
            if (journey.id !== journeyId) return journey;
            
            const newPhases = [...journey.phases];
            const newTasks = newPhases[phaseIndex].tasks.map(task => 
                task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
            );
            newPhases[phaseIndex] = { ...newPhases[phaseIndex], tasks: newTasks };
            return { ...journey, phases: newPhases };
        }));
    };

    const handleDeleteJourney = (journeyId: string) => {
        if (window.confirm("Are you sure you want to delete this journey? This action cannot be undone.")) {
            setJourneys(prev => prev.filter(j => j.id !== journeyId));
        }
    };


    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark flex items-center justify-center gap-3"><Map className="text-brand-primary"/> DentaJourney</h1>
                <p className="text-text-secondary-dark mt-2">Set a dental wellness goal and let AI create a personalized step-by-step plan to help you achieve it.</p>
            </div>
            
            <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4 text-center">What's Your Next Goal?</h2>
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        placeholder="e.g., 'Overcome fear of the dentist'"
                        className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button onClick={() => handleGenerateJourney(goal)} disabled={isLoading || !goal.trim()} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center justify-center">
                        {isLoading ? <Spinner /> : <Wand2 size={20}/>}
                    </button>
                </div>
                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wellnessGoals.map(g => (
                        <button key={g} onClick={() => handleGenerateJourney(g)} className="text-left bg-background-dark p-4 rounded-lg hover:bg-border-dark transition-colors duration-200 text-sm text-text-secondary-dark font-medium flex items-center gap-3">
                           <Zap size={16} className="text-brand-secondary"/> {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6 mt-8">
                <h2 className="text-3xl font-bold text-text-primary-dark border-b-2 border-border-dark pb-2">My Journeys</h2>
                {journeys.length > 0 ? (
                    <div className="space-y-6">
                        {journeys.map(journey => (
                            <JourneyDisplay 
                                key={journey.id} 
                                journey={journey} 
                                onToggleTask={(phaseIndex, taskId) => handleToggleTask(journey.id, phaseIndex, taskId)}
                                onDelete={() => handleDeleteJourney(journey.id)}
                            />
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="text-center py-12 px-6 bg-surface-dark rounded-lg border-2 border-dashed border-border-dark">
                            <Map className="mx-auto h-12 w-12 text-text-secondary-dark" />
                            <h3 className="mt-2 text-xl font-semibold text-text-primary-dark">No Active Journeys</h3>
                            <p className="mt-1 text-text-secondary-dark">Set a goal above to start your first wellness journey.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};