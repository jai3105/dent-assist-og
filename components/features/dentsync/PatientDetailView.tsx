
import React, { useState, useMemo } from 'react';
import { Patient, ActionType, BillingStatus, ICONS, PREDEFINED_SHORTCUTS, Prescription, PrescriptionStatus, CaseNote, TreatmentPlanItem, BillingEntry, DENTAL_CONDITIONS, DentalChartData, TOOTH_IDs, PEDO_TOOTH_IDs, Document } from './data';
import { useAppContext, Modal } from './common';
import { generatePatientCommunication, generateSoapNote } from '../../../services/geminiService';
import { Spinner } from '../../common/Spinner';
import { Copy, Wand2 } from 'lucide-react';

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error); reader.readAsDataURL(file);
    });
};

const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary";
const labelClass = "block text-sm font-medium text-text-secondary-dark mb-1";

// --- Tab Components & Forms ---

// OVERVIEW TAB
const InfoItem: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-3"><div className="text-brand-primary mt-1">{icon}</div><div>
        <p className="text-sm font-medium text-text-secondary-dark">{label}</p>
        <div className="text-base text-text-primary-dark">{value || 'N/A'}</div>
    </div></div>
);

const AiCommModal: React.FC<{ isOpen: boolean, onClose: () => void, patientName: string, type: 'reminder' | 'post-op' }> = ({ isOpen, onClose, patientName, type }) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            const generateMessage = async () => {
                setIsLoading(true);
                setMessage('');
                const result = await generatePatientCommunication(type, patientName);
                setMessage(result);
                setIsLoading(false);
            };
            generateMessage();
        }
    }, [isOpen, type, patientName]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`AI Generated ${type === 'reminder' ? 'Reminder' : 'Post-Op Message'}`}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8"><Spinner /><p className="mt-4 text-text-secondary-dark">Generating message...</p></div>
            ) : (
                <div className="space-y-4">
                    <textarea value={message} readOnly rows={8} className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-text-primary-dark whitespace-pre-wrap"></textarea>
                    <div className="flex justify-end"><button onClick={handleCopy} className="flex items-center gap-2 bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-600"><Copy size={16}/> Copy Text</button></div>
                </div>
            )}
        </Modal>
    );
};


export const OverviewTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiCommType, setAiCommType] = useState<'reminder' | 'post-op'>('reminder');

    const openAiComm = (type: 'reminder' | 'post-op') => {
        setAiCommType(type);
        setIsAiModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div><h3 className="text-lg font-semibold text-text-primary-dark mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <InfoItem label="First Name" value={patient.firstName} icon={ICONS.user} />
                    <InfoItem label="Last Name" value={patient.lastName} icon={ICONS.user} />
                    <InfoItem label="Date of Birth" value={patient.dateOfBirth} icon={ICONS.appointments} />
                    <InfoItem label="Gender" value={patient.gender} icon={ICONS.user} />
                    <InfoItem label="Phone" value={patient.phone} icon={ICONS.phone} />
                    <InfoItem label="Email" value={patient.email} icon={ICONS.patientRecord} />
                    <div className="md:col-span-2"><InfoItem label="Address" value={patient.address} icon={ICONS.clinic} /></div>
                </div>
            </div>
             <div><h3 className="text-lg font-semibold text-text-primary-dark mb-4">Medical History</h3>
                <div className="space-y-2 text-sm p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-200">
                    <p><strong className="font-medium">Allergies:</strong> {patient.medicalHistory.allergies || 'None reported'}</p>
                    <p><strong className="font-medium">Conditions:</strong> {patient.medicalHistory.conditions || 'None reported'}</p>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-text-primary-dark mb-4">AI Patient Communication</h3>
                <div className="flex gap-4">
                    <button onClick={() => openAiComm('reminder')} className="bg-blue-500/20 text-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-blue-500/30">Generate Reminder</button>
                    <button onClick={() => openAiComm('post-op')} className="bg-purple-500/20 text-purple-300 font-semibold py-2 px-4 rounded-lg hover:bg-purple-500/30">Generate Post-Op Care</button>
                </div>
            </div>
            <AiCommModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} patientName={patient.firstName} type={aiCommType} />
        </div>
    );
};

