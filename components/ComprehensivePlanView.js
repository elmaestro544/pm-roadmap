
import React, { useState, useRef, useEffect } from 'react';
import { generateConsultingPlan } from '../services/comprehensivePlanService.js';
import { DocumentIcon, Spinner, FeatureToolbar, EditIcon, RefreshIcon } from './Shared.js';
import { i18n } from '../constants.js';

// --- Markdown Renderer ---
const MarkdownRenderer = ({ content }) => {
    if (!content) return null;
    
    // Split by lines
    const lines = content.split('\n');
    const elements = [];
    let tableBuffer = [];
    let inTable = false;

    // Helper to render table from collected lines
    const renderTable = (lines, key) => {
        // Filter out divider rows like |---|---|
        const rows = lines.filter(l => !l.match(/^[|\s-:]+$/)).map(l => l.split('|').filter(c => c.trim() !== '').map(c => c.trim()));
        if (rows.length === 0) return null;

        return React.createElement('div', { key: key, className: 'overflow-x-auto my-6' },
            React.createElement('table', { className: 'w-full text-sm text-left border-collapse border border-slate-700/50 print:border-black' },
                React.createElement('thead', null,
                    React.createElement('tr', { className: 'bg-slate-700/50 print:bg-gray-200' },
                        rows[0].map((h, i) => React.createElement('th', { key: i, className: 'p-3 border border-slate-600 font-bold text-white print:text-black print:border-black' }, parseBold(h)))
                    )
                ),
                React.createElement('tbody', null,
                    rows.slice(1).map((row, ri) => 
                        React.createElement('tr', { key: ri, className: 'border-b border-slate-700/50 print:border-black' },
                            row.map((cell, ci) => React.createElement('td', { key: ci, className: 'p-3 border border-slate-600 text-brand-text-light print:text-black print:border-black' }, parseBold(cell)))
                        )
                    )
                )
            )
        );
    };

    // Helper for bold text (**text**)
    const parseBold = (text) => {
        if (!text) return "";
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return React.createElement('strong', { key: i, className: 'text-white font-bold print:text-black' }, part.slice(2, -2));
            }
            return part;
        });
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Table handling
        if (trimmed.startsWith('|')) {
            inTable = true;
            tableBuffer.push(trimmed);
            return; // Continue collecting table lines
        } else if (inTable) {
            inTable = false;
            elements.push(renderTable(tableBuffer, `table-${index}`));
            tableBuffer = [];
        }

        // Headers
        if (trimmed.startsWith('### ')) {
            elements.push(React.createElement('h4', { key: index, className: 'text-lg font-bold text-brand-purple-light mt-6 mb-2 print:text-black' }, trimmed.replace('### ', '')));
        } else if (trimmed.startsWith('## ')) {
            elements.push(React.createElement('h3', { key: index, className: 'text-xl font-bold text-white mt-8 mb-3 print:text-black' }, trimmed.replace('## ', '')));
        } else if (trimmed.startsWith('# ')) {
            elements.push(React.createElement('h2', { key: index, className: 'text-2xl font-bold text-white mt-10 mb-4 print:text-black' }, trimmed.replace('# ', '')));
        }
        // List items
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(React.createElement('div', { key: index, className: 'flex items-start ml-2 mb-1' },
                React.createElement('span', { className: 'mr-2 text-brand-purple-light print:text-black' }, '•'),
                React.createElement('p', { className: 'text-brand-text-light leading-relaxed print:text-black' }, parseBold(trimmed.substring(2)))
            ));
        } 
        // Numbered lists
        else if (trimmed.match(/^\d+\./)) {
             const [num, ...rest] = trimmed.split('.');
             elements.push(React.createElement('div', { key: index, className: 'flex items-start ml-2 mb-1' },
                React.createElement('span', { className: 'mr-2 font-semibold text-brand-text-light print:text-black' }, `${num}.`),
                React.createElement('p', { className: 'text-brand-text-light leading-relaxed print:text-black' }, parseBold(rest.join('.').trim()))
            ));
        }
        // Normal text
        else if (trimmed.length > 0) {
            elements.push(React.createElement('p', { key: index, className: 'mb-3 text-brand-text-light leading-relaxed print:text-black' }, parseBold(trimmed)));
        }
    });
    
    // Flush remaining table if ends with table
    if (inTable) {
         elements.push(renderTable(tableBuffer, `table-end`));
    }

    return React.createElement('div', { className: 'markdown-content' }, elements);
};

