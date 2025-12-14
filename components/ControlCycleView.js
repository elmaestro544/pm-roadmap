
import React, { useRef, useState } from 'react';
import { FeatureToolbar, CheckIcon, RefreshIcon } from './Shared.js';
import { i18n } from '../constants.js';

const ControlCycleView = ({ language, projectData, onNavigate }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleExport = () => window.print();

    // Determine status of each phase based on data existence
    const hasPlan = !!projectData.plan && !!projectData.budget;
    const hasProgress = projectData.schedule && projectData.schedule.some(t => t.progress > 0);
    const hasAnalysis = !!projectData.kpiReport || !!projectData.sCurveReport;
    const hasAction = !!projectData.risk;

    const phases = [
        {
            id: 1,
            title: "Establish the Plan",
            status: hasPlan ? 'Complete' : 'Pending',
            desc: "Define baseline scope, schedule, and budget with the right level of detail.",
            actions: [
                { label: "Go to Planning", target: "planning" },
                { label: "Go to Budget", target: "budget" }
            ],
            color: "bg-blue-600",
            borderColor: "border-blue-500"
        },
        {
            id: 2,
            title: "Monitor Progress",
            status: hasProgress ? 'Active' : 'Pending',
            desc: "Continuously collect data on quantities, hours, cost, and forecast to complete.",
            actions: [
                { label: "Update Schedule", target: "scheduling" }
            ],
            color: "bg-purple-600",
            borderColor: "border-purple-500"
        },
        {
            id: 3,
            title: "Process & Analyse",
            status: hasAnalysis ? 'Complete' : 'Pending',
            desc: "Turn raw data into insight: variances, performance indicators, and root causes.",
            actions: [
                { label: "View KPIs", target: "kpis" },
                { label: "View S-Curve", target: "scurve" }
            ],
            color: "bg-pink-600",
            borderColor: "border-pink-500"
        },
        {
            id: 4,
            title: "Corrective Action",
            status: hasAction ? 'Active' : 'Pending',
            desc: "Adjust resources, methods, or targets based on evidence, not intuition.",
            actions: [
                { label: "Risk Management", target: "risk" },
                { label: "Ask AI Assistant", target: "assistant" }
            ],
            color: "bg-emerald-600",
            borderColor: "border-emerald-500"
        }
    ];

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement(FeatureToolbar, {
            title: t.dashboardControlCycle,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onExport: handleExport
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto p-8' },
            React.createElement('div', { 
                className: 'printable-content w-full h-full flex flex-col items-center justify-center',
                style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }
            },
                React.createElement('div', { className: 'max-w-5xl w-full grid grid-cols-1 md:grid-cols-4 gap-6 relative' },
                    
                    // Connecting Line (Desktop)
                    React.createElement('div', { className: 'hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 transform -translate-y-1/2 -z-10 opacity-30 rounded-full' }),

                    phases.map((phase, index) => (
                        React.createElement('div', { key: phase.id, className: `relative group` },
                            // Phase Card
                            React.createElement('div', { className: `bg-dark-card-solid border-2 ${phase.status === 'Complete' ? 'border-green-500/50' : phase.borderColor} rounded-xl p-6 h-full flex flex-col hover:transform hover:-translate-y-2 transition-all duration-300 shadow-xl relative overflow-hidden` },
                                // Background Glow
                                React.createElement('div', { className: `absolute -top-10 -right-10 w-32 h-32 ${phase.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity` }),
                                
                                // Header
                                React.createElement('div', { className: 'flex justify-between items-start mb-4' },
                                    React.createElement('div', { className: `w-10 h-10 rounded-full ${phase.color} flex items-center justify-center text-lg font-bold shadow-lg` }, phase.id),
                                    phase.status === 'Complete' && React.createElement('div', { className: 'text-green-400' }, React.createElement(CheckIcon, { className: 'w-6 h-6' }))
                                ),
                                
                                // Content
                                React.createElement('h3', { className: 'text-xl font-bold mb-2' }, phase.title),
                                React.createElement('p', { className: 'text-sm text-brand-text-light mb-6 flex-grow leading-relaxed' }, phase.desc),
                                
                                // Actions
                                React.createElement('div', { className: 'space-y-2' },
                                    phase.actions.map((action, i) => (
                                        React.createElement('button', {
                                            key: i,
                                            onClick: () => onNavigate(action.target),
                                            className: 'w-full py-2 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left flex justify-between items-center group/btn'
                                        },
                                            action.label,
                                            React.createElement('span', { className: 'opacity-0 group-hover/btn:opacity-100 transition-opacity' }, '→')
                                        )
                                    ))
                                )
                            )
                        )
                    ))
                ),
                
                // Footer Quote
                React.createElement('div', { className: 'mt-16 text-center max-w-2xl mx-auto opacity-70' },
                    React.createElement('p', { className: 'text-lg italic font-serif text-brand-text-light' }, 
                        "\"Teams that run this loop with discipline don't just report variances, they control outcomes.\""
                    )
                )
            )
        )
    );
};

export default ControlCycleView;
