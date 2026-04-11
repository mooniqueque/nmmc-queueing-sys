"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SuccessScreenProps {
    isOpen: boolean;
    countdown: number;
    onSubmitAnother: () => void;
}

export function SuccessScreen({ isOpen, countdown, onSubmitAnother }: SuccessScreenProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                >
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                        />
                    </svg>
                </motion.div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Registration Complete!</h2>
                    <p className="text-slate-500 text-sm">
                        Your intake form has been successfully submitted to the Triage Nurse. Please wait for your name to be called.
                    </p>
                </div>
                <div className="w-full flex gap-3 pt-4 border-t border-slate-100">
                    <Button
                        type="button"
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                        onClick={onSubmitAnother}
                    >
                        Submit Another ({countdown}s)
                    </Button>
                </div>
            </div>
        </div>
    );
}
