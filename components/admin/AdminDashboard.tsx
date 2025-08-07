
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { BarChart2, Briefcase, Check, Copy, Eye, EyeOff, Key, MessageSquare, RefreshCw, Settings, ShoppingCart, Users } from 'lucide-react';

const AdminCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; id?: string; }> = ({ title, icon, children, id }) => (
    <div id={id} className="bg-surface-dark p-6 rounded-lg shadow-lg border border-border-dark transition-all duration-300 hover:shadow-brand-glow/20 hover:border-brand-primary/50">
        <div className="flex items-center gap-4 mb-4">
            <div className="text-brand-glow bg-brand-primary/10 p-3 rounded-lg">{icon}</div>
            <h3 className="text-xl font-bold text-text-primary-dark">{title}</h3>
        </div>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const AdminAction: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
    <button 
        className="w-full text-left bg-background-dark p-3 rounded-md hover:bg-surface-light text-text-secondary-dark hover:text-text-primary-dark transition-colors font-medium"
        onClick={onClick}
    >
        {children}
    </button>
);

// Mock API usage data - in a real app, this would come from your backend
const mockApiUsageData = {
    totalRequests: 1243,
    successRate: 99.2,
    averageResponseTime: 0.8,
    lastUsed: new Date().toISOString(),
    quotaUsage: 62,
    quotaLimit: 2000,
};

// Available Gemini models
const geminiModels = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient model for most tasks',
        contextWindow: '32K tokens',
        strengths: ['Quick responses', 'Cost-effective', 'General purpose'],
        status: 'active',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Advanced model with enhanced reasoning capabilities',
        contextWindow: '128K tokens',
        strengths: ['Complex reasoning', 'Detailed analysis', 'Multimodal'],
        status: 'active',
    },
    {
        id: 'gemini-2.5-ultra',
        name: 'Gemini 2.5 Ultra',
        description: 'Most powerful model for sophisticated tasks',
        contextWindow: '1M tokens',
        strengths: ['Advanced reasoning', 'Expert-level knowledge', 'Long-context understanding'],
        status: 'limited access',
    },
];

