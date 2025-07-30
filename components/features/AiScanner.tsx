
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeDentalImage } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { DentalAnalysis } from '../../types';
import { FileUp, Camera, Download, Search, RefreshCw, UploadCloud, X, Video, VideoOff, Wand2, CheckSquare, Eye, AlertTriangle, Smile } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTranslation } from '../../contexts/LanguageContext';

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; text: string; }> = ({ onClick, icon, text }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl w-full text-center transition-all duration-300 transform hover:scale-105 bg-background-dark text-text-primary-dark shadow-md border border-border-dark hover:bg-border-dark"
    >
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-dark">{icon}</div>
        <span className="font-bold text-lg">{text}</span>
    </button>
);

const AnalysisDisplay: React.FC<{ analysis: DentalAnalysis | null, onExportPdf?: () => void, showExtraButtons?: boolean }> = ({ analysis, onExportPdf, showExtraButtons = false }) => {
    if (!analysis) return null;
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark animate-fade-in h-full">
            <h3 className="text-2xl font-bold text-brand-primary mb-4">AI Analysis</h3>
            <div className="mb-6 p-4 bg-amber-900/50 border-l-4 border-brand-secondary text-amber-200 rounded-r-lg">
                <h4 className="font-bold">Disclaimer</h4>
                <p className="text-sm">{analysis.disclaimer}</p>
            </div>
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-lg text-text-primary-dark mb-2 flex items-center gap-2"><CheckSquare size={18}/> General Observations</h4>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.observations.map((item, i) => <li key={`obs-${i}`}>{item}</li>)}</ul>
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-text-primary-dark mb-2 flex items-center gap-2"><Eye size={18}/> Areas for Attention</h4>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.areasForAttention.map((item, i) => <li key={`att-${i}`}>{item}</li>)}</ul>
                </div>
            </div>
            {showExtraButtons && onExportPdf && (
                <div className="mt-8 pt-6 border-t border-border-dark flex flex-wrap justify-center gap-4">
                    <button onClick={onExportPdf} className="bg-border-dark text-text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 flex items-center gap-2"><Download size={18}/>Export as PDF</button>
                    <button className="bg-border-dark text-text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 flex items-center gap-2"><Search size={18}/>Find a Dentist</button>
                </div>
            )}
        </div>
    );
};