// --- Views ---

const InputView = ({ onGenerate, initialData, isLoading, error }) => {
    const [formData, setFormData] = useState(initialData || {
        field: '',
        name: '',
        scope: '',
        location: '',
        budget: '',
        currency: 'USD',
        budgetType: 'Fixed', // Fixed vs Predicted
        startDate: '',
        finishDate: '',
        duration: ''
    });

    const predefinedFields = [
        "Construction & Engineering",
        "Software Development & IT",
        "Marketing & Advertising",
        "Healthcare & Pharmaceuticals",
        "Manufacturing & Logistics",
        "Education & Training",
        "Finance & Banking",
        "Energy, Oil & Gas",
        "Government & Public Sector",
        "Event Management",
        "Real Estate",
        "Telecommunications"
    ];

    const predefinedLocations = [
        "Saudi Arabia",
        "United Arab Emirates",
        "Egypt",
        "Qatar",
        "Kuwait",
        "Bahrain",
        "Oman",
        "United States",
        "United Kingdom",
        "Canada",
        "Germany",
        "France",
        "Global / Remote"
    ];
    
    const locationCurrencyMap = {
        "Saudi Arabia": "SAR",
        "United Arab Emirates": "AED",
        "Egypt": "EGP",
        "Qatar": "QAR",
        "Kuwait": "KWD",
        "Bahrain": "BHD",
        "Oman": "OMR",
        "United States": "USD",
        "United Kingdom": "GBP",
        "Canada": "CAD",
        "Germany": "EUR",
        "France": "EUR",
        "Global / Remote": "USD"
    };
    
    const currencies = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "KWD", "QAR", "OMR", "BHD", "INR", "CNY", "JPY"];

    // Smart Currency switching
    useEffect(() => {
        if (formData.location && locationCurrencyMap[formData.location]) {
            setFormData(prev => ({ ...prev, currency: locationCurrencyMap[formData.location] }));
        }
    }, [formData.location]);

    // Auto-calculate Duration based on dates
    useEffect(() => {
        if (formData.startDate && formData.finishDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.finishDate);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average month days
                setFormData(prev => ({ ...prev, duration: diffMonths }));
            }
        }
    }, [formData.startDate, formData.finishDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = formData.field && formData.name && formData.scope && formData.location;

    return React.createElement('div', { className: 'max-w-3xl mx-auto animate-fade-in-up' },
        React.createElement('div', { className: 'text-center mb-8' },
            React.createElement(DocumentIcon, { className: 'h-16 w-16 text-brand-purple-light mx-auto mb-4' }),
            React.createElement('h2', { className: 'text-3xl font-bold text-white' }, initialData ? "Update Project Criteria" : "Project Management Plan"),
            React.createElement('p', { className: 'text-brand-text-light mt-2' }, "Generate a comprehensive, professional project plan aligned with international standards (PMI, ISO) and local regulations.")
        ),
        React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border space-y-4' },
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Field of Work (e.g., Construction, IT)"),
                React.createElement('input', {
                    name: 'field',
                    list: 'field-options',
                    value: formData.field,
                    onChange: handleChange,
                    placeholder: "Select or type field of work...",
                    className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                }),
                React.createElement('datalist', { id: 'field-options' },
                    predefinedFields.map((f, i) => React.createElement('option', { key: i, value: f }))
                )
            ),
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Project Name"),
                React.createElement('input', {
                    name: 'name',
                    value: formData.name,
                    onChange: handleChange,
                    placeholder: "e.g., Riyadh Metro Line 7 Extension",
                    className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                })
            ),
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Scope Summary"),
                React.createElement('textarea', {
                    name: 'scope',
                    value: formData.scope,
                    onChange: handleChange,
                    placeholder: "Briefly describe the project deliverables, key objectives, and boundaries...",
                    rows: 3,
                    className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white resize-none focus:ring-2 focus:ring-brand-purple focus:outline-none'
                })
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Geographical Location"),
                    React.createElement('input', {
                        name: 'location',
                        list: 'location-options',
                        value: formData.location,
                        onChange: handleChange,
                        placeholder: "Select or type location...",
                        className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                    }),
                    React.createElement('datalist', { id: 'location-options' },
                        predefinedLocations.map((l, i) => React.createElement('option', { key: i, value: l }))
                    )
                ),
                 React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Duration (Months)"),
                    React.createElement('input', {
                        name: 'duration',
                        type: 'number',
                        min: '1',
                        value: formData.duration,
                        onChange: handleChange,
                        placeholder: "e.g., 18 (Calculated from dates if set)",
                        className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                    })
                )
            ),
            
            // Dates Section
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Project Start Date"),
                    React.createElement('input', {
                        type: 'date',
                        name: 'startDate',
                        value: formData.startDate,
                        onChange: handleChange,
                        className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none placeholder-slate-500'
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Project Finish Date"),
                    React.createElement('input', {
                        type: 'date',
                        name: 'finishDate',
                        value: formData.finishDate,
                        onChange: handleChange,
                        min: formData.startDate,
                        className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none placeholder-slate-500'
                    })
                )
            ),

            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Total Budget"),
                React.createElement('div', { className: 'flex gap-2 mb-2' },
                    React.createElement('input', {
                        name: 'budget',
                        type: 'number',
                        value: formData.budget,
                        onChange: handleChange,
                        placeholder: "e.g., 500000",
                        className: 'w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                    }),
                    React.createElement('select', {
                        name: 'currency',
                        value: formData.currency,
                        onChange: handleChange,
                        className: 'w-24 p-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none font-bold'
                    }, currencies.map(c => React.createElement('option', { key: c, value: c }, c)))
                ),
                // Budget Type Toggles
                React.createElement('div', { className: 'flex gap-4' },
                    React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                        React.createElement('input', {
                            type: 'radio',
                            name: 'budgetType',
                            value: 'Fixed',
                            checked: formData.budgetType === 'Fixed',
                            onChange: handleChange,
                            className: 'w-4 h-4 text-brand-purple bg-dark-bg border-dark-border focus:ring-brand-purple'
                        }),
                        React.createElement('span', { className: 'text-sm text-brand-text-light' }, "Fixed Budget")
                    ),
                    React.createElement('label', { className: 'flex items-center gap-2 cursor-pointer' },
                        React.createElement('input', {
                            type: 'radio',
                            name: 'budgetType',
                            value: 'Predicted',
                            checked: formData.budgetType === 'Predicted',
                            onChange: handleChange,
                            className: 'w-4 h-4 text-brand-purple bg-dark-bg border-dark-border focus:ring-brand-purple'
                        }),
                        React.createElement('span', { className: 'text-sm text-brand-text-light' }, "Predicted / Estimate")
                    )
                )
            ),
            error && React.createElement('div', { className: "bg-red-500/10 border border-red-500/30 text-center p-2 rounded-md text-sm text-red-400 font-semibold" }, error),
            React.createElement('button', {
                onClick: () => onGenerate(formData),
                disabled: isLoading || !isFormValid,
                className: "w-full py-3 mt-2 font-semibold text-white bg-button-gradient rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            }, isLoading ? React.createElement(Spinner, { size: '6' }) : (initialData ? "Regenerate Plan" : "Generate Plan"))
        )
    );
};

