import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Question, EvaluationResult, Mnemonic, VivaQuestion } from '../../types';
import { generateExamTipsForQuestion, evaluatePrepAnswer, generateMnemonic, createVivaChat } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { BookText, Search, Plus, ChevronLeft, Lightbulb, GraduationCap, University, BookCopy, FileQuestion, Wand2, X, ClipboardEdit, Timer, Check, ChevronRight, Brain, Mic } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import type { Chat } from '@google/genai';


// --- MOCK DATA ---
const mockQuestions: Question[] = [
    { id: '1', questionType: 'Essay', questionText: 'Discuss the principles of access cavity preparation for a maxillary first molar, including the anatomical considerations and common errors.', modelAnswer: 'The model answer would detail the outline form (rhomboidal), localization of canals (MB1, MB2, DB, P), and de-roofing the pulp chamber completely. It should also mention the law of centrality, concentricity, and color change. Common errors include perforation, missing the MB2 canal, and over/under extension.', subject: 'Conservative & Endodontics', examType: 'Final University', year: 2023, college: 'MCODS, Manipal', university: 'MAHE', contributor: 'Dr. Priya Sharma' },
    { id: '2', questionType: 'Essay', questionText: 'Classify impression materials used in prosthodontics with examples and indications for each.', modelAnswer: 'Classification based on elasticity (elastic/non-elastic), setting reaction (chemical/thermal), etc. Examples: Alginate (for study models), PVS (for crowns and bridges), Polyether, Agar. Indications should be detailed for each type.', subject: 'Prosthodontics', examType: 'Internal', year: 2024, college: 'MAIDS, Delhi', university: 'Delhi University', contributor: 'Anonymous' },
    { id: '3', questionType: 'Essay', questionText: 'Describe the mechanism of action of local anesthetics and factors influencing their efficacy.', modelAnswer: 'Local anesthetics are membrane stabilizing drugs that reversibly decrease the rate of depolarization and repolarization of excitable membranes by blocking sodium channels... Factors include pKa, lipid solubility, protein binding, tissue pH, and vasodilation.', subject: 'Pharmacology', examType: 'Final University', year: 2023, college: 'Nair Hospital Dental College, Mumbai', university: 'MUHS', contributor: 'Dr. Rohan Patel' },
    { id: '4', questionType: 'Essay', questionText: 'What is Angle\'s classification of malocclusion? Describe Class II division 1 and division 2.', modelAnswer: 'Angle\'s classification is based on the relationship of the mesiobuccal cusp of the maxillary first molar... Class II div 1 features proclined upper incisors and increased overjet. Class II div 2 features retroclined upper central incisors and a deep bite.', subject: 'Orthodontics', examType: 'Final University', year: 2022, college: 'Government Dental College, Bangalore', university: 'RGUHS', contributor: 'Dr. Sneha Reddy' },
    { id: '5', questionType: 'Essay', questionText: 'Discuss the etiology, clinical features, and management of chronic periodontitis.', modelAnswer: 'Etiology is primarily bacterial plaque, modified by systemic and local factors. Clinical features include pocket formation, bone loss, bleeding on probing, and tooth mobility. Management involves non-surgical therapy (SRP), surgical therapy (flap surgery), and maintenance.', subject: 'Periodontics', examType: 'Internal', year: 2023, college: 'MCODS, Manipal', university: 'MAHE', contributor: 'Anonymous' },
    { id: '6', questionType: 'MCQ', questionText: 'Which of the following is NOT a component of the periodontal ligament?', modelAnswer: 'Cementoblasts are found on the surface of the cementum, not within the PDL itself.', subject: 'Periodontics', examType: 'NEET MDS', year: 2023, college: 'AIIMS', university: 'AIIMS', contributor: 'PrepAI', options: ['Sharpey\'s fibers', 'Fibroblasts', 'Cementoblasts', 'Blood vessels'], answer: 'Cementoblasts' },
    { id: '7', questionType: 'MCQ', questionText: 'The primary mineral component of enamel is:', modelAnswer: 'Hydroxyapatite is the primary inorganic component of enamel, making up about 96% of its weight.', subject: 'Dental Materials', examType: 'NEET MDS', year: 2022, college: 'AIIMS', university: 'AIIMS', contributor: 'PrepAI', options: ['Fluorapatite', 'Hydroxyapatite', 'Calcium Carbonate', 'Collagen'], answer: 'Hydroxyapatite' },
    { id: '8', questionType: 'MCQ', questionText: 'Which nerve is responsible for innervating the muscles of mastication?', modelAnswer: 'The mandibular division of the trigeminal nerve (V3) innervates the four muscles of mastication.', subject: 'Anatomy', examType: 'NEET MDS', year: 2023, college: 'AIIMS', university: 'AIIMS', contributor: 'PrepAI', options: ['Facial nerve (VII)', 'Trigeminal nerve (V3)', 'Glossopharyngeal nerve (IX)', 'Hypoglossal nerve (XII)'], answer: 'Trigeminal nerve (V3)' }
];

