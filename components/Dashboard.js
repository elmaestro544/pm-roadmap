



import React, { useState, useEffect } from 'react';
import { i18n, DASHBOARD_VIEWS } from '../constants.js';
import AssistantView from './SciGeniusChat.js';
import AuthRequired from './AuthRequired.js';
import UpgradeRequired from './UpgradeRequired.js';
import PlanningView from './PlanningView.js';
import SchedulingView from './SchedulingView.js';
import RiskView from './RiskView.js';
import BudgetView from './BudgetView.js';
import AgentView from './AgentView.js';
import StructureView from './StructureView.js';
import KpiView from './KpiView.js';
import SCurveView from './SCurveView.js';
import ComprehensivePlanView from './ComprehensivePlanView.js';
import { UserIcon, SidebarToggleIcon, Logo, Spinner, HistoryIcon, PlusIcon } from './Shared.js';
import { getUserProjects, getProjectDetails, saveProject } from '../services/supabaseClient.js';

const WORKFLOW_ORDER = ['consultingPlan', 'planning', 'scheduling', 'budget', 'risk', 'kpis', 'scurve', 'structure', 'agents', 'assistant'];

const PREREQUISITES = {
    planning: 'objective', // Planning needs an objective (which comes from Consulting Plan or manual entry)
    scheduling: 'plan',
    budget: 'objective',
    risk: 'objective',
    structure: 'objective',
    kpis: 'budget', // also needs schedule, but budget is a good gate
    scurve: 'schedule',
};

const PrerequisiteView = ({ missing, language, onViewChange }) => {
    return React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center p-8" },
        React.createElement('div', { className: "bg-dark-card-solid border border-dark-border p-8 rounded-2xl max-w-md shadow-2xl" },
            React.createElement('h3', { className: "text-2xl font-bold text-white mb-2" }, "Step Locked"),
            React.createElement('p', { className: "text-brand-text-light mb-6" }, 
                missing === 'objective' 
                ? "Please complete the 'Project Plan' step first to define your project scope and objectives." 
                : `Please complete the '${missing}' step before accessing this section.`
            ),
            missing === 'objective' && React.createElement('button', {
                onClick: () => onViewChange('consultingPlan'),
                className: "px-6 py-2 bg-button-gradient text-white rounded-lg font-semibold hover:opacity-90"
            }, "Go to Project Plan")
        )
    );
};

const ProjectHeader = ({ language, objective, onReset, onNext, onPrev, activeView }) => {
    const t = i18n[language];
    return React.createElement('div', { className: 'non-printable flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-dark-border bg-dark-card/50' },
        React.createElement('div', { className: 'flex-grow min-w-0 mr-4' },
            React.createElement('h2', { className: 'text-xs font-semibold text-brand-text-light uppercase tracking-wider' }, 'Current Project Scope'),
            React.createElement('p', { className: 'text-white truncate font-semibold text-sm', title: objective }, objective || "Start by creating a Project Plan")
        ),
        React.createElement('div', { className: 'flex items-center gap-2 flex-shrink-0' },
            React.createElement('button', { onClick: onPrev, disabled: WORKFLOW_ORDER.indexOf(activeView) === 0, className: 'p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white disabled:opacity-50' }, '‹ Prev'),
            React.createElement('button', { onClick: onNext, disabled: WORKFLOW_ORDER.indexOf(activeView) === WORKFLOW_ORDER.length - 1, className: 'px-4 py-2 text-sm font-semibold bg-button-gradient text-white rounded-md transition-opacity hover:opacity-90 disabled:opacity-50' }, 'Next ›'),
            React.createElement('div', { className: 'w-px h-6 bg-dark-border mx-2' }),
            React.createElement('button', { onClick: onReset, className: 'text-sm font-semibold text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-md' }, 'New Project')
        )
    );
};

const ProjectHistoryList = ({ onSelectProject, projects, language }) => {
    return React.createElement('div', { className: 'p-4 border-t border-dark-border overflow-y-auto max-h-48' },
        React.createElement('h4', { className: 'text-xs font-semibold text-brand-text-light uppercase tracking-wider mb-2' }, "Your Projects"),
        projects.length === 0 ? React.createElement('p', { className: 'text-xs text-slate-500' }, "No saved projects") : 
        projects.map(p => React.createElement('button', {
            key: p.id,
            onClick: () => onSelectProject(p.id),
            className: 'w-full text-left p-2 rounded-md hover:bg-white/5 mb-1 group transition-colors'
        },
            React.createElement('p', { className: 'text-sm font-medium text-white truncate' }, p.title || "Untitled Project"),
            React.createElement('p', { className: 'text-xs text-slate-500' }, new Date(p.updated_at).toLocaleDateString())
        ))
    );
}

