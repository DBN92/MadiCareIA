import { useState, useEffect } from 'react';

const DEFAULT_LOGO_URL = 'https://www.colosaude.com.br/doutor/uploads/0/logo/2025/06/emp-colo-certo-aa1f1.png';
const LOGO_STORAGE_KEY = 'medicare-custom-logo';

export interface LogoState {
  logoUrl: string;
  isCustomLogo: boolean;
}

export function useLogo() {
  const [logoState, setLogoState] = useState<LogoState>({
    logoUrl: DEFAULT_LOGO_URL,
    isCustomLogo: false
  });

  // Carregar logo do localStorage na inicialização
  useEffect(() => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
      try {
        const parsedLogo = JSON.parse(savedLogo);
        setLogoState({
          logoUrl: parsedLogo.url || DEFAULT_LOGO_URL,
          isCustomLogo: parsedLogo.isCustom || false
        });
      } catch (error) {
        console.error('Erro ao carregar logo personalizado:', error);
        // Se houver erro, usar logo padrão
        setLogoState({
          logoUrl: DEFAULT_LOGO_URL,
          isCustomLogo: false
        });
      }
    }
  }, []);

  // Função para atualizar o logo
  const updateLogo = (newLogoUrl: string, isCustom: boolean = true) => {
    const newState = {
      logoUrl: newLogoUrl,
      isCustomLogo: isCustom
    };
    
    setLogoState(newState);
    
    // Salvar no localStorage
    localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify({
      url: newLogoUrl,
      isCustom: isCustom
    }));
  };

  // Função para resetar para o logo padrão
  const resetToDefaultLogo = () => {
    setLogoState({
      logoUrl: DEFAULT_LOGO_URL,
      isCustomLogo: false
    });
    
    // Remover do localStorage
    localStorage.removeItem(LOGO_STORAGE_KEY);
  };

  // Função para converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Função para upload de arquivo
  const uploadLogo = async (file: File): Promise<void> => {
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imagem deve ter no máximo 5MB');
      }

      // Converter para base64 e atualizar
      const base64Url = await fileToBase64(file);
      updateLogo(base64Url, true);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      throw error;
    }
  };

  return {
    logoUrl: logoState.logoUrl,
    isCustomLogo: logoState.isCustomLogo,
    updateLogo,
    resetToDefaultLogo,
    uploadLogo,
    defaultLogoUrl: DEFAULT_LOGO_URL
  };
}