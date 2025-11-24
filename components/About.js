

import React from 'react';
import { i18n } from '../constants.js';

// --- SVG Icons for the About Page ---
const VisionIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
);

const MissionIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" })
);

const About = ({ language }) => {
    const t = i18n[language];

    const Section = ({ icon, title, children }) => (
        React.createElement('section', { className: "mb-8" },
            React.createElement('div', { className: "flex items-center gap-4 mb-3" },
                React.createElement('div', { className: "text-brand-purple dark:text-brand-purple-light" }, icon),
                React.createElement('h3', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text" }, title)
            ),
            React.createElement('div', { className: `border-brand-purple/30 ${language === 'ar' ? 'border-r-2 pr-6 mr-4' : 'border-l-2 pl-6 ml-4'}` }, children)
        )
    );
    
    return React.createElement('div', { className: "max-w-4xl mx-auto py-16 px-4" },
        React.createElement('div', { className: "text-center mb-12" },
            React.createElement('h2', { className: "text-4xl font-extrabold text-slate-900 dark:text-brand-text" }, t.aboutTitle)
        ),

        React.createElement('div', { className: "bg-white dark:bg-card-gradient p-8 rounded-2xl border border-slate-200 dark:border-white/10 space-y-6 text-lg leading-relaxed text-slate-600 dark:text-brand-text-light" },
            React.createElement(Section, { icon: React.createElement(VisionIcon), title: t.aboutVisionTitle },
                React.createElement('p', null, t.aboutVisionText)
            ),
            React.createElement(Section, { icon: React.createElement(MissionIcon), title: t.aboutMissionTitle },
                React.createElement('p', null, t.aboutMissionText)
            )
        )
    );
};

export default About;