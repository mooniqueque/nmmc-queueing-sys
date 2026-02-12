"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { loginSchema, LoginSchemaType } from "@/src/lib/schemas/login-schema"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/src/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"

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

