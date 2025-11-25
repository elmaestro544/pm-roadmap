import React from 'react';
import { i18n, AppView } from '../constants.js';
import { StarIcon } from './Shared.js';

const UpgradeRequired = ({ language, setView }) => {
  const t = i18n[language];

  return React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto" },
    React.createElement('div', { className: "bg-white dark:bg-card-gradient p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl" },
      React.createElement('div', { className: "flex justify-center mb-4" },
        React.createElement(StarIcon, null)
      ),
      React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-3" }, t.upgradeRequiredTitle),
      React.createElement('p', { className: "text-slate-500 dark:text-brand-text-light mb-6" }, t.upgradeRequiredMessage),
      React.createElement('button', {
        onClick: () => setView(AppView.Pricing),
        className: "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
      }, t.viewPlans)
    )
  );
};

export default UpgradeRequired;
