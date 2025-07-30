import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { GraduationCap, Briefcase, Users, BrainCircuit, BookOpen, Clock, ArrowRight } from 'lucide-react';

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

export const StudentDashboard: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="bg-gradient-to-r from-brand-aurora-start to-brand-aurora-end p-8 rounded-lg text-white shadow-lg">
                <h1 className="text-4xl font-extrabold">Welcome back, Student!</h1>
                <p className="mt-2 text-lg opacity-90">Your personalized dashboard to kickstart your learning journey.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary-dark">Quick Access</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                        <QuickAccessCard to="/student/dentaversity" icon={<GraduationCap size={24} />} title="Denta-versity" description="Dive into AI-powered learning modules." />
                        <QuickAccessCard to="/student/prep-hub" icon={<BookOpen size={24} />} title="Dent Prep Hub" description="Practice with our extensive question bank." />
                        <QuickAccessCard to="/student/dentomedia" icon={<Users size={24} />} title="DentoMedia" description="Connect and collaborate with peers." />
                        <QuickAccessCard to="/student/dentahunt" icon={<Briefcase size={24} />} title="DentaHunt" description="Find internships and career opportunities." />
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary-dark">Your Stats</h2>
                    <div className="space-y-4 stagger-children">
                        <StatCard icon={<BrainCircuit size={24} />} label="Modules Studied" value="12" />
                        <StatCard icon={<BookOpen size={24} />} label="Practice Qs Answered" value="152" />
                        <StatCard icon={<Clock size={24} />} label="Upcoming Events" value="3" />
                    </div>
                </div>
            </div>
        </div>
    );
};