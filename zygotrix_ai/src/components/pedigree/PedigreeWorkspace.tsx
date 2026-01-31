import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuDna, LuSend, LuLoader } from 'react-icons/lu';

import type { PedigreeStructure, GeneticAnalysisResult } from '../../types';
import pedigreeService from '../../services/pedigree/pedigree.service';
import FamilyTreeVisualizer from './FamilyTreeVisualizer';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export default function PedigreeWorkspace() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: "Welcome to the **Zygotrix Pedigree Lab**. \n\nDescribe a family history (e.g., *'My grandfather had blue eyes...'*), and I will visualize the genetic inheritance pattern and analyze probability vectors.",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Workspace State
    const [pedigreeData, setPedigreeData] = useState<PedigreeStructure | undefined>(undefined);
    const [analysisResult, setAnalysisResult] = useState<GeneticAnalysisResult | undefined>(undefined);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {


            const response = await pedigreeService.analyze({
                query: userMsg.content,
                // In a real app, passing history context would be good
            });

            // Update Visualization
            if (response.structured_data) {
                setPedigreeData(response.structured_data);
            }
            if (response.analysis_result) {
                setAnalysisResult(response.analysis_result);
            }

            const aiMsg: Message = {
                id: Date.now().toString() + 'ai',
                role: 'ai',
                content: response.ai_message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: Date.now().toString() + 'err',
                role: 'ai',
                content: "⚠️ **System Error**: Failed to connect to the Genetic Calculation Engine. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            // Focus back usually, but maybe not on mobile
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full h-screen flex flex-col md:flex-row bg-black text-gray-100 overflow-hidden font-sans">
            {/* LEFT PANEL: Chat Interface */}
            <div className="w-full md:w-1/2 lg:w-[450px] flex flex-col border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-sm z-10">

                {/* Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-950">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 border border-blue-500/30">
                        <LuDna className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-wider uppercase text-blue-100">Pedigree Analyst</h1>
                        <p className="text-[10px] text-zinc-500 font-mono">NEURO-SYMBOLIC GENETICS ENGINE</p>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                {/* Role Label */}
                                <div className={`flex items-center text-[10px] font-mono mb-1 ${msg.role === 'user' ? 'justify-end text-zinc-500' : 'text-blue-400'}`}>
                                    {msg.role === 'user' ? 'YOU' : 'ZYGOTRIX OS'}
                                    <span className="ml-2 opacity-50">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Bubble */}
                                <div className={`p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-zinc-800 text-white rounded-tr-none'
                                    : 'bg-blue-950/20 border border-blue-900/30 text-zinc-200 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.role === 'ai' ? (
                                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-blue-200 prose-headings:font-bold prose-headings:text-xs prose-headings:uppercase prose-headings:tracking-widest prose-strong:text-cyan-300 prose-strong:font-bold">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Custom styling for markdown elements
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%] bg-blue-950/10 border border-blue-900/20 p-3 rounded-xl rounded-tl-none flex items-center space-x-3">
                                <LuLoader className="animate-spin text-blue-400 w-4 h-4" />
                                <span className="text-xs text-blue-300 font-mono animate-pulse">ANALYZING PHENOTYPES...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="relative flex items-end bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe family traits..."
                            className="flex-1 bg-transparent border-none text-sm text-gray-200 placeholder-zinc-600 focus:ring-0 resize-none p-3 max-h-32 min-h-[50px] scrollbar-hide"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isLoading}
                            className="p-3 mb-1 mr-1 text-zinc-400 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <LuSend className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-2 text-center">
                        ZYGOTRIX BIOLOGICAL ENGINE v2.1
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Live Lab (Visualization) */}
            <div className="flex-1 bg-black relative overflow-hidden">
                {/* ADVANCED DEBUG CONSOLE */}
                <div className="absolute top-12 right-4 z-50 p-4 bg-black/95 border border-red-500/50 text-xs font-mono text-green-400 max-w-sm max-h-[500px] overflow-auto rounded-lg pointer-events-auto shadow-2xl backdrop-blur-md">
                    <div className="font-bold text-white mb-2 border-b border-white/20 pb-1 flex justify-between">
                        <span>Zygotrix Debug Console</span>
                        <span className="text-[10px] bg-red-900/50 px-1 rounded text-red-200">INTERNAL USE</span>
                    </div>
                    <div className="mb-1">Loading: <span className={isLoading ? "text-yellow-400 animate-pulse" : "text-white"}>{isLoading.toString()}</span></div>
                    <div className="mb-1">Members: <span className="text-white">{pedigreeData?.members?.length || 0}</span></div>
                    <div className="mb-1">Result: <span className="text-white">{analysisResult?.status || 'N/A'}</span></div>

                    <div className="mt-2 font-bold text-white/70">Raw Data Payload:</div>
                    <pre className="mt-1 text-[9px] leading-3 opacity-70 break-all whitespace-pre-wrap bg-zinc-900/50 p-2 rounded border border-white/5">
                        {pedigreeData ? JSON.stringify(pedigreeData, null, 2) : 'No Data'}
                    </pre>

                    <div className="mt-4 font-bold text-white/70">Analysis Payload:</div>
                    <pre className="mt-1 text-[9px] leading-3 opacity-70 break-all whitespace-pre-wrap bg-zinc-900/50 p-2 rounded border border-white/5">
                        {analysisResult ? JSON.stringify(analysisResult, null, 2) : 'No Result'}
                    </pre>
                </div>

                {/* Grid Background Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* Visualization Component */}
                <FamilyTreeVisualizer
                    data={pedigreeData}
                    analysisResult={analysisResult}
                    isLoading={isLoading && !pedigreeData}
                />
            </div>

            {/* Mobile Tab Switcher (Visible only on small screens) */}
            <div className="md:hidden fixed bottom-4 right-4 z-50">
                {/* Toggle logic here if fully implementing mobile tabs, for now assume Stack */}
            </div>
        </div>
    );
}
