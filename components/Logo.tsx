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
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 240 240" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Orange Speech Bubble */}
        <path 
          d="M 30 80 
             C 30 40 40 30 80 30 
             H 160 
             C 200 30 210 40 210 80 
             V 140 
             C 210 180 200 190 160 190 
             H 130 
             L 105 220 
             C 100 225 90 220 90 210
             V 190 
             H 80 
             C 40 190 30 180 30 140 
             Z" 
          fill="#FF5E20" 
          stroke="#0A1B2F" 
          strokeWidth="16" 
          strokeLinejoin="round"
        />
        
        {/* Blue Discount Tag */}
        <g transform="translate(100, 15) rotate(35)">
          <path 
            d="M 45 0 
               L 90 45 
               V 140 
               C 90 155 85 160 70 160 
               H 20 
               C 5 160 0 155 0 140 
               V 45 
               Z" 
            fill="#00BFFF" 
            stroke="#0A1B2F" 
            strokeWidth="16" 
            strokeLinejoin="round"
          />
          {/* Tag Hole */}
          <circle cx="45" cy="30" r="10" fill="#F4F1E1" stroke="#0A1B2F" strokeWidth="12" />
          
          {/* % Symbol */}
          <circle cx="28" cy="80" r="8" fill="#F4F1E1" stroke="#0A1B2F" strokeWidth="10" />
          <circle cx="62" cy="120" r="8" fill="#F4F1E1" stroke="#0A1B2F" strokeWidth="10" />
          <line x1="65" y1="70" x2="25" y2="130" stroke="#0A1B2F" strokeWidth="12" strokeLinecap="round" />
        </g>
      </svg>
      
      {showText && (
        <h1 className={`
          ${currentSize.text} 
          font-sans font-black tracking-tighter
          ${light ? 'text-white' : 'text-[#0A1B2F]'}
        `}>
          Descontaí
        </h1>
      )}
    </div>
  );
};
