import { useState, useEffect } from 'react';

export interface SettingsVersion {
  id: string;
  versionId: string; // Identificador único da versão (ex: v1.0.0, v1.0.1)
  versionName?: string; // Nome descritivo da versão
  settingsType: string; // Tipo de configuração (chat, system, theme, etc.)
  settingsData: any; // Dados das configurações
  description?: string; // Descrição das mudanças
  createdBy: string; // Usuário que criou a versão
  createdAt: string; // Data de criação
  isActive: boolean; // Indica se é a versão ativa atual
  tags?: string[]; // Tags para categorização
}

const STORAGE_KEY_PREFIX = 'medicare-settings-history';

export function useSettingsHistory(settingsType: string) {
  const [versions, setVersions] = useState<SettingsVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gerar ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Gerar próximo version ID
  const generateNextVersionId = (existingVersions: SettingsVersion[]) => {
    const versionNumbers = existingVersions
      .map(v => v.versionId)
      .filter(id => id.match(/^v\d+\.\d+\.\d+$/))
      .map(id => {
        const parts = id.substring(1).split('.').map(Number);
        return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
      })
      .sort((a, b) => {
        if (a.major !== b.major) return b.major - a.major;
        if (a.minor !== b.minor) return b.minor - a.minor;
        return b.patch - a.patch;
      });

    if (versionNumbers.length === 0) {
      return 'v1.0.0';
    }

    const latest = versionNumbers[0];
    return `v${latest.major}.${latest.minor}.${latest.patch + 1}`;
  };

  // Carregar versões do localStorage
  const loadVersions = () => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}-${settingsType}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedVersions = JSON.parse(stored);
        setVersions(parsedVersions.sort((a: SettingsVersion, b: SettingsVersion) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar versões no localStorage
  const saveVersions = (newVersions: SettingsVersion[]) => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}-${settingsType}`;
      localStorage.setItem(storageKey, JSON.stringify(newVersions));
      setVersions(newVersions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      return true;
    } catch (error) {
      console.error('Erro ao salvar histórico de configurações:', error);
      return false;
    }
  };

  // Criar nova versão
  const createVersion = (
    settingsData: any,
    options: {
      versionName?: string;
      description?: string;
      tags?: string[];
      createdBy?: string;
      versionId?: string;
    } = {}
  ) => {
    const newVersion: SettingsVersion = {
      id: generateId(),
      versionId: options.versionId || generateNextVersionId(versions),
      versionName: options.versionName,
      settingsType,
      settingsData: JSON.parse(JSON.stringify(settingsData)), // Deep clone
      description: options.description,
      createdBy: options.createdBy || 'Sistema',
      createdAt: new Date().toISOString(),
      isActive: true, // Nova versão sempre fica ativa
      tags: options.tags || []
    };

    // Desativar versões anteriores
    const updatedVersions = versions.map(v => ({ ...v, isActive: false }));
    
    // Adicionar nova versão
    const newVersions = [newVersion, ...updatedVersions];
    
    return saveVersions(newVersions) ? newVersion : null;
  };

  // Ativar uma versão específica (rollback)
  const activateVersion = (versionId: string) => {
    const updatedVersions = versions.map(v => ({
      ...v,
      isActive: v.versionId === versionId
    }));
    
    return saveVersions(updatedVersions);
  };

  // Obter versão ativa
  const getActiveVersion = (): SettingsVersion | null => {
    return versions.find(v => v.isActive) || null;
  };

  // Obter versão por ID
  const getVersionById = (versionId: string): SettingsVersion | null => {
    return versions.find(v => v.versionId === versionId) || null;
  };

  // Excluir versão
  const deleteVersion = (versionId: string) => {
    const versionToDelete = versions.find(v => v.versionId === versionId);
    
    if (!versionToDelete) {
      return false;
    }

    // Não permitir excluir a versão ativa se for a única
    if (versionToDelete.isActive && versions.length === 1) {
      return false;
    }

    let updatedVersions = versions.filter(v => v.versionId !== versionId);

    // Se a versão excluída era ativa, ativar a mais recente
    if (versionToDelete.isActive && updatedVersions.length > 0) {
      updatedVersions[0].isActive = true;
    }

    return saveVersions(updatedVersions);
  };

  // Comparar duas versões
  const compareVersions = (versionId1: string, versionId2: string) => {
    const version1 = getVersionById(versionId1);
    const version2 = getVersionById(versionId2);
    
    if (!version1 || !version2) {
      return null;
    }

    return {
      version1,
      version2,
      differences: findDifferences(version1.settingsData, version2.settingsData)
    };
  };

  // Encontrar diferenças entre dois objetos
  const findDifferences = (obj1: any, obj2: any, path = ''): Array<{
    path: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'changed';
  }> => {
    const differences: Array<{
      path: string;
      oldValue: any;
      newValue: any;
      type: 'added' | 'removed' | 'changed';
    }> = [];

    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    allKeys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (!(key in (obj1 || {}))) {
        differences.push({
          path: currentPath,
          oldValue: undefined,
          newValue: val2,
          type: 'added'
        });
      } else if (!(key in (obj2 || {}))) {
        differences.push({
          path: currentPath,
          oldValue: val1,
          newValue: undefined,
          type: 'removed'
        });
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        differences.push(...findDifferences(val1, val2, currentPath));
      } else if (val1 !== val2) {
        differences.push({
          path: currentPath,
          oldValue: val1,
          newValue: val2,
          type: 'changed'
        });
      }
    });

    return differences;
  };

  // Exportar histórico
  const exportHistory = () => {
    const exportData = {
      settingsType,
      exportedAt: new Date().toISOString(),
      versions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-history-${settingsType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importar histórico
  const importHistory = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          
          if (importData.settingsType !== settingsType) {
            console.error('Tipo de configuração não compatível');
            resolve(false);
            return;
          }

          if (Array.isArray(importData.versions)) {
            resolve(saveVersions(importData.versions));
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao importar histórico:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  // Carregar versões na inicialização
  useEffect(() => {
    loadVersions();
  }, [settingsType]);

  return {
    versions,
    isLoading,
    createVersion,
    activateVersion,
    getActiveVersion,
    getVersionById,
    deleteVersion,
    compareVersions,
    exportHistory,
    importHistory,
    refetch: loadVersions
  };
}