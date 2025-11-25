
// components/AgentView.js

import React, { useState, useEffect, useRef } from 'react';
import { generateVendorOffers } from '../services/agentService.js';
import { Spinner, CloseIcon, FeatureToolbar } from './Shared.js';
import { i18n } from '../constants.js';

// --- Sub-Components ---

const PartnerCard = ({ name, service, status, contact, rating }) => (
    React.createElement('div', { className: 'bg-dark-card backdrop-blur-xl border border-dark-border rounded-lg p-4 glow-border' },
        React.createElement('div', { className: 'flex justify-between items-start' },
            React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: 'w-10 h-10 rounded-full bg-dark-card-solid flex items-center justify-center font-bold text-brand-purple-light' }, name.charAt(0)),
                React.createElement('div', null,
                    React.createElement('h4', { className: 'font-semibold text-white' }, name),
                    React.createElement('p', { className: 'text-xs text-brand-text-light' }, service)
                )
            ),
            React.createElement('div', { className: 'text-xs flex items-center gap-1 text-yellow-400' }, '⭐', React.createElement('span', { className: 'font-bold' }, rating))
        ),
        React.createElement('div', { className: 'text-sm text-brand-text-light mt-3 space-y-1' },
            React.createElement('p', null, contact.name),
            React.createElement('p', null, contact.phone),
            React.createElement('p', null, contact.email)
        ),
        React.createElement('div', { className: 'flex justify-between items-center mt-4' },
             React.createElement('span', { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}` }, status),
             React.createElement('button', { className: 'text-sm bg-dark-card-solid hover:bg-white/10 border border-dark-border text-white font-semibold px-4 py-1.5 rounded-md' }, "View details")
        )
    )
);

const RequestOfferModal = ({ isOpen, onClose, language, onSaveOffers }) => {
    const [step, setStep] = useState('input'); // input, loading, results, confirm
    const [request, setRequest] = useState('');
    const [offers, setOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const resetModal = () => {
        setStep('input');
        setRequest('');
        setOffers([]);
        setSelectedOffer(null);
        setError(null);
        setProgress(0);
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            // Delay reset to allow closing animation
            setTimeout(() => {
                setStep('input');
                setRequest('');
                setOffers([]);
                setSelectedOffer(null);
                setError(null);
                setProgress(0);
            }, 300);
        }
    }, [isOpen]);

    useEffect(() => {
        let timer;
        if (step === 'loading') {
            setProgress(10);
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) { clearInterval(timer); return prev; }
                    return Math.min(prev + (Math.random() * 15), 95);
                });
            }, 400);
        }
        return () => clearInterval(timer);
    }, [step]);
    

    const handleSubmitRequest = async () => {
        if (!request.trim()) return;
        setStep('loading');
        setError(null);
        try {
            const result = await generateVendorOffers(request);
            setOffers(result.offers);
            setProgress(100);
            setTimeout(() => setStep('results'), 500);
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
            setStep('input');
        }
    };
    
    const handleSelectOffer = (offer) => {
        setSelectedOffer(offer);
        setStep('confirm');
    };

    const handleConfirm = () => {
         // Propagate the full offer list up to be saved in project agents field
         onSaveOffers(offers);
         resetModal();
    };

    const suggestedRequests = [
        "Need 10 laptops for development team",
        "Office furniture for 50 employees",
        "Construction materials for building project"
    ];

    const renderStep = () => {
        switch (step) {
            case 'input':
                return React.createElement('div', { className: 'animate-fade-in-up' },
                    React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, "Request Offer"),
                    React.createElement('p', { className: 'text-brand-text-light mb-4' }, "Describe what you need and our AI will find the best vendor offers for you. You can type your request or use voice input."),
                    error && React.createElement('div', { className: "bg-red-500/10 text-center p-2 rounded-md mb-4 text-sm text-red-400" }, error),
                    React.createElement('textarea', {
                        value: request,
                        onChange: e => setRequest(e.target.value),
                        placeholder: "e.g., Need 10 laptops for development team",
                        rows: 3,
                        className: 'w-full p-3 bg-dark-card-solid border border-dark-border rounded-lg resize-none focus:ring-2 focus:ring-brand-purple'
                    }),
                    React.createElement('p', { className: 'text-sm text-brand-text-light mt-4 mb-2' }, "Suggested requests:"),
                    React.createElement('div', { className: 'flex flex-wrap gap-2 mb-6' },
                        suggestedRequests.map(s => React.createElement('button', { key: s, onClick: () => setRequest(s), className: 'text-sm bg-dark-card-solid hover:bg-white/10 border border-dark-border px-3 py-1.5 rounded-md' }, s))
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-4' },
                        React.createElement('button', { onClick: resetModal, className: 'px-6 py-2.5 font-semibold text-brand-text-light bg-dark-card-solid hover:bg-white/10 border border-dark-border rounded-lg' }, "Cancel"),
                        React.createElement('button', { onClick: handleSubmitRequest, disabled: !request.trim(), className: 'px-6 py-2.5 font-semibold text-white bg-button-gradient hover:opacity-90 rounded-lg disabled:opacity-50 shadow-md shadow-brand-purple/20' }, "Submit request")
                    )
                );
            case 'loading':
                return React.createElement('div', { className: 'text-center flex flex-col items-center p-8' },
                     React.createElement('div', { className: 'w-20 h-20 relative mb-4' }, React.createElement(Spinner, { size: '20' })),
                     React.createElement('h3', { className: 'text-xl font-bold text-brand-purple-light' }, "Processing..."),
                     React.createElement('p', { className: 'text-brand-text-light mt-2 mb-6 max-w-xs' }, "AI analyzes partner offers from databases and web sources, creating a concise summary."),
                     React.createElement('div', { className: 'w-full bg-dark-card-solid rounded-full h-2' },
                        React.createElement('div', { className: 'bg-brand-purple h-2 rounded-full transition-all duration-500', style: { width: `${progress}%` } })
                    ),
                    React.createElement('p', { className: 'text-brand-purple-light font-semibold mt-2' }, `${progress}%`)
                );
            case 'results':
                const StatusTag = ({ status }) => React.createElement('span', {
                    className: `text-xs font-semibold px-2 py-0.5 rounded-full ${status === 'Internal' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`
                }, status);
                return React.createElement('div', { className: 'animate-fade-in-up w-full' },
                    React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, `Vendor Offers for: "${request}"`),
                    React.createElement('div', { className: 'overflow-y-auto max-h-[50vh]' },
                        React.createElement('table', { className: 'w-full text-sm text-left' },
                            React.createElement('thead', { className: 'sticky top-0 bg-dark-card-solid' },
                                React.createElement('tr', { className: 'text-brand-text-light' }, ['Partner', 'Value', 'Delivery time', 'Location', 'Status', ''].map(h => React.createElement('th', { key: h, className: 'p-3 font-semibold' }, h)))
                            ),
                            React.createElement('tbody', null, offers.map((offer, i) =>
                                React.createElement('tr', { key: i, className: 'border-b border-dark-border' },
                                    React.createElement('td', { className: 'p-3 font-semibold' }, offer.partner),
                                    React.createElement('td', { className: 'p-3' }, new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(offer.value)),
                                    React.createElement('td', { className: 'p-3' }, offer.deliveryTime),
                                    React.createElement('td', { className: 'p-3' }, offer.location),
                                    React.createElement('td', { className: 'p-3' }, React.createElement(StatusTag, { status: offer.status })),
                                    React.createElement('td', { className: 'p-3' }, React.createElement('button', { onClick: () => handleSelectOffer(offer), className: 'px-4 py-1.5 font-semibold text-white bg-button-gradient hover:opacity-90 rounded-md' }, 'Select'))
                                )
                            ))
                        )
                    )
                );
            case 'confirm':
                return React.createElement('div', { className: 'animate-fade-in-up' },
                     React.createElement('h3', { className: 'text-xl font-bold text-white mb-4' }, "Selected Offer"),
                     React.createElement('div', { className: 'bg-dark-card-solid border border-dark-border rounded-lg p-4 space-y-3' },
                        Object.entries({
                            Partner: selectedOffer.partner,
                            Value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedOffer.value),
                            'Delivery time': selectedOffer.deliveryTime,
                            Location: selectedOffer.location,
                            Status: selectedOffer.status,
                        }).map(([key, value]) =>
                            React.createElement('div', { key: key, className: 'flex justify-between' },
                                React.createElement('span', { className: 'text-brand-text-light' }, key),
                                React.createElement('span', { className: 'font-semibold text-white' }, value)
                            )
                        )
                     ),
                     React.createElement('div', { className: 'flex justify-end gap-4 mt-6' },
                        React.createElement('button', { onClick: () => setStep('results'), className: 'px-6 py-2.5 font-semibold text-brand-text-light bg-dark-card-solid hover:bg-white/10 border border-dark-border rounded-lg' }, "Back"),
                        React.createElement('button', { onClick: handleConfirm, className: 'px-6 py-2.5 font-semibold text-white bg-button-gradient hover:opacity-90 rounded-lg shadow-md shadow-brand-purple/20' }, "Create contract")
                    )
                );
            default: return null;
        }
    };
    
    if (!isOpen) return null;

    return React.createElement('div', { className: "fixed inset-0 bg-black/80 z-[100] flex justify-center items-center backdrop-blur-sm", onClick: resetModal },
        React.createElement('div', {
            className: "bg-dark-card backdrop-blur-xl text-white rounded-2xl shadow-2xl w-full max-w-3xl relative glow-border p-8 transform transition-all",
            onClick: e => e.stopPropagation()
        },
            React.createElement('button', { onClick: resetModal, className: "absolute top-4 right-4 text-brand-text-light hover:text-white" }, React.createElement(CloseIcon, null)),
            renderStep()
        )
    );
};

const AgentView = ({ language, projectData, onUpdateProject }) => {
    const t = i18n[language];
    const fullscreenRef = useRef(null);
    const contentRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Toolbar state and handlers
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isEditing, setIsEditing] = useState(false);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleToggleEdit = () => setIsEditing(prev => !prev);
    const handleExport = () => window.print();

    // Handle saving new offers to project data
    const handleSaveOffers = (newOffers) => {
        const existingAgents = projectData?.agents || [];
        const updatedAgents = [...existingAgents, ...newOffers];
        onUpdateProject({ agents: updatedAgents });
    };

    const defaultPartners = [
        { name: "PixelCraft Agency", service: "UI/UX Design services", status: "Active", contact: { name: "Lisa Johnson", phone: "11234567890", email: "example@mail.com" }, rating: "4/5" },
        { name: "Innovate Solutions", service: "Software Development", status: "Active", contact: { name: "John Doe", phone: "11234567891", email: "john@mail.com" }, rating: "5/5" },
        { name: "DataWeavers Inc.", service: "Data Analytics", status: "Inactive", contact: { name: "Jane Smith", phone: "11234567892", email: "jane@mail.com" }, rating: "4.5/5" },
        { name: "CloudWorks Co.", service: "Cloud Infrastructure", status: "Active", contact: { name: "Peter Jones", phone: "11234567893", email: "peter@mail.com" }, rating: "4.2/5" }
    ];

    // Combine default partners with saved agents for display
    const allPartners = [...defaultPartners];
    if (projectData?.agents) {
        // Transform saved simple agent data to fit PartnerCard if needed
        // For now, we'll just append them assuming they have similar structure or map them
        projectData.agents.forEach(agent => {
             allPartners.push({
                 name: agent.partner,
                 service: agent.description,
                 status: agent.status,
                 contact: { name: "Unknown", phone: "N/A", email: "N/A" }, // Fill with dummy if missing
                 rating: "New"
             });
        });
    }

    return React.createElement('div', { ref: fullscreenRef, className: 'h-full flex flex-col bg-dark-card text-white printable-container' },
        React.createElement(FeatureToolbar, {
            title: t.dashboardAgents,
            containerRef: fullscreenRef,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onToggleEdit: handleToggleEdit,
            isEditing: isEditing,
            onExport: handleExport
        }),
        React.createElement('div', { className: 'flex-grow min-h-0 overflow-y-auto' },
            React.createElement('div', {
               ref: contentRef,
               className: 'p-6 printable-content',
               style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' },
               contentEditable: isEditing,
               suppressContentEditableWarning: true
            },
                React.createElement('div', { className: 'flex-shrink-0 flex justify-between items-center' },
                    React.createElement('h2', { className: 'text-2xl font-bold text-white' }, "Procurement"),
                    React.createElement('button', { onClick: () => setIsModalOpen(true), className: 'px-4 py-2 text-sm font-semibold bg-button-gradient text-white rounded-md transition-opacity hover:opacity-90 shadow-md shadow-brand-purple/20' }, "Request Offer")
                ),
                React.createElement('div', { className: 'mt-6' },
                    React.createElement('h3', { className: 'font-bold text-white mb-4' }, 'External Partners'),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
                        allPartners.map((p, i) => React.createElement(PartnerCard, { key: i, ...p }))
                    )
                )
            )
        ),
        React.createElement(RequestOfferModal, { 
            isOpen: isModalOpen, 
            onClose: () => setIsModalOpen(false), 
            language,
            onSaveOffers: handleSaveOffers
        })
    );
};

export default AgentView;
