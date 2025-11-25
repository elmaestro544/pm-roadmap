// components/SCurveView.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSCurveReport } from '../services/sCurveService.js';
import { SCurveIcon, Spinner, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- Sub-Components ---

const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(SCurveIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Generating S-Curve..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is processing your project schedule to create a progress visualization."),
        React.createElement(Spinner, { size: '12' })
    )
);

const SVGChart = ({ data }) => {
    const svgRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);

    if (!data || data.length === 0) {
        return React.createElement('div', { className: 'flex items-center justify-center h-full text-slate-400' }, 'No data to display.');
    }

    const points = data;
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = (index) => (index / (points.length - 1)) * chartWidth;
    const yScale = (value) => chartHeight - (value / 100) * chartHeight;

    const linePath = (dataKey) => {
        let path = `M ${xScale(0)},${yScale(points[0][dataKey])}`;
        points.slice(1).forEach((p, i) => {
            path += ` L ${xScale(i + 1)},${yScale(p[dataKey] === null ? 0 : p[dataKey])}`;
        });
        return path;
    };
    
    const handleMouseMove = (e) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - svgRect.left - margin.left;

        const index = Math.round((x / chartWidth) * (points.length - 1));
        const point = points[index];
        
        if (point) {
            setTooltip({
                point,
                x: xScale(index) + margin.left,
                yPlanned: yScale(point.planned) + margin.top,
                yActual: yScale(point.actual) + margin.top
            });
        }
    };
    
    const handleMouseLeave = () => setTooltip(null);
    
    const getTickCount = () => {
        if (points.length > 20) return 10;
        if (points.length > 10) return 5;
        return points.length -1;
    };

    return React.createElement('div', { className: 'relative' },
        React.createElement('svg', {
            ref: svgRef,
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${width} ${height}`,
            onMouseMove: handleMouseMove,
            onMouseLeave: handleMouseLeave
        },
            React.createElement('g', { transform: `translate(${margin.left}, ${margin.top})` },
                // Axes
                React.createElement('line', { x1: 0, y1: chartHeight, x2: chartWidth, y2: chartHeight, className: 'stroke-slate-600' }),
                React.createElement('line', { x1: 0, y1: 0, x2: 0, y2: chartHeight, className: 'stroke-slate-600' }),
                React.createElement('text', { x: chartWidth / 2, y: chartHeight + 40, className: 'fill-slate-400 text-sm text-anchor-middle' }, 'Project Duration'),
                React.createElement('text', { transform: `rotate(-90)`, x: -chartHeight / 2, y: -40, className: 'fill-slate-400 text-sm text-anchor-middle' }, 'Cumulative Progress (%)'),
                
                // Y-Axis Ticks
                [0, 25, 50, 75, 100].map(tick => (
                    React.createElement('g', { key: tick, transform: `translate(0, ${yScale(tick)})` },
                        React.createElement('line', { x1: -5, y1: 0, x2: chartWidth, y2: 0, className: 'stroke-slate-700/50 stroke-dasharray-2' }),
                        React.createElement('text', { x: -10, y: 4, className: 'fill-slate-400 text-xs text-anchor-end' }, `${tick}%`)
                    )
                )),
                
                // X-Axis Ticks
                Array.from({ length: getTickCount() + 1 }).map((_, i) => {
                    const tickIndex = Math.round(i * (points.length - 1) / getTickCount());
                    const point = points[tickIndex];
                    if (!point) return null;
                    return React.createElement('g', { key: i, transform: `translate(${xScale(tickIndex)}, ${chartHeight})`},
                         React.createElement('line', { y1: 0, y2: 5, className: 'stroke-slate-600' }),
                         React.createElement('text', { y: 20, className: 'fill-slate-400 text-xs text-anchor-middle' }, point.label)
                    )
                }),
                
                // Lines
                React.createElement('path', { d: linePath('planned'), className: 'fill-none stroke-sky-500 stroke-2' }),
                React.createElement('path', { d: linePath('actual'), className: 'fill-none stroke-brand-purple-light stroke-2' }),

                // Tooltip line and circles
                tooltip && React.createElement('g', null,
                     React.createElement('line', { x1: tooltip.x - margin.left, y1: 0, x2: tooltip.x - margin.left, y2: chartHeight, className: 'stroke-slate-500' }),
                     React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yPlanned - margin.top, r: 4, className: 'fill-sky-500' }),
                     React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yActual - margin.top, r: 4, className: 'fill-brand-purple-light' })
                )
            )
        ),
        tooltip && React.createElement('div', {
            className: 'absolute bg-dark-card-solid p-2 rounded-md text-xs pointer-events-none border border-dark-border shadow-lg z-10',
            style: { left: tooltip.x + 10, top: (tooltip.yPlanned + tooltip.yActual)/2 - 30 }
        },
            React.createElement('p', { className: 'font-bold' }, `${tooltip.point.label}`),
            React.createElement('p', null, React.createElement('span', { className: 'text-sky-400' }, 'Planned: '), `${tooltip.point.planned}%`),
            React.createElement('p', null, React.createElement('span', { className: 'text-brand-purple-light' }, 'Actual: '), `${tooltip.point.actual}%`)
        )
    );
};

const EditableDataTable = ({ data, setData }) => {

    const handleActualChange = (index, value) => {
        const newValue = Math.max(0, Math.min(100, Number(value)));
        const newData = [...data];
        newData[index] = { ...newData[index], actual: newValue };
        setData(newData);
    };

    return React.createElement('div', { className: 'flex-grow overflow-y-auto bg-dark-card-solid rounded-xl border border-dark-border' },
        React.createElement('table', { className: 'w-full text-sm text-left' },
            React.createElement('thead', { className: 'sticky top-0 bg-dark-card z-10' },
                React.createElement('tr', { className: 'text-brand-text-light border-b border-dark-border' },
                    ['Period', 'Planned %', 'Actual %'].map(h => React.createElement('th', { key: h, className: 'p-3 font-semibold' }, h))
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-dark-border' }, data.map((point, index) =>
                React.createElement('tr', { key: index, className: 'hover:bg-dark-card' },
                    React.createElement('td', { className: 'p-3 font-semibold' }, point.label),
                    React.createElement('td', { className: 'p-3' }, `${point.planned.toFixed(2)}%`),
                    React.createElement('td', { className: 'p-3' },
                        React.createElement('input', {
                            type: 'number',
                            value: point.actual,
                            onChange: e => handleActualChange(index, e.target.value),
                            min: 0,
                            max: 100,
                            className: 'w-24 p-1 bg-dark-bg border border-dark-border rounded-md text-white focus:ring-2 focus:ring-brand-purple focus:outline-none'
                        })
                    )
                )
            ))
        )
    );
};


const ResultsView = ({ rawData, analysis, scale }) => {
    const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        if (!rawData || !rawData.points) return;
        
        if (scale === 'days') {
            const dailyData = rawData.points.map(p => ({...p, label: `Day ${p.day}`}));
            setDisplayData(dailyData);
            return;
        }
        
        if (scale === 'weeks') {
            const weeklyData = [];
            for (let i = 0; i < rawData.points.length; i += 7) {
                const weekChunk = rawData.points.slice(i, i + 7);
                const weekEndData = weekChunk[weekChunk.length - 1];
                weeklyData.push({ ...weekEndData, label: `Week ${Math.floor(i / 7) + 1}` });
            }
            setDisplayData(weeklyData);
            return;
        }

        if (scale === 'months') {
            const monthlyData = [];
            const byMonth = rawData.points.reduce((acc, point) => {
                const month = point.date.substring(0, 7); // YYYY-MM
                if (!acc[month]) acc[month] = [];
                acc[month].push(point);
                return acc;
            }, {});
            
            for (const monthKey in byMonth) {
                const monthPoints = byMonth[monthKey];
                const monthEndData = monthPoints[monthPoints.length - 1];
                const monthLabel = new Date(monthEndData.date).toLocaleString('default', { month: 'short', year: 'numeric' });
                monthlyData.push({ ...monthEndData, label: monthLabel });
            }
            setDisplayData(monthlyData);
            return;
        }

    }, [rawData, scale]);


    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border' },
            React.createElement(SVGChart, { data: displayData })
        ),
        React.createElement('div', { className: 'flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]' },
            React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border' },
                React.createElement('h3', { className: 'text-lg font-bold text-white mb-4' }, 'AI Analysis'),
                React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'font-semibold text-brand-purple-light' }, 'Progress Variance Analysis'),
                        React.createElement('p', { className: 'text-brand-text-light' }, analysis.analysis)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'font-semibold text-brand-purple-light' }, 'Project Outlook'),
                        React.createElement('p', { className: 'text-brand-text-light' }, analysis.outlook)
                    )
                )
            ),
            React.createElement('div', { className: 'flex flex-col min-h-0' },
                React.createElement(EditableDataTable, { data: displayData, setData: setDisplayData })
            )
        )
    );
};

const SCurveView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const [scale, setScale] = useState('days');

    useEffect(() => {
        if (projectData.schedule && !projectData.sCurveReport && !isLoading) {
            const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const sCurveReport = await generateSCurveReport(projectData.schedule);
                    onUpdateProject({ sCurveReport });
                } catch (err) {
                    setError(err.message || "Failed to generate S-Curve report.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.schedule, projectData.sCurveReport, isLoading, onUpdateProject, setIsLoading, setError]);

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.sCurveReport) {
            const { sCurveData, analysis } = projectData.sCurveReport;
            return React.createElement(ResultsView, { rawData: sCurveData, analysis: analysis, scale: scale });
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

export default SCurveView;
