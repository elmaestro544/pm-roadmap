import React, { useMemo, useState, useRef } from 'react';
import { FeatureToolbar, RefreshIcon, Spinner, ExportIcon, DocumentIcon, MaximizeIcon, CloseIcon } from './Shared.js';
import { i18n } from '../constants.js';

// --- Infographics Components ---

const RadialProgress = ({ progress, size = 80, strokeWidth = 8, color = '#2DD4BF' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(Math.max(progress || 0, 0), 100) / 100) * circumference;

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
        React.createElement('span', { className: 'absolute text-sm font-bold text-white print:text-black' }, `${Math.round(progress || 0)}%`)
    );
};

const StackedBar = ({ segments, height = 12 }) => {
    const total = segments.reduce((acc, s) => acc + s.value, 0);
    return React.createElement('div', { className: `w-full flex rounded-full overflow-hidden h-4 bg-dark-bg print:bg-gray-200` }, 
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

// --- Mini Gantt Chart Component ---
const MiniGantt = ({ tasks }) => {
    if (!tasks || tasks.length === 0) return null;

    // Filter mainly high-level tasks/phases for the overview
    // If we have 'project' type tasks (phases), use those. Otherwise take a slice of tasks.
    let displayTasks = tasks.filter(t => t.type === 'project');
    if (displayTasks.length === 0) displayTasks = tasks.slice(0, 5); // Fallback
    
    // Sort by start date
    displayTasks.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Determine timeline bounds
    const startDates = displayTasks.map(t => new Date(t.start).getTime());
    const endDates = displayTasks.map(t => new Date(t.end).getTime());
    const minTime = Math.min(...startDates);
    const maxTime = Math.max(...endDates);
    const totalDuration = maxTime - minTime;

    return React.createElement('div', { className: 'w-full space-y-3 mt-2' },
        displayTasks.map(task => {
            const start = new Date(task.start).getTime();
            const end = new Date(task.end).getTime();
            const left = totalDuration > 0 ? ((start - minTime) / totalDuration) * 100 : 0;
            const width = totalDuration > 0 ? ((end - start) / totalDuration) * 100 : 100;
            const isCompleted = task.progress === 100;

            return React.createElement('div', { key: task.id, className: 'relative' },
                React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                    React.createElement('span', { className: 'text-white font-medium truncate w-32' }, task.name),
                    React.createElement('span', { className: 'text-brand-text-light' }, `${task.progress}%`)
                ),
                React.createElement('div', { className: 'w-full h-2 bg-dark-bg rounded-full overflow-hidden relative' },
                    React.createElement('div', {
                        className: `absolute h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-brand-purple'}`,
                        style: { left: `${left}%`, width: `${Math.max(width, 1)}%` }
                    })
                )
            );
        }),
        // Time Axis
        React.createElement('div', { className: 'flex justify-between text-[10px] text-brand-text-light mt-2 pt-2 border-t border-dark-border' },
            React.createElement('span', null, new Date(minTime).toLocaleDateString()),
            React.createElement('span', null, new Date(maxTime).toLocaleDateString())
        )
    );
};


// --- Expandable Widget Wrapper ---
const DashboardWidget = ({ title, children, expandedContent, className = '', headerAction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return React.createElement(React.Fragment, null,
        // Collapsed / Standard View
        React.createElement('div', { className: `bg-dark-card-solid print:bg-white border border-dark-border print:border-gray-300 rounded-2xl p-5 flex flex-col relative transition-all hover:border-brand-purple/30 ${className}` },
            React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                React.createElement('h3', { className: 'text-white print:text-black font-bold text-sm uppercase tracking-wide' }, title),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    headerAction,
                    expandedContent && React.createElement('button', {
                        onClick: () => setIsExpanded(true),
                        className: 'p-1.5 rounded-full hover:bg-white/10 text-brand-text-light print:text-gray-500 hover:text-white transition-colors',
                        title: "Expand details"
                    }, React.createElement(MaximizeIcon, { className: "w-4 h-4" }))
                )
            ),
            React.createElement('div', { className: 'flex-grow min-h-0' }, children)
        ),

        // Expanded Modal View
        isExpanded && React.createElement('div', {
            className: 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-6 animate-fade-in-up',
            onClick: () => setIsExpanded(false)
        },
            React.createElement('div', {
                className: 'bg-dark-card w-full max-w-6xl h-[90vh] rounded-2xl border border-dark-border shadow-2xl flex flex-col overflow-hidden',
                onClick: e => e.stopPropagation()
            },
                React.createElement('div', { className: 'flex justify-between items-center p-6 border-b border-dark-border bg-dark-card-solid' },
                    React.createElement('h2', { className: 'text-2xl font-bold text-white' }, title),
                    React.createElement('button', {
                        onClick: () => setIsExpanded(false),
                        className: 'p-2 rounded-full hover:bg-white/10 text-brand-text-light hover:text-white'
                    }, React.createElement(CloseIcon, { className: "w-6 h-6" }))
                ),
                React.createElement('div', { className: 'flex-grow p-8 overflow-y-auto' },
                    expandedContent
                )
            )
        )
    );
};


