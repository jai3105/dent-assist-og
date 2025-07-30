
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Folder, FileText, Link as LinkIcon, Plus, Archive, X, BrainCircuit, Wand2, MoreVertical, Trash2, Edit, Search, Download, GraduationCap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Spinner } from '../common/Spinner';
import { generateFlashcardsFromNote } from '../../services/geminiService';
import { VaultItem, VaultFolder, VaultNote, VaultFile, VaultLink, Flashcard, FlashcardResult } from '../../types';

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


// --- Initial State ---
const initialItems: Record<string, VaultItem> = {
    'root': { id: 'root', name: 'My Vault', type: 'folder', parentId: '', children: ['note-1'] },
    'note-1': { id: 'note-1', type: 'note', name: 'Welcome to DentaVault!', parentId: 'root', content: 'This is your new Dental Study Hub!\n\n- Create folders for your subjects.\n- Upload lecture PDFs, clinical photos, and other files.\n- Take notes directly in the app.\n\nTry the AI Tools on this note!\n1. Click "Generate Flashcards" to create study aids instantly.', lastModified: new Date().toISOString() },
};

// --- Child Components ---
const ItemIcon: React.FC<{ item: VaultItem }> = ({ item }) => {
    if (item.type === 'folder') return <Folder className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
    if (item.type === 'note') return <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    if (item.type === 'link') return <LinkIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    if (item.type === 'file') return <Archive className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    return <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />;
};

const Breadcrumbs: React.FC<{ items: Record<string, VaultItem>, currentFolderId: string, onNavigate: (id: string) => void }> = ({ items, currentFolderId, onNavigate }) => {
    const path = useMemo(() => {
        const result: VaultItem[] = [];
        let currentId: string | undefined = currentFolderId;
        while (currentId && items[currentId]) {
            result.unshift(items[currentId]);
            currentId = items[currentId].parentId;
        }
        return result;
    }, [items, currentFolderId]);

    return (
        <nav className="flex items-center text-sm text-text-secondary-dark mb-4">
            {path.map((item, index) => (
                <React.Fragment key={item.id}>
                    <button onClick={() => onNavigate(item.id)} className="hover:underline">{item.name}</button>
                    {index < path.length - 1 && <span className="mx-2">/</span>}
                </React.Fragment>
            ))}
        </nav>
    );
};

const AddItemModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (type: 'folder' | 'note' | 'link', name: string, url?: string) => void; type: 'folder' | 'note' | 'link' | null; }> = ({ isOpen, onClose, onSave, type }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setUrl('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen || !type) return null;

    const titles = {
        folder: t('dentavault.modal.newFolder.title'),
        note: t('dentavault.modal.addNote.title'),
        link: t('dentavault.modal.saveLink.title'),
    };

    const handleSubmit = () => {
        if (!name.trim() || (type === 'link' && !url.trim())) return;
        onSave(type, name, url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-sm border border-border-dark" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">{titles[type]}</h2>
                <div className="space-y-4">
                    <input ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t(`dentavault.modal.${type === 'link' ? 'saveLink.namePlaceholder' : type === 'folder' ? 'newFolder.placeholder' : 'addNote.placeholder'}`)} className="w-full bg-background-dark p-2 rounded-md border border-border-dark" />
                    {type === 'link' && <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={t('dentavault.modal.saveLink.urlPlaceholder')} className="w-full bg-background-dark p-2 rounded-md border border-border-dark" />}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="bg-border-dark px-4 py-2 rounded-md font-semibold">{t('dentavault.modal.cancel')}</button>
                    <button onClick={handleSubmit} className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold">{t('dentavault.modal.create')}</button>
                </div>
            </div>
        </div>
    );
};

const FlashcardViewerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    flashcards: Flashcard[];
}> = ({ isOpen, onClose, flashcards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentCard = flashcards[currentIndex];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-lg border border-border-dark" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary-dark">{t('dentavault.flashcards.title')} ({currentIndex + 1}/{flashcards.length})</h2>
                    <button onClick={onClose}><X /></button>
                </div>
                
                <div className="relative h-64" style={{ perspective: '1000px' }}>
                    <div 
                        className={`relative w-full h-full transition-transform duration-700`}
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        title={t('dentavault.flashcards.flip')}
                    >
                        {/* Front of Card */}
                        <div className="absolute w-full h-full bg-background-dark border border-border-dark rounded-lg flex flex-col items-center justify-center p-4 text-center" style={{ backfaceVisibility: 'hidden' }}>
                            <p className="text-xs font-bold text-text-secondary-dark mb-4">{t('dentavault.flashcards.question')}</p>
                            <p className="text-xl">{currentCard.question}</p>
                        </div>
                        {/* Back of Card */}
                        <div className="absolute w-full h-full bg-brand-primary/10 border border-brand-primary rounded-lg flex flex-col items-center justify-center p-4 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <p className="text-xs font-bold text-brand-primary mb-4">{t('dentavault.flashcards.answer')}</p>
                            <p className="text-lg text-brand-primary">{currentCard.answer}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button onClick={() => { setCurrentIndex(p => Math.max(0, p - 1)); setIsFlipped(false); }} disabled={currentIndex === 0} className="font-semibold px-4 py-2 rounded-md bg-border-dark disabled:opacity-50">&larr; Prev</button>
                    <span className="text-sm text-text-secondary-dark">{t('dentavault.flashcards.flip')}</span>
                    <button onClick={() => { setCurrentIndex(p => Math.min(flashcards.length - 1, p + 1)); setIsFlipped(false); }} disabled={currentIndex === flashcards.length - 1} className="font-semibold px-4 py-2 rounded-md bg-border-dark disabled:opacity-50">Next &rarr;</button>
                </div>
            </div>
        </div>
    );
};

