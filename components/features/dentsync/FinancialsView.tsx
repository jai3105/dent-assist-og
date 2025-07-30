
import React, { useState, useMemo } from 'react';
import { ActionType, FinancialTransaction, TransactionType, ICONS, exportFinancialsToCSV, exportFinancialsToPDF } from './data';
import { useAppContext, Modal } from './common';
import { analyzeFinancials } from '../../../services/geminiService';
import { Spinner } from '../../common/Spinner';
import { Wand2 } from 'lucide-react';

const FinancialsStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; textColor: string; }> = ({ title, value, icon, color, textColor }) => (
    <div className={`p-6 rounded-xl shadow-lg flex items-center gap-6 ${color}`}>
        <div className={`text-4xl ${textColor}`}>{icon}</div>
        <div><p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p><p className={`text-2xl font-bold ${textColor}`}>{value}</p></div>
    </div>
);

const TransactionForm: React.FC<{ onSuccess: () => void; initialData?: FinancialTransaction; }> = ({ onSuccess, initialData }) => {
    const { dispatch } = useAppContext();
    const [formData, setFormData] = useState({
        type: initialData?.type || TransactionType.Income, category: initialData?.category || '',
        description: initialData?.description || '', amount: initialData?.amount.toString() || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: FinancialTransaction = { id: initialData?.id || Date.now().toString(), ...formData, type: formData.type as TransactionType, amount: parseFloat(formData.amount) };
        dispatch({ type: initialData ? ActionType.UPDATE_TRANSACTION : ActionType.ADD_TRANSACTION, payload: data });
        onSuccess();
    };
    const inputClass = "w-full bg-background-dark border border-border-dark rounded-lg p-2 text-text-primary-dark placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const labelClass = "block text-sm font-medium text-text-secondary-dark mb-1";
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Type</label><select name="type" value={formData.type} onChange={handleChange} className={inputClass}><option value={TransactionType.Income}>Income</option><option value={TransactionType.Expense}>Expense</option></select></div>
                <div><label className={labelClass}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g., Patient Payment, Lab Fees" className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Description</label><input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Amount (₹)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onSuccess} className="bg-border-dark px-4 py-2 rounded-lg font-semibold">Cancel</button><button type="submit" className="flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Save Transaction</button></div>
        </form>
    )
};

const AiAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; transactions: FinancialTransaction[]; }> = ({ isOpen, onClose, transactions }) => {
    const [analysis, setAnalysis] = useState<{ summary: string; insights: string[]; recommendations: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    React.useEffect(() => {
        if (isOpen && transactions.length > 0) {
            const getAnalysis = async () => {
                setIsLoading(true);
                setAnalysis(null);
                const result = await analyzeFinancials(transactions as any);
                setAnalysis(result);
                setIsLoading(false);
            };
            getAnalysis();
        }
    }, [isOpen, transactions]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Financial Analysis">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8"><Spinner /><p className="mt-4 text-text-secondary-dark font-semibold">AI is analyzing your finances...</p></div>
            ) : analysis ? (
                 <div className="space-y-6">
                    <div><h4 className="font-semibold text-lg text-brand-primary mb-2">Summary</h4><p className="text-text-secondary-dark">{analysis.summary}</p></div>
                    <div><h4 className="font-semibold text-lg text-brand-primary mb-2">Key Insights</h4><ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.insights.map((item, i) => <li key={`ins-${i}`}>{item}</li>)}</ul></div>
                    <div><h4 className="font-semibold text-lg text-brand-primary mb-2">Recommendations</h4><ul className="list-disc list-inside space-y-1 text-text-secondary-dark">{analysis.recommendations.map((item, i) => <li key={`rec-${i}`}>{item}</li>)}</ul></div>
                </div>
            ) : <p className="text-center text-text-secondary-dark">No data to analyze or an error occurred.</p>}
        </Modal>
    );
};


