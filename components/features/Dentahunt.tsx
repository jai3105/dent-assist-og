import React, { useState, useCallback, useEffect } from 'react';
import { Job, ResumeAnalysis, InterviewCoachSession, TripItinerary } from '../../types';
import { findDentalJobs, analyzeResume, generateImprovedResume, startInterviewSession, planTripForInterview } from '../../services/geminiService';
import { Skeleton } from '../common/Skeleton';
import { Spinner } from '../common/Spinner';
import { Briefcase, MapPin, Search, AlertTriangle, Bot, Lightbulb, ThumbsUp, ThumbsDown, Wand2, X, Mic, Bookmark, Plane, Hotel, Landmark } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const SAVED_JOBS_KEY = 'dentaHuntSavedJobs_v1';

const JobCardSkeleton: React.FC = () => (
    <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark flex flex-col h-full">
        <div className="flex justify-between items-start">
            <div>
                <Skeleton className="h-5 w-24 rounded-full mb-3" />
                <Skeleton className="h-7 w-48 rounded-md mb-2" />
                <Skeleton className="h-5 w-32 rounded-md mb-2" />
                <Skeleton className="h-5 w-28 rounded-md" />
            </div>
            <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="h-4 w-full rounded-md mt-4" />
        <Skeleton className="h-4 w-full rounded-md mt-2" />
        <Skeleton className="h-4 w-2/3 rounded-md mt-2" />
        <div className="mt-6 pt-4 border-t border-border-dark flex justify-between items-center">
            <Skeleton className="h-10 w-36 rounded-md" />
        </div>
    </div>
);

