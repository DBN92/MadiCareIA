import OpenAI from 'openai';

// Configuração da API OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
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

// Prompt do sistema para o assistente virtual
const SYSTEM_PROMPT = `Você é um assistente virtual especializado no sistema MediCare, um sistema de gestão hospitalar.

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

Sempre seja preciso, profissional e mantenha a confidencialidade médica. Responda em português brasileiro.`;

export class OpenAIService {
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    // Inicializa a conversa com o prompt do sistema
    this.conversationHistory = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
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

      // Chama a API da OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: this.conversationHistory,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
    this.conversationHistory = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
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