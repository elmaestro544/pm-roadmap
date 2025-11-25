
// components/StructureView.js

import React, { useState, useEffect, useRef } from 'react';
import { generateProjectStructure } from '../services/structureService.js';
import { StructureIcon, Spinner, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- Sub-Components ---

const InputView = ({ onGenerate, objective, setObjective, isLoading, error }) => (
    React.createElement('div', { className: 'text-center flex flex-col items-center animate-fade-in-up' },
        React.createElement(StructureIcon, { className: 'h-16 w-16 text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Visualize Project Structure"),
        React.createElement('p', { className: 'max-w-2xl text-slate-400 mb-6' }, "Describe your project's objective below. AI will analyze it and generate a hierarchical blueprint, breaking it down into a clear, visual skeleton of its core components."),
        
        React.createElement('div', { className: 'w-full max-w-2xl' },
             React.createElement('textarea', {
                value: objective,
                onChange: e => setObjective(e.target.value),
                placeholder: 'e.g., Build a cross-platform mobile application for a local library system that includes user authentication, a searchable book catalog with real-time availability, and a feature for reserving books.',
                rows: 4,
                className: 'w-full p-4 bg-dark-card-solid border border-dark-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:outline-none resize-none text-white',
                disabled: isLoading,
            }),
            error && React.createElement('p', { className: 'text-red-400 mt-2 text-sm' }, `Error: ${error}`),
            React.createElement('button', {
                onClick: onGenerate,
                disabled: isLoading || !objective.trim(),
                className: "w-full mt-4 px-6 py-3 font-semibold text-white bg-cta-gradient rounded-lg shadow-lg shadow-glow-purple transition-opacity transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
            }, isLoading ? React.createElement(Spinner, {size: '6'}) : "Generate Project Skeleton")
        )
    )
);


const LoadingView = () => (
     React.createElement('div', { className: 'text-center flex flex-col items-center animate-fade-in-up' },
        React.createElement(StructureIcon, { className: 'h-16 w-16 animate-pulse text-slate-500' }),
        React.createElement('h2', { className: 'text-3xl font-bold mt-4 mb-2 text-white' }, "Building Project Blueprint..."),
        React.createElement('p', { className: 'text-slate-400 mb-8' }, "AI is analyzing the project's core components and relationships."),
        React.createElement(Spinner, { size: '12' })
    )
);

const ProjectTree = ({ node, layout }) => {
    const nodeTypeColors = {
        'Project': 'bg-brand-purple text-white',
        'Phase': 'bg-brand-pink/20 text-brand-pink',
        'Module': 'bg-brand-cyan/20 text-brand-cyan',
        'Feature': 'bg-sky-500/20 text-sky-400',
        'Component': 'bg-slate-700/50 text-slate-300',
        'default': 'bg-slate-800 text-slate-200'
    };
    
    const colorClass = nodeTypeColors[node.type] || nodeTypeColors['default'];

    const getChildrenUlClassName = () => {
        if (layout !== 'optimized') {
            return '';
        }
    
        // In optimized mode, Project's children (Phases) are laid out side-by-side (horizontally).
        // All other children (Modules, Components) are stacked (vertically).
        if (node.type === 'Project') {
            return 'layout-section-horizontal';
        } else {
            return 'layout-section-vertical';
        }
    };

    const hasChildren = node.children && node.children.length > 0;

    return (
        React.createElement('li', null,
            React.createElement('div', { className: 'node-content' },
                React.createElement('h4', { className: 'font-bold text-white' }, node.name),
                React.createElement('span', { className: `text-xs font-semibold px-2 py-0.5 rounded-full self-start ${colorClass}` }, node.type)
            ),
            hasChildren && (
                React.createElement('ul', { className: getChildrenUlClassName() },
                    node.children.map((child, index) => React.createElement(ProjectTree, { key: index, node: child, layout: layout }))
                )
            )
        )
    );
};


const ResultsView = ({ data, onReset }) => {
    const [layout, setLayout] = useState('optimized'); // 'vertical', 'horizontal', or 'optimized'
    
    return React.createElement('div', { className: 'w-full h-full flex flex-col items-start animate-fade-in-up' },
         React.createElement('div', { className: 'w-full flex justify-between items-center mb-8' },
            React.createElement('h2', { className: 'text-2xl font-bold text-white' }, data.projectName),
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'flex items-center p-0.5 bg-dark-card-solid rounded-md' },
                    ['Vertical', 'Horizontal', 'Optimized'].map(mode =>
                        React.createElement('button', {
                            key: mode,
                            onClick: () => setLayout(mode.toLowerCase()),
                            className: `px-3 py-1 text-sm rounded-sm transition-colors ${layout === mode.toLowerCase() ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`
                        }, mode)
                    )
                ),
                React.createElement('button', {
                    onClick: onReset,
                    className: 'px-4 py-2 font-semibold text-white bg-dark-card-solid hover:bg-white/10 border border-dark-border rounded-lg'
                }, 'Generate New')
            )
        ),
        React.createElement('style', {
            dangerouslySetInnerHTML: {
                __html: `
                    .tree-container {
                        width: 100%;
                        overflow: auto;
                        padding: 2rem;
                        background-color: rgba(13, 12, 19, 0.5);
                        border-radius: 12px;
                        border: 1px solid rgba(45, 212, 191, 0.1);
                    }
                    .tree {
                        display: inline-flex;
                        min-width: 100%;
                    }
                    .tree, .tree ul, .tree li {
                        position: relative;
                    }
                    .tree ul {
                        display: flex;
                    }
                    .tree li {
                        list-style: none;
                        display: flex;
                    }

                    /* --- Node Styling --- */
                    .node-content {
                        border: 1px solid rgba(45, 212, 191, 0.2);
                        padding: 12px 20px;
                        background: #14121E;
                        border-radius: 8px;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                        min-width: 220px;
                        text-align: left;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        position: relative;
                        z-index: 1;
                        white-space: normal;
                    }
                    
                    /* --- Vertical Layout (children are side-by-side) --- */
                    .tree-vertical { flex-direction: column; align-items: center; }
                    .tree-vertical ul { flex-direction: row; padding-top: 40px; }
                    .tree-vertical li { flex-direction: column; align-items: center; flex-grow: 1; padding: 0 10px; }
                    .tree-vertical li:not(:only-child)::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background-color: #374151; }
                    .tree-vertical li:first-child::before { left: 50%; width: 50%; }
                    .tree-vertical li:last-child::before { width: 50%; }
                    .tree-vertical li::after { content: ''; position: absolute; top: 0; left: 50%; width: 2px; height: 40px; background-color: #374151; transform: translateX(-50%); }
                    .tree-vertical > li::before, .tree-vertical > li::after { display: none; }
                    .tree-vertical li > .node-content::after { content: ''; position: absolute; top: 100%; left: 50%; width: 2px; height: 40px; background-color: #374151; transform: translateX(-50%); }
                    .tree-vertical li:not(:has(> ul)) > .node-content::after { display: none; }

                    /* --- Horizontal Layout (children are stacked) --- */
                    .tree-horizontal { flex-direction: row; align-items: flex-start; }
                    .tree-horizontal ul { flex-direction: column; padding-left: 40px; justify-content: center; }
                    .tree-horizontal li { flex-direction: row; align-items: center; padding: 10px 0; }
                    .tree-horizontal li > .node-content::after { content: ''; position: absolute; top: 50%; left: 100%; width: 20px; height: 2px; background-color: #374151; }
                    .tree-horizontal li:not(:has(> ul)) > .node-content::after { display: none; }
                    .tree-horizontal ul::before { content: ''; position: absolute; top: 0; left: 20px; width: 2px; height: 100%; background-color: #374151; }
                    .tree-horizontal ul li::before { content: ''; position: absolute; top: 50%; left: 0; width: 20px; height: 2px; background-color: #374151; }
                    .tree-horizontal > li::before, .tree-horizontal > li::after { display: none; }
                    .tree-horizontal ul li:first-child::after { content: ''; position: absolute; top: 0; left: 20px; height: 50%; width: 2px; background-color: #14121E; z-index: 0; }
                    .tree-horizontal ul li:last-child::after { content: ''; position: absolute; top: 50%; left: 20px; height: 50%; width: 2px; background-color: #14121E; z-index: 0; }
                    .tree-horizontal ul li:only-child::after { display: none; }

                    /* --- Optimized Layout Specifics --- */
                    .tree-optimized { flex-direction: column; align-items: center; }
                    .tree-optimized > li { flex-direction: column; align-items: center; }
                    .tree-optimized > li > .node-content::after { content: ''; position: absolute; top: 100%; left: 50%; width: 2px; height: 40px; background-color: #374151; transform: translateX(-50%); }
                    .tree-optimized > li:not(:has(> ul)) > .node-content::after { display: none; }

                    /* This section should lay out its children HORIZONTALLY (side-by-side) -> Vertical Tree Style */
                    .tree-optimized .layout-section-horizontal { flex-direction: row; padding-top: 40px; }
                    .tree-optimized .layout-section-horizontal > li { flex-direction: column; align-items: center; flex-grow: 1; padding: 0 10px; }
                    .tree-optimized .layout-section-horizontal > li:not(:only-child)::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background-color: #374151; }
                    .tree-optimized .layout-section-horizontal > li:first-child::before { left: 50%; width: 50%; }
                    .tree-optimized .layout-section-horizontal > li:last-child::before { width: 50%; }
                    .tree-optimized .layout-section-horizontal > li::after { content: ''; position: absolute; top: 0; left: 50%; width: 2px; height: 40px; background-color: #374151; transform: translateX(-50%); }

                    /* This section should lay out its children VERTICALLY (stacked) -> Horizontal Tree Style */
                    .tree-optimized .layout-section-vertical { flex-direction: column; padding-left: 40px; justify-content: center; }
                    .tree-optimized .layout-section-vertical > li { flex-direction: row; align-items: center; padding: 10px 0; }
                    .tree-optimized .layout-section-vertical::before { content: ''; position: absolute; top: 0; left: 20px; width: 2px; height: 100%; background-color: #374151; }
                    .tree-optimized .layout-section-vertical > li::before { content: ''; position: absolute; top: 50%; left: 0; width: 20px; height: 2px; background-color: #374151; }
                    .tree-optimized .layout-section-vertical > li:first-child::after { content: ''; position: absolute; top: 0; left: 20px; height: 50%; width: 2px; background-color: #14121E; z-index: 0; }
                    .tree-optimized .layout-section-vertical > li:last-child::after { content: ''; position: absolute; top: 50%; left: 20px; height: 50%; width: 2px; background-color: #14121E; z-index: 0; }
                    .tree-optimized .layout-section-vertical > li:only-child::after { display: none; }
                    .tree-optimized .layout-section-vertical > li::after { content: none; }
                `
            }
        }),
        React.createElement('div', { className: 'tree-container' },
            React.createElement('ul', { className: `tree tree-${layout}` },
                React.createElement(ProjectTree, { node: data.root, layout: layout })
            )
        )
    );
};


