
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSCurveReport } from '../services/sCurveService.js';
import { SCurveIcon, Spinner, FeatureToolbar, BarChartIcon, RefreshIcon } from './Shared.js';
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

const SVGChart = ({ data, showBars, currency }) => {
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
            if (p[dataKey] !== null) {
                path += ` L ${xScale(i + 1)},${yScale(p[dataKey])}`;
            }
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
                yActual: point.actual !== null ? yScale(point.actual) + margin.top : null
            });
        }
    };
    
    const handleMouseLeave = () => setTooltip(null);
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(val);

    // Calculate Tick Dates (Show ~6-8 ticks max)
    const tickInterval = Math.ceil(points.length / 8);
    const ticks = points.filter((_, i) => i % tickInterval === 0);

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
                
                // Y-Axis Ticks & Labels
                [0, 25, 50, 75, 100].map(tick => (
                    React.createElement('g', { key: tick, transform: `translate(0, ${yScale(tick)})` },
                        React.createElement('line', { x1: -5, y1: 0, x2: chartWidth, y2: 0, className: 'stroke-slate-700/50 stroke-dasharray-2' }),
                        React.createElement('text', { x: -10, y: 4, className: 'fill-slate-400 text-xs text-anchor-end' }, `${tick}%`)
                    )
                )),
                
                // X-Axis Ticks & Labels (Enhanced Date Format)
                ticks.map((p, i) => {
                    const index = points.indexOf(p);
                    return React.createElement('g', { key: i, transform: `translate(${xScale(index)}, ${chartHeight})`},
                         React.createElement('line', { y1: 0, y2: 5, className: 'stroke-slate-600' }),
                         React.createElement('text', { 
                             y: 20, 
                             className: 'fill-slate-400 text-xs text-anchor-middle',
                             transform: `rotate(0)` // Removed rotation for cleaner look if space allows
                         }, new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                    );
                }),
                
                // Lines
                React.createElement('path', { d: linePath('planned'), className: 'fill-none stroke-sky-500 stroke-2' }),
                React.createElement('path', { d: linePath('actual'), className: 'fill-none stroke-brand-purple-light stroke-2' }),

                // Optional: Incremental Bars
                showBars && points.map((p, i) => {
                    if (i === 0) return null;
                    const x = xScale(i);
                    const prevPlanned = points[i-1].planned;
                    const prevActual = points[i-1].actual;
                    
                    const incPlanned = Math.max(0, p.planned - prevPlanned);
                    const incActual = p.actual !== null ? Math.max(0, p.actual - (prevActual || 0)) : 0;
                    
                    const barWidth = (chartWidth / points.length) * 0.4;
                    
                    // Simple bars for Period Progress % (scaled x2 to be visible)
                    const barHeightP = (incPlanned * 4); 
                    const barHeightA = (incActual * 4);

                    return React.createElement('g', { key: `bar-${i}` },
                        React.createElement('rect', {
                            x: x - barWidth, y: chartHeight - barHeightP, width: barWidth, height: barHeightP,
                            fill: 'rgba(14, 165, 233, 0.3)'
                        }),
                        p.actual !== null && React.createElement('rect', {
                            x: x, y: chartHeight - barHeightA, width: barWidth, height: barHeightA,
                            fill: 'rgba(45, 212, 191, 0.5)'
                        })
                    );
                }),

                // Tooltip Highlight
                tooltip && React.createElement('g', null,
                     React.createElement('line', { x1: tooltip.x - margin.left, y1: 0, x2: tooltip.x - margin.left, y2: chartHeight, className: 'stroke-slate-500' }),
                     React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yPlanned - margin.top, r: 4, className: 'fill-sky-500' }),
                     tooltip.yActual && React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yActual - margin.top, r: 4, className: 'fill-brand-purple-light' })
                )
            )
        ),
        // Tooltip Content
        tooltip && React.createElement('div', {
            className: 'absolute bg-dark-card-solid p-3 rounded-lg text-xs pointer-events-none border border-dark-border shadow-xl z-20 w-48',
            style: { left: Math.min(tooltip.x + 10, width - 200), top: 10 }
        },
            React.createElement('p', { className: 'font-bold text-white mb-2' }, tooltip.point.label || tooltip.point.date),
            React.createElement('div', { className: 'grid grid-cols-2 gap-x-2 gap-y-1' },
                React.createElement('span', { className: 'text-sky-400 font-semibold' }, 'Planned:'),
                React.createElement('span', { className: 'text-right' }, `${tooltip.point.planned}%`),
                React.createElement('span', { className: 'text-brand-text-light' }, 'PV:'),
                React.createElement('span', { className: 'text-right' }, formatCurrency(tooltip.point.pv)),

                React.createElement('span', { className: 'text-brand-purple-light font-semibold' }, 'Actual:'),
                React.createElement('span', { className: 'text-right' }, tooltip.point.actual !== null ? `${tooltip.point.actual}%` : '-'),
                React.createElement('span', { className: 'text-brand-text-light' }, 'EV:'),
                React.createElement('span', { className: 'text-right' }, tooltip.point.ev !== null ? formatCurrency(tooltip.point.ev) : '-')
            )
        )
    );
};

