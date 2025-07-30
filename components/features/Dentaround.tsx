import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Event } from '../../types';
import { findDentalEvents } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Search, Calendar, MapPin, AlertTriangle, Bookmark, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';

const STORAGE_KEY = 'dentaround_calendar_events';
const eventTypes = ['All', 'Conference', 'Workshop', 'CDE Program', 'Webinar'];

const EventCard: React.FC<{ event: Event; onToggleCalendar: (event: Event) => void; isSaved: boolean; }> = ({ event, onToggleCalendar, isSaved }) => (
    <div className="bg-surface-dark rounded-lg shadow-md border border-border-dark overflow-hidden flex flex-col aurora-border-glow animate-fade-in">
        <div className="p-6 flex-grow">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase text-brand-primary bg-brand-primary/20 px-2 py-1 rounded-full">{event.type}</span>
                <button onClick={() => onToggleCalendar(event)} title={isSaved ? "Remove from calendar" : "Add to calendar"}>
                    <Bookmark size={20} className={`transition-colors ${isSaved ? 'text-brand-primary fill-current' : 'text-text-secondary-dark hover:text-brand-primary'}`} />
                </button>
            </div>
            <h3 className="text-xl font-bold mt-2 text-text-primary-dark">
                <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{event.title}</a>
            </h3>
            <div className="text-text-secondary-dark mt-2 text-sm space-y-1">
                <p><Calendar size={14} className="inline-block mr-2 w-4" />{event.date}</p>
                <p><MapPin size={14} className="inline-block mr-2 w-4" />{event.location}</p>
            </div>
            <p className="text-text-secondary-dark mt-4 text-sm flex-grow">{event.description}</p>
        </div>
        <div className="bg-background-dark p-4 flex justify-end items-center border-t border-border-dark">
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">
                View Details & Register
            </a>
        </div>
    </div>
);

const parseEventDate = (dateStr: string): Date | null => {
    try {
      // Handle simple dates and the start of a range, e.g., "October 15-17, 2024" -> "October 15, 2024"
      const parsableDateStr = dateStr.split('-')[0].trim().replace(/,$/, '');
      const d = new Date(parsableDateStr);
      if (!isNaN(d.getTime())) {
        return d;
      }
      return null;
    } catch {
      return null;
    }
};