// --- Specific Widgets --- (HealthCard, ResourceHeatmap, BudgetBurndown, etc. unchanged logic, simplified for brevity in rendering)

const HealthCard = ({ progress, spi, cpi }) => {
    const status = (spi || 1) >= 1 && (cpi || 1) >= 1 ? 'Healthy' : ((spi || 1) < 0.9 || (cpi || 1) < 0.9) ? 'Critical' : 'At Risk';
    const statusColor = status === 'Healthy' ? 'text-green-400 print:text-green-700' : status === 'Critical' ? 'text-red-400 print:text-red-700' : 'text-yellow-400 print:text-yellow-700';
    
    return React.createElement(DashboardWidget, { title: "Project Health" },
        React.createElement('div', { className: 'flex justify-between items-center h-full' },
            React.createElement('div', null,
                React.createElement('p', { className: `text-3xl font-bold ${statusColor}` }, status),
                React.createElement('p', { className: 'text-sm text-brand-text-light mt-1' }, `${Math.round(progress || 0)}% Complete`)
            ),
            React.createElement(RadialProgress, { progress: progress || 0, color: status === 'Healthy' ? '#4ADE80' : status === 'Critical' ? '#F87171' : '#FACC15', size: 70 })
        ),
        React.createElement('div', { className: 'grid grid-cols-2 gap-2 mt-4' },
            React.createElement('div', { className: 'bg-dark-bg/50 p-2 rounded text-center' },
                React.createElement('span', { className: 'block text-xs text-brand-text-light' }, "SPI"),
                React.createElement('span', { className: `font-bold ${(spi || 1) >= 1 ? 'text-green-400' : 'text-red-400'}` }, spi || 1)
            ),
            React.createElement('div', { className: 'bg-dark-bg/50 p-2 rounded text-center' },
                React.createElement('span', { className: 'block text-xs text-brand-text-light' }, "CPI"),
                React.createElement('span', { className: `font-bold ${(cpi || 1) >= 1 ? 'text-green-400' : 'text-red-400'}` }, cpi || 1)
            )
        )
    );
};

