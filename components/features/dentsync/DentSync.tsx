
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ActionType, ICONS, ROUTES, Shortcut, PREDEFINED_SHORTCUTS, Prescription } from './data';
import { AppProvider, useAppContext } from './common';
import { DashboardView } from './DashboardView';
import { PatientsListView } from './PatientsListView';
import { AppointmentsView } from './AppointmentsView';
import { FinancialsView } from './FinancialsView';
import { X } from 'lucide-react';

// --- Layout Components (internal to DentSync) ---

const DentSyncSidebar: React.FC = () => {
  const { state } = useAppContext();
  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: ICONS.dashboard },
    { path: ROUTES.PATIENTS, label: 'Patients', icon: ICONS.patients },
    { path: ROUTES.APPOINTMENTS, label: 'Appointments', icon: ICONS.appointments },
    { path: ROUTES.FINANCIALS, label: 'Financials', icon: ICONS.financials },
    { path: ROUTES.SETTINGS, label: 'Settings', icon: ICONS.settings },
  ];

  return (
    <div className="flex flex-col bg-surface-dark text-slate-100 rounded-lg shadow-sm overflow-hidden border border-border-dark">
      <div className="flex items-center gap-3 p-4 border-b border-border-dark">
        <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary">
            {ICONS.clinic}
        </div>
        <span className="text-xl font-bold text-white">{state.clinicName}</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => (
          <ReactRouterDOM.NavLink
            key={item.path}
            to={item.path}
            end={item.path === '' || item.path === 'dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-surface-light text-brand-primary'
                  : 'text-slate-300 hover:bg-surface-light hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </ReactRouterDOM.NavLink>
        ))}
      </nav>
    </div>
  );
};


const DentSyncContentLayout: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <aside className="lg:col-span-1 lg:sticky top-24">
            <DentSyncSidebar />
        </aside>
        <div className="lg:col-span-3">
            <ReactRouterDOM.Outlet />
        </div>
    </div>
);


// --- Settings Page ---

type ShortcutCategory = 'notes' | 'prescriptions' | 'billing' | 'doctors';

const ShortcutManager: React.FC<{
  title: string;
  category: ShortcutCategory;
  predefined: readonly any[];
  custom: Shortcut[];
  onDelete: (id: string) => void;
  form: React.ReactNode;
  renderValue: (value: any) => React.ReactNode;
}> = ({ title, predefined, custom, onDelete, form, renderValue }) => {
  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-sm border border-border-dark">
      <h3 className="text-lg font-semibold text-text-primary-dark mb-4">{title}</h3>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-secondary-dark">Predefined Shortcuts</h4>
        <div className="flex flex-wrap gap-2">
          {predefined.map((item, index) => (
            <span key={index} className="px-3 py-1 bg-border-dark text-text-secondary-dark rounded-full text-sm">
              {typeof item === 'object' ? item.description || item.medication || item : item}
            </span>
          ))}
        </div>
        
        <hr className="my-4 border-border-dark"/>

        <h4 className="text-sm font-medium text-text-secondary-dark">Your Custom Shortcuts</h4>
         <div className="flex flex-wrap gap-2">
            {custom.map(item => (
                <div key={item.id} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-sm">
                    {renderValue(item.value)}
                    <button onClick={() => onDelete(item.id)} className="text-teal-400 hover:text-white p-1 rounded-full hover:bg-teal-500">
                      <X size={14} />
                    </button>
                </div>
            ))}
        </div>
        
        <div className="pt-2">{form}</div>
      </div>
    </div>
  );
};

const DentSyncSettingsPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [clinicName, setClinicName] = useState(state.clinicName);
    const [clinicContactNumber, setClinicContactNumber] = useState(state.clinicContactNumber);
    
    const [noteShortcut, setNoteShortcut] = useState('');
    const [doctorShortcut, setDoctorShortcut] = useState('');
    const [billingShortcut, setBillingShortcut] = useState({ description: '', amount: '' });
    const [prescriptionShortcut, setPrescriptionShortcut] = useState<Partial<Omit<Prescription, 'id' | 'startDate' | 'endDate'>>>({
        medication: '', dosage: '', frequency: '', instructions: '', drugType: 'Analgesic', duration: '', route: 'Oral',
    });

    const handleUpdateSettings = () => {
        dispatch({ type: ActionType.UPDATE_SETTINGS, payload: { clinicName, clinicContactNumber } });
        alert('Settings updated!');
    };

    const handleAddShortcut = (category: ShortcutCategory, value: any) => {
      if(category === 'notes' && typeof value === 'string' && !value.trim()) return;
      if(category === 'doctors' && typeof value === 'string' && !value.trim()) return;

      const newShortcut: Shortcut = {
          id: Date.now().toString(),
          category,
          value,
      } as Shortcut;
      dispatch({ type: ActionType.ADD_SHORTCUT, payload: newShortcut });
    };

    const handleDeleteShortcut = (id: string) => {
        dispatch({ type: ActionType.DELETE_SHORTCUT, payload: { id } });
    };
    
    const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const buttonClass = "flex items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:bg-teal-800";
    
    return (
        <div className="space-y-6 text-text-primary-dark">
            <h1 className="text-3xl font-bold">Settings</h1>
            
            <div className="bg-surface-dark p-6 rounded-lg shadow-sm border border-border-dark">
              <h3 className="text-lg font-semibold mb-4">Clinic Settings</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium mb-1">Clinic Name</label>
                  <input id="clinicName" type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className={inputClass} />
                  <p className="text-xs text-text-secondary-dark mt-1">This name will appear on printed reports.</p>
                </div>

                <div>
                  <label htmlFor="clinicContactNumber" className="block text-sm font-medium mb-1">Clinic Contact Number</label>
                  <input id="clinicContactNumber" type="text" value={clinicContactNumber} onChange={(e) => setClinicContactNumber(e.target.value)} placeholder="e.g., +91 12345 67890" className={inputClass} />
                  <p className="text-xs text-text-secondary-dark mt-1">This number will be used in WhatsApp messages.</p>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button onClick={handleUpdateSettings} className={buttonClass}>Save Settings</button>
                </div>
              </div>
            </div>

            <p className="text-text-secondary-dark">Manage your custom shortcuts to speed up your workflow.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ShortcutManager
                    title="Case Note Shortcuts" category="notes"
                    predefined={PREDEFINED_SHORTCUTS.notes}
                    custom={state.shortcuts.filter(s => s.category === 'notes')}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value as string}</span>}
                    form={
                        <div className="flex gap-2">
                            <input type="text" value={noteShortcut} onChange={e => setNoteShortcut(e.target.value)} placeholder="Add new note shortcut..." className={inputClass}/>
                            <button onClick={() => { handleAddShortcut('notes', noteShortcut); setNoteShortcut(''); }} className={buttonClass}>{ICONS.add} Add</button>
                        </div>
                    }
                />
                 <ShortcutManager
                    title="Doctor Name Shortcuts" category="doctors"
                    predefined={PREDEFINED_SHORTCUTS.doctors}
                    custom={state.shortcuts.filter(s => s.category === 'doctors')}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value as string}</span>}
                    form={
                        <div className="flex gap-2">
                            <input type="text" value={doctorShortcut} onChange={e => setDoctorShortcut(e.target.value)} placeholder="Add new doctor name..." className={inputClass}/>
                            <button onClick={() => { handleAddShortcut('doctors', doctorShortcut); setDoctorShortcut(''); }} className={buttonClass}>{ICONS.add} Add</button>
                        </div>
                    }
                />
                <ShortcutManager
                    title="Billing Item Shortcuts" category="billing"
                    predefined={[]}
                    custom={state.shortcuts.filter(s => s.category === 'billing')}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value.description} (₹{value.amount})</span>}
                    form={
                        <div className="space-y-2">
                            <input type="text" value={billingShortcut.description} onChange={e => setBillingShortcut(p => ({...p, description: e.target.value}))} placeholder="Description..." className={inputClass}/>
                            <div className="flex gap-2">
                                <input type="number" value={billingShortcut.amount} onChange={e => setBillingShortcut(p => ({...p, amount: e.target.value}))} placeholder="Amount (₹)" className={inputClass}/>
                                <button onClick={() => { handleAddShortcut('billing', { ...billingShortcut, amount: parseFloat(billingShortcut.amount) || 0 }); setBillingShortcut({ description: '', amount: '' }); }} className={buttonClass} disabled={!billingShortcut.description || !billingShortcut.amount}>{ICONS.add} Add</button>
                            </div>
                        </div>
                    }
                />
                <ShortcutManager
                    title="Prescription Shortcuts" category="prescriptions"
                    predefined={[]}
                    custom={state.shortcuts.filter(s => s.category === 'prescriptions')}
                    onDelete={handleDeleteShortcut}
                    renderValue={(value) => <span>{value.medication} {value.dosage}</span>}
                    form={
                       <div className="space-y-2">
                           <input type="text" value={prescriptionShortcut.medication} onChange={e => setPrescriptionShortcut(p => ({...p, medication: e.target.value}))} placeholder="Medication..." className={inputClass}/>
                           <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={prescriptionShortcut.dosage} onChange={e => setPrescriptionShortcut(p => ({...p, dosage: e.target.value}))} placeholder="Dosage (e.g., 500mg)" className={inputClass}/>
                              <input type="text" value={prescriptionShortcut.frequency} onChange={e => setPrescriptionShortcut(p => ({...p, frequency: e.target.value}))} placeholder="Frequency (e.g., BID)" className={inputClass}/>
                           </div>
                           <input type="text" value={prescriptionShortcut.instructions} onChange={e => setPrescriptionShortcut(p => ({...p, instructions: e.target.value}))} placeholder="Instructions (e.g., After food)" className={inputClass}/>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={prescriptionShortcut.drugType} onChange={e => setPrescriptionShortcut(p => ({...p, drugType: e.target.value}))} placeholder="Drug Type" className={inputClass}/>
                              <input type="text" value={prescriptionShortcut.duration} onChange={e => setPrescriptionShortcut(p => ({...p, duration: e.target.value}))} placeholder="Duration" className={inputClass}/>
                           </div>
                           <button onClick={() => { handleAddShortcut('prescriptions', prescriptionShortcut); setPrescriptionShortcut({ medication: '', dosage: '', frequency: '', instructions: ''}); }} className={`${buttonClass} w-full`} disabled={!prescriptionShortcut.medication}>{ICONS.add} Add</button>
                       </div>
                    }
                />
            </div>
        </div>
    );
};


// --- The main App component for this feature ---

const DentSyncApp: React.FC = () => {
  return (
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route element={<DentSyncContentLayout />}>
        <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="dashboard" replace />} />
        <ReactRouterDOM.Route path="dashboard" element={<DashboardView />} />
        <ReactRouterDOM.Route path="patients" element={<PatientsListView />} />
        <ReactRouterDOM.Route path="patients/:patientId" element={<PatientsListView />} />
        <ReactRouterDOM.Route path="patients/:patientId/:tab" element={<PatientsListView />} />
        <ReactRouterDOM.Route path="appointments" element={<AppointmentsView />} />
        <ReactRouterDOM.Route path="financials" element={<FinancialsView />} />
        <ReactRouterDOM.Route path="settings" element={<DentSyncSettingsPage />} />
        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="dashboard" replace />} />
      </ReactRouterDOM.Route>
    </ReactRouterDOM.Routes>
  );
};


// The main export for the DentSync feature, which provides the context and renders the sub-app.
export const DentSync: React.FC = () => {
    return (
        <AppProvider>
            <DentSyncApp />
        </AppProvider>
    );
};