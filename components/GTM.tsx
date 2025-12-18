'use client';
import Script from 'next/script';
import { useConsentStatus } from '@/hooks/use-consent-status';

export default function GTM() {
  const consent = useConsentStatus();

  // Se l’utente non ha ancora accettato (o non vuole analytics), non caricare GTM
  if (!consent.accepted || !consent.analytics) return null;

  return (
    <>
      {/* GTM Head Script */}
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({
            'gtm.start': new Date().getTime(), event:'gtm.js'
          }); var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
          j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-XXXXXXX');
      `}
      </Script>

      {/* GTM NoScript (Body) — opzionale */}
      {/* Puoi metterlo nel layout principale se vuoi */}
    </>
  );
}