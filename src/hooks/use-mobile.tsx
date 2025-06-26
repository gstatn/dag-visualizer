import * as React from "react"

// CONSTANT - The screen width where we consider something "mobile"
const MOBILE_BREAKPOINT = 768    // 768 pixels wide (typical tablet/phone boundary)

// CUSTOM HOOK FUNCTION - A reusable piece of logic
export function useIsMobile() {
  
  // STATE - Track whether we're on mobile or not
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  // undefined = we don't know yet (before component mounts)
  
  // EFFECT - Runs when component mounts and sets up screen size monitoring
  React.useEffect(() => {
    
    // CREATE MEDIA QUERY - Ask browser to watch for screen size changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // This creates a listener for screens 767px or smaller
    
    // FUNCTION - What to do when screen size changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      // Check current screen width and update our state
    }
    
    // LISTEN FOR CHANGES - Run onChange when screen is resized
    mql.addEventListener("change", onChange)
    
    // CHECK INITIAL SIZE - Set the initial value right away
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // CLEANUP FUNCTION - Remove listener when component unmounts
    return () => mql.removeEventListener("change", onChange)
    // This prevents memory leaks
    
  }, [])  // Empty dependency array = only run once when component mounts
  
  // RETURN RESULT - Convert undefined to false using !! operator
  return !!isMobile
  // !! converts: undefined → false, true → true, false → false
}