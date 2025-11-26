
import React, { useState, useEffect, useRef } from 'react';
import { i18n } from '../constants.js';
import { generateProjectPlan } from '../services/planningService.js';
import { Spinner, UserIcon, HistoryIcon, PlusIcon, AttachIcon, FeatureToolbar } from './Shared.js';


const PlanIcon = ({ className = 'h-16 w-16 text-slate-500' }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className, viewBox: "0 0 64 64" },
    React.createElement('path', { d: "M48 14L49.5 10.5L53 9L49.5 7.5L48 4L46.5 7.5L43 9L46.5 10.5L48 14Z", fill: '#5EEAD4' }),
    React.createElement('path', { d: "M16 44L17.5 40.5L21 39L17.5 37.5L16 34L14.5 37.5L11 39L14.5 40.5L16 44Z", fill: '#2DD4BF', opacity: '0.6' }),
    React.createElement('path', { d: "M14 12C14 10.8954 14.8954 10 16 10H38.5858C39.109 10 39.6109 10.2107 40 10.5858L51.4142 22C51.7893 22.3891 52 22.891 52 23.4142V50C52 51.1046 51.1046 52 50 52H16C14.8954 52 14 51.1046 14 50V12Z", fill: '#1E1B2E', stroke: '#0D9488', strokeWidth: '2' }),
    React.createElement('path', { d: "M38 10V23C38 23.5523 38.4477 24 39 24H52", stroke: '#0D9488', strokeWidth: '2' }),
    React.createElement('rect', { x: '20', y: '30', width: '20', height: '3', rx: '1.5', fill: '#115E59' }),
    React.createElement('rect', { x: '20', y: '38', width: '26', height: '3', rx: '1.5', fill: '#115E59' })
);

const LoadingView = ({ progress }) => (
    React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(PlanIcon, { className: 'h-12 w-12 text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mb-2 text-white' }, "Generating your project plan"),
        React.createElement('p', { className: 'text-brand-text-light mb-8' }, "AI is creating a comprehensive WBS with tasks and milestones."),
        React.createElement(Spinner, { size: '12' })
    )
);

const ResultsView = ({ plan }) => {
    const renderCardFooter = (item) => React.createElement('div', { className: 'flex items-center justify-between text-brand-text-light mt-4 pt-4 border-t border-dark-border print:border-gray-300' },
        React.createElement('div', { className: 'flex items-center gap-4 text-sm' },
            React.createElement('div', { className: 'flex items-center gap-1.5', title: 'Assignees' },
                React.createElement(UserIcon, { className: 'h-4 w-4' }),
                React.createElement('span', null, item.assigneeCount || 1)
            ),
            React.createElement('div', { className: 'flex items-center gap-1.5', title: 'Duration' },
                React.createElement(HistoryIcon, { className: 'h-4 w-4' }),
                React.createElement('span', null, `${item.durationInDays || 1} day${item.durationInDays !== 1 ? 's' : ''}`)
            )
        )
    );

    return React.createElement('div', { className: 'w-full flex flex-col animate-fade-in-up pb-10' },
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 print:block' },
            // Work Breakdown Structure Column
            React.createElement('div', { className: 'print:mb-8' },
                React.createElement('h3', { className: 'text-xl font-semibold mb-4 flex items-center justify-between text-white print:text-black' },
                    "Work Breakdown Structure",
                    React.createElement('button', { className: 'p-2 rounded-full bg-dark-card-solid hover:bg-white/10 print:hidden' }, React.createElement(PlusIcon, { className: 'h-4 w-4' }))
                ),
                React.createElement('div', { className: 'space-y-4' }, plan.workBreakdownStructure?.map((task, index) =>
                    React.createElement('div', { key: index, className: 'bg-dark-card-solid border border-dark-border rounded-lg p-4 break-inside-avoid print:bg-white print:border-gray-300 print:text-black print:shadow-none' },
                        React.createElement('h4', { className: 'font-bold text-white print:text-black' }, task.name),
                        React.createElement('p', { className: 'text-sm text-brand-text-light mt-1 print:text-gray-700' }, task.description),
                        task.subtasks && task.subtasks.length > 0 && (
                             React.createElement('div', { className: 'mt-3 space-y-2 text-sm' }, task.subtasks.map((sub, sIndex) =>
                                React.createElement('div', { key: sIndex, className: 'pl-4 border-l-2 border-dark-border print:border-gray-300' }, sub.name)
                             ))
                        ),
                        renderCardFooter(task)
                    ))
                )
            ),
            // Key Milestones Column
            React.createElement('div', null,
                React.createElement('h3', { className: 'text-xl font-semibold mb-4 flex items-center justify-between text-white print:text-black' },
                    "Key Milestones",
                    React.createElement('button', { className: 'p-2 rounded-full bg-dark-card-solid hover:bg-white/10 print:hidden' }, React.createElement(PlusIcon, { className: 'h-4 w-4' }))
                ),
                React.createElement('div', { className: 'space-y-4' }, plan.keyMilestones?.map((milestone, index) =>
                    React.createElement('div', { key: index, className: 'bg-dark-card-solid border border-dark-border rounded-lg p-4 break-inside-avoid print:bg-white print:border-gray-300 print:text-black print:shadow-none' },
                        React.createElement('h4', { className: 'font-bold text-white print:text-black' }, milestone.name),
                        React.createElement('p', { className: 'text-sm text-brand-text-light mt-1 print:text-gray-700' }, milestone.acceptanceCriteria),
                        renderCardFooter(milestone)
                    ))
                )
            )
        )
    );
};

