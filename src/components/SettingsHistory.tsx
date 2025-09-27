import React, { useState } from 'react';
import { Clock, RotateCcw, Eye, Trash2, Download, Upload, Tag } from 'lucide-react';
import { SettingsVersion } from '../hooks/useSettingsHistory';

interface SettingsHistoryProps {
  versions: SettingsVersion[];
  onRollback: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  currentVersionId?: string;
}

export const SettingsHistory: React.FC<SettingsHistoryProps> = ({
  versions,
  onRollback,
  onDelete,
  onExport,
  onImport,
  currentVersionId
}) => {
  const [selectedVersion, setSelectedVersion] = useState<SettingsVersion | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = ''; // Reset input
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'initial': 'bg-blue-100 text-blue-800',
      'default': 'bg-gray-100 text-gray-800',
      'update': 'bg-green-100 text-green-800',
      'reset': 'bg-yellow-100 text-yellow-800',
      'migration': 'bg-purple-100 text-purple-800',
      'manual': 'bg-indigo-100 text-indigo-800'
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Histórico de Configurações
          </h3>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Versions List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {versions.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              Nenhuma versão encontrada
            </li>
          ) : (
            versions.map((version) => (
              <li key={version.versionId} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {version.isActive && (
                          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {version.versionName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {version.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(version.createdAt)}
                          </span>
                          {version.createdBy && (
                            <span className="text-xs text-gray-400">
                              por {version.createdBy}
                            </span>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {version.tags && version.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {version.tags.map((tag, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tag)}`}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVersion(version);
                        setShowDetails(true);
                      }}
                      className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {!version.isActive && (
                      <button
                        onClick={() => onRollback(version.versionId)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Restaurar esta versão"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    
                    {!version.isActive && (
                      <button
                        onClick={() => onDelete(version.versionId)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Excluir versão"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Details Modal */}
      {showDetails && selectedVersion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes da Versão
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome da Versão
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVersion.versionName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVersion.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Criação
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedVersion.createdAt)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Configurações
                  </label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded-md overflow-auto max-h-64">
                    {JSON.stringify(selectedVersion.settingsData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Fechar
                </button>
                {!selectedVersion.isActive && (
                  <button
                    onClick={() => {
                      onRollback(selectedVersion.versionId);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Restaurar Versão
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};