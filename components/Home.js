

import React, { useState, useEffect } from 'react';
import { i18n, AppView } from '../constants.js';
import { PlanningIcon, RiskIcon, BudgetIcon, AgentIcon, ScheduleIcon, CheckIcon, CloseIcon } from './Shared.js';

// --- Feature Modal Component (New) ---
const FeatureModal = ({ feature, onClose, language }) => {
    if (!feature) return null;

    const Icon = feature.icon;

    return React.createElement('div', {
        className: "fixed inset-0 bg-black/80 z-[200] flex justify-center items-center backdrop-blur-sm p-4 animate-fade-in-up",
        onClick: onClose,
    },
        React.createElement('div', {
            className: "bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl border border-dark-border transform transition-all glow-border overflow-hidden",
            onClick: e => e.stopPropagation(),
        },
            React.createElement('div', { className: 'relative' },
                React.createElement('img', {
                    src: feature.image,
                    alt: feature.title,
                    className: 'w-full h-72 object-cover'
                }),
                React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/60 to-transparent' }),
                React.createElement('button', {
                    onClick: onClose,
                    className: "absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 p-1.5 rounded-full transition-colors"
                }, React.createElement(CloseIcon, null))
            ),
            React.createElement('div', { className: 'p-8 pt-0 text-center relative' },
                 React.createElement('div', { className: 'flex justify-center mb-4' },
                     React.createElement('div', { className: 'p-4 bg-dark-card rounded-full -mt-12 border-2 border-dark-border shadow-lg' },
                        React.createElement(Icon, { className: 'h-12 w-12 text-brand-purple-light' })
                    )
                ),
                React.createElement('h2', { className: "text-2xl font-bold text-brand-text" }, feature.title),
                React.createElement('p', { className: "text-brand-text-light mt-2 mb-6" }, feature.desc),
                React.createElement('button', {
                    onClick: onClose,
                    className: "w-full bg-button-gradient text-white font-bold py-3 px-4 rounded-lg transition-opacity hover:opacity-90 shadow-lg shadow-brand-purple/20"
                }, "Explore Feature")
            )
        )
    );
};