export const FinancialsView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isTxModalOpen, setTxModalOpen] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<FinancialTransaction|undefined>(undefined);

    const filteredTx = useMemo(() => state.transactions.filter(t => {
        if (!dateRange.start || !dateRange.end) return true;
        return t.date >= dateRange.start && t.date <= dateRange.end;
    }), [state.transactions, dateRange]);

    const summary = useMemo(() => filteredTx.reduce((acc, t) => {
        if (t.type === 'Income') acc.income += t.amount; else acc.expense += t.amount; return acc;
    }, { income: 0, expense: 0 }), [filteredTx]);
    
    const totalOutstanding = useMemo(() => state.patients.flatMap(p => p.billing).filter(b => b.status === 'Pending').reduce((s, b) => s + b.amount, 0), [state.patients]);
    const netBalance = summary.income - summary.expense;

    const handleOpenModal = (tx?: FinancialTransaction) => { setEditingTx(tx); setTxModalOpen(true); };
    const handleDelete = (id: string) => { if(window.confirm('Delete this transaction?')) { dispatch({ type: ActionType.DELETE_TRANSACTION, payload: { id } }); } };
    
    return (
        <div className="space-y-6 animate-fade-in text-text-primary-dark">
            <h1 className="text-3xl font-bold">Financials</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinancialsStatCard title="Total Income" value={`₹${summary.income.toFixed(2)}`} icon={ICONS.wallet} color="bg-green-500/20" textColor="text-green-300" />
                <FinancialsStatCard title="Total Expenses" value={`₹${summary.expense.toFixed(2)}`} icon={ICONS.landmark} color="bg-red-500/20" textColor="text-red-300" />
                <FinancialsStatCard title="Total Outstanding" value={`₹${totalOutstanding.toFixed(2)}`} icon={ICONS.wallet} color="bg-amber-500/20" textColor="text-amber-300" />
                <FinancialsStatCard title="Net Balance" value={`₹${netBalance.toFixed(2)}`} icon={ICONS.arrowRight} color={netBalance >= 0 ? "bg-blue-500/20" : "bg-orange-500/20"} textColor={netBalance >= 0 ? "text-blue-300" : "text-orange-300"} />
            </div>

            <div className="bg-surface-dark rounded-lg shadow-sm border border-border-dark">
                <div className="p-4 border-b border-border-dark flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Transactions</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                             <input type="date" name="start" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} className="bg-background-dark p-2 border border-border-dark rounded-md text-sm" />
                             <span>to</span>
                             <input type="date" name="end" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} className="bg-background-dark p-2 border border-border-dark rounded-md text-sm"/>
                        </div>
                        <button onClick={() => setAiModalOpen(true)} className="flex items-center gap-2 rounded-md border border-brand-secondary/50 bg-brand-secondary/10 px-3 py-2 text-sm font-medium text-brand-secondary hover:bg-brand-secondary/20"><Wand2 size={16}/> AI Analysis</button>
                        <button onClick={() => exportFinancialsToCSV(filteredTx)} className="flex items-center gap-2 rounded-md border border-border-dark bg-background-dark px-3 py-2 text-sm font-medium hover:bg-border-dark">{ICONS.csv} Export CSV</button>
                        <button onClick={() => exportFinancialsToPDF(filteredTx, { ...summary, net: netBalance }, dateRange, state.clinicName)} className="flex items-center gap-2 rounded-md border border-border-dark bg-background-dark px-3 py-2 text-sm font-medium hover:bg-border-dark">{ICONS.pdf} Export PDF</button>
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500">{ICONS.add} Add Transaction</button>
                    </div>
                </div>
                <div className="p-4 overflow-x-auto">
                     {filteredTx.length > 0 ? (<table className="w-full text-sm text-left text-text-secondary-dark">
                            <thead className="text-xs uppercase bg-background-dark text-text-primary-dark"><tr>
                                <th className="px-6 py-3">Date</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3 text-center">Actions</th>
                            </tr></thead><tbody>{filteredTx.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                            <tr key={t.id} className="border-b border-border-dark">
                                <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${t.type === 'Income' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{t.type}</span></td>
                                <td className="px-6 py-4">{t.category}</td><td className="px-6 py-4">{t.description}</td>
                                <td className={`px-6 py-4 text-right font-semibold ${t.type === 'Income' ? 'text-green-300' : 'text-red-300'}`}>₹{t.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center"><div className="flex justify-center items-center gap-2">
                                    <button onClick={() => handleOpenModal(t)} className="text-text-secondary-dark hover:text-brand-primary p-1">{ICONS.edit}</button>
                                    <button onClick={() => handleDelete(t.id)} className="text-text-secondary-dark hover:text-red-500 p-1">{ICONS.trash}</button>
                                </div></td>
                            </tr>))}</tbody>
                        </table>) : <p className="text-center py-8">No transactions found for the selected period.</p>}
                </div>
            </div>
             <Modal isOpen={isTxModalOpen} onClose={() => { setTxModalOpen(false); setEditingTx(undefined); }} title={editingTx ? "Edit Transaction" : "Add New Transaction"}><TransactionForm onSuccess={() => { setTxModalOpen(false); setEditingTx(undefined); }} initialData={editingTx} /></Modal>
             <AiAnalysisModal isOpen={isAiModalOpen} onClose={() => setAiModalOpen(false)} transactions={filteredTx} />
        </div>
    );
};
