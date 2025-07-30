import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Users, Calendar, DollarSign, Settings, Plus, ChevronLeft, ChevronRight, ClipboardList,
  HeartPulse, Pill, FileText, Printer, FileDown, Trash2, Edit, MoreVertical, User, Search, X,
  Wallet, Landmark, ArrowRight, CheckCircle2, XCircle, FilePlus2, BookUser, Stethoscope, Smile,
  Sheet, LayoutDashboard, ClipboardCheck, FolderArchive, Phone
} from 'lucide-react';
import { format, isSameDay, isWithinInterval } from 'date-fns';

// --- TYPE DEFINITIONS ---
export interface DentalChartData {
  [toothId: string]: {
    condition: 'Healthy' | 'Caries' | 'Filling' | 'Crown' | 'RCT' | 'Missing' | 'Implant' | 'Other';
    notes: string;
  };
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; 
  uploadedAt: string;
}

export interface TreatmentPlanItem {
  id: string;
  procedure: string;
  tooth: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'On Hold';
  cost: number;
  date: string;
  isBilled?: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  medicalHistory: {
    allergies: string;
    conditions: string;
  };
  dentalChart: DentalChartData;
  treatmentPlan: TreatmentPlanItem[];
  caseNotes: CaseNote[];
  generalNotes: CaseNote[];
  prescriptions: Prescription[];
  billing: BillingEntry[];
  documents: Document[];
}

export interface CaseNote {
  id: string;
  date: string;
  note: string;
}

export enum PrescriptionStatus {
  Active = 'Active',
  Completed = 'Completed',
  Discontinued = 'Discontinued',
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  drugType: string;
  duration: string;
  route: string;
  instructions: string;
  advice: string;
  doctor: string;
  status: PrescriptionStatus;
  startDate: string;
  endDate: string;
}

export enum BillingStatus {
  Pending = 'Pending',
  Paid = 'Paid'
}

export interface BillingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: BillingStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  procedure: string;
  date: string; 
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
}

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense'
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
}

export type Shortcut = {
  id: string;
  category: 'notes';
  value: string;
} | {
  id: string;
  category: 'doctors';
  value: string;
} | {
  id: string;
  category: 'billing';
  value: { description: string; amount: number };
} | {
  id:string;
  category: 'prescriptions';
  value: Partial<Omit<Prescription, 'id' | 'startDate' | 'endDate'>>;
}

export interface AppState {
  isAuthenticated: boolean;
  clinicName: string;
  clinicContactNumber: string;
  patients: Patient[];
  appointments: Appointment[];
  transactions: FinancialTransaction[];
  shortcuts: Shortcut[];
}

export enum ActionType {
  UPDATE_SETTINGS,
  ADD_PATIENT, UPDATE_PATIENT,
  ADD_APPOINTMENT, UPDATE_APPOINTMENT, DELETE_APPOINTMENT,
  ADD_TRANSACTION, UPDATE_TRANSACTION, DELETE_TRANSACTION,
  ADD_SHORTCUT, DELETE_SHORTCUT,
  ADD_PRESCRIPTION, UPDATE_PRESCRIPTION, DELETE_PRESCRIPTION,
  ADD_BILLING, UPDATE_BILLING, UPDATE_BILLING_ITEM,
  ADD_CASE_NOTE, ADD_GENERAL_NOTE,
  UPDATE_DENTAL_CHART,
  ADD_TREATMENT_PLAN_ITEM, UPDATE_TREATMENT_PLAN_ITEM, DELETE_TREATMENT_PLAN_ITEM,
  ADD_DOCUMENT, DELETE_DOCUMENT,
}

