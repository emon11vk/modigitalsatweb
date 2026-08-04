import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

export default function IntroAnimation({ onComplete }: { onComplete?: () => void }) {
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const counterEl = document.getElementById("intro-counter");
    const text1 = document.getElementById("intro-text1");
    const text2 = document.getElementById("intro-text2");
    const text3 = document.getElementById("intro-text3");
    const progressBar = document.getElementById("intro-progressBar");

    const introDuration = 4.5;
    const tl = gsap.timeline({
      onComplete: () => {
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    });

    if (progressBar) {
      tl.to(progressBar, {
        width: "100%",
        duration: introDuration,
        ease: "power2.inOut",
      }, 0);
    }

    const counterData = { value: 0 };
    if (counterEl) {
      tl.to(counterData, {
        value: 100,
        duration: introDuration,
        ease: "power3.inOut",
        onUpdate: () => {
          let val = Math.floor(counterData.value).toString().padStart(3, '0');
          counterEl.innerText = val;
        }
      }, 0);
    }

    if (text1 && text2 && text3) {
      tl.to(text1, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.3)
        .to(text1, { opacity: 0, duration: 0.5, ease: "power2.in" }, 1.3);

      tl.to(text2, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.8)
        .to(text2, { opacity: 0, duration: 0.5, ease: "power2.in" }, 2.8);

      tl.to(text3, { opacity: 1, duration: 0.5, ease: "power2.out" }, 3.3)
        .to(text3, { opacity: 0, duration: 0.5, ease: "power2.in" }, 4.1);
    }

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  if (isFinished) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      backgroundColor: '#0b0b0b',
      zIndex: 99999, // Super high z-index to cover everything
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e5e5e5',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2.5rem',
      }}>
        <img 
          src="/logo.png" 
          alt="Mơ Digital SAT Logo" 
          style={{ 
            height: '8rem', 
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' 
          }} 
        />
      </div>
      
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div id="intro-text1" style={{
          position: 'absolute',
          fontFamily: "'Imbue', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '6vw',
          opacity: 0,
          letterSpacing: '0.05em'
        }}>Mơ</div>
        <div id="intro-text2" style={{
          position: 'absolute',
          fontFamily: "'Imbue', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '6vw',
          opacity: 0,
          letterSpacing: '0.05em'
        }}>Digital</div>
        <div id="intro-text3" style={{
          position: 'absolute',
          fontFamily: "'Imbue', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '6vw',
          opacity: 0,
          letterSpacing: '0.05em'
        }}>Sat</div>
      </div>
      
      <div id="intro-counter" style={{
        position: 'absolute',
        bottom: '1rem',
        right: '2.5rem',
        fontFamily: "'Imbue', serif",
        fontWeight: 300,
        fontSize: '12vw',
        lineHeight: 0.8,
        fontVariantNumeric: 'tabular-nums'
      }}>000</div>
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <div id="intro-progressBar" style={{
          height: '100%',
          width: '0%',
          backgroundColor: '#60a5fa'
        }}></div>
      </div>
    </div>
  );
}
