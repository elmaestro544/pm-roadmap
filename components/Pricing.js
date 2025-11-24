
import React, { useState, useEffect } from 'react';
import { i18n, PRICING_PLANS, AppView } from '../constants.js';
import { CloseIcon, CreditCardIcon, Spinner, CheckIcon } from './Shared.js';

// --- PaymentModal Component ---
const PaymentModal = ({ isOpen, onClose, language, plan }) => {
    const t = i18n[language];
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsProcessing(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const handlePayment = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (!isOpen) return null;

    return React.createElement('div', {
        className: "fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[150] flex justify-center items-center backdrop-blur-sm p-4",
        onClick: onClose
    },
        React.createElement('div', {
            className: "bg-white dark:bg-card-gradient p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-200 dark:border-white/10 transform transition-all animate-fade-in-up",
            onClick: e => e.stopPropagation()
        },
            isSuccess ? (
                React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4' },
                        React.createElement(CheckIcon, { className: 'w-8 h-8' })
                    ),
                    React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-2" }, t.paymentSuccess),
                    React.createElement('p', { className: "text-slate-500 dark:text-brand-text-light mb-6" }, t.welcomeAboard),
                    React.createElement('button', { onClick: onClose, className: "w-full bg-button-gradient text-white font-bold py-2.5 px-4 rounded-full transition-opacity hover:opacity-90" }, 'Done')
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement('button', { onClick: onClose, className: "absolute top-4 right-4 text-slate-500 dark:text-brand-text-light hover:text-slate-900 dark:hover:text-white transition-colors" },
                        React.createElement(CloseIcon, null)
                    ),
                    React.createElement('h2', { className: "text-2xl font-bold text-slate-900 dark:text-brand-text mb-2" }, t.paymentTitle),
                    React.createElement('p', { className: "text-slate-500 dark:text-brand-text-light mb-6" }, `${t.paymentFor} ${plan.name[language]} plan.`),
                    React.createElement('form', { onSubmit: handlePayment, className: 'space-y-4' },
                        React.createElement('div', { className: 'relative' },
                            React.createElement('input', { type: 'text', placeholder: t.cardNumber, className: 'w-full p-3 pl-12 bg-slate-100 dark:bg-input-gradient border border-slate-300 dark:border-white/20 rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none' }),
                            React.createElement(CreditCardIcon, { className: 'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' })
                        ),
                        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                            React.createElement('input', { type: 'text', placeholder: t.expiryDate, className: 'w-full p-3 bg-slate-100 dark:bg-input-gradient border border-slate-300 dark:border-white/20 rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none' }),
                            React.createElement('input', { type: 'text', placeholder: t.cvc, className: 'w-full p-3 bg-slate-100 dark:bg-input-gradient border border-slate-300 dark:border-white/20 rounded-full focus:ring-2 focus:ring-brand-purple focus:outline-none' })
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            disabled: isProcessing,
                            className: "w-full flex items-center justify-center bg-button-gradient text-white font-bold py-3 px-4 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
                        },
                            isProcessing && React.createElement(Spinner, { size: '5' }),
                            React.createElement('span', { className: isProcessing ? 'ml-2' : '' }, isProcessing ? t.processingPayment : t.payNow)
                        )
                    )
                )
            )
        )
    );
};

// --- Pricing Component ---
const Pricing = ({ language, setView, currentUser, onLoginClick }) => {
    const t = i18n[language];
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const handleChoosePlan = (plan) => {
        if (plan.id === 'free' || plan.buttonTextKey === 'getStarted') {
            onLoginClick();
            return;
        }
        if (plan.id === 'enterprise') {
            setView(AppView.Contact);
            return;
        }
        if (!currentUser) {
            onLoginClick();
        } else {
            setSelectedPlan(plan);
            setIsPaymentModalOpen(true);
        }
    };

    const PlanCard = ({ plan }) => {
        const isYearly = billingCycle === 'yearly';
        const priceDetails = isYearly && plan.yearly ? plan.yearly : plan.monthly;
        const isPopular = plan.isPopular;
        const isCustom = priceDetails.price.en === 'Custom';

        const cardClasses = `relative border rounded-2xl p-6 flex flex-col transition-all duration-300 ${
            isPopular 
                ? 'bg-white dark:bg-dark-card border-brand-purple shadow-2xl shadow-glow-purple' 
                : isCustom
                    ? 'bg-white dark:bg-dark-card border-brand-pink shadow-2xl shadow-glow-pink'
                    : 'bg-slate-50 dark:bg-card-gradient border-slate-200 dark:border-white/10'
        }`;
        
        const buttonClasses = `w-full font-bold py-3 px-4 rounded-lg transition-opacity hover:opacity-90 ${
            isPopular || isCustom
                ? 'bg-button-gradient text-white' 
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-dark-bg dark:text-white dark:hover:bg-dark-bg/70'
        }`;

        return React.createElement('div', { className: cardClasses },
            isPopular && React.createElement('div', { className: 'absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-full' }, t.mostPopular),
            React.createElement('h3', { className: 'text-2xl font-bold text-slate-900 dark:text-brand-text text-center' }, plan.name[language]),
            React.createElement('div', { className: 'my-6 text-center' },
                React.createElement('span', { className: 'text-5xl font-extrabold text-slate-900 dark:text-white' }, priceDetails.price[language]),
                priceDetails.period[language] && React.createElement('span', { className: 'text-slate-500 dark:text-light-gray' }, priceDetails.period[language])
            ),
            React.createElement('ul', { className: 'space-y-3 mb-8 flex-grow' },
                plan.features.map((feature, index) => React.createElement('li', { key: index, className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500/10 text-green-500' }, React.createElement(CheckIcon, { className: 'w-3 h-3' })),
                    React.createElement('span', { className: 'text-slate-600 dark:text-brand-text-light' }, feature[language])
                ))
            ),
            React.createElement('button', {
                onClick: () => handleChoosePlan(plan),
                className: buttonClasses
            }, t[plan.buttonTextKey])
        );
    };

    return React.createElement('div', { className: "container mx-auto px-6 py-16" },
        React.createElement('div', { className: "text-center max-w-2xl mx-auto mb-12" },
            React.createElement('h2', { className: "text-4xl font-bold text-slate-900 dark:text-white" }, t.pricingTitle),
            React.createElement('p', { className: "mt-3 text-lg text-slate-500 dark:text-light-gray" }, t.pricingDescription)
        ),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto' },
            PRICING_PLANS.map(plan => React.createElement(PlanCard, { key: plan.id, plan: plan }))
        ),
        React.createElement(PaymentModal, {
            isOpen: isPaymentModalOpen,
            onClose: () => setIsPaymentModalOpen(false),
            language: language,
            plan: selectedPlan
        })
    );
};

export default Pricing;
