import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';

// Use SSG by default in Next.js App Router (Standard)
// This page is static unless dynamic functions like headers() or cookies() are used.

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 selection:bg-blue-500 selection:text-white">
      <Navbar />
      <Hero />
      <Features />

      {/* Call to Action Section (Bonus) */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90 dark:opacity-80" />
        <div className="absolute inset-0 bg-[url('https://zygotrix.fra1.cdn.digitaloceanspaces.com/cdn/patterns/circuit-board.svg')] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Evolve Your Infrastructure?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 500+ forward-thinking companies building the future with Zygotrix's biological AI engine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200">
              Get Started Now
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}