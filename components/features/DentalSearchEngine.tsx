

import React, { useState, useEffect, useCallback } from 'react';
import { searchDentalLiterature } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { GroundingChunk, ParsedSearchResult, BookmarkedSearch } from '../../types';
import { Search, Sparkles, Copy, X, Bookmark, BookOpen, Trash2, Filter, Youtube } from 'lucide-react';

const STORAGE_KEY = 'dentalSearchBookmarks_v2';

const SourceLink: React.FC<{ source: GroundingChunk, index: number }> = ({ source, index }) => {
    const isYoutube = source.web?.uri?.includes('youtube.com');
    return (
        <a 
            href={source.web?.uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-background-dark p-3 rounded-lg hover:bg-border-dark transition-colors duration-200"
        >
            <div className="flex items-start gap-3">
                <span className="text-brand-primary font-bold mt-0.5">{index + 1}</span>
                <div className="flex-1">
                    <span className="text-text-secondary-dark hover:underline" title={source.web?.uri}>
                        {source.web?.title || source.web?.uri}
                    </span>
                </div>
                {isYoutube && <Youtube size={18} className="text-red-500 flex-shrink-0" />}
            </div>
        </a>
    );
};

const suggestedSearches = [
    "Latest advancements in resin composites",
    "Compare and contrast zirconia vs e-max crowns",
    "Management of medication-related osteonecrosis of the jaw (MRONJ)",
    "Techniques for vertical sinus floor elevation"
];

const dateRangeOptions = [
    { value: '', label: 'Any Time' },
    { value: 'past_day', label: 'Past Day' },
    { value: 'past_week', label: 'Past Week' },
    { value: 'past_month', label: 'Past Month' },
    { value: 'past_year', label: 'Past Year' },
    { value: 'past_5_years', label: 'Past 5 Years' },
];

const resourceTypeOptions = [
    { value: '', label: 'Any Resource' },
    { value: 'clinical_trial', label: 'Clinical Trials' },
    { value: 'review_article', label: 'Review Articles' },
    { value: 'case_report', label: 'Case Reports' },
    { value: 'systematic_review', label: 'Systematic Reviews' },
];

export const DentalSearchEngine: React.FC = () => {
    const [view, setView] = useState<'search' | 'bookmarks'>('search');
    const [query, setQuery] = useState<string>('');
    const [filters, setFilters] = useState({ dateRange: '', resourceType: '' });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<ParsedSearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [bookmarks, setBookmarks] = useState<BookmarkedSearch[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    
    useEffect(() => {
        try {
            const storedBookmarks = localStorage.getItem(STORAGE_KEY);
            if (storedBookmarks) {
                setBookmarks(JSON.parse(storedBookmarks));
            }
        } catch (e) {
            console.error("Failed to load bookmarks:", e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
        } catch (e) {
            console.error("Failed to save bookmarks:", e);
        }
    }, [bookmarks]);
    
    const parseResponseText = (text: string): { summary: string, detailedAnswer: string } => {
        const summaryMatch = text.match(/### Summary\n([\s\S]*?)\n### Detailed Answer/);
        const detailedAnswerMatch = text.match(/### Detailed Answer\n([\s\S]*)/);
        const summary = summaryMatch ? summaryMatch[1].trim() : "Summary not available.";
        let detailedAnswer = detailedAnswerMatch ? detailedAnswerMatch[1].trim() : "Detailed answer not available.";
        if (!summaryMatch && !detailedAnswerMatch) { detailedAnswer = text; }
        return { summary, detailedAnswer };
    }

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        setQuery(searchQuery);

        try {
            const response = await searchDentalLiterature(searchQuery, filters.dateRange, filters.resourceType);
            const { summary, detailedAnswer } = parseResponseText(response.text);
            setResult({ summary, detailedAnswer, sources: response.sources });
        } catch (e) {
            console.error(e);
            setError("An error occurred while searching. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [filters.dateRange, filters.resourceType]);

    const handleBookmark = () => {
        if (!result || !query) return;
        if (bookmarks.some(b => b.result.summary === result.summary)) {
             alert('This result is already bookmarked.');
             return;
        }
        const newBookmark: BookmarkedSearch = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            query,
            result,
            notes: '',
        };
        setBookmarks(prev => [newBookmark, ...prev]);
        setView('bookmarks');
    };

    const handleDeleteBookmark = (id: string) => {
        if (window.confirm('Are you sure you want to delete this bookmark?')) {
            setBookmarks(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleUpdateNotes = (id: string, notes: string) => {
        setBookmarks(prev => prev.map(b => b.id === id ? { ...b, notes } : b));
    };

    const renderInitialState = () => (
        <div className="text-center p-8 animate-fade-in mt-6">
            <Sparkles className="mx-auto h-16 w-16 text-brand-secondary mb-4" />
            <h2 className="text-2xl font-bold text-text-primary-dark">Dental Literature Search</h2>
            <p className="text-text-secondary-dark mt-2 mb-6">Ask a clinical question or search for a topic to get AI-powered, source-backed answers.</p>
            <div className="max-w-2xl mx-auto">
                <h3 className="font-semibold text-text-primary-dark mb-3">Suggested Searches</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedSearches.map(s => (
                        <button key={s} onClick={() => { setQuery(s); handleSearch(s); }} className="text-left bg-surface-dark p-3 rounded-lg hover:bg-border-dark transition-colors duration-200 text-sm text-text-secondary-dark">
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderSearchView = () => (
        <>
            <div className="bg-surface-dark p-2 rounded-lg border border-border-dark shadow-sm focus-within:ring-2 focus-within:ring-brand-primary relative">
                <div className="flex items-center">
                    <Search className="text-text-secondary-dark mx-3" size={20} />
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch(query)} placeholder="Search dental literature, topics, and clinical questions..." className="flex-1 bg-transparent p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none" disabled={isLoading} />
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-brand-primary/20 text-brand-primary' : 'text-text-secondary-dark hover:text-brand-primary'}`}><Filter size={20}/></button>
                    <button onClick={() => handleSearch(query)} disabled={isLoading || query.trim() === ''} className="bg-brand-primary text-white rounded-md w-24 h-10 flex items-center justify-center disabled:bg-teal-800 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors font-semibold ml-2">{isLoading ? <Spinner /> : "Search"}</button>
                </div>
                {showFilters && <div className="p-3 mt-2 border-t border-border-dark grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={filters.dateRange} onChange={e => setFilters({...filters, dateRange: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-primary">{dateRangeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                    <select value={filters.resourceType} onChange={e => setFilters({...filters, resourceType: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-primary">{resourceTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
                </div>}
            </div>
            
            <div className="mt-6">
                {isLoading && <div className="flex justify-center p-8"><Spinner /></div>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {!isLoading && !error && !result && renderInitialState()}
                {result && (
                    <div className="bg-surface-dark rounded-lg shadow-md border border-border-dark p-6 animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary-dark">Search Results for:</h2>
                                <p className="text-text-secondary-dark italic">"{query}"</p>
                            </div>
                            <button onClick={handleBookmark} className="flex items-center gap-2 text-sm bg-border-dark px-3 py-1.5 rounded-md text-text-secondary-dark hover:bg-slate-600 hover:text-white transition-colors"><Bookmark size={14}/>Bookmark</button>
                        </div>
                        <div className="mb-6"><h3 className="text-lg font-semibold text-brand-primary mb-2">Summary</h3><p className="text-text-secondary-dark whitespace-pre-wrap">{result.summary}</p></div>
                        <div className="mb-6"><h3 className="text-lg font-semibold text-brand-primary mb-2">Detailed Answer</h3><div className="prose prose-invert max-w-none text-text-secondary-dark whitespace-pre-wrap">{result.detailedAnswer}</div></div>
                        {result.sources && result.sources.length > 0 && (<div className="mt-6 pt-4 border-t border-border-dark"><h3 className="text-lg font-semibold text-brand-primary mb-3">Sources from Google Search</h3><div className="space-y-2">{result.sources.filter(s => s.web?.uri).map((source, index) => (<SourceLink key={index} source={source} index={index} />))}</div></div>)}
                    </div>
                )}
            </div>
        </>
    );

    const renderBookmarksView = () => (
        <div className="space-y-4 animate-fade-in">
            {bookmarks.length === 0 ? <p className="text-center text-text-secondary-dark py-12">You have no bookmarked searches.</p>
            : bookmarks.map(bookmark => (
                <div key={bookmark.id} className="bg-surface-dark p-4 rounded-lg border border-border-dark">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-text-primary-dark">{bookmark.query}</p>
                            <p className="text-xs text-text-secondary-dark">Bookmarked on {new Date(bookmark.timestamp).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleDeleteBookmark(bookmark.id)} className="text-text-secondary-dark hover:text-red-500 p-1"><Trash2 size={16}/></button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border-dark">
                        <h4 className="font-semibold text-brand-secondary text-sm mb-2">Notes</h4>
                        <textarea value={bookmark.notes} onChange={e => handleUpdateNotes(bookmark.id, e.target.value)} placeholder="Add your notes here..." rows={3} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-sm text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"/>
                    </div>
                    <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-brand-primary hover:underline">View Saved Result</summary>
                        <div className="mt-3 p-4 bg-background-dark rounded-lg space-y-4">
                            <div><h4 className="font-semibold text-brand-primary mb-1">Summary</h4><p className="text-text-secondary-dark whitespace-pre-wrap text-xs">{bookmark.result.summary}</p></div>
                            <div><h4 className="font-semibold text-brand-primary mb-1">Detailed Answer</h4><p className="text-text-secondary-dark whitespace-pre-wrap text-xs">{bookmark.result.detailedAnswer}</p></div>
                        </div>
                    </details>
                </div>
            ))}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex border-b border-border-dark mb-6">
                <button onClick={() => setView('search')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${view === 'search' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><Search size={16}/> Search</button>
                <button onClick={() => setView('bookmarks')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${view === 'bookmarks' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><BookOpen size={16}/> Bookmarks ({bookmarks.length})</button>
            </div>
            {view === 'search' ? renderSearchView() : renderBookmarksView()}
        </div>
    );
};