const subjects = [
    'All', 'Anatomy', 'Physiology', 'Biochemistry', 'Dental Materials',
    'Pharmacology', 'Pathology', 'Microbiology', 'General Medicine',
    'General Surgery', 'Oral Pathology', 'Oral Medicine & Radiology',
    'Prosthodontics', 'Periodontics', 'Orthodontics', 'Pedodontics',
    'Conservative & Endodontics', 'Oral & Maxillofacial Surgery'
];

const universities = ['All', 'MAHE', 'Delhi University', 'MUHS', 'RGUHS', 'AIIMS'];
const colleges = ['All', 'MCODS, Manipal', 'MAIDS, Delhi', 'Nair Hospital Dental College, Mumbai', 'Government Dental College, Bangalore', 'AIIMS'];
const examTypes: ('All' | Question['examType'])[] = ['All', 'Internal', 'Final University', 'NEET MDS'];
const questionTypes: ('All' | Question['questionType'])[] = ['All', 'Essay', 'MCQ'];

// --- Utility types ---
type TestConfig = { subjects: string[], numQuestions: number, timeLimit: number, examPattern: string };
type ActiveTest = { questions: Question[], userAnswers: (string|null)[], startTime: number, timeLimit: number };
type TestResult = { score: number, total: number, mcqCorrect: number, mcqTotal: number, questions: Question[], userAnswers: (string|null)[], essayEvaluations: (EvaluationResult | null)[] };

// --- Sub-components ---