const NoteEditor: React.FC<{
    note: VaultNote;
    onContentChange: (content: string) => void;
}> = ({ note, onContentChange }) => {
    const { t } = useTranslation();
    const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
    const [flashcardsResult, setFlashcardsResult] = useState<Flashcard[] | null>(null);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

    const handleGenerateFlashcards = async () => {
        if (!note.content.trim()) return;
        setIsLoadingFlashcards(true);
        const result = await generateFlashcardsFromNote(note.content);
        if (result.flashcards) {
            setFlashcardsResult(result.flashcards);
            setIsFlashcardModalOpen(true);
        } else {
            alert(result.error || t('dentavault.flashcards.error'));
        }
        setIsLoadingFlashcards(false);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border-dark">
                <h3 className="font-bold text-lg">{note.name}</h3>
                <p className="text-xs text-text-secondary-dark">{t('dentavault.editor.lastModified')}: {new Date(note.lastModified).toLocaleString()}</p>
            </div>
            <div className="flex-grow flex flex-col p-4 gap-4">
                <textarea
                    value={note.content}
                    onChange={e => onContentChange(e.target.value)}
                    className="w-full h-full flex-grow bg-background-dark p-4 rounded-md text-text-secondary-dark border border-border-dark focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"
                    placeholder={t('dentavault.editor.placeholder')}
                />
                 <div className="bg-background-dark p-3 rounded-lg border border-border-dark">
                    <h4 className="text-sm font-semibold text-text-primary-dark mb-2 flex items-center gap-2"><BrainCircuit size={16}/> {t('dentavault.aiTools')}</h4>
                    <button onClick={handleGenerateFlashcards} disabled={isLoadingFlashcards || !note.content.trim()} className="w-full bg-brand-secondary text-background-dark font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoadingFlashcards ? <Spinner /> : <><Wand2 size={16}/> {t('dentavault.flashcards.generate')}</>}
                    </button>
                </div>
            </div>
            {flashcardsResult && (
                <FlashcardViewerModal
                    isOpen={isFlashcardModalOpen}
                    onClose={() => setIsFlashcardModalOpen(false)}
                    flashcards={flashcardsResult}
                />
            )}
        </div>
    );
};