const LoadingView = () => (
    React.createElement('div', { className: 'text-center flex flex-col items-center h-full justify-center' },
        React.createElement(DocumentIcon, { className: 'h-16 w-16 animate-pulse text-brand-purple-light' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Drafting Project Plan..."),
        React.createElement('p', { className: 'text-brand-text-light mb-8 max-w-md' }, "Developing a strategy based on project scope, local regulations, and global best practices."),
        React.createElement(Spinner, { size: '12' })
    )
);

const SectionCard = ({ title, content }) => (
    React.createElement('div', { className: 'bg-dark-card-solid print:bg-white p-8 rounded-xl border border-dark-border print:border-none glow-border print:shadow-none mb-8 break-inside-avoid' },
        React.createElement('h3', { className: 'text-2xl font-bold text-white print:text-black mb-6 border-b border-dark-border print:border-black pb-3 uppercase tracking-wider' }, title),
        React.createElement(MarkdownRenderer, { content: content || "Content pending generation..." })
    )
);

const ResultsView = ({ plan, criteria }) => {
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return React.createElement('div', { className: 'animate-fade-in-up max-w-5xl mx-auto' },
        // Criteria Summary
        criteria && React.createElement('div', { className: 'mb-8 p-4 bg-dark-card-solid/50 border border-dark-border rounded-lg print:border-gray-300 print:bg-white print:text-black' },
            React.createElement('h4', { className: 'text-xs font-bold text-brand-purple-light uppercase mb-2 print:text-black' }, "Project Parameters"),
            React.createElement('div', { className: 'flex flex-wrap gap-4 text-sm text-brand-text-light print:text-black' },
                React.createElement('span', null, React.createElement('strong', { className: "text-white print:text-black" }, "Location: "), criteria.location),
                criteria.budget && React.createElement('span', null, React.createElement('strong', { className: "text-white print:text-black" }, "Budget: "), `${criteria.currency} ${criteria.budget} (${criteria.budgetType || 'Fixed'})`),
                criteria.startDate && React.createElement('span', null, React.createElement('strong', { className: "text-white print:text-black" }, "Start: "), criteria.startDate),
                criteria.finishDate && React.createElement('span', null, React.createElement('strong', { className: "text-white print:text-black" }, "Finish: "), criteria.finishDate),
                criteria.duration && React.createElement('span', null, React.createElement('strong', { className: "text-white print:text-black" }, "Duration: "), `${criteria.duration} Months`)
            )
        ),
        
        // Printable Document Container
        React.createElement('div', { className: 'print:p-0' },
            // Cover Page
            React.createElement('div', { className: 'bg-gradient-to-br from-slate-900 to-slate-800 print:bg-white print:from-white print:to-white p-12 rounded-2xl mb-12 text-center border-b-4 border-brand-purple print:border-black min-h-[50vh] flex flex-col justify-center items-center' },
                React.createElement('div', { className: 'w-24 h-24 bg-brand-purple/20 print:bg-transparent rounded-full flex items-center justify-center mb-6' },
                     React.createElement(DocumentIcon, { className: 'h-12 w-12 text-brand-purple-light print:text-black' })
                ),
                React.createElement('h1', { className: 'text-4xl md:text-5xl font-extrabold text-white print:text-black mb-4 tracking-tight' }, plan.projectTitle),
                React.createElement('p', { className: 'text-xl text-brand-purple-light print:text-black font-semibold mb-8 uppercase tracking-widest' }, "Project Management Plan"),
                React.createElement('div', { className: 'mt-auto text-brand-text-light print:text-gray-600 space-y-2' },
                    React.createElement('p', null, `Date: ${date}`),
                    React.createElement('p', null, "Status: Draft v1.0"),
                    React.createElement('p', { className: 'text-xs mt-8 opacity-50' }, "Generated by PM Roadmap AI")
                )
            ),

            // Content Sections
            React.createElement(SectionCard, { title: "1. Executive Summary", content: plan.executiveSummary }),
            React.createElement(SectionCard, { title: "2. Scope & Objectives", content: plan.scopeAndObjectives }),
            React.createElement(SectionCard, { title: "3. Standards & Methodologies", content: plan.standardsAndMethodologies }),
            
            React.createElement('div', { className: 'break-before-page' },
                React.createElement('h3', { className: 'text-2xl font-bold text-white print:text-black mb-6 mt-8 print:mt-0 uppercase tracking-wider' }, "4. Governance & Organization"),
                React.createElement('div', { className: 'grid grid-cols-1 gap-6' },
                    React.createElement(SectionCard, { title: "4.1 Roles & Responsibilities", content: plan.governanceStructure?.rolesAndResponsibilities }),
                    React.createElement(SectionCard, { title: "4.2 RACI Matrix", content: plan.governanceStructure?.raciMatrix })
                )
            ),

            React.createElement(SectionCard, { title: "5. Execution Strategy", content: plan.executionStrategy }),
            
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                React.createElement(SectionCard, { title: "6. Risk & Change Management", content: plan.riskAndChangeManagement }),
                React.createElement(SectionCard, { title: "7. QA & KPIs", content: plan.qualityAssuranceAndKPIs })
            ),
            
            React.createElement(SectionCard, { title: "8. Continuous Improvement", content: plan.lessonsLearnedMechanism }),
            React.createElement(SectionCard, { title: "9. Conclusion", content: plan.conclusion })
        )
    );
};

const ComprehensivePlanView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const contentRef = useRef(null);
    
    // Local state to handle Edit/Regenerate workflow
    const [isEditingCriteria, setIsEditingCriteria] = useState(false);
    const [criteria, setCriteria] = useState(null);

    // Initialize criteria from projectData if available (on re-mount)
    useEffect(() => {
        if (projectData.criteria) {
            setCriteria(projectData.criteria);
        }
    }, [projectData.criteria]);

    // Toolbar state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isEditing, setIsEditing] = useState(false);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleToggleEdit = () => setIsEditing(prev => !prev);
    const handleExport = () => window.print();

    const handleGenerate = async (formData) => {
        setIsLoading(true);
        setError(null);
        setIsEditingCriteria(false);
        setCriteria(formData); // Save current criteria
        
        try {
            const plan = await generateConsultingPlan(formData);
            
            // Save plan AND sync criteria AND objective to unlock other workflow steps
            onUpdateProject({ 
                consultingPlan: plan,
                objective: plan.scopeAndObjectives || formData.scope,
                title: plan.projectTitle || formData.name,
                criteria: formData // KEY UPDATE: Persist criteria for other services
            });
            
        } catch (err) {
            setError(err.message || "Failed to generate plan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        onUpdateProject({ consultingPlan: null, criteria: null });
        setCriteria(null);
        setError(null);
        setIsEditingCriteria(false);
    };

    // Check if plan exists in props
    const hasPlan = !!projectData.consultingPlan;

    const customControls = (
        React.createElement(React.Fragment, null,
            React.createElement('button', {
                onClick: () => setIsEditingCriteria(true),
                className: 'p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white transition-colors',
                title: "Edit Criteria"
            }, React.createElement(EditIcon, { className: "h-5 w-5" })),
            React.createElement('button', {
                onClick: handleReset,
                className: 'p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white transition-colors',
                title: "Refresh / New Plan"
            }, React.createElement(RefreshIcon, { className: "h-5 w-5" }))
        )
    );

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        hasPlan && !isEditingCriteria && React.createElement(FeatureToolbar, {
            title: t.dashboardConsultingPlan,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onToggleEdit: handleToggleEdit,
            isEditing: isEditing,
            onExport: handleExport,
            customControls: customControls
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-auto' },
            React.createElement('div', {
               ref: contentRef,
               className: 'p-8 printable-content w-full pb-32 min-h-full',
               style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' },
               contentEditable: isEditing,
               suppressContentEditableWarning: true
            },
                isLoading
                ? React.createElement(LoadingView, null)
                : (hasPlan && !isEditingCriteria)
                    ? React.createElement(ResultsView, { 
                        plan: projectData.consultingPlan, 
                        criteria: projectData.criteria || criteria 
                      })
                    : React.createElement('div', { className: 'h-full flex items-center justify-center' }, 
                        React.createElement(InputView, { 
                            onGenerate: handleGenerate, 
                            initialData: criteria, 
                            isLoading: false, 
                            error 
                        })
                      )
            )
        )
    );
};

export default ComprehensivePlanView;
