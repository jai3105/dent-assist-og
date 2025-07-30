import React, { useState, useCallback } from 'react';
import { simulatePatientCase, evaluateStudentPlan } from '../../services/geminiService';
import type { CaseSimulation, CaseEvaluation } from '../../types';
import { Spinner } from '../common/Spinner';
import { Bot, User, Stethoscope, Lightbulb, CheckCircle, XCircle, FileText, Wand2, RefreshCw } from 'lucide-react';

const caseTopics = [
    "Maxillary First Molar with Irreversible Pulpitis",
    "Chronic Generalized Periodontitis",
    "Ameloblastoma of the Mandible",
    "Dental Fluorosis",
    "Gingival Recession in Lower Anteriors",
];

const CaseDisplay: React.FC<{ caseSim: CaseSimulation }> = ({ caseSim }) => (
    <div className="bg-surface-dark p-6 rounded-lg border border-border-dark space-y-4">
        <div>
            <h3 className="font-bold text-lg text-brand-primary flex items-center gap-2"><FileText size={20}/> Patient Case File</h3>
        </div>
        <div>
            <h4 className="font-semibold text-text-primary-dark">Patient History</h4>
            <p className="text-text-secondary-dark text-sm">{caseSim.patientHistory}</p>
        </div>
        <div>
            <h4 className="font-semibold text-text-primary-dark">Symptoms Reported</h4>
            <ul className="list-disc list-inside text-text-secondary-dark text-sm">
                {caseSim.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)}
            </ul>
        </div>
        <div>
            <h4 className="font-semibold text-text-primary-dark">Radiographic Findings</h4>
            <p className="text-text-secondary-dark text-sm">{caseSim.radiographicFindings}</p>
        </div>
    </div>
);

