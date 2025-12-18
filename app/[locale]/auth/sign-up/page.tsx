"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useTranslations } from "next-intl"

export default function SignUpPage() {
  const router = useRouter()
  const t = useTranslations('Auth')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await signUp.email({
        email,
        password,
        name,
      })

      if (!response || response.error) {
        setError(response?.error?.message || t('signUp.errors.default'))
        console.error("[v0] Sign up error:", response?.error)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.errors.generic')
      setError(errorMessage)
      console.error("[v0] Sign up error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('signUp.title')}</CardTitle>
          <CardDescription>{t('signUp.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('common.name')}</label>
              <Input
                type="text"
                placeholder={t('common.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('signUp.submitting') : t('signUp.submit')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('signUp.footerText')}{" "}
              <Link href="/auth/sign-in" className="text-primary hover:underline">
                {t('signUp.footerLink')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
