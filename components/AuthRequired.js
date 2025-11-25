import React from 'react';
import { i18n } from '../constants.js';
import { LockIcon } from './Shared.js';

const AuthRequired = ({ language, onLoginClick }) => {
  const t = i18n[language];

  return React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto" },
    React.createElement('div', { className: "bg-white dark:bg-card-gradient p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl" },
      React.createElement('div', { className: "flex justify-center mb-4" },
        React.createElement(LockIcon, null)
      ),
      React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-3" }, t.authRequiredTitle),
      React.createElement('p', { className: "text-slate-500 dark:text-brand-text-light mb-6" }, t.authRequiredMessage),
      React.createElement('button', {
        onClick: onLoginClick,
        className: "bg-brand-red hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
      }, t.loginRegister),
      React.createElement('p', { className: "text-xs text-slate-500 dark:text-brand-text-light mt-4" }, t.noCreditCardRequired)
    )
  );
};

export default AuthRequired;