const EvaluationDisplay: React.FC<{ evaluation: CaseEvaluation }> = ({ evaluation }) => (
    <div className="bg-surface-dark p-6 rounded-lg border border-border-dark space-y-4 animate-fade-in">
        <div>
            <h3 className="font-bold text-lg text-brand-primary flex items-center gap-2"><Bot size={20}/> AI Professor's Feedback</h3>
        </div>
        <div>
            <h4 className="font-semibold text-green-400 flex items-center gap-2"><CheckCircle size={16}/> What you did well</h4>
            <ul className="list-disc list-inside text-text-secondary-dark text-sm">{evaluation.positiveFeedback.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div>
            <h4 className="font-semibold text-yellow-400 flex items-center gap-2"><Lightbulb size={16}/> Areas for improvement</h4>
            <ul className="list-disc list-inside text-text-secondary-dark text-sm">{evaluation.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div>
            <h4 className="font-semibold text-text-primary-dark">Suggested Plan</h4>
            <p className="text-text-secondary-dark text-sm whitespace-pre-wrap">{evaluation.suggestedPlan}</p>
        </div>
        <div className="bg-background-dark p-4 rounded-md border border-border-dark">
            <h4 className="font-semibold text-text-primary-dark">Final Assessment</h4>
            <p className="text-text-secondary-dark text-sm">{evaluation.finalAssessment}</p>
        </div>
    </div>
);

export const DentaSim: React.FC = () => {
    const [topicInput, setTopicInput] = useState('');
    const [currentTopic, setCurrentTopic] = useState('');
    const [caseSimulation, setCaseSimulation] = useState<CaseSimulation | null>(null);
    const [studentPlan, setStudentPlan] = useState('');
    const [evaluation, setEvaluation] = useState<CaseEvaluation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCase = useCallback(async (selectedTopic: string) => {
        if (!selectedTopic) return;
        setIsLoading(true);
        setError(null);
        setCaseSimulation(null);
        setStudentPlan('');
        setEvaluation(null);
        setCurrentTopic(selectedTopic);
        setTopicInput('');

        try {
            const result = await simulatePatientCase(selectedTopic);
            if (result.error) throw new Error(result.error);
            setCaseSimulation(result);
        } catch (e: any) {
            setError(e.message || "Failed to generate case simulation.");
            setCurrentTopic('');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEvaluatePlan = useCallback(async () => {
        if (!caseSimulation || !studentPlan) return;
        setIsLoading(true);
        setError(null);
        setEvaluation(null);
        try {
            const caseString = `History: ${caseSimulation.patientHistory}. Symptoms: ${caseSimulation.symptoms.join(', ')}. Findings: ${caseSimulation.radiographicFindings}`;
            const result = await evaluateStudentPlan(caseString, studentPlan);
            if (result.error) throw new Error(result.error);
            setEvaluation(result);
        } catch (e: any) {
            setError(e.message || "Failed to evaluate the plan.");
        } finally {
            setIsLoading(false);
        }
    }, [caseSimulation, studentPlan]);
    
    const handleTryAnother = () => {
        handleGenerateCase(currentTopic);
    };

    const handleNewTopic = () => {
        setCaseSimulation(null);
        setEvaluation(null);
        setStudentPlan('');
        setCurrentTopic('');
        setError(null);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">DentaSim - AI Case Simulator</h1>
                <p className="text-text-secondary-dark mt-2 max-w-2xl mx-auto">Hone your clinical reasoning skills. Select a topic to generate a patient case, then provide your diagnosis and treatment plan for AI-powered evaluation.</p>
            </div>

            {!caseSimulation ? (
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark mb-4 text-center">Select a Case Topic</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="text"
                            value={topicInput}
                            onChange={e => setTopicInput(e.target.value)}
                            placeholder="Or enter a custom topic..."
                            className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <button onClick={() => handleGenerateCase(topicInput)} disabled={isLoading || !topicInput.trim()} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center justify-center">
                            {isLoading ? <Spinner /> : 'Generate'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {caseTopics.map(t => <button key={t} onClick={() => handleGenerateCase(t)} className="text-left bg-background-dark p-4 rounded-lg hover:bg-border-dark transition-colors duration-200 text-sm text-text-secondary-dark font-medium">{t}</button>)}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <CaseDisplay caseSim={caseSimulation} />
                    </div>
                    <div className="space-y-4">
                        <div className="bg-surface-dark p-6 rounded-lg border border-border-dark">
                            <h3 className="font-bold text-lg text-brand-primary flex items-center gap-2"><User size={20}/> Your Analysis & Plan</h3>
                            <textarea
                                value={studentPlan}
                                onChange={e => setStudentPlan(e.target.value)}
                                rows={8}
                                placeholder="Based on the findings, my diagnosis is...\n\nThe proposed treatment plan is:\n1. ...\n2. ..."
                                className="w-full mt-4 bg-background-dark border border-border-dark rounded-lg p-3 text-sm text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                disabled={!!evaluation || isLoading}
                            />
                            {!evaluation && (
                                <button onClick={handleEvaluatePlan} disabled={isLoading || !studentPlan.trim()} className="w-full mt-4 bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-teal-500 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isLoading && !evaluation ? <Spinner /> : <><Wand2 size={18}/> Evaluate My Plan</>}
                                </button>
                            )}
                        </div>
                        {isLoading && !caseSimulation && <div className="flex justify-center"><Spinner /></div>}
                        {evaluation && (
                            <>
                                <EvaluationDisplay evaluation={evaluation} />
                                <div className="bg-surface-dark p-4 rounded-lg border border-border-dark flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <button onClick={handleTryAnother} className="w-full sm:w-auto flex-1 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 flex items-center justify-center gap-2">
                                        <RefreshCw size={16}/> Try another case on this topic
                                    </button>
                                    <button onClick={handleNewTopic} className="w-full sm:w-auto flex-1 bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-700">
                                        Choose a different topic
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">{error}</div>
            )}
        </div>
    );
};
