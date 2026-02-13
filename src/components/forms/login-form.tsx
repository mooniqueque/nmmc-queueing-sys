"use client";

import { loginSchema, LoginSchemaType } from "@/database/lib/schemas/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    Card
} from "@/components/ui/card";

export default function LoginForm() {
    const form = useForm<LoginSchemaType>({
        resolver: zodResolver(loginSchema as any),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })


    function onSubmit(values: z.infer<typeof loginSchema>) {
        console.log(values)
    }


    return (
        <Card></Card>

    );





}