import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Pill,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyPermissions } from '@/hooks/useFamilyAccess';

interface MedicalAttachment {
  id: string;
  medical_record_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  attachment_type: string;
  created_at: string;
  updated_at: string;
  medical_record?: {
    id: string;
    record_date: string;
    profiles?: {
      full_name: string;
      specialty?: string;
    } | null;
  } | null;
}

interface FamilyPrescriptionsProps {
  patientId: string;
  permissions: FamilyPermissions | null;
}

export const FamilyPrescriptions: React.FC<FamilyPrescriptionsProps> = ({
  patientId,
  permissions
}) => {
  const [prescriptions, setPrescriptions] = useState<MedicalAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar anexos do tipo 'prescription' para o paciente
        const { data, error } = await supabase
          .from('medical_record_attachments')
          .select(`
            id,
            medical_record_id,
            file_name,
            file_path,
            file_size,
            attachment_type,
            created_at,
            updated_at,
            medical_record:medical_records!inner(
              id,
              record_date,
              profiles!medical_records_doctor_id_fkey(
                full_name,
                specialty
              )
            )
          `)
          .eq('medical_record.patient_id', patientId)
          .eq('attachment_type', 'prescription')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar receitas:', error);
          setError('Erro ao carregar receitas médicas');
        } else {
          setPrescriptions(data as any || []);
        }
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
        setError('Erro ao carregar receitas médicas');
      } finally {
        setLoading(false);
      }
    };

    if (patientId && permissions?.canView) {
      fetchPrescriptions();
    }
  }, [patientId, permissions]);

  const downloadPrescription = async (prescription: MedicalAttachment) => {
    try {
      setDownloading(prescription.id);

      // Se temos o caminho do arquivo, tentar baixar do storage
      if (prescription.file_path) {
        const { data, error } = await supabase.storage
          .from('medical-attachments')
          .download(prescription.file_path);

        if (error) {
          throw error;
        }

        // Criar URL para download
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = prescription.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Arquivo não encontrado');
      }
    } catch (err) {
      console.error('Erro ao baixar receita:', err);
      setError('Erro ao baixar receita médica');
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!permissions?.canView) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para visualizar receitas médicas.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Receitas Médicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando receitas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Receitas Médicas
          <Badge variant="outline" className="ml-auto">
            {prescriptions.length} {prescriptions.length === 1 ? 'receita' : 'receitas'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma receita médica encontrada</p>
            <p className="text-sm">As receitas médicas anexadas pelos médicos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium text-gray-900">
                          {prescription.file_name}
                        </h3>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Receita Médica
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Consulta: {formatDate(prescription.medical_record?.record_date || prescription.created_at)}
                          </span>
                        </div>
                        
                        {prescription.medical_record?.profiles && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              Dr(a). {prescription.medical_record.profiles.full_name}
                              {prescription.medical_record.profiles.specialty && 
                                ` - ${prescription.medical_record.profiles.specialty}`
                              }
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Tamanho: {formatFileSize(prescription.file_size)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Anexado: {formatDate(prescription.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPrescription(prescription)}
                        disabled={downloading === prescription.id}
                        className="w-full"
                      >
                        {downloading === prescription.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Baixando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {prescriptions.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Informações Importantes
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• As receitas médicas são anexadas pelos médicos durante as consultas</li>
                  <li>• Você pode baixar e imprimir as receitas para uso na farmácia</li>
                  <li>• Mantenha sempre as receitas originais para controle</li>
                  <li>• Em caso de dúvidas, entre em contato com o médico responsável</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyPrescriptions;