import React, { useMemo, useState } from 'react';
import { FeatureToolbar, RefreshIcon, Spinner, ExportIcon, DocumentIcon } from './Shared.js';
import { i18n } from '../constants.js';

// --- Infographics Components ---

const RadialProgress = ({ progress, size = 80, strokeWidth = 8, color = '#2DD4BF' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return React.createElement('div', { className: 'relative flex items-center justify-center' },
        React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: 'transform -rotate-90' },
            React.createElement('circle', {
                cx: size / 2, cy: size / 2, r: radius,
                stroke: 'rgba(255, 255, 255, 0.1)',
                strokeWidth: strokeWidth,
                fill: 'transparent'
            }),
            React.createElement('circle', {
                cx: size / 2, cy: size / 2, r: radius,
                stroke: color,
                strokeWidth: strokeWidth,
                fill: 'transparent',
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                strokeLinecap: 'round',
                style: { transition: 'stroke-dashoffset 1s ease-out' }
            })
        ),
        React.createElement('span', { className: 'absolute text-sm font-bold text-white print:text-black' }, `${Math.round(progress)}%`)
    );
};

const StackedBar = ({ segments, height = 12 }) => {
    const total = segments.reduce((acc, s) => acc + s.value, 0);
    return React.createElement('div', { className: `w-full flex rounded-full overflow-hidden h-${height/4} bg-dark-bg print:bg-gray-200` }, // Tailwind height class hack or style
        segments.map((seg, i) => {
            const width = total > 0 ? (seg.value / total) * 100 : 0;
            return React.createElement('div', {
                key: i,
                style: { width: `${width}%`, backgroundColor: seg.color, height: `${height}px` },
                title: `${seg.label}: ${Math.round(width)}%`
            });
        })
    );
};

// --- Widgets ---

const HealthCard = ({ progress, spi, cpi }) => {
    const status = spi >= 1 && cpi >= 1 ? 'Healthy' : (spi < 0.9 || cpi < 0.9) ? 'Critical' : 'At Risk';
    const statusColor = status === 'Healthy' ? 'text-green-400 print:text-green-700' : status === 'Critical' ? 'text-red-400 print:text-red-700' : 'text-yellow-400 print:text-yellow-700';
    const statusBg = status === 'Healthy' ? 'bg-green-500/10 border-green-500/20 print:bg-green-50 print:border-green-200' : status === 'Critical' ? 'bg-red-500/10 border-red-500/20 print:bg-red-50 print:border-red-200' : 'bg-yellow-500/10 border-yellow-500/20 print:bg-yellow-50 print:border-yellow-200';

    return React.createElement('div', { className: `p-6 rounded-2xl border ${statusBg} flex flex-col justify-between h-full` },
        React.createElement('div', { className: 'flex justify-between items-start mb-4' },
            React.createElement('div', null,
                React.createElement('h3', { className: 'text-brand-text-light print:text-gray-600 text-sm uppercase tracking-wider font-semibold' }, "Project Health"),
                React.createElement('p', { className: `text-2xl font-bold mt-1 ${statusColor}` }, status)
            ),
            React.createElement(RadialProgress, { progress: progress || 0, color: status === 'Healthy' ? '#4ADE80' : status === 'Critical' ? '#F87171' : '#FACC15' })
        ),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 mt-auto' },
            React.createElement('div', { className: 'bg-dark-bg/50 print:bg-white rounded-lg p-3 print:border print:border-gray-200' },
                React.createElement('span', { className: 'text-xs text-brand-text-light print:text-gray-500 block' }, "Schedule Perf."),
                React.createElement('span', { className: `text-lg font-bold ${spi >= 1 ? 'text-green-400 print:text-green-700' : 'text-red-400 print:text-red-700'}` }, spi)
            ),
            React.createElement('div', { className: 'bg-dark-bg/50 print:bg-white rounded-lg p-3 print:border print:border-gray-200' },
                React.createElement('span', { className: 'text-xs text-brand-text-light print:text-gray-500 block' }, "Cost Perf."),
                React.createElement('span', { className: `text-lg font-bold ${cpi >= 1 ? 'text-green-400 print:text-green-700' : 'text-red-400 print:text-red-700'}` }, cpi)
            )
        )
    );
};

