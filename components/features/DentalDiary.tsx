import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '../../types';
import { Plus, Edit, Trash2, X, BookOpen } from 'lucide-react';

const DIARY_STORAGE_KEY = 'dentalDiaryEntries_v1';

const mockDiaryEntries: DiaryEntry[] = [
    { id: 1, date: '2024-07-20', title: 'Case 001: J. Doe - #8 Crown Prep', notes: 'Prepared tooth #8 for a full zirconia crown. Used digital impression with iTero. Patient tolerated procedure well. Temp crown placed.', image: 'https://picsum.photos/seed/case1/400/300' },
    { id: 2, date: '2024-07-19', title: 'Case 002: A. Smith - #19, #20 MOD Composites', notes: 'Class II composite restorations on teeth #19 and #20. Good isolation achieved with rubber dam. Excellent shade match with A2 body composite.', image: 'https://picsum.photos/seed/case2/400/300' },
    { id: 3, date: '2024-07-18', title: 'Case 003: M. Jones - Implant Consult', notes: 'Patient interested in replacing missing #30. Discussed implant vs. bridge options. CBCT taken for analysis. Will present treatment plan next visit.', image: 'https://picsum.photos/seed/case3/400/300' },
];

// Diary Entry Modal Component
const DiaryEntryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: DiaryEntry) => void;
    entry: DiaryEntry | null;
}> = ({ isOpen, onClose, onSave, entry }) => {
    const [formData, setFormData] = useState({ title: '', date: '', notes: '', image: '' });
    const modalRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (entry) {
            setFormData({ title: entry.title, date: entry.date, notes: entry.notes, image: entry.image || '' });
        } else {
            setFormData({ title: '', date: new Date().toISOString().split('T')[0], notes: '', image: '' });
        }
    }, [entry, isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.date.trim()) return;
        onSave({ ...formData, id: entry?.id || Date.now() });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={handleBackdropClick}>
            <div ref={modalRef} className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-lg border border-border-dark">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark">{entry ? 'Edit Diary Entry' : 'Create New Entry'}</h2>
                    <button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-text-secondary-dark mb-1">Title</label>
                        <input ref={titleInputRef} type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-text-secondary-dark mb-1">Date</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-text-secondary-dark mb-1">Image URL (Optional)</label>
                        <input type="text" id="image" name="image" value={formData.image} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary-dark mb-1">Notes</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={5} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                        <button type="submit" disabled={!formData.title.trim() || !formData.date.trim()} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed transition-colors">Save Entry</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Diary Card Component
const DiaryCard: React.FC<{ entry: DiaryEntry; onEdit: (entry: DiaryEntry) => void; onDelete: (id: number) => void; }> = ({ entry, onEdit, onDelete }) => (
    <div className="bg-surface-dark rounded-lg shadow-md overflow-hidden group relative aurora-border-glow">
        {entry.image && 
            <div className="overflow-hidden h-48">
                <img src={entry.image} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
        }
        <div className="p-4">
            <p className="text-xs text-text-secondary-dark">{new Date(entry.date).toLocaleDateString('en-CA')}</p>
            <h3 className="font-bold text-lg text-text-primary-dark mt-1 truncate">{entry.title}</h3>
            <p className="text-sm text-text-secondary-dark mt-2 h-10 overflow-hidden text-ellipsis">{entry.notes}</p>
        </div>
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(entry)} className="p-2 bg-black/50 rounded-full text-white hover:bg-brand-primary"><Edit size={16} /></button>
            <button onClick={() => onDelete(entry.id)} className="p-2 bg-black/50 rounded-full text-white hover:bg-red-500"><Trash2 size={16} /></button>
        </div>
    </div>
);

// Main Dental Diary Component
export const DentalDiary: React.FC = () => {
    const [entries, setEntries] = useState<DiaryEntry[]>(() => {
        try {
            const stored = localStorage.getItem(DIARY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : mockDiaryEntries;
        } catch (e) {
            console.error("Failed to load diary entries:", e);
            return mockDiaryEntries;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
        } catch (e) {
            console.error("Failed to save diary entries:", e);
        }
    }, [entries]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

    const handleOpenModal = (entry: DiaryEntry | null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleSaveEntry = (entryToSave: DiaryEntry) => {
        const isUpdating = entries.some(e => e.id === entryToSave.id);
        if (isUpdating) {
            setEntries(entries.map(e => e.id === entryToSave.id ? entryToSave : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            setEntries(prev => [...prev, entryToSave].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        handleCloseModal();
    };

    const handleDeleteEntry = (id: number) => {
        if (window.confirm('Are you sure you want to delete this diary entry? This action cannot be undone.')) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-text-primary-dark">Clinical Diary</h2>
                <p className="text-text-secondary-dark mt-2">Your secure, personal logbook for clinical cases, notes, and reflections.</p>
            </div>

            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal(null)} className="bg-brand-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-teal-500 transition-colors flex items-center gap-2">
                    <Plus size={20} />New Entry
                </button>
            </div>

            {entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {entries.map(entry => (
                        <DiaryCard 
                            key={entry.id} 
                            entry={entry}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteEntry}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-surface-dark rounded-lg border-2 border-dashed border-border-dark">
                    <BookOpen className="mx-auto h-12 w-12 text-text-secondary-dark" />
                    <h3 className="mt-2 text-xl font-semibold text-text-primary-dark">Your Diary is Empty</h3>
                    <p className="mt-1 text-text-secondary-dark">Click "New Entry" to start logging your clinical cases.</p>
                </div>
            )}
            
            <DiaryEntryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEntry}
                entry={editingEntry}
            />
        </div>
    );
};