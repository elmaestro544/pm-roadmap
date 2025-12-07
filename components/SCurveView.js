import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSCurveReport } from '../services/sCurveService.js';
import { SCurveIcon, Spinner, FeatureToolbar, BarChartIcon, RefreshIcon, EditIcon, CloseIcon } from './Shared.js';
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

// --- Manual Status Update Modal ---
const UpdateStatusModal = ({ isOpen, onClose, onUpdate }) => {
    const [progress, setProgress] = useState('');
    const [actualCost, setActualCost] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ progress: parseFloat(progress), actualCost: parseFloat(actualCost) });
        onClose();
    };

    return React.createElement('div', { className: "fixed inset-0 bg-black/80 z-[200] flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in-up" },
        React.createElement('div', { className: "bg-dark-card rounded-xl shadow-2xl w-full max-w-md border border-dark-border glow-border p-6" },
            React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                React.createElement('h3', { className: "text-xl font-bold text-white" }, "Update Project Status"),
                React.createElement('button', { onClick: onClose, className: "text-brand-text-light hover:text-white" }, React.createElement(CloseIcon, null))
            ),
            React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Actual % Complete (Cumulative)"),
                    React.createElement('input', {
                        type: "number", min: 0, max: 100, step: 0.1, required: true,
                        value: progress, onChange: e => setProgress(e.target.value),
                        className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none"
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium text-brand-text-light mb-1" }, "Actual Cost to Date"),
                    React.createElement('input', {
                        type: "number", min: 0, step: 0.01,
                        value: actualCost, onChange: e => setActualCost(e.target.value),
                        className: "w-full p-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-brand-purple focus:outline-none",
                        placeholder: "Optional"
                    })
                ),
                React.createElement('button', { type: "submit", className: "w-full py-2 bg-button-gradient text-white font-bold rounded-lg mt-2" }, "Update EVM Metrics")
            )
        )
    );
};