// --- Animated Cityscape Component (Unchanged) ---
const AnimatedCityscape = () => {
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationKey(prevKey => prevKey + 1);
        }, 60000); // Re-trigger animation every 1 minute

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);
    
    const buildings = [
        { x: 0, y: 150, width: 60, height: 150, delay: '0.2s', color: 'url(#grad1)' },
        { x: 70, y: 100, width: 80, height: 200, delay: '0s', color: 'url(#grad2)' },
        { x: 160, y: 50, width: 70, height: 250, delay: '0.4s', color: 'url(#grad1)' },
        { x: 240, y: 120, width: 50, height: 180, delay: '0.6s', color: 'url(#grad3)' },
        { x: 450, y: 160, width: 70, height: 140, delay: '0.5s', color: 'url(#grad3)' },
        { x: 530, y: 30, width: 60, height: 270, delay: '0.3s', color: 'url(#grad2)' },
        { x: 600, y: 180, width: 50, height: 120, delay: '0.7s', color: 'url(#grad1)' },
        { x: 660, y: 130, width: 60, height: 170, delay: '0.9s', color: 'url(#grad3)' },
    ];
    
    const iconicTower = {
        x: 310,
        y: 0,
        width: 90,
        height: 300,
        delay: '0.25s',
        color: 'url(#floorPattern)'
    };

    const cranes = [
        { x: 200, y: 50, armLength: 80, delay: '2s' },
        { x: 480, y: 160, armLength: 60, delay: '1s' }
    ];

    const BuildingWithWindows = ({ b }) => {
        const windowWidth = 6;
        const windowHeight = 8;
        const gap = 4;
        
        const windows = [];
        const numCols = Math.floor((b.width - gap) / (windowWidth + gap));
        const numRows = Math.floor((b.height - gap) / (windowHeight + gap));

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                const x = b.x + gap + col * (windowWidth + gap) + (b.width - (numCols * (windowWidth + gap) - gap)) / 2;
                const y = b.y + gap + row * (windowHeight + gap);
                const isBlinking = Math.random() > 0.85;
                windows.push({ x, y, isBlinking });
            }
        }

        return React.createElement('g', {
            className: 'building',
            style: { animationDelay: b.delay }
        },
            React.createElement('rect', {
                x: b.x, y: b.y,
                width: b.width, height: b.height,
                fill: b.color,
            }),
            windows.map((w, i) =>
                React.createElement('rect', {
                    key: i,
                    x: w.x, y: w.y,
                    width: windowWidth, height: windowHeight,
                    fill: w.isBlinking ? 'rgba(250, 204, 21, 0.6)' : 'rgba(14, 165, 233, 0.15)',
                    className: w.isBlinking ? 'blinking-light' : ''
                })
            )
        );
    };

    const IconicTower = ({ tower }) => {
        const { x, y, width, height, color, delay } = tower;

        const midX = x + width / 2;
        const bottomY = y + height;
        const gap = 4;

        // dLeft traces the left tower based on wireframe
        const dLeft = `
            M ${midX - gap}, ${y + 2}
            L ${midX - gap}, ${bottomY - 40}
            C ${midX - gap}, ${bottomY - 15}, ${x + 30}, ${bottomY}, ${x + 15}, ${bottomY}
            L ${x}, ${bottomY}
            C ${x - 5}, ${bottomY - 120}, ${x + 15}, ${y + 80}, ${midX - gap - 10}, ${y}
            Z
        `;

        // dRight traces the right tower based on wireframe
        const dRight = `
            M ${midX + gap}, ${y + 2}
            L ${midX + gap}, ${bottomY - 40}
            C ${midX + gap}, ${bottomY - 15}, ${x + width - 30}, ${bottomY}, ${x + width - 15}, ${bottomY}
            L ${x + width}, ${bottomY}
            C ${x + width + 5}, ${bottomY - 120}, ${x + width - 15}, ${y + 80}, ${midX + gap + 10}, ${y}
            Z
        `;


        return React.createElement('g', {
            className: 'building',
            style: { animationDelay: delay }
        },
            React.createElement('path', {
                d: dLeft,
                fill: color,
            }),
            React.createElement('path', {
                d: dRight,
                fill: color,
            }),
             // Add the grid-like entrance at the base
            React.createElement('path', {
                d: `M ${midX - gap} ${bottomY - 40} L ${midX + gap} ${bottomY - 40} L ${midX + gap} ${bottomY} L ${midX - gap} ${bottomY} Z`,
                fill: 'rgba(107, 114, 128, 0.15)'
            }),
             React.createElement('path', {
                d: `M ${midX} ${bottomY - 40} L ${midX} ${bottomY}`,
                stroke: '#6b7280',
                strokeWidth: '0.5'
            }),
             React.createElement('path', {
                d: `M ${midX - gap} ${bottomY - 20} L ${midX + gap} ${bottomY - 20}`,
                stroke: '#6b7280',
                strokeWidth: '0.5'
            })
        );
    };

    return React.createElement('svg', {
        width: "100%",
        height: "100%",
        viewBox: "0 0 720 300",
        preserveAspectRatio: "xMidYMax meet",
        className: 'opacity-50'
    },
        React.createElement('defs', null,
            React.createElement('linearGradient', { id: "grad1", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#5EEAD4', stopOpacity: 0.8 } }),
                React.createElement('stop', { offset: "100%", style: { stopColor: '#2DD4BF', stopOpacity: 0.4 } })
            ),
            React.createElement('linearGradient', { id: "grad2", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#A3E635', stopOpacity: 0.7 } }),
                React.createElement('stop', { offset: "100%", style: { stopColor: '#4D7C0F', stopOpacity: 0.3 } })
            ),
            React.createElement('linearGradient', { id: "grad3", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#FACC15', stopOpacity: 0.6 } }),
                React.createElement('stop', { offset: "100%", style: { stopColor: '#B45309', stopOpacity: 0.2 } })
            ),
             React.createElement('linearGradient', { id: "gradSilver", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#f3f4f6', stopOpacity: 0.9 } }),
                React.createElement('stop', { offset: "100%", style: { stopColor: '#9ca3af', stopOpacity: 0.7 } })
            ),
            React.createElement('pattern', { id: "floorPattern", patternUnits: "userSpaceOnUse", width: "100", height: "5" },
                React.createElement('rect', { width: "100", height: "5", fill: "url(#gradSilver)" }),
                React.createElement('line', { x1: "0", y1: "0", x2: "100", y2: "0", stroke: "rgba(0,0,0,0.2)", strokeWidth: "0.75" })
            )
        ),
        buildings.map((b, i) => React.createElement(BuildingWithWindows, { key: `${animationKey}-b-${i}`, b: b })),
        React.createElement(IconicTower, { key: `${animationKey}-it`, tower: iconicTower }),
        cranes.map((c, i) => 
            React.createElement('g', { key: i, transform: `translate(${c.x}, ${c.y})`},
                React.createElement('rect', { x: -2.5, y: 0, width: 5, height: 300 - c.y, fill: '#94A3B8' }),
                React.createElement('g', { className: 'crane-arm', style: { animationDelay: c.delay } },
                    React.createElement('rect', { x: 0, y: -2.5, width: c.armLength, height: 5, fill: '#94A3B8' }),
                    React.createElement('circle', { cx: c.armLength, cy: -2.5, r: 3, fill: 'red', className: 'blinking-light' })
                )
            )
        )
    );
};


const Home = ({ language, setView, settings }) => {
    const t = i18n[language];
    const [activeFeature, setActiveFeature] = useState(null);

    // Default fallback for settings
    const bgIntensity = settings?.bgIntensity ?? 0.6;
    const showCityscape = settings?.showCityscape ?? true;

    const features = [
        { 
            id: 'planning', 
            icon: PlanningIcon, 
            title: t.whyChoose1Title, 
            desc: t.whyChoose1Desc,
            image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        { 
            id: 'scheduling', 
            icon: ScheduleIcon, 
            title: t.capability2Title,
            desc: t.capability2Desc,
            image: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        { 
            id: 'risk', 
            icon: RiskIcon, 
            title: t.whyChoose2Title, 
            desc: t.whyChoose2Desc,
            image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        { 
            id: 'budget', 
            icon: BudgetIcon, 
            title: t.whyChoose3Title, 
            desc: t.whyChoose3Desc,
            image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
    ];

    const HeroSection = () => {
        const [activeIndex, setActiveIndex] = useState(0);

        useEffect(() => {
            const interval = setInterval(() => {
                setActiveIndex(prevIndex => (prevIndex + 1) % features.length);
            }, 4000); // Slide every 4 seconds
            return () => clearInterval(interval);
        }, [features.length]);

        return React.createElement('section', { className: 'relative overflow-hidden' },
            // START NEW CODE: Gradient Lights controlled by Admin Settings
             React.createElement('div', { className: 'absolute top-0 inset-x-0 h-[800px] pointer-events-none z-0' },
                // Top Glow Line
                React.createElement('div', { className: 'absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-purple-light to-transparent', style: { opacity: 0.7 + (bgIntensity * 0.3), boxShadow: `0 0 40px rgba(94,234,212,${0.6 * bgIntensity})` } }),
                // Main Turquoise Glow
                React.createElement('div', { 
                    className: 'absolute top-[-400px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] blur-[120px] rounded-full',
                    style: { background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)', opacity: 0.4 * bgIntensity }
                }),
                // Green Hint Left
                React.createElement('div', { 
                     className: 'absolute top-[-300px] left-[10%] w-[800px] h-[600px] blur-[100px] rounded-full',
                     style: { background: 'radial-gradient(circle, #A3E635 0%, transparent 70%)', opacity: 0.2 * bgIntensity }
                }),
                // Yellow Hint Right
                 React.createElement('div', { 
                     className: 'absolute top-[-300px] right-[10%] w-[800px] h-[600px] blur-[100px] rounded-full',
                     style: { background: 'radial-gradient(circle, #FACC15 0%, transparent 70%)', opacity: 0.2 * bgIntensity }
                })
            ),
            // END NEW CODE
            React.createElement('div', { 
                className: 'absolute inset-x-0 bottom-0 z-0 h-[50vh] max-h-[400px] w-full flex items-end justify-center overflow-hidden',
                'aria-hidden': 'true'
            },
                showCityscape && React.createElement(AnimatedCityscape, null)
            ),
            React.createElement('div', { className: 'container mx-auto px-6 py-20 md:py-32' },
                 React.createElement('div', { className: 'relative z-10 grid md:grid-cols-2 gap-12 items-center' },
                    // Left: Hero Text
                    React.createElement('div', { className: 'text-center md:text-left animate-slide-in-up' },
                        React.createElement('h1', { className: 'text-4xl md:text-6xl font-extrabold text-white leading-tight' }, 
                            t.homeHeroTitle
                        ),
                        React.createElement('p', { className: 'mt-6 text-lg text-brand-text-light' }, 
                            t.homeHeroDescription
                        ),
                        React.createElement('div', { className: 'mt-8 flex justify-center md:justify-start' },
                            React.createElement('button', {
                                onClick: () => setView(AppView.Pricing),
                                className: 'px-8 py-4 bg-cta-gradient text-white font-semibold rounded-lg shadow-lg shadow-brand-purple/30 transition-all transform hover:scale-105 hover:shadow-brand-purple/50'
                            }, t.getStarted)
                        )
                    ),
                    // Right: Platform Features Card
                    React.createElement('div', { className: 'animate-slide-in-up', style: { animationDelay: '0.2s' } },
                        React.createElement('div', { className: 'bg-dark-card backdrop-blur-xl rounded-2xl p-6 glow-border' },
                            React.createElement('h3', { className: 'text-2xl font-bold text-white mb-6 text-center' }, "Platform Features"),
                            
                            // Carousel container
                            React.createElement('div', { className: 'relative overflow-hidden h-[220px]' }, // Fixed height for carousel
                                // Sliding track
                                React.createElement('div', {
                                    className: 'flex transition-transform duration-500 ease-in-out h-full',
                                    style: { transform: `translateX(-${activeIndex * 100}%)` }
                                },
                                    features.map(feature => {
                                        const Icon = feature.icon;
                                        // Each slide item
                                        return React.createElement('div', {
                                            key: feature.id,
                                            className: 'w-full flex-shrink-0 px-1 h-full'
                                        },
                                            React.createElement('button', {
                                                onClick: () => setActiveFeature(feature),
                                                className: 'w-full h-full bg-dark-card-solid border border-dark-border rounded-lg text-center hover:border-brand-purple-light transition-colors relative overflow-hidden group'
                                            },
                                                React.createElement('img', { src: feature.image, alt: feature.title, className: 'absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110' }),
                                                React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-t from-dark-card-solid via-dark-card-solid/70 to-transparent' }),
                                                React.createElement('div', { className: 'relative p-6 h-full flex flex-col items-center justify-end' },
                                                    React.createElement(Icon, { className: 'h-10 w-10 text-brand-purple-light mb-3' }),
                                                    React.createElement('h4', { className: 'font-bold text-white text-lg' }, feature.title),
                                                    React.createElement('p', { className: 'text-sm text-brand-text-light mt-1' }, feature.desc)
                                                )
                                            )
                                        );
                                    })
                                )
                            ),
                            
                            // Navigation dots
                            React.createElement('div', { className: 'flex justify-center gap-2 mt-4' },
                                features.map((_, index) =>
                                    React.createElement('button', {
                                        key: index,
                                        onClick: () => setActiveIndex(index),
                                        className: `w-2.5 h-2.5 rounded-full transition-colors ${activeIndex === index ? 'bg-brand-purple-light' : 'bg-dark-border hover:bg-dark-border/70'}`
                                    })
                                )
                            )
                        )
                    )
                 )
            )
        );
    };

    const CapabilitiesSection = () => {
        const capabilities = [
            { icon: PlanningIcon, title: t.whyChoose1Title, desc: t.whyChoose1Desc },
            { icon: ScheduleIcon, title: t.capability2Title, desc: t.capability2Desc },
            { icon: RiskIcon, title: t.capability4Title, desc: t.capability4Desc },
            { icon: BudgetIcon, title: t.capability5Title, desc: t.capability5Desc },
        ];

        return React.createElement('section', { id: 'features', className: 'py-16 md:py-24' },
            React.createElement('div', { className: 'container mx-auto px-6' },
                React.createElement('div', { className: 'text-center max-w-3xl mx-auto mb-12' },
                    React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-white' }, t.capabilitiesTitle),
                    React.createElement('p', { className: 'mt-4 text-lg text-brand-text-light' }, t.capabilitiesDescription)
                ),
                React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-8' },
                    capabilities.map((feature, index) =>
                        React.createElement('div', { 
                            key: index, 
                            className: 'bg-dark-card backdrop-blur-xl p-6 rounded-xl text-center glow-border transition-all duration-300 hover:-translate-y-2' 
                        },
                            React.createElement('div', { className: 'flex justify-center mb-4 text-brand-purple-light' }, React.createElement(feature.icon, { className: 'h-10 w-10' })),
                            React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, feature.title),
                            React.createElement('p', { className: 'text-brand-text-light' }, feature.desc)
                        )
                    )
                )
            )
        );
    };
    
    const IndustriesSection = () => {
        const industries = [
            { title: t.industry1Title, desc: t.industry1Desc, features: [t.industry1Feature1, t.industry1Feature2, t.industry1Feature3] },
            { title: t.industry2Title, desc: t.industry2Desc, features: [t.industry2Feature1, t.industry2Feature2, t.industry2Feature3] },
            { title: t.industry3Title, desc: t.industry3Desc, features: [t.industry3Feature1, t.industry3Feature2, t.industry3Feature3] },
        ];
        return React.createElement('section', { id: 'industries', className: 'py-16 md:py-24 bg-dark-card-solid' },
            React.createElement('div', { className: 'container mx-auto px-6' },
                React.createElement('div', { className: 'text-center max-w-3xl mx-auto mb-12' },
                    React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-white' }, t.industriesTitle),
                    React.createElement('p', { className: 'mt-4 text-lg text-brand-text-light' }, t.industriesDescription)
                ),
                React.createElement('div', { className: 'grid md:grid-cols-1 lg:grid-cols-3 gap-8' },
                    industries.map((industry, i) => 
                        React.createElement('div', { key: i, className: 'bg-dark-card backdrop-blur-xl rounded-xl p-8 flex flex-col glow-border' },
                            React.createElement('h3', { className: 'text-2xl font-bold text-white' }, industry.title),
                            React.createElement('p', { className: 'text-brand-text-light mt-2 mb-6 flex-grow' }, industry.desc),
                            React.createElement('ul', { className: 'space-y-3' },
                                industry.features.map((feat, fi) => React.createElement('li', { key: fi, className: 'flex items-start gap-3' },
                                    React.createElement('div', { className: 'w-5 h-5 flex-shrink-0 mt-1 flex items-center justify-center rounded-full bg-brand-purple text-white' }, React.createElement(CheckIcon, { className: 'w-3 h-3' })),
                                    React.createElement('span', { className: 'text-brand-text-light' }, feat)
                                ))
                            )
                        )
                    )
                )
            )
        )
    };

    return React.createElement('div', null,
        React.createElement(FeatureModal, { feature: activeFeature, onClose: () => setActiveFeature(null), language: language }),
        React.createElement(HeroSection, null),
        React.createElement(CapabilitiesSection, null),
        React.createElement(IndustriesSection, null)
    );
};

export default Home;