
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateScheduleFromPlan } from '../services/schedulingService.js';
import { ScheduleIcon, Spinner, FeatureToolbar, BoardIcon, ListIcon, TimelineIcon } from './Shared.js';
import { i18n } from '../constants.js';

// --- Helper Functions ---
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getDaysDiff = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(12, 0, 0, 0);
    d2.setHours(12, 0, 0, 0);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- Sub-Components ---

const LoadingView = () => (
    React.createElement('div', { className: 'text-center flex flex-col items-center h-full justify-center' },
        React.createElement(ScheduleIcon, { className: 'h-16 w-16 animate-pulse text-brand-purple-light' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Building Schedule..."),
        React.createElement('p', { className: 'text-brand-text-light mb-8' }, "Calculating critical path, assigning resources, and loading costs."),
        React.createElement(Spinner, { size: '12' })
    )
);

// --- Timeline View with Synchronized Scroll ---
const TimelineView = ({ tasks, expanded, onToggle, scale, zoom, isEditing, onUpdate }) => {
    // 1. Data Preparation
    const dates = useMemo(() => {
        if (!tasks.length) return { start: new Date(), end: new Date(), totalDays: 0 };
        const startDates = tasks.map(t => new Date(t.start));
        const endDates = tasks.map(t => new Date(t.end));
        const minDate = new Date(Math.min(...startDates));
        const maxDate = new Date(Math.max(...endDates));
        // Buffer
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 5);
        return { start: minDate, end: maxDate, totalDays: getDaysDiff(minDate, maxDate) };
    }, [tasks]);

    const colWidth = scale === 'days' ? 40 * zoom 
                   : scale === 'weeks' ? 60 * zoom 
                   : scale === 'months' ? 100 * zoom 
                   : 120 * zoom; // quarters width
    
    const periods = useMemo(() => {
        const result = [];
        const current = new Date(dates.start);
        const safetyLimit = 1000; 
        let count = 0;

        if (scale === 'days') {
            for (let i = 0; i <= dates.totalDays; i++) {
                result.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (scale === 'weeks') {
             const day = current.getDay();
             const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
             current.setDate(diff);
             while (current <= dates.end && count < safetyLimit) {
                 result.push(new Date(current));
                 current.setDate(current.getDate() + 7);
                 count++;
             }
        } else if (scale === 'months') {
            current.setDate(1);
            while (current <= dates.end && count < safetyLimit) {
                result.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
                count++;
            }
        } else if (scale === 'quarters') {
            const qMonth = Math.floor(current.getMonth() / 3) * 3;
            current.setMonth(qMonth);
            current.setDate(1);
            while (current <= dates.end && count < safetyLimit) {
                result.push(new Date(current));
                current.setMonth(current.getMonth() + 3);
                count++;
            }
        }
        return result;
    }, [dates, scale]);

    const visibleTasks = useMemo(() => {
        const result = [];
        tasks.forEach(task => {
            if (task.type === 'project') {
                result.push({ ...task, level: 0 });
            } else if (task.type === 'task') {
                const parentExpanded = !task.project || expanded.has(task.project); 
                if (parentExpanded) {
                    result.push({ ...task, level: 1 });
                }
            } else {
                result.push({ ...task, level: 0 });
            }
        });
        return result;
    }, [tasks, expanded]);

    const getLeftPos = (dateStr) => {
        const date = new Date(dateStr);
        const diff = getDaysDiff(dates.start, date);
        if (scale === 'days') return diff * colWidth;
        if (scale === 'weeks') return (diff / 7) * colWidth;
        if (scale === 'months') return (diff / 30) * colWidth;
        if (scale === 'quarters') return (diff / 90) * colWidth;
        return 0;
    };

    const getWidth = (start, end) => {
        const diff = getDaysDiff(start, end) + 1; 
        if (scale === 'days') return Math.max(diff * colWidth, 5);
        if (scale === 'weeks') return Math.max((diff / 7) * colWidth, 5);
        if (scale === 'months') return Math.max((diff / 30) * colWidth, 5);
        if (scale === 'quarters') return Math.max((diff / 90) * colWidth, 5);
        return 0;
    };

    const rowHeight = 40;
    const taskListWidth = 300; 

    // Dependency Lines Calculation
    const dependencyLines = useMemo(() => {
        const lines = [];
        const taskYMap = new Map();
        visibleTasks.forEach((t, i) => taskYMap.set(t.id, i * rowHeight + (rowHeight / 2)));

        visibleTasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                const endX = getLeftPos(task.start) + getWidth(task.start, task.end);
                
                // For each predecessor
                task.dependencies.forEach(depId => {
                    const predTask = tasks.find(t => t.id === depId);
                    if (predTask && taskYMap.has(task.id) && taskYMap.has(depId)) {
                        const startY = taskYMap.get(depId);
                        const startX = getLeftPos(predTask.start) + getWidth(predTask.start, predTask.end);
                        
                        const endY = taskYMap.get(task.id);
                        const targetX = getLeftPos(task.start);

                        // Draw path
                        lines.push({ 
                            id: `${depId}-${task.id}`,
                            d: `M ${startX} ${startY} 
                                C ${startX + 20} ${startY}, ${targetX - 20} ${endY}, ${targetX} ${endY}` 
                        });
                    }
                });
            }
        });
        return lines;
    }, [visibleTasks, tasks, dates, scale, zoom]);

    return React.createElement('div', { className: 'h-full w-full overflow-auto bg-dark-bg relative border border-dark-border rounded-xl scrollbar-thin' },
        React.createElement('div', { className: 'min-w-fit flex flex-col relative' },
            
            // --- Header Row (Sticky Top) ---
            React.createElement('div', { className: 'flex sticky top-0 z-30 bg-dark-card-solid border-b border-dark-border h-12' },
                // Top Left Corner
                React.createElement('div', { 
                    className: 'sticky left-0 z-40 w-[300px] flex-shrink-0 bg-dark-card-solid border-r border-dark-border flex items-center px-4 font-bold text-brand-text shadow-md',
                    style: { minWidth: taskListWidth, width: taskListWidth }
                }, "Task Name"),
                
                // Timeline Dates Header
                React.createElement('div', { className: 'flex' },
                    periods.map((p, i) => 
                        React.createElement('div', { 
                            key: i, 
                            className: 'flex-shrink-0 border-r border-dark-border px-2 py-3 text-xs text-brand-text-light font-medium truncate flex items-center justify-center',
                            style: { width: colWidth }
                        }, 
                            scale === 'days' ? p.getDate() : 
                            scale === 'quarters' ? `Q${Math.floor(p.getMonth() / 3) + 1} ${p.getFullYear()}` :
                            p.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        )
                    )
                )
            ),

            // --- Body Grid ---
            // Background Grid Lines
            React.createElement('div', { className: 'absolute top-12 bottom-0 left-[300px] flex pointer-events-none z-0' },
                periods.map((p, i) => 
                    React.createElement('div', { 
                        key: i, 
                        className: 'flex-shrink-0 border-r border-dark-border/30 h-full',
                        style: { width: colWidth }
                    })
                )
            ),

            // Relations Overlay (SVG)
            React.createElement('svg', { className: 'absolute top-12 left-[300px] pointer-events-none z-10 w-full h-full' },
                dependencyLines.map(line => 
                    React.createElement('path', {
                        key: line.id,
                        d: line.d,
                        fill: "none",
                        stroke: "#5EEAD4", // brand-purple-light
                        strokeWidth: "1.5",
                        opacity: "0.5",
                        markerEnd: "url(#arrowhead)"
                    })
                ),
                React.createElement('defs', null,
                    React.createElement('marker', { id: "arrowhead", markerWidth: "6", markerHeight: "7", refX: "5", refY: "3.5", orient: "auto" },
                        React.createElement('polygon', { points: "0 0, 6 3.5, 0 7", fill: "#5EEAD4" })
                    )
                )
            ),

            // Rows
            visibleTasks.map(task => {
                const isProject = task.type === 'project';
                const left = getLeftPos(task.start);
                const width = getWidth(task.start, task.end);
                
                return React.createElement('div', { key: task.id, className: 'flex h-10 hover:bg-white/5 transition-colors relative group' },
                    
                    // Task List Column (Sticky Left)
                    React.createElement('div', { 
                        className: `sticky left-0 z-20 w-[300px] flex-shrink-0 border-r border-dark-border flex items-center px-4 gap-2 overflow-hidden shadow-md ${isProject ? 'bg-dark-card-solid' : 'bg-dark-card'}`,
                        style: { minWidth: taskListWidth, width: taskListWidth }
                    },
                        React.createElement('div', { style: { width: task.level * 20 } }), // Indentation
                        isProject && React.createElement('button', { 
                            onClick: () => onToggle(task.id),
                            className: 'p-0.5 hover:text-white text-brand-purple-light focus:outline-none'
                        }, expanded.has(task.id) ? '▼' : '▶'),
                        React.createElement('span', { className: `truncate text-sm font-medium ${isProject ? 'text-white' : 'text-brand-text-light'}` }, task.name)
                    ),

                    // Timeline Bar Area
                    React.createElement('div', { className: 'relative flex-grow z-20' }, // z-20 to be above lines
                        React.createElement('div', {
                            className: `absolute top-2 h-6 rounded-md shadow-sm text-[10px] text-white whitespace-nowrap overflow-visible flex items-center`,
                            style: { 
                                left: left, 
                                width: width,
                                backgroundColor: isProject ? '#2DD4BF' : 'rgba(45, 212, 191, 0.15)', 
                            }
                        },
                            // Progress Fill
                            !isProject && React.createElement('div', {
                                className: 'h-full bg-gradient-to-r from-brand-purple to-brand-purple-light absolute left-0 top-0 rounded-l-md transition-all duration-500',
                                style: { width: `${task.progress}%` }
                            }),
                            
                            // Resource Label (Right of bar)
                            !isProject && React.createElement('span', { 
                                className: 'absolute left-full ml-2 text-xs text-brand-text-light font-medium truncate pointer-events-none' 
                            }, task.resource),

                            // % Label (Inside)
                            React.createElement('span', { className: `relative z-10 px-2 ${isProject ? 'font-bold' : ''}` },
                                width > 40 ? `${task.progress}%` : ''
                            )
                        )
                    )
                )
            })
        )
    );
};

