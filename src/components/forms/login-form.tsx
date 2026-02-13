"use client";

import { loginSchema, LoginSchemaType } from "@/lib/schemas/login-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from 'next/image';


export default function LoginForm() {
    const form = useForm<LoginSchemaType>({
        resolver: zodResolver(loginSchema),
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
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/* Left Side: The Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
                            <div className="flex flex-col gap-6">

                                {/* Header Section */}
                                <div className="flex flex-col text-left mb-3">
                                    <h1 className="text-3xl font-bold mb-2 text-primary">Welcome back!</h1>
                                    <p className="text-muted-foreground text-balance mb-3">
                                        Login to your NMMC Queue Account
                                    </p>
                                </div>
                                {/* Email Field */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="mb-4">
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="m@example.com"
                                                    type="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Password Field */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="mb-2">
                                            <div className="flex items-center">
                                                <FormLabel>Password</FormLabel>
                                                <a
                                                    href="#"
                                                    className="ml-auto text-sm underline-offset-2 hover:underline"
                                                >
                                                    Forgot your password?
                                                </a>
                                            </div>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Dont have an account */}
                                <div className="text-left text-sm">
                                    Dont have an account?{" "}
                                    <a href="/signup" className="underline underline-offset-4">
                                        Sign up
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full h-10">
                                    Login
                                </Button>
                            </div>
                        </form>
                    </Form>
                    {/* Right Side: The Image */}
                    <div className="relative hidden lg:block flex-1 overflow-hidden min-h-[500px] ">
                        <div className="absolute inset-0 z-10 bg-linear-to-b from-[#0B7035]/80 via-[#31965B]/12 via-[#059943]/41 via-[#059943]/59 to-[#0B7035]/80" />
                        <Image
                            src="/nmmcpics.png"
                            alt="NMMC Login Image"
                            fill
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale bg-linear-to-r from-cyan-500 to-blue-500"
                        />
                        <div className="relative z-20 h-full flex flex-col items-center justify-center px-10 text-white text-center">
                            <div className="mb-3 transform hover:scale-103 transition-transform duration-500">
                                <Image
                                    src="/logo.png"
                                    alt="Hospital Logo"
                                    width={100}
                                    height={100}
                                    className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                />
                            </div>
                            <p className="text-[13px] sm:text-[14px] font-bold tracking-[0.2em] mb-2 text-shadow-lg uppercase opacity-90 font-sans!">
                                Northern Mindanao Medical Center
                            </p>
                            <h2 className="text-[32px] xl:text-[44px] font-black tracking-tighter text-shadow-lg leading-[0.9] text-stroke-0! queueing-system-text font-sans!">
                                QUEUEING SYSTEM
                            </h2>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                {/* Footer Text ???*/}
            </div>
        </div>

    )





}