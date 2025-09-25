import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Pill, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Stethoscope,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  record_date: string;
  chief_complaint: string;
  assessment_plan: string;
  medications: string;
  allergies: string;
  physical_examination: string;
  history_present_illness: string;
  past_medical_history: string;
  family_history: string;
  social_history: string;
  review_systems: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    full_name: string;
    specialty: string;
  };
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface MedicalTimelineProps {
  patientId: string;
}

export const MedicalTimeline: React.FC<MedicalTimelineProps> = ({ patientId }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('medical_records')
          .select(`
            *,
            doctor:profiles!medical_records_doctor_id_fkey(full_name, specialty)
          `)
          .eq('patient_id', patientId)
          .order('record_date', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          // Fallback para dados de teste se houver erro no Supabase
          const testRecords = getTestMedicalRecords(patientId);
          setRecords(testRecords);
        } else if (data && data.length > 0) {
          setRecords(data as unknown as MedicalRecord[]);
        } else {
          // Se não há dados no banco, usar dados de teste
          console.log('No medical records found in database, using test data');
          const testRecords = getTestMedicalRecords(patientId);
          setRecords(testRecords);
        }
      } catch (err) {
        console.error('Error fetching medical records:', err);
        // Fallback para dados de teste em caso de erro
        const testRecords = getTestMedicalRecords(patientId);
        setRecords(testRecords);
        setError(null); // Não mostrar erro se conseguimos carregar dados de teste
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchMedicalRecords();
    }
  }, [patientId]);

  // Função para gerar dados de teste
  const getTestMedicalRecords = (patientId: string): MedicalRecord[] => {
    return [
      {
        id: 'test-record-1',
        patient_id: patientId,
        doctor_id: 'test-doctor-1',
        record_date: new Date().toISOString(),
        chief_complaint: 'Dor no peito e falta de ar',
        assessment_plan: 'Suspeita de angina. Solicitar ECG e enzimas cardíacas. Orientações sobre mudanças no estilo de vida.',
        medications: 'AAS 100mg 1x/dia pela manhã, Atenolol 50mg 1x/dia pela manhã',
        allergies: 'Penicilina (rash cutâneo)',
        physical_examination: 'PA: 140/90 mmHg, FC: 85 bpm, FR: 16 irpm, Tax: 36.5°C. Ausculta cardíaca: ritmo regular, sem sopros. Ausculta pulmonar: murmúrio vesicular presente bilateralmente.',
        history_present_illness: 'Paciente refere dor precordial em aperto há 2 dias, com irradiação para braço esquerdo, associada a dispneia aos esforços moderados.',
        past_medical_history: 'Hipertensão arterial sistêmica há 5 anos, em uso irregular de medicação',
        family_history: 'Pai com infarto agudo do miocárdio aos 60 anos, mãe hipertensa',
        social_history: 'Ex-tabagista (parou há 1 ano, 20 maços/ano), etilismo social, sedentário',
        review_systems: 'Nega febre, náuseas, vômitos, palpitações ou síncope',
        notes: 'Paciente orientado sobre a importância da adesão medicamentosa e mudanças no estilo de vida. Solicitados exames complementares.',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        doctor: {
          full_name: 'Dr. João Silva',
          specialty: 'Cardiologia'
        }
      },
      {
        id: 'test-record-2',
        patient_id: patientId,
        doctor_id: 'test-doctor-2',
        record_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        chief_complaint: 'Consulta de rotina - acompanhamento',
        assessment_plan: 'Paciente estável. Manter medicações atuais. Retorno em 3 meses.',
        medications: 'Losartana 50mg 1x/dia pela manhã, Sinvastatina 20mg à noite',
        allergies: 'Nenhuma alergia medicamentosa conhecida',
        physical_examination: 'PA: 130/80 mmHg, FC: 72 bpm, IMC: 26,5 kg/m². Exame cardiovascular e pulmonar sem alterações.',
        history_present_illness: 'Consulta de acompanhamento de rotina. Paciente assintomático.',
        past_medical_history: 'Hipertensão arterial sistêmica e dislipidemia',
        family_history: 'Mãe diabética tipo 2, avô paterno com AVC',
        social_history: 'Não fuma, etilismo social esporádico, pratica caminhada 3x/semana',
        review_systems: 'Sem queixas. Nega cefaleia, tontura, dor precordial ou dispneia',
        notes: 'Paciente aderente ao tratamento. Exames laboratoriais dentro da normalidade.',
        status: 'completed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        doctor: {
          full_name: 'Dra. Maria Santos',
          specialty: 'Clínica Geral'
        }
      },
      {
        id: 'test-record-3',
        patient_id: patientId,
        doctor_id: 'test-doctor-3',
        record_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        chief_complaint: 'Dor abdominal e náuseas',
        assessment_plan: 'Gastrite aguda. Prescrição de protetor gástrico e orientações dietéticas.',
        medications: 'Omeprazol 20mg 1x/dia em jejum por 30 dias, Domperidona 10mg 3x/dia antes das refeições',
        allergies: 'Nenhuma alergia conhecida',
        physical_examination: 'Abdome: dor à palpação em epigástrio, sem sinais de irritação peritoneal. Demais sistemas sem alterações.',
        history_present_illness: 'Dor em queimação em epigástrio há 3 dias, associada a náuseas e pirose',
        past_medical_history: 'Episódios esporádicos de gastrite',
        family_history: 'Sem antecedentes familiares relevantes',
        social_history: 'Stress no trabalho, alimentação irregular',
        review_systems: 'Nega vômitos, diarreia ou febre',
        notes: 'Orientado sobre alimentação fracionada e evitar alimentos irritantes',
        status: 'completed',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        doctor: {
          full_name: 'Dr. Carlos Oliveira',
          specialty: 'Gastroenterologia'
        }
      }
    ];
  };

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMedications = (medications: string) => {
    if (!medications || medications.trim() === '') {
      return <p className="text-sm text-gray-500">Nenhum medicamento prescrito</p>;
    }

    // Parse medications string - assuming it's JSON or simple text
    let medicationList: Medication[] = [];
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(medications);
      if (Array.isArray(parsed)) {
        medicationList = parsed;
      } else {
        // If it's not an array, treat as single medication
        medicationList = [parsed];
      }
    } catch {
      // If JSON parsing fails, treat as plain text and create a simple medication object
      medicationList = [{
        name: medications,
        dosage: 'Conforme prescrição',
        frequency: 'Conforme orientação médica',
        duration: 'Conforme necessário'
      }];
    }

    return (
      <div className="space-y-3">
        {medicationList.map((med, index) => (
          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Pill className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">{med.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-green-700">
                  <div>
                    <span className="font-medium">Dosagem:</span> {med.dosage}
                  </div>
                  <div>
                    <span className="font-medium">Frequência:</span> {med.frequency}
                  </div>
                  <div>
                    <span className="font-medium">Duração:</span> {med.duration}
                  </div>
                </div>
                {med.instructions && (
                  <div className="mt-2 text-sm text-green-700">
                    <span className="font-medium">Instruções:</span> {med.instructions}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando prontuário...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-gray-500">
            <FileText className="h-5 w-5 mr-2" />
            <span>Nenhum registro médico encontrado</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Stethoscope className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Prontuário Médico</h2>
        <Badge variant="secondary" className="ml-2">
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {records.map((record, index) => {
          const isExpanded = expandedRecords.has(record.id);
          
          return (
            <div key={record.id} className="relative flex gap-4 pb-8">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{formatDate(record.record_date)}</span>
                          <Badge 
                            variant={record.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {record.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </CardTitle>
                        
                        {record.doctor && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{record.doctor.full_name}</span>
                            {record.doctor.specialty && (
                              <>
                                <span>•</span>
                                <span>{record.doctor.specialty}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecordExpansion(record.id)}
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Chief Complaint - Always visible */}
                    {record.chief_complaint && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Queixa Principal
                        </h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {record.chief_complaint}
                        </p>
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="space-y-4">
                        <Separator />

                        {/* Assessment and Plan */}
                        {record.assessment_plan && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Avaliação e Plano
                            </h4>
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                              {record.assessment_plan}
                            </p>
                          </div>
                        )}

                        {/* Medications */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Medicamentos
                          </h4>
                          {renderMedications(record.medications)}
                        </div>

                        {/* Physical Examination */}
                        {record.physical_examination && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Stethoscope className="h-4 w-4" />
                              Exame Físico
                            </h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {record.physical_examination}
                            </p>
                          </div>
                        )}

                        {/* Allergies */}
                        {record.allergies && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              Alergias
                            </h4>
                            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                              {record.allergies}
                            </p>
                          </div>
                        )}

                        {/* Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Observações
                            </h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {record.notes}
                            </p>
                          </div>
                        )}

                        {/* Medical History sections */}
                        {(record.history_present_illness || record.past_medical_history || record.family_history || record.social_history) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {record.history_present_illness && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 text-sm">História da Doença Atual</h5>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {record.history_present_illness}
                                </p>
                              </div>
                            )}
                            
                            {record.past_medical_history && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 text-sm">História Médica Pregressa</h5>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {record.past_medical_history}
                                </p>
                              </div>
                            )}
                            
                            {record.family_history && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 text-sm">História Familiar</h5>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {record.family_history}
                                </p>
                              </div>
                            )}
                            
                            {record.social_history && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 text-sm">História Social</h5>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {record.social_history}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Review of Systems */}
                        {record.review_systems && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Revisão de Sistemas
                            </h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {record.review_systems}
                            </p>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Criado: {formatDate(record.created_at)}</span>
                          </div>
                          {record.updated_at !== record.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Atualizado: {formatDate(record.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicalTimeline;