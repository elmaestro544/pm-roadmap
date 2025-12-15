
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateScheduleFromPlan, applyCorrectiveAction, recalculateScheduleHierarchy } from '../services/schedulingService.js';
import { ScheduleIcon, Spinner, BoardIcon, ListIcon, TimelineIcon, ZoomInIcon, ZoomOutIcon, FullscreenIcon, FullscreenExitIcon, ExpandIcon, CollapseIcon, EditIcon, ExportIcon, RefreshIcon, StructureIcon, ChevronRightIcon, RiskIcon, MatrixIcon } from './Shared.js';
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

const ACTIVITY_COLORS = [
    '#2DD4BF', // Turquoise (Brand)
    '#F472B6', // Pink
    '#818CF8', // Indigo
    '#FB923C', // Orange
    '#34D399', // Emerald
    '#60A5FA', // Blue
    '#FBBF24', // Amber
    '#A78BFA'  // Purple
];

// --- Sub-Components ---

const LoadingView = () => (
    React.createElement('div', { className: 'text-center flex flex-col items-center h-full justify-center' },
        React.createElement(ScheduleIcon, { className: 'h-16 w-16 animate-pulse text-brand-purple-light' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Building Schedule..."),
        React.createElement('p', { className: 'text-brand-text-light mb-8' }, "Calculating critical path, assigning RBS (Labor, Material, Equipment), and balancing budget."),
        React.createElement(Spinner, { size: '12' })
    )
);

// --- Timeline View with Synchronized Scroll ---
const TimelineView = ({ tasks, expanded, onToggle, scale, zoom, isEditing, onUpdate, sortMode, showCriticalPath }) => {
    const [showDetails, setShowDetails] = useState(false);

    // 1. Data Preparation
    const dates = useMemo(() => {
        if (!tasks.length) return { start: new Date(), end: new Date(), totalDays: 0 };
        const startDates = tasks.map(t => new Date(t.start));
        const endDates = tasks.map(t => new Date(t.end));
        const minDate = new Date(Math.min(...startDates));
        const maxDate = new Date(Math.max(...endDates));
        // Buffer
        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 10);
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

    // Top Header Grouping (Month/Year)
    const headerGroups = useMemo(() => {
        const groups = [];
        if (!periods.length) return [];

        let currentGroup = null;

        periods.forEach((p) => {
            let label = '';
            if (scale === 'days' || scale === 'weeks') {
                label = p.toLocaleString('default', { month: 'long', year: 'numeric' });
            } else {
                label = p.getFullYear().toString();
            }

            if (!currentGroup || currentGroup.label !== label) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = { label, width: colWidth, count: 1 };
            } else {
                currentGroup.width += colWidth;
                currentGroup.count += 1;
            }
        });
        if (currentGroup) groups.push(currentGroup);
        return groups;
    }, [periods, scale, colWidth]);


    // Sorting Logic
    const visibleTasks = useMemo(() => {
        let result = [];
        let sorted = [...tasks];

        if (sortMode === 'date') {
            // Flatten: Filter only tasks/milestones (no groups) and sort by date
            sorted = tasks.filter(t => t.type !== 'project' && t.id !== 'ROOT-SUMMARY')
                          .sort((a, b) => new Date(a.start) - new Date(b.start));
        } else if (sortMode === 'resource') {
            // Flatten: Sort by Resource Name
            sorted = tasks.filter(t => t.type !== 'project' && t.id !== 'ROOT-SUMMARY')
                          .sort((a, b) => (a.resource || '').localeCompare(b.resource || ''));
        } 
        
        // Critical Path Filtering
        if (showCriticalPath) {
            // Include critical tasks AND their parents to maintain hierarchy context if in WBS mode
            const criticalIds = new Set(tasks.filter(t => t.isCritical).map(t => t.id));
            if (sortMode === 'wbs') {
                sorted = tasks.filter(t => {
                    if (t.isCritical) return true;
                    // If it's a project/group, show it only if it has critical children (simplified: show all projects if expanded, or just filter strictly)
                    // For simplicity in filter mode: Show only items marked critical or Top Level
                    return t.id === 'ROOT-SUMMARY';
                });
            } else {
                sorted = sorted.filter(t => t.isCritical);
            }
        }

        let colorIndex = 0;
        
        sorted.forEach(task => {
            const taskWithColor = { ...task };
            
            // Indentation logic overrides
            if (sortMode !== 'wbs') {
                taskWithColor.level = 0; // Remove indentation in non-WBS views
            }

            if (task.type === 'project') {
                taskWithColor.color = '#1E1B2E'; 
            } else if (task.type === 'task') {
                // Visibility Check (Only relevant for WBS mode)
                let visible = true;
                if (sortMode === 'wbs') {
                    if (task.project && !expanded.has(task.project) && task.project !== 'ROOT-SUMMARY') {
                        visible = false;
                    }
                }
                
                if (visible) {
                    if (task.isCritical) {
                        taskWithColor.color = '#EF4444'; // Red for Critical
                    } else {
                        taskWithColor.color = ACTIVITY_COLORS[colorIndex % ACTIVITY_COLORS.length];
                        colorIndex++;
                    }
                } else {
                    return; // Skip hidden task
                }
            } else {
                taskWithColor.color = '#FFFFFF';
            }
            result.push(taskWithColor);
        });
        return result;
    }, [tasks, expanded, sortMode, showCriticalPath]);

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

    const rowHeight = 44; 
    
    // Column Definitions
    const detailedColumns = [
        { id: 'start', label: 'Start', width: 90, render: t => formatDate(t.start) },
        { id: 'end', label: 'End', width: 90, render: t => formatDate(t.end) },
        { id: 'resource', label: 'RBS / Resource', width: 140, render: t => t.resource || '-' },
        { id: 'cost', label: 'Cost', width: 80, render: t => t.cost ? t.cost.toLocaleString() : '-' },
        { id: 'progress', label: '%', width: 50, render: t => t.progress + '%' },
        { id: 'dependencies', label: 'Pred.', width: 70, render: t => t.dependencies?.join(',') || '' }
    ];

    const nameColumnWidth = 300;
    const totalDetailsWidth = detailedColumns.reduce((acc, col) => acc + col.width, 0);
    const taskListWidth = showDetails ? nameColumnWidth + totalDetailsWidth : nameColumnWidth;

    // Dependency Lines (Only show in WBS mode to avoid chaos)
    const dependencyLines = useMemo(() => {
        if (sortMode !== 'wbs') return [];
        
        const lines = [];
        const taskYMap = new Map();
        visibleTasks.forEach((t, i) => taskYMap.set(t.id, i * rowHeight + (rowHeight / 2)));

        visibleTasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                const endX = getLeftPos(task.start) + 2; 
                const endY = taskYMap.get(task.id);

                // For each predecessor
                task.dependencies.forEach(depId => {
                    const predTask = tasks.find(t => t.id === depId);
                    if (predTask && taskYMap.has(task.id) && taskYMap.has(depId)) {
                        const startY = taskYMap.get(depId);
                        const startX = getLeftPos(predTask.start) + getWidth(predTask.start, predTask.end);
                        
                        // Orthogonal Path Logic
                        const x1 = startX;
                        const y1 = startY;
                        const x2 = endX;
                        const y2 = endY;
                        
                        const midX = x1 + 10;
                        
                        // Highlight line if part of critical path
                        const isCrit = task.isCritical && predTask.isCritical;
                        const strokeColor = isCrit ? '#EF4444' : '#94A3B8';
                        const strokeWidth = isCrit ? '2' : '1.5';

                        let d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                        
                        if (midX > x2) {
                             const fallbackMidY = y1 + (y2 > y1 ? 10 : -10);
                             d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${fallbackMidY} L ${x2 - 10} ${fallbackMidY} L ${x2 - 10} ${y2} L ${x2} ${y2}`;
                        }

                        lines.push({ 
                            id: `${depId}-${task.id}`,
                            d: d,
                            color: strokeColor,
                            width: strokeWidth
                        });
                    }
                });
            }
        });
        return lines;
    }, [visibleTasks, tasks, dates, scale, zoom, sortMode]);

    return React.createElement('div', { className: 'h-full w-full overflow-auto bg-dark-bg relative border border-dark-border rounded-xl scrollbar-thin' },
        React.createElement('div', { className: 'min-w-fit flex flex-col relative' },
            
            // --- Sticky Header Section ---
            React.createElement('div', { className: 'sticky top-0 z-30 bg-dark-card-solid border-b border-dark-border shadow-md' },
                // Row 1: Month/Year Grouping
                React.createElement('div', { className: 'flex h-9 border-b border-dark-border/50' },
                     React.createElement('div', { 
                        className: 'sticky left-0 z-40 bg-dark-card-solid border-r border-dark-border flex-shrink-0',
                        style: { width: taskListWidth }
                    }), 
                    headerGroups.map((group, i) => 
                        React.createElement('div', {
                            key: i,
                            className: 'flex-shrink-0 flex items-center justify-start px-2 text-xs font-bold text-brand-text border-r border-dark-border/30 bg-dark-card-solid/50',
                            style: { width: group.width }
                        }, group.label)
                    )
                ),
                
                // Row 2: Days/Weeks scale
                React.createElement('div', { className: 'flex h-9' },
                    React.createElement('div', { 
                        className: 'sticky left-0 z-40 bg-dark-card-solid border-r border-dark-border flex flex-shrink-0',
                        style: { width: taskListWidth }
                    },
                        // Name Column Header
                        React.createElement('div', { 
                            className: 'flex items-center justify-between px-4 font-bold text-white text-sm border-r border-dark-border/30',
                            style: { width: nameColumnWidth }
                        }, 
                            "Task Name",
                            React.createElement('button', {
                                onClick: () => setShowDetails(!showDetails),
                                title: showDetails ? "Collapse Columns" : "Expand Details",
                                className: "p-1 rounded hover:bg-white/10 text-brand-purple-light transition-colors"
                            }, 
                                showDetails 
                                    ? React.createElement(ChevronRightIcon, { className: "w-4 h-4 transform rotate-180" }) 
                                    : React.createElement(ChevronRightIcon, { className: "w-4 h-4" })
                            )
                        ),
                        // Detailed Column Headers
                        showDetails && detailedColumns.map(col => 
                            React.createElement('div', {
                                key: col.id,
                                className: 'flex items-center px-2 text-xs font-semibold text-brand-text-light border-r border-dark-border/30 bg-dark-card-solid',
                                style: { width: col.width }
                            }, col.label)
                        )
                    ),
                    
                    periods.map((p, i) => 
                        React.createElement('div', { 
                            key: i, 
                            className: 'flex-shrink-0 border-r border-dark-border/30 px-1 py-2 text-[10px] text-brand-text-light font-medium flex items-center justify-center bg-dark-card/30',
                            style: { width: colWidth }
                        }, 
                            scale === 'days' ? p.getDate() : 
                            scale === 'quarters' ? `Q${Math.floor(p.getMonth() / 3) + 1}` :
                            scale === 'months' ? p.toLocaleString('default', { month: 'short' }) :
                            `W${Math.ceil(p.getDate()/7)}`
                        )
                    )
                )
            ),

            // --- Body Grid ---
            React.createElement('div', { 
                className: 'absolute top-[72px] bottom-0 flex pointer-events-none z-0',
                style: { left: taskListWidth } 
            },
                periods.map((p, i) => 
                    React.createElement('div', { 
                        key: i, 
                        className: `flex-shrink-0 border-r border-dark-border/10 h-full ${p.getDay() === 0 || p.getDay() === 6 ? 'bg-white/5' : ''}`, 
                        style: { width: colWidth }
                    })
                )
            ),

            React.createElement('svg', { 
                className: 'absolute top-[72px] pointer-events-none z-10 w-full h-full',
                style: { left: taskListWidth }
            },
                dependencyLines.map(line => 
                    React.createElement('path', {
                        key: line.id,
                        d: line.d,
                        fill: "none",
                        stroke: line.color, 
                        strokeWidth: line.width,
                        markerEnd: `url(#arrowhead-${line.color.replace('#','')})`
                    })
                ),
                React.createElement('defs', null,
                    React.createElement('marker', { id: "arrowhead-94A3B8", markerWidth: "6", markerHeight: "6", refX: "5", refY: "3", orient: "auto" },
                        React.createElement('path', { d: "M0,0 L0,6 L6,3 z", fill: "#94A3B8" })
                    ),
                    React.createElement('marker', { id: "arrowhead-EF4444", markerWidth: "6", markerHeight: "6", refX: "5", refY: "3", orient: "auto" },
                        React.createElement('path', { d: "M0,0 L0,6 L6,3 z", fill: "#EF4444" })
                    )
                )
            ),

            visibleTasks.map(task => {
                const isProject = task.type === 'project';
                const isSummary = task.id === 'ROOT-SUMMARY';
                const left = getLeftPos(task.start);
                const width = getWidth(task.start, task.end);
                const level = task.level || 0;
                
                return React.createElement('div', { key: task.id, className: `flex hover:bg-white/5 transition-colors relative group ${isSummary ? 'bg-dark-card-solid border-b border-dark-border' : ''}`, style: { height: rowHeight } },
                    
                    React.createElement('div', { 
                        className: `sticky left-0 z-20 flex-shrink-0 border-r border-dark-border flex items-center overflow-hidden shadow-[4px_0_10px_rgba(0,0,0,0.3)] ${isProject || isSummary ? 'bg-dark-card-solid' : 'bg-dark-card'}`,
                        style: { width: taskListWidth }
                    },
                        // Name Cell
                        React.createElement('div', { 
                            className: 'flex items-center px-4 gap-2 h-full border-r border-dark-border/30',
                            style: { width: nameColumnWidth }
                        },
                            React.createElement('div', { style: { width: level * 16 } }), // Indentation based on robust hierarchy
                            // Toggle Button only for Projects in WBS mode
                            (isProject && sortMode === 'wbs') && React.createElement('button', { 
                                onClick: () => onToggle(task.id),
                                className: 'p-0.5 hover:text-white text-brand-purple-light focus:outline-none'
                            }, expanded.has(task.id) ? '▼' : '▶'),
                            React.createElement('span', { 
                                title: task.name,
                                className: `truncate text-sm ${isSummary ? 'font-extrabold text-brand-purple-light uppercase' : isProject ? 'font-bold text-white' : 'font-medium text-brand-text-light'}` 
                            }, task.name)
                        ),
                        // Detail Cells
                        showDetails && detailedColumns.map(col => 
                            React.createElement('div', {
                                key: col.id,
                                className: `flex items-center px-2 text-xs truncate h-full border-r border-dark-border/30 ${isProject ? 'text-white font-semibold' : 'text-brand-text-light'}`,
                                style: { width: col.width }
                            }, col.render(task))
                        )
                    ),

                    React.createElement('div', { className: 'relative flex-grow z-20 py-2' }, 
                        React.createElement('div', {
                            className: `absolute top-1/2 -translate-y-1/2 h-6 rounded shadow-md text-[10px] text-white whitespace-nowrap overflow-visible flex items-center cursor-pointer transition-all hover:brightness-110 ${task.isCritical && !isProject ? 'ring-2 ring-red-500/50' : ''}`,
                            style: { 
                                left: left, 
                                width: width,
                                backgroundColor: isSummary ? '#A855F7' : task.color, 
                                opacity: isProject ? 1 : 0.9,
                                height: isProject ? '12px' : '24px' // Thinner bars for summary/project
                            }
                        },
                            !isProject && !isSummary && React.createElement('span', { 
                                className: 'absolute left-full ml-2 text-xs text-brand-text-light font-medium truncate pointer-events-none' 
                            }, task.resource),

                            React.createElement('span', { className: `relative z-10 px-2 drop-shadow-md font-semibold ${width < 30 ? 'hidden' : ''}` },
                                `${task.progress}%`
                            )
                        ),
                        task.type === 'milestone' && React.createElement('div', {
                            className: 'absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-cyan rotate-45 border-2 border-dark-bg',
                            style: { left: left - 12 }
                        })
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
                        React.createElement('div', { key: task.id, className: `bg-dark-card p-4 rounded-lg border shadow-sm hover:border-brand-purple/50 transition-colors group cursor-pointer ${task.isCritical ? 'border-red-500/50' : 'border-dark-border'}` },
                            React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                React.createElement('p', { className: 'font-semibold text-white text-sm group-hover:text-brand-purple-light transition-colors' }, task.name),
                                task.isCritical && React.createElement('span', { className: 'bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold' }, "CRIT")
                            ),
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

const EditableListView = ({ tasks, onUpdate, currency, groupBy, showCriticalPath }) => {
    // Process data based on grouping
    const displayData = useMemo(() => {
        let filteredTasks = tasks;
        if (showCriticalPath) {
            filteredTasks = tasks.filter(t => t.isCritical || t.id === 'ROOT-SUMMARY');
        }

        if (groupBy === 'wbs') {
            // Tasks already sorted hierarchically by service, preserving that order.
            // Just map to include 'isHeader' false for all, indentation handled by renderer
            return filteredTasks.map(t => ({ ...t, isHeader: false, depth: t.level || 0 }));
        } else {
            // Group by Field (Resource, Status)
            const groups = {};
            const result = [];
            
            filteredTasks.forEach(task => {
                if (task.type === 'project' && task.id === 'ROOT-SUMMARY') return; // Skip root summary in categorical grouping
                
                let key = 'Unassigned';
                if (groupBy === 'resource') key = task.resource || 'Unassigned';
                else if (groupBy === 'status') {
                    if (task.progress === 100) key = 'Completed';
                    else if (task.progress > 0) key = 'In Progress';
                    else key = 'Not Started';
                }

                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
            });

            Object.keys(groups).sort().forEach(key => {
                // Add Header Row
                result.push({ 
                    id: `header-${key}`, 
                    name: key, 
                    isHeader: true, 
                    count: groups[key].length,
                    // Pseudo fields to prevent render errors
                    start: '', end: '', resource: '', cost: 0, progress: 0, dependencies: []
                });
                // Add Items
                groups[key].forEach(t => result.push({ ...t, isHeader: false, depth: 1 }));
            });
            
            return result;
        }
    }, [tasks, groupBy, showCriticalPath]);

    return React.createElement('div', { className: 'h-full overflow-auto bg-dark-card rounded-xl border border-dark-border print:bg-white print:border-gray-300' },
        React.createElement('table', { className: 'w-full text-left text-sm' },
            React.createElement('thead', { className: 'bg-dark-card-solid text-brand-text-light sticky top-0 z-10 print:bg-gray-100 print:text-black' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Task Name"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Start Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "End Date"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Resource (RBS)"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, `Cost (${currency})`),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Progress"),
                    React.createElement('th', { className: 'p-4 font-semibold' }, "Predecessors")
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-dark-border print:divide-gray-200' },
                displayData.map(task => 
                    task.isHeader ? (
                        React.createElement('tr', { key: task.id, className: 'bg-dark-card-solid/80' },
                            React.createElement('td', { colSpan: 7, className: 'p-3 font-bold text-white pl-4' }, 
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-brand-purple-light' }, '▸'),
                                    task.name,
                                    React.createElement('span', { className: 'text-xs bg-dark-bg px-2 py-0.5 rounded text-brand-text-light' }, `${task.count} items`)
                                )
                            )
                        )
                    ) : (
                        React.createElement('tr', { key: task.id, className: `hover:bg-white/5 print:text-black ${task.isCritical ? 'bg-red-500/5' : ''}` },
                            React.createElement('td', { className: 'p-4' },
                                React.createElement('div', { style: { paddingLeft: groupBy === 'wbs' ? `${task.depth * 20}px` : '20px' } },
                                    React.createElement('input', {
                                        value: task.name,
                                        onChange: (e) => onUpdate(task.id, 'name', e.target.value),
                                        className: `bg-transparent w-full outline-none print:text-black focus:border-b focus:border-brand-purple ${task.type === 'project' ? 'font-bold text-white' : task.isCritical ? 'text-red-400 font-medium' : 'text-slate-200'}`
                                    })
                                )
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('input', {
                                    type: 'date',
                                    value: task.start,
                                    onChange: (e) => onUpdate(task.id, 'start', e.target.value),
                                    className: "bg-transparent w-full outline-none text-slate-200 print:text-black"
                                })
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('input', {
                                    type: 'date',
                                    value: task.end,
                                    onChange: (e) => onUpdate(task.id, 'end', e.target.value),
                                    className: "bg-transparent w-full outline-none text-slate-200 print:text-black"
                                })
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('input', {
                                    value: task.resource || '',
                                    onChange: (e) => onUpdate(task.id, 'resource', e.target.value),
                                    placeholder: "Unassigned",
                                    className: "bg-transparent w-full outline-none text-slate-200 print:text-black"
                                })
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('input', {
                                    type: "number",
                                    value: task.cost || 0,
                                    onChange: (e) => onUpdate(task.id, 'cost', parseFloat(e.target.value)),
                                    // Disable cost editing for WBS/Summary items as they are calculated rollups
                                    disabled: task.type === 'project' || task.id === 'ROOT-SUMMARY',
                                    className: `bg-transparent w-24 outline-none print:text-black ${task.type === 'project' ? 'opacity-50 cursor-not-allowed font-semibold text-white' : 'text-slate-200'}`
                                })
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('input', {
                                        type: 'range', min: 0, max: 100,
                                        value: task.progress,
                                        onChange: (e) => onUpdate(task.id, 'progress', parseInt(e.target.value)),
                                        // Disable progress editing for WBS/Summary items
                                        disabled: task.type === 'project' || task.id === 'ROOT-SUMMARY',
                                        className: `w-16 h-1.5 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-brand-purple ${task.type === 'project' ? 'opacity-50 cursor-not-allowed' : ''}`
                                    }),
                                    React.createElement('span', { className: 'w-8 text-right text-slate-200' }, `${task.progress}%`)
                                 )
                            ),
                            React.createElement('td', { className: 'p-4' },
                                 React.createElement('input', {
                                    value: task.dependencies?.join(', ') || '',
                                    onChange: (e) => onUpdate(task.id, 'dependencies', e.target.value.split(',').map(s=>s.trim())),
                                    placeholder: "-",
                                    className: "bg-transparent w-full outline-none text-slate-200 print:text-black"
                                })
                            )
                        )
                    )
                )
            )
        )
    );
};

const ScheduleMatrixView = ({ tasks }) => {
    // Determine Project Start Date for relative calculation if needed, 
    // but tasks already have absolute dates. We just use them directly.
    // However, CPM (ES/EF/LS/LF) are usually relative integers in schedulingService.
    // We need to convert them to dates relative to project start.
    
    const projectStartDate = useMemo(() => {
        if (!tasks.length) return new Date();
        const startDates = tasks.map(t => new Date(t.start).getTime()).filter(d => !isNaN(d));
        return new Date(Math.min(...startDates));
    }, [tasks]);

    const toDate = (relativeDays) => {
        // If relativeDays is undefined/null, return '-'
        if (relativeDays === undefined || relativeDays === null) return '-';
        return formatDate(addDays(projectStartDate, relativeDays));
    };

    const flatTasks = tasks.filter(t => t.id !== 'ROOT-SUMMARY'); // Exclude root summary for cleaner matrix

    return React.createElement('div', { className: 'h-full overflow-auto bg-dark-card rounded-xl border border-dark-border print:bg-white print:border-gray-300' },
        React.createElement('table', { className: 'w-full text-left text-xs' },
            React.createElement('thead', { className: 'bg-dark-card-solid text-brand-text-light sticky top-0 z-10 print:bg-gray-100 print:text-black' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border w-16' }, "ID"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border' }, "Task Name"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border text-center' }, "Dur."),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border' }, "Early Start"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border' }, "Early Finish"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border' }, "Late Start"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border' }, "Late Finish"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border text-center' }, "Float"),
                    React.createElement('th', { className: 'p-3 font-semibold border-b border-dark-border text-center' }, "Critical")
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-dark-border print:divide-gray-200' },
                flatTasks.map(task => {
                    const cpm = task.cpm || {};
                    return React.createElement('tr', { key: task.id, className: `hover:bg-white/5 print:text-black ${task.isCritical ? 'bg-red-500/10' : ''}` },
                        React.createElement('td', { className: 'p-3 text-brand-text-light font-mono' }, task.id),
                        React.createElement('td', { className: `p-3 ${task.type === 'project' ? 'font-bold text-white' : 'text-slate-200'}` }, task.name),
                        React.createElement('td', { className: 'p-3 text-center text-slate-300' }, cpm.duration ?? '-'),
                        React.createElement('td', { className: 'p-3 text-brand-text-light' }, toDate(cpm.es)),
                        React.createElement('td', { className: 'p-3 text-brand-text-light' }, toDate(cpm.ef)),
                        React.createElement('td', { className: 'p-3 text-brand-text-light' }, toDate(cpm.ls)),
                        React.createElement('td', { className: 'p-3 text-brand-text-light' }, toDate(cpm.lf)),
                        React.createElement('td', { className: `p-3 text-center font-bold ${cpm.float === 0 ? 'text-red-400' : 'text-green-400'}` }, cpm.float ?? '-'),
                        React.createElement('td', { className: 'p-3 text-center' }, 
                            task.isCritical 
                                ? React.createElement('span', { className: 'px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase' }, "Yes") 
                                : React.createElement('span', { className: 'text-slate-500 text-[10px]' }, "No")
                        )
                    );
                })
            )
        )
    );
};

const SchedulingView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    
    const [viewMode, setViewMode] = useState('timeline');
    const [groupBy, setGroupBy] = useState('wbs'); // Used for List View
    const [sortMode, setSortMode] = useState('wbs'); // New for Timeline View (wbs, date, resource)
    const [scale, setScale] = useState('days');
    const [zoom, setZoom] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(new Set());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCriticalPath, setShowCriticalPath] = useState(false);
    const [isOptimizeOpen, setIsOptimizeOpen] = useState(false); // Changed to controlled state

    const generate = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const schedule = await generateScheduleFromPlan(projectData.plan, projectData.criteria);
            onUpdateProject({ schedule });
            // Expand Root and Top Level Phases by default
            const expandedIds = schedule.filter(t => t.type === 'project' || t.level < 2).map(t => t.id);
            setExpanded(new Set(expandedIds));
        } catch (err) {
            setError(err.message || "Failed to generate schedule.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectData.plan && !projectData.schedule && !isLoading) {
            generate();
        } else if (projectData.schedule && expanded.size === 0) {
             const expandedIds = projectData.schedule.filter(t => t.type === 'project' || (t.level && t.level < 2)).map(t => t.id);
             setExpanded(new Set(expandedIds));
        }
    }, [projectData.plan, projectData.schedule, projectData.criteria, isLoading]);

    const handleUpdateTask = (id, field, value) => {
        const currentSchedule = projectData.schedule || [];
        // 1. Update the specific task in the array
        const updatedTaskArray = currentSchedule.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        );
        
        // 2. Recalculate Rollups (Bottom-Up) for Cost and Progress
        // This ensures WBS parent items reflect the changes immediately
        const recalculatedSchedule = recalculateScheduleHierarchy(updatedTaskArray);

        onUpdateProject({ schedule: recalculatedSchedule });
    };

    const handleOptimize = (action) => {
        if (!projectData.schedule) return;
        const optimizedSchedule = applyCorrectiveAction(projectData.schedule, action);
        onUpdateProject({ schedule: optimizedSchedule });
        setIsOptimizeOpen(false); // Close dropdown
        setShowCriticalPath(true); // Show critical path so user sees changes
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpanded(newExpanded);
    };

    const handleCollapseAll = () => {
        // Keep Root expanded, collapse others
        const root = projectData.schedule.find(t => t.id === 'ROOT-SUMMARY');
        setExpanded(new Set(root ? [root.id] : []));
    };

    const handleExpandAll = () => {
        const allIds = projectData.schedule.filter(t => t.type === 'project').map(t => t.id);
        setExpanded(new Set(allIds));
    };
    
    const handleFullscreen = () => {
        if (!fullscreenRef.current) return;
        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (!projectData.schedule) return React.createElement(LoadingView, null);

        switch (viewMode) {
            case 'list':
                return React.createElement(EditableListView, { 
                    tasks: projectData.schedule, 
                    onUpdate: handleUpdateTask,
                    currency: projectData.criteria?.currency || 'USD',
                    groupBy,
                    showCriticalPath
                });
            case 'board':
                return React.createElement(BoardView, { tasks: projectData.schedule });
            case 'matrix':
                return React.createElement(ScheduleMatrixView, { tasks: projectData.schedule });
            default:
                return React.createElement(TimelineView, { 
                    tasks: projectData.schedule, 
                    expanded, 
                    onToggle: toggleExpand, 
                    scale, 
                    zoom,
                    isEditing,
                    onUpdate: handleUpdateTask,
                    sortMode: sortMode,
                    showCriticalPath
                });
        }
    };
    
    const IconButton = ({ icon, onClick, tooltip, active, className='' }) => (
        React.createElement('button', {
            onClick, title: tooltip,
            className: `p-2 flex-shrink-0 rounded-md transition-colors ${active ? 'bg-brand-purple text-white' : 'text-brand-text-light hover:bg-white/10 hover:text-white'} ${className}`
        }, icon)
    );

    const customControls = (
        React.createElement('div', { className: 'flex items-center gap-2 flex-shrink-0' },
            React.createElement('button', {
                onClick: generate,
                className: 'p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white transition-colors flex-shrink-0',
                title: "Regenerate Schedule"
            }, React.createElement(RefreshIcon, { className: "h-5 w-5" })),
            
            // View Mode Switcher
            React.createElement('div', { className: 'flex bg-dark-card-solid rounded-lg p-1 border border-dark-border flex-shrink-0' },
                [
                    { id: 'timeline', label: 'Timeline', icon: TimelineIcon },
                    { id: 'board', label: 'Board', icon: BoardIcon },
                    { id: 'list', label: 'List', icon: ListIcon },
                    { id: 'matrix', label: 'Matrix', icon: MatrixIcon }
                ].map(mode => 
                    React.createElement('button', {
                        key: mode.id,
                        onClick: () => setViewMode(mode.id),
                        className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === mode.id ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text-light hover:text-white hover:bg-white/5'}`
                    }, React.createElement(mode.icon, { className: 'w-3 h-3' }), mode.label)
                )
            ),

            // Timeline Sorting (Only visible in Timeline)
            viewMode === 'timeline' && React.createElement('div', { className: 'flex items-center gap-2 ml-2 bg-dark-card-solid border border-dark-border rounded-lg px-2 py-1 flex-shrink-0' },
                React.createElement('span', { className: 'text-xs text-brand-text-light' }, "Sort By:"),
                React.createElement('select', {
                    value: sortMode,
                    onChange: (e) => setSortMode(e.target.value),
                    className: 'bg-transparent text-xs text-white outline-none font-semibold cursor-pointer w-24'
                },
                    React.createElement('option', { value: 'wbs' }, "Default (WBS)"),
                    React.createElement('option', { value: 'date' }, "Start Date"),
                    React.createElement('option', { value: 'resource' }, "Resource")
                )
            ),

            // Group By Control (Only Visible in List Mode)
            viewMode === 'list' && React.createElement('div', { className: 'flex items-center gap-2 ml-2 bg-dark-card-solid border border-dark-border rounded-lg px-2 py-1 flex-shrink-0' },
                React.createElement('span', { className: 'text-xs text-brand-text-light' }, "Group By:"),
                React.createElement('select', {
                    value: groupBy,
                    onChange: (e) => setGroupBy(e.target.value),
                    className: 'bg-transparent text-xs text-white outline-none font-semibold cursor-pointer'
                },
                    React.createElement('option', { value: 'wbs' }, "WBS Structure"),
                    React.createElement('option', { value: 'resource' }, "Resource"),
                    React.createElement('option', { value: 'status' }, "Status")
                )
            )
        )
    );

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        // --- Custom Header Implementation ---
        React.createElement('div', { className: 'non-printable flex-shrink-0 border-b border-dark-border bg-dark-card/50 px-4 h-16 flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide' },
             // Left: Title
             React.createElement('h2', { className: 'text-lg font-bold text-white mr-4 flex-shrink-0' }, t.dashboardScheduling),
             
             // Center: Custom Controls (Modes & Refresh)
             customControls,
             
             // Right: Tools
             React.createElement('div', { className: 'flex items-center gap-2 flex-shrink-0' },
                
                // Critical Path Toggle
                React.createElement('button', {
                    onClick: () => setShowCriticalPath(!showCriticalPath),
                    className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors flex-shrink-0 ${showCriticalPath ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-dark-card border-dark-border text-brand-text-light hover:bg-white/5'}`
                }, 
                    React.createElement(StructureIcon, { className: "w-3 h-3" }),
                    "Critical Path"
                ),

                // Corrective Actions Dropdown (Click based)
                React.createElement('div', { className: 'relative' },
                    React.createElement('button', { 
                        onClick: () => setIsOptimizeOpen(!isOptimizeOpen),
                        className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors flex-shrink-0 ${isOptimizeOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-dark-card border-dark-border text-brand-text-light hover:bg-white/5'}` 
                    },
                        React.createElement(RiskIcon, { className: "w-3 h-3" }),
                        "Optimize"
                    ),
                    isOptimizeOpen && React.createElement(React.Fragment, null,
                        React.createElement('div', { className: 'fixed inset-0 z-40', onClick: () => setIsOptimizeOpen(false) }),
                        React.createElement('div', { className: 'absolute right-0 top-full mt-2 w-48 bg-dark-card-solid border border-dark-border rounded-lg shadow-xl z-50 animate-fade-in-up flex flex-col p-1' },
                            React.createElement('button', { onClick: () => handleOptimize('crash'), className: 'w-full text-left px-3 py-2 text-xs hover:bg-white/10 text-white rounded-md' }, 
                                React.createElement('span', { className: 'block font-bold' }, "Crash Schedule"),
                                React.createElement('span', { className: 'block text-[10px] text-brand-text-light' }, "Reduce duration, increase cost")
                            ),
                            React.createElement('button', { onClick: () => handleOptimize('fast-track'), className: 'w-full text-left px-3 py-2 text-xs hover:bg-white/10 text-white rounded-md' }, 
                                React.createElement('span', { className: 'block font-bold' }, "Fast-Track"),
                                React.createElement('span', { className: 'block text-[10px] text-brand-text-light' }, "Overlap critical tasks (Risk++)")
                            )
                        )
                    )
                ),

                viewMode === 'timeline' && React.createElement(React.Fragment, null,
                    React.createElement('div', { className: 'w-px h-6 bg-dark-border mx-1 flex-shrink-0' }),
                    React.createElement(IconButton, { icon: React.createElement(ZoomOutIcon), onClick: () => setZoom(z => Math.max(z - 0.2, 0.5)), tooltip: "Zoom Out" }),
                    React.createElement(IconButton, { icon: React.createElement(ZoomInIcon), onClick: () => setZoom(z => Math.min(z + 0.2, 2)), tooltip: "Zoom In" }),
                    
                    React.createElement('div', { className: 'flex bg-dark-card-solid rounded-lg p-1 border border-dark-border mx-2 flex-shrink-0' },
                        [
                            { id: 'days', label: 'D' },
                            { id: 'weeks', label: 'W' },
                            { id: 'months', label: 'M' },
                            { id: 'quarters', label: 'Q' }
                        ].map(option => React.createElement('button', {
                            key: option.id,
                            onClick: () => setScale(option.id),
                            className: `w-8 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-colors ${scale === option.id ? 'bg-dark-bg text-white border border-dark-border' : 'text-brand-text-light hover:bg-white/5'}`
                        }, option.label))
                    ),

                    React.createElement(IconButton, { icon: React.createElement(ExpandIcon), onClick: handleExpandAll, tooltip: "Expand All" }),
                    React.createElement(IconButton, { icon: React.createElement(CollapseIcon), onClick: handleCollapseAll, tooltip: "Collapse All" }),
                ),
                
                React.createElement('div', { className: 'w-px h-6 bg-dark-border mx-1 flex-shrink-0' }),
                React.createElement(IconButton, { 
                    icon: React.createElement(EditIcon), 
                    onClick: () => setIsEditing(!isEditing), 
                    active: isEditing,
                    tooltip: isEditing ? "Finish Editing" : "Edit Mode" 
                }),
                React.createElement(IconButton, { 
                    icon: isFullscreen ? React.createElement(FullscreenExitIcon) : React.createElement(FullscreenIcon), 
                    onClick: handleFullscreen, 
                    tooltip: "Fullscreen" 
                }),
                React.createElement(IconButton, { icon: React.createElement(ExportIcon), onClick: () => window.print(), tooltip: "Export" })
             )
        ),
        
        // --- Content Area ---
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-hidden' },
            React.createElement('div', { className: 'p-0 h-full printable-content' },
                renderContent()
            )
        )
    );
};

export default SchedulingView;
