import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaGithub, FaLinkedin, FaDiscord } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400" />
                            <span className="text-xl font-bold text-slate-900 dark:text-white">Zygotrix</span>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Pioneering the future of artificial intelligence through biological computing and evolutionary algorithms.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors"><FaTwitter size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><FaGithub size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><FaLinkedin size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><FaDiscord size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><a href="#" className="hover:text-blue-500">Features</a></li>
                            <li><a href="#" className="hover:text-blue-500">Integrations</a></li>
                            <li><a href="#" className="hover:text-blue-500">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-500">Changelog</a></li>
                            <li><a href="#" className="hover:text-blue-500">Docs</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><a href="#" className="hover:text-blue-500">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-500">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-500">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-500">Contact</a></li>
                            <li><a href="#" className="hover:text-blue-500">Partners</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><a href="#" className="hover:text-blue-500">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-500">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-blue-500">Cookie Policy</a></li>
                            <li><a href="#" className="hover:text-blue-500">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-slate-500 dark:text-slate-500">
                        &copy; {currentYear} Zygotrix AI Inc. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-500">
                        <span>Made with 🧬 in Silicon Valley</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