const InputView = ({ onGenerate, isLoading, error }) => {
    const [objective, setObjective] = useState('');
    const [budget, setBudget] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [duration, setDuration] = useState('');

    const currencies = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "KWD", "QAR", "OMR", "BHD", "INR", "CNY", "JPY"];

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate(objective, budget, currency, duration);
    };
    
    return React.createElement('div', { className: 'w-full max-w-2xl text-center animate-fade-in-up' },
        React.createElement(PlanIcon, { className: 'h-12 w-12 text-slate-500 mx-auto' }),
        React.createElement('h2', { className: 'text-3xl font-bold mb-2 text-white' }, "Start a New Project"),
        React.createElement('p', { className: 'text-brand-text-light mb-6' }, "Provide your high-level project objective below. Our AI will generate a comprehensive plan, schedule, budget, and more."),
        error && React.createElement('div', { className: "bg-red-500/10 border border-red-500/30 text-center p-2 rounded-md mb-4 text-sm text-red-400 font-semibold" }, error),
        React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4 text-left' },
             React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Project Objective / Scope"),
                React.createElement('textarea', {
                    value: objective,
                    onChange: e => setObjective(e.target.value),
                    placeholder: "e.g., Launch a marketing campaign for our new Q4 product release...",
                    rows: 4,
                    className: "w-full p-3 bg-dark-card-solid border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none resize-none text-white placeholder-slate-500",
                    disabled: isLoading
                })
             ),
             React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                 React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Total Budget (Optional)"),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('input', {
                            type: 'number',
                            value: budget,
                            onChange: e => setBudget(e.target.value),
                            placeholder: "e.g. 50000",
                            className: "w-full p-3 bg-dark-card-solid border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none",
                            disabled: isLoading
                        }),
                        React.createElement('select', {
                            value: currency,
                            onChange: e => setCurrency(e.target.value),
                            className: 'w-24 p-3 bg-dark-card-solid border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none font-bold',
                            disabled: isLoading
                        }, currencies.map(c => React.createElement('option', { key: c, value: c }, c)))
                    )
                 ),
                 React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-brand-text-light mb-1' }, "Duration (Months) (Optional)"),
                    React.createElement('input', {
                        type: 'number',
                        value: duration,
                        onChange: e => setDuration(e.target.value),
                        placeholder: "e.g. 6",
                        className: "w-full p-3 bg-dark-card-solid border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none",
                        disabled: isLoading
                    })
                 )
             ),
            React.createElement('button', {
                type: 'submit',
                disabled: isLoading || !objective.trim(),
                className: "w-full px-6 py-3 font-semibold text-white bg-button-gradient rounded-lg shadow-lg shadow-glow-purple transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center"
            }, isLoading ? React.createElement(Spinner, null) : "Generate Project")
        )
    );
};


const PlanningView = ({ language, projectData, onUpdateProject, onResetProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const contentRef = useRef(null);

    // Toolbar State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isEditing, setIsEditing] = useState(false);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleToggleEdit = () => setIsEditing(prev => !prev);
    const handleExport = () => window.print();

    // Effect to auto-generate plan when objective is set (if coming from Consulting Plan)
    useEffect(() => {
        if (projectData.objective && !projectData.plan && !isLoading) {
            const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    // Pass explicit criteria if available from previous step
                    const plan = await generateProjectPlan(projectData.objective, projectData.criteria);
                    onUpdateProject({ plan });
                } catch (err) {
                    setError(err.message || 'An unexpected error occurred.');
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.objective, projectData.plan, projectData.criteria, isLoading, onUpdateProject, setIsLoading, setError]);

    const hasPlan = !!projectData.plan;

    const renderContent = () => {
        if (!projectData.objective) {
            return React.createElement(InputView, {
                onGenerate: (objective, budget, currency, duration) => {
                    const criteria = { budget, currency, duration, budgetType: budget ? 'Fixed' : 'Predicted' };
                    // Save both objective and criteria to be used by this and future steps
                    onUpdateProject({ objective, criteria });
                },
                isLoading,
                error
            });
        }
        if (isLoading && !projectData.plan) {
            return React.createElement(LoadingView, null);
        }
        if (projectData.plan) {
            return React.createElement(ResultsView, { plan: projectData.plan });
        }
        // Fallback for error state where objective exists but plan failed
        return React.createElement(InputView, {
             onGenerate: (objective, budget, currency, duration) => {
                 const criteria = { budget, currency, duration, budgetType: budget ? 'Fixed' : 'Predicted' };
                 onUpdateProject({ objective, criteria });
             },
             isLoading,
             error
         });
    };
    
    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
       hasPlan && React.createElement(FeatureToolbar, {
            title: t.dashboardPlanning,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onToggleEdit: handleToggleEdit,
            isEditing: isEditing,
            onExport: handleExport,
       }),
       React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
           React.createElement('div', {
               ref: contentRef,
               className: 'p-6 printable-content w-full pb-32', 
               style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', width: '100%' },
               contentEditable: isEditing,
               suppressContentEditableWarning: true
           },
               !hasPlan && !isLoading 
                ? React.createElement('div', { className: 'h-full flex items-center justify-center'}, renderContent())
                : renderContent()
           )
       )
    );
};

export default PlanningView;
