

// components/BudgetView.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateProjectBudget } from '../services/budgetService.js';
import { BudgetIcon, Spinner, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';


const LoadingView = ({ progress }) => (
    React.createElement('div', { className: 'text-center flex flex-col items-center w-full max-w-lg' },
        React.createElement(BudgetIcon, { className: 'h-16 w-16 text-slate-500 animate-pulse' }),
        React.createElement('h2', { className: 'text-2xl font-bold mt-4 mb-2 text-brand-cyan' }, "Estimating your project's budget"),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is creating a smart budget breakdown with resources and expenses."),
        React.createElement(Spinner, {size: '12'})
    )
);

const ResultsView = ({ data, onDiscard, onSave }) => {
    const [forecastType, setForecastType] = useState('Basic');

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

    const summary = useMemo(() => {
        if (!data?.budgetItems) return { total: 0, labor: 0, material: 0, contingency: 0 };
        const totalLabor = data.budgetItems.reduce((sum, item) => sum + item.laborCost, 0);
        const totalMaterial = data.budgetItems.reduce((sum, item) => sum + item.materialsCost, 0);
        const totalContingency = data.budgetItems.reduce((sum, item) => sum + ((item.laborCost + item.materialsCost) * (item.contingencyPercent / 100)), 0);
        const totalProject = totalLabor + totalMaterial + totalContingency;
        return { total: totalProject, labor: totalLabor, material: totalMaterial, contingency: totalContingency };
    }, [data]);

    const SummaryCard = ({ title, value, icon, colorClass }) => (
        React.createElement('div', { className: 'bg-slate-800/50 p-4 rounded-lg flex items-center gap-4' },
            React.createElement('div', null,
                React.createElement('p', { className: 'text-slate-400 text-sm' }, title),
                React.createElement('p', { className: 'text-white text-2xl font-bold' }, formatCurrency(value))
            )
        )
    );

    return React.createElement('div', { className: 'w-full h-full flex flex-col' },
        React.createElement('div', { className: 'flex-shrink-0 flex justify-between items-center mb-6' },
            React.createElement('h2', { className: 'text-2xl font-bold' }, "AI-Powered Budget Estimation"),
            React.createElement('div', { className: 'flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg' },
                 ['Optimistic', 'Basic', 'Pessimistic'].map(type =>
                    React.createElement('button', {
                        key: type,
                        onClick: () => setForecastType(type),
                        className: `px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${forecastType === type ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`
                    }, type)
                )
            )
        ),
        React.createElement('div', { className: 'grid grid-cols-4 gap-4 mb-6' },
            React.createElement(SummaryCard, { title: 'Total Project Cost', value: summary.total }),
            React.createElement(SummaryCard, { title: 'Total Labor Cost', value: summary.labor }),
            React.createElement(SummaryCard, { title: 'Total Material Cost', value: summary.material }),
            React.createElement(SummaryCard, { title: 'Total Contingency', value: summary.contingency })
        ),
        React.createElement('div', { className: 'flex-grow overflow-y-auto bg-slate-800/50 rounded-lg' },
            React.createElement('table', { className: 'w-full text-sm text-left' },
                React.createElement('thead', null,
                    React.createElement('tr', { className: 'text-slate-400 border-b border-slate-700' },
                        ['Category', 'Description', 'Labor (hrs)', 'Labor Cost', 'Materials', 'Contingency', 'Total'].map(header =>
                            React.createElement('th', { key: header, className: 'p-3' }, header)
                        )
                    )
                ),
                React.createElement('tbody', null,
                    data.budgetItems?.map((item, index) => {
                        const itemContingency = (item.laborCost + item.materialsCost) * (item.contingencyPercent / 100);
                        const itemTotal = item.laborCost + item.materialsCost + itemContingency;
                        return React.createElement('tr', { key: index, className: 'border-b border-slate-700/50' },
                            React.createElement('td', { className: 'p-3 font-semibold' }, item.category),
                            React.createElement('td', { className: 'p-3 text-slate-300' }, item.description),
                            React.createElement('td', { className: 'p-3' }, item.laborHours > 0 ? item.laborHours.toLocaleString() : '–'),
                            React.createElement('td', { className: 'p-3' }, item.laborCost > 0 ? formatCurrency(item.laborCost) : '–'),
                            React.createElement('td', { className: 'p-3' }, item.materialsCost > 0 ? formatCurrency(item.materialsCost) : '–'),
                            React.createElement('td', { className: 'p-3' }, `${item.contingencyPercent}% (${formatCurrency(itemContingency)})`),
                            React.createElement('td', { className: 'p-3 font-semibold' }, formatCurrency(itemTotal))
                        );
                    })
                )
            )
        )
    );
};

const BudgetView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);

    useEffect(() => {
        if (projectData.objective && !projectData.budget && !isLoading) {
             const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const budget = await generateProjectBudget({
                        objectives: projectData.objective,
                        scope: "A standard project scope including planning, execution, and closure.",
                        currency: 'USD',
                        contingency: '15'
                    });
                    onUpdateProject({ budget });
                } catch (err) {
                    setError(err.message || "Failed to generate budget.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.objective, projectData.budget, isLoading, onUpdateProject, setIsLoading, setError]);


    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.budget) return React.createElement(ResultsView, { data: projectData.budget });
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

export default BudgetView;