const ResourceHeatmap = ({ schedule }) => {
    const utilization = useMemo(() => {
        if (!schedule || !Array.isArray(schedule)) return {};
        const map = {};
        schedule.filter(t => t.type === 'task').forEach(t => {
            const res = t.resource || 'Unassigned';
            if (!map[res]) map[res] = { count: 0, pending: 0 };
            map[res].count++;
            if (t.progress < 100) map[res].pending++;
        });
        return map;
    }, [schedule]);

    const resources = Object.entries(utilization).sort((a, b) => b[1].pending - a[1].pending).slice(0, 5);

    const ExpandedView = (
        React.createElement('div', { className: 'space-y-6' },
            React.createElement('p', { className: 'text-brand-text-light' }, "Detailed breakdown of resource allocation across all tasks."),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                Object.entries(utilization).map(([name, stats]) => 
                    React.createElement('div', { key: name, className: 'bg-dark-bg p-4 rounded-lg border border-dark-border' },
                        React.createElement('h4', { className: 'font-bold text-white mb-2' }, name),
                        React.createElement('div', { className: 'flex justify-between text-sm mb-2' },
                            React.createElement('span', { className: 'text-brand-text-light' }, "Total Tasks"),
                            React.createElement('span', { className: 'text-white' }, stats.count)
                        ),
                        React.createElement('div', { className: 'flex justify-between text-sm mb-2' },
                            React.createElement('span', { className: 'text-brand-text-light' }, "Pending"),
                            React.createElement('span', { className: 'text-yellow-400' }, stats.pending)
                        ),
                        React.createElement('div', { className: 'w-full bg-slate-700 h-2 rounded-full overflow-hidden' },
                            React.createElement('div', { 
                                className: 'h-full bg-brand-purple', 
                                style: { width: `${(stats.count > 0 ? (stats.count - stats.pending)/stats.count : 0) * 100}%` } 
                            })
                        )
                    )
                )
            )
        )
    );

    return React.createElement(DashboardWidget, { 
        title: "Resource Load", 
        expandedContent: ExpandedView
    },
        resources.length > 0 ? (
            React.createElement('div', { className: 'space-y-3' },
                resources.map(([name, stats], i) => (
                    React.createElement('div', { key: i, className: 'flex items-center justify-between text-sm' },
                        React.createElement('div', { className: 'flex items-center gap-2 truncate' },
                            React.createElement('div', { className: `w-2 h-2 rounded-full ${stats.pending > 3 ? 'bg-red-400' : 'bg-green-400'}` }),
                            React.createElement('span', { className: 'text-brand-text-light truncate max-w-[120px]' }, name)
                        ),
                        React.createElement('span', { className: 'font-mono text-white text-xs bg-dark-bg px-1.5 py-0.5 rounded' }, `${stats.pending} active`)
                    )
                ))
            )
        ) : React.createElement('p', { className: 'text-xs text-brand-text-light' }, "No resource data available")
    );
};

const BudgetBurndown = ({ budget, currency = 'USD', kpi }) => {
    const totalBudget = kpi?.budgetAtCompletion || 0;
    const earnedValue = totalBudget * ((kpi?.overallProgress || 0) / 100);
    const actualCost = earnedValue / (kpi?.cpi || 1); 
    
    const format = (v) => {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(v || 0);
        } catch {
            return `${currency} ${v}`;
        }
    };

    const ExpandedView = (
        React.createElement('div', null,
            React.createElement('div', { className: 'grid grid-cols-3 gap-6 mb-8' },
                React.createElement('div', { className: 'bg-dark-bg p-4 rounded-xl text-center' },
                    React.createElement('p', { className: 'text-brand-text-light text-sm' }, "Planned Budget"),
                    React.createElement('p', { className: 'text-2xl font-bold text-white' }, format(totalBudget))
                ),
                React.createElement('div', { className: 'bg-dark-bg p-4 rounded-xl text-center' },
                    React.createElement('p', { className: 'text-brand-text-light text-sm' }, "Actual Spend"),
                    React.createElement('p', { className: `text-2xl font-bold ${actualCost > earnedValue ? 'text-red-400' : 'text-green-400'}` }, format(actualCost))
                ),
                React.createElement('div', { className: 'bg-dark-bg p-4 rounded-xl text-center' },
                    React.createElement('p', { className: 'text-brand-text-light text-sm' }, "Remaining"),
                    React.createElement('p', { className: 'text-2xl font-bold text-brand-purple-light' }, format(totalBudget - actualCost))
                )
            ),
            React.createElement('h4', { className: 'text-lg font-bold text-white mb-4' }, "Cost Breakdown"),
            budget?.budgetItems && (
                React.createElement('table', { className: 'w-full text-left text-sm' },
                    React.createElement('thead', { className: 'bg-dark-bg text-brand-text-light' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'p-3' }, "Category"),
                            React.createElement('th', { className: 'p-3' }, "Estimated Cost"),
                            React.createElement('th', { className: 'p-3' }, "% of Total")
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-dark-border' },
                        budget.budgetItems.map((item, i) => {
                            const cost = item.laborCost + item.materialsCost;
                            const percent = totalBudget > 0 ? Math.round((cost/totalBudget)*100) : 0;
                            return React.createElement('tr', { key: i },
                                React.createElement('td', { className: 'p-3 text-white' }, item.category),
                                React.createElement('td', { className: 'p-3 text-brand-text-light' }, format(cost)),
                                React.createElement('td', { className: 'p-3 text-brand-text-light' }, `${percent}%`)
                            );
                        })
                    )
                )
            )
        )
    );

    const percentUtilized = totalBudget > 0 ? Math.min((actualCost / totalBudget) * 100, 100) : 0;

    return React.createElement(DashboardWidget, { title: "Budget Burndown", expandedContent: ExpandedView },
        React.createElement('div', { className: 'flex flex-col h-full justify-between' },
            React.createElement('div', { className: 'text-center py-2' },
                React.createElement('p', { className: 'text-xs text-brand-text-light mb-1' }, "Budget Utilized"),
                React.createElement('p', { className: 'text-3xl font-bold text-white' }, `${Math.round(percentUtilized)}%`)
            ),
            React.createElement('div', { className: 'w-full bg-slate-700 h-3 rounded-full overflow-hidden' },
                React.createElement('div', { 
                    className: `h-full ${actualCost > totalBudget ? 'bg-red-500' : 'bg-green-500'}`, 
                    style: { width: `${percentUtilized}%` } 
                })
            ),
            React.createElement('div', { className: 'flex justify-between text-xs text-brand-text-light mt-2' },
                React.createElement('span', null, format(actualCost)),
                React.createElement('span', null, format(totalBudget))
            )
        )
    );
};

