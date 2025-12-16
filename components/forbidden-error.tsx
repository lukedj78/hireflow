"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export function ForbiddenError() {
  const t = useTranslations("Forbidden");

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-[500px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          {t('description')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" render={
            ({ children, ...props }) => (
                <Link {...props} href="/">{children}</Link>
            )
        }>
          {t('goHome')}
        </Button>
        <Button render={
            ({ children, ...props }) => (
                <Link {...props} href="/dashboard">
                    {children}
                </Link>
            )
        }>
          {t('goDashboard')}
        </Button>
      </div>
    </div>
  );
}