const JobCard: React.FC<{ job: Job, onToggleSave: (job: Job) => void, isSaved: boolean, onPlanTrip: (job: Job) => void }> = ({ job, onToggleSave, isSaved, onPlanTrip }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-md border border-border-dark hover:border-brand-primary hover:shadow-glow transition-all duration-300 flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-brand-secondary text-background-dark`}>{job.type}</span>
                    <h3 className="text-xl font-bold mt-2 text-text-primary-dark">{job.title}</h3>
                    <p className="text-text-primary-dark font-semibold">{job.company}</p>
                    <p className="text-sm text-text-secondary-dark flex items-center gap-2 mt-1"><MapPin size={14} />{job.location}</p>
                </div>
                 <button onClick={() => onToggleSave(job)} className="text-text-secondary-dark hover:text-brand-primary p-2 flex-shrink-0" title={isSaved ? t('dentahunt.unsaveJob') : t('dentahunt.saveJob')}>
                    <Bookmark size={20} className={`transition-colors ${isSaved ? 'text-brand-primary fill-current' : ''}`} />
                </button>
            </div>
            <p className="text-text-secondary-dark mt-4 text-sm flex-grow">{job.description}</p>
            <div className="mt-6 pt-4 border-t border-border-dark flex justify-between items-center">
                 <div className="flex gap-2">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="bg-brand-primary px-4 py-2 rounded-md text-white font-semibold hover:bg-teal-500 transition-colors text-sm">{t('dentahunt.applyNow')}</a>
                    <button onClick={() => onPlanTrip(job)} className="bg-surface-light px-4 py-2 rounded-md text-text-primary-dark font-semibold hover:bg-border-dark transition-colors flex items-center gap-2 text-sm"><Plane size={16}/> {t('dentahunt.planTrip')}</button>
                </div>
            </div>
        </div>
    );
};

const InterviewCoachModal: React.FC<{ isOpen: boolean, onClose: () => void, jobDesc: string }> = ({ isOpen, onClose, jobDesc }) => {
    const { t } = useTranslation();
    const [session, setSession] = useState<InterviewCoachSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    React.useEffect(() => {
        if (isOpen && jobDesc && !session) {
            const init = async () => {
                setIsLoading(true);
                const newSession = await startInterviewSession(jobDesc);
                setSession(newSession);
                setMessages([{ role: 'model', text: newSession.initialQuestion }]);
                setIsLoading(false);
            };
            init();
        } else if (!isOpen) {
            setSession(null);
            setMessages([]);
        }
    }, [isOpen, jobDesc, session]);
    
    const handleSend = async () => {
        if (!userInput.trim() || !session || isLoading) return;
        const newMessages = [...messages, { role: 'user' as const, text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
        const response = await session.chat.sendMessage(userInput);
        setMessages([...newMessages, { role: 'model', text: response.text }]);
        setIsLoading(false);
    };

    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-surface-dark rounded-lg shadow-2xl w-full max-w-2xl border border-border-dark flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-border-dark">
            <h2 className="text-xl font-bold text-text-primary-dark flex items-center gap-3"><Mic className="text-brand-primary"/> {t('dentahunt.aiCoach.title')}</h2>
            <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 my-4 ${msg.role === 'model' ? 'justify-start' : 'justify-end'}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0"><Bot className="text-brand-primary"/></div>}
                    <div className={`px-4 py-2 rounded-lg max-w-md shadow-md ${msg.role === 'model' ? 'bg-surface-light text-text-secondary-dark' : 'bg-brand-primary text-white'}`}>{msg.text}</div>
                </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-lg bg-surface-light"><Spinner/></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-border-dark flex items-center gap-2">
            <input value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend} placeholder={t('dentahunt.aiCoach.inputPlaceholder')} className="flex-1 bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"/>
            <button onClick={handleSend} disabled={isLoading || !userInput} className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold disabled:opacity-50">{t('dentahunt.aiCoach.send')}</button>
          </div>
        </div>
      </div>
    );
};

const AiHelperModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [resume, setResume] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isGeneratingResume, setIsGeneratingResume] = useState(false);
    const [generatedResume, setGeneratedResume] = useState('');
    const [generationError, setGenerationError] = useState('');
    const [isCoachOpen, setIsCoachOpen] = useState(false);

    const handleAnalyze = async () => {
        if (!resume || !jobDesc) {
            setError(t('dentahunt.aiHelper.error.pasteBoth'));
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis(null);
        setGeneratedResume('');
        setGenerationError('');
        try {
            const result = await analyzeResume(resume, jobDesc);
            if (result.error) {
                setError(result.error);
            } else {
                setAnalysis(result);
            }
        } catch (e: any) {
            setError(e.message || t('dentahunt.aiHelper.error.unknown'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateResume = async () => {
        if (!analysis) return;
        setIsGeneratingResume(true);
        setGenerationError('');
        setGeneratedResume('');
        try {
            const result = await generateImprovedResume(resume, jobDesc, analysis);
            setGeneratedResume(result);
        } catch (e: any) {
            setGenerationError(e.message || t('dentahunt.aiHelper.error.generateFailed'));
        } finally {
            setIsGeneratingResume(false);
        }
    };
    
    if (!isOpen) return null;

    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
          <div className="bg-surface-dark rounded-lg shadow-2xl w-full max-w-4xl border border-border-dark flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-border-dark">
              <h2 className="text-2xl font-bold text-text-primary-dark flex items-center gap-3"><Wand2 className="text-brand-primary"/> {t('dentahunt.aiHelper.title')}</h2>
              <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-text-primary-dark">{t('dentahunt.aiHelper.yourResume')}</label>
                  <textarea value={resume} onChange={e => setResume(e.target.value)} placeholder={t('dentahunt.aiHelper.resumePlaceholder')} rows={10} className="mt-2 w-full bg-background-dark border border-border-dark rounded-md p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                </div>
                 <div>
                  <label className="font-semibold text-text-primary-dark">{t('dentahunt.aiHelper.jobDescription')}</label>
                  <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder={t('dentahunt.aiHelper.jobDescPlaceholder')} rows={10} className="mt-2 w-full bg-background-dark border border-border-dark rounded-md p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                </div>
              </div>
              <div className="bg-background-dark p-4 rounded-lg">
                <h3 className="font-bold text-lg text-brand-secondary mb-3">{t('dentahunt.aiHelper.analysis')}</h3>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full"><Spinner/></div>
                ) : error ? (
                  <div className="text-red-400">{error}</div>
                ) : analysis ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-green-400"><ThumbsUp size={16}/> {t('dentahunt.aiHelper.strengths')}</h4>
                      <ul className="list-disc list-inside text-text-secondary-dark pl-2 mt-1 space-y-1">{analysis.strengths.map((s,i) => <li key={`s-${i}`}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-red-400"><ThumbsDown size={16}/> {t('dentahunt.aiHelper.weaknesses')}</h4>
                      <ul className="list-disc list-inside text-text-secondary-dark pl-2 mt-1 space-y-1">{analysis.weaknesses.map((w,i) => <li key={`w-${i}`}>{w}</li>)}</ul>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-yellow-400"><Lightbulb size={16}/> {t('dentahunt.aiHelper.suggestions')}</h4>
                      <ul className="list-disc list-inside text-text-secondary-dark pl-2 mt-1 space-y-1">{analysis.suggestions.map((s,i) => <li key={`sug-${i}`}>{s}</li>)}</ul>
                    </div>
  
                    <div className="mt-6 pt-4 border-t border-border-dark space-y-3">
                      <button
                          onClick={handleGenerateResume}
                          disabled={isGeneratingResume}
                          className="w-full bg-brand-secondary text-background-dark font-bold py-2.5 rounded-md hover:bg-amber-400 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                          {isGeneratingResume ? <Spinner /> : <><Wand2 size={18}/> {t('dentahunt.aiHelper.generateResume')}</>}
                      </button>
                       <button onClick={() => setIsCoachOpen(true)} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-md hover:bg-blue-500 flex items-center justify-center gap-2">
                        <Mic size={18}/> {t('dentahunt.aiHelper.practiceInterview')}
                       </button>
                      
                      {(isGeneratingResume || generatedResume || generationError) && (
                          <div className="mt-4">
                              <h4 className="font-semibold text-sm text-text-primary-dark mb-2">{t('dentahunt.aiHelper.generatedResumeLabel')}:</h4>
                              {isGeneratingResume && <div className="flex justify-center p-4"><Spinner/></div>}
                              {generationError && <p className="text-red-400 bg-red-500/10 p-2 rounded-md">{generationError}</p>}
                              {generatedResume && (
                                  <textarea
                                      value={generatedResume}
                                      readOnly
                                      rows={15}
                                      className="w-full bg-surface-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark"
                                  />
                              )}
                          </div>
                      )}
                    </div>
  
                  </div>
                ) : (
                  <div className="text-center text-text-secondary-dark pt-12">
                    <p>{t('dentahunt.aiHelper.initialPrompt')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border-dark">
              <button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 flex items-center justify-center gap-2">
                {isLoading ? <><Spinner/> {t('dentahunt.aiHelper.analyzing')}</> : <><Wand2 size={18}/> {t('dentahunt.aiHelper.analyze')}</>}
              </button>
            </div>
          </div>
        </div>
        {isCoachOpen && <InterviewCoachModal isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} jobDesc={jobDesc} />}
      </>
    );
}

const TripPlannerModal: React.FC<{ isOpen: boolean, onClose: () => void, job: Job | null }> = ({ isOpen, onClose, job }) => {
    const { t } = useTranslation();
    const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && job) {
            const fetchItinerary = async () => {
                setIsLoading(true);
                setItinerary(null);
                const result = await planTripForInterview(job.location);
                setItinerary(result);
                setIsLoading(false);
            };
            fetchItinerary();
        }
    }, [isOpen, job]);
    
    if (!isOpen) return null;

    const ICONS: { [key: string]: React.ReactNode } = {
        'Flights': <Plane size={20} />,
        'Hotels': <Hotel size={20} />,
        'Attractions': <Landmark size={20} />,
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface-dark rounded-lg shadow-2xl w-full max-w-2xl border border-border-dark" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark flex items-center gap-3"><Plane className="text-brand-primary"/> {t('dentahunt.tripPlanner.title')}</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading && <div className="text-center p-12"><Spinner /></div>}
                    {itinerary?.error && <p className="text-red-400">{itinerary.error}</p>}
                    {itinerary && !itinerary.error && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-center">{t('dentahunt.tripPlanner.suggestionsFor')} {itinerary.destination}</h3>
                            {itinerary.suggestions.map((s, i) => (
                                <div key={i} className="bg-background-dark p-4 rounded-md">
                                    <h4 className="font-bold text-brand-secondary flex items-center gap-2 mb-2">{ICONS[s.category]} {t(`dentahunt.tripPlanner.category.${s.category.toLowerCase()}`)}</h4>
                                    <p className="text-sm text-text-secondary-dark whitespace-pre-wrap">{s.details}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const DentaHunt: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ role: 'Dentist', location: 'Mumbai, India', type: 'Full-time' });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_JOBS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHelperOpen, setHelperOpen] = useState(false);
  const [view, setView] = useState<'search' | 'saved'>('search');
  
  const [isTripModalOpen, setTripModalOpen] = useState(false);
  const [selectedJobForTrip, setSelectedJobForTrip] = useState<Job | null>(null);
  
  useEffect(() => {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedJobs));
  }, [savedJobs]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setJobs([]);
    setView('search');
    try {
      const results = await findDentalJobs(filters.role, filters.location, filters.type);
      setJobs(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('dentahunt.error.fetch'));
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  }, [filters, t]);
  
  const handleToggleSaveJob = (jobToSave: Job) => {
    setSavedJobs(prev => {
        const isSaved = prev.some(job => job.url === jobToSave.url);
        if(isSaved) {
            return prev.filter(job => job.url !== jobToSave.url);
        } else {
            return [...prev, jobToSave];
        }
    });
  };
  
  const handlePlanTrip = (job: Job) => {
    setSelectedJobForTrip(job);
    setTripModalOpen(true);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-10">
          <Spinner />
          <p className="mt-4 text-text-secondary-dark font-semibold animate-pulse">{t('dentahunt.searching')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4">
            <AlertTriangle />
            <div>
                <h3 className="font-bold">{t('dentahunt.error.title')}</h3>
                <p>{error}</p>
            </div>
        </div>
      );
    }
    
    if (view === 'saved') {
       return (
        <div className="animate-fade-in">
           <h2 className="text-2xl font-bold text-text-primary-dark mb-4">{t('dentahunt.savedJobsTitle')} ({savedJobs.length})</h2>
           {savedJobs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {savedJobs.map((job) => <JobCard key={job.url} job={job} onToggleSave={handleToggleSaveJob} isSaved={true} onPlanTrip={handlePlanTrip} />)}
                </div>
           ) : (
                <div className="text-center p-10 bg-surface-dark/50 rounded-lg border-2 border-dashed border-border-dark">
                    <Bookmark className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                    <h3 className="text-2xl font-bold text-text-primary-dark">{t('dentahunt.noSavedJobs.title')}</h3>
                    <p className="mt-2 text-text-secondary-dark">{t('dentahunt.noSavedJobs.subtitle')}</p>
                </div>
           )}
        </div>
      );
    }
    
    if (view === 'search') {
        if (!hasSearched) {
          return (
             <div className="text-center p-10 bg-surface-dark/50 rounded-lg border-2 border-dashed border-border-dark">
                <Bot className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-2xl font-bold text-text-primary-dark">{t('dentahunt.initial.title')}</h3>
                <p className="mt-2 text-text-secondary-dark">{t('dentahunt.initial.subtitle')}</p>
            </div>
          )
        }
    
        if (jobs.length > 0) {
          const savedJobUrls = new Set(savedJobs.map(j => j.url));
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job, index) => <JobCard key={job.url || index} job={job} onToggleSave={handleToggleSaveJob} isSaved={savedJobUrls.has(job.url)} onPlanTrip={handlePlanTrip} />)}
            </div>
          );
        }
    
        if (hasSearched && jobs.length === 0) {
           return (
            <div className="text-center p-10 bg-surface-dark/50 rounded-lg border-2 border-dashed border-border-dark">
                <Search className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-2xl font-bold text-text-primary-dark">{t('dentahunt.noJobsFound.title')}</h3>
                <p className="mt-2 text-text-secondary-dark">{t('dentahunt.noJobsFound.subtitle')}</p>
            </div>
          )
        }
    }
    
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <input name="role" value={filters.role} onChange={handleFilterChange} type="text" placeholder={t('dentahunt.filter.rolePlaceholder')} className="w-full md:w-1/3 bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                <input name="location" value={filters.location} onChange={handleFilterChange} type="text" placeholder={t('dentahunt.filter.locationPlaceholder')} className="w-full md:w-1/3 bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full md:w-1/6 bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <option>{t('dentahunt.jobType.fullTime')}</option>
                    <option>{t('dentahunt.jobType.partTime')}</option>
                    <option>{t('dentahunt.jobType.contract')}</option>
                    <option>{t('dentahunt.jobType.internship')}</option>
                    <option>{t('dentahunt.jobType.temporary')}</option>
                </select>
                <button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto bg-brand-primary px-6 py-3 rounded-lg text-white font-semibold hover:bg-teal-500 transition-colors disabled:bg-teal-800 disabled:cursor-not-allowed flex items-center justify-center">
                  {isLoading ? <Spinner /> : <div className="flex items-center gap-2"><Search className="w-5 h-5" /><span>{t('dentahunt.findJobs')}</span></div>}
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex justify-between items-center">
                 <div className="flex items-center p-1 bg-background-dark rounded-lg border border-border-dark">
                    <button onClick={() => setView('search')} className={`px-4 py-1 text-sm rounded-md transition-colors ${view === 'search' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}>{t('dentahunt.searchResults')}</button>
                    <button onClick={() => setView('saved')} className={`px-4 py-1 text-sm rounded-md transition-colors ${view === 'saved' ? 'bg-border-dark text-text-primary-dark shadow' : 'text-text-secondary-dark'}`}>{t('dentahunt.savedJobs')} ({savedJobs.length})</button>
                </div>
                 <button onClick={() => setHelperOpen(true)} className="text-brand-secondary font-semibold hover:text-amber-400 flex items-center gap-2 justify-center">
                    <Wand2 size={18}/> {t('dentahunt.aiHelper.button')}
                 </button>
            </div>
        </div>
        {renderContent()}
        <AiHelperModal isOpen={isHelperOpen} onClose={() => setHelperOpen(false)} />
        <TripPlannerModal isOpen={isTripModalOpen} onClose={() => setTripModalOpen(false)} job={selectedJobForTrip} />
    </div>
  );
};