const FilterBar: React.FC<{ filters: any, setFilters: any }> = ({ filters, setFilters }) => {
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-primary";
    
    return (
        <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-6"><input type="text" name="query" value={filters.query} onChange={handleFilterChange} placeholder="Search question keywords or topics..." className={`${inputClass} p-3`} /></div>
            <select name="subject" value={filters.subject} onChange={handleFilterChange} className={`${inputClass} lg:col-span-2`}>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select name="university" value={filters.university} onChange={handleFilterChange} className={inputClass}>{universities.map(u => <option key={u} value={u}>{u}</option>)}</select>
            <select name="college" value={filters.college} onChange={handleFilterChange} className={inputClass}>{colleges.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select name="examType" value={filters.examType} onChange={handleFilterChange} className={inputClass}>{examTypes.map(e => <option key={e} value={e}>{e}</option>)}</select>
            <select name="questionType" value={filters.questionType} onChange={handleFilterChange} className={inputClass}>{questionTypes.map(e => <option key={e} value={e}>{e}</option>)}</select>
        </div>
    );
};

const QuestionCard: React.FC<{ question: Question; onSelect: () => void }> = ({ question, onSelect }) => (
    <div onClick={onSelect} className="bg-surface-dark p-4 rounded-lg shadow-sm border border-border-dark hover:shadow-lg hover:border-brand-primary transition-all duration-300 cursor-pointer">
        <p className="font-semibold text-text-primary-dark mb-2 line-clamp-2">{question.questionText}</p>
        <div className="text-xs text-text-secondary-dark space-y-1">
            <p><BookCopy size={12} className="inline mr-2"/> {question.subject}</p>
            <p><GraduationCap size={12} className="inline mr-2"/> {question.college}</p>
        </div>
        <div className="mt-3 flex gap-2">
            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${question.examType === 'Internal' ? 'bg-blue-500/20 text-blue-300' : question.examType === 'Final University' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>{question.examType}</span>
            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-700 text-slate-300">{question.questionType}</span>
        </div>
    </div>
);

const ContributeQuestionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Omit<Question, 'id' | 'contributor'|'error'>) => void; }> = ({ isOpen, onClose, onSave }) => {
    const [qType, setQType] = useState<'Essay'|'MCQ'>('Essay');
    const [formData, setFormData] = useState({ questionText: '', modelAnswer: '', subject: subjects[1], examType: 'Internal' as Question['examType'], year: new Date().getFullYear(), college: colleges[1], university: universities[1], options:['','','',''], answer:'' });
    
    if (!isOpen) return null;

    const handleSave = () => {
        if(!formData.questionText.trim()) { alert("Please fill all fields"); return; }
        const dataToSave = { ...formData, questionType: qType, year: Number(formData.year) };
        if (qType === 'Essay') {
            if (!formData.modelAnswer.trim()) { alert("Please provide a model answer for essay questions."); return; }
        } else {
            if (formData.options.some(opt => !opt.trim()) || !formData.answer.trim()) { alert("Please fill all four options and select the correct answer for MCQs."); return; }
        }
        onSave(dataToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-border-dark" onClick={e=>e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-text-primary-dark">Contribute a Question</h2><button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button></div>
                <div className="space-y-4">
                    <div className="flex items-center p-1 bg-background-dark rounded-lg border border-border-dark w-fit"><button onClick={()=>setQType('Essay')} className={`px-3 py-1 text-sm font-semibold rounded-md ${qType === 'Essay' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}>Essay</button><button onClick={()=>setQType('MCQ')} className={`px-3 py-1 text-sm font-semibold rounded-md ${qType === 'MCQ' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}>MCQ</button></div>
                    <textarea name="questionText" placeholder="Question Text" value={formData.questionText} onChange={e=>setFormData(p=>({...p,questionText:e.target.value}))} rows={3} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>
                    {qType === 'Essay' ? (
                        <textarea name="modelAnswer" placeholder="Model Answer" value={formData.modelAnswer} onChange={e=>setFormData(p=>({...p,modelAnswer:e.target.value}))} rows={6} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"></textarea>
                    ) : (
                        <div className="space-y-2">
                           {formData.options.map((opt, i) => (
                               <input key={i} type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const newOpts = [...formData.options]; newOpts[i] = e.target.value; setFormData(p=>({...p, options: newOpts, answer: (formData.answer === opt ? e.target.value : formData.answer)}))}} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"/>
                           ))}
                           <select value={formData.answer} onChange={e=>setFormData(p=>({...p,answer:e.target.value}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"><option value="">Select Correct Answer</option>{formData.options.filter(o=>o.trim()).map(opt=><option key={opt} value={opt}>{opt}</option>)}</select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <select name="subject" value={formData.subject} onChange={e=>setFormData(p=>({...p,subject:e.target.value}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark">{subjects.slice(1).map(s => <option key={s}>{s}</option>)}</select>
                        <select name="examType" value={formData.examType} onChange={e=>setFormData(p=>({...p,examType:e.target.value as any}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"><option>Internal</option><option>Final University</option><option>NEET MDS</option></select>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6"><button type="button" onClick={onClose} className="bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-600">Cancel</button><button type="button" onClick={handleSave} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500">Submit</button></div>
            </div>
        </div>
    );
}

const VivaSessionView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    const [topic, setTopic] = useState('');
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<VivaQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ wasCorrect: boolean; explanation: string; correctAnswer: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanJsonString = (jsonString: string): string => {
        return jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    };
    
    const startSession = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const session = createVivaChat(topic);
            setChatSession(session);
            
            const response = await session.sendMessage({ message: `Start the viva on ${topic}.` });
            const firstQuestion: VivaQuestion = JSON.parse(cleanJsonString(response.text));
            
            if(firstQuestion.error) throw new Error(firstQuestion.error);

            setCurrentQuestion(firstQuestion);
            setIsSessionActive(true);
        } catch (e: any) {
            setError(e.message || "Failed to start the viva session. The AI might be busy. Please try again.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answer);
        
        const wasCorrect = answer === currentQuestion?.answer;
        setFeedback({
            wasCorrect,
            explanation: currentQuestion?.explanation || 'No explanation provided.',
            correctAnswer: currentQuestion?.answer || ''
        });
    };
    
    const nextQuestion = async () => {
        if (!chatSession || !selectedAnswer) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatSession.sendMessage({ message: selectedAnswer });
            const newQuestionData: VivaQuestion = JSON.parse(cleanJsonString(response.text));

            if (newQuestionData.isFinalQuestion) {
                setIsFinished(true);
                setCurrentQuestion(null);
            } else {
                if(newQuestionData.error) throw new Error(newQuestionData.error);
                setCurrentQuestion(newQuestionData);
                setSelectedAnswer(null);
                setFeedback(null);
            }
        } catch (e: any) {
            setError(e.message || "Failed to get the next question. The AI response may be invalid.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const endSession = () => {
        setIsSessionActive(false);
        setChatSession(null);
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setFeedback(null);
        setTopic('');
        setIsFinished(false);
        setError(null);
    };

    if (!isSessionActive) {
        return (
             <div className="max-w-2xl mx-auto bg-surface-dark p-8 rounded-lg shadow-lg border border-border-dark animate-fade-in">
                <button onClick={onBack} className="flex items-center gap-1 text-brand-primary hover:underline mb-4 font-semibold text-sm"><ChevronLeft size={18} /> Back to Repository</button>
                <h2 className="text-2xl font-bold text-text-primary-dark mb-2 text-center">{t('prephub.viva.title')}</h2>
                <p className="text-text-secondary-dark text-center mb-6">{t('prephub.viva.sub')}</p>
                <div className="flex items-center gap-2">
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} onKeyPress={e => e.key === 'Enter' && startSession()} placeholder={t('prephub.viva.enterTopic')} className="flex-grow bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark"/>
                    <button onClick={startSession} disabled={isLoading || !topic.trim()} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-500 disabled:opacity-50 flex items-center justify-center">
                        {isLoading ? <Spinner /> : t('prephub.viva.start')}
                    </button>
                </div>
                 {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </div>
        );
    }
    
     if (isFinished) {
        return (
            <div className="max-w-2xl mx-auto bg-surface-dark p-8 rounded-lg text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-text-primary-dark">{t('prephub.viva.finishedTitle')}</h2>
                <p className="text-text-secondary-dark mt-2">{t('prephub.viva.finishedSub')}</p>
                <button onClick={endSession} className="mt-6 bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg">{t('prephub.viva.startNew')}</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary-dark">Viva Topic: {topic}</h2>
                <button onClick={endSession} className="bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-lg text-sm">{t('prephub.viva.end')}</button>
            </div>
            
            {isLoading && !currentQuestion && <div className="text-center p-8"><Spinner/><p>{t('prephub.viva.loading')}</p></div>}
            
            {currentQuestion && (
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark animate-fade-in">
                    <p className="font-semibold text-lg text-text-primary-dark mb-4">{currentQuestion.question}</p>
                    <div className="space-y-3">
                        {currentQuestion.options.map(opt => {
                             const isSelected = selectedAnswer === opt;
                             let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-colors ';
                             if (feedback) { // An answer has been selected and feedback is shown
                                 const isCorrect = opt === currentQuestion.answer;
                                 if (isCorrect) buttonClass += 'bg-green-500/20 border-green-500';
                                 else if (isSelected) buttonClass += 'bg-red-500/20 border-red-500';
                                 else buttonClass += 'bg-background-dark border-border-dark opacity-60';
                             } else { // Waiting for selection
                                 buttonClass += isSelected ? 'bg-brand-primary/20 border-brand-primary' : 'bg-background-dark border-border-dark hover:border-slate-700';
                             }
                            return <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback} className={buttonClass}>{opt}</button>
                        })}
                    </div>
                </div>
            )}
            
            {feedback && (
                 <div className="mt-4 p-4 rounded-lg bg-surface-dark animate-fade-in">
                    <h3 className={`text-lg font-bold ${feedback.wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.wasCorrect ? t('prephub.viva.correct') : t('prephub.viva.incorrect')}
                    </h3>
                    {!feedback.wasCorrect && <p className="text-sm text-text-secondary-dark">{t('prephub.viva.correctAnswerWas')} <span className="font-semibold">{feedback.correctAnswer}</span></p>}
                    <p className="mt-2 text-sm text-text-secondary-dark"><span className="font-semibold">{t('prephub.viva.explanation')}:</span> {feedback.explanation}</p>
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <button onClick={nextQuestion} disabled={!selectedAnswer || isLoading} className="bg-brand-primary text-white font-semibold py-3 px-8 rounded-lg disabled:opacity-50 flex items-center justify-center">
                    {isLoading ? <Spinner/> : t('prephub.viva.nextQuestion')}
                </button>
            </div>
             {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    );
};

// --- Main Component ---
export const DentPrepHub: React.FC = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'repository' | 'viva'>('repository');
    const [view, setView] = useState<'repository' | 'test_config' | 'test_taking' | 'test_results'>('repository');
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [questions, setQuestions] = useState<Question[]>(mockQuestions);
    const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
    const [filters, setFilters] = useState({ query: '', subject: 'All', university: 'All', college: 'All', examType: 'All', questionType: 'All' });
    const [tips, setTips] = useState<string[]>([]);
    const [isLoadingTips, setIsLoadingTips] = useState(false);
    const [mnemonic, setMnemonic] = useState<Mnemonic | null>(null);
    const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);

    // Mock Test State
    const [testConfig, setTestConfig] = useState<TestConfig>({ subjects: [], numQuestions: 10, timeLimit: 15, examPattern: 'General' });
    const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [testResults, setTestResults] = useState<TestResult | null>(null);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => 
            (filters.query ? q.questionText.toLowerCase().includes(filters.query.toLowerCase()) : true) &&
            (filters.subject !== 'All' ? q.subject === filters.subject : true) &&
            (filters.university !== 'All' ? q.university === filters.university : true) &&
            (filters.college !== 'All' ? q.college === filters.college : true) &&
            (filters.examType !== 'All' ? q.examType === filters.examType : true) &&
            (filters.questionType !== 'All' ? q.questionType === filters.questionType : true)
        ).sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    }, [questions, filters]);

    const handleSelectQuestion = (question: Question) => { setSelectedQuestion(question); setView('repository'); setTips([]); setMnemonic(null); };
    
    const handleGenerateTips = useCallback(async () => {
        if (!selectedQuestion) return;
        setIsLoadingTips(true); setTips([]);
        const generatedTips = await generateExamTipsForQuestion(selectedQuestion.questionText, selectedQuestion.subject);
        setTips(generatedTips);
        setIsLoadingTips(false);
    }, [selectedQuestion]);

    const handleGenerateMnemonic = useCallback(async () => {
        if (!selectedQuestion || !selectedQuestion.modelAnswer) return;
        setIsLoadingMnemonic(true); setMnemonic(null);
        const result = await generateMnemonic(selectedQuestion.modelAnswer);
        setMnemonic(result);
        setIsLoadingMnemonic(false);
    }, [selectedQuestion]);
    
    const handleAddQuestion = (data: Omit<Question, 'id' | 'contributor' | 'error'>) => {
        const newQuestion: Question = { ...data, id: Date.now().toString(), contributor: 'You' };
        setQuestions(prev => [newQuestion, ...prev]);
        setIsContributeModalOpen(false);
    };

    const startTest = () => {
        const testQuestions = questions
            .filter(q => testConfig.subjects.length === 0 || testConfig.subjects.includes(q.subject))
            .sort(() => 0.5 - Math.random())
            .slice(0, testConfig.numQuestions);

        setActiveTest({
            questions: testQuestions,
            userAnswers: Array(testQuestions.length).fill(null),
            startTime: Date.now(),
            timeLimit: testConfig.timeLimit * 60,
        });
        setCurrentQuestionIndex(0);
        setView('test_taking');
    };

    const finishTest = useCallback(() => {
        if (!activeTest) return;
        let correctMcqCount = 0;
        let totalMcqCount = 0;
        activeTest.questions.forEach((q, i) => {
            if (q.questionType === 'MCQ') {
                totalMcqCount++;
                if (q.answer === activeTest.userAnswers[i]) {
                    correctMcqCount++;
                }
            }
        });

        setTestResults({
            score: correctMcqCount,
            total: activeTest.questions.length,
            mcqCorrect: correctMcqCount,
            mcqTotal: totalMcqCount,
            questions: activeTest.questions,
            userAnswers: activeTest.userAnswers,
            essayEvaluations: Array(activeTest.questions.length).fill(null)
        });
        setActiveTest(null);
        setView('test_results');
    }, [activeTest]);

    // Timer effect
    useEffect(() => {
        if (view === 'test_taking' && activeTest) {
            const timer = setInterval(() => {
                const elapsed = (Date.now() - activeTest.startTime) / 1000;
                if (elapsed >= activeTest.timeLimit) {
                    finishTest();
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [view, activeTest, finishTest]);

    const renderRepositoryView = () => (
        <div className="animate-fade-in">
            <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary-dark">{t('prephub.title')}</h2>
                    <p className="text-text-secondary-dark mt-1">{t('prephub.sub')}</p>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                    <button onClick={() => setIsContributeModalOpen(true)} className="bg-border-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold hover:bg-slate-700 flex items-center gap-2"><Plus size={20} />{t('prephub.contribute')}</button>
                    <button onClick={() => setView('test_config')} className="bg-brand-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-teal-500 flex items-center gap-2"><ClipboardEdit size={20} />{t('prephub.takeTest')}</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <FilterBar filters={filters} setFilters={setFilters} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredQuestions.map(q => <QuestionCard key={q.id} question={q} onSelect={() => handleSelectQuestion(q)} />)}
                    </div>
                    {filteredQuestions.length === 0 && <p className="text-center text-text-secondary-dark py-12">{t('prephub.noQuestions')}</p>}
                </div>

                <div className="lg:col-span-2 sticky top-24 h-fit">
                    {selectedQuestion ? (
                        <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark">
                            <div className="flex justify-between items-start"><h3 className="text-lg font-bold text-text-primary-dark mb-2 pr-4">{selectedQuestion.questionText}</h3><button onClick={() => setSelectedQuestion(null)}><X size={18}/></button></div>
                            <div className="max-h-60 overflow-y-auto pr-2 mb-4 text-sm text-text-secondary-dark whitespace-pre-wrap border-t border-b border-border-dark py-2">{selectedQuestion.modelAnswer}</div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-md font-semibold text-text-primary-dark mb-2 flex items-center gap-2"><Lightbulb size={18} className="text-brand-secondary"/> {t('prephub.tips.title')}</h4>
                                    {isLoadingTips ? <Spinner /> : tips.length > 0 ? (<ul className="space-y-2 list-disc list-inside text-text-secondary-dark text-sm">{tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>) : (<button onClick={handleGenerateTips} className="bg-brand-secondary text-background-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm"><Wand2 size={16} />{t('prephub.tips.generate')}</button>)}
                                </div>
                                <div>
                                    <h4 className="text-md font-semibold text-text-primary-dark mb-2 flex items-center gap-2"><Brain size={18} className="text-brand-secondary"/> {t('prephub.mnemonic.title')}</h4>
                                    {isLoadingMnemonic ? <Spinner /> : mnemonic ? (
                                        <div className="text-sm bg-background-dark p-3 rounded-md">
                                            <p className="font-bold text-brand-primary">{mnemonic.mnemonic}</p>
                                            <p className="text-text-secondary-dark mt-1">{mnemonic.explanation}</p>
                                            {mnemonic.error && <p className="text-red-400 mt-1">{mnemonic.error}</p>}
                                        </div>
                                    ) : (
                                        <button onClick={handleGenerateMnemonic} disabled={!selectedQuestion.modelAnswer} className="bg-brand-secondary text-background-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"><Wand2 size={16} />{t('prephub.mnemonic.create')}</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface-dark p-6 rounded-lg text-center border-2 border-dashed border-border-dark"><FileQuestion className="mx-auto h-12 w-12 text-text-secondary-dark mb-2" /><p className="text-text-secondary-dark">{t('prephub.selectQuestion')}</p></div>
                    )}
                </div>
            </div>
        </div>
    );
    
    const renderTestConfigView = () => (
        <div className="max-w-2xl mx-auto bg-surface-dark p-8 rounded-lg shadow-lg border border-border-dark animate-fade-in">
            <button onClick={() => setView('repository')} className="flex items-center gap-1 text-brand-primary hover:underline mb-4 font-semibold text-sm"><ChevronLeft size={18} /> {t('prephub.testConfig.back')}</button>
            <h2 className="text-2xl font-bold text-text-primary-dark mb-6">{t('prephub.testConfig.title')}</h2>
            <div className="space-y-6">
                <div><label className="block font-semibold mb-2">{t('prephub.testConfig.subjects')}</label><div className="max-h-40 overflow-y-auto bg-background-dark p-3 rounded-md border border-border-dark">{subjects.slice(1).map(s => (<label key={s} className="flex items-center gap-2 p-1"><input type="checkbox" checked={testConfig.subjects.includes(s)} onChange={() => { const newSubjects = testConfig.subjects.includes(s) ? testConfig.subjects.filter(sub => sub !== s) : [...testConfig.subjects, s]; setTestConfig(p => ({ ...p, subjects: newSubjects }));}} /> {s}</label>))}</div><p className="text-xs text-text-secondary-dark mt-1">{t('prephub.testConfig.subjects.all')}</p></div>
                <div><label className="block font-semibold mb-2">{t('prephub.testConfig.numQuestions')}</label><input type="number" value={testConfig.numQuestions} onChange={e=>setTestConfig(p=>({...p, numQuestions: parseInt(e.target.value, 10) || 1}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark" /></div>
                <div><label className="block font-semibold mb-2">{t('prephub.testConfig.timeLimit')}</label><input type="number" value={testConfig.timeLimit} onChange={e=>setTestConfig(p=>({...p, timeLimit: parseInt(e.target.value, 10) || 1}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark" /></div>
                <div><label className="block font-semibold mb-2">{t('prephub.testConfig.examPattern')}</label><select value={testConfig.examPattern} onChange={e=>setTestConfig(p=>({...p, examPattern: e.target.value}))} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"><option>General</option><option>NEET MDS</option></select></div>
                <button onClick={startTest} className="w-full bg-brand-primary py-3 rounded-lg text-white font-bold hover:bg-teal-500">{t('prephub.testConfig.start')}</button>
            </div>
        </div>
    );

    const renderTestTakingView = () => {
        if (!activeTest) return null;
        const elapsed = (Date.now() - activeTest.startTime) / 1000;
        const remaining = activeTest.timeLimit - elapsed;
        const mins = Math.floor(remaining / 60); const secs = Math.floor(remaining % 60);
        const currentQ = activeTest.questions[currentQuestionIndex];
        const userAnswer = activeTest.userAnswers[currentQuestionIndex];
        return (
            <div className="bg-background-dark fixed inset-0 z-40 p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-text-primary-dark">{t('prephub.testTaking.title')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="font-mono text-lg bg-surface-dark px-4 py-2 rounded-lg flex items-center gap-2"><Timer size={20}/> {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
                        <button onClick={finishTest} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">{t('prephub.testTaking.finish')}</button>
                    </div>
                </div>
                <div className="flex-grow flex gap-6 overflow-hidden">
                    <div className="w-3/4 flex flex-col bg-surface-dark p-6 rounded-lg">
                        <p className="text-sm text-text-secondary-dark mb-4">{t('prephub.testTaking.question', {current: currentQuestionIndex + 1, total: activeTest.questions.length})}</p>
                        <h3 className="text-xl font-semibold text-text-primary-dark mb-6">{currentQ.questionText}</h3>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {currentQ.questionType === 'MCQ' && currentQ.options ? (
                                <div className="space-y-3">{currentQ.options.map(opt => (<button key={opt} onClick={() => { const newAnswers = [...activeTest.userAnswers]; newAnswers[currentQuestionIndex] = opt; setActiveTest({...activeTest, userAnswers: newAnswers}); }} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${userAnswer === opt ? 'bg-brand-primary/20 border-brand-primary' : 'bg-background-dark border-border-dark hover:border-slate-700'}`}>{opt}</button>))}</div>
                            ) : (
                                <textarea value={userAnswer || ''} onChange={e => {const newAnswers = [...activeTest.userAnswers]; newAnswers[currentQuestionIndex] = e.target.value; setActiveTest({...activeTest, userAnswers: newAnswers});}} rows={10} className="w-full bg-background-dark border border-border-dark rounded-lg p-4 text-text-primary-dark"/>
                            )}
                        </div>
                    </div>
                    <div className="w-1/4 flex flex-col bg-surface-dark p-4 rounded-lg">
                        <h4 className="font-bold mb-4 text-center">{t('prephub.testTaking.palette')}</h4>
                        <div className="flex-grow overflow-y-auto grid grid-cols-5 gap-2 content-start">
                            {activeTest.questions.map((q, i) => (<button key={q.id} onClick={() => setCurrentQuestionIndex(i)} className={`w-10 h-10 rounded-md font-bold flex items-center justify-center transition-all ${currentQuestionIndex === i ? 'bg-brand-secondary text-black ring-2 ring-amber-300' : activeTest.userAnswers[i] !== null ? 'bg-green-500/30 text-green-200' : 'bg-border-dark hover:bg-slate-600'}`}>{i+1}</button>))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4 flex-shrink-0">
                    <button onClick={() => setCurrentQuestionIndex(p=>Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 bg-border-dark px-6 py-2 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50"><ChevronLeft size={20}/> {t('prephub.testTaking.previous')}</button>
                    <button onClick={() => setCurrentQuestionIndex(p=>Math.min(activeTest.questions.length - 1, p + 1))} disabled={currentQuestionIndex === activeTest.questions.length - 1} className="flex items-center gap-2 bg-border-dark px-6 py-2 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50">{t('prephub.testTaking.next')} <ChevronRight size={20}/></button>
                </div>
            </div>
        );
    };

    const renderTestResultsView = () => {
        const [evaluations, setEvaluations] = useState<(EvaluationResult | null)[]>(testResults?.essayEvaluations || []);
        const [isEvaluating, setIsEvaluating] = useState<boolean[]>(Array(testResults?.questions.length || 0).fill(false));
        if (!testResults) return null;

        const handleEvaluateEssay = async (qIndex: number) => {
            const question = testResults.questions[qIndex];
            const userAnswer = testResults.userAnswers[qIndex];
            if (!userAnswer) return;
            setIsEvaluating(p => { const newP = [...p]; newP[qIndex] = true; return newP; });
            const result = await evaluatePrepAnswer(question, userAnswer);
            setEvaluations(p => { const newP = [...p]; newP[qIndex] = result; return newP; });
            setIsEvaluating(p => { const newP = [...p]; newP[qIndex] = false; return newP; });
        };
        
        return (
            <div className="animate-fade-in max-w-4xl mx-auto">
                <div className="bg-surface-dark p-8 rounded-lg shadow-lg border border-border-dark text-center mb-6">
                    <h2 className="text-3xl font-bold text-text-primary-dark">{t('prephub.testResults.title')}</h2>
                    <p className="text-6xl font-extrabold text-brand-primary my-4">{testResults.mcqCorrect} / {testResults.mcqTotal}</p>
                    <p className="text-text-secondary-dark">{t('prephub.testResults.score', { correct: testResults.mcqCorrect, total: testResults.mcqTotal })}</p>
                     <button onClick={() => setView('repository')} className="mt-6 bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-500">{t('prephub.testResults.back')}</button>
                </div>
                <div className="space-y-4">
                    {testResults.questions.map((q, i) => (
                        <div key={q.id} className="bg-surface-dark p-4 rounded-lg border border-border-dark">
                            <p className="font-semibold text-text-primary-dark mb-2">{i+1}. {q.questionText}</p>
                            {q.questionType === 'MCQ' && q.options ? (
                                <div className="space-y-2 text-sm">
                                    {q.options.map(opt => {
                                        const isUserAnswer = testResults.userAnswers[i] === opt;
                                        const isCorrectAnswer = q.answer === opt;
                                        let classes = "w-full text-left p-3 rounded-md border ";
                                        if (isCorrectAnswer) classes += 'bg-green-500/20 border-green-500 text-green-300';
                                        else if (isUserAnswer) classes += 'bg-red-500/20 border-red-500 text-red-300';
                                        else classes += 'bg-background-dark border-border-dark';
                                        return <div key={opt} className={classes}>{opt} {isCorrectAnswer && <Check size={16} className="inline ml-2"/>} {isUserAnswer && !isCorrectAnswer && <X size={16} className="inline ml-2"/>}</div>
                                    })}
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-semibold text-text-primary-dark text-sm mt-4">{t('prephub.testResults.yourAnswer')}:</h4>
                                    <p className="text-text-secondary-dark text-sm whitespace-pre-wrap bg-background-dark p-3 rounded-md mt-1">{testResults.userAnswers[i] || t('prephub.testResults.noAnswer')}</p>
                                    <div className="mt-4">
                                        {evaluations[i] ? (
                                            <div className="bg-brand-primary/10 p-3 rounded-lg border border-brand-primary/20">
                                                <p className="font-bold text-brand-primary">{t('prephub.testResults.aiEval', { score: evaluations[i]?.score || 'N/A' })}</p>
                                                <p className="text-sm text-text-secondary-dark mt-1">{evaluations[i]?.feedback}</p>
                                                {evaluations[i]?.error && <p className="text-red-400 text-sm mt-1">{evaluations[i]?.error}</p>}
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEvaluateEssay(i)} disabled={isEvaluating[i] || !testResults.userAnswers[i]} className="bg-brand-secondary text-background-dark font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">{isEvaluating[i] ? <Spinner/> : <Wand2 size={16}/>} {t('prephub.testResults.evaluate')}</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    };
    
    const renderContent = () => {
        switch(view) {
            case 'repository': return renderRepositoryView();
            case 'test_config': return renderTestConfigView();
            case 'test_taking': return renderTestTakingView();
            case 'test_results': return renderTestResultsView();
            default: return renderRepositoryView();
        }
    }
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex border-b border-border-dark mb-6">
                <button onClick={() => { setMode('repository'); setView('repository'); }} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${mode === 'repository' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><BookText size={16}/> Question Repository</button>
                <button onClick={() => setMode('viva')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${mode === 'viva' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><Mic size={16}/> {t('prephub.viva.tab')}</button>
            </div>
            
            {mode === 'repository' ? renderContent() : <VivaSessionView onBack={() => setMode('repository')} />}

            <ContributeQuestionModal isOpen={isContributeModalOpen} onClose={() => setIsContributeModalOpen(false)} onSave={handleAddQuestion} />
        </div>
    );
};