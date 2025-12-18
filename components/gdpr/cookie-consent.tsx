'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Cookie, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Consent helpers
export type ConsentStatus = 'accepted' | 'rejected' | 'unset';

export const getConsentFromCookies = (): ConsentStatus => {
  if (typeof document === 'undefined') return 'unset';
  const match = document.cookie.match(/cookie_consent=(accepted|rejected)/);
  return (match?.[1] as ConsentStatus) || 'unset';
};

export const setConsentCookie = (status: ConsentStatus) => {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1); // 1 anno
  document.cookie = `cookie_consent=${status}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
};

// Tipi
type CookieCategory = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

type CookiePreferences = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
};

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  accepted: false,
};

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  // Cookie categories
  const cookieCategories: CookieCategory[] = [
    {
      id: 'necessary',
      name: 'Necessary',
      description:
        'These cookies are essential for the website to function properly and cannot be disabled.',
      required: true,
      enabled: true,
    },
    {
      id: 'functional',
      name: 'Functional',
      description: 'These cookies enable personalized features and functionality.',
      required: false,
      enabled: preferences.functional,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'These cookies help us understand how visitors interact with our website.',
      required: false,
      enabled: preferences.analytics,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'These cookies are used to deliver relevant ads and marketing campaigns.',
      required: false,
      enabled: preferences.marketing,
    },
  ];

  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferences');
    const cookieConsent = getConsentFromCookies();

    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences) as CookiePreferences;
      // Defer state updates to avoid synchronous cascading render warning
      setTimeout(() => {
        setPreferences(parsed);
        if (!parsed.accepted) setShowBanner(true);
      }, 0);
    } else if (cookieConsent === 'unset') {
      setTimeout(() => setShowBanner(true), 0);
    }
  }, []);

  const savePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookiePreferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowPreferences(false);
    setConsentCookie(newPreferences.accepted ? 'accepted' : 'rejected');
    
    // Notify other components of the change
    window.dispatchEvent(new Event('cookiePreferencesChanged'));
    window.dispatchEvent(new Event('storage')); // For good measure, though mostly for cross-tab

    // Logica per abilitare/disabilitare cookie effettivi (analytics, ecc.)
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      accepted: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      ...defaultPreferences,
      accepted: true,
    };
    savePreferences(necessaryOnly);
  };

  const handleSavePreferences = () => {
    const updated: CookiePreferences = {
      ...preferences,
      accepted: true,
    };
    savePreferences(updated);
  };

  const handleToggle = (categoryId: string) => {
    if (categoryId === 'necessary') return;
    setPreferences(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId as keyof CookiePreferences],
    }));
  };

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-4 md:p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Cookie Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your experience. By continuing to visit this site you
                    agree to our use of cookies.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
                  Preferences
                </Button>
                <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                  Necessary Only
                </Button>
                <Button size="sm" onClick={handleAcceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Required cookies are necessary for basic website
              functionality.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="privacy" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="privacy" className="space-y-4 mt-4">
              <div className="text-sm">
                <p className="mb-4">
                  HireFlow uses cookies and similar technologies to provide, maintain, and
                  improve our services.
                </p>
                <p>
                  You can choose which categories of cookies you allow. Click on the different
                  category headings to learn more and change your preferences.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="cookies" className="space-y-4 mt-4">
              {cookieCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-start justify-between space-x-4 border-b pb-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{category.name}</h4>
                      {category.required && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`cookie-${category.id}`}
                      checked={
                        category.id === 'necessary'
                          ? true
                          : preferences[category.id as keyof CookiePreferences]
                      }
                      onCheckedChange={() => handleToggle(category.id)}
                      disabled={category.required}
                    />
                    <Label htmlFor={`cookie-${category.id}`} className="sr-only">
                      {category.name}
                    </Label>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="text-sm">
                <h4 className="font-medium mb-2">What are cookies?</h4>
                <p className="mb-4">
                  Cookies are small text files stored on your device. They help websites function
                  efficiently and collect analytics.
                </p>
                <h4 className="font-medium mb-2">How to manage cookies</h4>
                <p className="mb-4">
                  You can also manage cookies through your browser settings to block or delete them.
                </p>
                <h4 className="font-medium mb-2">More information</h4>
                <p>
                  For details, read our{' '}
                  <Link href="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between">
              <Button variant="outline" onClick={handleAcceptNecessary}>
                Necessary Only
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleAcceptAll}>
                  Accept All
                </Button>
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showBanner && preferences.accepted && (
        <button
          onClick={() => setShowPreferences(true)}
          className="fixed bottom-4 right-4 bg-background border rounded-full p-2 shadow-md hover:shadow-lg transition-shadow z-40"
          aria-label="Cookie Settings"
        >
          <Cookie className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </>
  );
}