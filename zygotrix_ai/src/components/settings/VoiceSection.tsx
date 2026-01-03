import React, { useState, useEffect, useCallback, memo } from 'react';
import { MdMic } from 'react-icons/md';
import { Button } from '../common';
import { useVoiceControl } from '../../contexts';

// Separate memoized components for sliders to prevent full section rerenders
const SliderControl = memo(({
    value,
    onChange,
    min,
    max,
    step,
    startLabel = "Slow",
    endLabel = "Fast"
}: {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    startLabel?: string;
    endLabel?: string;
}) => (
    <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 w-12">{startLabel}</span>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <span className="text-sm text-gray-500 w-12">{endLabel}</span>
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 w-12 text-right">
            {value.toFixed(1)}x
        </span>
    </div>
));

SliderControl.displayName = 'SliderControl';

export const VoiceSection: React.FC = () => {
    const { voiceSettings, setVoiceSettings, speak } = useVoiceControl();
    // ... (rest of the component state)
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    // Local state for sliders (debounced updates)
    const [localRate, setLocalRate] = useState(voiceSettings.rate);
    const [localPitch, setLocalPitch] = useState(voiceSettings.pitch);
    const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // ... (useEffects)
    useEffect(() => {
        if (voicesLoaded) return;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setAvailableVoices(voices);
                setVoicesLoaded(true);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [voicesLoaded]);

    useEffect(() => {
        setLocalRate(voiceSettings.rate);
        setLocalPitch(voiceSettings.pitch);
    }, [voiceSettings.rate, voiceSettings.pitch]);

    // ... (handlers)
    const handleRateChange = useCallback((value: number) => {
        setLocalRate(value);
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            setVoiceSettings(prev => ({ ...prev, rate: value }));
        }, 150);
    }, [setVoiceSettings]);

    const handlePitchChange = useCallback((value: number) => {
        setLocalPitch(value);
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            setVoiceSettings(prev => ({ ...prev, pitch: value }));
        }, 150);
    }, [setVoiceSettings]);

    const testVoice = useCallback(() => {
        speak("Hello! This is how I sound with your current settings. I'm your Zygotrix voice assistant.");
    }, [speak]);

    const handleVoiceReset = useCallback(() => {
        setVoiceSettings({ rate: 1.2, pitch: 1.0, voiceIndex: 0 });
        setLocalRate(1.2);
        setLocalPitch(1.0);
    }, [setVoiceSettings]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, []);

    return (
        <div className="space-y-6">
            {/* Voice Selection */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Voice Character
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose the voice for your AI assistant
                </p>
                <select
                    value={voiceSettings.voiceIndex}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceIndex: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                    {availableVoices.map((voice, index) => (
                        <option key={index} value={index}>
                            {voice.name} ({voice.lang})
                        </option>
                    ))}
                </select>
            </section>

            {/* Speed Control */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Speaking Speed
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Adjust how fast the assistant speaks
                </p>
                <SliderControl
                    value={localRate}
                    onChange={handleRateChange}
                    min={0.5}
                    max={2}
                    step={0.1}
                    startLabel="Slow"
                    endLabel="Fast"
                />
            </section>

            {/* Pitch Control */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Voice Pitch
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Adjust the tone of the voice
                </p>
                <SliderControl
                    value={localPitch}
                    onChange={handlePitchChange}
                    min={0.5}
                    max={2}
                    step={0.1}
                    startLabel="Low"
                    endLabel="High"
                />
            </section>

            {/* Preview Button */}
            <section className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Test Your Voice Settings
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to hear a preview with your current settings
                        </p>
                    </div>
                    <Button
                        onClick={testVoice}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                        <MdMic className="w-5 h-5" />
                        Preview Voice
                    </Button>
                </div>
            </section>

            {/* Reset to Default */}
            <div className="flex justify-end">
                <button
                    onClick={handleVoiceReset}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                    Reset to defaults
                </button>
            </div>
        </div>
    );
};
