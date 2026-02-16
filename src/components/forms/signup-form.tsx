"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"

import { AuthHeader } from "@/components/auth/auth-header"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { HOSPITAL_DEPARTMENTS, HOSPITAL_ROLES } from "@/lib/constants/hospital"
import { authClient } from "@/lib/database/auth-client"
import { registrationSchema } from "@/lib/schemas/registration-schema"
import { cn } from "@/lib/utils"
import { SignUpPayload } from "@/types/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

type RegistrationValues = z.infer<typeof registrationSchema>

/**
 * COMPONENT: SignupForm
 * High-level coordinator for user registration.
 * Delegates branding to AuthHeader and uses centralized hospital constants.
 */
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      department: "",
      birthDate: "",
      contactNumber: "",
    }
  })

  const { register, handleSubmit, formState: { errors } } = form;

  /**
   * HANDLER: Form Submission
   * Processes the registration using BetterAuth client.
   */
  async function onSubmit(values: RegistrationValues) {
    setIsLoading(true)
    try {
      const payload: SignUpPayload = {
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`.trim(),
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || "",
        suffix: values.suffix || "",
        employeeID: values.employeeID,
        role: values.role,
        department: values.department,
        contactNumber: values.contactNumber,
        birthDate: new Date(values.birthDate).toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await authClient.signUp.email(payload as any);

      if (error) {
        alert(error.message)
      } else {
        alert("Registration successful! Please wait for administrative approval.")
        form.reset()
      }
    } catch (err) {
      console.error("Signup error:", err)
      alert("An unexpected error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-slate-200/60 shadow-xl shadow-slate-200/50">
        <CardHeader className="pb-0">
          <AuthHeader title="Registration Form" />
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="space-y-4">
              {/* --- NAME SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input {...register("firstName")} id="firstName" placeholder="Juan" />
                  <FieldError errors={[errors.firstName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input {...register("lastName")} id="lastName" placeholder="Dela Cruz" />
                  <FieldError errors={[errors.lastName]} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="middleName">Middle Name (Optional)</FieldLabel>
                  <Input {...register("middleName")} id="middleName" placeholder="M." />
                  <FieldError errors={[errors.middleName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="suffix">Suffix (Optional)</FieldLabel>
                  <Input {...register("suffix")} id="suffix" placeholder="Jr, Sr, III" />
                  <FieldError errors={[errors.suffix]} />
                </Field>
              </div>

              {/* --- EMPLOYMENT SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="employeeID">Employee ID</FieldLabel>
                  <Input {...register("employeeID")} id="employeeID" placeholder="Ex: 2022300556" />
                  <FieldError errors={[errors.employeeID]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Select your Role</FieldLabel>
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="role" className="bg-slate-50/50">
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {HOSPITAL_ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.role]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="department">Select Department / Service</FieldLabel>
                <Controller
                  name="department"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="department" className="bg-slate-50/50">
                        <SelectValue placeholder="Choose your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOSPITAL_DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.department]} />
              </Field>

              {/* --- PERSONAL INFO --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="birthDate">Birth Date</FieldLabel>
                  <Input {...register("birthDate")} id="birthDate" type="date" className="bg-slate-50/50" />
                  <FieldError errors={[errors.birthDate]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                  <Input {...register("contactNumber")} id="contactNumber" placeholder="09xxxxxxxxx" />
                  <FieldError errors={[errors.contactNumber]} />
                </Field>
              </div>

              {/* --- ACCOUNT INFO --- */}
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input {...register("email")} id="email" type="email" placeholder="staff@nmmc.gov.ph" />
                <FieldError errors={[errors.email]} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input {...register("password")} id="password" type={showPassword ? "text" : "password"} className="bg-slate-50/50 focus:bg-white transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError errors={[errors.password]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Input {...register("confirmPassword")} id="confirmPassword" type={showPassword ? "text" : "password"} className="bg-slate-50/50 focus:bg-white transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError errors={[errors.confirmPassword]} />
                </Field>
              </div>

              {/* --- ACTIONS --- */}
              <div className="pt-4 space-y-4">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-bold shadow-lg shadow-emerald-200" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Registration"}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <a href="/login" className="text-emerald-700 font-bold hover:underline underline-offset-4">
                    Sign in here
                  </a>
                </p>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="px-6 text-center text-sm font-medium text-emerald-600/80 bg-emerald-50 py-3 rounded-lg border border-emerald-100">
        Approval required. Contact Administration at <strong>#09123456789</strong> after signing up.
      </div>
    </div>
  )
}

