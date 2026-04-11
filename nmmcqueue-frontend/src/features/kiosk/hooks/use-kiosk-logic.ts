"use client";

import { getQueueOptions } from "@/features/shared/api";
import { calculateAge as libCalculateAge } from "@/shared/lib/utils";
import type { PriorityCategory } from "@/shared/types/models";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { registerKioskPatient } from "../actions";
import { kioskFormSchema, KioskFormValues } from "../schemas";

const initialState: KioskFormValues = {
    hasAppointment: false,
    gender: "" as KioskFormValues["gender"],
    civilStatus: "" as KioskFormValues["civilStatus"],
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    contactNo: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    age: undefined,
    birthPlace: "",
    religion: "",
    hospitalId: "",
    categoryIds: []
};

export function useKioskLogic() {
    const router = useRouter();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [formData, setFormData] = useState<KioskFormValues>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof KioskFormValues, string>>>({});
    const [availableCategories, setAvailableCategories] = useState<PriorityCategory[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("kiosk-registration-draft");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTimeout(() => {
                    setFormData((prev) => ({ ...prev, ...parsed }));
                }, 0);
            } catch (error) {
                console.error("Failed to parse saved draft", error);
            }
        }

        getQueueOptions("TRIAGE")
            .then((cats) => {
                setAvailableCategories(cats);
            })
            .catch((error) => console.error("Failed to fetch categories", error));

        setTimeout(() => setIsHydrated(true), 0);
    }, []);

    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem("kiosk-registration-draft", JSON.stringify(formData));
        }
    }, [formData, isHydrated]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (showSuccessModal && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showSuccessModal, countdown]);

    useEffect(() => {
        if (showSuccessModal && countdown === 0) {
            router.push("/kiosk");
        }
    }, [countdown, showSuccessModal, router]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: unknown }
    ) => {
        if ("target" in event) {
            const { name, value } = event.target;
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));

            if (errors[name as keyof KioskFormValues]) {
                setErrors((prev) => ({ ...prev, [name]: undefined }));
            }
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [event.name]: event.value,
        }));

        if (errors[event.name as keyof KioskFormValues]) {
            setErrors((prev) => ({ ...prev, [event.name]: undefined }));
        }
    };

    const handleCategoryToggle = (categoryId: string) => {
        setFormData((prev) => {
            const current = prev.categoryIds || [];
            const next = current.includes(categoryId)
                ? current.filter((id) => id !== categoryId)
                : [...current, categoryId];
            return { ...prev, categoryIds: next };
        });
    };

    const handleClearForm = () => {
        setIsClearConfirmOpen(true);
    };

    const confirmClearForm = () => {
        localStorage.removeItem("kiosk-registration-draft");
        setFormData(initialState);
        setErrors({});
        setMessage(null);
        setIsClearConfirmOpen(false);
    };

    const calculateAge = () => {
        const { dobMonth, dobDay, dobYear } = formData;
        if (!dobMonth || !dobDay || !dobYear || String(dobYear).length < 4) return "";

        const monthNames: Record<string, number> = {
            January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
            July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
        };
        const monthValue = monthNames[dobMonth as string] ?? (Number(dobMonth) - 1);

        const dob = new Date(Number(dobYear), monthValue, Number(dobDay));
        if (isNaN(dob.getTime())) return "";

        const age = libCalculateAge(dob);
        return age !== null ? age.toString() : "Invalid";
    };

    async function onSubmit(event: FormEvent) {
        event.preventDefault();

        const result = kioskFormSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: Partial<Record<keyof KioskFormValues, string>> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof KioskFormValues;
                if (path) newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            setMessage({ type: "error", text: "Please complete the form before submitting." });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        const submitResult = await registerKioskPatient({
            ...formData,
            kioskRegistrationType: "UNREGISTERED",
        });
        setIsLoading(false);

        if (submitResult.success) {
            setMessage({ type: "success", text: submitResult.message! });
            localStorage.removeItem("kiosk-registration-draft");
            setFormData(initialState);
            setErrors({});

            setCountdown(5);
            setShowSuccessModal(true);
        } else {
            setMessage({ type: "error", text: submitResult.error! });
        }
    }

    const handleSubmitAnother = () => {
        setShowSuccessModal(false);
        setMessage(null);
        setCountdown(5);
    };

    return {
        availableCategories,
        calculateAge,
        confirmClearForm,
        countdown,
        errors,
        formData,
        handleCategoryToggle,
        handleChange,
        handleClearForm,
        handleSubmitAnother,
        isClearConfirmOpen,
        isHydrated,
        isLoading,
        message,
        onSubmit,
        setIsClearConfirmOpen,
        showSuccessModal,
    };
}