export const Dentaround: React.FC = () => {
    const [view, setView] = useState<'search' | 'calendar'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [eventType, setEventType] = useState('All');
    const [searchResults, setSearchResults] = useState<Event[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New state for calendar view
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        try {
            const savedEvents = localStorage.getItem(STORAGE_KEY);
            if (savedEvents) setCalendarEvents(JSON.parse(savedEvents));
        } catch (e) { console.error("Failed to load saved events:", e); }
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calendarEvents)); } 
        catch (e) { console.error("Failed to save events:", e); }
    }, [calendarEvents]);
    
    const calendarEventIds = useMemo(() => new Set(calendarEvents.map(e => e.id)), [calendarEvents]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true); setError(null); setSearchResults([]);
        try {
            const results = await findDentalEvents(searchQuery, eventType === 'All' ? '' : eventType);
            setSearchResults(results);
        } catch (err: any) { setError(err.message || 'An error occurred while finding events.');
        } finally { setIsLoading(false); }
    }, [searchQuery, eventType]);

    const handleToggleCalendar = (event: Event) => {
        setCalendarEvents(prev =>
            calendarEventIds.has(event.id) ? prev.filter(e => e.id !== event.id) : [...prev, event]
        );
    };

    const renderSearchBar = () => (
        <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                    <input type="text" placeholder="Search for events, e.g., 'implant workshops in Delhi'" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 pl-10 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full md:w-auto bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto bg-brand-primary px-6 py-3 rounded-lg text-white font-semibold hover:bg-teal-500 transition-colors disabled:bg-teal-800 disabled:cursor-not-allowed flex items-center justify-center">
                    {isLoading ? <Spinner /> : <span>Find Events</span>}
                </button>
            </div>
        </div>
    );
    
    const renderSearchView = () => (
        <>
            {renderSearchBar()}
            {isLoading && <div className="flex justify-center p-8"><Spinner /></div>}
            {error && <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg flex items-center gap-4"><AlertTriangle /><div><h3 className="font-bold">An Error Occurred</h3><p>{error}</p></div></div>}
            {!isLoading && searchResults.length === 0 && !error && (
                <div className="text-center p-10 bg-surface-dark/50 rounded-lg border-2 border-dashed border-border-dark">
                    <Calendar className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                    <h3 className="text-2xl font-bold text-text-primary-dark">Discover Dental Events</h3>
                    <p className="mt-2 text-text-secondary-dark">Use the search bar above to find events relevant to your interests.</p>
                </div>
            )}
            {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {searchResults.map(event => <EventCard key={event.id} event={event} onToggleCalendar={handleToggleCalendar} isSaved={calendarEventIds.has(event.id)} />)}
                </div>
            )}
        </>
    );

    const renderCalendarView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
        const eventsOnThisDay = calendarEvents.filter(e => {
            const eventDate = parseEventDate(e.date);
            return eventDate && isSameDay(eventDate, selectedDate);
        });

        const eventsByDay = useMemo(() => {
            const map = new Map<string, number>();
            calendarEvents.forEach(event => {
                const date = parseEventDate(event.date);
                if (date) {
                    const key = format(date, 'yyyy-MM-dd');
                    map.set(key, (map.get(key) || 0) + 1);
                }
            });
            return map;
        }, [calendarEvents]);

        return (
            <div className="bg-surface-dark p-4 rounded-lg border border-border-dark">
                <div className="flex items-center justify-between px-2 pb-4 border-b border-border-dark">
                    <h2 className="text-xl font-bold text-text-primary-dark">{format(currentMonth, 'MMMM yyyy')}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-full text-text-secondary-dark hover:bg-border-dark"><ChevronLeft/></button>
                        <button onClick={() => setCurrentMonth(new Date())} className="text-sm font-semibold px-3 py-1 bg-border-dark rounded-md hover:bg-slate-600">Today</button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-full text-text-secondary-dark hover:bg-border-dark"><ChevronRight/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-secondary-dark border-b border-border-dark">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {days.map(day => (
                        <div key={day.toString()} onClick={() => setSelectedDate(day)} className={`relative p-2 h-20 border-r border-b border-border-dark transition-colors cursor-pointer ${isSameMonth(day, currentMonth) ? 'hover:bg-background-dark' : 'bg-background-dark/50 text-text-secondary-dark'} ${isSameDay(day, selectedDate) ? 'bg-brand-primary/20' : ''}`}>
                            <time dateTime={format(day, 'yyyy-MM-dd')} className={`text-sm ${isToday(day) ? 'flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white font-bold' : ''} ${isSameDay(day, selectedDate) ? 'font-bold text-brand-primary' : ''}`}>{format(day, 'd')}</time>
                            {eventsByDay.has(format(day, 'yyyy-MM-dd')) && (
                                <div className="absolute bottom-1 right-1 h-2 w-2 bg-brand-secondary rounded-full"></div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <h3 className="font-bold text-lg text-text-primary-dark mb-3">Events for {format(selectedDate, "MMMM do, yyyy")}</h3>
                    {eventsOnThisDay.length > 0 ? (
                        <div className="space-y-3">
                            {eventsOnThisDay.map(event => (
                                <div key={event.id} className="p-3 bg-background-dark rounded-md flex justify-between items-center">
                                    <div><p className="font-semibold text-text-primary-dark">{event.title}</p><p className="text-xs text-text-secondary-dark">{event.location}</p></div>
                                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">Details</a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary-dark text-center py-4">No events scheduled for this day.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary-dark">DentAround</h2>
                <p className="text-text-secondary-dark mt-2">Discover, attend, and manage your professional dental events.</p>
            </div>

            <div className="flex border-b border-border-dark mb-6">
                <button onClick={() => setView('search')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${view === 'search' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><Search size={16}/> Find Events</button>
                <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${view === 'calendar' ? 'bg-surface-dark text-brand-primary border-b-2 border-brand-primary' : 'text-text-secondary-dark hover:bg-border-dark'}`}><Calendar size={16}/> My Calendar ({calendarEvents.length})</button>
            </div>

            <div className="animate-fade-in">
                {view === 'search' ? renderSearchView() : renderCalendarView()}
            </div>
        </div>
    );
};