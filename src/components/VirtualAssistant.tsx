import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { openAIService, ChatMessage } from '@/services/openai';
import { assistantDataService, AssistantData } from '@/services/assistantData';

interface VirtualAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessageWithId extends ChatMessage {
  id: string;
  timestamp: Date;
  isLoading?: boolean;
}

export const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carrega dados do Supabase quando o assistente é aberto
  useEffect(() => {
    if (isOpen && !assistantData) {
      loadAssistantData();
    }
  }, [isOpen]);

  // Foca no input quando o assistente é aberto
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const loadAssistantData = async () => {
    setIsLoadingData(true);
    try {
      const data = await assistantDataService.getAllData();
      setAssistantData(data);
      
      // Adiciona mensagem de boas-vindas com contexto
      const welcomeMessage: ChatMessageWithId = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Olá! Sou seu assistente virtual do MediCare. 

Tenho acesso a todos os dados do sistema:
• ${data.summary.activePatients} pacientes ativos de ${data.summary.totalPatients} total
• ${data.summary.totalEvents} eventos de cuidado registrados
• ${data.profiles.length} profissionais cadastrados

Como posso ajudá-lo hoje? Posso fornecer informações sobre pacientes, analisar eventos de cuidado, gerar relatórios ou responder perguntas sobre o sistema.`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      const errorMessage: ChatMessageWithId = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao carregar os dados do sistema. Ainda posso ajudá-lo com perguntas gerais.',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessageWithId = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const loadingMessage: ChatMessageWithId = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Processando sua solicitação...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepara contexto dos dados se disponível
      const contextData = assistantData ? 
        assistantDataService.formatDataForAssistant(assistantData) : null;

      const response = await openAIService.sendMessage(inputMessage, contextData);

      // Remove mensagem de loading e adiciona resposta
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const assistantMessage: ChatMessageWithId = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        return [...filtered, assistantMessage];
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const errorMessage: ChatMessageWithId = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date()
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    openAIService.clearHistory();
    if (assistantData) {
      loadAssistantData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 shadow-2xl border-2 transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}>
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">Assistente Virtual</CardTitle>
              {isLoadingData && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-800 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-blue-800 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {assistantData && !isMinimized && (
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {assistantData.summary.activePatients} pacientes ativos
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {assistantData.summary.totalEvents} eventos
              </Badge>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(600px-120px)]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{message.content}</span>
                          </span>
                        ) : (
                          <span>{message.content}</span>
                        )}
                      </div>
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {messages.length > 1 && (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpar conversa
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Botão flutuante para abrir o assistente
export const VirtualAssistantToggle: React.FC<{
  onClick: () => void;
  isOpen: boolean;
}> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-110"
      size="sm"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};