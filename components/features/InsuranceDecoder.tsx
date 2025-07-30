
import React, { useState, useCallback, useRef } from 'react';
import type { InsurancePlanSummary, InsuranceBenefit } from '../../types';
import { decodeInsurancePlan } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { UploadCloud, ShieldCheck, AlertTriangle, FileUp } from 'lucide-react';

const BenefitCard: React.FC<{ benefit: InsuranceBenefit }> = ({ benefit }) => {
    const categoryColors = {
        Preventative: 'border-blue-500', Basic: 'border-green-500', Major: 'border-yellow-500',
        Orthodontics: 'border-purple-500', Other: 'border-slate-500'
    };

    return (
        <div className={`bg-background-dark p-4 rounded-lg border-l-4 ${categoryColors[benefit.category]}`}>
            <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary-dark">{benefit.category}</span>
                <span className="text-2xl font-extrabold text-brand-primary">{benefit.coveragePercentage}%</span>
            </div>
            {benefit.notes && <p className="text-xs text-text-secondary-dark mt-1 italic">{benefit.notes}</p>}
        </div>
    );
};

export const InsuranceDecoder: React.FC = () => {
    const [summary, setSummary] = useState<InsurancePlanSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setSummary(null);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (e) => {
            const imageDataUrl = e.target?.result as string;
            setImagePreview(imageDataUrl);
            const base64Image = imageDataUrl.split(',')[1];
            try {
                const result = await decodeInsurancePlan(base64Image, file.type);
                if (result.error) {
                    setError(result.error);
                } else {
                    setSummary(result);
                }
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred during analysis.');
            } finally {
                setIsLoading(false);
            }
        };
    };

    const triggerFileUpload = () => fileInputRef.current?.click();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <ShieldCheck className="mx-auto h-16 w-16 text-brand-primary mb-2" />
                <h1 className="text-4xl font-extrabold text-text-primary-dark">Insurance Decoder</h1>
                <p className="text-text-secondary-dark mt-2 max-w-2xl mx-auto">Take a picture of your dental insurance benefits summary and let our AI explain it in simple terms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col items-center justify-center p-6 bg-surface-dark rounded-lg shadow-lg border-2 border-dashed border-border-dark h-full">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Insurance Plan Preview" className="max-h-80 w-auto rounded-lg" />
                    ) : (
                        <UploadCloud size={64} className="text-text-secondary-dark mb-4" />
                    )}
                    <button onClick={triggerFileUpload} disabled={isLoading} className="mt-6 bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center gap-2">
                        <FileUp size={18} />
                        {imagePreview ? 'Upload a Different Image' : 'Upload Your Plan'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                    <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Your Simplified Benefits</h2>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full p-12">
                            <Spinner />
                            <p className="mt-4 text-text-secondary-dark font-semibold">AI is decoding your plan...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4"><AlertTriangle/><div><h3 className="font-bold">Analysis Failed</h3><p>{error}</p></div></div>
                    ) : summary ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-900/50 border-l-4 border-brand-secondary text-amber-200 rounded-r-lg"><h4 className="font-bold">Disclaimer</h4><p className="text-sm">{summary.disclaimer}</p></div>
                            <h3 className="text-xl font-semibold text-center py-2">{summary.planName}</h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-background-dark p-3 rounded-lg"><p className="text-sm text-text-secondary-dark">Annual Maximum</p><p className="text-2xl font-bold text-text-primary-dark">₹{summary.annualMaximum.toLocaleString('en-IN')}</p></div>
                                <div className="bg-background-dark p-3 rounded-lg"><p className="text-sm text-text-secondary-dark">Deductible</p><p className="text-2xl font-bold text-text-primary-dark">₹{summary.deductible.toLocaleString('en-IN')}</p></div>
                            </div>
                            <div className="space-y-3 pt-4">
                                {summary.benefits.map((b, i) => <BenefitCard key={i} benefit={b} />)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-text-secondary-dark p-12 h-full flex flex-col items-center justify-center">
                            <p>Upload an image of your plan to see your benefits summary here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
