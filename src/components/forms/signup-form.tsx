"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { authClient } from "@/lib/database/auth-client"
import { registrationSchema } from "@/lib/schemas/registration-schema"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

type RegistrationValues = z.infer<typeof registrationSchema>

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      email: "",
      password: "",
      confirmPassword: "",
      employeeID: "",
      role: "",
      birthDate: "",
      contactNumber: "",
    }
  })
  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(values: RegistrationValues) {
    setIsLoading(true)
    try {
      // for betterauth  
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`,
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName,
        suffix: values.suffix,
        employeeID: values.employeeID,
        role: values.role,
        contactNumber: values.contactNumber,
        birthDate: new Date(values.birthDate).toISOString(),
      } as unknown as Parameters<typeof authClient.signUp.email>[0])

      if (error) {
        alert(error.message)
      } else {
        alert("Success!!! Wait for admin approval")
        form.reset()
      }
    } catch (err) {
      console.error("Signup error:", err)
      alert("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    {...register("firstName")}
                    id="firstName"
                    placeholder="Juan"
                  />
                  <FieldError errors={[errors.firstName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    {...register("lastName")}
                    id="lastName"
                    placeholder="Dela Cruz"
                  />
                  <FieldError errors={[errors.lastName]} />
                </Field>
              </div>

              {/* Optional Name Inputs, Middle and Suffix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                  <Input
                    {...register("middleName")}
                    id="middleName"
                    placeholder=""
                  />
                  <FieldError errors={[errors.middleName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="suffix">Suffix</FieldLabel>
                  <Input
                    {...register("suffix")}
                    id="suffix"
                    placeholder="Jr, Sr, III"
                  />
                  <FieldError errors={[errors.suffix]} />
                </Field>
              </div>

              {/* Employee Role / ID Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="employeeID">Employee ID</FieldLabel>
                  <Input
                    {...register("employeeID")}
                    id="employeeID"
                    placeholder="2022300556"
                  />
                  <FieldError errors={[errors.employeeID]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Select your Role</FieldLabel>
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRIAGE_NURSE">Triage Nurse</SelectItem>
                          <SelectItem value="WINDOW_CLERK">Window Clerk</SelectItem>
                          <SelectItem value="CLINIC_CALLER">Clinic Caller</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.role]} />
                </Field>
              </div>

              {/* Birth Date and Contact Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="birthDate">Birth Date</FieldLabel>
                  <Input
                    {...register("birthDate")}
                    id="birthDate"
                    type="date"
                  />
                  <FieldError errors={[errors.birthDate]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                  <Input
                    {...register("contactNumber")}
                    id="contactNumber"
                    placeholder="09123456789"
                  />
                  <FieldError errors={[errors.contactNumber]} />
                </Field>
              </div>

              {/* Email Input */}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                />
                <FieldError errors={[errors.email]} />
              </Field>

              {/* Password Input */}
              <Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...register("password")}
                      id="password"
                      type="password"
                    />
                    <FieldError errors={[errors.password]} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type="password"
                    />
                    <FieldError errors={[errors.confirmPassword]} />
                  </Field>
                </div>
              </Field>

              {/* Submit and Sign In */}
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Form
                </Button>
                <FieldDescription className="text-center mt-4">
                  Already have an account? <a href="/login" className="underline underline-offset-4">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-green-600">
        After submitting, wait for admin approval, or directly contact him #09123456789
      </FieldDescription>
    </div>
  )
}
