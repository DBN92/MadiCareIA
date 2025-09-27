import { useState, useEffect } from 'react';
import { useSettingsHistory } from './useSettingsHistory';

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
  apiKey: '', // Não usar variável de ambiente como padrão por segurança
  model: 'gpt-4o-mini',
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
  
  // Hook para gerenciar histórico de versões
  const settingsHistory = useSettingsHistory('chat');

  // Carrega configurações do localStorage
  useEffect(() => {
    try {
      // Primeiro, tentar carregar da versão ativa do histórico
      const activeVersion = settingsHistory.getActiveVersion();
      if (activeVersion) {
        const loadedSettings = { ...DEFAULT_SETTINGS, ...activeVersion.settingsData };
        // Se não há API key nas configurações salvas, tentar usar a variável de ambiente
        if (!loadedSettings.apiKey) {
          loadedSettings.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        }
        setSettings(loadedSettings);
      } else {
        // Fallback para localStorage antigo
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          const loadedSettings = { ...DEFAULT_SETTINGS, ...parsedSettings };
          // Se não há API key nas configurações salvas, tentar usar a variável de ambiente
          if (!loadedSettings.apiKey) {
            loadedSettings.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
          }
          setSettings(loadedSettings);
          
          // Migrar para o sistema de histórico
          settingsHistory.createVersion(loadedSettings, {
            versionName: 'Migração automática',
            description: 'Configurações migradas do sistema antigo',
            tags: ['migration']
          });
        } else {
          // Criar versão inicial com configurações padrão
          const initialSettings = { ...DEFAULT_SETTINGS };
          // Para configuração inicial, usar variável de ambiente se disponível
          if (!initialSettings.apiKey) {
            initialSettings.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
          }
          setSettings(initialSettings);
          
          settingsHistory.createVersion(initialSettings, {
            versionName: 'Configuração inicial',
            description: 'Configurações padrão do sistema',
            tags: ['initial', 'default']
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [settingsHistory]);

  // Salva as configurações no localStorage e cria nova versão no histórico
  const saveSettings = (newSettings: ChatSettings, versionOptions?: {
    versionName?: string;
    description?: string;
    tags?: string[];
  }) => {
    try {
      // Validação adicional para evitar salvar API key inválida
      if (newSettings.apiKey === 'your-openai-api-key-here') {
        console.error('Tentativa de salvar API key inválida');
        return false;
      }
      
      // Salvar no localStorage (compatibilidade)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Criar nova versão no histórico
      const version = settingsHistory.createVersion(newSettings, {
        versionName: versionOptions?.versionName || `Atualização ${new Date().toLocaleString('pt-BR')}`,
        description: versionOptions?.description || 'Configurações atualizadas',
        tags: versionOptions?.tags || ['update'],
        createdBy: 'Usuário' // TODO: Integrar com sistema de autenticação
      });
      
      return version !== null;
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
    return saveSettings(DEFAULT_SETTINGS, {
      versionName: 'Restauração para padrões',
      description: 'Configurações restauradas para os valores padrão do sistema',
      tags: ['reset', 'default']
    });
  };

  // Função para fazer rollback para uma versão específica
  const rollbackToVersion = (versionId: string) => {
    try {
      const version = settingsHistory.getVersionById(versionId);
      if (!version) {
        console.error('Versão não encontrada:', versionId);
        return false;
      }

      // Ativar a versão no histórico
      const success = settingsHistory.activateVersion(versionId);
      if (success) {
        // Atualizar configurações atuais
        setSettings({ ...DEFAULT_SETTINGS, ...version.settingsData });
        // Salvar no localStorage para compatibilidade
        localStorage.setItem(STORAGE_KEY, JSON.stringify(version.settingsData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao fazer rollback:', error);
      return false;
    }
  };

  // Valida se as configurações estão válidas
  const validateSettings = (settingsToValidate: ChatSettings) => {
    const errors: string[] = [];

    if (!settingsToValidate.apiKey.trim()) {
      errors.push('Chave da API é obrigatória');
    } else if (settingsToValidate.apiKey === 'your-openai-api-key-here') {
      errors.push('Chave da API inválida. Use uma chave API válida da OpenAI');
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
    rollbackToVersion,
    validateSettings,
    settingsHistory
  };
}