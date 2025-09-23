import React from 'react';
import { useLogo } from '@/hooks/useLogo';

interface ColoSaudeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const ColoSaudeLogo: React.FC<ColoSaudeLogoProps> = ({ size = 'lg', className = '' }) => {
  const { logoUrl, defaultLogoUrl } = useLogo();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    '2xl': 'w-40 h-40'
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
      <img
        src={logoUrl}
        alt="Logo da Empresa"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback para logo padrão se a imagem falhar
          const target = e.target as HTMLImageElement;
          target.src = defaultLogoUrl;
        }}
      />
    </div>
  );
};

export default ColoSaudeLogo;