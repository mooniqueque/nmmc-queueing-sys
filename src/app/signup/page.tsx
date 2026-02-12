<<<<<<< HEAD
import { SignupForm } from "@/components/forms/signup-form"
=======
import { SignupForm } from "@/src/components/forms/signup-form"
>>>>>>> c86fe1e8e9c9a08e9b65be2daf3289119460b21d

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-5xl">
        <SignupForm />
      </div>
    </div>
  )
}
