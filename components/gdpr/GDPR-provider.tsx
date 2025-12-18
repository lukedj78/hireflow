import React from 'react';
import CookieConsent from './cookie-consent';

interface GDPRProviderProps {
  children: React.ReactNode;
}

export default function GDPRProvider({ children }: GDPRProviderProps) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  );
}