
import React, { useState, useEffect } from 'react';
import { i18n } from '../constants.js';
import { SettingsIcon, CheckIcon, Spinner, LockIcon } from './Shared.js';
import { fetchAvailableModels } from '../services/geminiService.js';
import { getUserSettings, saveUserSettings } from '../services/supabaseClient.js';

const UserSettings = ({ language, currentUser }) => {
    const t = i18n[language];
    const [formData, setFormData] = useState({
        aiProvider: 'google',
        aiApiKey: '',
        aiModel: 'gemini-2.5-flash'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const loadSettings = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                const settings = await getUserSettings();
                if (mounted && settings) {
                    setFormData({
                        aiProvider: settings.aiProvider || 'google',
                        aiApiKey: settings.aiApiKey || '',
                        aiModel: settings.aiModel || 'gemini-2.5-flash'
                    });
                }
            } catch (err) {
                console.error("Failed to load user settings", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        loadSettings();
        return () => { mounted = false; };
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFetchModels = async () => {
        if (!formData.aiApiKey) {
            setModelFetchError('API Key is required to fetch models for this provider.');
            return;
        }
        
        setIsLoadingModels(true);
        setModelFetchError('');
        try {
            const models = await fetchAvailableModels(formData.aiProvider, formData.aiApiKey);
            const safeModels = Array.isArray(models) ? models : [];
            setAvailableModels(safeModels);
            
            // If current model isn't in list, select first one
            if (safeModels.length > 0 && !safeModels.find(m => m.id === formData.aiModel)) {
                setFormData(prev => ({ ...prev, aiModel: safeModels[0].id }));
            }
        } catch (err) {
            setModelFetchError(err.message || 'Failed to fetch models');
            // Fallbacks for display
            if (formData.aiProvider === 'openai') setAvailableModels([{id: 'gpt-4o', name: 'GPT-4o'}, {id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo'}]);
            if (formData.aiProvider === 'perplexity') setAvailableModels([{id: 'sonar-pro', name: 'Sonar Pro'}, {id: 'sonar', name: 'Sonar'}]);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            await saveUserSettings(formData);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err) {
            setError("Failed to save settings: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) {
        return React.createElement('div', { className: "flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in-up" },
            React.createElement('div', { className: "bg-dark-card p-8 rounded-2xl border border-dark-border shadow-xl w-full max-w-md text-center glow-border" },
                React.createElement(LockIcon, { className: "w-12 h-12 text-red-400 mx-auto mb-4" }),
                React.createElement('h2', { className: "text-2xl font-bold text-white mb-2" }, "Access Denied"),
                React.createElement('p', { className: "text-brand-text-light" }, "Please log in to configure your settings.")
            )
        );
    }

    if (isLoading) {
        return React.createElement('div', { className: "flex justify-center items-center h-full min-h-[400px]" },
            React.createElement(Spinner, { size: '10' })
        );
    }

    return React.createElement('div', { className: "container mx-auto px-6 py-12 max-w-4xl animate-fade-in-up" },
        React.createElement('div', { className: 'flex items-center gap-4 mb-8' },
            React.createElement('div', { className: 'p-3 bg-brand-purple/10 rounded-full text-brand-purple-light border border-brand-purple/20' },
                React.createElement(SettingsIcon, { className: 'w-8 h-8' })
            ),
            React.createElement('div', null,
                React.createElement('h1', { className: "text-3xl font-bold text-white" }, "User Settings"),
                React.createElement('p', { className: "text-brand-text-light" }, "Configure your personal AI preferences. These settings will override global defaults.")
            )
        ),

        React.createElement('div', { className: "bg-dark-card border border-dark-border rounded-xl p-8 shadow-xl relative overflow-hidden" },
            
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
                                React.createElement('label', { htmlFor: "aiApiKey", className: "block text-sm font-medium text-brand-text-light mb-1" }, "Your API Key"),
                                React.createElement('input', {
                                    type: "password",
                                    id: "aiApiKey",
                                    name: "aiApiKey",
                                    value: formData.aiApiKey || '',
                                    onChange: handleChange,
                                    placeholder: `Enter your ${formData.aiProvider} API key...`,
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
                                }, isLoadingModels ? "Fetching..." : "Fetch Models List")
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

                // Save Button Area
                React.createElement('div', { className: 'pt-6 border-t border-dark-border flex items-center justify-end gap-4' },
                     error && React.createElement('span', { className: "text-red-400 text-sm" }, error),
                     isSaved && React.createElement('span', { className: "text-green-400 flex items-center gap-2 animate-fade-in-up font-medium bg-green-500/10 px-3 py-1 rounded-full" },
                        React.createElement(CheckIcon, { className: "w-4 h-4" }),
                        "Settings saved!"
                    ),
                    React.createElement('button', {
                        type: "submit",
                        disabled: isSaving,
                        className: "px-8 py-3 bg-button-gradient text-white font-bold rounded-lg shadow-lg shadow-brand-purple/20 hover:opacity-90 hover:shadow-brand-purple/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    },
                        isSaving && React.createElement(Spinner, { size: '4' }),
                        "Save Personal Settings"
                    )
                )
            )
        )
    );
};

export default UserSettings;
