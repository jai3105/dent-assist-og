
import React, { useState, useCallback, useMemo } from 'react';
import { generateStudentPresentation, expandSlidePoint, suggestImageForSlide } from '../../services/geminiService';
import type { PresentationOutline, PresentationSlide } from '../../types';
import { Spinner } from '../common/Spinner';
import { FileText, Wand2, Download, RefreshCw, ChevronLeft, ChevronRight, Plus, Trash2, Image as ImageIcon, Menu } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { jsPDF } from 'jspdf';

interface EditablePresentationSlide extends PresentationSlide {
    id: string; // For React keys and drag-n-drop
}

const suggestedTopics = [
    "Principles of Tooth Preparation",
    "Dental Caries: Etiology and Prevention",
    "Gingivitis vs. Periodontitis",
    "Local Anesthesia Techniques in Dentistry"
];

export const DentaSlides: React.FC = () => {
    const { t } = useTranslation();
    const [topic, setTopic] = useState('');
    const [mainTitle, setMainTitle] = useState('');
    const [slides, setSlides] = useState<EditablePresentationSlide[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiActionStates, setAiActionStates] = useState<{ [key: string]: boolean }>({});

    const handleGenerate = useCallback(async (selectedTopic: string) => {
        if (!selectedTopic.trim()) return;
        setIsLoading(true);
        setError(null);
        setSlides([]);
        setTopic(selectedTopic);
        setCurrentSlideIndex(0);
        try {
            const result = await generateStudentPresentation(selectedTopic);
            if (result.error) throw new Error(result.error);
            setMainTitle(result.mainTitle);
            setSlides(result.slides.map((s, i) => ({ ...s, id: `${Date.now()}-${i}` })));
        } catch (e: any) {
            setError(e.message || t('dentaslides.error'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // --- Content Editing Handlers ---
    const handleSlideContentChange = (slideIndex: number, field: 'title' | 'presenterNotes', value: string) => {
        setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, [field]: value } : s));
    };
    const handlePointChange = (slideIndex: number, pointIndex: number, value: string) => {
        setSlides(prev => prev.map((s, i) => {
            if (i !== slideIndex) return s;
            const newPoints = [...s.points];
            newPoints[pointIndex] = value;
            return { ...s, points: newPoints };
        }));
    };

    // --- Slide & Point Management ---
    const addSlide = () => {
        const newSlide: EditablePresentationSlide = { id: `${Date.now()}`, title: 'New Slide', points: ['New point'], presenterNotes: '' };
        const newIndex = currentSlideIndex + 1;
        setSlides(prev => [...prev.slice(0, newIndex), newSlide, ...prev.slice(newIndex)]);
        setCurrentSlideIndex(newIndex);
    };
    const deleteSlide = (slideId: string) => {
        if (slides.length <= 1) return;
        setSlides(prev => {
            const newSlides = prev.filter(s => s.id !== slideId);
            if (currentSlideIndex >= newSlides.length) {
                setCurrentSlideIndex(newSlides.length - 1);
            }
            return newSlides;
        });
    };
    const addPoint = (slideIndex: number) => {
        setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, points: [...s.points, 'New point'] } : s));
    };
    const deletePoint = (slideIndex: number, pointIndex: number) => {
        setSlides(prev => prev.map((s, i) => {
            if (i !== slideIndex) return s;
            const newPoints = s.points.filter((_, pIdx) => pIdx !== pointIndex);
            return { ...s, points: newPoints };
        }));
    };

    // --- Drag and Drop ---
    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => e.dataTransfer.setData('slideIndex', index.toString());
    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLButtonElement>, dropIndex: number) => {
        const dragIndex = parseInt(e.dataTransfer.getData('slideIndex'), 10);
        if (dragIndex === dropIndex) return;
        const newSlides = [...slides];
        const [draggedItem] = newSlides.splice(dragIndex, 1);
        newSlides.splice(dropIndex, 0, draggedItem);
        setSlides(newSlides);
    };

    // --- AI Feature Handlers ---
    const handleExpandPoint = async (slideIndex: number, pointIndex: number) => {
        const pointText = slides[slideIndex].points[pointIndex];
        setAiActionStates(prev => ({ ...prev, [`expand-${slideIndex}-${pointIndex}`]: true }));
        try {
            const expandedText = await expandSlidePoint(pointText);
            handlePointChange(slideIndex, pointIndex, expandedText);
        } catch (e) {
            console.error(e);
        } finally {
            setAiActionStates(prev => ({ ...prev, [`expand-${slideIndex}-${pointIndex}`]: false }));
        }
    };
    const handleSuggestImage = async (slideIndex: number) => {
        const slide = slides[slideIndex];
        const slideContent = `${slide.title}. ${slide.points.join('. ')}`;
        setAiActionStates(prev => ({ ...prev, [`image-${slideIndex}`]: true }));
        try {
            const imageBytes = await suggestImageForSlide(slideContent);
            setSlides(prev => prev.map((s, i) => i === slideIndex ? { ...s, imageUrl: imageBytes } : s));
        } catch (e) {
            console.error(e);
        } finally {
            setAiActionStates(prev => ({ ...prev, [`image-${slideIndex}`]: false }));
        }
    };

    // --- PDF Export ---
    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text(mainTitle, doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`A presentation on: ${topic}`, doc.internal.pageSize.getWidth() / 2, 110, { align: 'center' });
        slides.forEach((slide, index) => {
            doc.addPage();
            doc.setFontSize(18);
            doc.setTextColor(13, 148, 136);
            doc.text(slide.title, 20, 30);
            doc.setTextColor(40, 40, 40);
            let y = 50;
            slide.points.forEach(point => {
                const lines = doc.splitTextToSize(`• ${point}`, 170);
                if (y + (lines.length * 7) > 280) { doc.addPage(); y = 30; }
                doc.text(lines, 20, y);
                y += lines.length * 7 + 3;
            });
            if (slide.imageUrl) {
                if (y > 180) { doc.addPage(); y = 30; } // Add new page if image doesn't fit
                const fullImageUrl = `data:image/jpeg;base64,${slide.imageUrl}`;
                doc.addImage(fullImageUrl, 'JPEG', 20, y, 170, (170 * 9) / 16);
            }
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text(`Slide ${index + 1}/${slides.length}`, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
        });
        doc.save(`${mainTitle.replace(/ /g, '_')}.pdf`);
    };

    // --- Render Logic ---
    if (slides.length === 0 && !isLoading && !error) {
         return (
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
                <FileText size={64} className="mx-auto text-brand-primary mb-4" />
                <h1 className="text-4xl font-extrabold text-text-primary-dark">{t('dentaslides.title')}</h1>
                <p className="text-text-secondary-dark mt-2 mb-8">{t('dentaslides.sub')}</p>
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                    <div className="flex items-center gap-2">
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleGenerate(topic)} placeholder={t('dentaslides.placeholder')} className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark" />
                        <button onClick={() => handleGenerate(topic)} disabled={!topic.trim()} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:opacity-50"><Wand2 size={20}/></button>
                    </div>
                    <div className="mt-6"><h3 className="font-semibold text-text-primary-dark mb-3">Or try a suggestion:</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{suggestedTopics.map(s => (<button key={s} onClick={() => handleGenerate(s)} className="text-left bg-background-dark p-3 rounded-lg hover:bg-border-dark text-sm">{s}</button>))}</div></div>
                </div>
            </div>
        );
    }
    
    const activeSlide = slides[currentSlideIndex];

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <input value={mainTitle} onChange={e => setMainTitle(e.target.value)} className="text-2xl font-bold bg-transparent text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md p-1 -m-1" />
                <div className="flex gap-2">
                    <button onClick={() => setSlides([])} className="bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><RefreshCw size={16}/> {t('dentaslides.startOver')}</button>
                    <button onClick={handleExportPdf} className="bg-brand-secondary text-background-dark font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><Download size={16}/> {t('dentaslides.exportPdf')}</button>
                </div>
            </div>
            {isLoading ? <div className="text-center p-12"><Spinner /><p className="mt-4 text-text-secondary-dark">{t('dentaslides.loading')}</p></div>
            : error ? <div className="text-center p-6 bg-red-500/10 rounded-lg text-red-300"><p className="font-bold">{t('dentaslides.error')}</p><p>{error}</p></div>
            : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
                    <aside className="md:col-span-1 bg-surface-dark p-4 rounded-lg border border-border-dark flex flex-col">
                        <div className="flex justify-between items-center mb-2"><h3 className="font-bold">{t('dentaslides.outline')}</h3><button onClick={addSlide} className="text-text-secondary-dark hover:text-white p-1 rounded-md bg-border-dark flex items-center gap-1 text-xs px-2"><Plus size={14}/> {t('dentaslides.addSlide')}</button></div>
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {slides.map((slide, index) => (
                                <button key={slide.id} onClick={() => setCurrentSlideIndex(index)} draggable onDragStart={e => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={e => handleDrop(e, index)} className={`w-full text-left p-2 rounded-md text-sm truncate flex items-center justify-between group ${currentSlideIndex === index ? 'bg-brand-primary text-white font-semibold' : 'hover:bg-border-dark'}`}>
                                    <span className="flex items-center gap-2"><Menu size={14} className="cursor-grab"/>{index + 1}. {slide.title}</span>
                                    <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 p-1 rounded-full hover:bg-red-500/10"><Trash2 size={14} /></button>
                                </button>
                            ))}
                        </div>
                    </aside>
                    <main className="md:col-span-3 bg-white p-6 rounded-lg border border-border-dark flex flex-col relative text-gray-800 shadow-lg">
                        <div className="flex-grow overflow-y-auto pr-4">
                            <input value={activeSlide.title} onChange={e => handleSlideContentChange(currentSlideIndex, 'title', e.target.value)} className="w-full text-3xl font-bold text-teal-700 mb-6 bg-transparent border-b-2 border-transparent focus:border-teal-200 focus:outline-none"/>
                            <div className="space-y-3">
                                {activeSlide.points.map((point, i) => (
                                    <div key={i} className="flex items-center gap-2 group">
                                        <span className="text-lg text-gray-400">•</span>
                                        <textarea value={point} onChange={e => handlePointChange(currentSlideIndex, i, e.target.value)} rows={1} className="flex-1 text-lg text-gray-700 bg-transparent border-b-2 border-transparent focus:border-gray-200 focus:outline-none resize-none"/>
                                        <button onClick={() => handleExpandPoint(currentSlideIndex, i)} disabled={aiActionStates[`expand-${currentSlideIndex}-${i}`]} className="text-gray-500 hover:text-teal-600 p-1 rounded-full opacity-0 group-hover:opacity-100" title={t('dentaslides.expandPoint')}>{aiActionStates[`expand-${currentSlideIndex}-${i}`]?<Spinner/>:<Wand2 size={16}/>}</button>
                                        <button onClick={() => deletePoint(currentSlideIndex, i)} className="text-gray-500 hover:text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100" title={t('dentaslides.deletePoint')}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addPoint(currentSlideIndex)} className="text-sm text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1 mt-4"><Plus size={16}/> {t('dentaslides.addPoint')}</button>
                            {activeSlide.imageUrl ? <img src={`data:image/jpeg;base64,${activeSlide.imageUrl}`} alt="AI generated visual" className="mt-4 rounded-lg w-full"/> : <button onClick={() => handleSuggestImage(currentSlideIndex)} disabled={aiActionStates[`image-${currentSlideIndex}`]} className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-200">{aiActionStates[`image-${currentSlideIndex}`]?<Spinner/>:<><ImageIcon size={18}/> {t('dentaslides.suggestImage')}</>}</button>}
                        </div>
                        <div className="flex-shrink-0 mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm text-gray-500">{t('dentaslides.presenterNotes')}</h4>
                            <textarea value={activeSlide.presenterNotes || ''} onChange={e => handleSlideContentChange(currentSlideIndex, 'presenterNotes', e.target.value)} placeholder={t('dentaslides.presenterNotesPlaceholder')} rows={3} className="w-full text-sm bg-gray-100 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};