const Sidebar = ({ language, activeView, setActiveView, isExpanded, setExpanded, onLogout, currentUser, projectData, onSelectProject, projects }) => {
    const t = i18n[language];

    const getButtonClasses = (isActive, isDisabled) => {
        const baseClasses = `w-full flex items-center gap-4 text-left rounded-lg transition-all duration-200 ease-in-out relative`;
        const paddingClass = isExpanded ? 'px-4 py-3' : 'p-3 justify-center';
        const languageClass = language === 'ar' ? 'flex-row-reverse' : '';

        let stateClasses;
        if (isDisabled) {
            stateClasses = 'text-slate-600 cursor-not-allowed';
        } else if (isActive) {
            stateClasses = 'bg-brand-purple/20 text-white font-semibold border-l-4 border-brand-purple-light';
        } else {
            stateClasses = 'text-brand-text-light hover:bg-white/10 hover:text-white border-l-4 border-transparent';
        }
        
        return {
            className: `${baseClasses} ${paddingClass} ${languageClass} ${stateClasses}`,
        };
    };

    return React.createElement('aside', {
        className: `relative flex-shrink-0 bg-dark-card-solid flex flex-col transition-all duration-300 ease-in-out sidebar-glow border-r border-dark-border ${isExpanded ? 'w-72' : 'w-20'}`
    },
        React.createElement('div', { className: 'flex-grow p-4 space-y-2 overflow-y-auto mt-4' },
            DASHBOARD_VIEWS.map(view => {
                const Icon = view.icon;
                const isActive = activeView === view.id;
                const prerequisite = PREREQUISITES[view.id];
                const isDisabled = !!prerequisite && !projectData[prerequisite];
                const { className } = getButtonClasses(isActive, isDisabled);

                return React.createElement('div', { key: view.id, className: "relative group" },
                    React.createElement('button', {
                        onClick: () => !isDisabled && setActiveView(view.id),
                        className: className,
                        disabled: isDisabled,
                    },
                        React.createElement(Icon, { className: `h-5 w-5 flex-shrink-0` }),
                        isExpanded && React.createElement('span', { className: 'truncate text-sm' }, t[view.titleKey])
                    ),
                    !isExpanded && React.createElement('div', {
                        className: `absolute top-1/2 -translate-y-1/2 left-full ml-4 px-2 py-1 bg-dark-card-solid text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-dark-border ${language === 'ar' ? 'right-full mr-4 left-auto' : ''}`
                    }, t[view.titleKey])
                )
            })
        ),
        
        isExpanded && React.createElement(ProjectHistoryList, { projects, onSelectProject, language }),

        React.createElement('div', { className: 'p-4 border-t border-dark-border' },
            React.createElement('button', {
                onClick: () => setExpanded(!isExpanded),
                'aria-label': isExpanded ? 'Collapse sidebar' : 'Expand sidebar',
                className: `w-full flex items-center gap-4 text-left rounded-lg transition-all duration-200 ease-in-out relative text-brand-text-light hover:bg-white/10 hover:text-white ${isExpanded ? 'px-4 py-2' : 'p-2 justify-center'} ${language === 'ar' ? 'flex-row-reverse' : ''}`
            },
                React.createElement(SidebarToggleIcon, { isExpanded: isExpanded }),
                isExpanded && React.createElement('span', { className: 'truncate text-sm' }, 'Collapse Sidebar')
            )
        )
    );
};


