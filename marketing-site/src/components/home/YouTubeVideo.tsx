"use client";

import React from "react";

const YouTubeVideo: React.FC = () => {
    return (
        <section className="py-16 bg-white dark:bg-gray-950 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
                        Experience the <span className="text-emerald-500 dark:text-emerald-400">Future of Genetics</span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Watch our platform overview to see how Zygotrix streamlines genetic analysis and inheritance modeling.
                    </p>
                </div>

                <div className="relative group mx-auto max-w-5xl">
                    {/* Outer Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                    {/* Video Container */}
                    <div className="relative overflow-hidden rounded-[1.5rem] border border-gray-200 dark:border-gray-800 bg-black shadow-2xl">
                        <div className="aspect-video w-full">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/lRU3yOf5S7Q?si=qPNhdAwPV6CKRl99"
                                title="Zygotrix Platform Demo"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                </div>
            </div>
        </section>
    );
};

export default YouTubeVideo;
