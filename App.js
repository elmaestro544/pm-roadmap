import React, { useState, useEffect } from 'react';
import { AppView, Language, i18n } from './constants.js';
import Home from './components/Home.js';
import Dashboard from './components/Dashboard.js';
import About from './components/About.js';
import Contact from './components/Contact.js';
import Pricing from './components/Pricing.js';
import Terms from './components/Terms.js';
import Privacy from './components/Privacy.js';
import Workflow from './components/Workflow.js'; 
import AdminDashboard from './components/AdminDashboard.js';
import UserSettings from './components/UserSettings.js'; 
import ProjectManager from './components/ProjectManager.js'; 
import { UserIcon, Logo, MenuIcon, CloseIcon, FacebookIcon, LinkedinIcon, TelegramIcon, SettingsIcon, Spinner, LockIcon, FolderIcon } from './components/Shared.js';
import { isAnyModelConfigured } from './services/geminiService.js';
import AuthModal from './components/AuthModal.js';
import { supabase, getCurrentUser, signOut } from './services/supabaseClient.js';

// Welcome Modal Component (Unchanged)
const WelcomeModal = ({ isOpen, onClose, onAuthClick, language }) => {
    const t = i18n[language];
    if (!isOpen) return null;

    return React.createElement('div', { 
        className: "fixed inset-0 bg-black/80 z-[200] flex justify-center items-center backdrop-blur-sm p-4",
        onClick: onClose,
    },
        React.createElement('div', { 
            className: "bg-dark-card rounded-xl shadow-2xl w-full max-w-lg border border-dark-border transform transition-all animate-fade-in-up glow-border",
            onClick: e => e.stopPropagation(),
        },
            React.createElement('div', { className: 'p-8 text-center' },
                React.createElement(Logo, null),
                React.createElement('h2', { className: "text-3xl font-bold text-brand-text mt-4" }, t.welcomeTitle),
                React.createElement('p', { className: "text-brand-text-light mt-2 mb-6" }, t.welcomeDescription),
                React.createElement('div', { className: 'flex flex-col sm:flex-row gap-4' },
                    React.createElement('button', { 
                        onClick: onClose, 
                        className: "w-full bg-button-gradient text-white font-bold py-3 px-4 rounded-lg transition-opacity hover:opacity-90 shadow-lg shadow-brand-purple/20" 
                    }, t.welcomeStart),
                    React.createElement('button', { 
                        onClick: onAuthClick, 
                        className: "w-full bg-dark-card-solid hover:bg-opacity-80 text-brand-text font-bold py-3 px-4 rounded-lg transition-colors border border-dark-border" 
                    }, t.welcomeAuth)
                )
            )
        )
    );
};

// System Warning Banner (Updated)
const SystemWarning = ({ message, actionLabel, onAction, onDismiss }) => (
    React.createElement('div', { className: "bg-amber-500/10 border-b border-amber-500/20 text-amber-100 px-4 py-2 text-sm flex items-center justify-between" },
        React.createElement('div', { className: "flex items-center gap-2" },
            React.createElement('span', { className: "text-lg" }, "⚠️"),
            React.createElement('span', null, message)
        ),
        React.createElement('div', { className: "flex items-center gap-4" },
            onAction && React.createElement('button', { 
                onClick: onAction,
                className: "text-white underline hover:text-amber-200 text-xs font-semibold"
            }, actionLabel),
            React.createElement('button', {
                onClick: onDismiss,
                className: "text-amber-200/50 hover:text-white p-1 rounded-full hover:bg-white/10"
            }, React.createElement(CloseIcon, { className: "w-4 h-4" }))
        )
    )
);


