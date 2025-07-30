import React, { useState, useCallback, useEffect } from 'react';
import { fetchAndSummarizeDentalNews, getAiDeepDive } from '../../services/geminiService';
import { Skeleton } from '../common/Skeleton';
import { NewsArticle, NewsAnalysis } from '../../types';
import { AlertTriangle, ChevronsRight, Sparkles, X, FileText, Lightbulb, Link as LinkIcon, CheckSquare, Newspaper } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const NewsCardSkeleton: React.FC = () => (
    <div className="bg-surface-dark p-5 rounded-lg shadow-md border border-border-dark flex flex-col">
        <Skeleton className="h-5 w-1/3 rounded-full mb-4" />
        <Skeleton className="h-6 w-full rounded-md mb-2" />
        <Skeleton className="h-6 w-3/4 rounded-md mb-4" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md mt-2" />
        <Skeleton className="h-4 w-1/2 rounded-md mt-2" />
        <div className="mt-4 pt-4 border-t border-border-dark flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
        </div>
    </div>
);

const NewsCard: React.FC<{ article: NewsArticle, onDeepDive: (article: NewsArticle) => void }> = ({ article, onDeepDive }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-md flex flex-col animate-fade-in aurora-border-glow">
            <span className="text-xs font-bold uppercase bg-brand-secondary text-background-dark px-2 py-1 rounded-full self-start">{article.category}</span>
            <h3 className="text-xl font-bold mt-2 text-text-primary-dark flex-grow">{article.title}</h3>
            <p className="text-text-secondary-dark mt-2 text-sm flex-grow">{article.summary}</p>
            <div className="mt-4 pt-4 border-t border-border-dark flex items-center justify-between flex-wrap gap-2">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-teal-400 font-semibold text-sm inline-flex items-center">
                    {t('dentafeed.readMore')} <ChevronsRight className="w-4 h-4 ml-1" />
                </a>
                <button onClick={() => onDeepDive(article)} className="text-brand-primary hover:text-teal-400 font-semibold text-sm inline-flex items-center">
                    {t('dentafeed.deepDive')} <Sparkles className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    );
};

