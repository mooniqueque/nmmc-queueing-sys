"use client";

import { useState } from "react";
import { FormEvent } from "react";

interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsloading] = useState(false);
    const [error, setError] = useState("");


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("false");
        setIsloading(true);
    }





}

