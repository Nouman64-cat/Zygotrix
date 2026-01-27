import React from 'react';
import { FaDna, FaBrain, FaShieldAlt, FaChartLine, FaCode, FaAtom } from 'react-icons/fa';

const features = [
    {
        icon: <FaDna />,
        title: 'Genetic Algorithms',
        description: 'Our AI evolves solutions by mimicking natural selection, finding optimal paths through complex problem spaces.'
    },
    {
        icon: <FaBrain />,
        title: 'Neural Evolution',
        description: 'Self-improving neural networks that adapt their architecture based on real-time datastreams.'
    },
    {
        icon: <FaCode />,
        title: 'Self-Healing Code',
        description: 'Autonomous systems that detect, diagnose, and patch vulnerabilities without human intervention.'
    },
    {
        icon: <FaChartLine />,
        title: 'Predictive Analytics',
        description: 'Forecast market trends and user behaviors with 99.8% accuracy using our proprietary biological models.'
    },
    {
        icon: <FaAtom />,
        title: 'Quantum Ready',
        description: 'Architecture built to seamlessly integrate with next-generation quantum processing units.'
    },
    {
        icon: <FaShieldAlt />,
        title: 'Secure by Nature',
        description: 'Immutable security protocols inspired by biological immune systems for unshakeable defense.'
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-slate-50 dark:bg-gray-900/50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase text-sm mb-3">
                        Core Technology
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">
                        Intelligence That Adapts and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Expands</span>
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        Zygotrix isn't just another AI. It's a living system that learns from its environment to provide unparalleled results.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-2xl text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                                {feature.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