// Header Component
const Header = ({ currentView, setView, language, setLanguage, isAuthenticated, currentUser, onLoginClick, onLogout, theme, toggleTheme, onMenuToggle, onAdminClick }) => {
  const t = i18n[language];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Updated Navigation: Replaced Features/Industries with Workflow
  const navLinks = [
    { view: AppView.Home, label: t.navHome, isPage: true },
    { view: AppView.Workflow, label: t.navWorkflow, isPage: true },
    { view: AppView.Pricing, label: t.navPricing, isPage: true },
    { view: AppView.Contact, label: t.navContact, isPage: true },
  ];

  const handleNavClick = (link) => {
      if (link.isPage) {
          setView(link.view);
      } else {
          // Fallback for anchors if needed
          document.getElementById(link.view)?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return React.createElement('header', { className: "sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border" },
    React.createElement('nav', { className: "container mx-auto px-6 py-3 flex justify-between items-center" },
      React.createElement('button', { onClick: () => setView(AppView.Home), className: "flex items-center gap-3" },
          React.createElement(Logo, null)
      ),
      React.createElement('div', { className: 'hidden md:flex items-center gap-8' },
        navLinks.map(link => 
          React.createElement('button', {
            key: link.view,
            onClick: () => handleNavClick(link),
            className: `text-base font-medium transition-colors duration-300 ${ currentView === link.view ? 'text-brand-purple-light' : 'text-brand-text-light hover:text-white'}`
          }, link.label)
        )
      ),
      React.createElement('div', { className: 'hidden md:flex items-center gap-4' },
        isAuthenticated ? (
          React.createElement('div', { className: 'flex items-center gap-4' },
             React.createElement('button', { 
                 onClick: () => setView(AppView.Dashboard), 
                 className: "font-semibold bg-button-gradient text-white px-5 py-2 rounded-lg transition-opacity hover:opacity-90 shadow-md shadow-brand-purple/20 text-sm" 
             }, t.navDashboard),
             React.createElement('div', { className: 'flex items-center gap-2 pl-4 border-l border-white/10 relative' },
                React.createElement('button', { 
                    onClick: () => setIsUserMenuOpen(!isUserMenuOpen),
                    className: 'flex items-center gap-2 focus:outline-none'
                },
                    React.createElement('div', { className: 'w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple-light border border-brand-purple/30' },
                        React.createElement(UserIcon, { className: 'w-5 h-5' })
                    ),
                    React.createElement('div', { className: 'flex flex-col items-start' },
                        React.createElement('span', { className: 'text-sm font-semibold text-white leading-none' }, currentUser?.fullName?.split(' ')[0] || 'User'),
                        React.createElement('span', { className: 'text-[10px] text-brand-text-light' }, "My Account")
                    )
                ),
                isUserMenuOpen && React.createElement('div', { 
                    className: "absolute top-full right-0 mt-2 w-48 bg-dark-card-solid border border-dark-border rounded-lg shadow-xl py-2 z-50 animate-fade-in-up"
                },
                    React.createElement('button', {
                         onClick: () => { setView(AppView.Projects); setIsUserMenuOpen(false); },
                         className: "w-full text-left px-4 py-2 text-sm text-brand-text-light hover:bg-white/10 hover:text-white flex items-center gap-2"
                    }, React.createElement(FolderIcon, { className: "w-4 h-4" }), t.navProjects),
                    React.createElement('button', {
                         onClick: () => { setView(AppView.Settings); setIsUserMenuOpen(false); },
                         className: "w-full text-left px-4 py-2 text-sm text-brand-text-light hover:bg-white/10 hover:text-white flex items-center gap-2"
                    }, React.createElement(SettingsIcon, { className: "w-4 h-4" }), t.navSettings),
                    React.createElement('button', {
                         onClick: () => { onAdminClick(); setIsUserMenuOpen(false); },
                         className: "w-full text-left px-4 py-2 text-sm text-brand-text-light hover:bg-white/10 hover:text-white flex items-center gap-2"
                    }, React.createElement(LockIcon, { className: "w-4 h-4" }), t.navAdmin),
                    React.createElement('div', { className: "border-t border-dark-border my-1" }),
                    React.createElement('button', {
                        onClick: () => { onLogout(); setIsUserMenuOpen(false); },
                        className: "w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300"
                    }, t.logout)
                )
             )
          )
        ) : (
          React.createElement('button', { onClick: onLoginClick, className: "font-semibold bg-button-gradient text-white px-6 py-2 rounded-lg transition-opacity hover:opacity-90 shadow-md shadow-brand-purple/20" }, t.loginRegister)
        ),
         React.createElement('button', {
          onClick: () => setLanguage(language === Language.EN ? Language.AR : Language.EN),
          className: "text-sm font-semibold text-white px-3 py-1.5 rounded-full hover:bg-dark-card-solid transition-colors"
        }, language === Language.EN ? 'العربية' : 'English')
      ),
      React.createElement('div', { className: "md:hidden" },
        React.createElement('button', { onClick: onMenuToggle, className: "p-2 text-brand-text-light rounded-md" }, React.createElement(MenuIcon, null))
      )
    )
  );
};

// Mobile Menu Component
const MobileMenu = ({ isOpen, onClose, currentView, setView, language, setLanguage, isAuthenticated, onLoginClick, onLogout, onAdminClick }) => {
    if (!isOpen) return null;
    const t = i18n[language];
    
    // Updated Links for Mobile
    const navLinks = [
        { view: AppView.Home, label: t.navHome, isPage: true },
        { view: AppView.Workflow, label: t.navWorkflow, isPage: true },
        { view: AppView.Pricing, label: t.navPricing, isPage: true },
        { view: AppView.Contact, label: t.navContact, isPage: true },
    ];

    const handleNavigate = (link) => {
        if (link.isPage) {
          setView(link.view);
        } else {
            document.getElementById(link.view)?.scrollIntoView({ behavior: 'smooth' });
        }
        onClose();
    };

    return React.createElement('div', { className: "fixed inset-0 z-[100] bg-dark-bg" },
        React.createElement('div', { className: 'flex justify-between items-center px-6 py-3 border-b border-dark-border' },
            React.createElement('button', { onClick: () => handleNavigate({view: AppView.Home, isPage: true}), className: "flex items-center gap-3" },
                React.createElement(Logo, null)
            ),
            React.createElement('button', { onClick: onClose, className: "p-2 text-brand-text-light" }, React.createElement(CloseIcon, null))
        ),
        React.createElement('div', { className: 'p-6 flex flex-col h-[calc(100vh-69px)]' },
            React.createElement('div', { className: 'flex-grow space-y-2 text-center' },
                navLinks.map(link => 
                    React.createElement('button', { 
                        key: link.view, 
                        onClick: () => handleNavigate(link), 
                        className: `w-full text-lg py-3 rounded-md hover:bg-dark-card-solid ${ currentView === link.view ? 'text-brand-purple-light' : 'text-white'}` 
                    }, link.label)
                ),
                 isAuthenticated && React.createElement('button', {
                    onClick: () => { setView(AppView.Projects); onClose(); },
                    className: `w-full text-lg py-3 rounded-md hover:bg-dark-card-solid text-brand-text-light`
                }, t.navProjects),
                 isAuthenticated && React.createElement('button', {
                    onClick: () => { setView(AppView.Settings); onClose(); },
                    className: `w-full text-lg py-3 rounded-md hover:bg-dark-card-solid text-brand-text-light`
                }, t.navSettings),
                React.createElement('button', {
                    onClick: () => { onAdminClick(); onClose(); },
                    className: `w-full text-lg py-3 rounded-md hover:bg-dark-card-solid text-brand-text-light`
                }, t.navAdmin)
            ),
            React.createElement('div', { className: 'mt-auto pt-6 border-t border-dark-border space-y-4' },
                isAuthenticated 
                    ? React.createElement('button', { onClick: () => {setView(AppView.Dashboard); onClose();}, className: "w-full text-lg py-3 rounded-lg bg-button-gradient text-white font-bold" }, t.navDashboard)
                    : React.createElement('button', { onClick: () => {onLoginClick(); onClose();}, className: "w-full text-lg py-3 rounded-lg bg-button-gradient text-white font-bold" }, t.loginRegister)
            )
        )
    );
};

// Footer (Unchanged, mostly)
const Footer = ({ language, setView, contactEmail, onAdminClick }) => {
  const t = i18n[language];
  const SocialIcon = ({ href, children }) => React.createElement('a', { href, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 flex items-center justify-center rounded-full bg-dark-card-solid hover:bg-brand-purple text-white transition-colors" }, children);

  return React.createElement('footer', { className: "bg-dark-bg border-t border-dark-border" },
    React.createElement('div', { className: "container mx-auto px-6 py-12" },
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-8" },
        React.createElement('div', { className: "md:col-span-1" },
          React.createElement('button', { onClick: () => setView(AppView.Home), className: "flex items-center gap-3 mb-4" },
            React.createElement(Logo, null)
          ),
          React.createElement('p', { className: "text-brand-text-light text-sm" }, t.homeHeroDescription)
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: "font-bold text-lg text-white mb-4" }, "Links"),
          React.createElement('ul', { className: "space-y-3" },
            // Updated Footer Links
            React.createElement('li', null, React.createElement('button', { onClick: () => setView(AppView.Workflow), className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navWorkflow)),
            React.createElement('li', null, React.createElement('button', { onClick: () => setView(AppView.Contact), className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navContact)),
            React.createElement('li', null, React.createElement('button', { onClick: onAdminClick, className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navAdmin))
          )
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: "font-bold text-lg text-white mb-4" }, "Help"),
          React.createElement('ul', { className: "space-y-3" },
            React.createElement('li', null, React.createElement('button', { onClick: () => setView(AppView.Pricing), className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navPricing)),
            React.createElement('li', null, React.createElement('button', { onClick: () => setView(AppView.Terms), className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navTerms)),
            React.createElement('li', null, React.createElement('button', { onClick: () => setView(AppView.Privacy), className: "text-brand-text-light hover:text-brand-purple-light transition-colors" }, t.navPrivacy))
          )
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: "font-bold text-lg text-white mb-4" }, t.navContact),
          React.createElement('p', { className: "text-brand-text-light" }, contactEmail)
        )
      ),
      React.createElement('div', { className: "mt-12 border-t border-dark-border pt-8 flex flex-col md:flex-row justify-between items-center" },
        React.createElement('p', { className: "text-sm text-brand-text-light" }, `© ${new Date().getFullYear()} PM Roadmap. All Rights Reserved.`),
        React.createElement('div', { className: "flex items-center gap-4 mt-4 md:mt-0" },
           React.createElement(SocialIcon, { href: "https://www.facebook.com/people/AI-Roadmap/61580962796113" }, React.createElement(FacebookIcon, null)),
           React.createElement(SocialIcon, { href: "https://www.linkedin.com/company/ai-roadmap-co" }, React.createElement(LinkedinIcon, null)),
           React.createElement(SocialIcon, { href: "https://t.me/SciGenius" }, React.createElement(TelegramIcon, null))
        )
      )
    )
  );
};

// Main App Component
const App = () => {
  const [view, setView] = useState(AppView.Home);
  const [language, setLanguage] = useState(Language.EN);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthModalAdminMode, setIsAuthModalAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Track dismissed warnings for this session
  const [dismissedWarnings, setDismissedWarnings] = useState({ api: false, supabase: false });
  
  // Admin Logic
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState(() => {
      try {
        const saved = localStorage.getItem('adminSettings');
        return saved ? JSON.parse(saved) : {
            bgIntensity: 0.6,
            showCityscape: true,
            contactEmail: 'info@roadmap.casa',
            contactPhone: '+966-54 239 8764'
        };
      } catch (e) {
        return {
            bgIntensity: 0.6,
            showCityscape: true,
            contactEmail: 'info@roadmap.casa',
            contactPhone: '+966-54 239 8764'
        };
      }
  });

  const updateAdminSettings = (newSettings) => {
      setAdminSettings(newSettings);
      localStorage.setItem('adminSettings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
  }, [language]);
  
  // Auth & Init
  useEffect(() => {
    // Safety check for critical config timeout (prevent black screen hang)
    const safetyTimeout = setTimeout(() => {
        if (isAuthChecking) {
            console.warn("Auth check timed out, forcing render.");
            setIsAuthChecking(false);
        }
    }, 3000);

    if (!supabase) {
        setIsAuthChecking(false);
        clearTimeout(safetyTimeout);
        // We allow running without Supabase (Offline mode)
        return;
    }

    let mounted = true;

    const initializeAuth = async () => {
        try {
            const user = await getCurrentUser();
            
            if (mounted) {
                if (user) {
                    setCurrentUser(user);
                }
                setIsAuthChecking(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!mounted) return;
                
                if (event === 'INITIAL_SESSION') return;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    const updatedUser = await getCurrentUser();
                    if (mounted) {
                         setCurrentUser(updatedUser);
                         if (event === 'SIGNED_IN') setView(AppView.Dashboard);
                    }
                } 
                else if (event === 'SIGNED_OUT') {
                    if (mounted) {
                        setCurrentUser(null);
                        setView(AppView.Home);
                    }
                }
            });

            return () => {
                subscription?.unsubscribe();
            };

        } catch (e) {
            console.error("Auth initialization error:", e);
            if (mounted) setIsAuthChecking(false);
        }
    };

    const unsubscribePromise = initializeAuth();

    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
        setIsWelcomeModalOpen(true);
        sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    }

    return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, []); 

  
  const handleLogout = async () => {
    try {
        await signOut();
    } catch(e) {
        console.error("Sign out error", e);
    } finally {
        setCurrentUser(null);
        setView(AppView.Home);
    }
  };

  const handleLoginSuccess = async () => {
      setIsAuthChecking(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      setIsAuthChecking(false);
      setIsAuthModalOpen(false);
      setView(AppView.Dashboard);
  };

  const handleAdminAccess = () => {
      if (isAdminAuthenticated) {
          setView(AppView.Admin);
      } else {
          setIsAuthModalAdminMode(true);
          setIsAuthModalOpen(true);
      }
  };

  const handleAdminLoginSuccess = () => {
      setIsAdminAuthenticated(true);
      setIsAuthModalOpen(false);
      setView(AppView.Admin);
  };

  // Project Manager Handlers
  const handleOpenProject = (projectId) => {
      setSelectedProjectId(projectId);
      setView(AppView.Dashboard);
  };

  const handleNewProject = () => {
      setSelectedProjectId(null); // Clear selection to trigger new project state in Dashboard
      setView(AppView.Dashboard);
  };

  if (isAuthChecking) {
      return React.createElement('div', { className: "min-h-screen flex items-center justify-center bg-dark-bg text-white" },
        React.createElement(Spinner, { size: "12" })
      );
  }

  const renderView = () => {
    const props = { language, setView, currentUser, theme, onLoginClick: () => { setIsAuthModalAdminMode(false); setIsAuthModalOpen(true); } };
    
    switch (view) {
      case AppView.Home: 
        return React.createElement(Home, { ...props, settings: adminSettings });
      case AppView.Workflow:
        return React.createElement(Workflow, props);
      case AppView.Dashboard: 
        return React.createElement(Dashboard, { 
            ...props, 
            onLogout: handleLogout, 
            initialProjectId: selectedProjectId,
            onBackToProjects: () => setView(AppView.Projects)
        });
      case AppView.Projects:
          return React.createElement(ProjectManager, {
              currentUser,
              onSelectProject: handleOpenProject,
              onNewProject: handleNewProject
          });
      case AppView.Admin:
         return React.createElement(AdminDashboard, { 
             language, 
             settings: adminSettings, 
             onUpdateSettings: updateAdminSettings,
             isAuthenticated: isAdminAuthenticated,
             onLogout: () => { setIsAdminAuthenticated(false); setView(AppView.Home); }
         });
      case AppView.Settings:
          return React.createElement(UserSettings, { ...props });
      case AppView.About: return React.createElement(About, props);
      case AppView.Contact: return React.createElement(Contact, { ...props, settings: adminSettings });
      case AppView.Pricing: return React.createElement(Pricing, props);
      case AppView.Terms: return React.createElement(Terms, props);
      case AppView.Privacy: return React.createElement(Privacy, props);
      default: 
        return React.createElement(Home, { ...props, settings: adminSettings });
    }
  };

  const apiKeyMissing = !isAnyModelConfigured() && !dismissedWarnings.api;
  const supabaseMissing = !supabase && !dismissedWarnings.supabase;

  return React.createElement('div', { className: "min-h-screen flex flex-col font-sans" },
    // System Warnings
    (apiKeyMissing || supabaseMissing) && React.createElement('div', { className: "sticky top-0 z-[60]" },
        apiKeyMissing && React.createElement(SystemWarning, { 
            message: "API Key missing. AI features disabled.", 
            actionLabel: "Configure",
            onAction: handleAdminAccess,
            onDismiss: () => setDismissedWarnings(prev => ({ ...prev, api: true }))
        }),
        supabaseMissing && React.createElement(SystemWarning, { 
            message: "Supabase disconnected. Cloud features disabled.", 
            actionLabel: "Info",
            onAction: () => alert("Configure SUPABASE_URL in env.js to enable."),
            onDismiss: () => setDismissedWarnings(prev => ({ ...prev, supabase: true }))
        })
    ),

    React.createElement(Header, {
      currentView: view,
      setView: setView,
      language: language,
      setLanguage: setLanguage,
      isAuthenticated: !!currentUser,
      currentUser: currentUser,
      onLoginClick: () => { setIsAuthModalAdminMode(false); setIsAuthModalOpen(true); },
      onLogout: handleLogout,
      theme: theme,
      toggleTheme: toggleTheme,
      onMenuToggle: () => setIsMobileMenuOpen(true),
      onAdminClick: handleAdminAccess
    }),
    React.createElement(MobileMenu, {
      isOpen: isMobileMenuOpen,
      onClose: () => setIsMobileMenuOpen(false),
      currentView: view,
      setView: setView,
      language: language,
      setLanguage: setLanguage,
      isAuthenticated: !!currentUser,
      onLoginClick: () => { setIsAuthModalAdminMode(false); setIsAuthModalOpen(true); },
      onLogout: handleLogout,
      onAdminClick: handleAdminAccess
    }),
    
    React.createElement('main', { className: "flex-grow flex flex-col" },
        renderView()
    ),

    (view !== AppView.Dashboard && view !== AppView.Admin && view !== AppView.Settings && view !== AppView.Projects) && React.createElement(Footer, { 
        language: language, 
        setView: setView, 
        contactEmail: adminSettings.contactEmail,
        onAdminClick: handleAdminAccess
    }),
    React.createElement(AuthModal, {
      isOpen: isAuthModalOpen,
      onClose: () => setIsAuthModalOpen(false),
      language: language,
      setView: setView,
      initialAdminMode: isAuthModalAdminMode,
      onAdminLoginSuccess: handleAdminLoginSuccess,
      onLoginSuccess: handleLoginSuccess
    }),
    React.createElement(WelcomeModal, {
      isOpen: isWelcomeModalOpen,
      onClose: () => setIsWelcomeModalOpen(false),
      onAuthClick: () => {
        setIsWelcomeModalOpen(false);
        setIsAuthModalAdminMode(false);
        setIsAuthModalOpen(true);
      },
      language: language
    })
  );
};

export default App;