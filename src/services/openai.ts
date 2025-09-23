import OpenAI from 'openai';

// Função para obter as configurações do chat do localStorage
function getChatSettings() {
  try {
    const settings = localStorage.getItem('chatSettings');
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações do chat:', error);
  }
  
  // Configurações padrão se não houver no localStorage
  return {
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
}

// Configuração da API OpenAI usando as configurações salvas
let chatSettings = getChatSettings();

// Verifica se a API key está configurada
if (!chatSettings.apiKey || chatSettings.apiKey === 'your-openai-api-key-here') {
  console.warn('API key da OpenAI não está configurada ou é inválida. O chat não funcionará.');
}

const openai = new OpenAI({
  apiKey: chatSettings.apiKey,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AssistantResponse {
  message: string;
  error?: string;
}

// Prompt do sistema para o assistente virtual - será substituído pelas configurações salvas
const SYSTEM_PROMPT = chatSettings.systemPrompt;

export class OpenAIService {
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    // Recarrega as configurações do localStorage
    this.reloadSettings();
  }

  /**
   * Recarrega as configurações do localStorage
   */
  reloadSettings(): void {
    chatSettings = getChatSettings();
    
    // Reinicializa a conversa com o novo prompt do sistema
    this.conversationHistory = [
      {
        role: 'system',
        content: chatSettings.systemPrompt
      }
    ];
  }

  /**
   * Envia uma mensagem para o assistente virtual
   */
  async sendMessage(
    userMessage: string,
    contextData?: Record<string, unknown>
  ): Promise<AssistantResponse> {
    try {
      // Recarrega as configurações antes de cada chamada
      chatSettings = getChatSettings();

      // Verifica se a API key está disponível
      if (!chatSettings.apiKey || chatSettings.apiKey === '') {
        console.error('API key da OpenAI não configurada ou inválida');
        return {
          message: 'Desculpe, o serviço de chat não está disponível no momento. A chave da API OpenAI não está configurada corretamente. Entre em contato com o administrador.',
          error: 'API key não configurada ou inválida'
        };
      }

      // Recria a instância do OpenAI com a nova API key se necessário
      const currentOpenAI = new OpenAI({
        apiKey: chatSettings.apiKey,
        dangerouslyAllowBrowser: true
      });

      // Adiciona contexto dos dados do Supabase se fornecido
      let enhancedMessage = userMessage;
      if (contextData) {
        enhancedMessage = `${userMessage}\n\nDados do contexto:\n${JSON.stringify(contextData, null, 2)}`;
      }

      // Adiciona a mensagem do usuário ao histórico
      this.conversationHistory.push({
        role: 'user',
        content: enhancedMessage
      });

      // Chama a API da OpenAI com as configurações atuais
      const completion = await currentOpenAI.chat.completions.create({
        model: chatSettings.model,
        messages: this.conversationHistory,
        max_tokens: chatSettings.maxTokens,
        temperature: chatSettings.temperature,
        presence_penalty: chatSettings.presencePenalty,
        frequency_penalty: chatSettings.frequencyPenalty
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';

      // Adiciona a resposta do assistente ao histórico
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Limita o histórico para evitar excesso de tokens
      if (this.conversationHistory.length > 20) {
        // Mantém o prompt do sistema e remove mensagens antigas
        this.conversationHistory = [
          this.conversationHistory[0], // prompt do sistema
          ...this.conversationHistory.slice(-19) // últimas 19 mensagens
        ];
      }

      return {
        message: assistantMessage
      };

    } catch (error) {
      console.error('Erro ao comunicar com OpenAI:', error);
      
      // Verifica se é um erro de autenticação
      if (error instanceof Error && error.message.includes('401')) {
        return {
          message: 'Erro de autenticação com o serviço de chat. Verifique as configurações.',
          error: 'Erro de autenticação'
        };
      }
      
      return {
        message: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Gera um resumo dos dados fornecidos
   */
  async generateSummary(data: Record<string, unknown>, type: 'patient' | 'events' | 'general'): Promise<AssistantResponse> {
    const prompts = {
      patient: 'Gere um resumo detalhado sobre este paciente com base nos dados fornecidos:',
      events: 'Analise e resuma os eventos de cuidado fornecidos, identificando padrões importantes:',
      general: 'Forneça um resumo geral dos dados do sistema MediCare:'
    };

    return this.sendMessage(prompts[type], data);
  }

  /**
   * Analisa padrões nos dados
   */
  async analyzePatterns(data: Record<string, unknown>, focus?: string): Promise<AssistantResponse> {
    const message = focus 
      ? `Analise os padrões nos dados com foco em: ${focus}`
      : 'Analise os padrões e tendências nos dados fornecidos';

    return this.sendMessage(message, data);
  }

  /**
   * Limpa o histórico da conversa
   */
  clearHistory(): void {
    // Recarrega as configurações atuais
    chatSettings = getChatSettings();
    
    this.conversationHistory = [
      {
        role: 'system',
        content: chatSettings.systemPrompt
      }
    ];
  }

  /**
   * Obtém o histórico da conversa
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// Instância singleton do serviço
export const openAIService = new OpenAIService();