const MilestonesWidget = ({ milestones, schedule }) => {
    
    // Expanded view logic (unchanged)
    const ExpandedView = (
        React.createElement('div', { className: 'space-y-4' },
            React.createElement('p', { className: 'text-brand-text-light' }, "Key project checkpoints and deliverables."),
            milestones && milestones.length > 0 ? (
                milestones.map((m, i) => (
                    React.createElement('div', { key: i, className: 'flex gap-4 p-4 bg-dark-bg rounded-lg border border-dark-border' },
                        React.createElement('div', { className: 'flex-shrink-0 w-12 text-center' },
                            React.createElement('div', { className: 'text-xs text-brand-text-light uppercase' }, m.date ? new Date(m.date).toLocaleString('default', { month: 'short' }) : ''),
                            React.createElement('div', { className: 'text-xl font-bold text-white' }, m.date ? new Date(m.date).getDate() : '')
                        ),
                        React.createElement('div', { className: 'flex-grow' },
                            React.createElement('h4', { className: 'font-bold text-white' }, m.name),
                            React.createElement('p', { className: 'text-sm text-brand-text-light' }, m.description || "No description provided.")
                        ),
                        React.createElement('div', { className: 'flex-shrink-0 self-center' },
                            m.completed 
                                ? React.createElement('span', { className: 'px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold' }, "Completed")
                                : React.createElement('span', { className: 'px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs' }, "Pending")
                        )
                    )
                ))
            ) : React.createElement('p', { className: 'text-slate-500 italic' }, "No milestones defined.")
        )
    );

    return React.createElement(DashboardWidget, { title: "Project Timeline & Milestones", expandedContent: ExpandedView },
        React.createElement('div', { className: 'h-full flex flex-col' },
             schedule && schedule.length > 0 
                ? React.createElement(MiniGantt, { tasks: schedule })
                : React.createElement('div', { className: 'h-32 bg-dark-bg/50 rounded-lg flex items-center justify-center text-sm text-brand-text-light border border-dark-border border-dashed' }, "No timeline data available.")
        )
    );
};

