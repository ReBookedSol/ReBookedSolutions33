import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useLocation } from "react-router-dom";

interface GoogleAdProps {
  slot?: string;
  className?: string;
  format?: "auto" | "fluid";
  layoutKey?: string;
  refreshTrigger?: number;
}

interface GoogleAdHandle {
  refresh: () => void;
}

const GoogleAd = forwardRef<GoogleAdHandle, GoogleAdProps>(
  ({
    slot = "9359366330",
    className = "",
    format = "fluid",
    layoutKey = "-fb+5w+4e-db+86",
    refreshTrigger = 0,
  }, ref) => {
    const adRef = useRef<HTMLModElement | null>(null);
    const location = useLocation();
    const [refreshKey, setRefreshKey] = useState(0);

    // Expose refresh method to parent components
    useImperativeHandle(ref, () => ({
      refresh: () => {
        setRefreshKey((k) => k + 1);
      },
    }));

    // Refresh ad when route changes or ad props change
    useEffect(() => {
      setRefreshKey((k) => k + 1);
    }, [location.pathname, slot, format, layoutKey]);

    // Refresh ad when external trigger changes
    useEffect(() => {
      if (refreshTrigger > 0) {
        setRefreshKey((k) => k + 1);
      }
    }, [refreshTrigger]);

    useEffect(() => {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (e) {
      }
    }, [refreshKey]);

    return (
      <div className={`w-full ${className}`.trim()}>
        <ins
          key={refreshKey}
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
  }
);

GoogleAd.displayName = "GoogleAd";

export default GoogleAd;