export type AppAction =
  | { type: ActionType.UPDATE_SETTINGS, payload: { clinicName: string, clinicContactNumber: string } }
  | { type: ActionType.ADD_PATIENT; payload: Patient }
  | { type: ActionType.UPDATE_PATIENT; payload: Patient }
  | { type: ActionType.ADD_APPOINTMENT; payload: Appointment }
  | { type: ActionType.UPDATE_APPOINTMENT; payload: Appointment }
  | { type: ActionType.DELETE_APPOINTMENT; payload: { id: string } }
  | { type: ActionType.ADD_TRANSACTION; payload: FinancialTransaction }
  | { type: ActionType.UPDATE_TRANSACTION; payload: FinancialTransaction }
  | { type: ActionType.DELETE_TRANSACTION; payload: { id: string } }
  | { type: ActionType.ADD_SHORTCUT; payload: Shortcut }
  | { type: ActionType.DELETE_SHORTCUT; payload: { id: string } }
  | { type: ActionType.ADD_PRESCRIPTION; payload: { patientId: string; prescription: Prescription } }
  | { type: ActionType.UPDATE_PRESCRIPTION; payload: { patientId: string; prescription: Prescription } }
  | { type: ActionType.DELETE_PRESCRIPTION; payload: { patientId: string; prescriptionId: string } }
  | { type: ActionType.ADD_BILLING; payload: { patientId: string; billing: BillingEntry; treatmentPlanItemId?: string } }
  | { type: ActionType.UPDATE_BILLING; payload: { patientId: string; billingId: string; status: BillingStatus } }
  | { type: ActionType.UPDATE_BILLING_ITEM; payload: { patientId: string; billingItem: BillingEntry } }
  | { type: ActionType.ADD_CASE_NOTE; payload: { patientId: string; caseNote: CaseNote } }
  | { type: ActionType.ADD_GENERAL_NOTE; payload: { patientId: string; note: CaseNote } }
  | { type: ActionType.UPDATE_DENTAL_CHART; payload: { patientId: string; chartData: DentalChartData } }
  | { type: ActionType.ADD_TREATMENT_PLAN_ITEM; payload: { patientId: string; item: TreatmentPlanItem } }
  | { type: ActionType.UPDATE_TREATMENT_PLAN_ITEM; payload: { patientId: string; item: TreatmentPlanItem } }
  | { type: ActionType.DELETE_TREATMENT_PLAN_ITEM; payload: { patientId: string; itemId: string } }
  | { type: ActionType.ADD_DOCUMENT; payload: { patientId: string; document: Document } }
  | { type: ActionType.DELETE_DOCUMENT; payload: { patientId: string; documentId: string } };