const RiskRadarWidget = ({ risks }) => {
    const list = risks?.risks || [];
    const high = list.filter(r => r.severity === 'High').length;
    
    // Categories calculation logic (unchanged)
    const categories = { 'Schedule': 0, 'Cost': 0, 'Scope': 0, 'Resource': 0 };
    list.forEach(r => {
        const txt = (r.title + r.description).toLowerCase();
        if (txt.includes('delay') || txt.includes('time')) categories['Schedule']++;
        else if (txt.includes('budget') || txt.includes('cost')) categories['Cost']++;
        else if (txt.includes('scope') || txt.includes('requirement')) categories['Scope']++;
        else categories['Resource']++; 
    });

    const ExpandedView = (
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-8' },
            React.createElement('div', null,
                React.createElement('h4', { className: 'text-lg font-bold text-white mb-4' }, "Risk Distribution"),
                React.createElement('div', { className: 'space-y-3' },
                    Object.entries(categories).map(([cat, count]) => (
                        React.createElement('div', { key: cat },
                            React.createElement('div', { className: 'flex justify-between text-sm mb-1' },
                                React.createElement('span', { className: 'text-brand-text-light' }, cat),
                                React.createElement('span', { className: 'text-white font-bold' }, count)
                            ),
                            React.createElement('div', { className: 'w-full bg-dark-bg h-2 rounded-full overflow-hidden' },
                                React.createElement('div', { 
                                    className: 'h-full bg-red-500', 
                                    style: { width: `${(count / Math.max(list.length, 1)) * 100}%` } 
                                })
                            )
                        )
                    ))
                )
            ),
            React.createElement('div', null,
                React.createElement('h4', { className: 'text-lg font-bold text-white mb-4' }, "Top Critical Risks"),
                React.createElement('ul', { className: 'space-y-3' },
                    list.filter(r => r.severity === 'High').slice(0, 5).map((r, i) => (
                        React.createElement('li', { key: i, className: 'bg-red-500/10 p-3 rounded border border-red-500/20' },
                            React.createElement('p', { className: 'text-red-200 font-semibold text-sm' }, r.title),
                            React.createElement('p', { className: 'text-red-300/70 text-xs mt-1' }, `Impact: ${r.impact}`)
                        )
                    ))
                )
            )
        )
    );

    const safeListLength = Math.max(list.length, 1);

    return React.createElement(DashboardWidget, { title: "Risk Exposure", expandedContent: ExpandedView },
        React.createElement('div', { className: 'flex flex-col items-center justify-center h-full gap-2' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('span', { className: 'text-4xl font-bold text-red-500' }, high),
                React.createElement('span', { className: 'block text-xs text-brand-text-light uppercase tracking-wide' }, "Critical Risks")
            ),
            React.createElement('div', { className: 'w-full flex gap-1 h-2 mt-2' },
                React.createElement('div', { className: 'bg-red-500 h-full rounded-l', style: { width: `${(high/safeListLength)*100}%` } }),
                React.createElement('div', { className: 'bg-yellow-500 h-full', style: { width: `${((list.length-high)/safeListLength)*100}%` } })
            )
        )
    );
};

