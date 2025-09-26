import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Paperclip, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Image, 
  FileImage,
  File,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  X
} from 'lucide-react';

interface MedicalAttachment {
  id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  attachment_type: 'lab_result' | 'imaging' | 'prescription' | 'report' | 'consent' | 'other';
  description?: string;
  uploaded_date: string;
  uploaded_by?: string;
  file_url?: string;
  file_data?: string; // Base64 for preview
  is_confidential?: boolean;
  expiry_date?: string;
  tags?: string[];
}

interface MedicalAttachmentsManagerProps {
  initialAttachments?: MedicalAttachment[];
  onAttachmentsChange: (attachments: MedicalAttachment[]) => void;
  readOnly?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ATTACHMENT_TYPES = [
  { value: 'lab_result', label: 'Resultado de Exame', icon: FileText },
  { value: 'imaging', label: 'Imagem Médica', icon: FileImage },
  { value: 'prescription', label: 'Receita Médica', icon: FileText },
  { value: 'report', label: 'Relatório Médico', icon: File },
  { value: 'consent', label: 'Termo de Consentimento', icon: FileText },
  { value: 'other', label: 'Outro', icon: Paperclip }
];

export const MedicalAttachmentsManager: React.FC<MedicalAttachmentsManagerProps> = ({
  initialAttachments = [],
  onAttachmentsChange,
  readOnly = false,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  allowedTypes = DEFAULT_ALLOWED_TYPES
}) => {
  const [attachments, setAttachments] = useState<MedicalAttachment[]>(initialAttachments);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<MedicalAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateAttachments = useCallback((newAttachments: MedicalAttachment[]) => {
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  }, [onAttachmentsChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, attachmentType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    
    const typeConfig = ATTACHMENT_TYPES.find(t => t.value === attachmentType);
    return typeConfig?.icon || File;
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido: ${file.type}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }
    
    if (attachments.length >= maxFiles) {
      return `Número máximo de arquivos atingido: ${maxFiles}`;
    }
    
    return null;
  };

  const processFile = async (file: File, attachmentType: string = 'other'): Promise<MedicalAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const attachment: MedicalAttachment = {
          id: Date.now().toString(),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          attachment_type: attachmentType as MedicalAttachment['attachment_type'],
          uploaded_date: new Date().toISOString(),
          uploaded_by: 'Current User', // This should come from auth context
          file_data: e.target?.result as string,
          is_confidential: false,
          tags: []
        };
        resolve(attachment);
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files: FileList, attachmentType: string = 'other') => {
    if (readOnly) return;
    
    setUploading(true);
    const newAttachments: MedicalAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        alert(error);
        continue;
      }
      
      try {
        const attachment = await processFile(file, attachmentType);
        newAttachments.push(attachment);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert(`Erro ao processar ${file.name}`);
      }
    }
    
    if (newAttachments.length > 0) {
      updateAttachments([...attachments, ...newAttachments]);
    }
    
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    updateAttachments(newAttachments);
  };

  const updateAttachment = (index: number, field: keyof MedicalAttachment, value: any) => {
    const newAttachments = attachments.map((attachment, i) => 
      i === index ? { ...attachment, [field]: value } : attachment
    );
    updateAttachments(newAttachments);
  };

  const downloadAttachment = (attachment: MedicalAttachment) => {
    if (attachment.file_data) {
      const link = document.createElement('a');
      link.href = attachment.file_data;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const previewAttachment = (attachment: MedicalAttachment) => {
    setPreviewFile(attachment);
  };

  const canPreview = (fileType: string): boolean => {
    return fileType.startsWith('image/') || fileType === 'application/pdf' || fileType.startsWith('text/');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Anexos Médicos
          {!readOnly && (
            <div className="ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || attachments.length >= maxFiles}
              >
                <Upload className="h-4 w-4 mr-1" />
                {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Drop Zone */}
        {!readOnly && attachments.length < maxFiles && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Arraste arquivos aqui ou clique em "Adicionar Arquivo"
            </p>
            <p className="text-sm text-gray-500">
              Tipos permitidos: PDF, Imagens, Documentos (máx. {maxFileSize}MB cada)
            </p>
          </div>
        )}

        {/* Attachments List */}
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum anexo adicionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attachments.map((attachment, index) => {
              const IconComponent = getFileIcon(attachment.file_type, attachment.attachment_type);
              
              return (
                <Card key={attachment.id || index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* File Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-8 w-8 text-blue-600 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {attachment.file_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {ATTACHMENT_TYPES.find(t => t.value === attachment.attachment_type)?.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(attachment.file_size)}
                              </span>
                              {attachment.is_confidential && (
                                <Badge variant="destructive" className="text-xs">
                                  Confidencial
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(attachment.uploaded_date).toLocaleDateString('pt-BR')}
                              </div>
                              {attachment.uploaded_by && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {attachment.uploaded_by}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3">
                          <Label className="text-xs">Descrição</Label>
                          <Textarea
                            placeholder="Descrição do anexo..."
                            value={attachment.description || ''}
                            onChange={(e) => updateAttachment(index, 'description', e.target.value)}
                            disabled={readOnly}
                            className="mt-1 min-h-[60px]"
                          />
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs">Tipo de Anexo</Label>
                            <Select
                              value={attachment.attachment_type}
                              onValueChange={(value: MedicalAttachment['attachment_type']) => 
                                updateAttachment(index, 'attachment_type', value)
                              }
                              disabled={readOnly}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ATTACHMENT_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={attachment.is_confidential || false}
                                onChange={(e) => updateAttachment(index, 'is_confidential', e.target.checked)}
                                disabled={readOnly}
                                className="rounded"
                              />
                              Confidencial
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {canPreview(attachment.file_type) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => previewAttachment(attachment)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>

                        {!readOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {attachments.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumo dos Anexos
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total de arquivos:</span>
                <p className="font-medium">{attachments.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Tamanho total:</span>
                <p className="font-medium">
                  {formatFileSize(attachments.reduce((sum, att) => sum + att.file_size, 0))}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Confidenciais:</span>
                <p className="font-medium">
                  {attachments.filter(att => att.is_confidential).length}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Espaço restante:</span>
                <p className="font-medium">{maxFiles - attachments.length} arquivos</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">{previewFile.file_name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                {previewFile.file_type.startsWith('image/') && previewFile.file_data && (
                  <img
                    src={previewFile.file_data}
                    alt={previewFile.file_name}
                    className="max-w-full h-auto"
                  />
                )}
                {previewFile.file_type === 'application/pdf' && previewFile.file_data && (
                  <iframe
                    src={previewFile.file_data}
                    className="w-full h-96"
                    title={previewFile.file_name}
                  />
                )}
                {previewFile.file_type.startsWith('text/') && previewFile.file_data && (
                  <pre className="whitespace-pre-wrap text-sm">
                    {atob(previewFile.file_data.split(',')[1])}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalAttachmentsManager;