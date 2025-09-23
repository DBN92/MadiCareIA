import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  action: string;
  user: string;
  details: string;
  ip?: string;
  module: string;
}

interface UseSystemLogsReturn {
  logs: SystemLogEntry[];
  addLog: (level: SystemLogEntry['level'], action: string, details: string, module?: string) => void;
  clearLogs: () => void;
  getLogsByLevel: (level: SystemLogEntry['level']) => SystemLogEntry[];
  getLogsByModule: (module: string) => SystemLogEntry[];
  exportLogs: () => string;
}

const LOGS_STORAGE_KEY = 'bedside_system_logs';
const MAX_LOGS = 1000; // Limite máximo de logs armazenados

export const useSystemLogs = (): UseSystemLogsReturn => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const { user } = useAuth();

  // Carregar logs do localStorage na inicialização
  useEffect(() => {
    const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(parsedLogs);
      } catch (error) {
        console.error('Erro ao carregar logs do localStorage:', error);
      }
    }
  }, []);

  // Salvar logs no localStorage sempre que houver mudanças
  useEffect(() => {
    if (logs.length > 0) {
      const logsToStore = logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }));
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logsToStore));
    }
  }, [logs]);

  // Função para obter IP do usuário (simulado)
  const getUserIP = useCallback((): string => {
    // Em um ambiente real, isso seria obtido do servidor
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }, []);

  // Função para adicionar um novo log
  const addLog = useCallback((
    level: SystemLogEntry['level'],
    action: string,
    details: string,
    module: string = 'Sistema'
  ) => {
    const newLog: SystemLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      action,
      user: user?.name || 'Usuário Anônimo',
      details,
      ip: getUserIP(),
      module
    };

    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      // Manter apenas os últimos MAX_LOGS logs
      return updatedLogs.slice(0, MAX_LOGS);
    });
  }, [user, getUserIP]);

  // Função para limpar todos os logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(LOGS_STORAGE_KEY);
  }, []);

  // Função para filtrar logs por nível
  const getLogsByLevel = useCallback((level: SystemLogEntry['level']) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  // Função para filtrar logs por módulo
  const getLogsByModule = useCallback((module: string) => {
    return logs.filter(log => log.module === module);
  }, [logs]);

  // Função para exportar logs como JSON
  const exportLogs = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    getLogsByLevel,
    getLogsByModule,
    exportLogs
  };
};

// Hook para logging automático de ações do usuário
export const useAutoLogger = () => {
  const { addLog } = useSystemLogs();

  const logUserAction = useCallback((action: string, details: string, module?: string) => {
    addLog('info', action, details, module);
  }, [addLog]);

  const logError = useCallback((error: string, details: string, module?: string) => {
    addLog('error', error, details, module);
  }, [addLog]);

  const logWarning = useCallback((warning: string, details: string, module?: string) => {
    addLog('warning', warning, details, module);
  }, [addLog]);

  const logDebug = useCallback((debug: string, details: string, module?: string) => {
    addLog('debug', debug, details, module);
  }, [addLog]);

  return {
    logUserAction,
    logError,
    logWarning,
    logDebug
  };
};