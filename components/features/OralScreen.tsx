

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { analyzeOralLesion, compareOralImages } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { OralLesionAnalysis, SavedScreening, DentalComparisonAnalysis } from '../../types';
import { Camera, UploadCloud, AlertTriangle, FileUp, RefreshCw, X, ShieldAlert, Activity, Eye, HeartHandshake, User, ChevronRight, Droplet, Wind, Sun, Leaf, History, CheckSquare, ChevronLeft, Trash2, GitCompareArrows } from 'lucide-react';

const ORALSCREEN_HISTORY_KEY = 'oralScreeningHistory_v1';

// --- SUB-COMPONENTS ---

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; text: string; }> = ({ onClick, icon, text }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl w-full text-center transition-all duration-300 transform hover:scale-105 bg-background-dark text-text-primary-dark shadow-md border border-border-dark hover:bg-border-dark"
    >
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-dark">{icon}</div>
        <span className="font-bold text-lg">{text}</span>
    </button>
);

const RiskIndicator: React.FC<{ level: OralLesionAnalysis['riskLevel'] }> = ({ level }) => {
    const styles = {
        Low: { text: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500' },
        Medium: { text: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
        High: { text: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500' },
    };
    const currentStyle = styles[level] || styles.Medium;

    return (
        <div className={`p-4 rounded-lg flex items-center gap-4 ${currentStyle.bg} ${currentStyle.border} border-l-4`}>
            <div className={`text-4xl ${currentStyle.text}`}><ShieldAlert /></div>
            <div>
                <p className="text-sm text-text-secondary-dark">AI Risk Assessment</p>
                <p className={`font-bold text-2xl ${currentStyle.text}`}>{level} Risk</p>
            </div>
        </div>
    );
};

const LesionAnalyzer: React.FC<{ onAnalysisComplete: (screening: SavedScreening) => void }> = ({ onAnalysisComplete }) => {
    const [state, setState] = useState<'idle' | 'scanning' | 'captured' | 'analyzing' | 'results'>('idle');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<OralLesionAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopScan = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        streamRef.current = null;
    }, []);

    const startScan = useCallback(async () => {
        setState('scanning');
        setError(null); setAnalysis(null); setImageSrc(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError('Could not access the camera. Please check permissions.');
                setState('idle');
            }
        } else {
            setError('Your browser does not support camera access.');
            setState('idle');
        }
    }, []);

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImageSrc(dataUrl);
            setState('captured');
            stopScan();
        }
    }, [stopScan]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target?.result as string);
                setState('captured');
                setError(null); setAnalysis(null);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            setError('Please select a valid image file.');
        }
    };

    const triggerFileUpload = () => fileInputRef.current?.click();

    const handleAnalysis = async () => {
        if (!imageSrc) return;
        setState('analyzing'); setError(null);
        try {
            const base64Image = imageSrc.split(',')[1];
            const result = await analyzeOralLesion(base64Image, 'image/jpeg');
            if (result.error) {
                setError(result.error);
                setState('captured');
            } else {
                setAnalysis(result);
                setState('results');
            }
        } catch (err: any) {
            setError(err.message || 'Analysis failed. Please try again.');
            setState('captured');
        }
    };
    
    const handleSave = () => {
        if(analysis && imageSrc){
            const newScreening: SavedScreening = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                imageSrc,
                analysis
            };
            onAnalysisComplete(newScreening);
            reset();
        }
    };

    const reset = () => {
        stopScan();
        setState('idle');
        setImageSrc(null); setAnalysis(null); setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (state === 'idle') {
        return (
            <div className="bg-surface-dark p-8 rounded-2xl shadow-lg border border-border-dark animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-text-primary-dark">AI Lesion Analyzer</h2>
                    <p className="text-text-secondary-dark mt-2 max-w-xl mx-auto">Upload or take a photo of a suspicious area in your mouth for a preliminary AI screening. This is NOT a medical diagnosis.</p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionButton onClick={startScan} icon={<Camera size={40} className="text-brand-primary" />} text="Use Camera" />
                    <ActionButton onClick={triggerFileUpload} icon={<UploadCloud size={40} className="text-brand-primary" />} text="Upload Image" />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            </div>
        );
    }
    
    if (state === 'scanning') {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-brand-primary">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-lg object-cover"></video>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/70"></div>
                    </div>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={reset} className="bg-slate-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:bg-border-dark"><X /></button>
                    <button onClick={captureImage} className="bg-brand-secondary text-amber-900 w-20 h-20 rounded-full flex items-center justify-center text-4xl hover:bg-amber-400"><Camera /></button>
                </div>
            </div>
        );
    }

    if (state === 'captured' || state === 'analyzing' || state === 'results') {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <div className="w-full aspect-square bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-border-dark">
                        {imageSrc && <img src={imageSrc} alt="Captured lesion" className="w-full h-full object-cover rounded-lg" />}
                        {state === 'analyzing' && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4"><Spinner /><p className="text-white font-semibold text-xl animate-pulse">AI is analyzing...</p></div>}
                    </div>
                    {state === 'captured' && (
                        <div className="flex justify-center gap-4">
                            <button onClick={reset} className="bg-slate-600 text-text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-border-dark">Cancel</button>
                            <button onClick={handleAnalysis} className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-500">Analyze with AI</button>
                        </div>
                    )}
                </div>
                <div>
                    {error && <p className="text-red-500 text-center mt-4 font-medium bg-red-100 p-3 rounded-lg">{error}</p>}
                    {analysis && (
                        <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark animate-fade-in space-y-4">
                            <h3 className="text-2xl font-bold text-brand-primary">Analysis Results</h3>
                            <div className="p-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 rounded-r-lg"><h4 className="font-bold">Important Disclaimer</h4><p className="text-sm">{analysis.disclaimer}</p></div>
                            <RiskIndicator level={analysis.riskLevel} />
                            <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Observations</h4><ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.observations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                            <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Recommendation</h4><p className="text-text-secondary-dark">{analysis.recommendation}</p></div>
                            <div className="mt-6 pt-4 border-t border-border-dark flex flex-wrap justify-center gap-4">
                                <button onClick={handleSave} className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-500 flex items-center gap-2">Save & New Scan</button>
                                <ReactRouterDOM.Link to="/dentradar" className="bg-border-dark text-text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 flex items-center gap-2">Find a Professional</ReactRouterDOM.Link>
                            </div>
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        );
    }

    return null;
};

const GuidedSelfExam: React.FC = () => {
    const examSteps = [
        { title: 'Get Ready', description: 'Wash your hands and stand in a well-lit area with a mirror.', icon: <HeartHandshake /> },
        { title: 'Face & Neck', description: 'Check your face and neck for lumps, bumps, or swelling on both sides.', icon: <User /> },
        { title: 'Lips', description: 'Examine the inside of your lips for sores or color changes.', icon: <Droplet /> },
        { title: 'Cheeks', description: 'Pull your cheek out to see inside. Look for red, white, or dark patches.', icon: <Wind /> },
        { title: 'Roof of Mouth', description: 'Tilt your head back and inspect the entire roof of your mouth.', icon: <ChevronLeft /> },
        { title: 'Tongue', description: 'Stick out your tongue and check all surfaces: top, bottom, and sides.', icon: <Activity /> },
        { title: 'Floor of Mouth', description: 'Lift your tongue to check the floor of your mouth and underneath.', icon: <ChevronRight /> },
    ];
    const [checkedState, setCheckedState] = useState(new Array(examSteps.length).fill(false));
    const handleCheckChange = (position: number) => {
        const updatedCheckedState = checkedState.map((item, index) => index === position ? !item : item);
        setCheckedState(updatedCheckedState);
    };
    const totalChecked = checkedState.filter(Boolean).length;
    const progress = (totalChecked / examSteps.length) * 100;

    return (
        <div className="bg-surface-dark p-8 rounded-2xl shadow-lg border border-border-dark">
            <h2 className="text-2xl font-extrabold text-text-primary-dark text-center mb-2">Interactive Self-Exam Checklist</h2>
            <p className="text-center text-text-secondary-dark mb-6">Follow these steps for a thorough self-examination. Check off each step as you go.</p>
            <div className="w-full bg-background-dark rounded-full h-2.5 mb-6">
                <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="space-y-3">
                {examSteps.map((step, index) => (
                    <div key={index} className={`p-4 rounded-lg flex items-center gap-4 transition-colors ${checkedState[index] ? 'bg-green-500/10' : 'bg-background-dark'}`}>
                        <input type="checkbox" checked={checkedState[index]} onChange={() => handleCheckChange(index)} className="h-6 w-6 rounded border-border-dark text-brand-primary focus:ring-brand-primary bg-surface-dark flex-shrink-0" />
                        <div className="text-brand-secondary">{step.icon}</div>
                        <div>
                            <p className="font-bold text-text-primary-dark">{step.title}</p>
                            <p className="text-sm text-text-secondary-dark">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-8 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-center text-red-200">
                <p className="font-bold">See a professional if you find any sore, patch, or lump that does not heal within two weeks.</p>
            </div>
        </div>
    );
};

const KnowledgeHub: React.FC = () => {
    const riskQuestions = [
        { q: 'Do you use any form of tobacco (smoking, chewing)?', risk: 3 },
        { q: 'Do you drink alcohol more than 3 times a week?', risk: 2 },
        { q: 'Is your diet low in fresh fruits and vegetables?', risk: 1 },
        { q: 'Do you have a history of HPV?', risk: 2 },
        { q: 'Do you spend long hours in the sun without lip protection?', risk: 1 },
    ];
    const [answers, setAnswers] = useState(new Array(riskQuestions.length).fill(null));
    const [riskScore, setRiskScore] = useState<number | null>(null);

    const handleAnswer = (index: number, value: boolean) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };
    
    const calculateRisk = () => {
        const score = answers.reduce((acc, answer, index) => {
            if (answer === true) {
                return acc + riskQuestions[index].risk;
            }
            return acc;
        }, 0);
        setRiskScore(score);
    };

    const getRiskCategory = (score: number | null) => {
        if (score === null) return null;
        if (score >= 5) return { level: 'Higher Risk', advice: 'Your answers suggest a higher risk. It is highly recommended you speak to a dental professional about your risk factors and regular screenings.' };
        if (score >= 2) return { level: 'Moderate Risk', advice: 'You have some risk factors. Consider discussing them with your dentist and adopting preventative measures.' };
        return { level: 'Lower Risk', advice: 'You have fewer major risk factors. Continue to maintain a healthy lifestyle and have regular dental check-ups.' };
    }

    const riskResult = getRiskCategory(riskScore);
    
    return (
        <div className="bg-surface-dark p-8 rounded-2xl shadow-lg border border-border-dark space-y-8">
            <h2 className="text-2xl font-extrabold text-text-primary-dark text-center">Knowledge & Risk Assessment</h2>
            <div className="bg-background-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-xl font-bold text-text-primary-dark mb-4 text-center">Check Your Risk Profile</h3>
                <div className="space-y-4">
                    {riskQuestions.map((q, i) => (
                        <div key={i} className="p-3 bg-surface-dark rounded-lg flex justify-between items-center">
                            <p>{q.q}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleAnswer(i, true)} className={`px-4 py-1 rounded-md ${answers[i] === true ? 'bg-red-500 text-white' : 'bg-border-dark'}`}>Yes</button>
                                <button onClick={() => handleAnswer(i, false)} className={`px-4 py-1 rounded-md ${answers[i] === false ? 'bg-green-500 text-white' : 'bg-border-dark'}`}>No</button>
                            </div>
                        </div>
                    ))}
                </div>
                {answers.every(a => a !== null) && (
                     <div className="text-center mt-6">
                        <button onClick={calculateRisk} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-500">Calculate My Risk</button>
                     </div>
                )}
                {riskResult && (
                    <div className="mt-6 p-4 bg-brand-primary/10 rounded-lg text-center animate-fade-in">
                        <p className="font-bold text-xl text-brand-primary">{riskResult.level}</p>
                        <p className="text-text-secondary-dark mt-1">{riskResult.advice}</p>
                    </div>
                )}
            </div>
            <div>
                 <ReactRouterDOM.Link to="/dentradar" className="block bg-border-dark text-center text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-600 transition-colors">
                    Find a Specialist Near You
                </ReactRouterDOM.Link>
            </div>
        </div>
    );
};

const ScreeningHistory: React.FC<{
    history: SavedScreening[];
    onDelete: (id: string) => void;
    onView: (screening: SavedScreening) => void;
}> = ({ history, onDelete, onView }) => {
    if (history.length === 0) {
        return (
            <div className="text-center py-20 px-6 bg-surface-dark rounded-lg border-2 border-dashed border-border-dark">
                <History className="mx-auto h-12 w-12 text-text-secondary-dark" />
                <h3 className="mt-2 text-xl font-semibold text-text-primary-dark">No Screening History</h3>
                <p className="mt-1 text-text-secondary-dark">Your saved analyses will appear here for tracking.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map(screening => (
                <div key={screening.id} className="bg-surface-dark p-4 rounded-lg flex items-center justify-between hover:bg-border-dark transition-colors">
                    <div className="flex items-center gap-4">
                        <img src={screening.imageSrc} alt="Screening thumbnail" className="w-16 h-16 object-cover rounded-md" />
                        <div>
                            <p className="font-bold text-text-primary-dark">Screening from {new Date(screening.date).toLocaleDateString()}</p>
                            <p className="text-sm text-text-secondary-dark">AI Risk Assessment: <span className="font-semibold">{screening.analysis.riskLevel}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onView(screening)} className="text-sm font-semibold bg-brand-primary text-white px-3 py-1.5 rounded-md">View</button>
                        <button onClick={() => onDelete(screening.id)} title="Delete" className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ViewScreeningDetail: React.FC<{ screening: SavedScreening, onBack: () => void, onCompare: (screening: SavedScreening)=>void }> = ({ screening, onBack, onCompare }) => {
    const { analysis, imageSrc } = screening;
    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-fade-in">
            <div className="space-y-4">
                 <button onClick={onBack} className="text-brand-primary hover:underline font-semibold flex items-center gap-1"><ChevronLeft size={16}/> Back to History</button>
                <div className="w-full aspect-square bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-border-dark">
                    <img src={imageSrc} alt="Saved lesion" className="w-full h-full object-cover rounded-lg" />
                </div>
            </div>
            <div>
                <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark space-y-4">
                    <h3 className="text-2xl font-bold text-brand-primary">Analysis from {new Date(screening.date).toLocaleDateString()}</h3>
                    <div className="p-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 rounded-r-lg"><h4 className="font-bold">Important Disclaimer</h4><p className="text-sm">{analysis.disclaimer}</p></div>
                    <RiskIndicator level={analysis.riskLevel} />
                    <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Observations</h4><ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.observations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                    <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Recommendation</h4><p className="text-text-secondary-dark">{analysis.recommendation}</p></div>
                    <div className="mt-6 pt-4 border-t border-border-dark">
                         <button onClick={() => onCompare(screening)} className="w-full bg-brand-secondary text-amber-900 font-semibold px-6 py-3 rounded-lg hover:bg-amber-400 flex items-center justify-center gap-2"><GitCompareArrows size={18}/>Compare with New Photo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComparisonView: React.FC<{ originalScreening: SavedScreening, onBack: () => void }> = ({ originalScreening, onBack }) => {
    const [newImageSrc, setNewImageSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<DentalComparisonAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setNewImageSrc(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleCompare = async () => {
        if (!newImageSrc) return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const base64Image1 = originalScreening.imageSrc.split(',')[1];
            const base64Image2 = newImageSrc.split(',')[1];
            const result = await compareOralImages(base64Image1, 'image/jpeg', base64Image2, 'image/jpeg');
            if (result.error) {
                setError(result.error);
            } else {
                setAnalysis(result);
            }
        } catch (err: any) {
            setError(err.message || 'Comparison failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="text-brand-primary hover:underline font-semibold flex items-center gap-1"><ChevronLeft size={16}/> Back</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-dark p-4 rounded-lg border border-border-dark"><h3 className="text-center font-bold mb-2">Original Photo ({new Date(originalScreening.date).toLocaleDateString()})</h3><img src={originalScreening.imageSrc} className="w-full aspect-square object-cover rounded-md"/></div>
                <div className="bg-surface-dark p-4 rounded-lg border border-border-dark flex flex-col items-center justify-center">
                    {newImageSrc ? <img src={newImageSrc} className="w-full aspect-square object-cover rounded-md"/> : <div className="text-center text-text-secondary-dark p-8 border-2 border-dashed border-border-dark rounded-md"><UploadCloud size={48} className="mx-auto"/><p className="mt-2">Upload a new photo of the same area to compare.</p></div>}
                    <div className="mt-4 flex gap-2"><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" /><button onClick={()=>fileInputRef.current?.click()} className="bg-border-dark px-4 py-2 rounded-md text-sm font-semibold">Choose File</button><button onClick={handleCompare} disabled={!newImageSrc || isLoading} className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{isLoading ? <Spinner/> : 'Compare'}</button></div>
                </div>
            </div>
            {analysis && (
                 <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark animate-fade-in space-y-4">
                    <h3 className="text-2xl font-bold text-brand-primary">Comparison Analysis</h3>
                    <div className="p-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 rounded-r-lg"><h4 className="font-bold">Important Disclaimer</h4><p className="text-sm">{analysis.disclaimer}</p></div>
                    <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Observed Changes</h4><ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.changes.length > 0 ? analysis.changes.map((c, i) => <li key={i}><strong>{c.area}:</strong> {c.observation}</li>) : <li>No significant changes detected by the AI.</li>}</ul></div>
                    <div><h4 className="font-semibold text-lg text-text-primary-dark mb-2">Recommendation</h4><p className="text-text-secondary-dark">{analysis.recommendation}</p></div>
                 </div>
            )}
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md text-center">{error}</p>}
        </div>
    );
};

// --- MAIN COMPONENT ---
export const OralScreen: React.FC = () => {
    const [activeView, setActiveView] = useState<'analyzer' | 'exam' | 'history' | 'hub' | 'detail' | 'comparison'>('analyzer');
    const [history, setHistory] = useState<SavedScreening[]>([]);
    const [selectedScreening, setSelectedScreening] = useState<SavedScreening | null>(null);
    
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(ORALSCREEN_HISTORY_KEY);
            if(savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Could not load screening history.", e); }
    }, []);

    const updateHistory = (newHistory: SavedScreening[]) => {
        setHistory(newHistory);
        localStorage.setItem(ORALSCREEN_HISTORY_KEY, JSON.stringify(newHistory));
    }

    const handleAnalysisComplete = (newScreening: SavedScreening) => {
        updateHistory([newScreening, ...history]);
        setActiveView('history');
    };
    
    const handleDeleteFromHistory = (id: string) => {
        if(window.confirm("Are you sure you want to delete this screening?")) {
            updateHistory(history.filter(s => s.id !== id));
        }
    };
    
    const handleViewDetail = (screening: SavedScreening) => {
        setSelectedScreening(screening);
        setActiveView('detail');
    };
    
    const handleStartComparison = (screening: SavedScreening) => {
        setSelectedScreening(screening);
        setActiveView('comparison');
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'analyzer': return <LesionAnalyzer onAnalysisComplete={handleAnalysisComplete} />;
            case 'exam': return <GuidedSelfExam />;
            case 'hub': return <KnowledgeHub />;
            case 'history': return <ScreeningHistory history={history} onDelete={handleDeleteFromHistory} onView={handleViewDetail} />;
            case 'detail': return selectedScreening ? <ViewScreeningDetail screening={selectedScreening} onBack={() => setActiveView('history')} onCompare={handleStartComparison} /> : null;
            case 'comparison': return selectedScreening ? <ComparisonView originalScreening={selectedScreening} onBack={() => setActiveView('detail')} /> : null;
            default: return null;
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">OralScreen AI</h1>
                <p className="text-text-secondary-dark mt-2">A more powerful suite of tools for oral health awareness and early detection.</p>
            </div>
            
            <div className="flex justify-center p-1 bg-surface-dark rounded-lg border border-border-dark shadow-md flex-wrap">
                <button onClick={() => setActiveView('analyzer')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-grow ${activeView === 'analyzer' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary-dark'}`}>Analyzer</button>
                <button onClick={() => setActiveView('exam')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-grow ${activeView === 'exam' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary-dark'}`}>Self-Exam</button>
                <button onClick={() => setActiveView('history')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-grow ${activeView === 'history' || activeView === 'detail' || activeView === 'comparison' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary-dark'}`}>History</button>
                <button onClick={() => setActiveView('hub')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex-grow ${activeView === 'hub' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary-dark'}`}>Knowledge</button>
            </div>
            
            <div className="animate-fade-in">
                {renderActiveView()}
            </div>
        </div>
    );
};
