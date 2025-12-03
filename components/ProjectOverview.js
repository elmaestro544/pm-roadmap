
import React, { useMemo } from 'react';
import { FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- SVG Infographics Helper ---

const SimpleDonutChart = ({ data, size = 120, thickness = 10, colors }) => {
    const total = data.reduce((acc, val) => acc + val.value, 0);
    let startAngle = 0;
    const radius = size / 2;
    const innerRadius = radius - thickness;

    return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: "transform -rotate-90" },
        data.map((item, index) => {
            if (item.value === 0) return null;
            const sliceAngle = (item.value / total) * 360;
            const x1 = radius + innerRadius * Math.cos(Math.PI * startAngle / 180);
            const y1 = radius + innerRadius * Math.sin(Math.PI * startAngle / 180);
            const x2 = radius + radius * Math.cos(Math.PI * startAngle / 180);
            const y2 = radius + radius * Math.sin(Math.PI * startAngle / 180);
            
            const endAngle = startAngle + sliceAngle;
            const x3 = radius + radius * Math.cos(Math.PI * endAngle / 180);
            const y3 = radius + radius * Math.sin(Math.PI * endAngle / 180);
            const x4 = radius + innerRadius * Math.cos(Math.PI * endAngle / 180);
            const y4 = radius + innerRadius * Math.sin(Math.PI * endAngle / 180);

            const largeArc = sliceAngle > 180 ? 1 : 0;

            const pathData = [
                `M ${x1} ${y1}`,
                `L ${x2} ${y2}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3}`,
                `L ${x4} ${y4}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
                `Z`
            ].join(' ');

            startAngle += sliceAngle;
            return React.createElement('path', { key: index, d: pathData, fill: colors[index % colors.length] });
        }),
        // Center Text placeholder
        React.createElement('text', { 
            x: "50%", y: "50%", 
            textAnchor: "middle", dy: ".3em", 
            className: "text-xs fill-white font-bold transform rotate-90",
            style: { transformOrigin: "center" }
        }, total > 0 ? "100%" : "0%")
    );
};

// --- Widgets ---

const StatCard = ({ title, value, subtext, icon, trend }) => (
    React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 glow-border flex items-center justify-between' },
        React.createElement('div', null,
            React.createElement('p', { className: 'text-brand-text-light text-sm mb-1' }, title),
            React.createElement('h3', { className: 'text-2xl font-bold text-white' }, value),
            subtext && React.createElement('p', { className: 'text-xs text-brand-text-light mt-1' }, subtext)
        ),
        React.createElement('div', { className: 'flex flex-col items-end gap-2' },
            React.createElement('div', { className: 'p-3 bg-dark-bg rounded-lg text-brand-purple-light' }, icon),
            trend && React.createElement('span', { className: `text-xs font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}` }, 
                `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}%`
            )
        )
    )
);

const TaskStatusWidget = ({ schedule }) => {
    const statusData = useMemo(() => {
        if (!schedule) return { todo: 0, progress: 0, done: 0 };
        const tasks = schedule.filter(t => t.type !== 'project');
        return {
            todo: tasks.filter(t => t.progress === 0).length,
            progress: tasks.filter(t => t.progress > 0 && t.progress < 100).length,
            done: tasks.filter(t => t.progress === 100).length,
            total: tasks.length
        };
    }, [schedule]);

    if (!schedule) return React.createElement('div', { className: 'h-full flex items-center justify-center text-brand-text-light text-sm' }, "No schedule data");

    const data = [
        { name: 'Done', value: statusData.done },
        { name: 'In Progress', value: statusData.progress },
        { name: 'To Do', value: statusData.todo }
    ];
    const colors = ['#2DD4BF', '#FACC15', '#334155']; // Turquoise, Yellow, Slate

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full' },
        React.createElement('h4', { className: 'text-white font-bold mb-4 flex justify-between' }, 
            "Task Status",
            React.createElement('span', { className: 'text-xs font-normal text-brand-text-light bg-dark-bg px-2 py-1 rounded' }, `${statusData.total} Tasks`)
        ),
        React.createElement('div', { className: 'flex items-center gap-6' },
            React.createElement(SimpleDonutChart, { data, colors, size: 100, thickness: 15 }),
            React.createElement('div', { className: 'space-y-2 flex-grow' },
                data.map((item, i) => 
                    React.createElement('div', { key: i, className: 'flex justify-between items-center text-sm' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('div', { className: 'w-3 h-3 rounded-full', style: { backgroundColor: colors[i] } }),
                            React.createElement('span', { className: 'text-brand-text-light' }, item.name)
                        ),
                        React.createElement('span', { className: 'text-white font-bold' }, item.value)
                    )
                )
            )
        )
    );
};

const BudgetWidget = ({ budget, currency = 'USD' }) => {
    const budgetData = useMemo(() => {
        if (!budget?.budgetItems) return null;
        const labor = budget.budgetItems.reduce((acc, item) => acc + item.laborCost, 0);
        const material = budget.budgetItems.reduce((acc, item) => acc + item.materialsCost, 0);
        const total = labor + material; // Simplified for visual
        return { labor, material, total };
    }, [budget]);

    if (!budgetData) return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full flex items-center justify-center text-brand-text-light text-sm' }, "No budget data");

    const format = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, notation: "compact" }).format(v);

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full' },
        React.createElement('h4', { className: 'text-white font-bold mb-4' }, "Budget Breakdown"),
        React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
                React.createElement('div', { className: 'flex justify-between text-sm mb-1' },
                    React.createElement('span', { className: 'text-brand-text-light' }, "Labor"),
                    React.createElement('span', { className: 'text-white font-bold' }, format(budgetData.labor))
                ),
                React.createElement('div', { className: 'w-full bg-dark-bg rounded-full h-2' },
                    React.createElement('div', { className: 'bg-brand-pink h-2 rounded-full', style: { width: `${(budgetData.labor / budgetData.total) * 100}%` } })
                )
            ),
            React.createElement('div', null,
                React.createElement('div', { className: 'flex justify-between text-sm mb-1' },
                    React.createElement('span', { className: 'text-brand-text-light' }, "Material"),
                    React.createElement('span', { className: 'text-white font-bold' }, format(budgetData.material))
                ),
                React.createElement('div', { className: 'w-full bg-dark-bg rounded-full h-2' },
                    React.createElement('div', { className: 'bg-brand-cyan h-2 rounded-full', style: { width: `${(budgetData.material / budgetData.total) * 100}%` } })
                )
            ),
            React.createElement('div', { className: 'pt-4 mt-2 border-t border-dark-border flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-brand-text-light' }, "Total Est."),
                React.createElement('span', { className: 'text-lg font-bold text-white' }, format(budgetData.total))
            )
        )
    );
};

const RiskWidget = ({ risks }) => {
    const riskCounts = useMemo(() => {
        if (!risks?.risks) return { High: 0, Medium: 0, Low: 0 };
        return {
            High: risks.risks.filter(r => r.severity === 'High').length,
            Medium: risks.risks.filter(r => r.severity === 'Medium').length,
            Low: risks.risks.filter(r => r.severity === 'Low').length
        };
    }, [risks]);

    const maxVal = Math.max(riskCounts.High, riskCounts.Medium, riskCounts.Low, 1);

    if (!risks?.risks) return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full flex items-center justify-center text-brand-text-light text-sm' }, "No risk data");

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full flex flex-col' },
        React.createElement('h4', { className: 'text-white font-bold mb-4' }, "Risk Severity"),
        React.createElement('div', { className: 'flex-grow flex items-end justify-around gap-2 h-32 pb-2' },
            Object.entries(riskCounts).map(([key, count]) => {
                const heightPct = (count / maxVal) * 100;
                const color = key === 'High' ? 'bg-red-500' : key === 'Medium' ? 'bg-yellow-500' : 'bg-green-500';
                return React.createElement('div', { key: key, className: 'flex flex-col items-center gap-2 w-12' },
                    React.createElement('span', { className: 'text-xs font-bold text-white' }, count),
                    React.createElement('div', { className: `w-full rounded-t-md ${color} transition-all duration-500`, style: { height: `${heightPct}%` } }),
                    React.createElement('span', { className: 'text-xs text-brand-text-light' }, key)
                );
            })
        )
    );
};

const MilestonesWidget = ({ milestones }) => {
    if (!milestones || milestones.length === 0) return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full flex items-center justify-center text-brand-text-light text-sm' }, "No milestones defined");

    return React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 h-full overflow-hidden flex flex-col' },
        React.createElement('h4', { className: 'text-white font-bold mb-4' }, "Upcoming Milestones"),
        React.createElement('div', { className: 'flex-grow overflow-y-auto pr-2 space-y-3' },
            milestones.slice(0, 5).map((m, i) => 
                React.createElement('div', { key: i, className: 'flex gap-3 items-start p-2 rounded-lg hover:bg-dark-bg/50 transition-colors' },
                    React.createElement('div', { className: 'mt-1 w-2 h-2 rounded-full bg-brand-purple flex-shrink-0' }),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm font-semibold text-white' }, m.name),
                        React.createElement('p', { className: 'text-xs text-brand-text-light' }, `${m.durationInDays} days • 100%`)
                    )
                )
            )
        )
    );
};

// --- Main Overview Component ---

const ProjectOverview = ({ language, projectData }) => {
    const t = i18n[language];
    const currency = projectData?.criteria?.currency || 'USD';

    // Derived Summary Metrics
    const kpi = projectData?.kpiReport?.kpis || { overallProgress: 0, spi: 1, cpi: 1 };
    
    // Fallback if KPIs not generated but schedule exists
    const progress = kpi.overallProgress || (projectData.schedule ? 
        Math.round(projectData.schedule.reduce((acc, t) => acc + (t.progress || 0), 0) / Math.max(projectData.schedule.length, 1)) : 0);

    return React.createElement('div', { className: 'h-full flex flex-col bg-dark-card text-white printable-container' },
        React.createElement(FeatureToolbar, {
            title: t.dashboardOverview,
            containerRef: null,
            onExport: () => window.print()
        }),
        React.createElement('div', { className: 'flex-grow p-6 overflow-y-auto' },
            React.createElement('div', { className: 'printable-content max-w-7xl mx-auto space-y-6' },
                
                // Row 1: Key Metrics
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
                    React.createElement(StatCard, { 
                        title: "Overall Progress", 
                        value: `${progress}%`, 
                        subtext: kpi.spi ? `SPI: ${kpi.spi} | CPI: ${kpi.cpi}` : "Based on tasks",
                        icon: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" })),
                        trend: kpi.spi >= 1 ? 5 : -2
                    }),
                    React.createElement(StatCard, { 
                        title: "Total Tasks", 
                        value: projectData.schedule ? projectData.schedule.length : 0, 
                        subtext: "Across all phases",
                        icon: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }))
                    }),
                    React.createElement(StatCard, { 
                        title: "Active Risks", 
                        value: projectData.risk?.risks ? projectData.risk.risks.length : 0, 
                        subtext: "Identified threats",
                        icon: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }))
                    }),
                    React.createElement(StatCard, { 
                        title: "Team Size", 
                        value: projectData.plan?.workBreakdownStructure ? Math.round(projectData.plan.workBreakdownStructure.reduce((acc, t) => acc + (t.assigneeCount || 0), 0)) : 0, 
                        subtext: "Estimated resources",
                        icon: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }))
                    })
                ),

                // Row 2: Charts & Visuals (Adjustable Grid)
                React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6 h-80' },
                    React.createElement(TaskStatusWidget, { schedule: projectData.schedule }),
                    React.createElement(BudgetWidget, { budget: projectData.budget, currency }),
                    React.createElement(MilestonesWidget, { milestones: projectData.plan?.keyMilestones })
                ),

                // Row 3: Risks & Details
                React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 h-64' },
                    React.createElement(RiskWidget, { risks: projectData.risk }),
                    // Placeholder for future widget (e.g., S-Curve mini view)
                    React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-xl p-5 flex flex-col justify-center items-center text-center' },
                        React.createElement('div', { className: 'p-4 bg-dark-bg rounded-full mb-3' }, 
                            React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 text-brand-cyan", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }))
                        ),
                        React.createElement('h4', { className: 'text-white font-bold' }, "AI Insights Available"),
                        React.createElement('p', { className: 'text-sm text-brand-text-light mt-1 max-w-xs' }, "Visit the S-Curve and KPI sections for detailed predictive analysis.")
                    )
                )
            )
        )
    );
};

export default ProjectOverview;