const SVGChart = ({ data, showBars, currency, interval }) => {
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

        // Find nearest point
        const index = Math.round((x / chartWidth) * (points.length - 1));
        const safeIndex = Math.max(0, Math.min(index, points.length - 1));
        const point = points[safeIndex];
        
        if (point) {
            setTooltip({
                point,
                x: xScale(safeIndex) + margin.left,
                yPlanned: yScale(point.planned) + margin.top,
                yActual: point.actual !== null ? yScale(point.actual) + margin.top : null
            });
        }
    };
    
    const handleMouseLeave = () => setTooltip(null);
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(val);
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        if (interval === 'months') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (interval === 'quarters') return `Q${Math.floor(d.getMonth()/3)+1} '${d.getFullYear().toString().slice(2)}`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate Optimal Ticks to prevent overlap
    // Assuming approx 60px per label needed
    const maxTicks = Math.floor(chartWidth / 70); 
    const step = Math.ceil(points.length / maxTicks);
    const ticks = points.filter((_, i) => i % step === 0);

    return React.createElement('div', { className: 'relative w-full h-full' },
        React.createElement('svg', {
            ref: svgRef,
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${width} ${height}`,
            onMouseMove: handleMouseMove,
            onMouseLeave: handleMouseLeave,
            className: "overflow-visible"
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
                
                // X-Axis Ticks & Labels
                ticks.map((p, i) => {
                    const index = points.indexOf(p);
                    return React.createElement('g', { key: i, transform: `translate(${xScale(index)}, ${chartHeight})`},
                         React.createElement('line', { y1: 0, y2: 5, className: 'stroke-slate-600' }),
                         React.createElement('text', { 
                             y: 20, 
                             className: 'fill-slate-400 text-xs text-anchor-middle',
                         }, formatDate(p.date))
                    );
                }),
                
                // Optional: Incremental Bars (Histogram)
                showBars && points.map((p, i) => {
                    if (i === 0) return null;
                    const x = xScale(i);
                    const barW = (chartWidth / points.length) * 0.6;
                    
                    const prevP = points[i-1].planned;
                    const incP = Math.max(0, p.planned - prevP);
                    const heightP = (incP * 3); // Scale up for visibility

                    const prevA = points[i-1].actual;
                    const incA = p.actual !== null ? Math.max(0, p.actual - (prevA || 0)) : 0;
                    const heightA = (incA * 3);

                    return React.createElement('g', { key: `bar-${i}` },
                        React.createElement('rect', {
                            x: x - barW, y: chartHeight - heightP, width: barW, height: heightP,
                            fill: 'rgba(14, 165, 233, 0.3)',
                            className: 'transition-all duration-300'
                        }),
                        p.actual !== null && React.createElement('rect', {
                            x: x, y: chartHeight - heightA, width: barW, height: heightA,
                            fill: 'rgba(45, 212, 191, 0.5)',
                            className: 'transition-all duration-300'
                        })
                    );
                }),

                // Cumulative Lines
                React.createElement('path', { d: linePath('planned'), className: 'fill-none stroke-sky-500 stroke-2 transition-all duration-500' }),
                React.createElement('path', { d: linePath('actual'), className: 'fill-none stroke-brand-purple-light stroke-2 transition-all duration-500' }),

                // Tooltip Line
                tooltip && React.createElement('g', null,
                     React.createElement('line', { x1: tooltip.x - margin.left, y1: 0, x2: tooltip.x - margin.left, y2: chartHeight, className: 'stroke-slate-500 stroke-dasharray-4' }),
                     React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yPlanned - margin.top, r: 5, className: 'fill-sky-500 stroke-white stroke-2' }),
                     tooltip.yActual && React.createElement('circle', { cx: tooltip.x - margin.left, cy: tooltip.yActual - margin.top, r: 5, className: 'fill-brand-purple-light stroke-white stroke-2' })
                )
            )
        ),
        // Tooltip Content
        tooltip && React.createElement('div', {
            className: 'absolute bg-dark-card-solid p-4 rounded-xl text-xs pointer-events-none border border-dark-border shadow-2xl z-20 w-56 backdrop-blur-md',
            style: { left: Math.min(tooltip.x + 20, width - 240), top: 20 }
        },
            React.createElement('p', { className: 'font-bold text-white mb-3 text-sm border-b border-dark-border pb-1' }, formatDate(tooltip.point.date)),
            React.createElement('div', { className: 'grid grid-cols-2 gap-x-2 gap-y-2' },
                React.createElement('span', { className: 'text-sky-400 font-bold' }, 'PLANNED'),
                React.createElement('span', { className: 'text-right font-mono text-white' }, `${tooltip.point.planned}%`),
                React.createElement('span', { className: 'text-brand-text-light' }, 'Value (PV)'),
                React.createElement('span', { className: 'text-right font-mono text-brand-text-light' }, formatCurrency(tooltip.point.pv)),

                React.createElement('div', { className: 'col-span-2 h-px bg-dark-border my-1' }),

                React.createElement('span', { className: 'text-brand-purple-light font-bold' }, 'ACTUAL'),
                React.createElement('span', { className: 'text-right font-mono text-white' }, tooltip.point.actual !== null ? `${tooltip.point.actual}%` : '-'),
                React.createElement('span', { className: 'text-brand-text-light' }, 'Earned (EV)'),
                React.createElement('span', { className: 'text-right font-mono text-brand-text-light' }, tooltip.point.ev !== null ? formatCurrency(tooltip.point.ev) : '-'),
                
                React.createElement('div', { className: 'col-span-2 h-px bg-dark-border my-1' }),
                
                React.createElement('span', { className: 'text-yellow-400' }, 'SPI / CPI'),
                React.createElement('span', { className: 'text-right font-mono text-white' }, `${tooltip.point.spi} / ${tooltip.point.cpi}`)
            )
        )
    );
};

const EvmCard = ({ title, value, subtext, color = 'text-white' }) => (
    React.createElement('div', { className: 'bg-dark-card p-4 rounded-lg border border-dark-border text-center flex flex-col justify-center' },
        React.createElement('p', { className: 'text-xs text-brand-text-light uppercase tracking-wider' }, title),
        React.createElement('p', { className: `text-2xl font-bold my-1 ${color}` }, value),
        subtext && React.createElement('p', { className: 'text-xs text-slate-500' }, subtext)
    )
);

const ResultsView = ({ rawData, analysis, scale, showBars, currency, onOpenUpdateModal }) => {
    const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        if (!rawData || !rawData.points) return;
        setDisplayData(rawData.points);
    }, [rawData]);

    // Get current status (last point with actual data)
    const currentStatus = useMemo(() => {
        const points = rawData?.points || [];
        // Find last valid actual point
        for (let i = points.length - 1; i >= 0; i--) {
            if (points[i].actual !== null) return points[i];
        }
        return points[0] || {};
    }, [rawData]);
    
    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: "compact" }).format(v || 0);

    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border h-96' },
            React.createElement(SVGChart, { data: displayData, showBars: showBars, currency: currency, interval: scale })
        ),
        
        // EVM Dashboard Section
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-5 gap-4' },
            React.createElement(EvmCard, { title: "BAC (Budget)", value: format(rawData?.totalBudget), subtext: "Total Planned" }),
            React.createElement(EvmCard, { title: "Planned Value (PV)", value: format(currentStatus.pv), subtext: "Should be done" }),
            React.createElement(EvmCard, { title: "Earned Value (EV)", value: format(currentStatus.ev), subtext: "Actually done" }),
            React.createElement(EvmCard, { title: "Actual Cost (AC)", value: format(currentStatus.ac), subtext: "Estimated spend" }),
            
            // Action Card
            React.createElement('button', { 
                onClick: onOpenUpdateModal,
                className: 'bg-brand-purple/10 border border-brand-purple/30 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-brand-purple/20 transition-colors group'
            },
                React.createElement(EditIcon, { className: "w-6 h-6 text-brand-purple-light mb-2 group-hover:scale-110 transition-transform" }),
                React.createElement('span', { className: "text-brand-purple-light font-bold text-sm" }, "Update Progress")
            )
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currency = projectData.criteria?.currency || 'USD';

    // Generate S-Curve based on current scale
    const generate = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Pass total budget to service
            const budgetTotal = projectData.criteria?.budget || 0;
            // Pass scale interval
            const sCurveReport = await generateSCurveReport(projectData.schedule, budgetTotal, scale);
            onUpdateProject({ sCurveReport });
        } catch (err) {
            setError(err.message || "Failed to generate S-Curve report.");
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger regeneration when scale changes or data is missing
    useEffect(() => {
        if (projectData.schedule && !isLoading) {
            // Check if current data matches selected scale, if not regenerate
            // (Simple check: if we switched to 'months' but have 300 points, probably need recalc)
            // Ideally we store 'currentInterval' in report, but for now just regenerate on scale change
            generate();
        }
    }, [scale]); // Re-run when scale changes

    const handleManualUpdate = (data) => {
        // In a real app, this would update the specific day's Actual Progress in the database/schedule
        // For this demo, we'll update the latest point in the local state to reflect the input
        if (projectData.sCurveReport?.sCurveData?.points) {
            const points = [...projectData.sCurveReport.sCurveData.points];
            // Find today or last point
            const lastIdx = points.length - 1; // Simplified
            points[lastIdx].actual = data.progress;
            points[lastIdx].ac = data.actualCost;
            
            const newReport = { 
                ...projectData.sCurveReport, 
                sCurveData: { ...projectData.sCurveReport.sCurveData, points } 
            };
            onUpdateProject({ sCurveReport: newReport });
        }
    };

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.sCurveReport) {
            const { sCurveData, analysis } = projectData.sCurveReport;
            return React.createElement(ResultsView, { 
                rawData: sCurveData, 
                analysis: analysis, 
                scale: scale, 
                showBars: showBars, 
                currency: currency,
                onOpenUpdateModal: () => setIsModalOpen(true)
            });
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
        ),
        React.createElement(UpdateStatusModal, {
            isOpen: isModalOpen,
            onClose: () => setIsModalOpen(false),
            onUpdate: handleManualUpdate
        })
    );
};

export default SCurveView;