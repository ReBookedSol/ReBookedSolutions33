import React, { useEffect, useRef } from "react";

interface GoogleAdProps {
  slot?: string;
  className?: string;
  format?: "auto" | "fluid";
  layoutKey?: string;
}

const GoogleAd: React.FC<GoogleAdProps> = ({
  slot = "9359366330",
  className = "",
  format = "fluid",
  layoutKey = "-fb+5w+4e-db+86",
}) => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      if (import.meta.env.DEV) {
        console.debug("AdSense load skipped or blocked", e);
      }
    }
  }, [slot, format, layoutKey]);

  return (
    <div className={`w-full ${className}`.trim()}>
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7763187849877535"
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
