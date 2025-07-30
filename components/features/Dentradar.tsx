import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { DirectoryEntry, UserProfile, ConnectionSuggestion, Clinic, Review, Doctor, ReviewSummary } from '../../types';
import { searchDirectory, suggestConnections, summarizeClinicReviews } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Search, Users, Wand2, Stethoscope, Cog, Truck, GraduationCap, MapPin, Phone, Star, Globe, ChevronLeft, Bot, Clock, Building } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

// --- MOCK DATA for Professional View ---
const mockDirectory: DirectoryEntry[] = [
  { id: 1, name: 'Dr. Rohan Sharma', specialty: 'General Dentist', location: 'Mumbai, MH', contact: '+91 98765 43210', type: 'Dentist' },
  { id: 2, name: 'Apex Dental Labs', specialty: 'Crown & Bridge', location: 'Bengaluru, KA', contact: 'contact@apexlabsbangalore.com', type: 'Technician' },
  { id: 3, name: 'DentalSupply India', specialty: 'Materials & Equipment', location: 'Online', contact: 'sales@dentalsupply.co.in', type: 'Supplier' },
  { id: 4, name: 'Dr. Aisha Khan', specialty: 'Pediatric Dentist', location: 'New Delhi, DL', contact: '+91 99887 76655', type: 'Dentist' },
  { id: 5, name: 'OrthoPro Technicians', specialty: 'Orthodontic Appliances', location: 'Chennai, TN', contact: 'info@orthoprochennai.com', type: 'Technician' },
  { id: 6, name: 'Student Supply Hub', specialty: 'Student Kits', location: 'Near MCODS, Manipal', contact: '+91 87654 32109', type: 'Supplier' },
  { id: 7, name: 'Dr. Vikram Singh', specialty: 'Prosthodontist', location: 'Bengaluru, KA', contact: '+91 91234 56789', type: 'Dentist' },
];

