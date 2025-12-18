import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { HeaderAuth } from "@/components/header-auth"

export async function SiteHeader() {
  const session = await auth.api.getSession({
      headers: await headers()
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <HeaderAuth user={session?.user} />
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
