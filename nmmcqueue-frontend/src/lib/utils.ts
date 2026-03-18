import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function calculateAge(dateOfBirth: Date | string | undefined | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    
    const today = new Date();
    if (dob > today) return 0; // Or return null if you want to indicate an error
    
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    // Also enforce physical reality (<= 130 years old) or weird negative edge cases
    if (age < 0 || age > 130) return null;
    
    return age;
}