// --- Main Vault Component ---
export const DentaVault: React.FC = () => {
    const { t } = useTranslation();
    const [items, setItems] = useState<Record<string, VaultItem>>(initialItems);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
    const [modal, setModal] = useState<{ type: 'folder' | 'note' | 'link' | 'rename' | null, itemId?: string }>({ type: null });
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    
    const isPristine = Object.keys(items).length <= 2;

    const createStarterPack = () => {
        const starterFolders: Record<string, VaultFolder> = {
          'folder-anatomy': { id: 'folder-anatomy', name: 'Anatomy & Histology', type: 'folder', parentId: 'root', children: [] },
          'folder-prostho': { id: 'folder-prostho', name: 'Prosthodontics', type: 'folder', parentId: 'root', children: [] },
          'folder-endo': { id: 'folder-endo', name: 'Endodontics', type: 'folder', parentId: 'root', children: [] },
        };
        const updatedRoot = { ...items['root'], children: [...(items['root'] as VaultFolder).children, ...Object.keys(starterFolders)] } as VaultFolder;
        setItems(prev => ({...prev, ...starterFolders, 'root': updatedRoot}));
    };

    const currentItems = useMemo(() => {
        const folder = items[currentFolderId] as VaultFolder;
        if (!folder || folder.type !== 'folder') return [];
        let children = folder.children.map(id => items[id]);
        if (searchQuery) {
            children = Object.values(items).filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return children.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
    }, [items, currentFolderId, searchQuery]);

    const handleItemClick = (item: VaultItem) => {
        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
            setSearchQuery('');
        }
        setSelectedItemId(item.id);
    };

    const handleAddItem = (type: 'folder' | 'note' | 'link', name: string, url?: string) => {
        const id = `${type}-${Date.now()}`;
        const newItem: VaultItem = type === 'folder' ? { id, name, type, parentId: currentFolderId, children: [] }
            : type === 'note' ? { id, name, type, parentId: currentFolderId, content: '', lastModified: new Date().toISOString() }
            : { id, name, type, parentId: currentFolderId, url: url || '' };
        
        setItems(prev => {
            const newItems = { ...prev, [id]: newItem };
            const parent = { ...newItems[currentFolderId] } as VaultFolder;
            parent.children = [...parent.children, id];
            newItems[currentFolderId] = parent;
            return newItems;
        });
        setModal({ type: null });
    };

    const handleDeleteItem = (itemId: string) => {
        if (!window.confirm(t('dentavault.deleteConfirm', { name: items[itemId].name }))) return;
        setItems(prev => {
            const newItems = { ...prev };
            const itemToDelete = newItems[itemId];
            delete newItems[itemId];
            const parent = { ...newItems[itemToDelete.parentId] } as VaultFolder;
            parent.children = parent.children.filter(id => id !== itemId);
            newItems[itemToDelete.parentId] = parent;
            // Recursively delete children if it's a folder
            const deleteChildren = (id: string) => {
                const item = newItems[id];
                if (item?.type === 'folder') {
                    item.children.forEach(childId => deleteChildren(childId));
                }
                delete newItems[id];
            };
            if(itemToDelete.type === 'folder') {
                itemToDelete.children.forEach(childId => deleteChildren(childId));
            }

            return newItems;
        });
        setContextMenu(null);
    };
    
    const handleRenameItem = () => {
        if (!modal.itemId || !renameValue.trim()) return;
        setItems(prev => ({...prev, [modal.itemId!]: {...prev[modal.itemId!], name: renameValue}}));
        setModal({type: null});
    };
    
    const handleFileSelect = async (files: FileList) => {
        for (const file of Array.from(files)) {
            const newFile: VaultFile = {
                id: `file-${Date.now()}-${Math.random()}`, name: file.name, type: 'file', parentId: currentFolderId,
                fileType: file.type || 'unknown', size: file.size, lastModified: new Date(file.lastModified).toISOString(),
                previewUrl: await readFileAsDataURL(file), downloadUrl: await readFileAsDataURL(file)
            };
            setItems(prev => { const newItems = { ...prev, [newFile.id]: newFile }; const parent = { ...newItems[currentFolderId] } as VaultFolder; parent.children = [...parent.children, newFile.id]; newItems[currentFolderId] = parent; return newItems; });
        }
    };
    
    const handleDownload = (item: VaultFile) => {
        if (!item.downloadUrl) return;
        const link = document.createElement('a');
        link.href = item.downloadUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const Viewer: React.FC = () => {
        const item = selectedItemId ? items[selectedItemId] : null;
        if (!item) return <div className="p-6 h-full flex items-center justify-center text-center text-text-secondary-dark">{t('dentavault.viewer.selectItem')}</div>;
        if (item.type === 'note') return <NoteEditor note={item as VaultNote} onContentChange={content => { if (!selectedItemId) return; setItems(prev => ({ ...prev, [selectedItemId]: { ...prev[selectedItemId] as VaultNote, content, lastModified: new Date().toISOString() } })); }} />;
        if (item.type === 'file' && (item as VaultFile).fileType.startsWith('image/')) return <div className="p-2 h-full"><img src={(item as VaultFile).previewUrl} alt={item.name} className="w-full h-full object-contain"/></div>;
        if (item.type === 'file' && (item as VaultFile).fileType === 'application/pdf') return <div className="h-full"><iframe src={(item as VaultFile).previewUrl} className="w-full h-full" title={item.name}></iframe></div>;
        if (item.type === 'file') return <div className="p-6 h-full flex flex-col items-center justify-center text-center"><Archive size={64} className="text-text-secondary-dark mx-auto" /><h3 className="text-xl font-bold text-text-primary-dark mt-4">{item.name}</h3><p className="text-sm text-text-secondary-dark">{t('dentavault.file.noPreview')}</p><button onClick={() => handleDownload(item as VaultFile)} className="mt-4 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">{t('dentavault.context.download')}</button></div>;
        if (item.type === 'link') return <div className="p-6 h-full flex flex-col items-center justify-center text-center"><LinkIcon size={64} className="text-text-secondary-dark mx-auto" /><h3 className="text-xl font-bold text-text-primary-dark mt-4">{item.name}</h3><a href={(item as VaultLink).url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{(item as VaultLink).url}</a></div>
        return null;
    };
    
    if (isPristine) {
        return <div className="flex flex-col items-center justify-center h-full text-center p-8"><GraduationCap size={64} className="text-brand-primary"/><h2 className="text-2xl font-bold mt-4">{t('dentavault.starterPack.title')}</h2><p className="text-text-secondary-dark mt-2">{t('dentavault.starterPack.sub')}</p><button onClick={createStarterPack} className="mt-6 bg-brand-secondary text-background-dark font-bold py-2 px-6 rounded-lg">{t('dentavault.starterPack.button')}</button></div>
    }

    return (
        <div className="flex h-[calc(100vh-8.5rem)] gap-4">
            <aside className="w-1/3 bg-surface-dark p-4 rounded-lg border border-border-dark flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{t('dentavault.myVault')}</h2>
                    <div className="relative group">
                        <button onClick={() => {}} className="p-2 hover:bg-border-dark rounded-full"><Plus/></button>
                        <div className="absolute top-full right-0 mt-2 w-40 bg-background-dark border border-border-dark rounded-lg shadow-lg z-20 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal({type: 'folder'})} className="w-full text-left px-4 py-2 text-sm hover:bg-border-dark">{t('dentavault.newFolder')}</button>
                            <button onClick={() => setModal({type: 'note'})} className="w-full text-left px-4 py-2 text-sm hover:bg-border-dark">{t('dentavault.addNote')}</button>
                            <button onClick={() => setModal({type: 'link'})} className="w-full text-left px-4 py-2 text-sm hover:bg-border-dark">{t('dentavault.saveLink')}</button>
                        </div>
                    </div>
                </div>
                <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark"/><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('dentavault.searchPlaceholder')} className="w-full bg-background-dark p-2 pl-9 rounded-md text-sm border border-border-dark"/></div>
                <Breadcrumbs items={items} currentFolderId={currentFolderId} onNavigate={setCurrentFolderId} />
                <div className="flex-grow overflow-y-auto" onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()}>
                     {currentItems.length > 0 ? currentItems.map(item => (
                        <div key={item.id} onClick={() => handleItemClick(item)} onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, itemId: item.id }); }} className={`w-full text-left flex items-center gap-2 p-2 rounded-md font-medium text-sm cursor-pointer ${selectedItemId === item.id ? 'bg-brand-primary text-white' : 'hover:bg-border-dark'}`}>
                            <ItemIcon item={item}/> <span className="truncate">{item.name}</span>
                        </div>
                    )) : <p className="text-center text-sm text-text-secondary-dark py-8">{searchQuery ? t('dentavault.noSearchResults', {query: searchQuery}) : t('dentavault.emptyFolder')}</p>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-brand-primary text-white font-bold py-2 rounded-lg mt-4 flex items-center justify-center gap-2">{t('dentavault.uploadFile')}</button>
                <input type="file" ref={fileInputRef} onChange={e => e.target.files && handleFileSelect(e.target.files)} multiple className="hidden"/>
            </aside>
            <main className="w-2/3 bg-surface-dark rounded-lg border border-border-dark"><Viewer /></main>

            {contextMenu && (
                <div ref={contextMenuRef} style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed bg-background-dark border border-border-dark rounded-lg shadow-lg z-50 text-sm w-40">
                    <button onClick={() => { setModal({type: 'rename', itemId: contextMenu.itemId}); setRenameValue(items[contextMenu.itemId].name); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-border-dark flex items-center gap-2"><Edit size={14}/> {t('dentavault.context.rename')}</button>
                    {(items[contextMenu.itemId].type === 'file') && <button onClick={() => handleDownload(items[contextMenu.itemId] as VaultFile)} className="w-full text-left px-4 py-2 hover:bg-border-dark flex items-center gap-2"><Download size={14}/> {t('dentavault.context.download')}</button>}
                    <button onClick={() => handleDeleteItem(contextMenu.itemId)} className="w-full text-left px-4 py-2 hover:bg-border-dark text-red-400 flex items-center gap-2"><Trash2 size={14}/> {t('dentavault.context.delete')}</button>
                </div>
            )}
            <AddItemModal isOpen={!!modal.type && modal.type !== 'rename'} onClose={() => setModal({type: null})} onSave={handleAddItem} type={modal.type as any} />
            {modal.type === 'rename' && (<div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setModal({type: null})}>
                <div className="bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-sm border border-border-dark" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-text-primary-dark mb-4">{t('dentavault.modal.rename.title')}</h2>
                    <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key==='Enter' && handleRenameItem()} className="w-full bg-background-dark p-2 rounded-md border border-border-dark" />
                    <div className="flex justify-end gap-2 mt-6"><button onClick={() => setModal({type: null})} className="bg-border-dark px-4 py-2 rounded-md font-semibold">{t('dentavault.modal.cancel')}</button><button onClick={handleRenameItem} className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold">{t('dentavault.modal.rename.button')}</button></div>
                </div>
            </div>)}
        </div>
    );
};