const ApiKeyManager: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>('');
    const [showApiKey, setShowApiKey] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isUpdated, setIsUpdated] = useState<boolean>(false);
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [apiUsage, setApiUsage] = useState(mockApiUsageData);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    
    useEffect(() => {
        // In a real app, you might fetch this from a secure storage or backend
        // For demo purposes, we're reading from the environment
        const key = import.meta.env.VITE_GEMINI_API_KEY || '';
        setApiKey(key);
    }, []);
    
    const handleCopyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleUpdateApiKey = () => {
        // In a real app, you would update this in a secure way, possibly via a backend API
        // For demo purposes, we're just showing the UI
        setIsUpdated(true);
        
        // In a real app, you would save both the API key and selected model
        console.log('Updating API key and model settings:', {
            apiKey,
            selectedModel
        });
        
        setTimeout(() => setIsUpdated(false), 2000);
    };
    
    const toggleShowApiKey = () => {
        setShowApiKey(!showApiKey);
    };
    
    const testApiKey = async () => {
        if (!apiKey) {
            setTestResult({ success: false, message: 'Please enter an API key first' });
            return;
        }
        
        setIsTesting(true);
        setTestResult(null);
        
        try {
            // Simple test request to Gemini API
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Hello, can you respond with just the word "Connected" to verify the connection?'
                        }]
                    }]
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                setTestResult({ 
                    success: true, 
                    message: 'API key is valid and working correctly!' 
                });
            } else {
                setTestResult({ 
                    success: false, 
                    message: data.error?.message || 'Unknown error occurred' 
                });
            }
        } catch (error) {
            setTestResult({ 
                success: false, 
                message: error instanceof Error ? error.message : 'Failed to connect to Gemini API' 
            });
        } finally {
            setIsTesting(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-background-dark p-3 rounded-md">
                <div className="flex-1">
                    <p className="text-text-secondary-dark mb-1">Gemini API Key</p>
                    <div className="flex items-center gap-2">
                        <input 
                            type={showApiKey ? 'text' : 'password'} 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-surface-dark border border-border-dark rounded px-3 py-2 text-text-primary-dark"
                        />
                        <button 
                            onClick={toggleShowApiKey}
                            className="p-2 bg-surface-dark rounded-md hover:bg-surface-light transition-colors"
                            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                        >
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button 
                            onClick={handleCopyApiKey}
                            className="p-2 bg-surface-dark rounded-md hover:bg-surface-light transition-colors relative"
                            aria-label="Copy API key"
                        >
                            {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            {isCopied && (
                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface-light px-2 py-1 rounded text-xs">
                                    Copied!
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={handleUpdateApiKey}
                    className="flex-1 bg-brand-primary text-white p-3 rounded-md hover:bg-brand-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    Update API Key
                    {isUpdated && (
                        <Check size={18} className="text-white" />
                    )}
                </button>
                <button 
                    onClick={testApiKey}
                    disabled={isTesting}
                    className="flex-1 bg-surface-light text-text-primary-dark p-3 rounded-md hover:bg-surface-light/80 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    {isTesting ? 'Testing...' : 'Test API Key'}
                </button>
            </div>
            
            {testResult && (
                <div className={`mt-3 p-3 rounded-md ${testResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <p className="text-sm font-medium">{testResult.message}</p>
                </div>
            )}
            
            <div className="mt-6 bg-surface-dark p-4 rounded-lg border border-border-dark">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-text-primary-dark">API Usage Statistics</h4>
                    <button 
                        onClick={() => {
                            setIsRefreshing(true);
                            // Simulate API call to refresh stats
                            setTimeout(() => {
                                setApiUsage({
                                    ...apiUsage,
                                    lastUsed: new Date().toISOString(),
                                    totalRequests: apiUsage.totalRequests + Math.floor(Math.random() * 10)
                                });
                                setIsRefreshing(false);
                            }, 1000);
                        }}
                        disabled={isRefreshing}
                        className="p-2 bg-surface-light rounded-md hover:bg-surface-light/80 transition-colors"
                        aria-label="Refresh statistics"
                    >
                        <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-background-dark p-3 rounded-md">
                        <p className="text-xs text-text-secondary-dark">Total Requests</p>
                        <p className="text-xl font-bold text-text-primary-dark">{apiUsage.totalRequests.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-background-dark p-3 rounded-md">
                        <p className="text-xs text-text-secondary-dark">Success Rate</p>
                        <p className="text-xl font-bold text-text-primary-dark">{apiUsage.successRate}%</p>
                    </div>
                    
                    <div className="bg-background-dark p-3 rounded-md">
                        <p className="text-xs text-text-secondary-dark">Avg. Response Time</p>
                        <p className="text-xl font-bold text-text-primary-dark">{apiUsage.averageResponseTime}s</p>
                    </div>
                    
                    <div className="bg-background-dark p-3 rounded-md">
                        <p className="text-xs text-text-secondary-dark">Last Used</p>
                        <p className="text-xl font-bold text-text-primary-dark">{new Date(apiUsage.lastUsed).toLocaleTimeString()}</p>
                    </div>
                </div>
                
                <div className="bg-background-dark p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-text-secondary-dark">Monthly Quota Usage</p>
                        <p className="text-xs text-text-secondary-dark">{apiUsage.quotaUsage} / {apiUsage.quotaLimit}</p>
                    </div>
                    <div className="w-full bg-surface-light rounded-full h-2">
                        <div 
                            className="bg-brand-primary h-2 rounded-full" 
                            style={{ width: `${(apiUsage.quotaUsage / apiUsage.quotaLimit) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 bg-surface-dark p-4 rounded-lg border border-border-dark">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-text-primary-dark">Available Gemini Models</h4>
                    <button 
                        onClick={handleUpdateApiKey}
                        className="px-3 py-1 bg-brand-primary text-white text-sm rounded-md hover:bg-brand-primary/90 transition-colors"
                    >
                        Save Model Selection
                    </button>
                </div>
                
                <div className="space-y-4">
                    {geminiModels.map(model => (
                        <div 
                            key={model.id} 
                            className={`bg-background-dark p-4 rounded-md border-2 transition-all ${selectedModel === model.id ? 'border-brand-primary' : 'border-transparent'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-semibold text-text-primary-dark">{model.name}</h5>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${model.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                            {model.status === 'active' ? 'Active' : 'Limited Access'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary-dark mt-1">{model.description}</p>
                                </div>
                                <div>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="model-selection" 
                                            value={model.id}
                                            checked={selectedModel === model.id}
                                            onChange={() => setSelectedModel(model.id)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 ${selectedModel === model.id ? 'border-brand-primary bg-brand-primary' : 'border-text-secondary-dark'} flex items-center justify-center`}>
                                            {selectedModel === model.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                        <span className="ml-2 text-sm font-medium text-text-primary-dark">
                                            {selectedModel === model.id ? 'Default' : 'Set as Default'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs text-text-secondary-dark">Context Window</p>
                                    <p className="text-sm font-medium text-text-primary-dark">{model.contextWindow}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary-dark">Best For</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {model.strengths.map((strength, i) => (
                                            <span key={i} className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                                                {strength}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-md">
                <p className="text-sm text-yellow-500 font-medium">Security Notice</p>
                <p className="text-xs text-text-secondary-dark mt-1">
                    Your API key is stored securely and used for all AI-powered features across the platform. Never share your API key publicly or commit it to public repositories. For production use, implement proper key rotation and secure storage practices.
                </p>
            </div>
        </div>
    );
};

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
                        <AdminAction onClick={() => document.getElementById('api-management')?.scrollIntoView({ behavior: 'smooth' })}>Manage API Keys</AdminAction>
                        <AdminAction>Manage App Integrations</AdminAction>
                        <AdminAction>System Health & Logs</AdminAction>
                    </AdminCard>

                    <AdminCard title="API Management" icon={<Key size={24} />} id="api-management">
                        <ApiKeyManager />
                    </AdminCard>
                </div>
            </div>
        </div>
    );
};