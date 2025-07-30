
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeDentalImage } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import type { DentalAnalysis } from '../../types';
import { Camera, Video, VideoOff, Wand2, AlertTriangle, CheckSquare, Eye } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const AnalysisDisplay: React.FC<{ analysis: DentalAnalysis | null }> = ({ analysis }) => {
    if (!analysis) return null;
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark animate-fade-in h-full">
            <h3 className="text-2xl font-bold text-brand-aurora-start mb-4">AI Analysis</h3>
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
        </div>
    );
};

export const TeleDentAI: React.FC = () => {
    const { t } = useTranslation();
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<DentalAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOn(false);
    }, []);

    const startCamera = useCallback(async () => {
        if (isCameraOn) {
            stopCamera();
            return;
        }
        setError(null);
        setAnalysis(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOn(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError('Could not access camera. Please check permissions.');
            setIsCameraOn(false);
        }
    }, [isCameraOn, stopCamera]);
    
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const analyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Image = imageDataUrl.split(',')[1];
        
        try {
            const result = await analyzeDentalImage(base64Image, 'image/jpeg');
            if (result.error) {
                setError(result.error);
            } else {
                setAnalysis(result);
            }
        } catch (err: any) {
            setError(err.message || 'Analysis failed.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">{t('sidebar.teledent.label')}</h1>
                <p className="text-text-secondary-dark mt-2 max-w-2xl mx-auto">{t('teledent.sub')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3">
                    <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden shadow-lg border-2 border-border-dark">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <VideoOff size={64} className="text-slate-500" />
                                <p className="mt-4 text-text-secondary-dark">{t('teledent.cameraOff')}</p>
                            </div>
                        )}
                        {isAnalyzing && (
                             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                                <Spinner />
                                <p className="text-white font-semibold text-xl animate-pulse">{t('teledent.analyzing')}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 p-4 bg-surface-dark rounded-lg flex justify-center items-center gap-4">
                        <button onClick={startCamera} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${isCameraOn ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                            {isCameraOn ? <><VideoOff size={18}/> {t('teledent.stopCamera')}</> : <><Video size={18}/> {t('teledent.startCamera')}</>}
                        </button>
                        <button onClick={analyzeFrame} disabled={!isCameraOn || isAnalyzing} className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end text-white disabled:opacity-50 disabled:cursor-not-allowed">
                           <Wand2 size={18}/> {t('teledent.analyzeFrame')}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    {error && (
                        <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4 mb-4">
                            <AlertTriangle />
                            <div><h3 className="font-bold">{t('teledent.error.title')}</h3><p>{error}</p></div>
                        </div>
                    )}
                    {analysis ? <AnalysisDisplay analysis={analysis} /> : (
                         <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark h-full text-center flex flex-col justify-center">
                            <p className="text-text-secondary-dark">{t('teledent.resultsPlaceholder')}</p>
                        </div>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};