const TaskOverview = ({ schedule }) => {
    if (!schedule) return React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-2xl border border-dark-border h-full flex items-center justify-center text-slate-500' }, "No schedule data");

    const stats = schedule.reduce((acc, t) => {
        if (t.type === 'task') {
            acc.total++;
            if (t.progress === 100) acc.done++;
            else if (t.progress > 0) acc.progress++;
            else acc.todo++;
        }
        return acc;
    }, { total: 0, done: 0, progress: 0, todo: 0 });

    const segments = [
        { value: stats.done, color: '#2DD4BF', label: 'Done' },
        { value: stats.progress, color: '#FACC15', label: 'In Progress' },
        { value: stats.todo, color: '#334155', label: 'To Do' }
    ];

    return React.createElement('div', { className: 'bg-dark-card-solid print:bg-white p-6 rounded-2xl border border-dark-border print:border-gray-300 h-full flex flex-col' },
        React.createElement('h3', { className: 'text-white print:text-black font-bold mb-6 flex items-center gap-2' }, 
            React.createElement('span', { className: 'w-2 h-6 bg-brand-purple rounded-full' }),
            "Task Velocity"
        ),
        React.createElement('div', { className: 'flex items-end gap-2 mb-2' },
            React.createElement('span', { className: 'text-4xl font-bold text-white print:text-black' }, stats.total),
            React.createElement('span', { className: 'text-brand-text-light print:text-gray-500 mb-1' }, "Total Tasks")
        ),
        React.createElement('div', { className: 'mb-6' },
            React.createElement(StackedBar, { segments, height: 16 })
        ),
        React.createElement('div', { className: 'grid grid-cols-3 gap-2 mt-auto' },
            segments.map((seg, i) => 
                React.createElement('div', { key: i, className: 'text-center p-2 rounded-lg bg-dark-bg/50 print:bg-gray-100' },
                    React.createElement('div', { className: 'w-2 h-2 rounded-full mx-auto mb-1', style: { backgroundColor: seg.color } }),
                    React.createElement('span', { className: 'block text-lg font-bold text-white print:text-black' }, seg.value),
                    React.createElement('span', { className: 'text-[10px] text-brand-text-light print:text-gray-600 uppercase' }, seg.label)
                )
            )
        )
    );
};

const FinancialsWidget = ({ budget, currency }) => {
    if (!budget?.budgetItems) return React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-2xl border border-dark-border h-full flex items-center justify-center text-slate-500' }, "No budget data");

    const labor = budget.budgetItems.reduce((acc, item) => acc + item.laborCost, 0);
    const material = budget.budgetItems.reduce((acc, item) => acc + item.materialsCost, 0);
    const contingency = budget.budgetItems.reduce((acc, item) => acc + ((item.laborCost + item.materialsCost) * (item.contingencyPercent / 100)), 0);
    const total = labor + material + contingency;

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(v);

    return React.createElement('div', { className: 'bg-gradient-to-br from-dark-card-solid to-[#0f1f1a] print:bg-white print:bg-none p-6 rounded-2xl border border-brand-purple/20 print:border-gray-300 h-full' },
        React.createElement('h3', { className: 'text-white print:text-black font-bold mb-1' }, "Financial Overview"),
        React.createElement('p', { className: 'text-brand-purple-light print:text-green-700 text-2xl font-bold mb-6' }, format(total)),
        
        React.createElement('div', { className: 'space-y-4' },
            [{ l: 'Labor', v: labor, c: '#F472B6' }, { l: 'Material', v: material, c: '#2DD4BF' }, { l: 'Contingency', v: contingency, c: '#A3E635' }].map((item, i) => 
                React.createElement('div', { key: i },
                    React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-brand-text-light print:text-gray-600' }, item.l),
                        React.createElement('span', { className: 'text-white print:text-black font-medium' }, format(item.v))
                    ),
                    React.createElement('div', { className: 'w-full bg-black/30 print:bg-gray-200 rounded-full h-1.5' },
                        React.createElement('div', { className: 'h-1.5 rounded-full', style: { width: `${(item.v / total) * 100}%`, backgroundColor: item.c } })
                    )
                )
            )
        )
    );
};

