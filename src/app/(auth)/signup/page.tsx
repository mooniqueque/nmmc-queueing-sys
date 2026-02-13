
import { SignupForm } from "@/components/forms/signup-form"
import Image from "next/image"
import Link from "next/link"
export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Link
          href="/login"
          className="flex flex-col items-center gap-2 self-center text-center group"
        >
          <Image
            src="/nmmc-logo.png"
            alt="NMMC LOGO"
            width={85}
            height={85}
            className="rounded-full shadown-sm transition-transform group-hover:scale-102"
          />
          <h1 className="text-xl font-bold tracking-tight text-foreground"
          >Northern Mindanao Medical Center</h1>
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}
