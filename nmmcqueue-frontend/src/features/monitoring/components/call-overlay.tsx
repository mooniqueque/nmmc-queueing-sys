"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, SpeakerSlash } from "@phosphor-icons/react";

interface CallOverlayProps {
    callData: { ticket: string; windowName: string; calledAt: string | null } | null;
}

const DISPLAY_DURATION_SECONDS = 5;

export function CallOverlay({ callData }: CallOverlayProps) {
    const [audioAllowed, setAudioAllowed] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initial audio unlock check
    useEffect(() => {
        const handleInteraction = () => {
            if (!audioContextRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    audioContextRef.current = new AudioContextClass();
                    audioContextRef.current.resume();
                }
            } else if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            
            // Dummy silent speech to unlock SpeechSynthesis on iOS/Safari/Chrome
            if ('speechSynthesis' in window) {
                const dummy = new SpeechSynthesisUtterance('');
                dummy.volume = 0;
                window.speechSynthesis.speak(dummy);
            }
            
            setAudioAllowed(true);
        };
        
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        
        // Eagerly load voices and attach listener for async loading (Chrome bug fix)
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
        
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    useEffect(() => {
        if (!callData) return;

        // 1. Play Bell Chime (Synthesized)
        const playChime = async () => {
             try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContextClass();
                }
                const ctx = audioContextRef.current;
                
                if (ctx?.state === 'suspended') {
                    console.log("[Audio] Attempting to unlock suspended context...");
                    await ctx.resume().catch(() => {});
                }

                if (ctx?.state === 'suspended') {
                    console.warn("[Audio] Context remains suspended. Autoplay is blocked by the browser. Awaiting user interaction.");
                    setAudioAllowed(false);
                    return false; // Indicating failure
                }

                const osc = ctx!.createOscillator();
                const gain = ctx!.createGain();
                
                osc.type = "sine";
                // Ding
                osc.frequency.setValueAtTime(880, ctx!.currentTime);
                // Dong
                osc.frequency.setValueAtTime(659.25, ctx!.currentTime + 0.3);
                
                gain.gain.setValueAtTime(0, ctx!.currentTime);
                gain.gain.linearRampToValueAtTime(0.5, ctx!.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx!.currentTime + 1.5);
                
                osc.connect(gain);
                gain.connect(ctx!.destination);
                
                osc.start(ctx!.currentTime);
                osc.stop(ctx!.currentTime + 1.5);
                return true;
             } catch (err) {
                 console.error("[Audio] Audio chime failed:", err);
                 setAudioAllowed(false);
                 return false;
             }
        };

        // 2. Play Text-to-Speech
        const playTTS = () => {
            if (!('speechSynthesis' in window)) return;
            try {
                window.speechSynthesis.cancel();
                const cleanTicket = callData.ticket.replace('-', ' ');
                const text = `Calling number, ${cleanTicket}, to ${callData.windowName}`;
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1;

                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    // Try to find a female voice (often contains 'female', 'zira', 'samantha', 'victoria')
                    const femaleVoice = voices.find(v => 
                        v.lang.startsWith("en-") && 
                        (v.name.toLowerCase().includes("female") || 
                         v.name.toLowerCase().includes("zira") || 
                         v.name.toLowerCase().includes("samantha") || 
                         v.name.toLowerCase().includes("victoria"))
                    );
                    
                    const selectedVoice = femaleVoice || voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en-")) || voices[0];
                    utterance.voice = selectedVoice;
                }
                
                utterance.onerror = (e) => {
                    console.error("[TTS] Error speaking:", e);
                    if (e.error === "not-allowed") {
                        setAudioAllowed(false);
                    }
                };
                
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                 console.error("[TTS] SpeechSynthesis failed:", err);
                 setAudioAllowed(false);
            }
        };

        playChime().then((chimeSuccess) => {
            // Only play TTS if Chime wasn't completely blocked by autoplay
            if (chimeSuccess) {
                setTimeout(() => {
                    playTTS();
                }, 800);
            } else {
                // If chime failed due to autoplay block, TTS will also definitely fail.
                setAudioAllowed(false);
            }
        });

    }, [callData]);

    return (
        <>
            {/* Audio Warning Badge if blocked */}
            {!audioAllowed && (
                <div className="fixed top-6 right-6 z-50 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-full shadow-xl flex items-center gap-3 cursor-pointer hover:bg-red-200 transition-colors animate-bounce" onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContextClass) {
                        if (!audioContextRef.current) {
                            audioContextRef.current = new AudioContextClass();
                        }
                        audioContextRef.current.resume();
                    }
                    if ('speechSynthesis' in window) {
                        const dummy = new SpeechSynthesisUtterance('');
                        dummy.volume = 0;
                        window.speechSynthesis.speak(dummy);
                    }
                    setAudioAllowed(true);
                }}>
                    <SpeakerSlash size={20} weight="bold" />
                    <span className="text-sm font-bold">Monitor Audio Blocked: Click here to Unlock</span>
                </div>
            )}

            {/* BIG Overlay Card */}
            <AnimatePresence>
                {callData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                    >
                    <motion.div
                        key={callData.calledAt || callData.ticket}
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden border-8 border-emerald-500 flex flex-col items-center text-center relative"
                        >
                            <div className="w-full bg-emerald-600 py-6 flex items-center justify-center gap-4">
                                <Megaphone className="text-white" size={48} weight="fill" />
                                <h1 className="text-white font-black text-4xl uppercase tracking-[0.2em] shadow-sm">
                                    Now Calling
                                </h1>
                            </div>
                            
                            <div className="py-20 px-10 flex flex-col items-center">
                                <span className="text-[12rem] leading-none font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-md mb-6">
                                    {callData.ticket}
                                </span>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Please proceed to</span>
                                    <span className="text-6xl font-extrabold text-emerald-700 tracking-tight">
                                        {callData.windowName}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Animated progress bar at bottom */}
                            <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: DISPLAY_DURATION_SECONDS, ease: "linear" }}
                                className="h-4 bg-emerald-500 w-full absolute bottom-0 left-0"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
