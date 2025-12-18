'use client'
import { useState, useEffect } from 'react';
import { useConsentStatus } from '@/hooks/use-consent-status';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Youtube, Cookie } from "lucide-react";

interface YouTubeVideoProps {
  videoId: string;
  className?: string;
}

const YouTubeVideo = ({ videoId, className }: YouTubeVideoProps) => {
  const consent = useConsentStatus();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (consent.marketing) {
      timeoutId = setTimeout(() => setIsVideoLoaded(true), 0);
    }
    return () => clearTimeout(timeoutId);
  }, [consent.marketing]);

  const handleAcceptCookies = () => {
      // Create a new consent object with marketing enabled
      const newConsent = { ...consent, marketing: true, accepted: true };
      
      // Save to localStorage
      localStorage.setItem('cookiePreferences', JSON.stringify(newConsent));
      
      // Dispatch event to notify listeners
      window.dispatchEvent(new Event('cookiePreferencesChanged'));
  };

  if (isVideoLoaded) {
    return (
      <div className={`aspect-video w-full overflow-hidden rounded-lg bg-muted ${className}`}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <Card className={`aspect-video w-full overflow-hidden bg-muted/50 ${className}`}>
      <CardContent className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <div className="rounded-full bg-background p-4 shadow-sm">
          <Youtube className="h-8 w-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Video Content Blocked</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Please enable marketing cookies to view this YouTube video content.
          </p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleAcceptCookies}
        >
          <Cookie className="h-4 w-4" />
          Accept Marketing Cookies
        </Button>
      </CardContent>
    </Card>
  );
};

export default YouTubeVideo;