// --- MOCK DATA for Public View ---
const mockClinics: Clinic[] = [
    {
        id: 'clinic-1',
        name: 'SmileWell Dental Care',
        address: '123 MG Road, Bengaluru, KA 560001',
        phone: '+91 80 1234 5678',
        website: 'https://smilewell.example.com',
        lat: 12.9716, lng: 77.5946,
        rating: 4.8,
        services: ['General Dentistry', 'Cosmetic Dentistry', 'Implants', 'Orthodontics', 'Pediatric Dentistry'],
        photos: [ 'https://picsum.photos/seed/clinic1a/800/600', 'https://picsum.photos/seed/clinic1b/800/600', 'https://picsum.photos/seed/clinic1c/800/600' ],
        doctors: [
            { id: 'doc-1', name: 'Dr. Anjali Rao', specialty: 'Prosthodontist', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', bio: 'Specializes in complex full mouth reconstructions and aesthetic dentistry.' },
            { id: 'doc-2', name: 'Dr. Vikram Kumar', specialty: 'Orthodontist', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', bio: 'Expert in modern orthodontic treatments including Invisalign.' }
        ],
        reviews: [
            { id: 'rev-1', author: 'Priya S.', rating: 5, comment: 'Dr. Rao is fantastic! She explained everything clearly and made me feel comfortable. The clinic is super clean and modern.', date: '2024-07-20' },
            { id: 'rev-2', author: 'Amit P.', rating: 5, comment: 'Best dental experience I have ever had. The staff is very friendly and professional. Highly recommended!', date: '2024-07-18' },
            { id: 'rev-3', author: 'Sunita M.', rating: 4, comment: 'Good service, but the waiting time was a bit long. Otherwise, the treatment was excellent.', date: '2024-07-15' },
        ],
        isOpen: true
    },
    {
        id: 'clinic-2',
        name: 'Delhi Dental Studio',
        address: '45 Connaught Place, New Delhi, DL 110001',
        phone: '+91 11 9876 5432',
        website: 'https://delhidental.example.com',
        lat: 28.6330, lng: 77.2197,
        rating: 4.9,
        services: ['Cosmetic Dentistry', 'Smile Design', 'Veneers', 'Teeth Whitening'],
        photos: [ 'https://picsum.photos/seed/clinic2a/800/600', 'https://picsum.photos/seed/clinic2b/800/600' ],
        doctors: [ { id: 'doc-3', name: 'Dr. Rohan Mehra', specialty: 'Cosmetic Dentist', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', bio: 'Internationally trained cosmetic dentist with a passion for creating beautiful smiles.' } ],
        reviews: [ { id: 'rev-4', author: 'Vikram B.', rating: 5, comment: 'Dr. Mehra gave me the smile I always dreamed of. The results are phenomenal!', date: '2024-06-30' } ],
        isOpen: false
    },
    {
        id: 'clinic-3',
        name: 'Mumbai Family Dental',
        address: '789 Juhu Tara Road, Mumbai, MH 400049',
        phone: '+91 22 5555 8888',
        website: 'https://mumbaifamilydental.example.com',
        lat: 19.0826, lng: 72.8777,
        rating: 4.6,
        services: ['General Dentistry', 'Pediatric Dentistry', 'Root Canal Treatment'],
        photos: [ 'https://picsum.photos/seed/clinic3a/800/600' ],
        doctors: [
            { id: 'doc-4', name: 'Dr. Aisha Khan', specialty: 'Pediatric Dentist', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', bio: 'Loves working with children and making their dental visits fun and fearless.' },
            { id: 'doc-5', name: 'Dr. Sameer Patil', specialty: 'Endodontist', photo: 'https://i.pravatar.cc/150?u=a042581f4e29026704b', bio: 'Specializes in painless root canal treatments using advanced microscopy.' }
        ],
        reviews: [ { id: 'rev-5', author: 'Kavita J.', rating: 5, comment: 'Dr. Aisha is a magician with kids. My son was not scared at all!', date: '2024-07-05' }, { id: 'rev-6', author: 'Rajesh N.', rating: 4, comment: 'My root canal was painless, but the appointment booking was a little difficult.', date: '2024-07-02'} ],
        isOpen: true
    }
];

// --- PROFESSIONAL VIEW COMPONENTS ---

const ProfessionalDirectoryCard: React.FC<{ entry: DirectoryEntry }> = ({ entry }) => {
    const getIconForType = (type: DirectoryEntry['type']) => {
        switch (type) {
            case 'Dentist': return <Stethoscope size={24} />;
            case 'Technician': return <Cog size={24} />;
            case 'Supplier': return <Truck size={24} />;
            case 'Student': return <GraduationCap size={24} />;
            default: return <Users size={24} />;
        }
    }
    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-md flex flex-col h-full aurora-border-glow">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-background-dark rounded-lg flex items-center justify-center flex-shrink-0 text-brand-primary">
                    {getIconForType(entry.type)}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-text-primary-dark">{entry.name}</h3>
                    <p className="text-sm text-brand-secondary font-bold">{entry.specialty}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark space-y-2 text-sm text-text-secondary-dark flex-grow">
                <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-500"/>{entry.location}</p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-slate-500"/>{entry.contact}</p>
            </div>
            <div className="mt-4 flex justify-end">
                <button className="text-brand-primary font-semibold hover:underline">Send Inquiry</button>
            </div>
        </div>
    );
};

const ProfessionalDentRadar: React.FC = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DirectoryEntry[]>(mockDirectory);
    const [isLoading, setIsLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState<DirectoryEntry['type'] | 'All'>('All');
    
    const [suggestions, setSuggestions] = useState<ConnectionSuggestion | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setResults(mockDirectory);
            return;
        }
        setIsLoading(true);
        try {
            const aiResults = await searchDirectory(query, mockDirectory);
            setResults(aiResults);
        } catch (error) {
            console.error("AI Search failed", error);
            setResults(mockDirectory.filter(entry => 
                Object.values(entry).some(val => 
                    String(val).toLowerCase().includes(query.toLowerCase())
                )
            ));
        } finally {
            setIsLoading(false);
        }
    }, [query]);
    
    const handleSuggestConnections = useCallback(async () => {
        setIsLoadingSuggestions(true);
        setSuggestions(null);
        try {
            const currentUserProfile: UserProfile = { id: 'user-0', name: 'Dr. Priya Sharma', avatar: '', role: 'Endodontist' };
            const result = await suggestConnections(currentUserProfile, mockDirectory);
            setSuggestions(result);
        } catch (error) {
            console.error("AI Suggestion failed", error);
            setSuggestions({ suggestions: [], error: 'Failed to generate suggestions.' });
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, []);

    const displayedResults = useMemo(() => {
        if (typeFilter === 'All') return results;
        return results.filter(entry => entry.type === typeFilter);
    }, [results, typeFilter]);

    const professionalTypes: Array<DirectoryEntry['type']> = ['Dentist', 'Technician', 'Supplier', 'Student'];

  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
             <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                    <input type="text" placeholder={t('dentradar.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 pl-10 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto bg-brand-primary px-6 py-3 rounded-lg text-white font-semibold hover:bg-teal-500 flex items-center justify-center disabled:opacity-50">
                  {isLoading ? <Spinner /> : <span>{t('dentradar.search')}</span>}
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-secondary-dark">{t('dentradar.filter')}</span>
                <button onClick={() => setTypeFilter('All')} className={`px-3 py-1 text-sm rounded-full ${typeFilter === 'All' ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark'}`}>{t('dentradar.all')}</button>
                {professionalTypes.map(type => (
                    <button key={type} onClick={() => setTypeFilter(type)} className={`px-3 py-1 text-sm rounded-full ${typeFilter === type ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-secondary-dark'}`}>{t(`dentradar.type.${type.toLowerCase()}`)}</button>
                ))}
            </div>
        </div>

        <button onClick={handleSuggestConnections} disabled={isLoadingSuggestions} className="w-full bg-brand-secondary/20 border border-brand-secondary/50 text-brand-secondary font-bold py-3 mb-6 rounded-lg hover:bg-brand-secondary/30 flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoadingSuggestions ? <Spinner /> : <><Wand2 />{t('dentradar.suggestConnections', { role: 'Endodontist' })}</>}
        </button>

        {suggestions && (
            <div className="mb-6 space-y-4 animate-fade-in">
                {suggestions.error ? <p className="text-red-400">{suggestions.error}</p> : suggestions.suggestions.map((s,i) => (
                    <div key={i} className="bg-surface-dark p-4 rounded-lg border border-border-dark flex flex-col md:flex-row gap-4">
                         <div className="flex-1"><ProfessionalDirectoryCard entry={s.entry} /></div>
                        <div className="md:w-1/3 bg-background-dark p-3 rounded-md">
                            <p className="font-semibold text-brand-secondary text-sm">{t('dentradar.suggestionReason')}</p>
                            <p className="text-text-secondary-dark text-sm mt-1">{s.reason}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedResults.length > 0 ? displayedResults.map(entry => (
                <ProfessionalDirectoryCard key={entry.id} entry={entry} />
            )) : <p className="col-span-full text-center text-text-secondary-dark py-12">{t('dentradar.noResults')}</p>}
        </div>
    </div>
  );
};


// --- PUBLIC VIEW COMPONENTS ---

const ClinicCard: React.FC<{ clinic: Clinic; onSelect: () => void }> = ({ clinic, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div onClick={onSelect} className="bg-surface-dark rounded-lg shadow-md border border-border-dark overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-[1.02] duration-200">
            <img src={clinic.photos[0]} alt={clinic.name} className="w-full h-40 object-cover" />
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-text-primary-dark">{clinic.name}</h3>
                <p className="text-sm text-text-secondary-dark flex items-center gap-2 mt-1"><MapPin size={14} /> {clinic.address}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-dark">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-sm text-text-primary-dark">{clinic.rating}</span>
                        <span className="text-xs text-text-secondary-dark">({clinic.reviews.length})</span>
                    </div>
                    {clinic.isOpen ? <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Open Now</span> : <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Closed</span>}
                </div>
            </div>
        </div>
    );
};

const ClinicDetailView: React.FC<{ clinic: Clinic; onBack: () => void }> = ({ clinic, onBack }) => {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const handleSummarize = async () => {
        setIsLoadingSummary(true);
        const result = await summarizeClinicReviews(clinic.reviews);
        setSummary(result);
        setIsLoadingSummary(false);
    };

    const handleBookAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingConfirmed(true);
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-brand-primary font-semibold hover:underline mb-4"><ChevronLeft size={20} /> Back to Results</button>
            <div className="bg-surface-dark rounded-lg shadow-lg border border-border-dark overflow-hidden">
                <div className="h-64 bg-cover bg-center" style={{ backgroundImage: `url(${clinic.photos[0]})` }} />
                <div className="p-6">
                    <h2 className="text-3xl font-bold text-text-primary-dark">{clinic.name}</h2>
                    <p className="text-text-secondary-dark flex items-center gap-2 mt-1"><MapPin size={14} /> {clinic.address}</p>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-yellow-400"><Star size={18} fill="currentColor" /><span className="font-bold text-lg text-text-primary-dark">{clinic.rating}</span><span className="text-sm text-text-secondary-dark">({clinic.reviews.length} reviews)</span></div>
                        <a href={`tel:${clinic.phone}`} className="flex items-center gap-2 text-text-secondary-dark hover:text-brand-primary"><Phone size={16} />{clinic.phone}</a>
                        <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-secondary-dark hover:text-brand-primary"><Globe size={16} />{t('dentradar.public.clinicDetails.website')}</a>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-border-dark">
                    <div className="lg:col-span-2 space-y-6">
                        <div><h3 className="text-xl font-bold mb-3">{t('dentradar.public.clinicDetails.services')}</h3><div className="flex flex-wrap gap-2">{clinic.services.map(s => <span key={s} className="bg-background-dark text-text-secondary-dark text-sm px-3 py-1 rounded-full">{s}</span>)}</div></div>
                        <div><h3 className="text-xl font-bold mb-3">{t('dentradar.public.clinicDetails.ourDoctors')}</h3><div className="space-y-4">{clinic.doctors.map(d=><div key={d.id} className="flex items-center gap-4"><img src={d.photo} className="w-16 h-16 rounded-full object-cover"/><div className="flex-grow"><p className="font-bold">{d.name}</p><p className="text-sm text-brand-secondary">{d.specialty}</p><p className="text-xs text-text-secondary-dark mt-1">{d.bio}</p></div></div>)}</div></div>
                        <div><h3 className="text-xl font-bold mb-3">{t('dentradar.public.clinicDetails.patientReviews')}</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">{clinic.reviews.map(r=><div key={r.id} className="bg-background-dark p-3 rounded-md"><div className="flex items-center justify-between"><p className="font-semibold text-sm">{r.author}</p><div className="flex items-center text-yellow-400">{[...Array(r.rating)].map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div></div><p className="text-sm text-text-secondary-dark mt-1 italic">"{r.comment}"</p></div>)}</div>
                        </div>
                         <div><h3 className="text-xl font-bold mb-3">{t('dentradar.public.clinicDetails.aiSummary')}</h3>
                            {summary ? (<div className="bg-background-dark p-4 rounded-lg space-y-3"><p><strong className="text-brand-secondary">{t('dentradar.public.clinicDetails.sentiment')}:</strong> {summary.overallSentiment}</p><div><strong className="text-green-400">{t('dentradar.public.clinicDetails.praises')}:</strong><ul className="list-disc list-inside text-sm text-text-secondary-dark">{summary.praises.map((p,i)=><li key={i}>{p}</li>)}</ul></div><div><strong className="text-red-400">{t('dentradar.public.clinicDetails.complaints')}:</strong><ul className="list-disc list-inside text-sm text-text-secondary-dark">{summary.complaints.map((c,i)=><li key={i}>{c}</li>)}</ul></div></div>)
                            : (<button onClick={handleSummarize} disabled={isLoadingSummary} className="bg-brand-secondary/20 text-brand-secondary font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">{isLoadingSummary?<Spinner/>:<><Bot size={16}/> {t('dentradar.public.clinicDetails.summarizeReviews')}</>}</button>)}
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-background-dark p-4 rounded-lg sticky top-24">
                             <h3 className="text-xl font-bold text-center mb-4">Book an Appointment</h3>
                             {bookingConfirmed ? (
                                <div className="text-center p-4 bg-green-500/10 text-green-300 rounded-lg">
                                    <p className="font-bold">Request Sent!</p>
                                    <p className="text-sm">The clinic will contact you shortly to confirm your appointment.</p>
                                </div>
                             ) : (
                                <form onSubmit={handleBookAppointment} className="space-y-3">
                                    <select required className="w-full bg-surface-dark p-2 rounded-md text-sm"><option value="">Select a Doctor</option>{clinic.doctors.map(d=><option key={d.id}>{d.name} - {d.specialty}</option>)}</select>
                                    <input type="date" required className="w-full bg-surface-dark p-2 rounded-md text-sm"/>
                                    <input type="time" required className="w-full bg-surface-dark p-2 rounded-md text-sm"/>
                                    <button type="submit" className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-lg hover:bg-teal-500">Request Appointment</button>
                                </form>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PublicDentRadar: React.FC = () => {
    const { t } = useTranslation();
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClinics = useMemo(() => {
        if (!searchQuery) return mockClinics;
        const lowercasedQuery = searchQuery.toLowerCase();
        return mockClinics.filter(clinic =>
            clinic.name.toLowerCase().includes(lowercasedQuery) ||
            clinic.address.toLowerCase().includes(lowercasedQuery) ||
            clinic.services.some(s => s.toLowerCase().includes(lowercasedQuery)) ||
            clinic.doctors.some(d => d.name.toLowerCase().includes(lowercasedQuery) || d.specialty.toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery]);

    if (selectedClinic) {
        return <ClinicDetailView clinic={selectedClinic} onBack={() => setSelectedClinic(null)} />;
    }

    return (
        <div className="max-w-7xl mx-auto">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-text-primary-dark">{t('dentradar.public.title')}</h1>
                <p className="text-text-secondary-dark mt-2">{t('dentradar.public.sub')}</p>
            </div>
            <div className="bg-surface-dark p-4 rounded-lg mb-6 border border-border-dark shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-dark" />
                    <input type="text" placeholder={t('dentradar.public.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 pl-10 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
            </div>
            {filteredClinics.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClinics.map(clinic => <ClinicCard key={clinic.id} clinic={clinic} onSelect={() => setSelectedClinic(clinic)} />)}
                </div>
            ) : (
                <div className="text-center py-12 px-6 bg-surface-dark rounded-lg border-2 border-dashed border-border-dark">
                    <Building className="mx-auto h-12 w-12 text-text-secondary-dark" />
                    <h3 className="mt-2 text-xl font-semibold text-text-primary-dark">{t('dentradar.public.noResults')}</h3>
                    <p className="mt-1 text-text-secondary-dark">{t('dentradar.public.noResultsSub')}</p>
                </div>
            )}
        </div>
    );
};


// --- MAIN EXPORT ---

export const Dentradar: React.FC = () => {
    const location = ReactRouterDOM.useLocation();
    const isPublic = location.pathname.includes('/public');

    if (isPublic) {
        return <PublicDentRadar />;
    } else {
        return <ProfessionalDentRadar />;
    }
};
