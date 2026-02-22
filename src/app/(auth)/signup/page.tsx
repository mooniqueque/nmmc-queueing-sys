
import { SignupForm } from "@/components/forms/signup-form";
import ParticlesBackground from "@/components/ui/particles-background";
import { getDepartments } from "@/services/department-services";
import { Department } from "@prisma/client";

export default async function SignupPage() {
  const response = await getDepartments();
  const departments = response.success ? response.data : [];

  return (
    <div className="relative overflow-hidden flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Cicrle Bg*/}
      <ParticlesBackground />
      {/*form */}
      <div className="flex w-full max-w-2xl flex-col gap-6">

        <SignupForm departments={departments as Department[]} />
      </div>
    </div>
  )
}