const StructureView = ({ language, projectData, onUpdateProject, isLoading, setIsLoading, error, setError }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const contentRef = useRef(null);
    const [objective, setObjective] = useState('');

    // Toolbar state and handlers
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isEditing, setIsEditing] = useState(false);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleToggleEdit = () => setIsEditing(prev => !prev);
    const handleExport = () => window.print();

    const handleGenerate = async () => {
        if (!objective.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateProjectStructure(objective);
            onUpdateProject({ structure: data }); // Save to parent
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        onUpdateProject({ structure: null });
        setError(null);
        setObjective('');
    };
    
    const hasStructure = !!projectData.structure;

    const renderContent = () => {
        if (isLoading) return React.createElement(LoadingView, null);
        if (hasStructure) return React.createElement(ResultsView, { data: projectData.structure, onReset: handleReset });
        
        return React.createElement(InputView, {
                    onGenerate: handleGenerate,
                    objective: objective,
                    setObjective: setObjective,
                    isLoading: false,
                    error: error,
                });
    };
    
    return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col text-white bg-dark-card printable-container" },
        React.createElement(FeatureToolbar, {
            title: t.dashboardStructure,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onToggleEdit: handleToggleEdit,
            isEditing: isEditing,
            onExport: handleExport,
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-auto' },
            React.createElement('div', {
               ref: contentRef,
               className: 'p-6 printable-content h-full',
               style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' },
               contentEditable: isEditing,
               suppressContentEditableWarning: true
            },
                hasStructure
                    ? renderContent()
                    : React.createElement('div', { className: 'h-full w-full flex items-center justify-center' }, renderContent())
            )
        )
    );
};

export default StructureView;
