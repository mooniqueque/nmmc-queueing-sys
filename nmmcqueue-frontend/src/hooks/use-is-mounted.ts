"use client";

import { useEffect, useState } from "react";

export function useIsMounted() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Enforce async state update to prevent "cascading render" lint errors
        const timeoutId = setTimeout(() => {
            setIsMounted(true);
        }, 0);
        return () => clearTimeout(timeoutId);
    }, []);

    return isMounted;
}
