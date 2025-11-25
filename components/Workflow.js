
import React, { useState } from 'react';
import { i18n } from '../constants.js';
import { 
    PlanningIcon, RiskIcon, AgentIcon, ScheduleIcon, BudgetIcon, 
    AssistantIcon, StructureIcon, KpiIcon, SCurveIcon, DocumentIcon 
} from './Shared.js';

const Workflow = ({ language }) => {
    const t = i18n[language];
    const [expandedStep, setExpandedStep] = useState(null);

    const steps = [
        { id: 'consulting', title: t.step1Title, desc: t.step1Desc, icon: DocumentIcon },
        { id: 'planning', title: t.step2Title, desc: t.step2Desc, icon: PlanningIcon },
        { id: 'scheduling', title: t.step3Title, desc: t.step3Desc, icon: ScheduleIcon },
        { id: 'budget', title: t.step4Title, desc: t.step4Desc, icon: BudgetIcon },
        { id: 'risk', title: t.step5Title, desc: t.step5Desc, icon: RiskIcon },
        { id: 'structure', title: t.step6Title, desc: t.step6Desc, icon: StructureIcon },
        { id: 'agents', title: t.step7Title, desc: t.step7Desc, icon: AgentIcon },
        { id: 'kpis', title: t.step8Title, desc: t.step8Desc, icon: KpiIcon },
        { id: 'scurve', title: t.step9Title, desc: t.step9Desc, icon: SCurveIcon },
        { id: 'assistant', title: t.step10Title, desc: t.step10Desc, icon: AssistantIcon },
    ];

    const toggleStep = (id) => {
        setExpandedStep(expandedStep === id ? null : id);
    };

    return React.createElement('div', { className: 'min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden' },
        // Background Effects
        React.createElement('div', { className: 'absolute inset-0 bg-dark-bg pointer-events-none -z-10' }),
        React.createElement('div', { className: 'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-purple-light to-transparent opacity-50' }),
        
        // Header
        React.createElement('div', { className: 'text-center max-w-3xl mx-auto mb-16 animate-fade-in-up' },
            React.createElement('h1', { className: 'text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-white to-brand-cyan mb-6' }, t.workflowTitle),
            React.createElement('p', { className: 'text-lg text-brand-text-light' }, t.workflowSubtitle)
        ),

        // Timeline Container
        React.createElement('div', { className: 'max-w-4xl mx-auto relative' },
            // Vertical Line
            React.createElement('div', { className: 'absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-brand-purple via-brand-pink to-brand-cyan opacity-30 rounded-full' }),

            // Steps
            steps.map((step, index) => {
                const isExpanded = expandedStep === step.id;
                const isEven = index % 2 === 0;
                
                return React.createElement('div', { 
                    key: step.id,
                    className: `relative flex items-center justify-between mb-12 ${isEven ? 'flex-row' : 'flex-row-reverse'} group perspective-1000`
                },
                    // Content Side
                    React.createElement('div', { className: `w-[42%] ${isEven ? 'text-right' : 'text-left'} hidden md:block` },
                         React.createElement('h3', { 
                             className: `text-xl font-bold transition-colors duration-300 ${isExpanded ? 'text-brand-purple-light' : 'text-white'}`
                         }, step.title)
                    ),

                    // Center Node
                    React.createElement('button', {
                        onClick: () => toggleStep(step.id),
                        className: `absolute left-1/2 transform -translate-x-1/2 z-10 w-16 h-16 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-110 focus:outline-none
                            ${isExpanded 
                                ? 'bg-dark-card border-brand-purple shadow-[0_0_20px_rgba(45,212,191,0.5)]' 
                                : 'bg-dark-card-solid border-dark-border hover:border-brand-purple/50'}`
                    },
                        React.createElement(step.icon, { 
                            className: `w-8 h-8 transition-colors duration-300 ${isExpanded ? 'text-brand-purple-light' : 'text-slate-400'}` 
                        })
                    ),

                    // Card Side (Clickable Area)
                    React.createElement('div', { 
                        className: `w-full md:w-[42%] cursor-pointer`,
                        onClick: () => toggleStep(step.id)
                    },
                         React.createElement('div', { 
                             className: `bg-dark-card border border-dark-border rounded-xl p-6 transition-all duration-500 hover:border-brand-purple/30 glow-border
                                        ${isExpanded ? 'shadow-2xl bg-dark-card-solid ring-1 ring-brand-purple/50' : 'hover:-translate-y-1 hover:shadow-lg'}`
                         },
                            // Mobile Title (visible only on small screens)
                            React.createElement('h3', { className: 'text-lg font-bold text-white mb-2 md:hidden' }, step.title),
                            
                            // Collapsible Content
                            React.createElement('div', { 
                                className: `transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`
                            },
                                React.createElement('p', { className: 'text-brand-text-light leading-relaxed' }, step.desc),
                                React.createElement('div', { className: 'mt-4 flex items-center gap-2 text-brand-purple-light text-sm font-semibold' },
                                    "Learn more",
                                    React.createElement('svg', { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                                    )
                                )
                            ),
                            
                            // Hint when collapsed
                            !isExpanded && React.createElement('p', { className: 'text-sm text-slate-500 italic' }, "Click to expand details...")
                         )
                    )
                );
            })
        )
    );
};

export default Workflow;
