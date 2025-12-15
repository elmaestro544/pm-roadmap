
// components/RiskView.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { analyzeProjectRisks } from '../services/riskService.js';
import { RiskIcon, Spinner, FeatureToolbar, PlusIcon, CloseIcon, ListIcon, BoardIcon, DocumentIcon, SearchIcon, FilterIcon, DownloadIcon } from './Shared.js'; // Assuming icons exist
import { i18n } from '../constants.js';

// --- Helper Functions ---
const getMonthName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short' });
};

// --- Sub-Components ---

const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center h-full justify-center' },
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
        impact: 'Moderate',
        startDate: '',
        endDate: '',
        owner: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            id: `manual-${Date.now()}`,
            projectName: 'Current Project',
            date: new Date().toISOString().split('T')[0],
            mitigationStrategies: [],
            ...formData
        });
        onClose();
        setFormData({ title: '', description: '', severity: 'Medium', likelihood: 'Possible', impact: 'Moderate', startDate: '', endDate: '', owner: '' });
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
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Likelihood"),
                        React.createElement('select', { value: formData.likelihood, onChange: e => setFormData({...formData, likelihood: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" },
                            ['Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'].map(o => React.createElement('option', { key: o, value: o }, o))
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Impact"),
                        React.createElement('select', { value: formData.impact, onChange: e => setFormData({...formData, impact: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" },
                            ['Critical', 'Major', 'Moderate', 'Minor'].map(o => React.createElement('option', { key: o, value: o }, o))
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
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Severity Level"),
                    React.createElement('select', { value: formData.severity, onChange: e => setFormData({...formData, severity: e.target.value}), className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none" },
                        ['High', 'Medium', 'Low'].map(o => React.createElement('option', { key: o, value: o }, o))
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
    if (dates.length === 0) dates.push(new Date());
    
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

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-6 h-full flex flex-col' },
        React.createElement('h3', { className: 'font-bold text-white mb-6 flex items-center gap-2' }, 
            React.createElement('span', { className: 'w-1 h-5 bg-brand-purple rounded-full' }),
            'Risk Timeline Map'
        ),
        
        React.createElement('div', { className: 'flex-grow relative flex' },
            // Y-Axis Labels (Swimlanes)
            React.createElement('div', { className: 'w-16 flex flex-col justify-between border-r border-dark-border pr-2 py-4' },
                ['High', 'Medium', 'Low'].map(sev => 
                    React.createElement('div', { key: sev, className: `flex-1 flex items-center justify-center` },
                        React.createElement('span', { className: `text-xs font-bold rotate-180 [writing-mode:vertical-lr] ${sev === 'High' ? 'text-red-400' : sev === 'Medium' ? 'text-yellow-400' : 'text-green-400'}` }, sev)
                    )
                )
            ),
            
            // Chart Area
            React.createElement('div', { className: 'flex-grow relative border-l border-dark-border ml-2 overflow-hidden' },
                // Grid Lines (Vertical Months)
                React.createElement('div', { className: 'absolute inset-0 flex justify-between pointer-events-none' },
                    months.map((m, i) => React.createElement('div', { key: i, className: 'h-full border-r border-dashed border-white/5 w-full last:border-r-0' }))
                ),

                // Swimlanes
                ['High', 'Medium', 'Low'].map((sev, idx) => (
                    React.createElement('div', { key: sev, className: 'h-1/3 w-full relative border-b border-white/5 last:border-b-0' },
                        severityGroups[sev].map((risk, rIdx) => {
                            // Simple staggering to avoid overlap
                            const topOffset = (rIdx % 3) * 30 + 10; 
                            return React.createElement('div', {
                                key: risk.id,
                                className: `absolute h-6 rounded-md shadow-lg flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap overflow-hidden transition-all hover:scale-105 hover:z-10 cursor-pointer group`,
                                style: {
                                    left: `${getPosition(risk.startDate)}%`,
                                    width: `${Math.max(getWidth(risk.startDate, risk.endDate), 5)}%`,
                                    top: `${topOffset}%`,
                                    background: sev === 'High' ? 'linear-gradient(90deg, #EF4444 0%, #7F1D1D 100%)' :
                                                sev === 'Medium' ? 'linear-gradient(90deg, #F59E0B 0%, #78350F 100%)' :
                                                'linear-gradient(90deg, #10B981 0%, #064E3B 100%)'
                                }
                            }, 
                                risk.title,
                                React.createElement('div', { className: 'hidden group-hover:block absolute bottom-full left-0 mb-2 bg-black text-white text-xs p-2 rounded whitespace-normal w-48 z-20 border border-dark-border' },
                                    React.createElement('p', { className: 'font-bold' }, risk.title),
                                    React.createElement('p', null, `${risk.startDate} to ${risk.endDate}`)
                                )
                            )
                        })
                    )
                ))
            )
        ),
        
        // X-Axis Labels
        React.createElement('div', { className: 'flex justify-between pl-20 pt-2 text-xs text-brand-text-light border-t border-dark-border/50 mt-1' },
            months.filter((_, i) => i % 2 === 0).map((m, i) => React.createElement('span', { key: i }, m.toLocaleString('default', { month: 'short', year: '2-digit' })))
        )
    );
};

const RiskListView = ({ risks, onSelectRisk }) => {
    const severityColors = {
        High: 'bg-red-500/10 text-red-400 border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        Low: 'bg-green-500/10 text-green-400 border-green-500/20',
    };

    return React.createElement('div', { className: 'h-full flex flex-col bg-dark-card-solid border border-dark-border rounded-xl overflow-hidden' },
        React.createElement('div', { className: 'p-4 border-b border-dark-border bg-dark-card/50' },
            React.createElement('h3', { className: 'font-bold text-white flex items-center gap-2' }, 
                React.createElement(ListIcon, { className: "w-4 h-4 text-brand-purple-light" }),
                `Identified Risks (${risks.length})`
            )
        ),
        React.createElement('div', { className: 'flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin' },
            risks.length === 0 ? React.createElement('p', { className: 'text-center text-slate-500 mt-10' }, "No risks identified yet.") :
            risks.map(risk =>
                React.createElement('div', { key: risk.id, className: 'group p-3 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-purple/50 transition-all cursor-pointer' },
                    React.createElement('div', { className: 'flex justify-between items-start mb-1' },
                        React.createElement('h4', { className: 'font-semibold text-white text-sm line-clamp-1 group-hover:text-brand-purple-light' }, risk.title),
                        React.createElement('span', { className: `text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityColors[risk.severity]}` }, risk.severity)
                    ),
                    React.createElement('p', { className: 'text-xs text-brand-text-light line-clamp-2 mb-2' }, risk.description),
                    React.createElement('div', { className: 'flex justify-between items-center text-[10px] text-slate-500' },
                        React.createElement('span', null, `Impact: ${risk.impact}`),
                        React.createElement('span', null, new Date(risk.date).toLocaleDateString())
                    )
                )
            )
        )
    );
};

const RiskMatrix = ({ risks }) => {
    // Standard 5x5 Matrix
    const likelihoods = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];
    const impacts = ['Minor', 'Moderate', 'Major', 'Critical']; // AI usually returns 4 levels, let's map Critical to top.
    
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

    const getCellColor = (rowIdx, colIdx) => {
        // rowIdx 0 = Critical (Top), rowIdx 3 = Minor (Bottom)
        // colIdx 0 = Rare (Left), colIdx 4 = Certain (Right)
        
        // Heatmap logic: (4 - rowIdx) is magnitude (0-3), colIdx is prob (0-4)
        // Adjust indices to standard risk score calculation: 
        // Impact Score: Critical(4), Major(3), Moderate(2), Minor(1) -> so score = 4 - rowIdx
        // Prob Score: Rare(1) ... Certain(5) -> score = colIdx + 1
        
        const impactScore = 4 - rowIdx;
        const probScore = colIdx + 1;
        const riskScore = impactScore * probScore; // Max 20, Min 1
        
        if (riskScore >= 12) return 'bg-red-500/20 border-red-500/30 text-red-100 hover:bg-red-500/40'; // High
        if (riskScore >= 6) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/40'; // Medium
        return 'bg-green-500/20 border-green-500/30 text-green-100 hover:bg-green-500/40'; // Low
    };

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-4 h-full flex flex-col' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('h3', { className: 'font-bold text-white flex items-center gap-2' }, 
                React.createElement('span', { className: 'w-1 h-5 bg-brand-purple rounded-full' }),
                'Risk Matrix'
            )
        ),
        React.createElement('div', { className: 'flex-grow grid grid-cols-[auto_1fr] gap-2 min-h-0' },
            // Y-Axis Label
            React.createElement('div', { className: 'flex flex-col justify-center items-center' },
                React.createElement('span', { className: '-rotate-90 text-xs font-bold text-brand-text-light uppercase tracking-widest whitespace-nowrap' }, "Impact")
            ),
            
            // Grid Container
            React.createElement('div', { className: 'flex flex-col h-full' },
                // Matrix Cells
                React.createElement('div', { className: 'grid grid-cols-5 grid-rows-4 gap-1 flex-grow' },
                    impacts.slice().reverse().map((impact, rowIdx) => // Reverse so Critical is top
                        likelihoods.map((likelihood, colIdx) => {
                            const key = `${impact}-${likelihood}`;
                            const items = matrixData[key] || [];
                            
                            return React.createElement('div', { 
                                key: key,
                                className: `relative border rounded transition-all flex items-center justify-center ${getCellColor(rowIdx, colIdx)}`
                            },
                                items.length > 0 ? (
                                    React.createElement('span', { className: 'font-bold text-lg' }, items.length)
                                ) : null
                            );
                        })
                    )
                ),
                
                // X-Axis Labels
                React.createElement('div', { className: 'grid grid-cols-5 text-center mt-2' },
                    likelihoods.map(l => React.createElement('span', { key: l, className: 'text-[9px] font-bold text-brand-text-light uppercase truncate px-1' }, l))
                )
            )
        ),
        React.createElement('div', { className: 'text-center mt-1' },
             React.createElement('span', { className: 'text-xs font-bold text-brand-text-light uppercase tracking-widest' }, "Likelihood")
        )
    );
};

const StatCard = ({ label, value, icon, color }) => (
    React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border p-4 rounded-xl flex items-center gap-4' },
        React.createElement('div', { className: `w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xl`, style: { backgroundColor: color + '20', color: color } }, icon),
        React.createElement('div', null,
            React.createElement('p', { className: 'text-brand-text-light text-xs uppercase font-bold tracking-wider' }, label),
            React.createElement('p', { className: 'text-white text-2xl font-extrabold' }, value)
        )
    )
);

const RiskRegister = ({ risks }) => {
    return React.createElement('div', { className: 'mt-6 bg-dark-card-solid border border-dark-border rounded-xl overflow-hidden' },
        React.createElement('div', { className: 'p-4 border-b border-dark-border flex justify-between items-center bg-dark-card/50' },
            React.createElement('h3', { className: 'font-bold text-white flex items-center gap-2' }, 
                React.createElement(DocumentIcon, { className: "w-5 h-5 text-brand-purple-light" }),
                "Risk Register"
            ),
            React.createElement('button', { className: 'text-xs flex items-center gap-2 px-3 py-1.5 rounded bg-dark-bg border border-dark-border text-brand-text-light hover:text-white' },
                React.createElement(DownloadIcon, { className: "w-3 h-3" }), "Export CSV"
            )
        ),
        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full text-sm text-left' },
                React.createElement('thead', { className: 'bg-dark-bg text-brand-text-light font-semibold border-b border-dark-border' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'p-4' }, "ID"),
                        React.createElement('th', { className: 'p-4' }, "Risk Title"),
                        React.createElement('th', { className: 'p-4' }, "Severity"),
                        React.createElement('th', { className: 'p-4' }, "Likelihood"),
                        React.createElement('th', { className: 'p-4' }, "Impact"),
                        React.createElement('th', { className: 'p-4' }, "Mitigation Strategy"),
                        React.createElement('th', { className: 'p-4' }, "Date Identified")
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-dark-border' },
                    risks.map((risk, i) => 
                        React.createElement('tr', { key: risk.id, className: 'hover:bg-white/5 transition-colors' },
                            React.createElement('td', { className: 'p-4 font-mono text-xs text-brand-text-light' }, `R-${i+1}`),
                            React.createElement('td', { className: 'p-4 font-medium text-white' }, risk.title),
                            React.createElement('td', { className: 'p-4' }, 
                                React.createElement('span', { className: `px-2 py-1 rounded text-xs font-bold ${risk.severity === 'High' ? 'bg-red-500/20 text-red-400' : risk.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}` }, risk.severity)
                            ),
                            React.createElement('td', { className: 'p-4 text-brand-text-light' }, risk.likelihood),
                            React.createElement('td', { className: 'p-4 text-brand-text-light' }, risk.impact),
                            React.createElement('td', { className: 'p-4 text-brand-text-light max-w-xs truncate', title: risk.mitigationStrategies?.[0]?.description }, risk.mitigationStrategies?.[0]?.name || '-'),
                            React.createElement('td', { className: 'p-4 text-brand-text-light' }, new Date(risk.date).toLocaleDateString())
                        )
                    )
                )
            )
        )
    );
};

