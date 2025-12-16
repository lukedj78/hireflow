"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useTranslations } from "next-intl"
import Link from "next/link"

export default function SignInPage() {
  const router = useRouter()
  const t = useTranslations('Auth')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message ?? t('signIn.errors.unknown'))
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError(t('common.errors.generic'))
      console.error("[v0] Sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('signIn.title')}</CardTitle>
          <CardDescription>{t('signIn.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('common.email')}</label>
              <Input
                type="email"
                placeholder={t('common.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('common.password')}</label>
              <Input
                type="password"
                placeholder={t('common.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="default" type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signIn.submitting') : t('signIn.submit')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('signIn.footerText')}{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                {t('signIn.footerLink')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