// DENTAL CHART TAB
const DentalArch: React.FC<{ toothIds: string[]; chartData: DentalChartData; onToothClick: (toothId: string) => void; }> = ({ toothIds, chartData, onToothClick }) => (
    <div className="flex flex-row"><svg width="0" height="0"><defs>{Object.entries(DENTAL_CONDITIONS).map(([key, value]) => <symbol key={key} id={`tooth-${key}`} viewBox="0 0 100 150"><path d="M20,10 C20,0 80,0 80,10 L90,80 C90,90 70,140 50,140 C30,140 10,90 10,80 Z" fill={value.hex} /></symbol>)}</defs></svg>
        {toothIds.map(id => {
            const condition = chartData[id]?.condition || 'Healthy';
            return (<div key={id} onClick={() => onToothClick(id)} className="w-10 h-16 m-1 cursor-pointer flex flex-col items-center justify-center group">
                <span className="text-xs font-semibold text-text-secondary-dark">{id}</span>
                <svg viewBox="0 0 100 150" className="w-full h-full stroke-slate-600 stroke-2 group-hover:stroke-brand-primary transition-all"><use href={`#tooth-${condition}`} /></svg>
            </div>);
        })}
    </div>
);

export const DentalChartTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext();
    const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'permanent' | 'pedo'>('permanent');

    const handleSaveToothData = (data: DentalChartData[string]) => {
        if (!selectedTooth) return;
        dispatch({ type: ActionType.UPDATE_DENTAL_CHART, payload: { patientId: patient.id, chartData: { ...patient.dentalChart, [selectedTooth]: data } } });
        setSelectedTooth(null);
    };

    return (<div className="space-y-6">
        <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-text-primary-dark">Interactive Dental Chart</h3>
            <div className="flex items-center p-1 bg-background-dark rounded-lg border border-border-dark"><button onClick={() => setChartType('permanent')} className={`px-3 py-1 text-sm font-semibold rounded-md ${chartType === 'permanent' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}>Permanent</button><button onClick={() => setChartType('pedo')} className={`px-3 py-1 text-sm font-semibold rounded-md ${chartType === 'pedo' ? 'bg-surface-dark text-brand-primary shadow' : 'text-text-secondary-dark'}`}>Pediatric</button></div>
        </div>
        <div className="flex flex-col items-center p-4 bg-background-dark rounded-lg overflow-x-auto">
            {chartType === 'permanent' ? (<><div className="flex justify-center"><DentalArch toothIds={TOOTH_IDs.upperRight} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /><div className="w-2 border-r-2 border-slate-700 mx-1"></div><DentalArch toothIds={TOOTH_IDs.upperLeft} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /></div><div className="h-6"></div><div className="flex justify-center"><DentalArch toothIds={TOOTH_IDs.lowerRight} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /><div className="w-2 border-r-2 border-slate-700 mx-1"></div><DentalArch toothIds={TOOTH_IDs.lowerLeft} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /></div></>) : (<><div className="flex justify-center"><DentalArch toothIds={PEDO_TOOTH_IDs.upperRight} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /><div className="w-2 border-r-2 border-slate-700 mx-1"></div><DentalArch toothIds={PEDO_TOOTH_IDs.upperLeft} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /></div><div className="h-6"></div><div className="flex justify-center"><DentalArch toothIds={PEDO_TOOTH_IDs.lowerRight} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /><div className="w-2 border-r-2 border-slate-700 mx-1"></div><DentalArch toothIds={PEDO_TOOTH_IDs.lowerLeft} chartData={patient.dentalChart} onToothClick={setSelectedTooth} /></div></>)}
        </div>
        <Modal isOpen={!!selectedTooth} onClose={() => setSelectedTooth(null)} title={`Edit Tooth #${selectedTooth}`}>
            {selectedTooth && <EditToothModal currentData={patient.dentalChart?.[selectedTooth] || { condition: 'Healthy', notes: '' }} onSave={handleSaveToothData} />}
        </Modal>
    </div>);
};

const EditToothModal: React.FC<{ currentData: DentalChartData[string]; onSave: (data: DentalChartData[string]) => void; }> = ({ currentData, onSave }) => {
  const [condition, setCondition] = useState(currentData.condition);
  const [notes, setNotes] = useState(currentData.notes);
  return (<div className="space-y-4">
        <div><label htmlFor="condition" className={labelClass}>Condition</label><select id="condition" value={condition} onChange={e => setCondition(e.target.value as any)} className={inputClass}>{Object.keys(DENTAL_CONDITIONS).map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
        <div><label htmlFor="notes" className={labelClass}>Notes</label><textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className={inputClass} /></div>
        <div className="flex justify-end gap-3 pt-4"><button onClick={() => onSave({ condition, notes })} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500">Save</button></div>
    </div>);
};


// TREATMENT PLAN TAB
export const TreatmentPlanTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext(); const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TreatmentPlanItem | undefined>(undefined);
    const handleOpenModal = (item?: TreatmentPlanItem) => { setEditingItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setEditingItem(undefined); setIsModalOpen(false); };
    const handleDelete = (itemId: string) => { if (window.confirm('Delete this plan item?')) { dispatch({ type: ActionType.DELETE_TREATMENT_PLAN_ITEM, payload: { patientId: patient.id, itemId } }); } };
    const handleAddToBill = (item: TreatmentPlanItem) => {
        if (item.isBilled) { alert("This item has already been billed."); return; }
        const newBillingEntry: BillingEntry = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], description: `${item.procedure} (Tooth #${item.tooth || 'N/A'})`, amount: item.cost, status: BillingStatus.Pending };
        dispatch({ type: ActionType.ADD_BILLING, payload: { patientId: patient.id, billing: newBillingEntry, treatmentPlanItemId: item.id } });
    }
    return (<div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-text-primary-dark">Treatment Plan</h3><button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white">{ICONS.add} Add Plan Item</button></div>
        {patient.treatmentPlan?.length > 0 ? (<div className="overflow-x-auto"><table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary-dark uppercase bg-background-dark"><tr><th className="px-4 py-2">Procedure</th><th className="px-4 py-2">Tooth</th><th className="px-4 py-2">Cost (₹)</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-center">Actions</th></tr></thead>
            <tbody className="text-text-secondary-dark">{patient.treatmentPlan.map(item => (<tr key={item.id} className="border-b border-border-dark"><td className="px-4 py-2 font-medium flex items-center gap-2">{item.procedure}{item.isBilled && <span title="Billed">{ICONS.check}</span>}</td><td className="px-4 py-2">{item.tooth||'N/A'}</td><td className="px-4 py-2">₹{item.cost.toFixed(2)}</td><td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${ {Planned:'bg-blue-900/50 text-blue-300','In Progress':'bg-yellow-900/50 text-yellow-300',Completed:'bg-green-900/50 text-green-300','On Hold':'bg-gray-700 text-gray-300'}[item.status]}`}>{item.status}</span></td><td className="px-4 py-2 text-center"><div className="flex justify-center items-center gap-1">{item.status==='Completed' && (<button onClick={()=>handleAddToBill(item)} className={`p-1 ${item.isBilled?'text-slate-600 cursor-not-allowed':'text-green-400 hover:text-green-300'}`} title={item.isBilled?"Billed":"Add to Bill"} disabled={item.isBilled}>{ICONS.addFile}</button>)}<button onClick={()=>handleOpenModal(item)} className="p-1 text-text-secondary-dark hover:text-brand-primary" title="Edit">{ICONS.edit}</button><button onClick={()=>handleDelete(item.id)} className="p-1 text-text-secondary-dark hover:text-red-500" title="Delete">{ICONS.trash}</button></div></td></tr>))}</tbody>
        </table></div>) : (<p className="text-center text-text-secondary-dark py-8">No treatment plan items found.</p>)}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem?'Edit Plan Item':'Add Plan Item'}><TreatmentPlanForm patientId={patient.id} onSuccess={handleCloseModal} onCancel={handleCloseModal} initialData={editingItem} /></Modal>
    </div>);
};
const TreatmentPlanForm: React.FC<{ patientId: string; onSuccess:()=>void; onCancel:()=>void; initialData?: TreatmentPlanItem; }> = ({ patientId, onSuccess, onCancel, initialData }) => {
    const { dispatch } = useAppContext(); const [formData, setFormData] = useState({ procedure:initialData?.procedure||'', tooth:initialData?.tooth||'', cost:initialData?.cost.toString()||'', status:initialData?.status||'Planned', date:initialData?.date||new Date().toISOString().split('T')[0] });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p=>({...p,[e.target.name]:e.target.value}));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); if (!formData.procedure || !formData.cost) return;
        const planItem: TreatmentPlanItem = { id:initialData?.id||Date.now().toString(), ...formData, status:formData.status as any, cost:parseFloat(formData.cost), isBilled:initialData?.isBilled||false };
        dispatch({type:initialData?ActionType.UPDATE_TREATMENT_PLAN_ITEM:ActionType.ADD_TREATMENT_PLAN_ITEM, payload:{patientId,item:planItem}}); onSuccess();
    };
    return (<form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label htmlFor="procedure" className={labelClass}>Procedure</label><input type="text" name="procedure" value={formData.procedure} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="tooth" className={labelClass}>Tooth # (optional)</label><input type="text" name="tooth" value={formData.tooth} onChange={handleChange} className={inputClass} /></div>
        <div><label htmlFor="cost" className={labelClass}>Cost (₹)</label><input type="number" name="cost" value={formData.cost} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="date" className={labelClass}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="status" className={labelClass}>Status</label><select name="status" value={formData.status} onChange={handleChange} className={inputClass}><option>Planned</option><option>In Progress</option><option>Completed</option><option>On Hold</option></select></div>
    </div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onCancel} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">Save Item</button></div></form>);
};

// PRESCRIPTIONS TAB
export const PrescriptionsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext(); const [isModalOpen, setIsModalOpen] = useState(false); const [editing, setEditing] = useState<Prescription|undefined>(undefined);
    const handleOpenModal = (p?:Prescription) => { setEditing(p); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditing(undefined); };
    const handleDelete = (id:string) => { if(window.confirm('Delete prescription?')) { dispatch({ type:ActionType.DELETE_PRESCRIPTION, payload:{patientId:patient.id, prescriptionId:id}}); }};
    return (<div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-text-primary-dark">Prescriptions</h3><button onClick={()=>handleOpenModal()} className="flex items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white">{ICONS.add} Add Prescription</button></div>
        {patient.prescriptions?.length > 0 ? (<div className="space-y-4">{patient.prescriptions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(p => (
            <div key={p.id} className="p-4 bg-background-dark rounded-lg border border-border-dark"><div className="flex justify-between items-start"><div>
                <p className="font-bold text-md text-brand-primary flex items-center gap-2">{ICONS.prescription} {p.medication}<span className="text-xs px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full">{p.drugType}</span></p>
                <p className="text-sm text-text-secondary-dark">{p.dosage} &bull; {p.frequency}</p></div>
                <div className="flex items-center gap-2"><span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status==='Active'?'bg-green-900/50 text-green-300':'bg-slate-700 text-slate-300'}`}>{p.status}</span><button onClick={()=>handleOpenModal(p)} className="p-1 text-text-secondary-dark hover:text-brand-primary">{ICONS.edit}</button><button onClick={()=>handleDelete(p.id)} className="p-1 text-text-secondary-dark hover:text-red-500">{ICONS.trash}</button></div>
            </div><div className="mt-3 pt-3 border-t border-border-dark text-sm space-y-1 text-text-secondary-dark"><p><strong>Duration:</strong> {p.duration||'N/A'}</p><p><strong>Instructions:</strong> {p.instructions||'N/A'}</p><p><strong>Dates:</strong> {p.startDate} to {p.endDate||'Ongoing'}</p></div></div>
        ))}</div>) : <p className="text-center text-text-secondary-dark py-8">No prescriptions found.</p>}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editing?'Edit Prescription':'Add New Prescription'}><PrescriptionForm patientId={patient.id} onSuccess={handleCloseModal} initialData={editing}/></Modal>
    </div>);
};
const PrescriptionForm: React.FC<{ patientId:string; onSuccess:()=>void; initialData?:Prescription; }> = ({patientId, onSuccess, initialData}) => {
    const {state, dispatch} = useAppContext(); const [formData, setFormData] = useState<Omit<Prescription,'id'>>({medication:initialData?.medication||'',dosage:initialData?.dosage||'',frequency:initialData?.frequency||'',drugType:initialData?.drugType||'Analgesic',duration:initialData?.duration||'',route:initialData?.route||'Oral',instructions:initialData?.instructions||'',advice:initialData?.advice||'',doctor:initialData?.doctor||'',status:initialData?.status||PrescriptionStatus.Active,startDate:initialData?.startDate||new Date().toISOString().split('T')[0],endDate:initialData?.endDate||''});
    const sc = state.shortcuts.filter((s):s is Extract<typeof s, {category:'prescriptions'}> => s.category==='prescriptions');
    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setFormData(p=>({...p,[e.target.name]:e.target.value}));
    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault(); if(!formData.medication)return;
        const newP: Prescription = {id:initialData?.id||Date.now().toString(),...formData};
        dispatch({type:initialData?ActionType.UPDATE_PRESCRIPTION:ActionType.ADD_PRESCRIPTION,payload:{patientId,prescription:newP}}); onSuccess();
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><span className="text-xs text-text-secondary-dark">Shortcuts:</span><div className="flex flex-wrap gap-2 mt-1">{sc.map(s=>(<button type="button" key={s.id} onClick={()=>setFormData(p=>({...p,...s.value}))} className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs hover:bg-brand-primary/40">{s.value.medication}</button>))}</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className={labelClass}>Medication</label><input type="text" name="medication" value={formData.medication} onChange={handleChange} required className={inputClass}/></div>
            <div><label className={labelClass}>Drug Type</label><input type="text" name="drugType" value={formData.drugType} onChange={handleChange} className={inputClass} placeholder="e.g., Antibiotic"/></div>
            <div><label className={labelClass}>Dosage</label><input type="text" name="dosage" value={formData.dosage} onChange={handleChange} className={inputClass} placeholder="e.g., 500mg"/></div>
            <div><label className={labelClass}>Frequency</label><input type="text" name="frequency" value={formData.frequency} onChange={handleChange} className={inputClass} placeholder="e.g., Twice a day"/></div>
            <div><label className={labelClass}>Duration</label><input type="text" name="duration" value={formData.duration} onChange={handleChange} className={inputClass} placeholder="e.g., 7 days"/></div>
            <div className="md:col-span-2"><label className={labelClass}>Instructions</label><textarea name="instructions" value={formData.instructions} onChange={handleChange} rows={2} className={inputClass} placeholder="e.g., After meals"></textarea></div>
            <div><label className={labelClass}>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className={inputClass}/></div>
            <div><label className={labelClass}>End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass}/></div>
            <div><label className={labelClass}>Status</label><select name="status" value={formData.status} onChange={handleChange} className={inputClass}>{Object.values(PrescriptionStatus).map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        </div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">Save Prescription</button></div>
    </form>);
};

// BILLING TAB
export const BillingTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext(); const [isModalOpen, setIsModalOpen] = useState(false); const [editingEntry, setEditingEntry] = useState<BillingEntry|undefined>(undefined);
    const handleOpenModal = (entry?:BillingEntry) => { setEditingEntry(entry); setIsModalOpen(true); };
    const handleCloseModal = () => { setEditingEntry(undefined); setIsModalOpen(false); };
    const handleUpdateStatus = (id:string, status:BillingStatus) => dispatch({type:ActionType.UPDATE_BILLING, payload:{patientId:patient.id, billingId:id, status}});
    return (<div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-text-primary-dark">Billing History</h3><button onClick={()=>handleOpenModal()} className="flex items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white">{ICONS.add} Add Entry</button></div>
        {patient.billing.length > 0 ? (<ul className="space-y-2">{patient.billing.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(b=>(
            <li key={b.id} className="flex flex-wrap justify-between items-center p-3 bg-background-dark rounded-md gap-2 border border-border-dark"><div><p className="font-medium text-text-primary-dark">{b.description}</p><p className="text-xs text-text-secondary-dark">{b.date}</p></div>
            <div className="flex items-center gap-4"><span className="font-semibold text-text-primary-dark">₹{b.amount.toFixed(2)}</span><span className={`px-2 py-1 text-xs font-medium rounded-full ${b.status===BillingStatus.Paid?'bg-green-900/50 text-green-300':'bg-amber-900/50 text-amber-300'}`}>{b.status}</span>{b.status===BillingStatus.Pending && (<button onClick={()=>handleUpdateStatus(b.id,BillingStatus.Paid)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Mark as Paid</button>)}<button onClick={()=>handleOpenModal(b)} className="text-text-secondary-dark hover:text-brand-primary p-1" title="Edit">{ICONS.edit}</button></div></li>
        ))}</ul>) : <p className="text-center text-text-secondary-dark py-4">No billing entries found.</p>}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEntry?'Edit Billing Entry':'Add Billing Entry'} size="md"><BillingEntryForm patientId={patient.id} onSuccess={handleCloseModal} initialData={editingEntry} /></Modal>
    </div>);
};
const BillingEntryForm: React.FC<{ patientId:string; onSuccess:()=>void; initialData?:BillingEntry; }> = ({patientId, onSuccess, initialData}) => {
    const {state, dispatch} = useAppContext(); const [formData, setFormData] = useState({date:initialData?.date||new Date().toISOString().split('T')[0],description:initialData?.description||'',amount:initialData?.amount.toString()||''});
    const billingShortcuts = state.shortcuts.filter((s):s is Extract<typeof s,{category:'billing'}> => s.category==='billing');
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p=>({...p,[e.target.name]:e.target.value}));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); if(!formData.description||!formData.amount)return;
        if(initialData) { dispatch({type:ActionType.UPDATE_BILLING_ITEM,payload:{patientId,billingItem:{...initialData,...formData,amount:parseFloat(formData.amount)}}}); }
        else { dispatch({type:ActionType.ADD_BILLING,payload:{patientId,billing:{id:Date.now().toString(),...formData,amount:parseFloat(formData.amount),status:BillingStatus.Pending}}}); }
        onSuccess();
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><label className={labelClass}>Shortcuts:</label><div className="flex flex-wrap gap-2 mt-1">{PREDEFINED_SHORTCUTS.billing.map(sc=>(<button type="button" key={sc} onClick={()=>setFormData(p=>({...p,description:sc}))} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs hover:bg-slate-600">{sc}</button>))
        }{billingShortcuts.map(sc=>(<button type="button" key={sc.id} onClick={()=>setFormData(p=>({...p,description:sc.value.description,amount:sc.value.amount?sc.value.amount.toString():p.amount}))} className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs hover:bg-brand-primary/40">{sc.value.description}</button>))}</div></div>
        <div><label htmlFor="date" className={labelClass}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass}/></div>
        <div><label htmlFor="description" className={labelClass}>Description</label><input type="text" name="description" value={formData.description} onChange={handleChange} required className={inputClass}/></div>
        <div><label htmlFor="amount" className={labelClass}>Amount (₹)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className={inputClass}/></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">Save</button></div>
    </form>);
};

// NOTES TAB
const NoteList: React.FC<{title:string; notes:CaseNote[]; onAdd:()=>void; onAiScribe: () => void}> = ({title,notes,onAdd, onAiScribe}) => (<div className="mb-6">
    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-text-primary-dark">{title}</h3>
    <div className="flex items-center gap-2">
        {title === 'Case Notes' && <button onClick={onAiScribe} className="flex items-center gap-2 rounded-md bg-brand-secondary/20 text-brand-secondary px-3 py-1.5 text-sm font-semibold hover:bg-brand-secondary/30">{<Wand2 size={16}/>} AI Scribe</button>}
        <button onClick={onAdd} className="flex items-center gap-2 rounded-md bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white">{ICONS.add} Add Note</button>
    </div>
    </div>
    {notes.length>0?(<ul className="space-y-3 max-h-64 overflow-y-auto pr-2">{notes.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(n=>(<li key={n.id} className="p-3 bg-background-dark rounded-md border border-border-dark"><p className="text-xs font-semibold text-text-secondary-dark mb-1">{n.date}</p><p className="text-sm text-text-primary-dark whitespace-pre-wrap">{n.note}</p></li>))}</ul>):<p className="text-center text-text-secondary-dark py-4 text-sm">No entries found.</p>}
</div>);

export const CaseNotesTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { state, dispatch } = useAppContext(); 
    const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false); 
    const [isAiScribeModalOpen, setAiScribeModalOpen] = useState(false);
    const [noteType, setNoteType] = useState<'case'|'general'>('case');

    const openAddNoteModal = (type:'case'|'general') => { setNoteType(type); setAddNoteModalOpen(true); };

    return (<div className="space-y-6">
        <NoteList title="Case Notes" notes={patient.caseNotes} onAdd={()=>openAddNoteModal('case')} onAiScribe={() => setAiScribeModalOpen(true)} />
        <NoteList title="General Notes" notes={patient.generalNotes} onAdd={()=>openAddNoteModal('general')} onAiScribe={() => {}}/>
        <Modal isOpen={isAddNoteModalOpen} onClose={()=>setAddNoteModalOpen(false)} title={`Add ${noteType==='case'?'Case Note':'General Note'}`}>
            <AddNoteForm patientId={patient.id} onSuccess={()=>setAddNoteModalOpen(false)} noteType={noteType} />
        </Modal>
        <Modal isOpen={isAiScribeModalOpen} onClose={()=>setAiScribeModalOpen(false)} title="AI Case Note Scribe">
            <AiScribeForm patientId={patient.id} onSuccess={()=>setAiScribeModalOpen(false)} />
        </Modal>
    </div>);
};
const AddNoteForm: React.FC<{patientId:string; onSuccess:()=>void; noteType:'case'|'general'}> = ({patientId, onSuccess, noteType}) => {
    const {state, dispatch} = useAppContext(); const [note, setNote] = useState('');
    const noteShortcuts = state.shortcuts.filter((s):s is Extract<typeof s, {category:'notes'}> => s.category==='notes');
    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault(); if(!note.trim())return;
        const newNote:CaseNote = {id:Date.now().toString(), date:new Date().toISOString().split('T')[0], note:note.trim()};
        dispatch({type:noteType==='case'?ActionType.ADD_CASE_NOTE:ActionType.ADD_GENERAL_NOTE, payload:{patientId, [noteType==='case'?'caseNote':'note']:newNote} as any}); onSuccess();
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="note" className={labelClass}>Note</label><textarea id="note" value={note} onChange={e=>setNote(e.target.value)} required rows={5} className={inputClass}/></div>
        <div><span className="text-xs text-text-secondary-dark">Shortcuts:</span><div className="flex flex-wrap gap-2 mt-1">{PREDEFINED_SHORTCUTS.notes.map(sc=>(<button type="button" key={sc} onClick={()=>setNote(p=>`${p}${p?' ':''}${sc}`)} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs hover:bg-slate-600">{sc}</button>))
        }{noteShortcuts.map(sc=>(<button type="button" key={sc.id} onClick={()=>setNote(p=>`${p}${p?' ':''}${sc.value}`)} className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs hover:bg-brand-primary/40">{sc.value}</button>))}</div></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">Save Note</button></div>
    </form>);
};

const AiScribeForm: React.FC<{patientId: string; onSuccess: ()=>void}> = ({patientId, onSuccess}) => {
    const { dispatch } = useAppContext();
    const [brief, setBrief] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [soapNote, setSoapNote] = useState('');

    const handleGenerate = async () => {
        if (!brief.trim()) return;
        setIsLoading(true);
        setSoapNote('');
        const result = await generateSoapNote(brief);
        setSoapNote(result);
        setIsLoading(false);
    };

    const handleSave = () => {
        if (!soapNote) return;
        const newNote: CaseNote = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], note: soapNote };
        dispatch({ type: ActionType.ADD_CASE_NOTE, payload: { patientId, caseNote: newNote } });
        onSuccess();
    };

    return (
        <div className="space-y-4">
            <div><label htmlFor="brief" className={labelClass}>Brief Clinical Note</label><textarea id="brief" value={brief} onChange={e=>setBrief(e.target.value)} rows={3} className={inputClass} placeholder="e.g., MOD composite #30, A2 shade, pt tolerated well"/></div>
            <button onClick={handleGenerate} disabled={isLoading || !brief.trim()} className="flex items-center gap-2 rounded-md bg-brand-secondary/20 text-brand-secondary px-3 py-1.5 text-sm font-semibold hover:bg-brand-secondary/30 disabled:opacity-50">{isLoading ? <Spinner /> : <Wand2 size={16} />} Generate SOAP Note</button>
            {soapNote && <div><label className={labelClass}>Generated Note</label><textarea value={soapNote} onChange={e => setSoapNote(e.target.value)} rows={8} className={`${inputClass} whitespace-pre-wrap`}/></div>}
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="button" onClick={handleSave} disabled={!soapNote} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">Save Note</button></div>
        </div>
    );
};


// DOCUMENTS TAB
export const DocumentsTab: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { dispatch } = useAppContext(); const [isUploading, setIsUploading] = useState(false);
    const handleFileChange = async (event:React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) { setIsUploading(true); const files = Array.from(event.target.files);
            for (const file of files) { try { const newDoc:Document = { id:`${Date.now()}-${file.name}`, name:file.name, type:file.type, size:file.size, url:await readFileAsDataURL(file), uploadedAt:new Date().toISOString() }; dispatch({ type:ActionType.ADD_DOCUMENT, payload:{patientId:patient.id, document:newDoc}}); } catch(e) {console.error(e);} }
            setIsUploading(false); event.target.value = '';
        }
    };
    const handleDelete = (docId:string) => { if (window.confirm("Delete this document?")) { dispatch({ type:ActionType.DELETE_DOCUMENT, payload:{patientId:patient.id, documentId:docId}}); }};
    return (<div><h3 className="text-lg font-semibold text-text-primary-dark mb-4">Patient Documents</h3>
        <div className="mb-6 p-6 border-2 border-dashed border-border-dark rounded-lg text-center bg-background-dark"><label htmlFor="file-upload" className="cursor-pointer font-semibold text-brand-primary flex flex-col items-center justify-center">
            <div className="w-12 h-12 text-brand-secondary">{ICONS.addFile}</div>
            <span className="mt-2 text-sm">{isUploading?'Uploading...':'Select files to upload'}</span>
            <span className="mt-1 text-xs text-text-secondary-dark font-normal">X-Rays, Reports, Consent forms etc.</span>
            <input type="file" multiple onChange={handleFileChange} disabled={isUploading} className="hidden" id="file-upload"/>
        </label></div>
        {patient.documents?.length > 0 ? (<div className="space-y-3">{patient.documents.map(doc=>(<div key={doc.id} className="flex flex-wrap justify-between items-center p-3 bg-background-dark rounded-md gap-2 border border-border-dark">
            <div className="flex items-center gap-3"><div className="text-brand-primary">{ICONS.notes}</div><div><p className="font-medium text-text-primary-dark break-all">{doc.name}</p><p className="text-xs text-text-secondary-dark">{new Date(doc.uploadedAt).toLocaleDateString()} &bull; {formatBytes(doc.size)}</p></div></div>
            <div className="flex items-center gap-2 flex-shrink-0"><a href={doc.url} download={doc.name} className="p-2 text-text-secondary-dark hover:text-brand-primary" title="Download">{ICONS.pdf}</a><button onClick={()=>handleDelete(doc.id)} className="p-2 text-text-secondary-dark hover:text-red-500" title="Delete">{ICONS.trash}</button></div>
        </div>))}</div>) : (<p className="text-center text-text-secondary-dark py-8">No documents uploaded.</p>)}
    </div>);
};