const ResultsView = ({ data, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'register'
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
        
        // --- Top Bar ---
        React.createElement('div', { className: 'flex justify-between items-center bg-dark-card-solid border border-dark-border p-4 rounded-xl shadow-lg' },
            React.createElement('div', null,
                React.createElement('h2', { className: 'text-2xl font-bold text-white' }, "Risk & Issue Management"),
                React.createElement('p', { className: 'text-brand-text-light text-sm' }, "Monitor, assess, and mitigate project uncertainties.")
            ),
            React.createElement('div', { className: 'flex items-center gap-4' },
                // View Toggle
                React.createElement('div', { className: 'flex bg-dark-bg p-1 rounded-lg border border-dark-border' },
                    React.createElement('button', {
                        onClick: () => setViewMode('dashboard'),
                        className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-brand-purple text-white shadow' : 'text-brand-text-light hover:text-white'}`
                    }, React.createElement(BoardIcon, { className: "w-4 h-4" }), "Dashboard"),
                    React.createElement('button', {
                        onClick: () => setViewMode('register'),
                        className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'register' ? 'bg-brand-purple text-white shadow' : 'text-brand-text-light hover:text-white'}`
                    }, React.createElement(ListIcon, { className: "w-4 h-4" }), "Register")
                ),
                
                React.createElement('div', { className: 'w-px h-8 bg-dark-border' }),

                React.createElement('button', { 
                    onClick: () => setIsAddModalOpen(true),
                    className: 'flex items-center gap-2 px-4 py-2 bg-button-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-purple/20' 
                },
                    React.createElement(PlusIcon, { className: 'w-5 h-5' }),
                    "Add Risk"
                )
            )
        ),

        // --- Main Content ---
        viewMode === 'dashboard' ? (
            React.createElement('div', { className: 'flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0' },
                
                // Left Column: List (3 cols)
                React.createElement('div', { className: 'lg:col-span-3 flex flex-col min-h-0' },
                    React.createElement(RiskListView, { risks: risks })
                ),

                // Right Column: Visuals (9 cols)
                React.createElement('div', { className: 'lg:col-span-9 flex flex-col gap-6 min-h-0' },
                    // Row 1: Timeline Map (Fixed Height)
                    React.createElement('div', { className: 'h-72 flex-shrink-0' },
                        React.createElement(VisualRiskMap, { risks: risks })
                    ),
                    
                    // Row 2: Stats & Matrix
                    React.createElement('div', { className: 'flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]' },
                        // Stats Grid
                        React.createElement('div', { className: 'grid grid-cols-2 gap-4 auto-rows-fr' },
                            React.createElement(StatCard, { label: 'Total Risks', value: summary.total, icon: '!', color: '#6366F1' }), // Indigo
                            React.createElement(StatCard, { label: 'High Severity', value: summary.high, icon: '▲', color: '#EF4444' }), // Red
                            React.createElement(StatCard, { label: 'Medium Severity', value: summary.medium, icon: '●', color: '#F59E0B' }), // Amber
                            React.createElement(StatCard, { label: 'Closed Risks', value: summary.closed, icon: '✓', color: '#10B981' }) // Green
                        ),
                        // Matrix
                        React.createElement('div', { className: 'h-full' },
                            React.createElement(RiskMatrix, { risks: risks })
                        )
                    )
                )
            )
        ) : (
            // Register View
            React.createElement('div', { className: 'flex-grow overflow-hidden flex flex-col' },
                React.createElement(RiskRegister, { risks: risks })
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
    
    // Toolbar state
    const [zoomLevel, setZoomLevel] = useState(1);
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleExport = () => window.print();

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
        React.createElement(FeatureToolbar, {
            title: t.dashboardRisk,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onExport: handleExport
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
            React.createElement('div', {
               className: 'p-6 printable-content h-full flex flex-col',
               style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }
            },
                React.createElement('div', { className: 'h-full' }, renderContent())
            )
        )
    );
};

export default RiskView;
