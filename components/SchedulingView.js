
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
        React.createElement(ScheduleIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Building Schedule..."),
        React.createElement('p', { className: 'text-brand-text-light mb-8' }, "AI is calculating critical paths, dependencies, and timelines."),
        React.createElement(Spinner, { size: '12' })
    )
);

const TaskListRow = ({ task, indent, isExpanded, onToggle, isEditing, onUpdate }) => {
    const isProject = task.type === 'project';
    
    return React.createElement('div', { 
        className: `flex items-center h-10 border-b border-dark-border hover:bg-white/5 transition-colors print:border-gray-200 print:h-8 ${isProject ? 'bg-dark-card-solid font-semibold print:bg-gray-100' : ''}` 
    },
        React.createElement('div', { className: 'flex-grow min-w-0 px-4 flex items-center gap-2 overflow-hidden' },
            React.createElement('div', { style: { width: indent * 20 } }), // Indentation
            isProject && React.createElement('button', { 
                onClick: () => onToggle(task.id),
                className: 'p-0.5 hover:text-white text-brand-text-light focus:outline-none print:text-black'
            }, isExpanded ? '▼' : '▶'),
            isEditing ? (
                React.createElement('input', {
                    value: task.name,
                    onChange: (e) => onUpdate(task.id, 'name', e.target.value),
                    className: "bg-dark-bg border border-dark-border rounded px-2 py-0.5 text-sm text-white w-full focus:ring-1 focus:ring-brand-purple outline-none"
                })
            ) : (
                React.createElement('span', { className: `truncate text-sm ${isProject ? 'text-white print:text-black' : 'text-brand-text-light print:text-gray-800'}` }, task.name)
            )
        ),
        React.createElement('div', { className: 'w-24 flex-shrink-0 px-2 text-xs text-right text-brand-text-light print:text-black border-l border-dark-border print:border-gray-300 h-full flex items-center justify-end' },
             isEditing ? (
                React.createElement('input', {
                    type: 'date',
                    value: task.start,
                    onChange: (e) => onUpdate(task.id, 'start', e.target.value),
                    className: "bg-transparent text-white text-right w-full outline-none"
                })
             ) : formatDate(task.start)
        ),
        React.createElement('div', { className: 'w-24 flex-shrink-0 px-2 text-xs text-right text-brand-text-light print:text-black border-l border-dark-border print:border-gray-300 h-full flex items-center justify-end' },
             isEditing ? (
                React.createElement('input', {
                    type: 'date',
                    value: task.end,
                    onChange: (e) => onUpdate(task.id, 'end', e.target.value),
                    className: "bg-transparent text-white text-right w-full outline-none"
                })
             ) : formatDate(task.end)
        ),
        React.createElement('div', { className: 'w-16 flex-shrink-0 px-2 text-xs text-right text-brand-text-light print:text-black border-l border-dark-border print:border-gray-300 h-full flex items-center justify-end' },
             isEditing ? (
                React.createElement('input', {
                    type: 'number',
                    min: 0, max: 100,
                    value: task.progress,
                    onChange: (e) => onUpdate(task.id, 'progress', parseInt(e.target.value)),
                    className: "bg-transparent text-white text-right w-full outline-none"
                })
             ) : `${task.progress}%`
        )
    );
};

