import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { LabCase, DentalLab, LabFile, CaseStatus } from '../../types';
import { analyzeLabCaseNotes } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { Plus, ChevronLeft, UploadCloud, FileText, Trash2, X, Truck, CheckCircle, Clock, Cog, FlaskConical, Hourglass, Wand2, Send, MessageSquare } from 'lucide-react';

// --- MOCK DATA ---
const mockLabs: DentalLab[] = [
    { id: 'lab-1', name: 'Precision Dental Labs', address: 'Mumbai, MH', contactPerson: 'Anil Kapoor', phone: '9876543210' },
    { id: 'lab-2', name: 'Aesthetic Creations', address: 'Bengaluru, KA', contactPerson: 'Sunita Sharma', phone: '8765432109' },
    { id: 'lab-3', name: 'National Dental Prosthetics', address: 'New Delhi, DL', contactPerson: 'Rajesh Kumar', phone: '7654321098' },
    { id: 'lab-4', name: 'Delta Dental Laboratories', address: 'Pune, MH', contactPerson: 'Vikram Rathod', phone: '9123456789' },
];

const mockCases: LabCase[] = [
    {
        id: 'CASE-001', patientName: 'Riya Sharma', caseType: 'Zirconia Crown', shade: 'A2', dueDate: '2024-08-10', labId: 'lab-1', labName: 'Precision Dental Labs', status: 'In Lab', createdAt: '2024-07-25',
        notes: 'Please ensure a precise marginal fit. Patient has a high smile line.',
        files: [{ id: 'file-1', name: 'upper-arch-scan.stl', type: 'model/stl', size: 12582912 }],
        trackingHistory: [
            { status: 'Submitted', date: '2024-07-25' },
            { status: 'Pickup Scheduled', date: '2024-07-26' },
            { status: 'In Transit', date: '2024-07-27' },
            { status: 'In Lab', date: '2024-07-28', notes: 'Case received and checked in.' },
        ],
    },
    {
        id: 'CASE-002', patientName: 'Arjun Verma', caseType: 'E-Max Veneers (x6)', shade: 'BL2', dueDate: '2024-08-15', labId: 'lab-2', labName: 'Aesthetic Creations', status: 'Shipped', createdAt: '2024-07-22',
        notes: 'Minimal prep veneers. Please follow the digital wax-up provided.',
        files: [{ id: 'file-2', name: 'digital-waxup.obj', type: 'model/obj', size: 8388608 }, { id: 'file-3', name: 'patient-photos.zip', type: 'application/zip', size: 20971520 }],
        trackingHistory: [
            { status: 'Submitted', date: '2024-07-22' },
            { status: 'In Lab', date: '2024-07-24' },
            { status: 'Shipped', date: '2024-07-29', notes: 'Tracking ID: BLUEDART789' },
        ],
    },
    {
        id: 'CASE-003', patientName: 'Priya Patel', caseType: 'Implant Abutment', shade: 'N/A', dueDate: '2024-08-05', labId: 'lab-1', labName: 'Precision Dental Labs', status: 'Completed', createdAt: '2024-07-18',
        notes: 'Custom abutment for Straumann BLX implant.',
        files: [],
        trackingHistory: [
            { status: 'Submitted', date: '2024-07-18' },
            { status: 'In Lab', date: '2024-07-20' },
            { status: 'Completed', date: '2024-07-26', notes: 'Delivered to clinic reception.' },
        ]
    },
];

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


// --- SUB-COMPONENTS ---

