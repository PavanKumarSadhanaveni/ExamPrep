import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    function checkDevice() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    // Initial check
    checkDevice();
    // Listen for resize events
    window.addEventListener("resize", checkDevice);
    // Cleanup listener
    return () => window.removeEventListener("resize", checkDevice);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return isMobile; // Returns undefined on SSR/initial client render, then boolean after mount
}
