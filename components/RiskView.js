// components/RiskView.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { analyzeProjectRisks } from '../services/riskService.js';
import { RiskIcon, Spinner, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- Sub-Components ---
const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center' },
        React.createElement(RiskIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Analyzing Risks..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is scanning project data and identifying potential issues."),
        React.createElement(Spinner, { size: '12' })
    )
);

const EmptyState = () => (
    React.createElement('div', { className: 'text-center flex flex-col items-center justify-center h-full p-8' },
        React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: 'h-20 w-20 text-slate-600 mb-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1', strokeLinecap: 'round', strokeLinejoin: 'round' },
            React.createElement('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }),
            React.createElement('path', { d: 'm9 12 2 2 4-4' })
        ),
        React.createElement('h3', { className: 'text-xl font-semibold text-white' }, 'No risks detected for now'),
        React.createElement('p', { className: 'text-slate-400 mt-1 max-w-xs' }, 'AI has scanned your project data and found no critical risks at this moment. Stay assured—the system continuously monitors tasks.')
    )
);

const SummaryCard = ({ title, value, icon, color }) => (
    React.createElement('div', { className: 'bg-slate-800/50 p-4 rounded-lg flex items-center gap-4' },
        React.createElement('div', { className: `w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg`, style: { backgroundColor: color, boxShadow: `0 0 15px ${color}50` } }, icon),
        React.createElement('div', null,
            React.createElement('p', { className: 'text-slate-400 text-sm' }, title),
            React.createElement('p', { className: 'text-white text-2xl font-bold' }, value)
        )
    )
);

const RiskDetailView = ({ risk, onBack }) => {
    const severityColors = {
        High: 'bg-red-500 text-red-100',
        Medium: 'bg-yellow-500 text-yellow-100',
        Low: 'bg-green-500 text-green-100',
    };
    return React.createElement('div', { className: 'p-4 animate-fade-in-up h-full overflow-y-auto' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
             React.createElement('h4', { className: 'font-bold text-lg text-white' }, `${risk.id}: ${risk.title}`),
             React.createElement('button', { onClick: onBack, className: 'text-sm text-slate-300 hover:text-white' }, '← Back to list')
        ),
        React.createElement('div', { className: 'flex items-center gap-4 text-xs mb-4' },
            React.createElement('span', { className: `px-2 py-0.5 rounded-full ${severityColors[risk.severity]}`}, risk.severity),
            React.createElement('span', { className: 'text-slate-400' }, `Project: ${risk.projectName}`),
            React.createElement('span', { className: 'text-slate-400' }, `Identified: ${risk.date}`)
        ),
        React.createElement('p', { className: 'text-slate-300 mb-6' }, risk.description),
        React.createElement('h5', { className: 'font-semibold text-white mb-3' }, "Mitigation Strategies"),
        React.createElement('div', { className: 'space-y-4' }, risk.mitigationStrategies.map((strategy, index) =>
            React.createElement('div', { key: index, className: 'bg-slate-900/50 p-4 rounded-lg' },
                React.createElement('div', { className: 'flex justify-between items-start' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'font-semibold text-white' }, strategy.name),
                        React.createElement('p', { className: 'text-sm text-slate-400 mt-1' }, strategy.description)
                    ),
                    React.createElement('button', { className: 'bg-button-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-md flex-shrink-0 ml-4' }, 'Apply')
                )
            )
        ))
    );
};