const CategoryFilters: React.FC<{ categories: string[]; activeCategory: string; setActiveCategory: (category: string) => void }> = ({ categories, activeCategory, setActiveCategory }) => {
    const { t } = useTranslation();
    const translatedCategories = categories.map(c => c === 'All' ? t('dentafeed.all') : c);

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category, index) => (
                <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeCategory === category ? 'bg-brand-primary text-white' : 'bg-surface-dark text-text-secondary-dark hover:bg-border-dark hover:text-text-primary-dark'}`}
                >
                    {translatedCategories[index]}
                </button>
            ))}
        </div>
    );
};

const DeepDiveView: React.FC<{ article: NewsArticle | null, analysis: NewsAnalysis | null, isLoading: boolean, onClose: () => void, error: string | null }> = ({ article, analysis, isLoading, onClose, error }) => {
    const { t } = useTranslation();
    
    if (!article) {
        return (
            <div className="sticky top-24 bg-surface-dark p-8 rounded-lg shadow-lg border border-border-dark text-center h-full flex flex-col justify-center">
                <Sparkles className="w-16 h-16 text-brand-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary-dark">{t('dentafeed.analysis.title')}</h3>
                <p className="text-text-secondary-dark mt-2">{t('dentafeed.analysis.prompt')}</p>
            </div>
        );
    }

    return (
        <div className="sticky top-24 bg-surface-dark rounded-lg shadow-lg border border-border-dark animate-fade-in">
            <div className="p-4 border-b border-border-dark">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-primary-dark pr-4">{article.title}</h3>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white flex-shrink-0"><X size={20} /></button>
                </div>
            </div>
            <div className="p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                {isLoading && (
                    <div className="space-y-4 p-2">
                        <Skeleton className="h-5 w-1/3 rounded-full" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <Skeleton className="h-5 w-1/2 rounded-full mt-4" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-4/5 rounded" />
                    </div>
                )}
                {error && (
                    <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4">
                        <AlertTriangle />
                        <div>
                            <h3 className="font-bold">{t('dentafeed.analysis.failed')}</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                )}
                {analysis && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="flex items-center text-md font-semibold text-brand-primary mb-2"><CheckSquare size={18} className="mr-2"/>{t('dentafeed.analysis.keyTakeaways')}</h4>
                            <ul className="space-y-2 text-sm text-text-secondary-dark list-disc list-inside">
                                {analysis.keyTakeaways.map((item, i) => <li key={`takeaway-${i}`}>{item}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="flex items-center text-md font-semibold text-brand-primary mb-2"><Lightbulb size={18} className="mr-2"/>{t('dentafeed.analysis.simplifiedExplanation')}</h4>
                            <p className="text-sm text-text-secondary-dark">{analysis.simplifiedExplanation}</p>
                        </div>
                        <div>
                            <h4 className="flex items-center text-md font-semibold text-brand-primary mb-2"><FileText size={18} className="mr-2"/>{t('dentafeed.analysis.furtherReading')}</h4>
                            <ul className="space-y-2">
                                {analysis.furtherReading.map((item, i) => (
                                    <li key={`reading-${i}`}>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary-dark hover:text-brand-primary flex items-center gap-2">
                                            <LinkIcon size={14} />{item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Dentafeed: React.FC = () => {
    const { t } = useTranslation();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    
    // Deep Dive State
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const categories = ['All', ...new Set(articles.map(a => a.category))];
    const filteredArticles = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory);

    useEffect(() => {
        const getNews = async () => {
            setIsLoading(true);
            try {
                const newsArticles = await fetchAndSummarizeDentalNews();
                setArticles(newsArticles);
            } catch (err: any) {
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        getNews();
    }, []);

    const handleDeepDive = useCallback(async (article: NewsArticle) => {
        setSelectedArticle(article);
        setIsAnalyzing(true);
        setAnalysis(null);
        setAnalysisError(null);
        try {
            const result = await getAiDeepDive(article);
            if (result.error) {
                throw new Error(result.error);
            }
            setAnalysis(result);
        } catch (err: any) {
            setAnalysisError(err.message || 'Failed to perform deep dive.');
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
            );
        }
        if (error) {
            return (
                 <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4">
                    <AlertTriangle />
                    <div><h3 className="font-bold">{t('dentafeed.error.title')}</h3><p>{error}</p></div>
                </div>
            );
        }
         if (filteredArticles.length === 0) {
            return articles.length > 0 ? (
                <div className="text-center p-10 bg-surface-dark/50 rounded-lg">
                    <h3 className="text-2xl font-bold">{t('dentafeed.noArticlesInCategory', { category: activeCategory })}</h3>
                    <p className="mt-2 text-text-secondary-dark">{t('dentafeed.selectAnotherCategory')}</p>
                </div>
            ) : (
                <div className="text-center p-10 bg-surface-dark/50 rounded-lg">
                    <h3 className="text-2xl font-bold">{t('dentafeed.noNewsFound')}</h3>
                    <p className="mt-2 text-text-secondary-dark">{t('dentafeed.noNewsMessage')}</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article, i) => <NewsCard key={`${article.url}-${i}`} article={article} onDeepDive={handleDeepDive} />)}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary-dark">{t('dentafeed.latestNews')}</h2>
                        <p className="text-text-secondary-dark">AI-curated news for the dental professional.</p>
                    </div>
                </div>
                {!isLoading && !error && <CategoryFilters categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />}
                {renderContent()}
            </div>
            <div className="lg:col-span-1">
                <DeepDiveView article={selectedArticle} analysis={analysis} isLoading={isAnalyzing} onClose={() => setSelectedArticle(null)} error={analysisError} />
            </div>
        </div>
    );
};