const BoardView = ({ tasks }) => {
    const columns = [
        { id: 'todo', label: 'To Do', statusCheck: t => t.progress === 0 },
        { id: 'in-progress', label: 'In Progress', statusCheck: t => t.progress > 0 && t.progress < 100 },
        { id: 'done', label: 'Done', statusCheck: t => t.progress === 100 },
    ];

    return React.createElement('div', { className: 'flex gap-4 h-full overflow-x-auto p-4' },
        columns.map(col => {
            const colTasks = tasks.filter(t => t.type !== 'project' && col.statusCheck(t));
            return React.createElement('div', { key: col.id, className: 'flex-shrink-0 w-80 bg-dark-card-solid rounded-xl border border-dark-border flex flex-col' },
                React.createElement('div', { className: 'p-4 font-bold text-white border-b border-dark-border flex justify-between items-center' },
                    col.label,
                    React.createElement('span', { className: 'bg-dark-bg px-2 py-0.5 rounded text-xs text-brand-text-light border border-dark-border' }, colTasks.length)
                ),
                React.createElement('div', { className: 'flex-grow overflow-y-auto p-3 space-y-3' },
                    colTasks.map(task => 
                        React.createElement('div', { key: task.id, className: 'bg-dark-card p-4 rounded-lg border border-dark-border shadow-sm hover:border-brand-purple/50 transition-colors group cursor-pointer' },
                            React.createElement('p', { className: 'font-semibold text-white text-sm mb-2 group-hover:text-brand-purple-light transition-colors' }, task.name),
                            React.createElement('div', { className: 'text-xs text-brand-text-light mb-2' },
                                React.createElement('span', { className: "block" }, `Resource: ${task.resource || '-'}`),
                                task.cost && React.createElement('span', { className: "block" }, `Cost: $${task.cost.toLocaleString()}`)
                            ),
                            React.createElement('div', { className: 'flex justify-between items-center text-xs text-brand-text-light' },
                                React.createElement('span', { className: 'flex items-center gap-1' }, 
                                    React.createElement('span', {className: "opacity-50"}, "Due:"), 
                                    formatDate(task.end)
                                ),
                                React.createElement('div', { className: 'flex items-center gap-1' },
                                    React.createElement('div', { className: 'w-16 h-1.5 bg-dark-bg rounded-full overflow-hidden' },
                                        React.createElement('div', { className: 'h-full bg-brand-purple', style: { width: `${task.progress}%` } })
                                    ),
                                    React.createElement('span', null, `${task.progress}%`)
                                )
                            )
                        )
                    )
                )
            );
        })
    );
};

