import React, { useEffect } from 'react';
import { i18n } from '../constants.js';
import { TrashIcon, HistoryIcon, CloseIcon } from './Shared.js';

const HistoryPanel = ({ isOpen, onClose, title, items, renderItem, onClear, language }) => {
    const t = i18n[language];

    useEffect(() => {
        const handleEsc = (event) => {
           if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
      }, [onClose]);

    const panelDirectionClass = language === 'ar' ? '-translate-x-full' : 'translate-x-full';
    const panelPositionClass = language === 'ar' ? 'left-0' : 'right-0';
    
    return React.createElement('div', { 
        className: `fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`
    },
        // Backdrop
        React.createElement('div', { 
            className: `absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`,
            onClick: onClose,
            'aria-hidden': 'true'
        }),
        // Panel
        React.createElement('div', { 
            className: `fixed inset-y-0 ${panelPositionClass} w-full max-w-sm bg-dark-card-solid shadow-xl transform transition-transform ease-in-out duration-300 ${isOpen ? 'translate-x-0' : panelDirectionClass}` 
        },
            React.createElement('div', { className: 'h-full flex flex-col' },
                React.createElement('div', { className: "p-4 border-b border-dark-border flex justify-between items-center flex-shrink-0" },
                    React.createElement('h3', { className: "text-lg font-semibold text-brand-text flex items-center gap-2" },
                        React.createElement(HistoryIcon, null),
                        title
                    ),
                    React.createElement('button', { onClick: onClose, className: 'p-1 rounded-full text-brand-text-light hover:bg-white/10' },
                        React.createElement(CloseIcon, null)
                    )
                ),
                React.createElement('div', { className: "flex-grow overflow-y-auto space-y-2 p-4" },
                    items && items.length > 0 ? (
                        items.map(item => renderItem(item))
                    ) : (
                        React.createElement('p', { className: "text-sm text-brand-text-light text-center py-4" }, t.noHistory)
                    )
                ),
                items && items.length > 0 && onClear && React.createElement('div', { className: 'p-4 border-t border-dark-border flex-shrink-0' },
                    React.createElement('button', {
                        onClick: () => { onClear(); onClose(); },
                        className: "w-full text-sm flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-500/30 transition-colors bg-red-500/10 py-2 rounded-lg"
                    }, React.createElement(TrashIcon, null), t.clearHistory)
                )
            )
        )
    );
};

export default HistoryPanel;