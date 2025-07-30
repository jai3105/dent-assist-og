import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { GraduationCap, Briefcase, Users } from 'lucide-react';

const RoleCard: React.FC<{ to: string, icon: React.ReactNode, title: string, description: string, delay: number, color: string }> = ({ to, icon, title, description, delay, color }) => (
    <ReactRouterDOM.Link 
        to={to} 
        className="block p-8 rounded-2xl text-center transform hover:-translate-y-2 group relative bg-surface-dark hover:shadow-2xl animate-slide-in-up role-card"
        style={{ animationDelay: `${delay}s` } as React.CSSProperties}
    >
        <div className="relative z-10">
            <div className={`w-20 h-20 mx-auto rounded-full bg-background-dark flex items-center justify-center text-brand-primary mb-6 border-2 border-border-dark transition-all duration-300 group-hover:border-brand-primary group-hover:scale-110 group-hover:bg-brand-primary/10`}>
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-text-primary-dark">{title}</h2>
            <p className="text-text-secondary-dark mt-2 h-24">{description}</p>
            <div className="mt-6 font-semibold text-brand-primary transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                Select Profile &rarr;
            </div>
        </div>
    </ReactRouterDOM.Link>
);


export const RoleSelectionPage: React.FC = () => {
    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-text-primary-dark p-4 overflow-hidden relative">
                <div className="relative z-10 w-full">
                    <div className="text-center mb-12 animate-slide-in-up" style={{ animationDelay: '0.1s'}}>
                        <svg width="64" height="64" viewBox="0 0 24 24" className="mx-auto text-brand-primary mb-4">
                            <path fill="currentColor" d="M17 2H7c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h1.34c.48 0 .93.2 1.25.53A3.991 3.991 0 0 0 12 14a3.991 3.991 0 0 0 1.41-1.47c.32-.33.77-.53 1.25-.53H16c1.66 0 3-1.34 3-3V4c0-1.1-.9-2-2-2zm-3 15.5c-1.18 1.18-3.03 1.18-4.2 0l-.8-.8c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l.8.8c1.95 1.95 5.12 1.95 7.07 0l.8-.8c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-.8.8z"/>
                        </svg>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Choose Your Experience</h1>
                        <p className="text-lg text-text-secondary-dark mt-2">Select the role that best describes you to personalize your journey.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto">
                        <RoleCard
                            to="/student"
                            icon={<GraduationCap size={40} />}
                            title="For Dental Students"
                            description="Access AI-powered learning hubs, exam preparation tools, collaborative projects, and career guidance resources."
                            delay={0.3}
                            color="var(--brand-secondary)"
                        />
                        <RoleCard
                            to="/professional"
                            icon={<Briefcase size={40} />}
                            title="For Professionals"
                            description="The complete suite for practice management, e-commerce, lab connectivity, and professional networking."
                            delay={0.4}
                            color="var(--brand-primary)"
                        />
                        <RoleCard
                            to="/public"
                            icon={<Users size={40} />}
                            title="For the Public"
                            description="Patient-focused tools for AI symptom checking, procedure information, and personal health tracking."
                            delay={0.5}
                            color="#33FF99"
                        />
                    </div>
                     <div className="mt-16 text-center animate-slide-in-up" style={{ animationDelay: '0.7s'}}>
                        <ReactRouterDOM.Link
                            to="/admin"
                            className="text-text-secondary-dark hover:text-white transition-colors text-sm"
                        >
                            Administrative Login
                        </ReactRouterDOM.Link>
                    </div>
                </div>
            </div>
        </>
    );
};