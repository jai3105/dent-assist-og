import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { RefreshCw, FlaskConical, LineChart, Calendar, Wallet, ArrowRight } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-surface-dark p-4 rounded-lg flex items-center gap-4 border border-border-dark aurora-border-glow">
        <div className="text-brand-aurora-start bg-brand-aurora-start/10 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary-dark">{label}</p>
            <p className="text-2xl font-bold text-text-primary-dark">{value}</p>
        </div>
    </div>
);

const QuickAccessCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; }> = ({ to, icon, title, description }) => (
    <ReactRouterDOM.Link to={to} className="block bg-surface-dark p-6 rounded-lg border border-border-dark transition-all transform hover:-translate-y-1 group aurora-border-glow">
        <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg text-text-primary-dark">{title}</h4>
            <div className="text-brand-secondary transition-transform group-hover:scale-110">{icon}</div>
        </div>
        <p className="text-sm text-text-secondary-dark mt-2">{description}</p>
         <div className="mt-4 text-sm font-semibold text-brand-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Go to {title} <ArrowRight size={16} />
        </div>
    </ReactRouterDOM.Link>
);

const mockAppointments = [
    { time: '10:00 AM', patient: 'Rohan Sharma', procedure: 'RCT Follow-up' },
    { time: '11:30 AM', patient: 'Priya Patel', procedure: 'New Patient Consult' },
    { time: '02:00 PM', patient: 'Amit Singh', procedure: 'Crown Fitting' },
];

export const ProfessionalDashboard: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end p-8 rounded-lg text-white shadow-lg">
                <h1 className="text-4xl font-extrabold">Welcome, Dr. Sharma!</h1>
                <p className="mt-2 text-lg opacity-90">Here's your practice overview for today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                <StatCard icon={<Calendar size={24} />} label="Today's Appointments" value="8" />
                <StatCard icon={<FlaskConical size={24} />} label="Pending Lab Cases" value="3" />
                <StatCard icon={<Wallet size={24} />} label="Outstanding Balance" value="₹45,200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Today's Schedule</h2>
                    <div className="bg-surface-dark p-4 rounded-lg border border-border-dark space-y-3 stagger-children">
                        {mockAppointments.map(appt => (
                            <div key={appt.time} className="flex items-center justify-between p-3 bg-background-dark rounded-md">
                                <span className="font-mono text-text-secondary-dark">{appt.time}</span>
                                <p className="font-semibold text-text-primary-dark">{appt.patient}</p>
                                <p className="text-sm text-text-secondary-dark">{appt.procedure}</p>
                                <ReactRouterDOM.Link to="/professional/dentsync/patients" className="text-xs font-semibold text-brand-primary hover:underline">View</ReactRouterDOM.Link>
                            </div>
                        ))}
                         <ReactRouterDOM.Link to="/professional/dentsync/appointments" className="block text-center text-sm font-semibold text-brand-primary hover:underline pt-2">View Full Schedule &rarr;</ReactRouterDOM.Link>
                    </div>
                </div>
                 <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-text-primary-dark mb-4">Quick Access</h2>
                    <div className="space-y-4 stagger-children">
                        <QuickAccessCard to="/professional/dentsync" icon={<RefreshCw size={24} />} title="DentSync" description="Manage your practice." />
                        <QuickAccessCard to="/professional/dentalab-connect" icon={<FlaskConical size={24} />} title="DentaLab Connect" description="Track lab cases." />
                        <QuickAccessCard to="/professional/dentstats" icon={<LineChart size={24} />} title="DentStats" description="View performance." />
                    </div>
                </div>
            </div>
        </div>
    );
};