const RiskMatrixWidget = ({ risks }) => {
    const list = risks?.risks || [];
    const high = list.filter(r => r.severity === 'High').length;
    const medium = list.filter(r => r.severity === 'Medium').length;
    
    return React.createElement('div', { className: 'bg-gradient-to-br from-dark-card-solid to-[#1f0f0f] print:bg-white print:bg-none p-6 rounded-2xl border border-red-500/20 print:border-gray-300 h-full flex flex-col' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h3', { className: 'text-white print:text-black font-bold' }, "Risk Monitor"),
            React.createElement('span', { className: 'bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold' }, `${list.length} Active`)
        ),
        React.createElement('div', { className: 'flex-grow flex items-center justify-center gap-6' },
            // Mini Matrix Visual
            React.createElement('div', { className: 'grid grid-cols-2 gap-1 w-24 h-24' },
                React.createElement('div', { className: 'bg-red-500/80 rounded-sm flex items-center justify-center text-white font-bold text-lg' }, high),
                React.createElement('div', { className: 'bg-yellow-500/80 rounded-sm flex items-center justify-center text-white font-bold text-lg' }, medium),
                React.createElement('div', { className: 'bg-yellow-500/80 rounded-sm' }),
                React.createElement('div', { className: 'bg-green-500/80 rounded-sm' })
            ),
            React.createElement('div', { className: 'space-y-2' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full' }),
                    React.createElement('span', { className: 'text-sm text-brand-text-light print:text-black' }, "Critical")
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-3 h-3 bg-yellow-500 rounded-full' }),
                    React.createElement('span', { className: 'text-sm text-brand-text-light print:text-black' }, "Moderate")
                )
            )
        )
    );
};

// --- Main Layout ---

