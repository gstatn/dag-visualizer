import { useLocation } from "react-router-dom";                     // Hook to get current URL
import { useEffect } from "react";                                  // Hook for side effects

const NotFound = () => {
  const location = useLocation();                                   // Get current URL information
  
  // LOGGING EFFECT - Record 404 errors for debugging
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname                                             // Log which URL was requested
    );
  }, [location.pathname]);                                          // Run when URL changes

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* FULL SCREEN CONTAINER - Takes full height, centers content, light gray background */}
      
      <div className="text-center">
        {/* CENTERED ERROR MESSAGE */}
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        {/* BIG 404 NUMBER - Very large, bold text */}
        
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        {/* ERROR MESSAGE - Friendly explanation */}
        
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
        {/* HOME LINK - Blue link that gets darker on hover */}
      </div>
    </div>
  );
};

export default NotFound;