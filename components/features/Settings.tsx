
import React from 'react';
import { LogOut } from 'lucide-react';

const SettingsItem: React.FC<{ title: string; description: string; buttonText: string }> = ({ title, description, buttonText}) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border-dark rounded-lg">
        <div>
            <h4 className="font-semibold text-text-primary-dark">{title}</h4>
            <p className="text-sm text-text-secondary-dark">{description}</p>
        </div>
        <button className="mt-3 sm:mt-0 bg-background-dark px-4 py-2 rounded-lg text-text-primary-dark font-semibold border border-border-dark hover:bg-slate-700 transition-colors flex-shrink-0">
            {buttonText}
        </button>
    </div>
);

export const Settings: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-surface-dark p-8 rounded-lg shadow-md border border-border-dark animate-fade-in">
                <h3 className="text-2xl font-bold text-text-primary-dark mb-2">Account Settings</h3>
                <p className="text-text-secondary-dark mb-6 border-b border-border-dark pb-6">
                    Manage your profile information, notification preferences, and security settings.
                </p>

                <div className="space-y-4">
                    <SettingsItem 
                        title="Profile Information"
                        description="Edit your name, specialty, and contact details."
                        buttonText="Edit Profile"
                    />
                    <SettingsItem 
                        title="Notification Settings"
                        description="Choose what you get notified about."
                        buttonText="Configure"
                    />
                    <SettingsItem 
                        title="Password & Security"
                        description="Change your password and manage security."
                        buttonText="Change Password"
                    />

                     <div className="mt-8 pt-6 border-t border-border-dark flex justify-end">
                        <button className="bg-red-600 px-5 py-2 rounded-lg text-white font-semibold hover:bg-red-700 transition-colors flex items-center">
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};