import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateScheduleFromPlan } from '../services/schedulingService.js';
import { ScheduleIcon, Spinner, FeatureToolbar } from './Shared.js';
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
    // Set time to noon to avoid DST issues
    d1.setHours(12, 0, 0, 0);
    d2.setHours(12, 0, 0, 0);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start/end day
};


// --- Sub-Components ---
const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(ScheduleIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Building Your Timeline..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is calculating task dates and dependencies from your plan."),
        React.createElement(Spinner, { size: '12' })
    )
);

const GanttChart = ({ data, collapsed, setCollapsed, scale }) => {
    const taskListRef = useRef(null);
    const timelineRef = useRef(null);
    const isSyncingRef = useRef(false);
    const timeoutRef = useRef(null);

    const { projectStart, projectEnd, totalDays, headers, dayPixelWidth, phases } = useMemo(() => {
        if (!data || data.length === 0) return { headers: { top: [], bottom: [] }, phases: new Map() };

        const dates = data.flatMap(t => [new Date(t.start), new Date(t.end)]);
        const projectStart = new Date(Math.min(...dates));
        projectStart.setHours(0, 0, 0, 0);
        const projectEnd = new Date(Math.max(...dates));
        projectEnd.setHours(23, 59, 59, 999);
        const totalDays = getDaysDiff(projectStart, projectEnd);

        let dayPixelWidth;
        switch (scale) {
            case 'weeks': dayPixelWidth = 12; break;
            case 'months': dayPixelWidth = 4; break;
            case 'days':
            default: dayPixelWidth = 40;
        }

        const topHeaders = [];
        const bottomHeaders = [];
        let currentDate = new Date(projectStart);

        if (scale === 'days') {
            let currentMonth = -1;
            for (let i = 0; i < totalDays; i++) {
                let date = addDays(projectStart, i);
                bottomHeaders.push({
                    label: date.getDate(),
                    width: dayPixelWidth,
                    isWeekend: date.getDay() === 0 || date.getDay() === 6
                });
                if (date.getMonth() !== currentMonth) {
                    currentMonth = date.getMonth();
                    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                    const remainingDays = daysInMonth - date.getDate() + 1;
                    const width = Math.min(remainingDays, getDaysDiff(date, projectEnd)) * dayPixelWidth;
                    topHeaders.push({ label: monthName, width });
                }
            }
        } else if (scale === 'weeks') {
            let currentMonth = -1;
            let i = 0;
            while(i < totalDays) {
                const weekStartDate = addDays(projectStart, i);
                const weekEndDate = addDays(weekStartDate, 6 > totalDays - 1 - i ? totalDays - 1 - i : 6);
                const width = getDaysDiff(weekStartDate, weekEndDate) * dayPixelWidth;
                bottomHeaders.push({ label: `W${Math.floor(i/7) + 1}`, width });
                 if (weekStartDate.getMonth() !== currentMonth) {
                    currentMonth = weekStartDate.getMonth();
                    //... logic to span months over weeks
                }
                i += 7;
            }
        } else if (scale === 'months') {
            let currentYear = -1;
            let date = new Date(projectStart);
            while(date <= projectEnd) {
                const monthName = date.toLocaleString('default', { month: 'short' });
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                const width = daysInMonth * dayPixelWidth;
                bottomHeaders.push({ label: monthName, width });

                 if (date.getFullYear() !== currentYear) {
                    currentYear = date.getFullYear();
                    topHeaders.push({label: currentYear, width: 365 * dayPixelWidth}); // Approximate
                }
                date.setMonth(date.getMonth() + 1);
            }
        }

        const phases = new Map();
        data.forEach(task => { if (task.type === 'project') phases.set(task.id, task); });

        return { projectStart, projectEnd, totalDays, headers: { top: topHeaders, bottom: bottomHeaders }, dayPixelWidth, phases };
    }, [data, scale]);

    useEffect(() => {
        const taskListEl = taskListRef.current;
        const timelineEl = timelineRef.current;
        const syncScrolls = (scrolledElement, targetElement) => {
            if (isSyncingRef.current) return;
            isSyncingRef.current = true;
            targetElement.scrollTop = scrolledElement.scrollTop;
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => { isSyncingRef.current = false; }, 50);
        };
        const handleTaskListScroll = () => syncScrolls(taskListEl, timelineEl);
        const handleTimelineScroll = () => syncScrolls(timelineEl, taskListEl);
        if (taskListEl && timelineEl) {
            taskListEl.addEventListener('scroll', handleTaskListScroll);
            timelineEl.addEventListener('scroll', handleTimelineScroll);
        }
        return () => {
            if (taskListEl && timelineEl) {
                taskListEl.removeEventListener('scroll', handleTaskListScroll);
                timelineEl.removeEventListener('scroll', handleTimelineScroll);
            }
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const getTaskPosition = (task) => {
        const left = (getDaysDiff(projectStart, new Date(task.start)) - 1) * dayPixelWidth;
        const width = getDaysDiff(new Date(task.start), new Date(task.end)) * dayPixelWidth;
        return { left, width };
    };
    
    const toggleCollapse = (phaseId) => {
        setCollapsed(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
    };

    const phaseColors = ['#2DD4BF', '#A3E635', '#FACC15', '#FB923C', '#22D3EE'];
    const phaseColorMap = new Map(Array.from(phases.keys()).map((id, i) => [id, phaseColors[i % phaseColors.length]]));
    const visibleTasks = data.filter(task => !task.project || !collapsed[task.project]);
    const timelineContentHeight = visibleTasks.length * 41;

    return React.createElement('div', { className: 'w-full h-full flex flex-col bg-dark-card-solid/80 rounded-lg overflow-hidden animate-fade-in-up' },
        React.createElement('div', { className: 'flex-grow flex overflow-hidden' },
            React.createElement('div', { ref: taskListRef, className: 'w-[450px] flex-shrink-0 border-r border-dark-border overflow-y-auto' },
                React.createElement('div', { className: 'grid grid-cols-[3fr,1fr,1fr,1fr,1fr] text-xs font-bold text-slate-400 p-2 sticky top-0 bg-dark-card-solid z-10 h-12 items-center' },
                    React.createElement('div', { className: 'pl-6' }, "Task"),
                    React.createElement('div', null, "Start"),
                    React.createElement('div', null, "End"),
                    React.createElement('div', null, "Days"),
                    React.createElement('div', { className: 'pr-2' }, "Progress")
                ),
                visibleTasks.map(task => {
                    const isPhase = task.type === 'project';
                    const duration = getDaysDiff(task.start, task.end);
                    const isCollapsed = collapsed[task.id];
                    return React.createElement('div', {
                        key: task.id,
                        className: `grid grid-cols-[3fr,1fr,1fr,1fr,1fr] text-sm items-center p-2 h-[41px] border-t border-dark-border/50 ${isPhase ? 'bg-dark-border/20 font-semibold' : ''} ${task.project ? 'pl-10' : 'pl-2'}`
                    },
                        React.createElement('div', { className: 'truncate flex items-center gap-2' },
                            isPhase && React.createElement('button', { onClick: () => toggleCollapse(task.id), className: 'transition-transform text-slate-400', style: { transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' } }, React.createElement('svg', {className: "w-4 h-4", fill: "currentColor", viewBox:"0 0 16 16"}, React.createElement('path', {d:"M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"}))),
                            task.name
                        ),
                        React.createElement('div', null, new Date(task.start).toLocaleDateString()),
                        React.createElement('div', null, new Date(task.end).toLocaleDateString()),
                        React.createElement('div', null, `${duration}d`),
                        React.createElement('div', { className: 'w-full bg-slate-600 rounded-full h-4 relative' },
                            React.createElement('div', {
                                className: 'h-full rounded-full',
                                style: { width: `${task.progress}%`, backgroundColor: phaseColorMap.get(task.project || task.id) }
                            }),
                             React.createElement('span', {className: 'absolute inset-0 text-center text-xs font-bold text-white' }, `${task.progress}%`)
                        )
                    );
                })
            ),
            React.createElement('div', { ref: timelineRef, className: 'flex-grow overflow-auto relative' },
                React.createElement('div', { style: { width: totalDays * dayPixelWidth } },
                    React.createElement('div', { className: 'sticky top-0 bg-dark-card-solid z-10' },
                        React.createElement('div', { className: 'h-6 flex border-b border-dark-border' }, headers.top.map((h, i) => React.createElement('div', { key: i, style: {width: h.width}, className: 'flex-shrink-0 text-center text-xs text-slate-400 font-bold border-r border-dark-border'}, h.label))),
                        React.createElement('div', { className: 'h-6 flex' }, headers.bottom.map((h, i) => React.createElement('div', {
                            key: i, style: { width: h.width },
                            className: `flex-shrink-0 text-center border-r border-dark-border font-semibold text-white ${h.isWeekend ? 'bg-dark-border/20': ''}`
                        }, React.createElement('span', { className: 'text-xs' }, h.label))))
                    ),
                    React.createElement('div', { className: 'absolute top-12 left-0 h-full w-full' },
                        headers.bottom.map((header, i) => React.createElement('div', {
                            key: i, style: { left: headers.bottom.slice(0, i).reduce((w, h) => w + h.width, 0), width: header.width },
                            className: `absolute top-0 h-full border-r border-dark-border/50 ${header.isWeekend ? 'bg-dark-border/20' : ''}`
                        }))
                    ),
                    React.createElement('div', { className: 'relative', style: { height: `${timelineContentHeight}px` } },
                        visibleTasks.map((task, index) => {
                            const { left, width } = getTaskPosition(task);
                            const top = index * 41 + 4;
                            const barColor = phaseColorMap.get(task.project || task.id) || '#3B82F6';
                            if (task.type === 'milestone') {
                                return React.createElement('div', {
                                    key: task.id, title: task.name,
                                    className: 'absolute h-6 w-6 -translate-x-1/2 rotate-45',
                                    style: { left: left + dayPixelWidth, top: top + 8, backgroundColor: barColor },
                                });
                            }
                            return React.createElement('div', {
                                key: task.id, title: `${task.name} (${task.progress}%)`,
                                className: 'absolute h-8 rounded-md flex items-center group',
                                style: { left, width, top, backgroundColor: barColor, opacity: task.type === 'project' ? 0.8 : 1 }
                            },
                                React.createElement('div', { className: 'absolute left-0 top-0 h-full bg-black/20 rounded-md', style: { width: `${task.progress}%` } }),
                                task.type !== 'project' && React.createElement('span', { className: 'relative text-xs font-bold text-white truncate px-2' }, `${task.name}`)
                            );
                        })
                    )
                )
            )
        )
    );
};


const SchedulingView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const [collapsed, setCollapsed] = useState({});
    const [scale, setScale] = useState('days'); 

    useEffect(() => {
        if (projectData.plan && !projectData.schedule && !isLoading) {
            const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const schedule = await generateScheduleFromPlan(projectData.plan);
                    onUpdateProject({ schedule });
                } catch (err) {
                    setError(err.message || "Failed to generate schedule.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.plan, projectData.schedule, isLoading, onUpdateProject, setIsLoading, setError]);


    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.schedule) {
             return React.createElement(GanttChart, { data: projectData.schedule, collapsed, setCollapsed, scale });
        }
        return React.createElement(LoadingView, null); 
    };

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
            React.createElement('div', {
               className: 'p-6 printable-content h-full flex flex-col',
            },
                React.createElement('div', { className: 'h-full flex items-center justify-center' }, renderContent())
            )
        )
    );
};

export default SchedulingView;
