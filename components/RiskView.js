
// components/RiskView.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { analyzeProjectRisks } from '../services/riskService.js';
import { RiskIcon, Spinner, FeatureToolbar, PlusIcon, CloseIcon } from './Shared.js';
import { i18n } from '../constants.js';

// --- Helper Functions ---
const getMonthName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short' });
};

// --- Sub-Components ---

const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(RiskIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Analyzing Risks..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is scanning project data and identifying potential issues."),
        React.createElement(Spinner, { size: '12' })
    )
);

const AddRiskModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        severity: 'Medium',
        likelihood: 'Possible',
        startDate: '',
        endDate: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            id: `manual-${Date.now()}`,
            projectName: 'Current Project',
            date: new Date().toISOString().split('T')[0],
            impact: 'Moderate', // Default
            mitigationStrategies: [],
            ...formData
        });
        onClose();
        setFormData({ title: '', description: '', severity: 'Medium', likelihood: 'Possible', startDate: '', endDate: '' });
    };

    return React.createElement('div', { className: "fixed inset-0 bg-black/80 z-[200] flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in-up" },
        React.createElement('div', { className: "bg-dark-card rounded-xl shadow-2xl w-full max-w-md border border-dark-border glow-border p-6", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                React.createElement('h3', { className: "text-xl font-bold text-white" }, "Add New Risk"),
                React.createElement('button', { onClick: onClose, className: "text-brand-text-light hover:text-white" }, React.createElement(CloseIcon, null))
            ),
            React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Risk Title"),
                    React.createElement('input', { required: true, value: formData.title, onChange: e => setFormData({...formData, title: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none" })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Description"),
                    React.createElement('textarea', { rows: 2, value: formData.description, onChange: e => setFormData({...formData, description: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none resize-none" })
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Severity"),
                        React.createElement('select', { value: formData.severity, onChange: e => setFormData({...formData, severity: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" },
                            ['High', 'Medium', 'Low'].map(o => React.createElement('option', { key: o, value: o }, o))
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Likelihood"),
                        React.createElement('select', { value: formData.likelihood, onChange: e => setFormData({...formData, likelihood: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" },
                            ['Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'].map(o => React.createElement('option', { key: o, value: o }, o))
                        )
                    )
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Start Date"),
                        React.createElement('input', { type: "date", required: true, value: formData.startDate, onChange: e => setFormData({...formData, startDate: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "End Date"),
                        React.createElement('input', { type: "date", required: true, value: formData.endDate, onChange: e => setFormData({...formData, endDate: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" })
                    )
                ),
                React.createElement('button', { type: "submit", className: "w-full py-2 bg-button-gradient text-white font-bold rounded-lg mt-2" }, "Create Risk")
            )
        )
    );
};

const VisualRiskMap = ({ risks }) => {
    // 1. Determine Timeline Range
    const dates = risks.flatMap(r => [new Date(r.startDate || new Date()), new Date(r.endDate || new Date())]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add buffer
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);

    const totalDuration = maxDate - minDate;
    
    // Generate Months labels
    const months = [];
    let curr = new Date(minDate);
    while (curr <= maxDate) {
        months.push(new Date(curr));
        curr.setMonth(curr.getMonth() + 1);
    }

    const getPosition = (dateStr) => {
        const d = new Date(dateStr || new Date());
        return ((d - minDate) / totalDuration) * 100;
    };

    const getWidth = (startStr, endStr) => {
        const s = new Date(startStr || new Date());
        const e = new Date(endStr || new Date());
        return ((e - s) / totalDuration) * 100;
    };

    const severityGroups = {
        'High': risks.filter(r => r.severity === 'High'),
        'Medium': risks.filter(r => r.severity === 'Medium'),
        'Low': risks.filter(r => r.severity === 'Low')
    };

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-lg p-6 h-full flex flex-col' },
        React.createElement('h3', { className: 'font-bold text-white mb-6' }, 'Visual risk map with timeline projections'),
        
        React.createElement('div', { className: 'flex-grow relative flex' },
            // Y-Axis Labels
            React.createElement('div', { className: 'w-16 flex flex-col justify-around border-r border-dark-border pr-2 py-4' },
                ['High', 'Medium', 'Low'].map(sev => 
                    React.createElement('div', { key: sev, className: `text-xs font-bold rotate-180 [writing-mode:vertical-lr] text-center h-full flex items-center justify-center ${sev === 'High' ? 'text-red-400' : sev === 'Medium' ? 'text-yellow-400' : 'text-green-400'}` }, sev)
                )
            ),
            
            // Chart Area
            React.createElement('div', { className: 'flex-grow relative border-l border-dark-border ml-2 overflow-hidden' },
                // Grid Lines (Vertical)
                React.createElement('div', { className: 'absolute inset-0 flex justify-between pointer-events-none' },
                    months.map((m, i) => React.createElement('div', { key: i, className: 'h-full border-r border-dashed border-white/5 w-full last:border-r-0' }))
                ),

                // Bands & Bars
                ['High', 'Medium', 'Low'].map((sev, idx) => (
                    React.createElement('div', { key: sev, className: 'h-1/3 w-full relative py-2 border-b border-white/5 last:border-b-0' },
                        severityGroups[sev].map(risk => (
                            React.createElement('div', {
                                key: risk.id,
                                className: 'absolute h-6 rounded-md shadow-lg flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap overflow-hidden transition-all hover:scale-105 hover:z-10 cursor-pointer',
                                style: {
                                    left: `${getPosition(risk.startDate)}%`,
                                    width: `${Math.max(getWidth(risk.startDate, risk.endDate), 5)}%`,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: sev === 'High' ? 'linear-gradient(90deg, #EF4444 0%, #7F1D1D 100%)' :
                                                sev === 'Medium' ? 'linear-gradient(90deg, #F59E0B 0%, #78350F 100%)' :
                                                'linear-gradient(90deg, #10B981 0%, #064E3B 100%)'
                                },
                                title: `${risk.title} (${risk.startDate} - ${risk.endDate})`
                            }, risk.title)
                        ))
                    )
                ))
            )
        ),
        
        // X-Axis Labels
        React.createElement('div', { className: 'flex justify-between pl-20 pt-2 text-xs text-brand-text-light' },
            months.map((m, i) => React.createElement('span', { key: i }, m.toLocaleString('default', { month: 'short' })))
        )
    );
};

const SummaryCard = ({ title, value, icon, color }) => (
    React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border p-4 rounded-lg flex items-center gap-4' },
        React.createElement('div', { className: `w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-lg`, style: { backgroundColor: color + '20', color: color } }, icon),
        React.createElement('div', null,
            React.createElement('p', { className: 'text-brand-text-light text-xs uppercase font-bold' }, title),
            React.createElement('p', { className: 'text-white text-2xl font-bold' }, value)
        )
    )
);

const RiskListView = ({ risks, onSelectRisk }) => {
    const severityColors = {
        High: 'bg-red-500/10 text-red-400 border border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        Low: 'bg-green-500/10 text-green-400 border border-green-500/20',
    };

    return React.createElement('div', { className: 'h-full flex flex-col' },
        React.createElement('h3', { className: 'font-bold text-white mb-4 flex-shrink-0' }, `Identified Risks (${risks.length})`),
        React.createElement('div', { className: 'flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin' },
            risks.map(risk =>
                React.createElement('div', { key: risk.id, className: 'group p-3 rounded-lg bg-dark-card-solid border border-dark-border hover:border-brand-purple/50 transition-all cursor-pointer' },
                    React.createElement('div', { className: 'flex justify-between items-start mb-1' },
                        React.createElement('h4', { className: 'font-semibold text-white text-sm line-clamp-1 group-hover:text-brand-purple-light' }, risk.title),
                        React.createElement('span', { className: `text-[10px] font-bold px-1.5 py-0.5 rounded ${severityColors[risk.severity]}` }, risk.severity)
                    ),
                    React.createElement('p', { className: 'text-xs text-brand-text-light line-clamp-2 mb-2' }, risk.description),
                    React.createElement('div', { className: 'flex justify-between items-center text-[10px] text-slate-500' },
                        React.createElement('span', null, `${risk.startDate} → ${risk.endDate}`),
                        React.createElement('button', { className: 'flex items-center gap-1 hover:text-white transition-colors' },
                            "View Details",
                            React.createElement('svg', { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }))
                        )
                    )
                )
            )
        )
    );
};

const RiskMatrix = ({ risks }) => {
    const likelihoods = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];
    const impacts = ['Minor', 'Moderate', 'Major', 'Critical'];
    
    // Map data
    const matrixData = useMemo(() => {
        const grid = {};
        impacts.forEach(i => likelihoods.forEach(l => grid[`${i}-${l}`] = []));
        
        risks.forEach(risk => {
            const key = `${risk.impact}-${risk.likelihood}`;
            if (grid[key]) grid[key].push(risk);
        });
        return grid;
    }, [risks]);

    // Color Logic for Cell Backgrounds (Heatmap style)
    const getCellColor = (impactIndex, likelihoodIndex) => {
        const score = (impactIndex + 1) * (likelihoodIndex + 1); // 1 to 20
        if (score >= 12) return 'bg-red-900/40 border-red-500/30'; // High
        if (score >= 6) return 'bg-yellow-900/40 border-yellow-500/30'; // Medium
        return 'bg-green-900/40 border-green-500/30'; // Low
    };

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border p-4 rounded-lg h-full flex flex-col' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('h3', { className: 'font-bold text-white flex items-center gap-2' }, 
                React.createElement(RiskIcon, { className: "w-4 h-4 text-brand-purple-light" }),
                'Risk Matrix'
            )
        ),
        React.createElement('div', { className: 'flex-grow grid grid-cols-[auto_1fr] gap-2 min-h-0' },
            // Y-Axis Label
            React.createElement('div', { className: 'flex flex-col justify-center items-center' },
                React.createElement('span', { className: '-rotate-90 text-xs font-bold text-brand-text-light uppercase tracking-widest whitespace-nowrap' }, "Impact / Severity")
            ),
            
            // Grid Container
            React.createElement('div', { className: 'grid grid-rows-[1fr_auto] gap-2 h-full' },
                // Matrix Cells
                React.createElement('div', { className: 'grid grid-cols-5 grid-rows-4 gap-1 h-full' },
                    impacts.slice().reverse().map((impact, rowIdx) => 
                        likelihoods.map((likelihood, colIdx) => {
                            // Reverse row index for calculation (0=Critical in UI, but index 3 in array)
                            const items = matrixData[`${impact}-${likelihood}`] || [];
                            const impactVal = 3 - rowIdx; 
                            
                            return React.createElement('div', { 
                                key: `${impact}-${likelihood}`,
                                className: `relative border rounded p-1 transition-colors hover:bg-white/5 ${getCellColor(impactVal, colIdx)}`
                            },
                                items.length > 0 && (
                                    React.createElement('div', { className: 'h-full w-full flex flex-col gap-1 overflow-hidden' },
                                        React.createElement('span', { className: 'text-[10px] font-bold text-white/50 absolute top-0.5 right-1' }, items.length),
                                        items.slice(0, 2).map(r => 
                                            React.createElement('div', { key: r.id, className: 'text-[9px] text-white truncate bg-black/40 px-1 rounded' }, r.title)
                                        ),
                                        items.length > 2 && React.createElement('div', { className: 'text-[8px] text-center text-white/70' }, `+${items.length - 2} more`)
                                    )
                                )
                            );
                        })
                    )
                ),
                
                // X-Axis Labels
                React.createElement('div', { className: 'grid grid-cols-5 text-center' },
                    likelihoods.map(l => React.createElement('span', { key: l, className: 'text-[10px] font-bold text-brand-text-light uppercase' }, l))
                )
            )
        ),
        React.createElement('div', { className: 'text-center mt-1' },
             React.createElement('span', { className: 'text-xs font-bold text-brand-text-light uppercase tracking-widest' }, "Likelihood")
        )
    );
};


const ResultsView = ({ data, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const risks = data.risks || [];

    const summary = useMemo(() => {
        const high = risks.filter(r => r.severity === 'High').length;
        const medium = risks.filter(r => r.severity === 'Medium').length;
        return { total: risks.length, high, medium, closed: 0 };
    }, [risks]);

    const handleAddRisk = (newRisk) => {
        const updatedRisks = [newRisk, ...risks];
        onUpdate({ ...data, risks: updatedRisks });
    };

    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        
        // Header Actions
        React.createElement('div', { className: 'flex justify-between items-center bg-dark-card-solid border border-dark-border p-4 rounded-xl' },
            React.createElement('div', null,
                React.createElement('h2', { className: 'text-2xl font-bold text-white' }, "Risk & Issue Management"),
                React.createElement('p', { className: 'text-brand-text-light text-sm' }, "Identify, assess, and mitigate project risks.")
            ),
            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', { 
                    onClick: () => setIsAddModalOpen(true),
                    className: 'flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-semibold hover:bg-brand-purple-light transition-colors shadow-lg shadow-brand-purple/20' 
                },
                    React.createElement(PlusIcon, { className: 'w-5 h-5' }),
                    "Add Risk"
                ),
                React.createElement('button', { className: 'flex items-center gap-2 px-4 py-2 border border-dark-border text-brand-text-light rounded-lg font-semibold hover:text-white hover:bg-white/5 transition-colors' },
                    React.createElement(PlusIcon, { className: 'w-5 h-5' }),
                    "Add Issue"
                )
            )
        ),

        // Main Content Grid
        React.createElement('div', { className: 'flex-grow grid grid-cols-12 gap-6 min-h-0' },
            
            // Left Column: List (4 cols)
            React.createElement('div', { className: 'col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0' },
                React.createElement('div', { className: 'flex-grow min-h-0' },
                    React.createElement(RiskListView, { risks: risks })
                )
            ),

            // Right Column: Visuals (8 cols)
            React.createElement('div', { className: 'col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0' },
                // Row 1: Timeline Map
                React.createElement('div', { className: 'h-64 flex-shrink-0' },
                    React.createElement(VisualRiskMap, { risks: risks })
                ),
                
                // Row 2: Matrix & Stats
                React.createElement('div', { className: 'flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0' },
                    // Summary Cards Grid
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4 auto-rows-min content-start' },
                        React.createElement(SummaryCard, { title: 'Total Risks', value: summary.total, icon: '!', color: '#6366F1' }), // Indigo
                        React.createElement(SummaryCard, { title: 'High Severity', value: summary.high, icon: '▲', color: '#EF4444' }), // Red
                        React.createElement(SummaryCard, { title: 'Medium Severity', value: summary.medium, icon: '●', color: '#F59E0B' }), // Amber
                        React.createElement(SummaryCard, { title: 'Closed Risks', value: summary.closed, icon: '✓', color: '#10B981' }) // Green
                    ),
                    // Matrix
                    React.createElement('div', { className: 'h-full min-h-[300px]' },
                        React.createElement(RiskMatrix, { risks: risks })
                    )
                )
            )
        ),
        
        React.createElement(AddRiskModal, { 
            isOpen: isAddModalOpen, 
            onClose: () => setIsAddModalOpen(false), 
            onAdd: handleAddRisk 
        })
    );
};


const RiskView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    
    useEffect(() => {
        if (projectData.objective && !projectData.risk && !isLoading) {
             const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const risk = await analyzeProjectRisks(projectData.objective);
                    onUpdateProject({ risk });
                } catch (err) {
                    setError(err.message || "Failed to generate risk analysis.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.objective, projectData.risk, isLoading, onUpdateProject, setIsLoading, setError]);

    const handleUpdateRisks = (updatedRiskData) => {
        onUpdateProject({ risk: updatedRiskData });
    };

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.risk) return React.createElement(ResultsView, { data: projectData.risk, onUpdate: handleUpdateRisks });
        return React.createElement(LoadingView, null);
    };

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
            React.createElement('div', {
               className: 'p-6 printable-content h-full flex flex-col',
            },
                React.createElement('div', { className: 'h-full' }, renderContent())
            )
        )
    );
};

export default RiskView;
