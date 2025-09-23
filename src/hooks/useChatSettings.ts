import { useState, useEffect } from 'react';

export interface ChatSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1,
  systemPrompt: `Você é um assistente virtual especializado no sistema MediCare, um sistema de gestão hospitalar.

Você tem acesso aos seguintes dados do sistema:
- Pacientes: informações pessoais, leitos, notas médicas
- Eventos de cuidado: medicamentos, refeições, hidratação, idas ao banheiro, observações
- Perfis de usuários: profissionais de saúde e suas funções

Suas responsabilidades:
1. Ajudar os usuários a encontrar informações sobre pacientes
2. Fornecer relatórios sobre eventos de cuidado
3. Responder perguntas sobre o histórico médico dos pacientes
4. Auxiliar na análise de padrões de cuidado
5. Sugerir melhorias nos cuidados com base nos dados

Sempre seja preciso, profissional e mantenha a confidencialidade médica. Responda em português brasileiro.`
};

const STORAGE_KEY = 'medicare-chat-settings';

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega configurações do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salva configurações no localStorage
  const saveSettings = (newSettings: ChatSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações do chat:', error);
      return false;
    }
  };

  // Atualiza uma configuração específica
  const updateSetting = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    return saveSettings(newSettings);
  };

  // Restaura configurações padrão
  const resetToDefaults = () => {
    return saveSettings(DEFAULT_SETTINGS);
  };

  // Valida se as configurações estão válidas
  const validateSettings = (settingsToValidate: ChatSettings) => {
    const errors: string[] = [];

    if (!settingsToValidate.apiKey.trim()) {
      errors.push('Chave da API é obrigatória');
    }

    if (!settingsToValidate.model.trim()) {
      errors.push('Modelo é obrigatório');
    }

    if (settingsToValidate.temperature < 0 || settingsToValidate.temperature > 2) {
      errors.push('Temperatura deve estar entre 0 e 2');
    }

    if (settingsToValidate.maxTokens < 1 || settingsToValidate.maxTokens > 4000) {
      errors.push('Máximo de tokens deve estar entre 1 e 4000');
    }

    if (settingsToValidate.presencePenalty < -2 || settingsToValidate.presencePenalty > 2) {
      errors.push('Penalidade de presença deve estar entre -2 e 2');
    }

    if (settingsToValidate.frequencyPenalty < -2 || settingsToValidate.frequencyPenalty > 2) {
      errors.push('Penalidade de frequência deve estar entre -2 e 2');
    }

    if (!settingsToValidate.systemPrompt.trim()) {
      errors.push('Prompt do sistema é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    settings,
    isLoading,
    saveSettings,
    updateSetting,
    resetToDefaults,
    validateSettings
  };
}