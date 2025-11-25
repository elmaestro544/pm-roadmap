
import React from 'react';
import { i18n } from '../constants.js';

const Contact = ({ language, settings }) => {
    const t = i18n[language];
    const contactEmail = settings?.contactEmail || 'info@roadmap.casa';
    const contactPhone = settings?.contactPhone || '';

    const Illustration = () => (
        React.createElement('div', { className: 'flex items-center justify-center p-8' },
            React.createElement('svg', { viewBox: '0 0 200 200', xmlns: 'http://www.w3.org/2000/svg' },
                React.createElement('path', {
                    fill: '#2DD4BF', // turquoise
                    d: 'M46.2,-46.2C58.7,-32.7,66.8,-16.3,66.8,0.1C66.8,16.5,58.7,33,46.2,46.2C33.7,59.5,16.8,69.5,0.2,69.4C-16.5,69.3,-33,59.1,-46.4,45.8C-59.8,32.5,-70.1,16.3,-70.1,0.1C-70.1,-16,-59.8,-32.1,-46.4,-45.7C-33,-59.3,-16.5,-70.4,0.3,-70.5C17.1,-70.6,33.7,-59.7,46.2,-46.2Z',
                    transform: 'translate(100 100)',
                    className: 'opacity-20'
                }),
                React.createElement('path', {
                    fill: '#A3E635', // green
                    d: 'M39.8,-39.8C53.1,-27.1,66.4,-13.5,66.4,0.1C66.4,13.7,53.1,27.4,39.8,40.2C26.5,53,13.2,64.9,-0.2,64.9C-13.6,65,-27.3,53.2,-40.3,39.9C-53.3,26.6,-65.7,13.3,-65.7,-0.1C-65.7,-13.4,-53.3,-26.8,-40.3,-40.1C-27.3,-53.4,-13.6,-66.6,0,-66.6C13.7,-66.6,26.5,-52.5,39.8,-39.8Z',
                    transform: 'translate(100 100) scale(0.8)',
                    className: 'opacity-10'
                }),
                // Mail icon
                 React.createElement('g', { transform: 'translate(65 65) scale(0.4)' },
                    React.createElement('path', {
                        d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
                        stroke: '#2DD4BF', // turquoise
                        strokeWidth: '2',
                        fill: 'none'
                    }),
                    React.createElement('path', {
                        d: 'M22 6l-10 7L2 6',
                        stroke: '#A3E635', // green
                        strokeWidth: '2',
                        fill: 'none'
                    })
                )
            )
        )
    );

    return React.createElement('div', { className: "container mx-auto px-6 py-16" },
        React.createElement('div', { className: "text-center mb-12" },
            React.createElement('h2', { className: "text-4xl font-bold text-slate-900 dark:text-white" }, t.contactTitle),
            React.createElement('p', { className: "mt-3 text-lg text-slate-500 dark:text-light-gray" }, t.contactDescription)
        ),
        React.createElement('div', { className: 'max-w-4xl mx-auto bg-white dark:bg-dark-card rounded-lg shadow-xl overflow-hidden' },
            React.createElement('div', { className: 'grid md:grid-cols-2' },
                React.createElement('div', { className: 'hidden md:block relative' },
                    React.createElement(Illustration, null),
                    React.createElement('div', { className: 'absolute bottom-8 left-0 right-0 text-center px-4' },
                        React.createElement('p', { className: 'text-brand-text-light font-medium' }, "Reach us directly:"),
                        React.createElement('p', { className: 'text-white font-bold' }, contactEmail),
                        contactPhone && React.createElement('p', { className: 'text-white font-bold' }, contactPhone)
                    )
                ),
                React.createElement('div', { className: 'p-8' },
                    React.createElement('form', { action: '#', method: 'POST', className: 'space-y-6' },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'full-name', className: 'text-sm font-medium text-slate-700 dark:text-light-gray' }, t.fullName),
                            React.createElement('input', { type: 'text', id: 'full-name', name: 'full-name', className: 'mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border border-slate-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple' })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'email', className: 'text-sm font-medium text-slate-700 dark:text-light-gray' }, t.emailAddress),
                            React.createElement('input', { type: 'email', id: 'email', name: 'email', className: 'mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border border-slate-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple' })
                        ),
                         React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'company', className: 'text-sm font-medium text-slate-700 dark:text-light-gray' }, 'Company'),
                            React.createElement('input', { type: 'text', id: 'company', name: 'company', className: 'mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border border-slate-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple' })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'message', className: 'text-sm font-medium text-slate-700 dark:text-light-gray' }, 'Message'),
                            React.createElement('textarea', { id: 'message', name: 'message', rows: '4', className: 'mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border border-slate-300 dark:border-white/20 rounded-md focus:outline-none focus:ring-brand-purple focus:border-brand-purple resize-none' })
                        ),
                        React.createElement('div', null,
                            React.createElement('button', { type: 'submit', className: 'w-full px-6 py-3 bg-brand-purple text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-colors' }, 'Send Message')
                        )
                    )
                )
            )
        )
    );
};

export default Contact;
