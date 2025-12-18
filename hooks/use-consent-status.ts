import { useEffect, useState } from 'react';

export type ConsentStatus = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
};

const defaultConsent: ConsentStatus = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  accepted: false,
};

export const useConsentStatus = (): ConsentStatus => {
  const [consent, setConsent] = useState<ConsentStatus>(defaultConsent);

  useEffect(() => {
    const loadConsent = () => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cookiePreferences');
            if (saved) {
                try {
                    setConsent(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse cookie preferences", e);
                }
            }
        }
    };

    loadConsent();

    // Listen for storage events (changes in other tabs)
    window.addEventListener('storage', loadConsent);
    
    // Listen for custom event 'cookiePreferencesChanged' (changes in same tab)
    window.addEventListener('cookiePreferencesChanged', loadConsent);

    return () => {
        window.removeEventListener('storage', loadConsent);
        window.removeEventListener('cookiePreferencesChanged', loadConsent);
    };
  }, []);

  return consent;
};