const Dashboard = ({ language, setView, currentUser, onLogout, onLoginClick }) => {
  const [activeView, setActiveView] = useState('consultingPlan');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [projectData, setProjectData] = useState({});
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const t = i18n[language];
  
  if (!currentUser) {
      return React.createElement('div', {className: 'container mx-auto p-4 md:p-8'}, React.createElement(AuthRequired, { language, onLoginClick }));
  }

  // Fetch list of projects on load
  useEffect(() => {
    const fetchProjects = async () => {
        if (currentUser?.id) { // Only fetch if we have a valid user ID
            const projects = await getUserProjects();
            setUserProjects(projects);
        }
    };
    fetchProjects();
  }, [currentUser?.id, currentProjectId]); // Re-fetch when user ID changes (login) or project changes

  // Load a specific project
  const handleSelectProject = async (projectId) => {
    setIsLoading(true);
    try {
        const data = await getProjectDetails(projectId);
        if (data) {
            setProjectData({
                objective: data.objective,
                plan: data.plan,
                schedule: data.schedule,
                risk: data.risks,
                budget: data.budget,
                structure: data.structure, 
                kpiReport: data.kpis,
                sCurveReport: data.s_curve,
                consultingPlan: data.consulting_plan,
                agents: data.agents
            });
            setCurrentProjectId(data.id);
            setActiveView('consultingPlan');
        }
    } catch (e) {
        setError("Failed to load project");
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateProject = async (newData) => {
    const updatedData = { ...projectData, ...newData };
    setProjectData(updatedData);
    
    // Auto-save to Supabase
    try {
        // Only save if there's substantial data (objective or consulting plan title)
        if (updatedData.objective || updatedData.consultingPlan?.projectTitle) {
            const savedProject = await saveProject(currentProjectId, updatedData);
            if (savedProject && !currentProjectId) {
                setCurrentProjectId(savedProject.id);
            }
        }
    } catch (e) {
        console.error("Auto-save failed:", e);
        // Don't block UI on save fail, just log
    }
  };

  const handleResetProject = () => {
    setProjectData({});
    setCurrentProjectId(null);
    setActiveView('consultingPlan');
    setError(null);
  };
  
  const handleNext = () => {
      const currentIndex = WORKFLOW_ORDER.indexOf(activeView);
      if (currentIndex < WORKFLOW_ORDER.length - 1) {
          setActiveView(WORKFLOW_ORDER[currentIndex + 1]);
      }
  };
  
  const handlePrev = () => {
       const currentIndex = WORKFLOW_ORDER.indexOf(activeView);
      if (currentIndex > 0) {
          setActiveView(WORKFLOW_ORDER[currentIndex - 1]);
      }
  };

  const renderActiveView = () => {
    const commonProps = {
        language,
        projectData,
        onUpdateProject: handleUpdateProject,
        onResetProject: handleResetProject,
        isLoading,
        setIsLoading,
        error,
        setError
    };
    
    // Check prerequisites
    if (activeView !== 'assistant' && activeView !== 'consultingPlan') {
        const prerequisite = PREREQUISITES[activeView];
        if (prerequisite && !projectData[prerequisite]) {
            return React.createElement(PrerequisiteView, { missing: prerequisite, language, onViewChange: setActiveView });
        }
    }

    switch (activeView) {
        case 'assistant':
            return React.createElement(AssistantView, { language, currentUser });
        case 'consultingPlan':
            return React.createElement(ComprehensivePlanView, commonProps);
        case 'planning':
            return React.createElement(PlanningView, commonProps);
        case 'scheduling':
            return React.createElement(SchedulingView, commonProps);
        case 'kpis':
            return React.createElement(KpiView, commonProps);
        case 'scurve':
            return React.createElement(SCurveView, commonProps);
        case 'structure':
            return React.createElement(StructureView, commonProps);
        case 'risk':
            return React.createElement(RiskView, commonProps);
        case 'budget':
            return React.createElement(BudgetView, commonProps);
        case 'agents':
            return React.createElement(AgentView, commonProps);
        default:
             return React.createElement(PlanningView, commonProps);
    }
  };

  return React.createElement('div', { className: 'flex h-screen bg-dark-bg overflow-hidden' },
    React.createElement(Sidebar, { 
        language, 
        activeView, 
        setActiveView, 
        isExpanded: isSidebarExpanded, 
        setExpanded: setIsSidebarExpanded, 
        onLogout, 
        currentUser, 
        projectData,
        projects: userProjects,
        onSelectProject: handleSelectProject
    }),
    React.createElement('main', { className: 'flex-1 p-6 min-w-0 flex flex-col' },
        React.createElement(ProjectHeader, { 
            language, 
            objective: projectData.objective || projectData.consultingPlan?.projectTitle, 
            onReset: handleResetProject,
            onNext: handleNext,
            onPrev: handlePrev,
            activeView
        }),
        React.createElement('div', { className: "mt-6 flex-grow bg-dark-card backdrop-blur-xl rounded-2xl glow-border overflow-hidden" },
            error && !isLoading && React.createElement('div', { className: "bg-red-500/10 border-b border-red-500/30 text-center p-2 text-sm text-red-400 font-semibold" }, error),
            renderActiveView()
        )
    )
  );
};

export default Dashboard;