import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { LaptopIcon, ReadCvLogoIcon, GearIcon } from "@phosphor-icons/react/dist/ssr"

export default async function IndexPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <>
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <Link
            href={siteConfig.links.twitter}
            className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
            target="_blank"
          >
            Follow along on Twitter
          </Link>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            AI-Powered Recruiting for Modern Teams
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Streamline your hiring process with HireFlow. Automated matching,
            smart pipeline management, and AI-driven insights.
          </p>
          <div className="space-x-4">
            <Link href={session ? "/dashboard" : "/auth/sign-up"} className={cn(buttonVariants({ size: "lg" }))}>
              {session ? "Go to Dashboard" : "Get Started"}
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>
      <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            HireFlow brings the power of AI to your recruiting workflow.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <LaptopIcon className="h-12 w-12" />
              <div className="space-y-2">
                <h3 className="font-bold">AI Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically match candidates to job requirements using vector search.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
               <ReadCvLogoIcon className="h-12 w-12" />
              <div className="space-y-2">
                <h3 className="font-bold">Job Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage job postings with AI-generated descriptions.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <GearIcon className="h-12 w-12" />
              <div className="space-y-2">
                <h3 className="font-bold">Automated Pipelines</h3>
                <p className="text-sm text-muted-foreground">
                  Move candidates through stages with automated workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
