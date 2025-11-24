
import React, { useState, useEffect } from 'react';
import { i18n } from '../constants.js';
import { SettingsIcon, CheckIcon, LockIcon, Spinner } from './Shared.js';
import { fetchAvailableModels } from '../services/geminiService.js';

const AdminDashboard = ({ language, settings, onUpdateSettings, isAuthenticated, onLogout }) => {
    const t = i18n[language];
    const [formData, setFormData] = useState(settings);
    const [isSaved, setIsSaved] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState('');

    // Update local state if props change
    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    // Safety check: In case user navigates here without auth
    if (!isAuthenticated) {
         return React.createElement('div', { className: "flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in-up" },
            React.createElement('div', { className: "bg-dark-card p-8 rounded-2xl border border-dark-border shadow-xl w-full max-w-md text-center glow-border" },
                React.createElement(LockIcon, { className: "w-12 h-12 text-red-400 mx-auto mb-4" }),
                React.createElement('h2', { className: "text-2xl font-bold text-white mb-2" }, "Access Denied"),
                React.createElement('p', { className: "text-brand-text-light" }, "You must authenticate as an admin to view this page.")
            )
        );
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleIntensityChange = (e) => {
        const value = parseFloat(e.target.value);
        setFormData(prev => ({
            ...prev,
            bgIntensity: value
        }));
    };

    const handleFetchModels = async () => {
        if (!formData.aiApiKey && formData.aiProvider !== 'google') {
            setModelFetchError('API Key is required to fetch models for this provider.');
            return;
        }
        
        setIsLoadingModels(true);
        setModelFetchError('');
        try {
            // If google, we might rely on env key if local is empty
            const keyToUse = formData.aiApiKey || window.process?.env?.API_KEY;
            const models = await fetchAvailableModels(formData.aiProvider, keyToUse);
            setAvailableModels(models);
            
            // If current model isn't in list, select first one
            if (models.length > 0 && !models.find(m => m.id === formData.aiModel)) {
                setFormData(prev => ({ ...prev, aiModel: models[0].id }));
            }
        } catch (err) {
            setModelFetchError(err.message || 'Failed to fetch models');
            // Fallback defaults if fetch fails
            if (formData.aiProvider === 'openai') setAvailableModels([{id: 'gpt-4o', name: 'GPT-4o'}, {id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo'}]);
            if (formData.aiProvider === 'perplexity') setAvailableModels([{id: 'sonar-pro', name: 'Sonar Pro'}, {id: 'sonar', name: 'Sonar'}]);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        onUpdateSettings(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return React.createElement('div', { className: "container mx-auto px-6 py-12 max-w-4xl animate-fade-in-up" },
        React.createElement('div', { className: 'flex items-center justify-between mb-8' },
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'p-3 bg-brand-purple/10 rounded-full text-brand-purple-light border border-brand-purple/20' },
                    React.createElement(SettingsIcon, { className: 'w-8 h-8' })
                ),
                React.createElement('div', null,
                    React.createElement('h1', { className: "text-3xl font-bold text-white" }, "Platform Administration"),
                    React.createElement('p', { className: "text-brand-text-light" }, "Manage global application visuals, contact details, and AI settings.")
                )
            ),
            React.createElement('button', {
                onClick: onLogout,
                className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            },
                React.createElement(LockIcon, { className: "w-4 h-4" }),
                React.createElement('span', { className: "font-semibold text-sm" }, "Lock Dashboard")
            )
        ),

        React.createElement('div', { className: "bg-dark-card border border-dark-border rounded-xl p-8 shadow-xl relative overflow-hidden" },
            // Background glow effect for the card
            React.createElement('div', { className: 'absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none' }),
            
            React.createElement('form', { onSubmit: handleSave, className: "space-y-8 relative z-10" },
                
                // AI Configuration Section
                React.createElement('div', null,
                    React.createElement('h3', { className: "text-xl font-semibold text-white mb-6 border-b border-dark-border pb-3 flex items-center gap-2" }, 
                        "🤖 AI Configuration"
                    ),
                    React.createElement('div', { className: "grid grid-cols-1 gap-6" },
                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6'},
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "aiProvider", className: "block text-sm font-medium text-brand-text-light mb-1" }, "AI Provider"),
                                React.createElement('select', {
                                    id: "aiProvider",
                                    name: "aiProvider",
                                    value: formData.aiProvider || 'google',
                                    onChange: handleChange,
                                    className: "w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                },
                                    React.createElement('option', { value: "google" }, "Google Gemini"),
                                    React.createElement('option', { value: "openai" }, "OpenAI"),
                                    React.createElement('option', { value: "openrouter" }, "OpenRouter"),
                                    React.createElement('option', { value: "perplexity" }, "Perplexity")
                                )
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "aiApiKey", className: "block text-sm font-medium text-brand-text-light mb-1" }, "API Key"),
                                React.createElement('input', {
                                    type: "password",
                                    id: "aiApiKey",
                                    name: "aiApiKey",
                                    value: formData.aiApiKey || '',
                                    onChange: handleChange,
                                    placeholder: `Enter ${formData.aiProvider} API key...`,
                                    className: "w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all hover:border-brand-purple/50"
                                })
                            )
                        ),
                        
                        React.createElement('div', null,
                             React.createElement('div', { className: 'flex justify-between items-end mb-1' },
                                React.createElement('label', { htmlFor: "aiModel", className: "block text-sm font-medium text-brand-text-light" }, "Model Selection"),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: handleFetchModels,
                                    disabled: isLoadingModels,
                                    className: "text-xs text-brand-purple-light hover:text-white underline disabled:opacity-50"
                                }, isLoadingModels ? "Fetching..." : "Refresh Models List")
                             ),
                             React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('select', {
                                    id: "aiModel",
                                    name: "aiModel",
                                    value: formData.aiModel || 'gemini-2.5-flash',
                                    onChange: handleChange,
                                    className: "w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                                },
                                    // Default/Fallback options if fetch hasn't happened
                                    availableModels.length > 0 
                                        ? availableModels.map(m => React.createElement('option', { key: m.id, value: m.id }, m.name || m.id))
                                        : (
                                            formData.aiProvider === 'google' ? [
                                                React.createElement('option', { key: "gemini-2.5-flash", value: "gemini-2.5-flash" }, "Gemini 2.5 Flash"),
                                                React.createElement('option', { key: "gemini-1.5-pro", value: "gemini-1.5-pro" }, "Gemini 1.5 Pro")
                                            ] : [
                                                 React.createElement('option', { key: "default", value: formData.aiModel }, formData.aiModel || "Default Model")
                                            ]
                                        )
                                )
                             ),
                             modelFetchError && React.createElement('p', { className: "text-xs text-red-400 mt-1" }, modelFetchError)
                        )
                    )
                ),

                // Visual Settings Section
                React.createElement('div', null,
                    React.createElement('h3', { className: "text-xl font-semibold text-white mb-6 border-b border-dark-border pb-3 flex items-center gap-2" }, 
                        "✨ Visual Effects"
                    ),
                    
                    React.createElement('div', { className: "grid gap-8" },
                        // Glow Intensity Slider
                        React.createElement('div', { className: "bg-dark-bg/30 p-6 rounded-lg border border-dark-border/50" },
                            React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                                React.createElement('div', null,
                                    React.createElement('label', { htmlFor: "bgIntensity", className: "text-base font-medium text-white block" }, "Hero Background Glow Intensity"),
                                    React.createElement('p', { className: 'text-xs text-brand-text-light mt-1' }, "Controls the opacity and brightness of the gradient lights on the Home page.")
                                ),
                                React.createElement('div', { className: "bg-dark-card px-3 py-1 rounded border border-dark-border text-brand-purple-light font-bold font-mono" }, 
                                    formData.bgIntensity
                                )
                            ),
                            React.createElement('input', {
                                type: "range",
                                id: "bgIntensity",
                                name: "bgIntensity",
                                min: "0",
                                max: "1",
                                step: "0.1",
                                value: formData.bgIntensity,
                                onChange: handleIntensityChange,
                                className: "w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-brand-purple"
                            }),
                            React.createElement('div', { className: 'flex justify-between text-xs text-slate-500 mt-2' },
                                React.createElement('span', null, "Subtle"),
                                React.createElement('span', null, "Vibrant")
                            )
                        ),

                        // Show Cityscape Toggle
                        React.createElement('div', { className: "flex items-center justify-between p-6 bg-dark-bg/30 rounded-lg border border-dark-border/50" },
                             React.createElement('div', null,
                                React.createElement('span', { className: "text-white font-medium block text-base" }, "Show Cityscape Animation"),
                                React.createElement('span', { className: "text-sm text-brand-text-light block mt-1" }, "Toggle the animated vector city background on the home hero section.")
                             ),
                             React.createElement('label', { className: "relative inline-flex items-center cursor-pointer" },
                                React.createElement('input', {
                                    type: "checkbox",
                                    name: "showCityscape",
                                    checked: formData.showCityscape,
                                    onChange: handleChange,
                                    className: "sr-only peer"
                                }),
                                React.createElement('div', { className: "w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-purple rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-purple" })
                            )
                        )
                    )
                ),

                // Contact Info Settings Section
                React.createElement('div', null,
                    React.createElement('h3', { className: "text-xl font-semibold text-white mb-6 border-b border-dark-border pb-3 flex items-center gap-2" }, 
                        "📧 Contact Information"
                    ),
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: "contactEmail", className: "block text-sm font-medium text-brand-text-light mb-1" }, "Contact Email"),
                            React.createElement('input', {
                                type: "email",
                                id: "contactEmail",
                                name: "contactEmail",
                                value: formData.contactEmail,
                                onChange: handleChange,
                                className: "w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all hover:border-brand-purple/50"
                            })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: "contactPhone", className: "block text-sm font-medium text-brand-text-light mb-1" }, "Phone / Footer Text"),
                            React.createElement('input', {
                                type: "text",
                                id: "contactPhone",
                                name: "contactPhone",
                                value: formData.contactPhone,
                                onChange: handleChange,
                                className: "w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all hover:border-brand-purple/50"
                            })
                        )
                    )
                ),

                // Save Button Area
                React.createElement('div', { className: 'pt-6 border-t border-dark-border flex items-center justify-end gap-4' },
                     isSaved && React.createElement('span', { className: "text-green-400 flex items-center gap-2 animate-fade-in-up font-medium bg-green-500/10 px-3 py-1 rounded-full" },
                        React.createElement(CheckIcon, { className: "w-4 h-4" }),
                        "Settings saved!"
                    ),
                    React.createElement('button', {
                        type: "submit",
                        className: "px-8 py-3 bg-button-gradient text-white font-bold rounded-lg shadow-lg shadow-brand-purple/20 hover:opacity-90 hover:shadow-brand-purple/40 transition-all flex items-center justify-center gap-2"
                    },
                        "Save Changes"
                    )
                )
            )
        )
    );
};

export default AdminDashboard;
