
import React, { useState, useEffect } from 'react';
import { i18n, AppView } from '../constants.js';
import { CloseIcon, GoogleIcon, Spinner, LockIcon } from './Shared.js';
import { signIn, signUp } from '../services/supabaseClient.js';

const ModalContent = ({
  t,
  viewMode, // 'login', 'register', 'admin'
  formData,
  error,
  success,
  loading,
  handleInputChange,
  handleSubmit,
  onClose,
  setViewMode,
  setView
}) => {
    const isAdmin = viewMode === 'admin';
    const isLogin = viewMode === 'login';

    const title = isAdmin ? "Admin Access" : (isLogin ? t.login : t.register);
    
    return React.createElement('div', { className: "bg-dark-card backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md relative glow-border" },
      React.createElement('button', { onClick: onClose, className: "absolute top-4 right-4 text-brand-text-light hover:text-white transition-colors" },
        React.createElement(CloseIcon, null)
      ),
      
      isAdmin && React.createElement('div', { className: "flex justify-center mb-4" },
          React.createElement('div', { className: "p-3 bg-dark-bg rounded-full border border-dark-border" },
              React.createElement(LockIcon, { className: "w-6 h-6 text-brand-purple-light" })
          )
      ),

      React.createElement('h2', { className: "text-2xl font-bold text-center text-brand-text mb-4" }, title),
      
      error && React.createElement('div', {className: "bg-red-500/10 border border-red-500/30 text-center p-2 rounded-md mb-4 text-sm text-red-400 font-semibold"}, error),
      success && React.createElement('div', {className: "bg-green-500/10 border border-green-500/30 text-center p-2 rounded-md mb-4 text-sm text-green-400 font-semibold"}, success),

      React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
        // Admin View: Passkey Only
        isAdmin && React.createElement('div', null,
             React.createElement('label', { htmlFor: "adminPasskey", className: "block text-sm font-medium text-brand-text-light mb-1" }, "Enter Passkey"),
             React.createElement('input', {
                type: "password", id: "adminPasskey", name: "adminPasskey", required: true,
                value: formData.adminPasskey || '', onChange: handleInputChange,
                placeholder: "Passkey",
                className: "w-full p-2 bg-dark-card-solid border border-dark-border rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none text-white text-center tracking-widest"
             })
        ),

        // User Login/Register Views
        !isAdmin && React.createElement(React.Fragment, null,
            !isLogin && React.createElement('div', null,
                React.createElement('label', { htmlFor: "fullName", className: "block text-sm font-medium text-brand-text-light mb-1" }, t.fullName),
                React.createElement('input', {
                    type: "text", id: "fullName", name: "fullName", required: true,
                    value: formData.fullName, onChange: handleInputChange,
                    className: "w-full p-2 bg-dark-card-solid border border-dark-border rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none text-white"
                })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "email", className: "block text-sm font-medium text-brand-text-light mb-1" }, t.emailAddress),
              React.createElement('input', {
                type: "email", id: "email", name: "email", required: true,
                value: formData.email, onChange: handleInputChange,
                className: "w-full p-2 bg-dark-card-solid border border-dark-border rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none text-white"
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "password", className: "block text-sm font-medium text-brand-text-light mb-1" }, t.password),
              React.createElement('input', {
                type: "password", id: "password", name: "password", required: true,
                value: formData.password, onChange: handleInputChange,
                className: "w-full p-2 bg-dark-card-solid border border-dark-border rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none text-white"
              })
            ),
            !isLogin && React.createElement('div', null,
                React.createElement('label', { htmlFor: "confirmPassword", className: "block text-sm font-medium text-brand-text-light mb-1" }, t.confirmPassword),
                React.createElement('input', {
                    type: "password", id: "confirmPassword", name: "confirmPassword", required: true,
                    value: formData.confirmPassword, onChange: handleInputChange,
                    className: "w-full p-2 bg-dark-card-solid border border-dark-border rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none text-white"
                })
            ),
            !isLogin && React.createElement('p', { className: "text-xs text-center text-brand-text-light pt-2" },
                t.authRegistrationDisclaimer_p1, ' ',
                React.createElement('button', {
                    type: 'button',
                    onClick: () => { onClose(); setView(AppView.Terms); },
                    className: 'font-semibold text-brand-purple-light hover:underline focus:outline-none'
                }, t.authRegistrationDisclaimer_terms), ' ',
                t.authRegistrationDisclaimer_p2, ' ',
                React.createElement('button', {
                    type: 'button',
                    onClick: () => { onClose(); setView(AppView.Privacy); },
                    className: 'font-semibold text-brand-purple-light hover:underline focus:outline-none'
                }, t.authRegistrationDisclaimer_privacy),
                t.authRegistrationDisclaimer_p3
            )
        ),

        React.createElement('button', {
          type: "submit",
          disabled: loading,
          className: "w-full bg-button-gradient text-white font-bold py-2.5 px-4 rounded-full transition-opacity hover:opacity-90 mt-2 shadow-md shadow-brand-purple/20 flex justify-center items-center"
        },
          loading ? React.createElement(Spinner, { size: '5' }) : (isAdmin ? "Unlock Dashboard" : (isLogin ? t.login : t.createAccount))
        )
      ),

      React.createElement('div', { className: "relative my-6" },
        React.createElement('div', { className: "absolute inset-0 flex items-center", "aria-hidden": "true" },
          React.createElement('div', { className: "w-full border-t border-dark-border" })
        ),
        React.createElement('div', { className: "relative flex justify-center text-sm" },
          React.createElement('span', { className: "px-2 bg-dark-card text-brand-text-light" }, "OR")
        )
      ),

      // Footer Links
      isAdmin ? (
         React.createElement('p', { className: "mt-6 text-center text-sm text-brand-text-light" },
            React.createElement('button', { onClick: () => setViewMode('login'), className: "font-medium text-brand-purple-light hover:underline" },
              "Back to User Login"
            )
        )
      ) : (
          React.createElement('div', { className: 'flex flex-col gap-2' },
            React.createElement('p', { className: "text-center text-sm text-brand-text-light" },
                isLogin ? t.dontHaveAccount : t.alreadyHaveAccount,
                ' ',
                React.createElement('button', { onClick: () => setViewMode(isLogin ? 'register' : 'login'), className: "font-medium text-brand-purple-light hover:underline" },
                isLogin ? t.register : t.login
                )
            ),
             React.createElement('p', { className: "text-center text-xs text-slate-500 mt-2" },
                React.createElement('button', { onClick: () => setViewMode('admin'), className: "hover:text-white transition-colors" }, "Admin Login")
            )
          )
      )
    )
};