const ProjectDetailsWidget = ({ details }) => {
    const ExpandedView = (
        React.createElement('div', { className: 'space-y-6' },
            React.createElement('div', null,
                React.createElement('h4', { className: 'text-brand-purple-light font-bold mb-2' }, "Description"),
                React.createElement('p', { className: 'text-white leading-relaxed' }, details.description)
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                React.createElement('div', null,
                    React.createElement('h4', { className: 'text-brand-text-light text-sm mb-1' }, "Start Date"),
                    React.createElement('p', { className: 'text-white font-mono' }, details.startDate)
                ),
                React.createElement('div', null,
                    React.createElement('h4', { className: 'text-brand-text-light text-sm mb-1' }, "Finish Date"),
                    React.createElement('p', { className: 'text-white font-mono' }, details.finishDate)
                ),
                React.createElement('div', null,
                    React.createElement('h4', { className: 'text-brand-text-light text-sm mb-1' }, "Location"),
                    React.createElement('p', { className: 'text-white' }, details.location)
                ),
                React.createElement('div', null,
                    React.createElement('h4', { className: 'text-brand-text-light text-sm mb-1' }, "Budget Type"),
                    React.createElement('p', { className: 'text-white' }, details.budgetType)
                )
            )
        )
    );

    return React.createElement(DashboardWidget, { title: "Project Details", expandedContent: ExpandedView },
        React.createElement('div', { className: 'space-y-2 text-sm' },
            React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-brand-text-light' }, "Start:"),
                React.createElement('span', { className: 'text-white' }, details.startDate || '-')
            ),
            React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-brand-text-light' }, "Finish:"),
                React.createElement('span', { className: 'text-white' }, details.finishDate || '-')
            ),
            React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-brand-text-light' }, "Loc:"),
                React.createElement('span', { className: 'text-white truncate max-w-[100px]' }, details.location || '-')
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

// --- Main Layout ---

const ProjectOverview = ({ language, projectData }) => {
    const t = i18n[language];
    const currency = projectData?.criteria?.currency || 'USD';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const fullscreenRef = useRef(null); // Added ref

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate data refresh / recalculation delay
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    // Calculate derived metrics with safety checks
    const kpi = projectData?.kpiReport?.kpis || { spi: 1, cpi: 1, overallProgress: 0 };
    const progress = kpi.overallProgress || (projectData?.schedule ? 
        Math.round(projectData.schedule.reduce((acc, t) => acc + (t.progress || 0), 0) / Math.max(projectData.schedule.length, 1)) : 0);

    // Extract Milestones with safety checks
    const milestones = projectData?.schedule ? projectData.schedule.filter(t => t.type === 'milestone').map(m => ({
        name: m.name,
        date: m.end || m.start,
        completed: m.progress === 100,
        description: m.description
    })) : [];

    // Project Meta
    const projectMeta = {
        description: projectData?.objective || projectData?.consultingPlan?.scopeAndObjectives || 'No description available.',
        location: projectData?.criteria?.location,
        startDate: projectData?.criteria?.startDate,
        finishDate: projectData?.criteria?.finishDate,
        budgetType: projectData?.criteria?.budgetType
    };

    const handleExportCSV = () => {
        // Flatten data for CSV
        const rows = [
            ['Metric', 'Value'],
            ['Project Name', projectData?.consultingPlan?.projectTitle || 'Untitled'],
            ['Overall Progress', `${progress}%`],
            ['SPI (Schedule Performance)', kpi.spi],
            ['CPI (Cost Performance)', kpi.cpi],
            ['Total Tasks', projectData?.schedule?.length || 0],
            ['Active Risks', projectData?.risk?.risks?.length || 0],
            ['Total Budget', projectData?.criteria?.budget || 'N/A']
        ];

        // Add Risks if available
        if (projectData?.risk?.risks) {
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

    return React.createElement('div', { ref: fullscreenRef, className: 'h-full flex flex-col bg-dark-bg text-white printable-container' },
        React.createElement(FeatureToolbar, {
            title: t.dashboardOverview,
            customControls: customControls,
            containerRef: fullscreenRef // Passed ref for fullscreen logic
        }),
        React.createElement('div', { className: 'flex-grow p-6 overflow-y-auto' },
            React.createElement('div', { className: 'max-w-7xl mx-auto' },
                // Print Header
                React.createElement('div', { className: 'hidden print:block mb-8 text-center border-b border-black pb-4' },
                    React.createElement('h1', { className: 'text-3xl font-bold text-black' }, projectData?.consultingPlan?.projectTitle || "Project Dashboard"),
                    React.createElement('p', { className: 'text-gray-600' }, `Executive Summary - Generated on ${new Date().toLocaleDateString()}`)
                ),

                // Enhanced Bento Grid Layout
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(160px,auto)]' },
                    
                    // Row 1: Core Metrics
                    React.createElement('div', { className: 'md:col-span-1 lg:col-span-1' },
                        React.createElement(HealthCard, { progress, spi: kpi.spi, cpi: kpi.cpi })
                    ),
                    React.createElement('div', { className: 'md:col-span-2 lg:col-span-2' },
                        React.createElement(TaskOverview, { schedule: projectData?.schedule })
                    ),
                    React.createElement('div', { className: 'md:col-span-1 lg:col-span-1' },
                        React.createElement(ProjectDetailsWidget, { details: projectMeta })
                    ),

                    // Row 2: Analytics
                    React.createElement('div', { className: 'md:col-span-1 lg:col-span-1' },
                        React.createElement(BudgetBurndown, { budget: projectData?.budget, currency, kpi })
                    ),
                    React.createElement('div', { className: 'md:col-span-1 lg:col-span-1' },
                        React.createElement(RiskRadarWidget, { risks: projectData?.risk })
                    ),
                    React.createElement('div', { className: 'md:col-span-1 lg:col-span-2' },
                        React.createElement(ResourceHeatmap, { schedule: projectData?.schedule })
                    ),

                    // Row 3: Timeline & Milestones
                    React.createElement('div', { className: 'md:col-span-3 lg:col-span-4 bg-dark-card-solid border border-dark-border rounded-2xl p-6' },
                        React.createElement('h3', { className: 'text-white font-bold mb-4 flex items-center gap-2' }, 
                            React.createElement('span', { className: 'w-2 h-6 bg-brand-cyan rounded-full' }),
                            "Project Timeline & Milestones"
                        ),
                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
                            React.createElement('div', { className: 'md:col-span-2' },
                                React.createElement(MiniGantt, { tasks: projectData?.schedule })
                            ),
                            React.createElement('div', { className: 'md:col-span-1' },
                                React.createElement(MilestonesWidget, { milestones, schedule: projectData?.schedule })
                            )
                        )
                    )
                )
            )
        )
    );
};

export default ProjectOverview;