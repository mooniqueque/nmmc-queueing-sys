"use client";

import { useEffect, useState } from "react";

export function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentTime(new Date());
        }, 0);
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        return () => {
            clearTimeout(timeoutId);
            clearInterval(timer);
        };
    }, []);

    return currentTime;
}
