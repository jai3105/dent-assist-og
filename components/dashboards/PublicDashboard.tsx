import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { HeartPulse, Camera, ClipboardList, Ghost, Search, ArrowRight } from 'lucide-react';

const QuickAccessCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; }> = ({ to, icon, title, description }) => (
    <ReactRouterDOM.Link to={to} className="block bg-surface-dark p-8 rounded-lg border border-border-dark transition-all transform hover:-translate-y-2 group aurora-border-glow">
        <div className="text-brand-aurora-start group-hover:text-brand-aurora-end transition-colors">{icon}</div>
        <h4 className="font-bold text-2xl text-text-primary-dark mt-4">{title}</h4>
        <p className="text-md text-text-secondary-dark mt-2">{description}</p>
        <div className="mt-4 text-sm font-semibold text-brand-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Open Tool <ArrowRight size={16} />
        </div>
    </ReactRouterDOM.Link>
);

export const PublicDashboard: React.FC = () => {
    return (
        <div className="space-y-12 animate-fade-in">
            <div className="text-center bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end p-8 rounded-lg text-white shadow-lg">
                <h1 className="text-4xl font-extrabold">Welcome to DentAssist</h1>
                <p className="mt-2 text-lg opacity-90 max-w-2xl mx-auto">Your personal companion for understanding and managing your dental health.</p>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-text-primary-dark mb-6 text-center">How can we help you today?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-children">
                    <QuickAccessCard to="/public/symptom-checker" icon={<HeartPulse size={48} />} title="Symptom Checker" description="Have a dental concern? Get preliminary insights from our AI." />
                    <QuickAccessCard to="/public/ai-scanner" icon={<Camera size={48} />} title="AI Scanner" description="Use your camera to get an AI-powered look at your teeth." />
                    <QuickAccessCard to="/public/procedure-pedia" icon={<ClipboardList size={48} />} title="ProcedurePedia" description="Understand dental treatments in simple terms." />
                    <QuickAccessCard to="/public/myth-busters" icon={<Ghost size={48} />} title="Myth Busters" description="Separate dental fact from fiction with our AI tool." />
                </div>
            </div>

             <div className="text-center bg-surface-dark p-8 rounded-lg border border-border-dark aurora-border-glow">
                <h3 className="text-2xl font-bold text-text-primary-dark">Looking for a Dentist?</h3>
                <p className="text-text-secondary-dark mt-2 mb-6">Our directory can help you find a professional near you.</p>
                 <ReactRouterDOM.Link to="/public/dentradar" className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-brand-aurora-start/40 transition-shadow">
                    <Search size={20} />
                    Find a Professional
                </ReactRouterDOM.Link>
            </div>
        </div>
    );
};