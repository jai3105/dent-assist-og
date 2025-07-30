
import React, { useState, useMemo } from 'react';
import { useAppContext } from './dentsync/common';
import { TransactionType } from './dentsync/data';
import { subDays, startOfDay, endOfDay, subMonths, startOfMonth, subYears, startOfYear, isWithinInterval, parseISO } from 'date-fns';
import { BarChart, PieChart, TrendingUp, Users, Wallet, CheckSquare, DollarSign } from 'lucide-react';

// --- Helper Functions ---
const getProcedureCategory = (procedureName: string): string => {
    const name = procedureName.toLowerCase();
    if (name.includes('rct') || name.includes('endo')) return 'Endodontics';
    if (name.includes('crown') || name.includes('bridge') || name.includes('veneer') || name.includes('denture')) return 'Prosthodontics';
    if (name.includes('implant')) return 'Implantology';
    if (name.includes('composite') || name.includes('filling') || name.includes('restoration') || name.includes('amalgam')) return 'Restorative';
    if (name.includes('extraction') || name.includes('surgery')) return 'Oral Surgery';
    if (name.includes('scaling') || name.includes('srp') || name.includes('perio')) return 'Periodontics';
    if (name.includes('ortho')) return 'Orthodontics';
    return 'General';
};

const dateRanges = [
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'This Year', value: '1y' },
    { label: 'All Time', value: 'all' },
];

// --- Sub-components ---
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-surface-dark p-5 rounded-lg shadow-sm border border-border-dark flex items-center gap-4">
        <div className="p-3 bg-brand-primary/10 rounded-full text-brand-primary">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary-dark">{title}</p>
            <p className="text-2xl font-bold text-text-primary-dark">{value}</p>
        </div>
    </div>
);

const SimpleBarChart: React.FC<{ data: { name: string; value: number }[]; color: string }> = ({ data, color }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return <div className="flex items-center justify-center h-64 text-text-secondary-dark">No data available</div>;

    return (
        <div className="h-64 w-full flex items-end gap-2 p-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2" title={`${d.name}: ${d.value}`}>
                    <div className={`w-full ${color} rounded-t-md hover:opacity-80 transition-opacity`} style={{ height: `${(d.value / maxValue) * 100}%` }} />
                    <span className="text-xs text-text-secondary-dark truncate">{d.name}</span>
                </div>
            ))}
        </div>
    );
};

const SimplePieChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-64 text-text-secondary-dark">No data available</div>;

    let accumulated = 0;
    const segments = data.map(d => {
        const percentage = d.value / total;
        const segment = { ...d, percentage, startAngle: accumulated };
        accumulated += percentage;
        return segment;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                {segments.map(s => (
                    <circle
                        key={s.name}
                        r="25"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        stroke={s.color}
                        strokeWidth="50"
                        strokeDasharray={`${s.percentage * 157} 157`}
                        strokeDashoffset={-s.startAngle * 157}
                    />
                ))}
            </svg>
            <div className="flex-1 space-y-2 text-sm w-full">
                {segments.map(s => (
                    <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-text-primary-dark">{s.name}</span>
                        </div>
                        <span className="font-semibold text-text-secondary-dark">{Math.round(s.percentage * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---
export const DentStats: React.FC = () => {
    const { state } = useAppContext();
    const [dateRange, setDateRange] = useState('6m');

    const interval = useMemo(() => {
        const now = new Date();
        switch (dateRange) {
            case '30d': return { start: subDays(startOfDay(now), 30), end: endOfDay(now) };
            case '6m': return { start: subMonths(startOfDay(now), 6), end: endOfDay(now) };
            case '1y': return { start: startOfYear(now), end: endOfDay(now) };
            default: return null;
        }
    }, [dateRange]);

    const filteredData = useMemo(() => {
        const patients = state.patients.filter(p => {
             const firstVisit = p.treatmentPlan?.[0]?.date;
             return !interval || (firstVisit && isWithinInterval(parseISO(firstVisit), interval));
        });
        
        const transactions = interval ? state.transactions.filter(t => isWithinInterval(parseISO(t.date), interval)) : state.transactions;
        const allTreatmentItems = state.patients.flatMap(p => p.treatmentPlan);
        const completedProcedures = allTreatmentItems.filter(item => item.status === 'Completed' && (!interval || isWithinInterval(parseISO(item.date), interval)))
        
        return { patients, transactions, completedProcedures };
    }, [state, interval]);

    const stats = useMemo(() => {
        const revenue = filteredData.transactions.filter(t => t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0);
        const procedureCount = filteredData.completedProcedures.length;
        const patientCount = filteredData.patients.length;
        const caseValue = patientCount > 0 ? revenue / patientCount : 0;

        return {
            revenue: `₹${revenue.toLocaleString('en-IN')}`,
            procedureCount: procedureCount.toLocaleString('en-IN'),
            patientCount: patientCount.toLocaleString('en-IN'),
            caseValue: `₹${caseValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
        };
    }, [filteredData]);

    const procedureFrequencyData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        filteredData.completedProcedures.forEach(p => {
            counts[p.procedure] = (counts[p.procedure] || 0) + 1;
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
    }, [filteredData.completedProcedures]);

    const procedureCategoryData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        filteredData.completedProcedures.forEach(p => {
            const category = getProcedureCategory(p.procedure);
            counts[category] = (counts[category] || 0) + 1;
        });
        const colors = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#10b981'];
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
    }, [filteredData.completedProcedures]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary-dark">DentStats</h1>
                    <p className="text-text-secondary-dark">Your practice performance and analytics dashboard.</p>
                </div>
                <div className="flex items-center p-1 bg-surface-dark rounded-lg border border-border-dark">
                    {dateRanges.map(dr => (
                        <button 
                            key={dr.value} 
                            onClick={() => setDateRange(dr.value)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${dateRange === dr.value ? 'bg-brand-primary text-white shadow' : 'text-text-secondary-dark hover:bg-border-dark'}`}>
                            {dr.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={stats.revenue} icon={<DollarSign />} />
                <StatCard title="Procedures Completed" value={stats.procedureCount} icon={<CheckSquare />} />
                <StatCard title="New Patients" value={stats.patientCount} icon={<Users />} />
                <StatCard title="Avg. Revenue / Patient" value={stats.caseValue} icon={<TrendingUp />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface-dark p-6 rounded-lg shadow-sm border border-border-dark">
                    <h3 className="text-lg font-semibold text-text-primary-dark mb-4 flex items-center gap-2"><BarChart/> Procedure Frequency</h3>
                    <SimpleBarChart data={procedureFrequencyData} color="bg-brand-primary" />
                </div>
                <div className="lg:col-span-2 bg-surface-dark p-6 rounded-lg shadow-sm border border-border-dark">
                    <h3 className="text-lg font-semibold text-text-primary-dark mb-4 flex items-center gap-2"><PieChart/> Procedure Category Breakdown</h3>
                    <SimplePieChart data={procedureCategoryData} />
                </div>
            </div>
        </div>
    );
};