const RiskListView = ({ risks, onSelectRisk }) => {
    const severityColors = {
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    return React.createElement('div', { className: 'p-1 animate-fade-in-up h-full overflow-y-auto' },
        React.createElement('div', { className: 'space-y-2' }, risks.map(risk =>
            React.createElement('div', { key: risk.id, className: 'grid grid-cols-[auto,1fr,auto,auto,auto] items-center gap-4 p-2 rounded-md hover:bg-slate-800/50' },
                React.createElement('input', { type: 'checkbox', className: 'w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-purple focus:ring-brand-purple' }),
                React.createElement('div', null,
                    React.createElement('p', { className: 'font-semibold text-white truncate' }, risk.title),
                    React.createElement('p', { className: 'text-xs text-slate-400' }, `Project: ${risk.projectName} | ${risk.date}`)
                ),
                React.createElement('span', { className: `text-xs font-semibold px-2 py-0.5 rounded-full border ${severityColors[risk.severity]}` }, risk.severity),
                React.createElement('button', { onClick: () => onSelectRisk(risk.id), className: 'text-sm bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-1.5 rounded-md' }, "View"),
                React.createElement('div', { className: 'w-8 h-8 rounded-full bg-slate-700' }) // Placeholder for avatar
            )
        ))
    );
};

const RiskMatrix = ({ risks }) => {
    const likelihoods = ['Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'];
    const impacts = ['Critical', 'Major', 'Moderate', 'Minor'];
    
    const matrixData = useMemo(() => {
        const grid = Object.fromEntries(impacts.map(i => [i, Object.fromEntries(likelihoods.map(l => [l, []]))]));
        risks.forEach(risk => {
            if (grid[risk.impact] && grid[risk.impact][risk.likelihood]) {
                grid[risk.impact][risk.likelihood].push(risk);
            }
        });
        return grid;
    }, [risks]);

    const getColor = (impact, likelihood) => {
        const impactIndex = impacts.indexOf(impact);
        const likelihoodIndex = likelihoods.indexOf(likelihood);
        if (impactIndex <= 1 && likelihoodIndex <= 1) return 'bg-red-900/80 border-red-700'; // Critical/Major, Certain/Likely
        if (impactIndex <= 2 && likelihoodIndex <= 2) return 'bg-yellow-900/80 border-yellow-700'; // Moderate/Possible
        return 'bg-green-900/80 border-green-700';
    };

    return React.createElement('div', { className: 'bg-slate-800/50 p-4 rounded-lg' },
        React.createElement('h3', { className: 'font-bold text-white mb-4' }, 'Risk Matrix'),
        React.createElement('div', { className: 'grid gap-1', style: { gridTemplateColumns: `100px repeat(${likelihoods.length}, 1fr)` } },
            React.createElement('div', null),
            likelihoods.map(l => React.createElement('div', { key: l, className: 'text-xs font-semibold text-slate-400 text-center' }, l)),
            impacts.map(impact =>
                React.createElement(React.Fragment, { key: impact },
                    React.createElement('div', { className: 'text-xs font-semibold text-slate-400 flex items-center justify-end pr-2' }, impact),
                    likelihoods.map(likelihood => {
                        const cellRisks = matrixData[impact][likelihood];
                        return React.createElement('div', {
                            key: `${impact}-${likelihood}`,
                            className: `h-20 p-2 rounded-md border text-xs ${getColor(impact, likelihood)} overflow-hidden relative`
                        },
                            cellRisks.length > 0 &&
                            React.createElement(React.Fragment, null,
                                React.createElement('div', { className: 'font-bold text-white' }, cellRisks.length),
                                React.createElement('p', { className: 'text-slate-300 mt-1 truncate' }, cellRisks[0].title),
                                cellRisks.length > 1 && React.createElement('div', { className: 'absolute bottom-1 right-1 text-xs bg-slate-900/50 px-1 rounded' }, `+${cellRisks.length-1}`)
                            )
                        );
                    })
                )
            )
        )
    );
};


const ResultsView = ({ data }) => {
    const [selectedRiskId, setSelectedRiskId] = useState(null);
    const risks = data.risks || [];

    const summary = useMemo(() => {
        const high = risks.filter(r => r.severity === 'High').length;
        const medium = risks.filter(r => r.severity === 'Medium').length;
        return { total: risks.length, high, medium, closed: 0 };
    }, [risks]);

    const selectedRisk = useMemo(() => risks.find(r => r.id === selectedRiskId), [risks, selectedRiskId]);

    return React.createElement('div', { className: 'w-full h-full flex flex-col gap-6 animate-fade-in-up' },
        // Main Content Grid
        React.createElement('div', { className: 'flex-grow grid grid-cols-3 grid-rows-[auto,1fr] gap-6 min-h-0' },
            // Risk Analysis Panel
            React.createElement('div', { className: 'col-span-3 lg:col-span-2 row-span-2 bg-slate-800/50 p-4 rounded-lg flex flex-col' },
                React.createElement('h3', { className: 'font-bold text-white mb-4 flex-shrink-0' }, 'Risk Analysis & Recommendations'),
                React.createElement('div', { className: 'flex-grow min-h-0' },
                    risks.length === 0 
                        ? React.createElement(EmptyState, null)
                        : selectedRisk 
                            ? React.createElement(RiskDetailView, { risk: selectedRisk, onBack: () => setSelectedRiskId(null) })
                            : React.createElement(RiskListView, { risks: risks, onSelectRisk: setSelectedRiskId })
                )
            ),
            // Summary Cards
            React.createElement('div', { className: 'col-span-3 lg:col-span-1 grid grid-cols-2 gap-4' },
                React.createElement(SummaryCard, { title: 'Total Risks', value: summary.total, icon: '!', color: '#4F46E5' }),
                React.createElement(SummaryCard, { title: 'High Severity', value: summary.high, icon: '▲', color: '#DC2626' }),
                React.createElement(SummaryCard, { title: 'Medium Severity', value: summary.medium, icon: '●', color: '#F59E0B' }),
                React.createElement(SummaryCard, { title: 'Closed Risks', value: summary.closed, icon: '✓', color: '#16A34A' })
            ),
            // Risk Matrix
            React.createElement('div', { className: 'col-span-3 lg:col-span-1 min-h-0 overflow-y-auto' },
                 React.createElement(RiskMatrix, { risks: risks })
            )
        )
    );
};


const RiskView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    
    useEffect(() => {
        if (projectData.objective && !projectData.risk && !isLoading) {
             const generate = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const risk = await analyzeProjectRisks(projectData.objective);
                    onUpdateProject({ risk });
                } catch (err) {
                    setError(err.message || "Failed to generate risk analysis.");
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [projectData.objective, projectData.risk, isLoading, onUpdateProject, setIsLoading, setError]);


    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (projectData.risk) return React.createElement(ResultsView, { data: projectData.risk });
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

export default RiskView;
