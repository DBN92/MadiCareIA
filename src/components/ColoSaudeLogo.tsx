import React from 'react';
import { useLogo } from '@/hooks/useLogo';

interface ColoSaudeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ColoSaudeLogo: React.FC<ColoSaudeLogoProps> = ({ size = 'md' }) => {
  const { logoUrl, defaultLogoUrl } = useLogo();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
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