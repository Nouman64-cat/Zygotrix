import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingEffectOptions {
    /** Characters to reveal per interval */
    charsPerTick?: number;
    /** Milliseconds between each tick */
    intervalMs?: number;
    /** Whether to enable the typing animation. When false, shows full text immediately. */
    enabled?: boolean;
}

/**
 * Hook that creates a typewriter effect for text
 * When enabled is true, text is revealed gradually
 * When enabled is false, shows full text immediately
 * 
 * @param fullText The complete text to type out
 * @param options Configuration options
 * @returns The currently visible portion of the text and whether typing is in progress
 */
export const useTypingEffect = (
    fullText: string,
    options: UseTypingEffectOptions = {}
): { displayedText: string; isTyping: boolean } => {
    const {
        charsPerTick = 3,
        intervalMs = 20,
        enabled = true,
    } = options;

    // If not enabled, just return full text immediately
    const [displayedLength, setDisplayedLength] = useState(enabled ? 0 : fullText.length);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fullTextRef = useRef(fullText);
    const wasEnabled = useRef(enabled);

    // Clear any existing timer
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Update ref when fullText changes
    useEffect(() => {
        fullTextRef.current = fullText;
    }, [fullText]);

    // Handle enabled state changes
    useEffect(() => {
        if (!enabled && wasEnabled.current) {
            // Was enabled, now disabled - show full text
            clearTimer();
            setDisplayedLength(fullText.length);
        } else if (enabled && !wasEnabled.current) {
            // Was disabled, now enabled - this shouldn't normally happen
            // but if it does, start from current position
        }
        wasEnabled.current = enabled;
    }, [enabled, fullText.length, clearTimer]);

    // Main animation effect - only run when enabled
    useEffect(() => {
        if (!enabled) {
            // Not enabled, ensure full text is shown
            if (displayedLength !== fullText.length) {
                setDisplayedLength(fullText.length);
            }
            return;
        }

        // If there's more text to show and we're enabled
        if (displayedLength < fullText.length) {
            clearTimer();

            timerRef.current = setInterval(() => {
                setDisplayedLength(prev => {
                    const target = fullTextRef.current.length;
                    const next = prev + charsPerTick;

                    if (next >= target) {
                        clearTimer();
                        return target;
                    }
                    return next;
                });
            }, intervalMs);
        }

        return clearTimer;
    }, [enabled, displayedLength, fullText.length, charsPerTick, intervalMs, clearTimer]);

    // If not enabled, return full text
    if (!enabled) {
        return {
            displayedText: fullText,
            isTyping: false,
        };
    }

    return {
        displayedText: fullText.slice(0, displayedLength),
        isTyping: displayedLength < fullText.length,
    };
};