const TimelineView = ({ tasks, expanded, onToggle, scale, zoom, isEditing, onUpdate }) => {
    // --- Data Preparation ---
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
        if (scale === 'days') {
            for (let i = 0; i <= dates.totalDays; i++) {
                result.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (scale === 'weeks') {
             // Align to Monday
             const day = current.getDay();
             const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
             current.setDate(diff);
             while (current <= dates.end) {
                 result.push(new Date(current));
                 current.setDate(current.getDate() + 7);
             }
        } else if (scale === 'months') {
            current.setDate(1);
            while (current <= dates.end) {
                result.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
            }
        } else if (scale === 'quarters') {
            // Align to start of quarter (Jan, Apr, Jul, Oct)
            const qMonth = Math.floor(current.getMonth() / 3) * 3;
            current.setMonth(qMonth);
            current.setDate(1);
            while (current <= dates.end) {
                result.push(new Date(current));
                current.setMonth(current.getMonth() + 3);
            }
        }
        return result;
    }, [dates, scale]);

    // Flatten Hierarchy for Display
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

    const totalWidth = periods.length * colWidth;

    return React.createElement('div', { className: 'flex h-full bg-dark-bg border border-dark-border rounded-xl overflow-hidden print:border-none print:bg-white' },
        // Left Panel: Task List
        React.createElement('div', { className: 'w-80 flex-shrink-0 flex flex-col border-r border-dark-border bg-dark-card print:border-gray-300 print:bg-white' },
            React.createElement('div', { className: 'h-12 bg-dark-card-solid border-b border-dark-border flex items-center px-4 text-sm font-bold text-brand-text-light print:bg-gray-100 print:text-black print:border-gray-300' }, "Task Name"),
            React.createElement('div', { className: 'flex-grow overflow-y-hidden hover:overflow-y-auto' },
                visibleTasks.map(task => 
                    React.createElement(TaskListRow, { 
                        key: task.id, 
                        task, 
                        indent: task.level, 
                        isExpanded: expanded.has(task.id), 
                        onToggle: onToggle,
                        isEditing,
                        onUpdate
                    })
                )
            )
        ),
        
        // Right Panel: Timeline
        React.createElement('div', { className: 'flex-grow flex flex-col overflow-x-auto relative' },
            // Header Dates
            React.createElement('div', { className: 'h-12 bg-dark-card-solid border-b border-dark-border flex relative print:bg-gray-100 print:border-gray-300', style: { width: totalWidth } },
                periods.map((p, i) => 
                    React.createElement('div', { 
                        key: i, 
                        className: 'flex-shrink-0 border-r border-dark-border px-2 py-3 text-xs text-brand-text-light print:text-black print:border-gray-300 font-medium truncate',
                        style: { width: colWidth }
                    }, 
                        scale === 'days' ? p.getDate() : 
                        scale === 'quarters' ? `Q${Math.floor(p.getMonth() / 3) + 1} ${p.getFullYear()}` :
                        p.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    )
                )
            ),
            
            // Grid & Bars Container
            React.createElement('div', { className: 'relative flex-grow min-h-0 overflow-y-auto', style: { width: totalWidth } },
                // 1. Full Height Grid Lines Layer
                React.createElement('div', { className: 'absolute inset-0 pointer-events-none flex', style: { height: `${Math.max(100, visibleTasks.length * 40)}px`, minHeight: '100%' } }, 
                    periods.map((p, i) => 
                        React.createElement('div', { 
                            key: i, 
                            className: 'flex-shrink-0 border-r border-dark-border/30 print:border-gray-200 h-full',
                            style: { width: colWidth }
                        })
                    )
                ),

                // 2. Task Rows Layer
                visibleTasks.map((task, index) => {
                    const left = getLeftPos(task.start);
                    const width = getWidth(task.start, task.end);
                    const isProject = task.type === 'project';
                    const barColor = isProject ? 'bg-brand-purple' : (task.progress === 100 ? 'bg-green-500' : 'bg-sky-500');
                    
                    return React.createElement('div', { key: task.id, className: 'relative h-10 w-full hover:bg-white/5 transition-colors print:h-8' },
                        React.createElement('div', {
                            className: `absolute top-2 h-6 rounded-md shadow-sm flex items-center px-2 text-[10px] text-white whitespace-nowrap overflow-hidden print:h-5 print:text-xs ${barColor} print:print-color-exact`,
                            style: { left: left, width: width }
                        }, 
                            width > 40 && `${task.progress}%`
                        )
                    );
                })
            )
        )
    );
};

const BoardView = ({ tasks, onUpdate }) => {
    const columns = [
        { id: 'todo', label: 'To Do', statusCheck: t => t.progress === 0 },
        { id: 'in-progress', label: 'In Progress', statusCheck: t => t.progress > 0 && t.progress < 100 },
        { id: 'done', label: 'Done', statusCheck: t => t.progress === 100 },
    ];

    return React.createElement('div', { className: 'flex gap-4 h-full overflow-x-auto p-2' },
        columns.map(col => {
            const colTasks = tasks.filter(t => t.type !== 'project' && col.statusCheck(t));
            return React.createElement('div', { key: col.id, className: 'flex-shrink-0 w-80 bg-dark-card-solid rounded-xl border border-dark-border flex flex-col' },
                React.createElement('div', { className: 'p-4 font-bold text-white border-b border-dark-border flex justify-between' },
                    col.label,
                    React.createElement('span', { className: 'bg-dark-bg px-2 py-0.5 rounded text-xs text-brand-text-light' }, colTasks.length)
                ),
                React.createElement('div', { className: 'flex-grow overflow-y-auto p-3 space-y-3' },
                    colTasks.map(task => 
                        React.createElement('div', { key: task.id, className: 'bg-dark-card p-3 rounded-lg border border-dark-border shadow-sm hover:border-brand-purple/50 transition-colors' },
                            React.createElement('p', { className: 'font-semibold text-white text-sm' }, task.name),
                            React.createElement('div', { className: 'flex justify-between mt-2 text-xs text-brand-text-light' },
                                React.createElement('span', null, formatDate(task.end)),
                                React.createElement('span', { className: task.progress === 100 ? 'text-green-400' : 'text-sky-400' }, `${task.progress}%`)
                            )
                        )
                    )
                )
            );
        })
    );
};

const EditableListView = ({ tasks, onUpdate }) => (
    React.createElement('div', { className: 'h-full overflow-auto bg-dark-card rounded-xl border border-dark-border print:bg-white print:border-gray-300' },
        React.createElement('table', { className: 'w-full text-left text-sm' },
            React.createElement('thead', { className: 'bg-dark-card-solid text-brand-text-light sticky top-0 z-10 print:bg-gray-100 print:text-black' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Task Name"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Start Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "End Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Progress"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Dependencies")
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
                             React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('input', {
                                    type: 'range', min: 0, max: 100,
                                    value: task.progress,
                                    onChange: (e) => onUpdate(task.id, 'progress', parseInt(e.target.value)),
                                    className: "w-24 h-1.5 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                }),
                                React.createElement('span', { className: 'w-8 text-right' }, `${task.progress}%`)
                             )
                        ),
                        React.createElement('td', { className: 'p-4 text-brand-text-light print:text-gray-600' }, task.dependencies?.join(', ') || '-')
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
                return React.createElement(EditableListView, { tasks: projectData.schedule, onUpdate: handleUpdateTask });
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
