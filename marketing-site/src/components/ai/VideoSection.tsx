import React from 'react';

const VideoSection = () => {
    return (
        <section id="demo" className="py-16 bg-white dark:bg-gray-900 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                        See Zygotrix In Action
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Watch how our biological AI engine adapts and evolves to solve complex problems in real-time.
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <div className="aspect-w-16 aspect-h-9 relative pb-[56.25%] h-0">
                        <iframe
                            src="https://www.youtube.com/embed/lRU3yOf5S7Q?si=Yz7bCd1ZUVuN8bFR"
                            title="Zygotrix AI Demo"
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            </div>
        </section>
    );
};

export default VideoSection;
