import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Stethoscope, 
  ClipboardList, 
  Eye, 
  Pill,
  Calendar,
  Edit,
  Download,
  Share,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type MedicalDiagnosis = Database['public']['Tables']['medical_diagnoses']['Row'];
type MedicalExam = Database['public']['Tables']['medical_exams']['Row'];
type MedicalPrescription = Database['public']['Tables']['medical_prescriptions']['Row'];

interface MedicalRecordWithRelations extends MedicalRecord {
  patient: Patient;
  profiles: Profile;
  diagnoses: MedicalDiagnosis[];
  exams: MedicalExam[];
  prescriptions: MedicalPrescription[];
}

interface MedicalRecordViewProps {
  recordId: string;
  onEdit?: (recordId: string) => void;
  onBack?: () => void;
}

const MedicalRecordView: React.FC<MedicalRecordViewProps> = ({
  recordId,
  onEdit,
  onBack
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MedicalRecordWithRelations | null>(null);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);

      // Carregar prontuário com relações
      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(*),
          profiles:profiles!medical_records_doctor_id_fkey(*)
        `)
        .eq('id', recordId)
        .single();

      if (recordError) throw recordError;

      // Carregar diagnósticos
      const { data: diagnosesData } = await supabase
        .from('medical_diagnoses')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('primary_diagnosis', { ascending: false });

      // Carregar exames
      const { data: examsData } = await supabase
        .from('medical_exams')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('exam_date', { ascending: false });

      // Carregar prescrições
      const { data: prescriptionsData } = await supabase
        .from('medical_prescriptions')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('created_at', { ascending: false });

      setRecord({
        ...recordData,
        diagnoses: diagnosesData || [],
        exams: examsData || [],
        prescriptions: prescriptionsData || []
      });

    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prontuário médico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      archived: { label: 'Arquivado', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getExamStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { label: 'Solicitado', variant: 'secondary' as const },
      scheduled: { label: 'Agendado', variant: 'default' as const },
      completed: { label: 'Realizado', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center p-8">
        <p>Prontuário não encontrado</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Prontuário Médico</h1>
            <p className="text-gray-600">
              {record.patient.name} - {format(new Date(record.record_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(record.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Paciente</h4>
              <p className="text-lg">{record.patient.name}</p>
              <p className="text-sm text-gray-600">
                {record.patient.birth_date && 
                  `Nascimento: ${format(new Date(record.patient.birth_date), "dd/MM/yyyy", { locale: ptBR })}`
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Médico Responsável</h4>
              <p className="text-lg">Dr(a). {record.profiles.full_name}</p>
              <p className="text-sm text-gray-600">{record.profiles.email}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Data e Status</h4>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(record.record_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {getStatusBadge(record.status)}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Última atualização: {format(new Date(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </CardContent>
      </Card>

      {/* Anamnese */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.chief_complaint && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Queixa Principal</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{record.chief_complaint}</p>
            </div>
          )}

          {record.history_present_illness && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">História da Doença Atual</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{record.history_present_illness}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {record.past_medical_history && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Antecedentes Pessoais</h4>
                <p className="text-gray-800 whitespace-pre-wrap">{record.past_medical_history}</p>
              </div>
            )}

            {record.family_history && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Antecedentes Familiares</h4>
                <p className="text-gray-800 whitespace-pre-wrap">{record.family_history}</p>
              </div>
            )}

            {record.medications && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Medicações em Uso</h4>
                <p className="text-gray-800 whitespace-pre-wrap">{record.medications}</p>
              </div>
            )}

            {record.allergies && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Alergias</h4>
                <p className="text-gray-800 whitespace-pre-wrap">{record.allergies}</p>
              </div>
            )}
          </div>

          {record.social_history && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">História Social</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{record.social_history}</p>
            </div>
          )}

          {record.review_systems && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Revisão de Sistemas</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{record.review_systems}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exame Físico */}
      {record.physical_examination && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Exame Físico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 whitespace-pre-wrap">{record.physical_examination}</p>
          </CardContent>
        </Card>
      )}

      {/* Diagnósticos */}
      {record.diagnoses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Diagnósticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.diagnoses.map((diagnosis, index) => (
                <div key={diagnosis.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{diagnosis.diagnosis_text}</p>
                      {diagnosis.primary_diagnosis && (
                        <Badge variant="default" className="text-xs">Principal</Badge>
                      )}
                    </div>
                    {diagnosis.diagnosis_code && (
                      <p className="text-sm text-gray-600">CID: {diagnosis.diagnosis_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exames Solicitados */}
      {record.exams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Exames Solicitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.exams.map((exam, index) => (
                <div key={exam.id || index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{exam.exam_type}</h4>
                    {getExamStatusBadge(exam.status)}
                  </div>
                  
                  {exam.exam_date && (
                    <p className="text-sm text-gray-600 mb-2">
                      Data: {format(new Date(exam.exam_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  
                  {exam.result && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">Resultado:</p>
                      <p className="text-sm text-gray-800">{exam.result}</p>
                    </div>
                  )}
                  
                  {exam.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Observações:</p>
                      <p className="text-sm text-gray-800">{exam.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescrições */}
      {record.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescrições Médicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.prescriptions.map((prescription, index) => (
                <div key={prescription.id || index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Prescrição #{index + 1}</h4>
                    <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                      {prescription.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Criada em: {format(new Date(prescription.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  
                  {prescription.memed_prescription_id && (
                    <p className="text-sm text-gray-600">
                      ID Memed: {prescription.memed_prescription_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avaliação e Plano */}
      {record.assessment_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Avaliação e Plano Terapêutico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 whitespace-pre-wrap">{record.assessment_plan}</p>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {record.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 whitespace-pre-wrap">{record.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicalRecordView;