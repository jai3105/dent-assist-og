
import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Patient, ActionType, BillingStatus, ICONS, ROUTES, exportPatientToPDF, exportPatientToWhatsAppMessage } from './data';
import { useAppContext, Modal } from './common';
import { OverviewTab, DentalChartTab, TreatmentPlanTab, PrescriptionsTab, BillingTab, CaseNotesTab, DocumentsTab } from './PatientDetailView';

// --- Reusable Form Component for this Page ---

const PatientForm: React.FC<{ onSuccess: (patient: Patient) => void; onClose: () => void; initialData?: Patient; }> = ({ onSuccess, onClose, initialData }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '', lastName: initialData?.lastName || '', dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || 'Other', phone: initialData?.phone || '', email: initialData?.email || '',
    address: initialData?.address || '', allergies: initialData?.medicalHistory?.allergies || '', conditions: initialData?.medicalHistory?.conditions || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phone) {
        alert('Please fill all required fields.'); return;
    }
    const patientData: Patient = {
        id: initialData?.id || Date.now().toString(),
        firstName: formData.firstName, lastName: formData.lastName, dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'Male' | 'Female' | 'Other', phone: formData.phone, email: formData.email, address: formData.address,
        medicalHistory: { allergies: formData.allergies, conditions: formData.conditions },
        dentalChart: initialData?.dentalChart || {}, treatmentPlan: initialData?.treatmentPlan || [], caseNotes: initialData?.caseNotes || [],
        generalNotes: initialData?.generalNotes || [], prescriptions: initialData?.prescriptions || [], billing: initialData?.billing || [], documents: initialData?.documents || [],
    };
    dispatch({ type: initialData ? ActionType.UPDATE_PATIENT : ActionType.ADD_PATIENT, payload: patientData });
    onSuccess(patientData);
  };
  
  const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary";
  const labelClass = "block text-sm font-medium text-text-secondary-dark";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-text-primary-dark">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label htmlFor="firstName" className={labelClass}>First Name <span className="text-red-500">*</span></label><input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="lastName" className={labelClass}>Last Name <span className="text-red-500">*</span></label><input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="dateOfBirth" className={labelClass}>Date of Birth <span className="text-red-500">*</span></label><input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="gender" className={labelClass}>Gender</label><select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={inputClass}><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><label htmlFor="phone" className={labelClass}>Phone <span className="text-red-500">*</span></label><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className={inputClass} /></div>
        <div><label htmlFor="email" className={labelClass}>Email Address</label><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
        <div className="md:col-span-2"><label htmlFor="address" className={labelClass}>Address</label><textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={2} className={inputClass}></textarea></div>
        <div className="md:col-span-2"><h4 className={`${labelClass} mb-2`}>Medical History</h4><div className="space-y-2"><textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Allergies..." className={inputClass}></textarea><textarea name="conditions" value={formData.conditions} onChange={handleChange} rows={2} placeholder="Ongoing conditions..." className={inputClass}></textarea></div></div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="bg-border-dark text-text-primary-dark font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-500 transition-colors flex items-center gap-2">{ICONS.add} Save Patient</button>
      </div>
    </form>
  );
};

// --- Reusable Report Modals for this Page ---

const PrintReportModal: React.FC<{ isOpen: boolean; onClose: () => void; patient: Patient; clinicName: string; }> = ({ isOpen, onClose, patient, clinicName }) => {
  const [sections, setSections] = useState({ dentalChart: true, treatmentPlan: true, prescriptions: true, billing: true });
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => setSections(p => ({ ...p, [e.target.name]: e.target.checked }));
  const handlePrint = () => exportPatientToPDF(patient, clinicName, sections);
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Patient Report" size="md">
      <div className="space-y-4 text-text-primary-dark">
        <p>Select sections for the PDF report.</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(sections).map(key => (
            <label key={key} className="flex items-center space-x-2 bg-background-dark p-2 rounded-md"><input type="checkbox" name={key} checked={sections[key as keyof typeof sections]} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-border-dark text-brand-primary focus:ring-brand-primary bg-background-dark" /><span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span></label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button onClick={handlePrint} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">{ICONS.print} Generate PDF</button></div>
      </div>
    </Modal>
  );
};

const WhatsAppReportModal: React.FC<{isOpen: boolean; onClose: () => void; patient: Patient; clinicName: string; clinicContactNumber: string;}> = ({ isOpen, onClose, patient, clinicName, clinicContactNumber }) => {
  const { state } = useAppContext();
  const [sections, setSections] = useState({ treatmentPlan: true, prescriptions: true, billing: true });
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => setSections(p => ({ ...p, [e.target.name]: e.target.checked }));
  const handleSend = () => {
    const latestAppointment = state.appointments.filter(a => a.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const message = exportPatientToWhatsAppMessage(patient, clinicName, clinicContactNumber, sections, { doctorName: latestAppointment?.doctor || "your Doctor", visitDate: latestAppointment?.date || new Date().toLocaleDateString() });
    const phoneNumber = patient.phone.replace(/\D/g, '');
    if (!phoneNumber) { alert("Patient phone number is not valid."); return; }
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  };
  if (!isOpen) return null;
  return (
     <Modal isOpen={isOpen} onClose={onClose} title="Send Report via WhatsApp" size="md">
      <div className="space-y-4 text-text-primary-dark">
        <p>Select sections to include in the message.</p>
        <div className="grid grid-cols-1 gap-3">
          {Object.keys(sections).map(key => (
            <label key={key} className="flex items-center space-x-2 bg-background-dark p-2 rounded-md"><input type="checkbox" name={key} checked={sections[key as keyof typeof sections]} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-border-dark text-brand-primary focus:ring-brand-primary bg-background-dark" /><span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span></label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button onClick={handleSend} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><span className="text-white">{ICONS.whatsapp}</span> Generate & Send</button></div>
      </div>
    </Modal>
  );
};


// --- Sub-components for PatientsPage ---

const PatientList: React.FC<{ onSelectPatient: (id: string) => void; searchQuery: string }> = ({ onSelectPatient, searchQuery }) => {
    const { state } = useAppContext();
    const filteredPatients = useMemo(() => 
        state.patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery)), 
    [state.patients, searchQuery]);

    return (
        <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark overflow-hidden">
            {filteredPatients.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary-dark">
                        <thead className="text-xs uppercase bg-background-dark"><tr className="text-text-primary-dark">
                            <th className="px-6 py-3">Name</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">DOB</th><th className="px-6 py-3">Outstanding</th>
                        </tr></thead>
                        <tbody>
                            {filteredPatients.map(p => {
                                const outstanding = p.billing.filter(b => b.status === BillingStatus.Pending).reduce((acc, item) => acc + item.amount, 0);
                                return (
                                <tr key={p.id} onClick={() => onSelectPatient(p.id)} className="border-b border-border-dark hover:bg-background-dark cursor-pointer">
                                    <td className="px-6 py-4 font-medium text-text-primary-dark whitespace-nowrap">{`${p.firstName} ${p.lastName}`}</td>
                                    <td className="px-6 py-4">{p.phone}</td>
                                    <td className="px-6 py-4">{p.dateOfBirth}</td>
                                    <td className={`px-6 py-4 font-semibold ${outstanding > 0 ? 'text-amber-400' : 'text-text-secondary-dark'}`}>{`₹${outstanding.toFixed(2)}`}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-center py-8">No patients found.</p>}
        </div>
    );
};

const PatientDetail: React.FC<{ patient: Patient; onBack: () => void; onPrint: () => void; onWhatsApp: () => void; }> = ({ patient, onBack, onPrint, onWhatsApp }) => {
    const { tab } = ReactRouterDOM.useParams();
    const navigate = ReactRouterDOM.useNavigate();
    const activeTab = tab || 'overview';
    const outstandingBalance = useMemo(() => patient.billing.filter(b => b.status === BillingStatus.Pending).reduce((acc, item) => acc + item.amount, 0), [patient.billing]);
    const TABS = [{ id: 'overview', label: 'Overview', icon: ICONS.user }, { id: 'dentalChart', label: 'Dental Chart', icon: ICONS.dentalChart }, { id: 'treatmentPlan', label: 'Treatment Plan', icon: ICONS.treatmentPlan }, { id: 'prescriptions', label: 'Prescriptions', icon: ICONS.prescription }, { id: 'billing', label: 'Billing', icon: ICONS.financials }, { id: 'notes', label: 'Notes', icon: ICONS.notes }, { id: 'documents', label: 'Documents', icon: ICONS.documents },];
    
    return (
        <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark flex-1 flex flex-col">
            <div className="p-4 border-b border-border-dark"><div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <button onClick={onBack} className="text-sm text-brand-primary hover:underline mb-2 flex items-center gap-1">{ICONS.left} Back to list</button>
                    <h2 className="text-xl font-bold text-text-primary-dark">{`${patient.firstName} ${patient.lastName}`}</h2>
                    <p className="text-sm text-text-secondary-dark">{patient.email || 'No email'} &bull; {patient.phone}</p>
                </div>
                <div className="flex items-center gap-3"><div className="text-right">
                    <span className="text-sm text-amber-400">Outstanding</span>
                    <p className="text-lg font-semibold text-amber-300">₹{outstandingBalance.toFixed(2)}</p>
                </div>
                <button onClick={onWhatsApp} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white"><span className="text-white">{ICONS.whatsapp}</span> WhatsApp</button>
                <button onClick={onPrint} className="flex items-center gap-2 rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white">{ICONS.print} Print Report</button>
                </div>
            </div></div>
            <div className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-border-dark"><nav className="-mb-px flex space-x-6 overflow-x-auto px-4">
                    {TABS.map(t => (<button key={t.id} onClick={() => navigate(t.id)} className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === t.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary-dark hover:text-text-primary-dark hover:border-border-dark'}`}>{t.icon} {t.label}</button>))}
                </nav></div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {activeTab === 'overview' && <OverviewTab patient={patient} />}
                    {activeTab === 'dentalChart' && <DentalChartTab patient={patient} />}
                    {activeTab === 'treatmentPlan' && <TreatmentPlanTab patient={patient} />}
                    {activeTab === 'prescriptions' && <PrescriptionsTab patient={patient} />}
                    {activeTab === 'billing' && <BillingTab patient={patient} />}
                    {activeTab === 'notes' && <CaseNotesTab patient={patient} />}
                    {activeTab === 'documents' && <DocumentsTab patient={patient} />}
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---

export const PatientsListView: React.FC = () => {
    const { patientId } = ReactRouterDOM.useParams();
    const navigate = ReactRouterDOM.useNavigate();
    const { state } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    const selectedPatient = useMemo(() => patientId ? state.patients.find(p => p.id === patientId) : null, [patientId, state.patients]);

    return (
        <div className="space-y-6 h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-text-primary-dark">{selectedPatient ? 'Patient Record' : "Patients"}</h1>
                {!selectedPatient && (<button onClick={() => setIsAddPatientModalOpen(true)} className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500">{ICONS.add} Add New Patient</button>)}
            </div>
            {!selectedPatient ? (
                <div className="flex flex-col gap-4 flex-1">
                    <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary-dark">{ICONS.search}</div>
                        <input type="text" placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full rounded-lg border border-border-dark bg-background-dark p-2.5 pl-10 text-text-primary-dark focus:border-brand-primary focus:ring-brand-primary"/>
                    </div>
                    <PatientList onSelectPatient={(id) => navigate(`${id}/overview`)} searchQuery={searchQuery} />
                </div>
            ) : (
                <div className="flex-1 min-h-0"><PatientDetail patient={selectedPatient} onBack={() => navigate(`/${ROUTES.PATIENTS}`)} onPrint={() => setIsPrintModalOpen(true)} onWhatsApp={() => setIsWhatsAppModalOpen(true)} /></div>
            )}
            <Modal isOpen={isAddPatientModalOpen} onClose={() => setIsAddPatientModalOpen(false)} title="Add New Patient"><PatientForm onSuccess={(p) => { setIsAddPatientModalOpen(false); navigate(`../${p.id}/overview`); }} onClose={() => setIsAddPatientModalOpen(false)} /></Modal>
            {selectedPatient && <PrintReportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} patient={selectedPatient} clinicName={state.clinicName} />}
            {selectedPatient && <WhatsAppReportModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} patient={selectedPatient} clinicName={state.clinicName} clinicContactNumber={state.clinicContactNumber} />}
        </div>
    );
};
