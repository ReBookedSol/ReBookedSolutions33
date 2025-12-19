import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthErrorHandler = () => {
  useEffect(() => {
    // Handle any auth errors that occur during page load
    const handleAuthErrors = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");
      const hasCode = urlParams.has("code");
      const hasToken = urlParams.has("token");
      const hasTokenHash = urlParams.has("token_hash");
      const hasType = urlParams.has("type");

      let needsUrlCleanup = false;
      const url = new URL(window.location.href);

      // If we're on the home page but have verification parameters, clean them up
      if (window.location.pathname === "/" && (hasToken || hasTokenHash || hasType)) {
        url.searchParams.delete("token");
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        url.searchParams.delete("email");
        url.searchParams.delete("fallback");
        needsUrlCleanup = true;
      }

      if (error) {

        // Mark for cleanup instead of immediate action
        url.searchParams.delete("error");
        url.searchParams.delete("error_description");
        needsUrlCleanup = true;
      }

      // Check for problematic auth code without verifier
      if (hasCode) {
        // Check if we have the required PKCE verifier in localStorage
        const codeVerifier = localStorage.getItem("supabase.auth.token");

        if (!codeVerifier) {

          // Mark for cleanup instead of immediate action
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          needsUrlCleanup = true;
        }
      }

      // Batch URL updates to prevent multiple replaceState calls
      if (needsUrlCleanup) {
        // Add small delay to prevent flashing
        setTimeout(() => {
          window.history.replaceState(
            {},
            document.title,
            url.pathname + url.search,
          );
        }, 100);
      }
    };

    // Run immediately
    handleAuthErrors();

    return () => {};
  }, []);

  // This component doesn't render anything
  return null;
};

export default AuthErrorHandler;
