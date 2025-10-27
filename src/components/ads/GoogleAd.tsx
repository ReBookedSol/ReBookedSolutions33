import React, { useEffect, useRef } from "react";

interface GoogleAdProps {
  slot?: string;
  className?: string;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ slot = "3944399884", className = "" }) => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      // Ensure adsbygoogle array exists
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // Push a new ad request
      (window as any).adsbygoogle.push({});
    } catch (e) {
      // Fail silently if blocked by ad blockers
      // Optionally log in development
      if (import.meta.env.DEV) {
        console.debug("AdSense load skipped or blocked", e);
      }
    }
  }, [slot]);

  return (
    <div className={`w-full ${className}`.trim()}>
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7763187849877535"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
