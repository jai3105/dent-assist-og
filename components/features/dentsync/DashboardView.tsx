
import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format, isToday, subDays, startOfDay } from 'date-fns';
import { ICONS, ROUTES, TransactionType } from './data';
import { useAppContext } from './common';

const DashboardStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; linkTo?: string; }> = ({ title, value, icon, linkTo }) => {
    const content = (
        <div className="bg-surface-dark p-6 rounded-xl shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow h-full border-l-4 border-brand-primary">
            <div className="text-3xl text-brand-primary bg-brand-primary/10 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
                <p className="text-2xl font-bold text-text-primary-dark">{value}</p>
            </div>
        </div>
    );
    return linkTo ? <ReactRouterDOM.Link to={linkTo}>{content}</ReactRouterDOM.Link> : content;
};

const safeParseDate = (dateString: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const FinancialChart: React.FC = () => {
    const { state } = useAppContext();
    const chartData = useMemo(() => {
        const data: { name: string; income: number; expense: number }[] = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const month = subMonths(today, i);
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthTxs = state.transactions.filter(t => {
                const d = safeParseDate(t.date);
                return d && isWithinInterval(d, { start: monthStart, end: monthEnd });
            });
            const summary = monthTxs.reduce((acc, t) => {
                if (t.type === TransactionType.Income) acc.income += t.amount; else acc.expense += t.amount;
                return acc;
            }, { income: 0, expense: 0 });
            data.push({ name: format(monthStart, 'MMM'), ...summary });
        }
        return data;
    }, [state.transactions]);
    
    const max = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

    return (
        <div className="h-64 flex justify-around items-end gap-4 text-text-secondary-dark">
            {chartData.map(d => (
                <div key={d.name} className="flex-1 flex flex-col items-center gap-2">
                     <div className="w-full flex justify-around items-end h-full">
                        <div className="w-1/2 bg-green-500/30 hover:bg-green-500/50 rounded-t-md" style={{ height: `${(d.income / max) * 100}%` }} title={`Income: ₹${d.income.toFixed(0)}`}></div>
                        <div className="w-1/2 bg-red-500/30 hover:bg-red-500/50 rounded-t-md" style={{ height: `${(d.expense / max) * 100}%` }} title={`Expense: ₹${d.expense.toFixed(0)}`}></div>
                    </div>
                    <span className="text-xs font-semibold">{d.name}</span>
                </div>
            ))}
        </div>
    );
};

export const DashboardView: React.FC = () => {
    const { state } = useAppContext();

    const stats = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = subDays(startOfDay(today), 30);
        const last30DaysTx = state.transactions.filter(t => {
            const d = safeParseDate(t.date); return d && isWithinInterval(d, { start: thirtyDaysAgo, end: today });
        });
        return {
            totalPatients: state.patients.length,
            appointmentsToday: state.appointments.filter(a => safeParseDate(a.date) && isToday(safeParseDate(a.date)!)).length,
            totalOutstanding: state.patients.flatMap(p => p.billing).filter(b => b.status === 'Pending').reduce((s, b) => s + b.amount, 0),
            netLast30Days: last30DaysTx.reduce((acc, t) => t.type === 'Income' ? acc + t.amount : acc - t.amount, 0),
        };
    }, [state]);

    const todayAppointments = useMemo(() => 
        state.appointments.filter(a => safeParseDate(a.date) && isToday(safeParseDate(a.date)!)).sort((a,b) => a.time.localeCompare(b.time)),
    [state.appointments]);

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-text-primary-dark">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatCard title="Total Patients" value={stats.totalPatients} icon={ICONS.patients} linkTo={ROUTES.PATIENTS} />
                <DashboardStatCard title="Appointments Today" value={stats.appointmentsToday} icon={ICONS.appointments} linkTo={ROUTES.APPOINTMENTS} />
                <DashboardStatCard title="Outstanding Balance" value={`₹${stats.totalOutstanding.toFixed(2)}`} icon={ICONS.wallet} linkTo={ROUTES.FINANCIALS}/>
                <DashboardStatCard title="Net (Last 30 days)" value={`₹${stats.netLast30Days.toFixed(2)}`} icon={ICONS.financials} linkTo={ROUTES.FINANCIALS}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface-dark p-6 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold text-text-primary-dark mb-4">Today's Schedule</h2>
                    {todayAppointments.length > 0 ? (
                        <ul className="space-y-4">
                            {todayAppointments.map(app => (
                                <li key={app.id} className="flex items-center justify-between p-3 bg-background-dark rounded-md">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-text-primary-dark bg-border-dark px-2 py-1 rounded">{app.time}</span>
                                        <div>
                                            <p className="font-medium text-brand-primary">{app.patientName}</p>
                                            <p className="text-sm text-text-secondary-dark">{app.procedure}</p>
                                        </div>
                                    </div>
                                    <ReactRouterDOM.Link to={`${ROUTES.PATIENTS}/${app.patientId}`} className="text-sm text-brand-secondary hover:underline">View Patient</ReactRouterDOM.Link>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-text-secondary-dark py-8">No appointments scheduled for today.</p>}
                </div>
                <div className="lg:col-span-2 bg-surface-dark p-6 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold text-text-primary-dark mb-4">Financial Summary (Last 6 Months)</h2>
                    <FinancialChart />
                </div>
            </div>
        </div>
    );
};
