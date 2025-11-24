

import React from 'react';

export const Spinner = ({ size = '8' }) => (
  React.createElement('div', {
    className: `animate-spin rounded-full h-${size} w-${size} border-b-2 border-t-2 border-brand-purple-light`
  })
);

export const SendIcon = ({className = "h-5 w-5 text-white"}) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" })
    )
);

export const MicrophoneIcon = ({ className = "h-6 w-6" }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" })
    )
);

export const UserIcon = ({ className = "h-6 w-6" }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" })
    )
);

export const CloseIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" })
    )
);

export const GoogleIcon = () => (
    React.createElement('svg', { className: "w-5 h-5", "aria-hidden": "true", focusable: "false", "data-prefix": "fab", "data-icon": "google", role: "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 488 512" },
        React.createElement('path', { fill: "currentColor", d: "M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.9 0 261.8 0 124.9 111.8 12.8 244 12.8c70.3 0 129.5 27.8 175.2 72.9l-68.5 68.5c-24.1-22.9-57-37.1-97.2-37.1-72.5 0-132.3 58.9-132.3 131.5s59.8 131.5 132.3 131.5c83.8 0 116.3-59.5 121.2-88.5H244v-83.8h236.1c2.4 12.8 3.9 26.6 3.9 41.5z" })
    )
);

export const FacebookIcon = () => (
    React.createElement('svg', { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true" },
        React.createElement('path', { d: "M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.323-1.325z" })
    )
);

export const TelegramIcon = () => (
    React.createElement('svg', { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true" },
        React.createElement('path', { d: "M11.999 0C5.372 0 0 5.373 0 12s5.372 12 11.999 12C18.626 24 24 18.627 24 12S18.626 0 11.999 0zM17.47 7.85l-2.016 9.16c-.15.68-.533.85-1.08.543l-3.03-2.227-1.455 1.393c-.16.16-.3.3-.51.3-.22 0-.32-.1-.38-.34l-.592-2.92 5.43-4.904c.243-.22-.043-.34-.37-.12l-6.72 4.16-3.013-.933c-.643-.2-.65-.63.13-.94l11.08-4.27c.56-.22 1.03.14.86.85z" })
    )
);

export const LinkedinIcon = () => (
    React.createElement('svg', { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true" },
        React.createElement('path', { d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" })
    )
);

export const MenuIcon = ({ className = 'w-6 h-6' }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" })
    )
);

export const HistoryIcon = ({ className = "h-5 w-5" }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })
    )
);

export const TrashIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
    )
);

export const CheckIcon = ({ className = 'w-5 h-5' }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
    )
);

export const CreditCardIcon = ({ className = 'w-6 h-6' }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" })
    )
);

export const StarIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 text-yellow-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" })
);

export const LockIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 text-brand-purple-light", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 15v2m-6 4h16a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" })
);

export const SettingsIcon = ({ className = "w-5 h-5" }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
    )
);

export const Logo = ({ size = 'text-2xl', isExpanded = true }) => (
    React.createElement('div', { className: `flex items-center gap-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}` },
        React.createElement('span', {
            className: `${size} font-bold bg-gradient-to-r from-cyan-400 via-lime-400 to-yellow-400 text-transparent bg-clip-text`
        }, 'PM Roadmap')
    )
);

export const AttachIcon = ({ className = "h-6 w-6" }) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" })
    )
);

export const SidebarToggleIcon = ({ isExpanded }) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        className: `h-6 w-6 text-brand-text-light transition-transform duration-300`,
        style: { transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2
    },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 6h16M4 12h16M4 18h16" })
    )
);

export const PlusIcon = ({ className = 'h-5 w-5' }) => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" })
);


// --- New Project Management Icons ---

const iconProps = {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-6 w-6", // Default size, can be overridden
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.5
};

export const PlanningIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
);

export const RiskIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
);

export const AgentIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 9l4-4 4 4m0 6l-4 4-4-4" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
);

export const ScheduleIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" })
);

export const BudgetIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" })
);

export const AssistantIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" })
);

export const StructureIcon = ({ className = iconProps.className, viewBox = "0 0 24 24" }) => React.createElement('svg', { ...iconProps, className, viewBox },
    React.createElement('circle', { cx: "12", cy: "5", r: "2" }),
    React.createElement('circle', { cx: "6", cy: "19", r: "2" }),
    React.createElement('circle', { cx: "18", cy: "19", r: "2" }),
    React.createElement('path', { d: "M12 7v10" }),
    React.createElement('path', { d: "m9 16.5-3-3" }),
    React.createElement('path', { d: "m15 16.5 3-3" }),
    React.createElement('path', { d: "M6 17v-3" }),
    React.createElement('path', { d: "M18 17v-3" })
);

export const KpiIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m14 14 3.5 3.5" })
);

export const SCurveIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 18c3.5-3.5 4-10 7-12 3-2 5.5.5 8 5" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21H3V3" })
);

export const DocumentIcon = ({ className = iconProps.className }) => React.createElement('svg', { ...iconProps, className },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
);


// --- New Feature Toolbar Icons ---
const toolbarIconProps = {
    xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none",
    viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2
};

export const ZoomInIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" }));
export const ZoomOutIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" }));
export const FullscreenIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" }));
export const FullscreenExitIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 14h4v4m-4-4l5 5m11-5h-4v4m4-4l-5 5M14 4h4v4m-4-4l5 5M5 9V5h4m-4 0l5 5" }));
export const ExpandIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }));
export const CollapseIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 15l7-7 7 7" }));
export const EditIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" }));
export const ExportIcon = () => React.createElement('svg', toolbarIconProps, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }));


// --- New Feature Toolbar Component ---
export const FeatureToolbar = ({ title, containerRef, onZoomIn, onZoomOut, onToggleEdit, isEditing, onExport, onExpandAll, onCollapseAll, scale, onScaleChange }) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const handleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    React.useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const IconButton = ({ icon, onClick, disabled = false, tooltip, className = '' }) => (
        React.createElement('button', {
            onClick, disabled, 'aria-label': tooltip,
            className: `p-2 rounded-md text-brand-text-light hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`
        }, icon)
    );
    
    const scaleOptions = [
        { id: 'days', label: 'Days' },
        { id: 'weeks', label: 'Weeks' },
        { id: 'months', label: 'Months' }
    ];

    return React.createElement('div', {
        className: 'non-printable flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-dark-border bg-dark-card/50'
    },
        React.createElement('h2', { className: 'text-xl font-bold text-white' }, title),
        React.createElement('div', { className: 'flex items-center gap-2' },
            onZoomIn && React.createElement(IconButton, { icon: React.createElement(ZoomInIcon), onClick: onZoomIn, tooltip: 'Zoom In' }),
            onZoomOut && React.createElement(IconButton, { icon: React.createElement(ZoomOutIcon), onClick: onZoomOut, tooltip: 'Zoom Out' }),
            
            onScaleChange && React.createElement('div', { className: 'flex items-center p-1 bg-dark-card-solid rounded-md mx-2' },
                scaleOptions.map(option => React.createElement('button', {
                    key: option.id,
                    onClick: () => onScaleChange(option.id),
                    className: `px-3 py-1 text-sm font-semibold rounded-md transition-colors ${scale === option.id ? 'bg-dark-bg text-white' : 'text-brand-text-light hover:bg-dark-bg/50'}`
                }, option.label))
            ),

            onExpandAll && React.createElement(IconButton, { icon: React.createElement(ExpandIcon), onClick: onExpandAll, tooltip: 'Expand All' }),
            onCollapseAll && React.createElement(IconButton, { icon: React.createElement(CollapseIcon), onClick: onCollapseAll, tooltip: 'Collapse All' }),
            
            (onExpandAll || onScaleChange) && React.createElement('div', { className: 'w-px h-6 bg-dark-border mx-2' }),
            
            onToggleEdit && React.createElement(IconButton, {
                icon: React.createElement(EditIcon),
                onClick: onToggleEdit,
                tooltip: isEditing ? 'Finish Editing' : 'Edit Content',
                className: isEditing ? 'bg-brand-purple/20 text-brand-purple-light' : ''
            }),
            React.createElement(IconButton, { icon: isFullscreen ? React.createElement(FullscreenExitIcon) : React.createElement(FullscreenIcon), onClick: handleFullscreen, tooltip: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }),
            onExport && React.createElement(IconButton, { icon: React.createElement(ExportIcon), onClick: onExport, tooltip: 'Export as PDF/Print' })
        )
    );
};