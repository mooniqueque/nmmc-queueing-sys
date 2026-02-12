<<<<<<< HEAD
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
=======
import { Button } from "@/src/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
>>>>>>> c86fe1e8e9c9a08e9b65be2daf3289119460b21d
import {
  Field,
  FieldDescription,
  FieldGroup,
<<<<<<< HEAD
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
import { cn } from "@/lib/utils"
import Image from 'next/image'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Fill out the Form and wait for Admin Approval
                </p>
              </div>

              {/*Name Input */}
              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Juan"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Dela Cruz"
                      required
                    />
                  </Field>
                </div>

                {/*Optional Name Inputs, Middle and Suffix */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                    <Input
                      id="middleName"
                      name="middleName"
                      placeholder=""
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="suffix">Suffix</FieldLabel>
                    <Input
                      id="suffix"
                      name="suffix"
                      placeholder="Jr, Sr, III"
                    />
                  </Field>
                </div>

                {/*Employee Role / ID Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="employeeID">Employee ID</FieldLabel>
                    <Input
                      id="employeeID"
                      name="employeeID"
                      placeholder="2022300556"
                      required
                    />

                  </Field>

                  <Field>
                    <FieldLabel htmlFor="role">Select your Role</FieldLabel>
                    <Select name="role">
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
                  </Field>
                </div>

                {/*Birth Date and Contact Number*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="birthDate">Birth Date</FieldLabel>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="09123456789"
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>



              {/*Email Input */}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              {/*Password Input*/}
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input id="confirm-password" type="password" required />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Create Account</Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account? <a href="#">Sign in</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/login-img.png"
              fill={true}
              alt="nmmc"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card >

    </div >
=======
  FieldLabel,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" required />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" required />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="#">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
>>>>>>> c86fe1e8e9c9a08e9b65be2daf3289119460b21d
  )
}