export const AiScanner: React.FC = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'selector' | 'still' | 'live'>('selector');
    const [stillState, setStillState] = useState<'idle' | 'scanning' | 'captured' | 'analyzing' | 'results'>('idle');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<DentalAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Live mode state
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Core Logic ---
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOn(false);
    }, []);
    
    useEffect(() => {
        return () => { stopCamera(); };
    }, [stopCamera]);

    const reset = () => {
        stopCamera();
        setMode('selector');
        setStillState('idle');
        setImageSrc(null);
        setAnalysis(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Still Mode Logic ---
    const startStillScan = useCallback(async () => {
        setMode('still'); setStillState('scanning');
        setError(null); setAnalysis(null); setImageSrc(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setError('Could not access the camera. Please check permissions.');
            reset();
        }
    }, []);

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImageSrc(dataUrl);
            setStillState('captured');
            stopCamera();
        }
    }, [stopCamera]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target?.result as string);
                setMode('still'); setStillState('captured');
                setError(null); setAnalysis(null);
            };
            reader.readAsDataURL(file);
        } else if (file) { setError('Please select a valid image file.'); }
    };
    
    const triggerFileUpload = () => {
        setMode('still');
        fileInputRef.current?.click();
    };

    const handleStillAnalysis = async () => {
        if (!imageSrc) return;
        setStillState('analyzing'); setError(null);
        try {
            const base64Image = imageSrc.split(',')[1];
            const result = await analyzeDentalImage(base64Image, 'image/jpeg');
            if (result.error) {
                setError(result.error); setStillState('captured');
            } else {
                setAnalysis(result); setStillState('results');
            }
        } catch (err: any) {
            setError(err.message || 'Analysis failed.'); setStillState('captured');
        }
    };

    // --- Live Mode Logic ---
    const startLiveCamera = useCallback(async () => {
        if (isCameraOn) {
            stopCamera();
            return;
        }
        setMode('live'); setError(null); setAnalysis(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraOn(true);
        } catch (err) {
            setError('Could not access camera. Please check permissions.');
            setIsCameraOn(false);
            setMode('selector');
        }
    }, [isCameraOn, stopCamera]);

    const analyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsAnalyzingFrame(true); setError(null); setAnalysis(null);
        
        const video = videoRef.current; const canvas = canvasRef.current;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Image = imageDataUrl.split(',')[1];
        
        try {
            const result = await analyzeDentalImage(base64Image, 'image/jpeg');
            if (result.error) setError(result.error);
            else setAnalysis(result);
        } catch (err: any) {
            setError(err.message || 'Analysis failed.');
        } finally {
            setIsAnalyzingFrame(false);
        }
    };
    
    // --- PDF Export (for still mode) ---
    const exportToPdf = () => {
        if (!analysis || !imageSrc) return;
        const doc = new jsPDF();
        doc.text("AI Dental Analysis Report", 15, 15);
        if (imageSrc) doc.addImage(imageSrc, 'JPEG', 15, 25, 180, 100);
        doc.text("Disclaimer:", 15, 135);
        doc.text(analysis.disclaimer, 15, 142, { maxWidth: 180 });
        doc.text("General Observations:", 15, 165);
        doc.text(analysis.observations.map(s => `- ${s}`).join('\n'), 15, 172, { maxWidth: 180 });
        doc.text("Areas for Attention:", 15, 210);
        doc.text(analysis.areasForAttention.map(s => `- ${s}`).join('\n'), 15, 217, { maxWidth: 180 });
        doc.save('dental-ai-analysis.pdf');
    };

    // --- Render Functions ---

    const renderInitialSelection = () => (
        <div className="bg-surface-dark p-8 rounded-2xl shadow-lg border border-border-dark animate-fade-in">
            <div className="text-center">
                <Smile size={72} className="text-brand-primary mx-auto" />
                <h2 className="text-4xl font-extrabold mt-4 text-text-primary-dark">{t('ayscanner.title')}</h2>
                <p className="text-text-secondary-dark mt-2 max-w-xl mx-auto">{t('ayscanner.sub')}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <ActionButton onClick={startStillScan} icon={<Camera size={40} className="text-brand-primary"/>} text={t('ayscanner.mode.still.photo')}/>
                 <ActionButton onClick={triggerFileUpload} icon={<UploadCloud size={40} className="text-brand-primary"/>} text={t('ayscanner.mode.still.upload')}/>
                 <ActionButton onClick={startLiveCamera} icon={<Video size={40} className="text-brand-primary"/>} text={t('ayscanner.mode.live')}/>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
            </div>
        </div>
    );

    const renderStillMode = () => {
        if (stillState === 'scanning') {
            return (
                 <div className="w-full max-w-2xl mx-auto">
                    <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-brand-primary">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-lg object-cover"></video>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[90%] h-[60%] rounded-3xl border-4 border-dashed border-white/70"></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={reset} className="bg-slate-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:bg-border-dark"><X /></button>
                        <button onClick={captureImage} className="bg-brand-primary text-white w-20 h-20 rounded-full flex items-center justify-center text-4xl hover:bg-teal-500"><Camera /></button>
                    </div>
                </div>
            );
        }
        if (stillState === 'captured' || stillState === 'analyzing' || stillState === 'results') {
            const imagePreview = (
                <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-border-dark">
                    {imageSrc && <img src={imageSrc} alt="Captured teeth" className="w-full h-full object-cover rounded-lg" />}
                    {stillState === 'analyzing' && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4"><Spinner /><p className="text-white font-semibold text-xl animate-pulse">Analyzing with AI...</p></div>}
                </div>
            );

            if (stillState === 'results') {
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {imagePreview}
                            <button onClick={reset} className="w-full bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-500 flex items-center justify-center gap-2"><RefreshCw size={18}/>Scan Again</button>
                        </div>
                        <div className="lg:col-span-3">
                            <AnalysisDisplay analysis={analysis} onExportPdf={exportToPdf} showExtraButtons={true} />
                        </div>
                    </div>
                );
            }

            return (
                 <div className="max-w-4xl mx-auto">
                    {imagePreview}
                    {error && <p className="text-red-500 text-center mt-4 font-medium bg-red-100 p-3 rounded-lg">{error}</p>}
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={reset} className="bg-slate-600 text-text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-border-dark">Cancel</button>
                        <button onClick={handleStillAnalysis} className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-500">Analyze with AI</button>
                    </div>
                </div>
            );
        }
        return null; // Should not happen
    };

    const renderLiveMode = () => (
        <div className="animate-fade-in">
            <button onClick={reset} className="text-brand-primary hover:underline mb-4 font-semibold text-sm">« Back to Mode Selection</button>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3">
                    <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-border-dark">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <VideoOff size={64} className="text-slate-500" />
                                <p className="mt-4 text-text-secondary-dark">{t('ayscanner.live.placeholder')}</p>
                            </div>
                        )}
                        {isAnalyzingFrame && (
                             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                                <Spinner />
                                <p className="text-white font-semibold text-xl animate-pulse">{t('ayscanner.analyzing')}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 p-4 bg-surface-dark rounded-lg flex justify-center items-center gap-4">
                        <button onClick={startLiveCamera} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${isCameraOn ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                            {isCameraOn ? <><VideoOff size={18}/> {t('ayscanner.live.stop')}</> : <><Video size={18}/> {t('ayscanner.live.start')}</>}
                        </button>
                        <button onClick={analyzeFrame} disabled={!isCameraOn || isAnalyzingFrame} className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 bg-brand-primary text-white disabled:bg-teal-800 disabled:cursor-not-allowed">
                           <Wand2 size={18}/> {t('ayscanner.live.analyze')}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4 mb-4">
                            <AlertTriangle />
                            <div><h3 className="font-bold">{t('ayscanner.error.title')}</h3><p>{error}</p></div>
                        </div>
                    )}
                    {analysis ? <AnalysisDisplay analysis={analysis} /> : (
                         <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark h-full text-center flex flex-col justify-center">
                            <p className="text-text-secondary-dark">{t('ayscanner.resultsPlaceholder')}</p>
                        </div>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
    
    if (mode === 'live') return renderLiveMode();
    if (mode === 'still') return renderStillMode();
    return renderInitialSelection();
};