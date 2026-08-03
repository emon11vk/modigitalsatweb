import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

// Extend Window interface to include Desmos
declare global {
  interface Window {
    Desmos?: any;
  }
}

interface DesmosCalculatorProps {
  style?: React.CSSProperties;
}

const DesmosCalculator: React.FC<DesmosCalculatorProps> = ({ style }) => {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let calculatorInstance: any = null;

    async function loadDesmos() {
      try {
        // 1. Fetch the API key from our secure Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('get-desmos-key');
        
        if (functionError) {
          throw new Error('Could not fetch Desmos API key');
        }

        const apiKey = data?.apiKey;
        if (!apiKey) {
          throw new Error('API key is empty');
        }

        // 2. Dynamically inject the script if it hasn't been loaded yet
        if (!document.querySelector('script[src*="desmos.com/api"]')) {
          const script = document.createElement('script');
          script.src = `https://www.desmos.com/api/v1.9/calculator.js?apiKey=${apiKey}`;
          script.async = true;
          
          script.onload = () => {
            if (calculatorRef.current && window.Desmos) {
              // 3. Initialize the calculator
              calculatorInstance = window.Desmos.GraphingCalculator(calculatorRef.current);
            }
          };
          
          document.body.appendChild(script);
        } else {
          // If script already exists and is loaded
          if (calculatorRef.current && window.Desmos) {
            calculatorInstance = window.Desmos.GraphingCalculator(calculatorRef.current);
          } else {
            // Script exists but might still be loading, wait a bit or listen to a custom event
            // For simplicity, we assume it loads quickly or we could use an interval
            const checkInterval = setInterval(() => {
              if (calculatorRef.current && window.Desmos) {
                clearInterval(checkInterval);
                calculatorInstance = window.Desmos.GraphingCalculator(calculatorRef.current);
              }
            }, 100);
          }
        }
      } catch (err: any) {
        console.error("Error loading Desmos:", err);
        setError(err.message || 'Failed to load calculator');
      }
    }

    loadDesmos();

    // Cleanup when component unmounts
    return () => {
      if (calculatorInstance) {
        calculatorInstance.destroy();
      }
    };
  }, []);

  if (error) {
    return <div style={{ color: 'red', padding: '1rem' }}>Error: {error}</div>;
  }

  return (
    <div 
      ref={calculatorRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style 
      }} 
    />
  );
};

export default DesmosCalculator;
