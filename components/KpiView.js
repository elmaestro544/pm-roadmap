// components/KpiView.js

import React, { useState, useEffect, useRef } from 'react';
import { generateKpiReport } from '../services/kpiService.js';
import { KpiIcon, Spinner, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- Sub-Components ---

const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(KpiIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Calculating KPIs..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is analyzing your schedule and budget to generate performance metrics."),
        React.createElement(Spinner, { size: '12' })
    )
);

const RadialProgress = ({ progress, size = 120, strokeWidth = 10, color = '#2DD4BF' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: 'transform -rotate-90' },
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
            style: { transition: 'stroke-dashoffset 0.5s ease-out' }
        }),
        React.createElement('text', {
            x: '50%', y: '50%',
            textAnchor: 'middle',
            dy: '.3em',
            className: 'text-2xl font-bold fill-white transform rotate-90',
            style: { transformOrigin: 'center' }
        }, `${progress}%`)
    );
};


const KpiCard = ({ title, value, unit, description, color = 'text-brand-purple-light' }) => (
    React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border' },
        React.createElement('p', { className: 'text-brand-text-light' }, title),
        React.createElement('p', { className: `text-4xl font-bold my-2 ${color}` }, value, React.createElement('span', { className: 'text-lg' }, ` ${unit}`)),
        React.createElement('p', { className: 'text-sm text-brand-text-light' }, description)
    )
);

const ResultsView = ({ data }) => {
    const { kpis, analysis } = data;

    const spiColor = kpis.spi >= 1.0 ? 'text-green-400' : 'text-red-400';
    const cpiColor = kpis.cpi >= 1.0 ? 'text-green-400' : 'text-red-400';
    const svColor = kpis.scheduleVariance >= 0 ? 'text-green-400' : 'text-red-400';
    const cvColor = kpis.costVariance >= 0 ? 'text-green-400' : 'text-red-400';

    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
            React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border flex flex-col items-center justify-center' },
                React.createElement('p', { className: 'text-brand-text-light mb-4' }, 'Overall Progress'),
                React.createElement(RadialProgress, { progress: kpis.overallProgress })
            ),
            React.createElement(KpiCard, { title: 'Schedule Performance', value: kpis.spi, unit: 'SPI', description: kpis.spi >= 1.0 ? 'Ahead of schedule' : 'Behind schedule', color: spiColor }),
            React.createElement(KpiCard, { title: 'Cost Performance', value: kpis.cpi, unit: 'CPI', description: kpis.cpi >= 1.0 ? 'Under budget' : 'Over budget', color: cpiColor }),
            React.createElement(KpiCard, { title: 'Budget At Completion', value: kpis.budgetAtCompletion.toLocaleString('en-US'), unit: 'USD', description: 'Total planned budget' })
        ),
        React.createElement('div', { className: 'flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6' },
            React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border' },
                 React.createElement('h3', { className: 'text-lg font-bold text-white mb-4' }, 'AI-Powered Insights'),
                 React.createElement('div', { className: 'space-y-4' },
                     React.createElement('div', null,
                        React.createElement('p', { className: 'font-semibold text-brand-purple-light' }, 'Project Health Summary'),
                        React.createElement('p', { className: 'text-brand-text-light' }, analysis.summary)
                     ),
                      React.createElement('div', null,
                        React.createElement('p', { className: 'font-semibold text-brand-purple-light' }, 'Actionable Recommendation'),
                        React.createElement('p', { className: 'text-brand-text-light' }, analysis.recommendation)
                     )
                 )
            ),
             React.createElement('div', { className: 'bg-dark-card-solid p-6 rounded-xl border border-dark-border glow-border grid grid-cols-2 gap-6' },
                React.createElement(KpiCard, { title: 'Schedule Variance', value: kpis.scheduleVariance.toLocaleString('en-US'), unit: 'USD', description: 'Difference between earned & planned value', color: svColor }),
                React.createElement(KpiCard, { title: 'Cost Variance', value: kpis.costVariance.toLocaleString('en-US'), unit: 'USD', description: 'Difference between earned value & actual cost', color: cvColor }),
                React.createElement(KpiCard, { title: 'Planned Duration', value: kpis.plannedDuration, unit: 'Days', description: 'Total scheduled project duration' }),
                React.createElement('div', { className: 'bg-dark-card p-6 rounded-xl' }, 'Chart placeholder')
            )
        )
    );
};


const KpiView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    
    useEffect(() => {
        if (projectData.schedule && projectData.budget && !projectData.kpiReport && !isLoading) {
             const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const kpiReport = await generateKpiReport(projectData.schedule, projectData.budget);
                    onUpdateProject({ kpiReport });
                } catch (err) {
                    setError(err.message || "Failed to generate KPI report.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.schedule, projectData.budget, projectData.kpiReport, isLoading, onUpdateProject, setIsLoading, setError]);


    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.kpiReport) return React.createElement(ResultsView, { data: projectData.kpiReport });
        return React.createElement(LoadingView, null);
    };

    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
            React.createElement('div', {
               ref: fullscreenRef,
               className: 'p-6 printable-content h-full flex flex-col',
            },
                React.createElement('div', { className: 'h-full flex items-center justify-center' }, renderContent())
            )
        )
    );
};

export default KpiView;
