import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true, light = false }) => {
  const sizes = {
    sm: { icon: 32, text: 'text-xl' },
    md: { icon: 48, text: 'text-3xl' },
    lg: { icon: 72, text: 'text-5xl' },
    xl: { icon: 120, text: 'text-6xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <img 
        src="/icon.svg" 
        alt="Descontaí Logo" 
        width={currentSize.icon} 
        height={currentSize.icon}
        className="shrink-0 rounded-xl" // Added rounded-xl to smooth corners if needed, though SVG has rx
      />
      
      {showText && (
        <h1 className={`
          ${currentSize.text} 
          font-logo tracking-wide
          ${light ? 'text-white' : 'text-[#0A1B2F]'}
        `}>
          Descontaí
        </h1>
      )}
    </div>
  );
};