const CaseCard: React.FC<{ caseData: LabCase; onSelect: (id: string) => void; }> = ({ caseData, onSelect }) => {
    const statusStyles: Record<CaseStatus, string> = {
        Submitted: 'bg-blue-500/20 text-blue-300',
        'Pickup Scheduled': 'bg-cyan-500/20 text-cyan-300',
        'In Transit': 'bg-indigo-500/20 text-indigo-300',
        'In Lab': 'bg-yellow-500/20 text-yellow-300',
        Shipped: 'bg-purple-500/20 text-purple-300',
        Completed: 'bg-green-500/20 text-green-300',
        'On Hold': 'bg-red-500/20 text-red-300',
    };
    return (
        <div onClick={() => onSelect(caseData.id)} className="bg-surface-dark p-5 rounded-lg shadow-sm border border-border-dark cursor-pointer transition-all duration-200 aurora-border-glow">
            <div className="flex justify-between items-start">
                <div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[caseData.status]}`}>{caseData.status}</span>
                    <h3 className="text-lg font-bold text-text-primary-dark mt-2">{caseData.patientName}</h3>
                    <p className="text-sm text-text-secondary-dark">{caseData.caseType}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-text-primary-dark">{caseData.id}</p>
                    <p className="text-xs text-text-secondary-dark">{caseData.labName}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark text-sm text-text-secondary-dark flex justify-between items-center">
                <span>Due: <span className="font-medium text-text-primary-dark">{caseData.dueDate}</span></span>
                <span>Created: <span className="font-medium text-text-primary-dark">{caseData.createdAt}</span></span>
            </div>
        </div>
    );
};

const CaseTracker: React.FC<{ history: LabCase['trackingHistory'] }> = ({ history }) => {
    const statusIcons: Record<CaseStatus, React.ReactNode> = {
        Submitted: <Plus size={18} />, 'Pickup Scheduled': <Truck size={18} />, 'In Transit': <Hourglass size={18} />,
        'In Lab': <FlaskConical size={18} />, Shipped: <Truck size={18} className="scale-x-[-1]" />, Completed: <CheckCircle size={18} />, 'On Hold': <Clock size={18} />
    };
    return (
        <div className="bg-background-dark p-6 rounded-lg border border-border-dark">
            <h4 className="text-md font-bold text-text-primary-dark mb-6">Case History</h4>
            <div className="relative">
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border-dark"></div>
                {history.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 mb-6 last:mb-0">
                        <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${event.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-brand-primary/20 text-brand-primary'}`}>
                            {statusIcons[event.status]}
                        </div>
                        <div>
                            <p className="font-bold text-text-primary-dark">{event.status}</p>
                            <p className="text-sm text-text-secondary-dark">{event.date}</p>
                            {event.notes && <p className="text-xs italic text-slate-500 mt-1">{event.notes}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CaseDetailView: React.FC<{ caseData: LabCase; onBack: () => void; }> = ({ caseData, onBack }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [chatMessages, setChatMessages] = useState<{ sender: 'You' | 'Lab', text: string }[]>([
        { sender: 'Lab', text: 'Case received. We will begin production shortly.'}
    ]);
    const [chatInput, setChatInput] = useState('');

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { sender: 'You', text: chatInput.trim() }]);
        setChatInput('');
    };

    const renderFile = (file: LabFile) => {
        const is3DModel = file.name.endsWith('.stl') || file.name.endsWith('.obj');
        if (is3DModel) {
            return (
                <div className="p-4 bg-black rounded-lg text-center text-white cursor-pointer hover:opacity-90">
                    <p className="font-bold">{file.name}</p>
                    <p className="text-sm text-slate-400">Click to view 3D Model</p>
                    <p className="text-xs mt-2">(3D Viewer not implemented)</p>
                </div>
            );
        }
        return (
            <li key={file.id} className="flex items-center gap-3 p-2 bg-surface-dark rounded-md">
                <FileText className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <div className="flex-grow"><p className="font-medium text-text-primary-dark truncate">{file.name}</p><p className="text-xs text-text-secondary-dark">{formatBytes(file.size)}</p></div>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-semibold text-brand-secondary hover:underline">Download</a>
            </li>
        );
    }
    
    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-brand-primary hover:underline mb-4 font-semibold"><ChevronLeft size={20} /> Back to Dashboard</button>
            <div className="bg-surface-dark p-6 rounded-lg shadow-sm border border-border-dark mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary-dark">{caseData.patientName} <span className="text-xl font-normal text-text-secondary-dark">({caseData.id})</span></h2>
                        <p className="text-lg text-text-secondary-dark">{caseData.caseType}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-text-primary-dark">{caseData.labName}</p>
                        <p className="text-sm text-text-secondary-dark">Due: {caseData.dueDate}</p>
                    </div>
                </div>
            </div>
            
            <div className="border-b border-border-dark mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('details')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary-dark hover:border-slate-700'}`}>Case Details</button>
                    <button onClick={() => setActiveTab('chat')} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'chat' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary-dark hover:border-slate-700'}`}><MessageSquare size={16}/> Lab Chat</button>
                </nav>
            </div>

            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-background-dark p-6 rounded-lg border border-border-dark">
                            <h4 className="text-md font-bold text-text-primary-dark mb-4">Case Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-text-secondary-dark">Shade</p><p className="font-semibold text-text-primary-dark">{caseData.shade}</p></div>
                                <div><p className="text-text-secondary-dark">Current Status</p><p className="font-semibold text-text-primary-dark">{caseData.status}</p></div>
                                <div className="col-span-2"><p className="text-text-secondary-dark">Notes/Instructions</p><p className="font-semibold text-text-primary-dark whitespace-pre-wrap">{caseData.notes}</p></div>
                            </div>
                        </div>
                         <div className="bg-background-dark p-6 rounded-lg border border-border-dark">
                            <h4 className="text-md font-bold text-text-primary-dark mb-4">Attached Files</h4>
                            {caseData.files.length > 0 ? (
                                <ul className="space-y-3">{caseData.files.map(renderFile)}</ul>
                            ) : <p className="text-text-secondary-dark text-sm">No files were attached to this case.</p>}
                        </div>
                    </div>
                    <div className="lg:col-span-1"><CaseTracker history={caseData.trackingHistory} /></div>
                </div>
            )}
             {activeTab === 'chat' && (
                <div className="bg-surface-dark p-4 rounded-lg shadow-sm border border-border-dark">
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg max-w-sm ${msg.sender === 'You' ? 'bg-brand-primary text-white' : 'bg-background-dark text-text-primary-dark'}`}>{msg.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-dark flex items-center gap-2">
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} placeholder="Type a message to the lab..." className="flex-1 bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark"/>
                        <button onClick={handleSendChat} className="bg-brand-primary p-2 rounded-lg text-white"><Send /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

const NewCaseModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (newCase: LabCase) => void; labs: DentalLab[] }> = ({ isOpen, onClose, onSave, labs }) => {
    const [patientName, setPatientName] = useState('');
    const [caseType, setCaseType] = useState('');
    const [shade, setShade] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [labId, setLabId] = useState(labs[0]?.id || '');
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<LabFile[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ suggestions: string[], flags: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAnalyzeNotes = async () => {
        if (!notes.trim()) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const result = await analyzeLabCaseNotes(notes);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: `${Date.now()}-${file.name}`, name: file.name, type: file.type, size: file.size, fileObject: file,
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

    const handleSubmit = () => {
        if (!patientName || !caseType || !dueDate || !labId) return;
        const selectedLab = labs.find(l => l.id === labId);
        const newCase: LabCase = {
            id: `CASE-${String(Date.now()).slice(-4)}`, patientName, caseType, shade, dueDate, labId,
            labName: selectedLab?.name || 'Unknown Lab', status: 'Submitted', files, notes,
            createdAt: new Date().toISOString().split('T')[0],
            trackingHistory: [{ status: 'Submitted', date: new Date().toISOString().split('T')[0] }],
        };
        onSave(newCase);
        onClose();
    };

    const resetForm = useCallback(() => {
        setPatientName(''); setCaseType(''); setShade(''); setDueDate(''); setNotes(''); setFiles([]);
        setAnalysisResult(null);
        if (labs.length > 0) setLabId(labs[0].id);
    }, [labs]);
    
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-dark rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-border-dark max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-text-primary-dark">New Lab Case Submission</h2><button onClick={onClose} className="text-text-secondary-dark hover:text-white"><X size={24} /></button></div>
                <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Patient Name" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <input type="text" placeholder="Case Type (e.g., PFM Crown)" value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <input type="text" placeholder="Shade (e.g., A3)" value={shade} onChange={e => setShade(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <input type="date" placeholder="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <select value={labId} onChange={e => setLabId(e.target.value)} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary md:col-span-2"><option disabled value="">Select a Lab</option>{labs.map(lab => (<option key={lab.id} value={lab.id}>{lab.name}</option>))}</select>
                    </div>
                    <div>
                        <textarea placeholder="Notes & Instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                        <button onClick={handleAnalyzeNotes} disabled={isAnalyzing || !notes.trim()} className="mt-2 text-sm text-brand-secondary hover:text-amber-400 disabled:opacity-50 flex items-center gap-2">{isAnalyzing ? <Spinner/> : <Wand2 size={16}/>}AI Analyze Notes</button>
                        {analysisResult && <div className="mt-2 p-3 text-xs bg-brand-primary/10 border border-brand-primary/20 rounded-lg"><p className="font-bold text-brand-primary">AI Suggestions:</p><ul className="list-disc list-inside mt-1 text-text-secondary-dark">{analysisResult.suggestions.map((s,i) => <li key={i}>{s}</li>)}{analysisResult.flags.map((f,i)=><li key={i} className="text-yellow-400">{f}</li>)}</ul></div>}
                    </div>
                    <div onClick={() => fileInputRef.current?.click()} className="p-6 border-2 border-dashed border-border-dark rounded-lg text-center cursor-pointer hover:bg-background-dark/50 hover:border-brand-primary"><UploadCloud className="mx-auto w-10 h-10 text-text-secondary-dark" /><p className="mt-2 text-sm text-text-secondary-dark">Click to upload files (.stl, .obj, .pdf, images)</p></div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".stl,.obj,.ply,application/pdf,image/*" />
                    <div className="space-y-2">{files.map(file => (<div key={file.id} className="flex items-center gap-3 p-2 bg-background-dark rounded-md"><FileText className="w-5 h-5 text-brand-primary" /><p className="flex-grow text-sm text-text-primary-dark truncate">{file.name}</p><p className="text-xs text-text-secondary-dark">{formatBytes(file.size)}</p><button onClick={() => removeFile(file.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></div>))}</div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-border-dark mt-4">
                    <button type="button" onClick={onClose} className="bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 disabled:bg-teal-800 transition-colors">Submit Case</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export const DentaLabConnect: React.FC = () => {
    const [cases, setCases] = useState<LabCase[]>(mockCases);
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveCase = (newCase: LabCase) => {
        setCases(prev => [newCase, ...prev]);
    };

    const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId]);

    const renderDashboard = () => (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary-dark">Lab Case Dashboard</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-teal-500 flex items-center gap-2"><Plus size={20} />New Case</button>
            </div>
            {cases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map(c => <CaseCard key={c.id} caseData={c} onSelect={setSelectedCaseId} />)}
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-surface-dark rounded-lg border-2 border-dashed border-border-dark">
                    <FlaskConical className="mx-auto h-12 w-12 text-text-secondary-dark" />
                    <h3 className="mt-2 text-xl font-semibold text-text-primary-dark">No Lab Cases Found</h3>
                    <p className="mt-1 text-text-secondary-dark">Click "New Case" to get started.</p>
                </div>
            )}
            <NewCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveCase} labs={mockLabs} />
        </>
    );

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            {selectedCase ? (
                <CaseDetailView caseData={selectedCase} onBack={() => setSelectedCaseId(null)} />
            ) : (
                renderDashboard()
            )}
        </div>
    );
};