// --- CONSTANTS ---
export const ICONS = {
  dashboard: React.createElement(LayoutDashboard, { size: 20 }),
  patients: React.createElement(Users, { size: 20 }),
  appointments: React.createElement(Calendar, { size: 20 }),
  financials: React.createElement(DollarSign, { size: 20 }),
  settings: React.createElement(Settings, { size: 20 }),
  add: React.createElement(Plus, { size: 16 }),
  left: React.createElement(ChevronLeft, { size: 20 }),
  right: React.createElement(ChevronRight, { size: 20 }),
  clipboard: React.createElement(ClipboardList, { size: 20 }),
  medical: React.createElement(HeartPulse, { size: 20 }),
  prescription: React.createElement(Pill, { size: 20 }),
  notes: React.createElement(FileText, { size: 20 }),
  print: React.createElement(Printer, { size: 16 }),
  csv: React.createElement(Sheet, { size: 16 }),
  pdf: React.createElement(FileDown, { size: 16 }),
  trash: React.createElement(Trash2, { size: 16 }),
  edit: React.createElement(Edit, { size: 16 }),
  more: React.createElement(MoreVertical, { size: 20 }),
  user: React.createElement(User, { size: 20 }),
  search: React.createElement(Search, { size: 18 }),
  close: React.createElement(X, { size: 20 }),
  wallet: React.createElement(Wallet, { size: 20 }),
  landmark: React.createElement(Landmark, { size: 20 }),
  arrowRight: React.createElement(ArrowRight, { size: 20 }),
  check: React.createElement(CheckCircle2, { className: "text-green-500", size: 18 }),
  cross: React.createElement(XCircle, { className: "text-red-500", size: 18 }),
  addFile: React.createElement(FilePlus2, { size: 20 }),
  patientRecord: React.createElement(BookUser, { size: 20 }),
  doctor: React.createElement(Stethoscope, { size: 20 }),
  clinic: React.createElement(Smile, { size: 24 }),
  dentalChart: React.createElement(Smile, { size: 20 }),
  treatmentPlan: React.createElement(ClipboardCheck, { size: 20 }),
  documents: React.createElement(FolderArchive, { size: 20 }),
  phone: React.createElement(Phone, { size: 16 }),
  whatsapp: React.createElement('svg', { fill: "currentColor", viewBox: "0 0 24 24", height: "1em", width: "1em" },
    React.createElement('path', { d: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.46 3.49 1.32 4.95L2 22l5.25-1.38c1.41.79 3.05 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.92 0-5.46-4.45-9.91-9.91-9.91zM17.2 14.25c-.22-.11-.76-.38-1.04-.42-.28-.04-.49-.06-.7.17-.21.23-.79.95-.97 1.14-.18.19-.36.21-.66.07-.3-.13-1.25-.46-2.38-1.47-1.13-.99-1.61-1.74-2.01-2.45-.18-.33-.36-.61-.53-.87-.18-.26-.36-.42-.53-.58-.18-.16-.36-.21-.54-.21-.18 0-.36-.03-.54-.03-.18 0-.47 0-.71.03-.24.03-.63.11-.97.58-.34.47-.95 1.38-.95 2.68 0 1.3.97 3.1 1.11 3.3.14.21 1.92 3.09 4.66 4.14 2.74 1.05 3.89 1.2 4.6.98.71-.22 1.25-.91 1.42-1.75.18-.84.18-1.55.13-1.75-.05-.2-.18-.31-.38-.41z" })
  ),
};

export const ROUTES = {
  DASHBOARD: 'dashboard',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  FINANCIALS: 'financials',
  SETTINGS: 'settings',
};

export const PREDEFINED_SHORTCUTS = {
  prescriptions: ['Amoxicillin 500mg', 'Ibuprofen 400mg', 'Paracetamol 500mg', 'Metronidazole 400mg'],
  billing: ['Consultation Fee', 'X-Ray', 'Scaling & Polishing', 'Tooth Extraction', 'Root Canal Treatment'],
  notes: ['RCT initiated on', 'Patient advised for extraction of', 'Caries excavation done on', 'Follow-up after 1 week'],
  doctors: ['Dr. Sharma', 'Dr. Gupta']
};

export const TOOTH_IDs = {
    upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
    upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
    lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
    lowerRight: ['41', '42', '43', '44', '45', '46', '47', '48'],
};

export const PEDO_TOOTH_IDs = {
    upperRight: ['A', 'B', 'C', 'D', 'E'], upperLeft: ['F', 'G', 'H', 'I', 'J'],
    lowerLeft: ['K', 'L', 'M', 'N', 'O'], lowerRight: ['P', 'Q', 'R', 'S', 'T'],
};

export const DENTAL_CONDITIONS = {
    'Healthy': { name: 'Healthy', color: 'slate-100', hex: '#f1f5f9', description: 'No signs of decay or damage.' },
    'Caries': { name: 'Caries', color: 'red-400', hex: '#F87171', description: 'Presence of tooth decay.' },
    'Filling': { name: 'Filling', color: 'blue-400', hex: '#60A5FA', description: 'Restoration material placed on the tooth.' },
    'Crown': { name: 'Crown', color: 'yellow-400', hex: '#FACC15', description: 'A cap placed over the entire tooth.' },
    'RCT': { name: 'RCT', color: 'purple-400', hex: '#A78BFA', description: 'Root Canal Treatment has been performed.' },
    'Missing': { name: 'Missing', color: 'gray-500', hex: '#6B7280', description: 'Tooth is not present in the arch.' },
    'Implant': { name: 'Implant', color: 'teal-400', hex: '#2DD4BF', description: 'Artificial tooth root is in place.' },
    'Other': { name: 'Other', color: 'orange-400', hex: '#FB923C', description: 'Other conditions noted (see notes).' },
};


// --- EXPORT SERVICE ---
type jsPDFWithLastAutoTable = jsPDF & { lastAutoTable: { finalY: number; } };

export const exportPatientToPDF = (patient: Patient, clinicName: string, sections: { [key: string]: boolean }) => {
  const doc = new jsPDF() as jsPDFWithLastAutoTable;
  
  doc.setFontSize(20); doc.setTextColor('#0d9488'); doc.text(clinicName, 14, 22);
  doc.setFontSize(12); doc.setTextColor(100); doc.text('Patient Report', 14, 30);
  
  doc.setFontSize(16); doc.setTextColor(40); doc.text(`${patient.firstName} ${patient.lastName}`, 14, 45);
  doc.setFontSize(10);
  doc.text(`DOB: ${patient.dateOfBirth} | Gender: ${patient.gender}`, 14, 52);
  doc.text(`Phone: ${patient.phone} | Email: ${patient.email}`, 14, 58);
  doc.text(`Address: ${patient.address}`, 14, 64);

  let yPos = 75;

  const addSection = (title: string, body: () => void) => {
    if (yPos > 260) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14); doc.setTextColor('#0d9488'); doc.text(title, 14, yPos);
    yPos += 8; body(); yPos += 10;
  };

  if (sections.dentalChart && patient.dentalChart) {
      addSection('Dental Chart', () => {
        const startX = 14; const toothWidth = 8; const toothHeight = 12; const toothGap = 2;
        const drawTooth = (id: string, x: number, y: number) => {
            const condition = patient.dentalChart?.[id]?.condition || 'Healthy';
            const conditionInfo = DENTAL_CONDITIONS[condition as keyof typeof DENTAL_CONDITIONS];
            doc.setFontSize(7); doc.setTextColor('#000000'); doc.text(id, x + toothWidth / 2, y - 4, { align: 'center' });
            doc.setDrawColor(40); doc.setFillColor(conditionInfo.hex); doc.rect(x, y, toothWidth, toothHeight, 'FD');
        };
        yPos += 5; let currentX = startX;
        [...TOOTH_IDs.upperRight].reverse().forEach(id => { drawTooth(id, currentX, yPos); currentX += toothWidth + toothGap; });
        currentX += toothGap * 2;
        TOOTH_IDs.upperLeft.forEach(id => { drawTooth(id, currentX, yPos); currentX += toothWidth + toothGap; });
        yPos += toothHeight + 15; currentX = startX;
        [...TOOTH_IDs.lowerRight].reverse().forEach(id => { drawTooth(id, currentX, yPos); currentX += toothWidth + toothGap; });
        currentX += toothGap * 2;
        TOOTH_IDs.lowerLeft.forEach(id => { drawTooth(id, currentX, yPos); currentX += toothWidth + toothGap; });
        yPos += toothHeight + 15;
      });
  }

  if (sections.treatmentPlan && patient.treatmentPlan?.length > 0) {
    addSection('Treatment Plan', () => {
        autoTable(doc, {
            startY: yPos, theme: 'grid', headStyles: { fillColor: '#0d9488' },
            head: [['Date', 'Procedure', 'Tooth', 'Cost (INR)', 'Status']],
            body: patient.treatmentPlan.map((p: TreatmentPlanItem) => [p.date, p.procedure, p.tooth, `₹${p.cost.toFixed(2)}`, p.status]),
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }

  if (sections.prescriptions && patient.prescriptions?.length > 0) {
    addSection('Prescriptions', () => {
        autoTable(doc, {
            startY: yPos, theme: 'grid', headStyles: { fillColor: '#0d9488' },
            head: [['Medication', 'Type', 'Dosage', 'Duration', 'Status']],
            body: patient.prescriptions.map((p: Prescription) => [p.medication, p.drugType, p.dosage, p.duration, p.status]),
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }
  
  if (sections.billing && patient.billing.length > 0) {
    addSection('Billing', () => {
        autoTable(doc, {
            startY: yPos, theme: 'grid', headStyles: { fillColor: '#0d9488' },
            head: [['Date', 'Description', 'Amount (INR)', 'Status']],
            body: patient.billing.map(b => [b.date, b.description, `₹${b.amount.toFixed(2)}`, b.status]),
        });
        yPos = doc.lastAutoTable.finalY;
    });
  }

  doc.save(`Patient_Report_${patient.firstName}_${patient.lastName}.pdf`);
};

export const exportPatientToWhatsAppMessage = (patient: Patient, clinicName: string, clinicContactNumber: string, sections: { [key: string]: boolean }, options: { doctorName: string; visitDate: string; }): string => {
    let summary = ``;
    if (sections.treatmentPlan && patient.treatmentPlan?.length > 0) {
        summary += `*Treatment Plan*:\n${patient.treatmentPlan.map(item => `- ${item.procedure}, Status: ${item.status}`).join('\n')}\n\n`;
    }
    if (sections.prescriptions && patient.prescriptions?.length > 0) {
        summary += `*Prescriptions*:\n${patient.prescriptions.map(p => `- ${p.medication} ${p.dosage} (${p.status})`).join('\n')}\n\n`;
    }
    if (sections.billing && patient.billing.length > 0) {
        const outstanding = patient.billing.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0);
        summary += `*Billing Summary*:\n- Total Outstanding: *₹${outstanding.toFixed(2)}*\n\n`;
    }
    return `Hello ${patient.firstName},\n\nYour report from your visit on ${options.visitDate} with Dr. ${options.doctorName} is ready:\n\n${summary.trim()}\n\nThank you for choosing ${clinicName}!\nContact: ${clinicContactNumber || '[Clinic Phone]'}`;
}

export const exportFinancialsToCSV = (transactions: FinancialTransaction[]) => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)'];
  const rows = transactions.map(t => [t.date, t.type, `"${t.category}"`, `"${t.description}"`, t.amount.toFixed(2)]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'financial_report.csv');
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

export const exportFinancialsToPDF = (transactions: FinancialTransaction[], summary: { income: number; expense: number; net: number }, dateRange: { start: string, end: string }, clinicName: string) => {
    const doc = new jsPDF() as jsPDFWithLastAutoTable;
    let yPos = 20;
    doc.setFontSize(20); doc.text("Financial Report", doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" }); yPos += 8;
    doc.setFontSize(10); doc.text(clinicName, doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" }); yPos += 10;
    if (dateRange.start && dateRange.end) { doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" }); yPos += 10; }
    doc.setFontSize(12); doc.text(`Total Income: ₹${summary.income.toFixed(2)}`, 14, yPos); doc.text(`Total Expenses: ₹${summary.expense.toFixed(2)}`, doc.internal.pageSize.getWidth() / 2, yPos); yPos += 8;
    doc.text(`Net Balance: ₹${summary.net.toFixed(2)}`, 14, yPos); yPos += 15;
    autoTable(doc, {
        startY: yPos, theme: 'grid', headStyles: { fillColor: '#0d9488' },
        head: [['Date', 'Type', 'Category', 'Description', 'Amount (₹)']],
        body: transactions.map(t => [t.date, t.type, t.category, t.description, { content: t.amount.toFixed(2), styles: { halign: 'right' } }]),
    });
    doc.save('financial_report.pdf');
};


// --- APP CONTEXT & REDUCER ---
const APP_STORAGE_KEY = 'dentSyncDataV2';

const getInitialState = (): AppState => {
  let state: AppState = {
    isAuthenticated: true, clinicName: 'DentAssist Clinic', clinicContactNumber: '',
    patients: [], appointments: [], transactions: [], shortcuts: [],
  };
  try {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      state = { ...state, ...parsed };
    }
  } catch (e) { console.error("Failed to parse from localStorage", e); }
  return state;
};

export const initialState = getInitialState();

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ActionType.UPDATE_SETTINGS: 
      return { ...state, ...action.payload };
    
    case ActionType.ADD_PATIENT:
      return { ...state, patients: [...state.patients, action.payload] };
      
    case ActionType.UPDATE_PATIENT:
      return {
        ...state,
        patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p),
      };

    case ActionType.ADD_APPOINTMENT:
      return { ...state, appointments: [...state.appointments, action.payload] };

    case ActionType.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(a => a.id === action.payload.id ? action.payload : a),
      };

    case ActionType.DELETE_APPOINTMENT:
      return { ...state, appointments: state.appointments.filter(a => a.id !== action.payload.id) };

    case ActionType.ADD_TRANSACTION:
      return { ...state, transactions: [...state.transactions, action.payload] };
      
    case ActionType.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t),
      };
      
    case ActionType.DELETE_TRANSACTION:
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload.id) };

    case ActionType.ADD_SHORTCUT:
      return { ...state, shortcuts: [...state.shortcuts, action.payload] };

    case ActionType.DELETE_SHORTCUT:
      return { ...state, shortcuts: state.shortcuts.filter(s => s.id !== action.payload.id) };
      
    case ActionType.ADD_PRESCRIPTION:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, prescriptions: [...p.prescriptions, action.payload.prescription] } : p) };

    case ActionType.UPDATE_PRESCRIPTION:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, prescriptions: p.prescriptions.map(pr => pr.id === action.payload.prescription.id ? action.payload.prescription : pr) } : p) };
        
    case ActionType.DELETE_PRESCRIPTION:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, prescriptions: p.prescriptions.filter(pr => pr.id !== action.payload.prescriptionId) } : p) };

    case ActionType.ADD_BILLING:
        return {
            ...state,
            patients: state.patients.map(p => {
                if (p.id !== action.payload.patientId) return p;
                const updatedPlan = action.payload.treatmentPlanItemId ? p.treatmentPlan.map(item => item.id === action.payload.treatmentPlanItemId ? { ...item, isBilled: true } : item) : p.treatmentPlan;
                return { ...p, billing: [...p.billing, action.payload.billing], treatmentPlan: updatedPlan };
            })
        };

    case ActionType.UPDATE_BILLING: // This is just for status update
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, billing: p.billing.map(b => b.id === action.payload.billingId ? { ...b, status: action.payload.status } : b) } : p) };

    case ActionType.UPDATE_BILLING_ITEM: // This is for editing the whole item
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, billing: p.billing.map(b => b.id === action.payload.billingItem.id ? action.payload.billingItem : b) } : p) };

    case ActionType.ADD_CASE_NOTE:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, caseNotes: [...p.caseNotes, action.payload.caseNote] } : p) };
        
    case ActionType.ADD_GENERAL_NOTE:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, generalNotes: [...p.generalNotes, action.payload.note] } : p) };

    case ActionType.UPDATE_DENTAL_CHART:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, dentalChart: action.payload.chartData } : p) };

    case ActionType.ADD_TREATMENT_PLAN_ITEM:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: [...p.treatmentPlan, action.payload.item] } : p) };

    case ActionType.UPDATE_TREATMENT_PLAN_ITEM:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: p.treatmentPlan.map(item => item.id === action.payload.item.id ? action.payload.item : item) } : p) };
        
    case ActionType.DELETE_TREATMENT_PLAN_ITEM:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, treatmentPlan: p.treatmentPlan.filter(item => item.id !== action.payload.itemId) } : p) };

    case ActionType.ADD_DOCUMENT:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, documents: [...p.documents, action.payload.document] } : p) };
        
    case ActionType.DELETE_DOCUMENT:
        return { ...state, patients: state.patients.map(p => p.id === action.payload.patientId ? { ...p, documents: p.documents.filter(doc => doc.id !== action.payload.documentId) } : p) };
    default:
      return state;
  }
};
