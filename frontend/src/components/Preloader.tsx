import { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';

interface PreloaderProps {
  onReady: () => void;
}

export function Preloader({ onReady }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [statusText, setStatusText] = useState('Connecting to backend...');

  useEffect(() => {
    // Simulate backend warming up
    const timer1 = setTimeout(() => {
      setStatusText('Warming up servers...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setStatusText('Establishing orbital telemetry...');
    }, 3000);

    const timer3 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onReady, 500); // Wait for fade out
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onReady]);

  return (
    <div className={`preloader-container ${!isVisible ? 'preloader-hidden' : ''}`}>
      <div className="relative mb-8">
        <Rocket className="w-12 h-12 text-accent animate-bounce" />
        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
      </div>
      <div className="spinner"></div>
      <h1 className="text-3xl font-bold tracking-wider mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        SKYWARD
      </h1>
      <p className="text-gray-400 font-medium tracking-widest uppercase text-sm pulse-text">
        {statusText}
      </p>
    </div>
  );
}