const ProjectOverview = ({ language, projectData }) => {
    const t = i18n[language];
    const currency = projectData?.criteria?.currency || 'USD';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate data refresh / recalculation delay
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    // Calculate derived metrics
    const kpi = projectData?.kpiReport?.kpis || { spi: 1, cpi: 1 };
    const progress = kpi.overallProgress || (projectData?.schedule ? 
        Math.round(projectData.schedule.reduce((acc, t) => acc + (t.progress || 0), 0) / Math.max(projectData.schedule.length, 1)) : 0);

    const handleExportCSV = () => {
        // Flatten data for CSV
        const rows = [
            ['Metric', 'Value'],
            ['Project Name', projectData.consultingPlan?.projectTitle || 'Untitled'],
            ['Overall Progress', `${progress}%`],
            ['SPI (Schedule Performance)', kpi.spi],
            ['CPI (Cost Performance)', kpi.cpi],
            ['Total Tasks', projectData.schedule?.length || 0],
            ['Active Risks', projectData.risk?.risks?.length || 0],
            ['Total Budget', projectData.criteria?.budget || 'N/A']
        ];

        // Add Risks if available
        if (projectData.risk?.risks) {
            rows.push([]);
            rows.push(['RISK REGISTER', 'Severity', 'Likelihood', 'Impact']);
            projectData.risk.risks.forEach(r => {
                rows.push([r.title, r.severity, r.likelihood, r.impact]);
            });
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `project_overview_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const handleExportPDF = () => {
        setShowExportMenu(false);
        setTimeout(() => window.print(), 100);
    };

    const customControls = (
        React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('button', {
                onClick: handleRefresh,
                disabled: isRefreshing,
                className: 'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-dark-card-solid border border-dark-border text-brand-text-light hover:text-white hover:border-brand-purple transition-all'
            }, 
                isRefreshing ? React.createElement(Spinner, { size: '4' }) : React.createElement(RefreshIcon, { className: 'w-4 h-4' }),
                "Refresh Analysis"
            ),
            React.createElement('div', { className: 'relative' },
                React.createElement('button', {
                    onClick: () => setShowExportMenu(!showExportMenu),
                    className: 'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-button-gradient text-white hover:opacity-90 transition-all'
                },
                    React.createElement(ExportIcon, { className: 'w-4 h-4' }),
                    "Export Report"
                ),
                showExportMenu && React.createElement('div', {
                    className: 'absolute top-full right-0 mt-2 w-40 bg-dark-card-solid border border-dark-border rounded-lg shadow-xl z-50 animate-fade-in-up'
                },
                    React.createElement('button', {
                        onClick: handleExportPDF,
                        className: 'w-full text-left px-4 py-2 text-sm text-brand-text-light hover:bg-white/10 hover:text-white flex items-center gap-2'
                    }, React.createElement(DocumentIcon, { className: 'w-4 h-4' }), "Export as PDF"),
                    React.createElement('button', {
                        onClick: handleExportCSV,
                        className: 'w-full text-left px-4 py-2 text-sm text-brand-text-light hover:bg-white/10 hover:text-white flex items-center gap-2'
                    }, React.createElement('span', { className: 'font-mono text-xs' }, "CSV"), "Export Data")
                )
            )
        )
    );

    return React.createElement('div', { className: 'h-full flex flex-col bg-dark-bg text-white printable-container' },
        React.createElement(FeatureToolbar, {
            title: t.dashboardOverview,
            customControls: customControls
        }),
        React.createElement('div', { className: 'flex-grow p-6 overflow-y-auto' },
            React.createElement('div', { className: 'max-w-7xl mx-auto' },
                // Print Header
                React.createElement('div', { className: 'hidden print:block mb-8 text-center border-b border-black pb-4' },
                    React.createElement('h1', { className: 'text-3xl font-bold text-black' }, projectData.consultingPlan?.projectTitle || "Project Dashboard"),
                    React.createElement('p', { className: 'text-gray-600' }, `Executive Summary - Generated on ${new Date().toLocaleDateString()}`)
                ),

                // Bento Grid Layout
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]' },
                    
                    // 1. Health Card (Top Left)
                    React.createElement('div', { className: 'lg:col-span-1 lg:row-span-1' },
                        React.createElement(HealthCard, { progress, spi: kpi.spi, cpi: kpi.cpi })
                    ),

                    // 2. Task Velocity (Wide Center)
                    React.createElement('div', { className: 'lg:col-span-2 lg:row-span-1' },
                        React.createElement(TaskOverview, { schedule: projectData?.schedule })
                    ),

                    // 3. Quick Actions / Milestone (Right Column)
                    React.createElement('div', { className: 'lg:col-span-1 lg:row-span-2 flex flex-col gap-6' },
                        React.createElement(FinancialsWidget, { budget: projectData?.budget, currency }),
                        React.createElement(RiskMatrixWidget, { risks: projectData?.risk })
                    ),

                    // 4. Detailed Breakdown (Bottom Wide)
                    React.createElement('div', { className: 'lg:col-span-3 lg:row-span-1 bg-dark-card-solid border border-dark-border print:bg-white print:border-gray-300 rounded-2xl p-6' },
                        React.createElement('h3', { className: 'text-white print:text-black font-bold mb-4' }, "Upcoming Critical Path"),
                        projectData?.schedule 
                            ? React.createElement('div', { className: 'space-y-3' },
                                projectData.schedule.filter(t => t.type === 'task' && t.progress < 100).slice(0, 3).map(task => 
                                    React.createElement('div', { key: task.id, className: 'flex justify-between items-center p-3 bg-dark-bg/50 print:bg-gray-100 rounded-lg hover:bg-dark-bg transition-colors cursor-default' },
                                        React.createElement('div', { className: 'flex items-center gap-3' },
                                            React.createElement('div', { className: `w-2 h-2 rounded-full ${task.progress > 0 ? 'bg-yellow-400' : 'bg-slate-500'}` }),
                                            React.createElement('span', { className: 'font-medium text-sm text-white print:text-black' }, task.name)
                                        ),
                                        React.createElement('div', { className: 'flex items-center gap-4 text-xs text-brand-text-light print:text-gray-600' },
                                            React.createElement('span', null, task.end),
                                            React.createElement('span', { className: 'font-mono bg-dark-card print:bg-gray-200 px-2 py-1 rounded' }, task.resource || 'Unassigned')
                                        )
                                    )
                                )
                              )
                            : React.createElement('p', { className: 'text-brand-text-light text-sm italic' }, "No active tasks found in schedule.")
                    )
                )
            )
        )
    );
};

export default ProjectOverview;