import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { openAIService, ChatMessage } from '@/services/openai';
import { assistantDataService, AssistantData } from '@/services/assistantData';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
      const contextData = assistantData ? {
        systemData: assistantDataService.formatDataForAssistant(assistantData)
      } : undefined;

      const response = await openAIService.sendMessage(inputMessage, contextData);

      // Remove mensagem de loading e adiciona resposta
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        
        // Verifica se houve erro
        if (response.error) {
          const errorMessage: ChatMessageWithId = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⚠️ ${response.message}`,
            timestamp: new Date()
          };
          console.error('Erro no chat:', response.error);
          return [...filtered, errorMessage];
        } else {
          const assistantMessage: ChatMessageWithId = {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.message,
            timestamp: new Date()
          };
          return [...filtered, assistantMessage];
        }
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
    <div className={`fixed z-[9998] ${isMobile ? 'bottom-16 right-2 left-2' : 'bottom-8 right-4'}`} style={{ zIndex: 9998 }}>
      <Card className={`shadow-2xl border-2 transition-all duration-300 backdrop-blur-md bg-white/95 dark:bg-gray-900/95 ${
        isMinimized 
          ? (isMobile ? 'h-12' : 'h-16') 
          : (isMobile ? 'h-80 max-h-[70vh]' : 'w-80 h-96')
      } ${isMobile ? 'w-full' : 'w-80'}`}>
        {/* Header */}
        <CardHeader className={`bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white rounded-t-lg backdrop-blur-sm ${
          isMobile ? 'pb-1 px-3 py-2' : 'pb-2'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              <CardTitle className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? 'Assistente' : 'Assistente Virtual'}
              </CardTitle>
              {isLoadingData && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className={`text-white hover:bg-blue-800/50 p-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
              >
                {isMinimized ? <Maximize2 className="h-2.5 w-2.5" /> : <Minimize2 className="h-2.5 w-2.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className={`text-white hover:bg-blue-800/50 p-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
          {assistantData && !isMinimized && !isMobile && (
            <div className="flex gap-1 mt-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {assistantData.summary.activePatients} ativos
              </Badge>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {assistantData.summary.totalEvents} eventos
              </Badge>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent className={`p-0 flex flex-col ${
            isMobile ? 'h-[calc(320px-48px)]' : 'h-[calc(384px-80px)]'
          }`}>
            {/* Messages Area */}
            <ScrollArea className={`flex-1 ${isMobile ? 'p-2' : 'p-3'}`}>
              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${isMobile ? 'gap-1.5' : 'gap-2'} ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className={`bg-blue-100 rounded-full flex items-center justify-center ${
                          isMobile ? 'w-4 h-4' : 'w-6 h-6'
                        }`}>
                          <Bot className={`text-blue-600 ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] rounded-lg ${
                        isMobile ? 'px-2 py-1' : 'px-2.5 py-1.5'
                      } ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100/80 text-gray-900 backdrop-blur-sm'
                      }`}
                    >
                      <div className={`whitespace-pre-wrap leading-relaxed ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>
                        {message.isLoading ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className={`animate-spin ${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                            <span>{message.content}</span>
                          </span>
                        ) : (
                          <span>{message.content}</span>
                        )}
                      </div>
                      {!isMobile && (
                        <div className={`text-xs mt-0.5 opacity-70 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className={`bg-gray-100 rounded-full flex items-center justify-center ${
                          isMobile ? 'w-4 h-4' : 'w-6 h-6'
                        }`}>
                          <User className={`text-gray-600 ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className={`border-t bg-white/50 backdrop-blur-sm ${isMobile ? 'p-2' : 'p-3'}`}>
              <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'}`}>
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isMobile ? "Pergunte..." : "Digite sua pergunta..."}
                  disabled={isLoading}
                  className={`flex-1 ${isMobile ? 'text-xs h-7' : 'text-xs h-8'}`}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="sm"
                  className={`${isMobile ? 'px-1.5 h-7' : 'px-2 h-8'}`}
                >
                  {isLoading ? (
                    <Loader2 className={`animate-spin ${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                  ) : (
                    <Send className={isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                  )}
                </Button>
              </div>
              
              {messages.length > 1 && !isMobile && (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
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
    <button 
      onClick={onClick}
      className="fixed bottom-20 right-4 z-[9999] 
                 flex items-center justify-center 
                 h-12 w-12 sm:h-14 sm:w-14 
                 rounded-full bg-blue-600 hover:bg-blue-700 
                 text-white shadow-2xl 
                 transition-all duration-300 
                 hover:scale-110 active:scale-95
                 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        zIndex: 9999,
        willChange: 'transform'
      }}
    > 
      <svg xmlns="http://www.w3.org/2000/svg" 
           className="h-6 w-6" fill="none" 
           viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> 
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/> 
      </svg> 
    </button>
  );
};