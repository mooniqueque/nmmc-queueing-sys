"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, SpeakerSlash } from "@phosphor-icons/react";

interface CallOverlayProps {
    callData: { ticket: string; windowName: string } | null;
}

export function CallOverlay({ callData }: CallOverlayProps) {
    const [audioAllowed, setAudioAllowed] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initial audio unlock check
    useEffect(() => {
        const handleInteraction = () => {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    audioContextRef.current = new AudioContextClass();
                    audioContextRef.current.resume();
                }
            }
            setAudioAllowed(true);
        };
        
        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    useEffect(() => {
        if (!callData) return;

        // 1. Play Bell Chime (Synthesized)
        const playChime = () => {
             try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContextClass();
                }
                const ctx = audioContextRef.current;
                if (ctx?.state === 'suspended') {
                    ctx.resume();
                }

                if (ctx) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = "sine";
                    // Ding
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    // Dong
                    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
                    
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start();
                    osc.stop(ctx.currentTime + 1.5);
                }
             } catch (err) {
                 console.warn("Audio chime blocked or failed", err);
                 setAudioAllowed(false);
             }
        };

        // 2. Play Text-to-Speech
        const playTTS = () => {
            try {
                // Remove dashes or format for better dictation: "REG-01" -> "REG 0 1"
                const cleanTicket = callData.ticket.replace('-', ' ');
                const utterance = new SpeechSynthesisUtterance(`Calling number, ${cleanTicket}, to ${callData.windowName}`);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
            } catch (err) {
                 console.warn("TTS failed", err);
                 setAudioAllowed(false);
            }
        };

        playChime();
        // Wait for chime to mostly finish before speaking
        setTimeout(() => {
            playTTS();
        }, 800);

    }, [callData]);

    return (
        <>
            {/* Audio Warning Badge if blocked */}
            {!audioAllowed && (
                <div className="fixed top-6 right-6 z-50 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:bg-red-200 transition-colors" onClick={() => {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContextClass) {
                        audioContextRef.current = new AudioContextClass();
                        audioContextRef.current.resume();
                    }
                    setAudioAllowed(true);
                }}>
                    <SpeakerSlash size={20} weight="bold" />
                    <span className="text-sm font-bold">Click here to enable audio announcements</span>
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
                                transition={{ duration: 7, ease: "linear" }}
                                className="h-4 bg-emerald-500 w-full absolute bottom-0 left-0"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