const EditableListView = ({ tasks, onUpdate, currency }) => (
    React.createElement('div', { className: 'h-full overflow-auto bg-dark-card rounded-xl border border-dark-border print:bg-white print:border-gray-300' },
        React.createElement('table', { className: 'w-full text-left text-sm' },
            React.createElement('thead', { className: 'bg-dark-card-solid text-brand-text-light sticky top-0 z-10 print:bg-gray-100 print:text-black' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Task Name"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Start Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "End Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Resource"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, `Cost (${currency})`),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Progress"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Predecessors")
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-dark-border print:divide-gray-200' },
                tasks.map(task => 
                    React.createElement('tr', { key: task.id, className: 'hover:bg-white/5 print:text-black' },
                        React.createElement('td', { className: 'p-4' },
                            React.createElement('input', {
                                value: task.name,
                                onChange: (e) => onUpdate(task.id, 'name', e.target.value),
                                className: "bg-transparent w-full outline-none text-white print:text-black focus:border-b focus:border-brand-purple"
                            })
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('input', {
                                type: 'date',
                                value: task.start,
                                onChange: (e) => onUpdate(task.id, 'start', e.target.value),
                                className: "bg-transparent w-full outline-none text-brand-text-light print:text-black"
                            })
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('input', {
                                type: 'date',
                                value: task.end,
                                onChange: (e) => onUpdate(task.id, 'end', e.target.value),
                                className: "bg-transparent w-full outline-none text-brand-text-light print:text-black"
                            })
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('input', {
                                value: task.resource || '',
                                onChange: (e) => onUpdate(task.id, 'resource', e.target.value),
                                placeholder: "Unassigned",
                                className: "bg-transparent w-full outline-none text-brand-text-light print:text-black"
                            })
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('input', {
                                type: "number",
                                value: task.cost || 0,
                                onChange: (e) => onUpdate(task.id, 'cost', parseFloat(e.target.value)),
                                className: "bg-transparent w-24 outline-none text-brand-text-light print:text-black"
                            })
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('input', {
                                    type: 'range', min: 0, max: 100,
                                    value: task.progress,
                                    onChange: (e) => onUpdate(task.id, 'progress', parseInt(e.target.value)),
                                    className: "w-16 h-1.5 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                }),
                                React.createElement('span', { className: 'w-8 text-right' }, `${task.progress}%`)
                             )
                        ),
                        React.createElement('td', { className: 'p-4' },
                             React.createElement('input', {
                                value: task.dependencies?.join(', ') || '',
                                onChange: (e) => onUpdate(task.id, 'dependencies', e.target.value.split(',').map(s=>s.trim())),
                                placeholder: "-",
                                className: "bg-transparent w-full outline-none text-brand-text-light print:text-black"
                            })
                        )
                    )
                )
            )
        )
    )
);

const SchedulingView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    
    const [viewMode, setViewMode] = useState('timeline');
    const [scale, setScale] = useState('days');
    const [zoom, setZoom] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(new Set());

    useEffect(() => {
        if (projectData.plan && !projectData.schedule && !isLoading) {
             const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    // Pass criteria (e.g. duration constraint) if available
                    const schedule = await generateScheduleFromPlan(projectData.plan, projectData.criteria);
                    onUpdateProject({ schedule });
                    const projectIds = schedule.filter(t => t.type === 'project').map(t => t.id);
                    setExpanded(new Set(projectIds));
                } catch (err) {
                    setError(err.message || "Failed to generate schedule.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        } else if (projectData.schedule && expanded.size === 0) {
             const projectIds = projectData.schedule.filter(t => t.type === 'project').map(t => t.id);
             setExpanded(new Set(projectIds));
        }
    }, [projectData.plan, projectData.schedule, projectData.criteria, isLoading, onUpdateProject, setIsLoading, setError]);

    const handleUpdateTask = (id, field, value) => {
        const updatedSchedule = projectData.schedule.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        );
        onUpdateProject({ schedule: updatedSchedule });
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpanded(newExpanded);
    };

    const handleCollapseAll = () => {
        if (expanded.size > 0) {
            setExpanded(new Set());
        } else {
            const projectIds = projectData.schedule.filter(t => t.type === 'project').map(t => t.id);
            setExpanded(new Set(projectIds));
        }
    };

    const handleExpandAll = () => {
        const allIds = projectData.schedule.filter(t => t.type === 'project').map(t => t.id);
        setExpanded(new Set(allIds));
    };

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (!projectData.schedule) return React.createElement(LoadingView, null);

        switch (viewMode) {
            case 'list':
                return React.createElement(EditableListView, { 
                    tasks: projectData.schedule, 
                    onUpdate: handleUpdateTask,
                    currency: projectData.criteria?.currency || 'USD'
                });
            case 'board':
                return React.createElement(BoardView, { tasks: projectData.schedule });
            default:
                return React.createElement(TimelineView, { 
                    tasks: projectData.schedule, 
                    expanded, 
                    onToggle: toggleExpand, 
                    scale, 
                    zoom,
                    isEditing,
                    onUpdate: handleUpdateTask
                });
        }
    };

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement('div', { className: 'non-printable flex-shrink-0 border-b border-dark-border bg-dark-card/50 px-6 h-12 flex items-center justify-between' },
             React.createElement('div', { className: 'flex items-center gap-1' },
                [
                    { id: 'timeline', label: 'Timeline', icon: TimelineIcon },
                    { id: 'board', label: 'Board', icon: BoardIcon },
                    { id: 'list', label: 'List', icon: ListIcon }
                ].map(mode => 
                    React.createElement('button', {
                        key: mode.id,
                        onClick: () => setViewMode(mode.id),
                        className: `flex items-center gap-2 px-4 py-1.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${viewMode === mode.id ? 'border-brand-purple text-white bg-white/5' : 'border-transparent text-brand-text-light hover:text-white'}`
                    }, React.createElement(mode.icon, { className: 'w-4 h-4' }), mode.label)
                )
             )
        ),
        React.createElement(FeatureToolbar, {
            title: t.dashboardScheduling,
            containerRef: fullscreenRef,
            onZoomIn: () => setZoom(z => Math.min(z + 0.2, 2)),
            onZoomOut: () => setZoom(z => Math.max(z - 0.2, 0.5)),
            onToggleEdit: () => setIsEditing(!isEditing),
            isEditing: isEditing,
            onExport: () => window.print(),
            scale: scale,
            onScaleChange: setScale,
            onExpandAll: handleExpandAll,
            onCollapseAll: handleCollapseAll
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-hidden' },
            React.createElement('div', { className: 'p-6 h-full printable-content' },
                renderContent()
            )
        )
    );
};

export default SchedulingView;
