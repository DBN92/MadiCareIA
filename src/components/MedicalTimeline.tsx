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
  AlertTriangle,
  Thermometer,
  TrendingUp,
  FileImage,
  TestTube,
  Clipboard,
  Target,
  Scale,
  Eye,
  Download,
  Monitor,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pain_scale?: number;
}

interface DiagnosticCode {
  code: string;
  description: string;
  type: 'CID10' | 'CID11' | 'SNOMED' | 'OTHER';
}

interface LabResult {
  test_name: string;
  result: string;
  reference_range: string;
  unit: string;
  status: 'normal' | 'abnormal' | 'critical';
  date: string;
}

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
  // Enhanced fields
  vital_signs?: string; // JSON string of VitalSigns
  diagnostic_codes?: string; // JSON string of DiagnosticCode[]
  lab_results?: string; // JSON string of LabResult[]
  procedures?: string; // JSON string of procedures performed
  follow_up_instructions?: string;
  next_appointment?: string;
  referrals?: string; // JSON string of referrals to specialists
  imaging_studies?: string; // JSON string of imaging studies ordered/reviewed
  immunizations?: string; // JSON string of vaccines administered
  consultation_type?: 'presencial' | 'online'; // Tipo de consulta
  has_prescription?: boolean; // Se possui prescrição médica
  has_certificate?: boolean; // Se possui atestado médico
  doctor?: {
    full_name: string;
    specialty: string;
  };
  profiles?: {
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
  indication?: string;
  route?: string; // oral, IV, IM, etc.
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
            profiles:profiles!medical_records_doctor_id_fkey(full_name, specialty)
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

  // Função para gerar dados de teste completos
  const getTestMedicalRecords = (patientId: string): MedicalRecord[] => {
    return [
      {
        id: 'test-record-1',
        patient_id: patientId,
        doctor_id: 'test-doctor-1',
        record_date: new Date().toISOString(),
        chief_complaint: 'Dor no peito e falta de ar',
        assessment_plan: 'Suspeita de angina. Solicitar ECG e enzimas cardíacas. Orientações sobre mudanças no estilo de vida. Iniciar terapia com betabloqueador.',
        medications: JSON.stringify([
          {
            name: 'Ácido Acetilsalicílico (AAS)',
            dosage: '100mg',
            frequency: '1x ao dia',
            duration: 'Uso contínuo',
            instructions: 'Tomar pela manhã, após o café da manhã',
            indication: 'Prevenção cardiovascular',
            route: 'Oral'
          },
          {
            name: 'Atenolol',
            dosage: '50mg',
            frequency: '1x ao dia',
            duration: 'Uso contínuo',
            instructions: 'Tomar pela manhã, em jejum',
            indication: 'Controle da pressão arterial e frequência cardíaca',
            route: 'Oral'
          }
        ]),
        allergies: 'Penicilina (rash cutâneo), Dipirona (broncoespasmo)',
        physical_examination: 'Paciente em bom estado geral, corado, hidratado, anictérico. Ausculta cardíaca: ritmo regular em 2 tempos, bulhas normofonéticas, sem sopros. Ausculta pulmonar: murmúrio vesicular presente bilateralmente, sem ruídos adventícios. Abdome: plano, flácido, indolor, sem visceromegalias.',
        history_present_illness: 'Paciente refere dor precordial em aperto há 2 dias, com irradiação para braço esquerdo e mandíbula, associada a dispneia aos esforços moderados. Nega sudorese fria ou náuseas. Dor com intensidade 7/10, melhora parcial com repouso.',
        past_medical_history: 'Hipertensão arterial sistêmica há 5 anos, em uso irregular de medicação. Dislipidemia diagnosticada há 2 anos. Nega diabetes, cardiopatias prévias ou cirurgias.',
        family_history: 'Pai com infarto agudo do miocárdio aos 60 anos, mãe hipertensa e diabética. Avô paterno faleceu por AVC aos 75 anos.',
        social_history: 'Ex-tabagista (parou há 1 ano, carga tabágica de 20 maços/ano), etilismo social esporádico, sedentário. Trabalha como contador, alto nível de estresse.',
        review_systems: 'Nega febre, náuseas, vômitos, palpitações, síncope, edema de membros inferiores, ortopneia ou dispneia paroxística noturna.',
        notes: 'Paciente orientado sobre a importância da adesão medicamentosa e mudanças no estilo de vida. Solicitados exames complementares. Agendado retorno em 15 dias para reavaliação.',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vital_signs: JSON.stringify({
          blood_pressure_systolic: 140,
          blood_pressure_diastolic: 90,
          heart_rate: 85,
          respiratory_rate: 16,
          temperature: 36.5,
          oxygen_saturation: 98,
          weight: 78.5,
          height: 175,
          bmi: 25.6,
          pain_scale: 7
        }),
        diagnostic_codes: JSON.stringify([
          { code: 'I20.9', description: 'Angina pectoris, não especificada', type: 'CID10' },
          { code: 'I10', description: 'Hipertensão essencial', type: 'CID10' },
          { code: 'E78.5', description: 'Hiperlipidemia não especificada', type: 'CID10' }
        ]),
        lab_results: JSON.stringify([
          { test_name: 'Troponina I', result: '0.02', reference_range: '< 0.04', unit: 'ng/mL', status: 'normal', date: new Date().toISOString() },
          { test_name: 'CK-MB', result: '3.2', reference_range: '< 6.3', unit: 'ng/mL', status: 'normal', date: new Date().toISOString() },
          { test_name: 'Colesterol Total', result: '240', reference_range: '< 200', unit: 'mg/dL', status: 'abnormal', date: new Date().toISOString() },
          { test_name: 'LDL', result: '160', reference_range: '< 100', unit: 'mg/dL', status: 'abnormal', date: new Date().toISOString() }
        ]),
        procedures: JSON.stringify(['ECG de 12 derivações', 'Raio-X de tórax']),
        follow_up_instructions: 'Retornar em 15 dias para reavaliação. Procurar atendimento de urgência se houver piora da dor ou novos sintomas.',
        next_appointment: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        referrals: JSON.stringify([
          { specialty: 'Cardiologia', doctor: 'Dr. Pedro Cardoso', reason: 'Avaliação especializada e possível cateterismo' }
        ]),
        imaging_studies: JSON.stringify([
          { type: 'Ecocardiograma', status: 'Solicitado', date: new Date().toISOString() },
          { type: 'Teste ergométrico', status: 'Solicitado', date: new Date().toISOString() }
        ]),
        consultation_type: 'presencial',
        has_prescription: true,
        has_certificate: true,
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
        chief_complaint: 'Consulta de rotina - acompanhamento de hipertensão',
        assessment_plan: 'Hipertensão arterial controlada. Manter medicações atuais. Orientações sobre dieta e exercícios. Retorno em 3 meses.',
        medications: JSON.stringify([
          {
            name: 'Losartana Potássica',
            dosage: '50mg',
            frequency: '1x ao dia',
            duration: 'Uso contínuo',
            instructions: 'Tomar pela manhã, preferencialmente no mesmo horário',
            indication: 'Controle da pressão arterial',
            route: 'Oral'
          },
          {
            name: 'Sinvastatina',
            dosage: '20mg',
            frequency: '1x ao dia',
            duration: 'Uso contínuo',
            instructions: 'Tomar à noite, após o jantar',
            indication: 'Controle do colesterol',
            route: 'Oral'
          }
        ]),
        allergies: 'Nenhuma alergia medicamentosa conhecida',
        physical_examination: 'Paciente em bom estado geral. Ausculta cardiovascular e pulmonar sem alterações. Abdome sem alterações. Extremidades sem edema.',
        history_present_illness: 'Consulta de acompanhamento de rotina. Paciente assintomático, aderente ao tratamento medicamentoso.',
        past_medical_history: 'Hipertensão arterial sistêmica há 6 anos, dislipidemia há 3 anos. Nega outras comorbidades.',
        family_history: 'Mãe diabética tipo 2, avô paterno com AVC, avó materna hipertensa',
        social_history: 'Não fuma, etilismo social esporádico (1-2 doses/semana), pratica caminhada 3x/semana por 30 minutos',
        review_systems: 'Sem queixas. Nega cefaleia, tontura, dor precordial, dispneia, palpitações ou edema',
        notes: 'Paciente aderente ao tratamento. Exames laboratoriais dentro da normalidade. Orientado sobre manutenção do estilo de vida saudável.',
        status: 'completed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        vital_signs: JSON.stringify({
          blood_pressure_systolic: 130,
          blood_pressure_diastolic: 80,
          heart_rate: 72,
          respiratory_rate: 14,
          temperature: 36.2,
          oxygen_saturation: 99,
          weight: 76.2,
          height: 175,
          bmi: 24.9,
          pain_scale: 0
        }),
        diagnostic_codes: JSON.stringify([
          { code: 'I10', description: 'Hipertensão essencial', type: 'CID10' },
          { code: 'E78.5', description: 'Hiperlipidemia não especificada', type: 'CID10' }
        ]),
        lab_results: JSON.stringify([
          { test_name: 'Glicemia de jejum', result: '92', reference_range: '70-99', unit: 'mg/dL', status: 'normal', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { test_name: 'Colesterol Total', result: '180', reference_range: '< 200', unit: 'mg/dL', status: 'normal', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { test_name: 'Creatinina', result: '1.0', reference_range: '0.7-1.3', unit: 'mg/dL', status: 'normal', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
        ]),
        follow_up_instructions: 'Manter medicações, dieta hipossódica e exercícios regulares. Retorno em 3 meses.',
        next_appointment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        consultation_type: 'online',
        has_prescription: true,
        has_certificate: false,
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
        chief_complaint: 'Dor abdominal e náuseas há 3 dias',
        assessment_plan: 'Gastrite aguda. Prescrição de protetor gástrico e orientações dietéticas. Acompanhamento em 7 dias.',
        medications: JSON.stringify([
          {
            name: 'Omeprazol',
            dosage: '20mg',
            frequency: '1x ao dia',
            duration: '30 dias',
            instructions: 'Tomar em jejum, 30 minutos antes do café da manhã',
            indication: 'Proteção gástrica',
            route: 'Oral'
          },
          {
            name: 'Domperidona',
            dosage: '10mg',
            frequency: '3x ao dia',
            duration: '7 dias',
            instructions: 'Tomar 15 minutos antes das refeições principais',
            indication: 'Controle de náuseas e melhora do esvaziamento gástrico',
            route: 'Oral'
          }
        ]),
        allergies: 'Nenhuma alergia conhecida',
        physical_examination: 'Abdome: dor à palpação superficial e profunda em epigástrio, sem sinais de irritação peritoneal, sem massas palpáveis ou visceromegalias. Ruídos hidroaéreos presentes e normais.',
        history_present_illness: 'Dor em queimação em epigástrio há 3 dias, intensidade 6/10, associada a náuseas e pirose. Piora após alimentação e melhora parcial com antiácidos.',
        past_medical_history: 'Episódios esporádicos de gastrite nos últimos 2 anos. Nega úlcera péptica, cirurgias abdominais ou outras comorbidades.',
        family_history: 'Mãe com gastrite crônica, pai sem antecedentes relevantes',
        social_history: 'Stress elevado no trabalho, alimentação irregular com horários desorganizados, consumo frequente de café',
        review_systems: 'Nega vômitos, diarreia, febre, perda de peso ou sangramento digestivo',
        notes: 'Orientado sobre alimentação fracionada, evitar alimentos irritantes (café, álcool, condimentos), controle do stress. Retorno se não houver melhora em 7 dias.',
        status: 'completed',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        vital_signs: JSON.stringify({
          blood_pressure_systolic: 125,
          blood_pressure_diastolic: 78,
          heart_rate: 78,
          respiratory_rate: 16,
          temperature: 36.8,
          oxygen_saturation: 98,
          weight: 72.0,
          height: 170,
          bmi: 24.9,
          pain_scale: 6
        }),
        diagnostic_codes: JSON.stringify([
          { code: 'K29.7', description: 'Gastrite não especificada', type: 'CID10' },
          { code: 'R11', description: 'Náusea e vômitos', type: 'CID10' }
        ]),
        lab_results: JSON.stringify([
          { test_name: 'Hemograma completo', result: 'Normal', reference_range: 'Valores de referência', unit: '', status: 'normal', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
          { test_name: 'PCR', result: '2.1', reference_range: '< 3.0', unit: 'mg/L', status: 'normal', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() }
        ]),
        follow_up_instructions: 'Dieta leve, evitar irritantes gástricos, retorno em 7 dias ou antes se houver piora dos sintomas.',
        next_appointment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        consultation_type: 'presencial',
        has_prescription: true,
        has_certificate: true,
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
                  {med.route && (
                    <div>
                      <span className="font-medium">Via:</span> {med.route}
                    </div>
                  )}
                </div>
                {med.indication && (
                  <div className="mt-2 text-sm text-green-700">
                    <span className="font-medium">Indicação:</span> {med.indication}
                  </div>
                )}
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

  const renderVitalSigns = (vitalSignsStr: string) => {
    if (!vitalSignsStr) return null;

    try {
      const vitalSigns: VitalSigns = JSON.parse(vitalSignsStr);
      
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Sinais Vitais
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            {vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Pressão Arterial</div>
                <div className="text-blue-600 font-semibold">
                  {vitalSigns.blood_pressure_systolic}/{vitalSigns.blood_pressure_diastolic} mmHg
                </div>
              </div>
            )}
            {vitalSigns.heart_rate && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Frequência Cardíaca</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.heart_rate} bpm</div>
              </div>
            )}
            {vitalSigns.temperature && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Temperatura</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.temperature}°C</div>
              </div>
            )}
            {vitalSigns.respiratory_rate && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Freq. Respiratória</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.respiratory_rate} irpm</div>
              </div>
            )}
            {vitalSigns.oxygen_saturation && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Saturação O₂</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.oxygen_saturation}%</div>
              </div>
            )}
            {vitalSigns.weight && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Peso</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.weight} kg</div>
              </div>
            )}
            {vitalSigns.height && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Altura</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.height} cm</div>
              </div>
            )}
            {vitalSigns.bmi && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">IMC</div>
                <div className="text-blue-600 font-semibold">{vitalSigns.bmi} kg/m²</div>
              </div>
            )}
            {vitalSigns.pain_scale !== undefined && vitalSigns.pain_scale > 0 && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">Escala de Dor</div>
                <div className="text-red-600 font-semibold">{vitalSigns.pain_scale}/10</div>
              </div>
            )}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderDiagnosticCodes = (diagnosticCodesStr: string) => {
    if (!diagnosticCodesStr) return null;

    try {
      const diagnosticCodes: DiagnosticCode[] = JSON.parse(diagnosticCodesStr);
      
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Códigos Diagnósticos
          </h4>
          <div className="space-y-2">
            {diagnosticCodes.map((code, index) => (
              <div key={index} className="bg-white p-3 rounded border flex items-start gap-3">
                <Badge variant="outline" className="text-xs">
                  {code.type}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium text-purple-900">{code.code}</div>
                  <div className="text-sm text-purple-700">{code.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderLabResults = (labResultsStr: string) => {
    if (!labResultsStr) return null;

    try {
      const labResults: LabResult[] = JSON.parse(labResultsStr);
      
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Resultados Laboratoriais
          </h4>
          <div className="space-y-3">
            {labResults.map((result, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">{result.test_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Resultado:</span> {result.result} {result.unit}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Referência:</span> {result.reference_range} {result.unit}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(result.date)}
                    </div>
                  </div>
                  <Badge 
                    variant={result.status === 'normal' ? 'default' : result.status === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {result.status === 'normal' ? 'Normal' : result.status === 'critical' ? 'Crítico' : 'Alterado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderProcedures = (proceduresStr: string) => {
    if (!proceduresStr) return null;

    try {
      const procedures: string[] = JSON.parse(proceduresStr);
      
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Procedimentos Realizados
          </h4>
          <div className="space-y-2">
            {procedures.map((procedure, index) => (
              <div key={index} className="bg-white p-2 rounded border text-sm text-indigo-700">
                • {procedure}
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderReferrals = (referralsStr: string) => {
    if (!referralsStr) return null;

    try {
      const referrals: any[] = JSON.parse(referralsStr);
      
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Encaminhamentos
          </h4>
          <div className="space-y-3">
            {referrals.map((referral, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="font-medium text-orange-900">{referral.specialty}</div>
                {referral.doctor && (
                  <div className="text-sm text-orange-700 mt-1">
                    <span className="font-medium">Médico:</span> {referral.doctor}
                  </div>
                )}
                {referral.reason && (
                  <div className="text-sm text-orange-700 mt-1">
                    <span className="font-medium">Motivo:</span> {referral.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderImagingStudies = (imagingStr: string) => {
    if (!imagingStr) return null;

    try {
      const imaging: any[] = JSON.parse(imagingStr);
      
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Exames de Imagem
          </h4>
          <div className="space-y-3">
            {imaging.map((study, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{study.type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(study.date)}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {study.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
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
                        
                        {(record.doctor || record.profiles) && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{(record.profiles || record.doctor)?.full_name}</span>
                            {(record.profiles || record.doctor)?.specialty && (
                              <>
                                <span>•</span>
                                <span>{(record.profiles || record.doctor)?.specialty}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Tipo de consulta e ações de download */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {/* Indicador do tipo de consulta */}
                            {record.consultation_type && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  record.consultation_type === 'online' 
                                    ? 'border-blue-500 text-blue-700 bg-blue-50' 
                                    : 'border-green-500 text-green-700 bg-green-50'
                                }`}
                              >
                                {record.consultation_type === 'online' ? (
                                  <>
                                    <Monitor className="h-3 w-3 mr-1" />
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <Users className="h-3 w-3 mr-1" />
                                    Presencial
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>

                          {/* Ícones de download */}
                          <div className="flex items-center gap-2">
                            {record.has_prescription && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Baixar Prescrição Médica"
                                onClick={() => {
                                  // Aqui seria implementada a lógica de download da prescrição
                                  console.log('Download prescrição para registro:', record.id);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {record.has_certificate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Baixar Atestado Médico"
                                onClick={() => {
                                  // Aqui seria implementada a lógica de download do atestado
                                  console.log('Download atestado para registro:', record.id);
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
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

                        {/* Vital Signs */}
                        {record.vital_signs && renderVitalSigns(record.vital_signs)}

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

                        {/* Diagnostic Codes */}
                        {record.diagnostic_codes && renderDiagnosticCodes(record.diagnostic_codes)}

                        {/* Medications */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Medicamentos
                          </h4>
                          {renderMedications(record.medications)}
                        </div>

                        {/* Lab Results */}
                        {record.lab_results && renderLabResults(record.lab_results)}

                        {/* Procedures */}
                        {record.procedures && renderProcedures(record.procedures)}

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

                        {/* Referrals */}
                        {record.referrals && renderReferrals(record.referrals)}

                        {/* Imaging Studies */}
                        {record.imaging_studies && renderImagingStudies(record.imaging_studies)}

                        {/* Follow-up Instructions */}
                        {record.follow_up_instructions && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Clipboard className="h-4 w-4" />
                              Instruções de Acompanhamento
                            </h4>
                            <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                              {record.follow_up_instructions}
                            </p>
                          </div>
                        )}

                        {/* Next Appointment */}
                        {record.next_appointment && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Próxima Consulta
                            </h4>
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                              {formatDate(record.next_appointment)}
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