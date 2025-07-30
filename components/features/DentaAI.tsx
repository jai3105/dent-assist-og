
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { processVoiceCommand } from '../../services/geminiService';
import type { DentaAiCommandResponse } from '../../types';
import { Mic, X, Bot, User, StopCircle, Hand, Camera, ArrowLeft, ArrowRight, Check, CornerUpLeft } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import * as ReactRouterDOM from 'react-router-dom';

const navItems = [
    { path: '/dentforge', label: 'DentForge' },
    { path: '/dentomedia', label: 'DentoMedia' },
    { path: '/dentafeed', label: 'DentaFeed' },
    { path: '/dentahunt', label: 'DentaHunt' },
    { path: '/dentaround', label: 'DentAround' },
    { path: '/dentamart', label: 'DentaMart' },
    { path: '/dentsync', label: 'DentSync' },
    { path: '/dentaversity', label: 'Denta-versity' },
    { path: '/ai-scanner', label: 'AI Scanner' },
];


export const DentaAI: React.FC<{ isOpen: boolean; onClose: () => void; onNavigate: (path: string) => void; }> = ({ isOpen, onClose, onNavigate }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [conversation, setConversation] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [memory, setMemory] = useState<{ [key: string]: any }>({});
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const recognitionRef = useRef<any | null>(null);
    const statusRef = useRef(status);
    const { language, t } = useTranslation();
    const conversationEndRef = useRef<HTMLDivElement>(null);
    
    // New states for gesture control
    const [activeTab, setActiveTab] = useState<'voice' | 'gesture'>('voice');
    const [highlightedNavIndex, setHighlightedNavIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const gestureStreamRef = useRef<MediaStream | null>(null);
    const navigate = ReactRouterDOM.useNavigate();
    
    // Keep a ref to the current status to avoid stale closures in callbacks
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation, interimTranscript]);
    
    const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const speakResponse = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const langMap: { [key: string]: string } = { 'en': 'en-US', 'hi': 'hi-IN', 'ta': 'ta-IN', 'bn': 'bn-IN', 'ml': 'ml-IN', 'te': 'te-IN', 'kn': 'kn-IN', 'gu': 'gu-IN', 'ur': 'ur-IN' };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langMap[language] || 'en-US';
        
        utterance.onstart = () => setStatus('speaking');
        utterance.onend = () => {
             if (statusRef.current === 'speaking') {
                setStatus('listening');
             }
        };
        utterance.onerror = (e) => {
            console.error("Speech synthesis error", e);
            setStatus('idle');
        };
        window.speechSynthesis.speak(utterance);
    }, [language]);


    useEffect(() => {
        if (!isSpeechRecognitionSupported) return;

        if (status === 'listening' && activeTab === 'voice') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            
            const langMap: { [key: string]: string } = { 'en': 'en-US', 'hi': 'hi-IN', 'ta': 'ta-IN', 'bn': 'bn-IN', 'ml': 'ml-IN', 'te': 'te-IN', 'kn': 'kn-IN', 'gu': 'gu-IN', 'ur': 'ur-IN' };
            recognition.lang = langMap[language] || 'en-US';
            recognition.continuous = false;
            recognition.interimResults = true;
            
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setInterimTranscript(interim);
    
                if (finalTranscript) {
                    setStatus('thinking');
                    setConversation(prev => [...prev, { role: 'user', text: finalTranscript }]);
                    
                    processVoiceCommand(finalTranscript, language, memory).then(response => {
                        setConversation(prev => [...prev, { role: 'model', text: response.responseText }]);
                        
                        if (response.action === 'navigate' && response.target) {
                            onNavigate(response.target);
                        }
                        if (response.action === 'update_memory' && response.target) {
                            try {
                                const newMemory = JSON.parse(response.target);
                                setMemory(prev => ({ ...prev, ...newMemory }));
                            } catch (e) { console.error("Failed to parse memory update:", e); }
                        }
                        speakResponse(response.responseText);
                    }).catch(error => {
                        console.error("DentaAI error:", error);
                        const errorResponseText = "Sorry, I couldn't process that request.";
                        setConversation(prev => [...prev, { role: 'model', text: errorResponseText }]);
                        speakResponse(errorResponseText);
                    });
                }
            };
            
            recognition.onend = () => {
                if (statusRef.current === 'listening') {
                    setStatus('idle');
                }
            };
            
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    setPermissionError(t('dentaai.error.permission'));
                } else if (event.error === 'service-not-allowed') {
                    setPermissionError(t('dentaai.error.service_not_allowed'));
                }
                if (statusRef.current === 'listening') {
                   setStatus('idle');
                }
            };

            recognition.start();

        } else if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        return () => { // Cleanup function
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };

    }, [status, activeTab, isSpeechRecognitionSupported, language, memory, onNavigate, speakResponse, t]);
    
    const stopGestureCamera = useCallback(() => {
        if (gestureStreamRef.current) {
            gestureStreamRef.current.getTracks().forEach(track => track.stop());
            gestureStreamRef.current = null;
        }
        if(videoRef.current) videoRef.current.srcObject = null;
    }, []);

    const startGestureCamera = useCallback(async () => {
        stopGestureCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            gestureStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setPermissionError(t('dentaai.error.permission'));
            console.error("Gesture camera error:", err);
        }
    }, [stopGestureCamera, t]);

    useEffect(() => {
        if(isOpen && activeTab === 'gesture') {
            startGestureCamera();
        } else {
            stopGestureCamera();
        }
    }, [isOpen, activeTab, startGestureCamera, stopGestureCamera]);


    const handleMicClick = async () => {
        setPermissionError(null);
        if (status === 'listening' || status === 'speaking') {
            window.speechSynthesis.cancel();
            setStatus('idle');
            return;
        }

        try {
            // Check for microphone permission explicitly before starting recognition
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // We only need permission, not the stream
            setStatus('listening');
        } catch (err) {
            console.error("Microphone permission error:", err);
            setPermissionError(t('dentaai.error.permission'));
            setStatus('idle');
        }
    };
    
    const handleClose = useCallback(() => {
        window.speechSynthesis.cancel();
        stopGestureCamera();
        setStatus('idle');
        setConversation([]);
        setInterimTranscript('');
        setMemory({});
        setPermissionError(null);
        setActiveTab('voice');
        onClose();
    }, [onClose, stopGestureCamera]);
    
    const handleGestureNext = () => setHighlightedNavIndex(prev => (prev + 1) % navItems.length);
    const handleGesturePrev = () => setHighlightedNavIndex(prev => (prev - 1 + navItems.length) % navItems.length);
    const handleGestureSelect = () => {
        onNavigate(navItems[highlightedNavIndex].path);
        handleClose();
    };
    const handleGestureBack = () => {
        navigate(-1);
        handleClose();
    };

    useEffect(() => {
        if (isOpen && conversation.length === 0) {
            const welcomeText = t('dentaai.welcome');
            setConversation([{ role: 'model', text: welcomeText }]);
        } else if (!isOpen) {
             handleClose();
        }
    }, [isOpen, handleClose, t]);

    if (!isSpeechRecognitionSupported && isOpen) {
        return (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
                <div className="bg-surface-dark rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-red-500" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-red-400">{t('dentaai.error.unsupported.title')}</h2>
                    <p className="text-text-secondary-dark mt-4">{t('dentaai.error.unsupported.message')}</p>
                     <button onClick={handleClose} className="mt-6 bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700">{t('dentaai.close')}</button>
                </div>
            </div>
        )
    }

    return (
        <div className={`fixed bottom-4 right-4 w-full max-w-md bg-surface-dark rounded-2xl shadow-2xl border border-border-dark flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0'} z-50`}
             aria-hidden={!isOpen}
        >
            <div className="flex justify-between items-center p-4 border-b border-border-dark flex-shrink-0">
                <h2 className="text-lg font-bold text-text-primary-dark flex items-center gap-2">
                    <Bot className="text-brand-primary" /> {t('dentaai.title')}
                </h2>
                <button onClick={handleClose} className="text-text-secondary-dark hover:text-white" aria-label="Close DentaAI">
                    <X />
                </button>
            </div>

            <div className="p-2 border-b border-border-dark flex-shrink-0">
                <div className="flex items-center p-1 bg-background-dark rounded-lg">
                    <button onClick={() => setActiveTab('voice')} className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${activeTab === 'voice' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}><Mic size={16}/> {t('dentaai.tab.voice')}</button>
                    <button onClick={() => setActiveTab('gesture')} className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${activeTab === 'gesture' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}><Hand size={16}/> {t('dentaai.tab.gesture')}</button>
                </div>
            </div>
            
            {activeTab === 'voice' && (
                <div className="flex flex-col flex-grow min-h-[350px] max-h-[60vh]">
                    <div className="p-4 flex-grow overflow-y-auto">
                        <div className="w-full text-left space-y-4 mb-auto">
                            {permissionError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
                                    <p className="font-bold">{t('dentaai.error.speech_title')}</p>
                                    <p>{permissionError}</p>
                                </div>
                            )}
                            {conversation.map((msg, index) => (
                                msg.role === 'user' ? (
                                    <div key={index} className="flex items-start gap-3 justify-end">
                                        <div className="bg-brand-primary text-white rounded-lg p-3 max-w-xs shadow-sm"><p>{msg.text}</p></div>
                                        <User className="text-brand-secondary w-8 h-8 flex-shrink-0 mt-1"/>
                                    </div>
                                ) : (
                                    <div key={index} className="flex items-start gap-3 justify-start">
                                        <Bot className="text-brand-primary w-8 h-8 flex-shrink-0 mt-1"/>
                                        <div className="bg-background-dark text-text-secondary-dark rounded-lg p-3 max-w-xs shadow-sm border border-border-dark"><p>{msg.text}</p></div>
                                    </div>
                                )
                            ))}
                            {interimTranscript && (
                                <div className="flex items-start gap-3 justify-end">
                                    <div className="bg-brand-primary/70 text-white/80 rounded-lg p-3 max-w-xs shadow-sm"><p>{interimTranscript}</p></div>
                                    <User className="text-brand-secondary w-8 h-8 flex-shrink-0 mt-1"/>
                                </div>
                            )}
                            <div ref={conversationEndRef} />
                        </div>
                    </div>

                    <div className="p-4 border-t border-border-dark flex justify-center items-center flex-shrink-0 gap-4">
                        <button 
                            onClick={handleMicClick}
                            className={`w-16 h-16 rounded-full text-white flex items-center justify-center transition-all duration-300
                                ${status === 'listening' ? 'bg-red-600 animate-pulse' : ''}
                                ${status === 'speaking' ? 'bg-blue-600' : ''}
                                ${status === 'thinking' ? 'bg-purple-600' : ''}
                                ${status === 'idle' ? 'bg-brand-primary hover:bg-teal-500' : ''}
                            `}
                            aria-label={status === 'listening' || status === 'speaking' ? t('dentaai.aria.stop') : t('dentaai.aria.start')}
                        >
                            {status === 'listening' || status === 'speaking' ? <StopCircle size={28} /> : <Mic size={28}/>}
                        </button>
                        <div className="text-sm text-text-secondary-dark h-4 w-24 text-center">
                            {status === 'listening' && <p className="animate-pulse">{t('dentaai.status.listening')}</p>}
                            {status === 'thinking' && <p className="text-brand-primary animate-pulse">{t('dentaai.status.thinking')}</p>}
                            {status === 'speaking' && <p className="text-blue-400 animate-pulse">{t('dentaai.status.speaking')}</p>}
                            {status === 'idle' && <p>{t('dentaai.status.idle')}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'gesture' && (
                <div className="flex flex-col flex-grow min-h-[350px] max-h-[60vh] p-4 space-y-4">
                    <h3 className="text-base font-bold text-center text-text-primary-dark">{t('dentaai.gesture.title')}</h3>
                    <div className="w-full aspect-video bg-black rounded-lg relative flex items-center justify-center">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-lg"/>
                        {permissionError && <p className="absolute text-center text-sm text-red-400 bg-black/50 p-2 rounded">{permissionError}</p>}
                        {!gestureStreamRef.current && !permissionError && <Camera size={48} className="text-slate-600 absolute"/>}
                    </div>
                     <p className="text-xs text-center text-text-secondary-dark">{t('dentaai.gesture.description')}</p>
                    <div className="p-3 bg-background-dark rounded-lg text-center">
                        <span className="text-sm text-text-secondary-dark">{t('dentaai.gesture.target')} </span>
                        <span className="font-bold text-brand-secondary">{navItems[highlightedNavIndex].label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleGesturePrev} className="flex items-center justify-center gap-2 bg-border-dark p-3 rounded-lg hover:bg-slate-700"><ArrowLeft size={18}/> {t('dentaai.gesture.prev')}</button>
                        <button onClick={handleGestureNext} className="flex items-center justify-center gap-2 bg-border-dark p-3 rounded-lg hover:bg-slate-700">{t('dentaai.gesture.next')} <ArrowRight size={18}/></button>
                        <button onClick={handleGestureSelect} className="col-span-2 flex items-center justify-center gap-2 bg-brand-primary text-white p-3 rounded-lg hover:bg-teal-500"><Check size={18}/> {t('dentaai.gesture.select')}</button>
                        <button onClick={handleGestureBack} className="col-span-2 flex items-center justify-center gap-2 bg-slate-600 text-white p-3 rounded-lg hover:bg-slate-700"><CornerUpLeft size={18}/> {t('dentaai.gesture.back')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};
