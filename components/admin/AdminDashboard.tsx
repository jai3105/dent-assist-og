
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { BarChart2, Briefcase, MessageSquare, Settings, ShoppingCart, Users } from 'lucide-react';

const AdminCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark transition-all duration-300 hover:shadow-brand-glow/20 hover:border-brand-primary/50">
        <div className="flex items-center gap-4 mb-4">
            <div className="text-brand-glow bg-brand-primary/10 p-3 rounded-lg">{icon}</div>
            <h3 className="text-xl font-bold text-text-primary-dark">{title}</h3>
        </div>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const AdminAction: React.FC<{ children: React.ReactNode; }> = ({ children }) => (
    <button className="w-full text-left bg-background-dark p-3 rounded-md hover:bg-surface-light text-text-secondary-dark hover:text-text-primary-dark transition-colors font-medium">
        {children}
    </button>
);

export const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-dark text-text-primary-dark p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto animate-slide-in-up">
                <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Admin Control Panel</h1>
                        <p className="text-text-secondary-dark mt-1">Manage all features of the DentAssist Super-App.</p>
                    </div>
                    <ReactRouterDOM.Link
                        to="/select-role"
                        className="bg-surface-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold border border-border-dark hover:bg-surface-light transition-colors"
                    >
                        Back to App
                    </ReactRouterDOM.Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AdminCard title="DentaMart Management" icon={<ShoppingCart size={24} />}>
                        <AdminAction>View & Manage Orders</AdminAction>
                        <AdminAction>Add/Edit Products</AdminAction>
                        <AdminAction>Manage Inventory</AdminAction>
                    </AdminCard>

                    <AdminCard title="User Management" icon={<Users size={24} />}>
                        <AdminAction>View All Users</AdminAction>
                        <AdminAction>Manage Roles & Permissions</AdminAction>
                        <AdminAction>Handle User Reports</AdminAction>
                    </AdminCard>
                    
                    <AdminCard title="DentoMedia Control" icon={<MessageSquare size={24} />}>
                        <AdminAction>Moderate Posts & Comments</AdminAction>
                        <AdminAction>Review Reported Content</AdminAction>
                        <AdminAction>View Forum Analytics</AdminAction>
                    </AdminCard>

                    <AdminCard title="DentaHunt Jobs" icon={<Briefcase size={24} />}>
                        <AdminAction>Approve New Job Postings</AdminAction>
                        <AdminAction>Manage Company Accounts</AdminAction>
                        <AdminAction>View Posting Statistics</AdminAction>
                    </AdminCard>
                    
                    <AdminCard title="App Analytics" icon={<BarChart2 size={24} />}>
                        <AdminAction>Overall User Engagement</AdminAction>
                        <AdminAction>Feature Usage Statistics</AdminAction>
                        <AdminAction>Financial Overview</AdminAction>
                    </AdminCard>

                    <AdminCard title="System Settings" icon={<Settings size={24} />}>
                        <AdminAction>Configure AI Models</AdminAction>
                        <AdminAction>Manage App Integrations</AdminAction>
                        <AdminAction>System Health & Logs</AdminAction>
                    </AdminCard>
                </div>
            </div>
        </div>
    );
};