const EvmCard = ({ title, value, subtext, color = 'text-white' }) => (
    React.createElement('div', { className: 'bg-dark-card p-4 rounded-lg border border-dark-border text-center' },
        React.createElement('p', { className: 'text-xs text-brand-text-light uppercase tracking-wider' }, title),
        React.createElement('p', { className: `text-2xl font-bold my-1 ${color}` }, value),
        subtext && React.createElement('p', { className: 'text-xs text-slate-500' }, subtext)
    )
);

const ResultsView = ({ rawData, analysis, scale, showBars, currency }) => {
    const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        if (!rawData || !rawData.points) return;
        setDisplayData(rawData.points);
    }, [rawData]);

    // Get current status (last point with actual data)
    const currentStatus = useMemo(() => {
        const points = rawData?.points || [];
        const lastActual = [...points].reverse().find(p => p.actual !== null);
        return lastActual || points[0] || {};
    }, [rawData]);
    
    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(v || 0);

    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border h-96' },
            React.createElement(SVGChart, { data: displayData, showBars: showBars, currency: currency })
        ),
        
        // EVM Dashboard Section
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
            React.createElement(EvmCard, { title: "BAC (Budget)", value: format(rawData?.totalBudget), subtext: "Total Planned" }),
            React.createElement(EvmCard, { title: "Planned Value (PV)", value: format(currentStatus.pv), subtext: "Should be done" }),
            React.createElement(EvmCard, { title: "Earned Value (EV)", value: format(currentStatus.ev), subtext: "Actually done" }),
            React.createElement(EvmCard, { title: "Actual Cost (AC)", value: format(currentStatus.ac), subtext: "Estimated spend" })
        ),

        React.createElement('div', { className: 'flex-grow grid grid-cols-1 md:grid-cols-2 gap-6' },
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
             React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border flex flex-col justify-center gap-4' },
                React.createElement('div', { className: 'flex justify-between items-center border-b border-dark-border pb-2' },
                    React.createElement('span', { className: 'text-brand-text-light' }, "Schedule Performance Index (SPI)"),
                    React.createElement('span', { className: `font-bold ${currentStatus.spi >= 1 ? 'text-green-400' : 'text-red-400'}` }, currentStatus.spi)
                ),
                React.createElement('div', { className: 'flex justify-between items-center border-b border-dark-border pb-2' },
                    React.createElement('span', { className: 'text-brand-text-light' }, "Cost Performance Index (CPI)"),
                    React.createElement('span', { className: `font-bold ${currentStatus.cpi >= 1 ? 'text-green-400' : 'text-red-400'}` }, currentStatus.cpi)
                ),
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('span', { className: 'text-brand-text-light' }, "Estimate at Completion (EAC)"),
                    React.createElement('span', { className: 'font-bold text-white' }, 
                         format(rawData?.totalBudget / (currentStatus.cpi || 1))
                    )
                )
            )
        )
    );
};

const SCurveView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const [scale, setScale] = useState('days');
    const [showBars, setShowBars] = useState(false);
    const currency = projectData.criteria?.currency || 'USD';

    const generate = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Pass total budget to service
            const budgetTotal = projectData.criteria?.budget || 0;
            const sCurveReport = await generateSCurveReport(projectData.schedule, budgetTotal);
            onUpdateProject({ sCurveReport });
        } catch (err) {
            setError(err.message || "Failed to generate S-Curve report.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectData.schedule && !projectData.sCurveReport && !isLoading) {
            generate();
        }
    }, [projectData.schedule, projectData.sCurveReport, isLoading]);

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.sCurveReport) {
            const { sCurveData, analysis } = projectData.sCurveReport;
            return React.createElement(ResultsView, { rawData: sCurveData, analysis: analysis, scale: scale, showBars: showBars, currency: currency });
        }
        return React.createElement(LoadingView, null);
    };

    const customControls = (
        React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('button', {
                onClick: generate,
                className: 'p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white transition-colors',
                title: "Regenerate Analysis"
            }, React.createElement(RefreshIcon, { className: "h-5 w-5" })),
            React.createElement('div', { className: 'w-px h-6 bg-dark-border mx-1' }),
            React.createElement('button', {
                onClick: () => setShowBars(!showBars),
                className: `p-2 rounded-md transition-colors ${showBars ? 'bg-brand-purple text-white' : 'text-brand-text-light hover:bg-white/10 hover:text-white'}`,
                title: "Toggle Period Bars"
            }, React.createElement(BarChartIcon, { className: "h-5 w-5" }))
        )
    );

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement(FeatureToolbar, {
            title: t.dashboardSCurve,
            containerRef: fullscreenRef,
            onExport: () => window.print(),
            scale: scale,
            onScaleChange: setScale,
            customControls: customControls
        }),
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