const AuthModal = ({ isOpen, onClose, onLoginSuccess, onAdminLoginSuccess, language, setView, initialAdminMode = false }) => {
  const t = i18n[language];
  const [viewMode, setViewMode] = useState('login'); // login, register, admin
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', adminPasskey: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '', adminPasskey: '' });
    setViewMode(initialAdminMode ? 'admin' : 'login');
  }, [isOpen, initialAdminMode]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
        if (viewMode === 'admin') {
            // ADMIN LOGIN
            if (formData.adminPasskey === '1077') {
                 if (onAdminLoginSuccess) onAdminLoginSuccess();
                 onClose();
            } else {
                throw new Error("Invalid Admin Passkey");
            }
        } else if (viewMode === 'login') {
            // USER LOGIN
            const { data, error } = await signIn(formData.email, formData.password);
            if (error) throw error;
            if (data?.user) {
                if (onLoginSuccess) onLoginSuccess();
                onClose();
            }
        } else {
            // USER REGISTER
            if (formData.password !== formData.confirmPassword) {
                throw new Error(t.errorPasswordMismatch);
            }
            if (formData.password.length < 6) {
                 throw new Error(t.errorPasswordLength);
            }
            const { data, error } = await signUp(formData.email, formData.password, formData.fullName);
            if (error) throw error;
            setSuccess("Registration successful! Please check your email to verify your account, or log in.");
            setTimeout(() => setViewMode('login'), 2000);
        }
    } catch (err) {
        setError(err.message || t.errorOccurred);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    React.createElement('div', {
        className: "fixed inset-0 bg-black/80 z-[100] flex justify-center items-center backdrop-blur-sm transition-opacity",
        onClick: onClose,
    },
      React.createElement('div', { onClick: (e) => e.stopPropagation(), className: "transform transition-all" },
        React.createElement(ModalContent, {
          t,
          viewMode,
          formData,
          error,
          success,
          loading,
          handleInputChange,
          handleSubmit,
          onClose,
          setViewMode,
          setView
        })
      )
    )
  );
};

export default AuthModal;
