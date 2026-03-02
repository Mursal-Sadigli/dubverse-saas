import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Mic2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* Background blobs */}
      <div className="bg-blob left-[30%] -top-24 size-[500px] bg-violet-500/10" />
      <div className="bg-blob right-[10%] bottom-0 size-[300px] bg-blue-500/10" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-600 shadow-[0_0_24px_rgba(139,92,246,0.4)]">
            <Mic2 className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Dub<span className="text-violet-500">verse</span>
          </span>
        </Link>

        {/* Clerk Component with custom styling injected via appearance prop */}
        <SignUp
          appearance={{
            elements: {
              card: "bg-background border border-foreground/10 shadow-2xl",
              formButtonPrimary: "bg-linear-to-br from-violet-600 to-blue-600 border-0 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:opacity-90 transition-all",
              footerActionLink: "text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300",
              input: "border-foreground/10 focus:border-violet-500/50 focus:ring-violet-500/25",
              headerTitle: "text-2xl font-bold tracking-tight text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-foreground/10 bg-foreground/5 hover:bg-foreground/10 text-foreground",
            },
          }}
        />
      </div>
    </div>
  );
}
