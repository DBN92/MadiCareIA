import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, FileText, User, Stethoscope, Pill, AlertTriangle, Users, History, Eye, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import PrescriptionForm from './PrescriptionForm';

type MedicalRecord = Database['public']['Tables']['medical_records']['Insert'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MedicalRecordFormProps {
  patientId?: string;
  recordId?: string;
  onSave?: (recordId: string) => void;
  onCancel?: () => void;
}

interface Diagnosis {
  id?: string;
  diagnosis_text: string;
  diagnosis_code?: string;
  primary_diagnosis: boolean;
}

interface Exam {
  id?: string;
  exam_type: string;
  exam_date?: Date;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  result?: string;
  notes?: string;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  patientId,
  recordId,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [recordDoctor, setRecordDoctor] = useState<Profile | null>(null);
  const [recordDate, setRecordDate] = useState<Date>(new Date());
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  // Dados do prontuário
  const [formData, setFormData] = useState<MedicalRecord>({
    patient_id: patientId || '',
    doctor_id: '',
    record_date: new Date().toISOString().split('T')[0], // Formato DATE
    chief_complaint: '',
    history_present_illness: '',
    past_medical_history: '',
    medications: '',
    allergies: '',
    social_history: '',
    family_history: '',
    review_systems: '',
    physical_examination: '',
    assessment_plan: '',
    notes: '',
    status: 'draft'
  });

  // Diagnósticos
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([
    { diagnosis_text: '', diagnosis_code: '', primary_diagnosis: true }
  ]);

  // Exames
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [recordId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Carregar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError);
          toast({
            title: "Erro",
            description: "Erro ao carregar perfil do usuário",
            variant: "destructive"
          });
        } else if (profile) {
          setCurrentUser(profile);
          setRecordDoctor(profile); // Para novos registros, o médico é o usuário atual
          setFormData(prev => ({ ...prev, doctor_id: profile.id }));
        }
      }

      // Carregar pacientes
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');
      
      if (patientsData) {
        setPatients(patientsData);
      }

      // Carregar médicos disponíveis
      const { data: doctorsData } = await supabase
        .from('profiles')
        .select('*')
        .not('full_name', 'is', null)
        .order('full_name');
      
      if (doctorsData) {
        setDoctors(doctorsData);
      }

      // Se editando, carregar dados do prontuário
      if (recordId) {
        await loadMedicalRecord(recordId);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados iniciais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalRecord = async (id: string) => {
    try {
      const { data: record } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:profiles!medical_records_doctor_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (record) {
        setFormData(record);
        setRecordDate(new Date(record.record_date));
        
        // Definir o médico do registro (quem criou)
        if (record.doctor) {
          setRecordDoctor(record.doctor);
        }
      }

      // Carregar diagnósticos
      const { data: diagnosesData } = await supabase
        .from('medical_diagnoses')
        .select('*')
        .eq('medical_record_id', id);

      if (diagnosesData && diagnosesData.length > 0) {
        setDiagnoses(diagnosesData);
      }

      // Carregar exames
      const { data: examsData } = await supabase
        .from('medical_exams')
        .select('*')
        .eq('medical_record_id', id);

      if (examsData) {
        setExams(examsData.map(exam => ({
          ...exam,
          exam_date: exam.exam_date ? new Date(exam.exam_date) : undefined,
          status: exam.status as 'requested' | 'scheduled' | 'completed' | 'cancelled'
        })));
      }

    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prontuário médico",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof MedicalRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setRecordDate(date);
      setFormData(prev => ({
        ...prev,
        record_date: date.toISOString()
      }));
    }
  };

  const addDiagnosis = () => {
    setDiagnoses(prev => [
      ...prev,
      { diagnosis_text: '', diagnosis_code: '', primary_diagnosis: false }
    ]);
  };

  const removeDiagnosis = (index: number) => {
    if (diagnoses.length > 1) {
      setDiagnoses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateDiagnosis = (index: number, field: keyof Diagnosis, value: string | boolean) => {
    setDiagnoses(prev => prev.map((diagnosis, i) => 
      i === index ? { ...diagnosis, [field]: value } : diagnosis
    ));
  };

  const addExam = () => {
    setExams(prev => [
      ...prev,
      {
        exam_type: '',
        status: 'requested',
        notes: ''
      }
    ]);
  };

  const removeExam = (index: number) => {
    setExams(prev => prev.filter((_, i) => i !== index));
  };

  const updateExam = (index: number, field: keyof Exam, value: any) => {
    setExams(prev => prev.map((exam, i) => 
      i === index ? { ...exam, [field]: value } : exam
    ));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.patient_id || !formData.doctor_id) {
        toast({
          title: "Erro",
          description: "Paciente e médico são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      let savedRecordId = recordId;

      // Salvar prontuário
      if (recordId) {
        // Atualizar
        const { error } = await supabase
          .from('medical_records')
          .update(formData)
          .eq('id', recordId);

        if (error) throw error;
      } else {
        // Criar novo
        const { data: newRecord, error } = await supabase
          .from('medical_records')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        savedRecordId = newRecord.id;
      }

      // Salvar diagnósticos
      if (savedRecordId) {
        // Remover diagnósticos existentes
        await supabase
          .from('medical_diagnoses')
          .delete()
          .eq('medical_record_id', savedRecordId);

        // Inserir novos diagnósticos
        const diagnosesToInsert = diagnoses
          .filter(d => d.diagnosis_text.trim())
          .map(d => ({
            medical_record_id: savedRecordId,
            diagnosis_text: d.diagnosis_text,
            diagnosis_code: d.diagnosis_code || null,
            primary_diagnosis: d.primary_diagnosis
          }));

        if (diagnosesToInsert.length > 0) {
          const { error } = await supabase
            .from('medical_diagnoses')
            .insert(diagnosesToInsert);

          if (error) throw error;
        }

        // Salvar exames
        await supabase
          .from('medical_exams')
          .delete()
          .eq('medical_record_id', savedRecordId);

        const examsToInsert = exams
          .filter(e => e.exam_type.trim())
          .map(e => ({
            medical_record_id: savedRecordId,
            exam_type: e.exam_type,
            exam_date: e.exam_date?.toISOString() || null,
            status: e.status,
            result: e.result || null,
            notes: e.notes || null
          }));

        if (examsToInsert.length > 0) {
          const { error } = await supabase
            .from('medical_exams')
            .insert(examsToInsert);

          if (error) throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: "Prontuário médico salvo com sucesso",
      });

      if (onSave && savedRecordId) {
        onSave(savedRecordId);
      }

    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar prontuário médico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !recordId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {recordId ? 'Editar Prontuário Médico' : 'Novo Prontuário Médico'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="patient">Paciente *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => handleInputChange('patient_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doctor">Médico Responsável</Label>
            {recordDoctor?.full_name ? (
              <Input
                value={`Dr(a). ${recordDoctor.full_name}`}
                disabled
                className="bg-gray-50"
              />
            ) : loading ? (
              <Input
                value="Carregando..."
                disabled
                className="bg-gray-50"
              />
            ) : (
              <Select
                value={formData.doctor_id}
                onValueChange={(value) => {
                  const selectedDoctor = doctors.find(d => d.id === value);
                  if (selectedDoctor) {
                    setRecordDoctor(selectedDoctor);
                    setFormData(prev => ({ ...prev, doctor_id: value }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr(a). {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Data do Atendimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {recordDate ? format(recordDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={recordDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
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
          <div>
            <Label htmlFor="chief_complaint">Queixa Principal</Label>
            <Textarea
              id="chief_complaint"
              value={formData.chief_complaint || ''}
              onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
              placeholder="Descreva a queixa principal do paciente..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="history_present_illness">História da Doença Atual</Label>
            <Textarea
              id="history_present_illness"
              value={formData.history_present_illness || ''}
              onChange={(e) => handleInputChange('history_present_illness', e.target.value)}
              placeholder="Descreva a evolução da doença atual..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="past_medical_history">Antecedentes Pessoais</Label>
              <Textarea
                id="past_medical_history"
                value={formData.past_medical_history || ''}
                onChange={(e) => handleInputChange('past_medical_history', e.target.value)}
                placeholder="Doenças anteriores, cirurgias, internações..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="family_history">Antecedentes Familiares</Label>
              <Textarea
                id="family_history"
                value={formData.family_history || ''}
                onChange={(e) => handleInputChange('family_history', e.target.value)}
                placeholder="Histórico familiar de doenças..."
                rows={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medications">Medicações em Uso</Label>
              <Textarea
                id="medications"
                value={formData.medications || ''}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                placeholder="Liste as medicações atuais..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                value={formData.allergies || ''}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="Alergias conhecidas..."
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="social_history">História Social</Label>
            <Textarea
              id="social_history"
              value={formData.social_history || ''}
              onChange={(e) => handleInputChange('social_history', e.target.value)}
              placeholder="Tabagismo, etilismo, atividade física, profissão..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="review_systems">Revisão de Sistemas</Label>
            <Textarea
              id="review_systems"
              value={formData.review_systems || ''}
              onChange={(e) => handleInputChange('review_systems', e.target.value)}
              placeholder="Revisão por sistemas..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exame Físico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Exame Físico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="physical_examination">Achados do Exame Físico</Label>
            <Textarea
              id="physical_examination"
              value={formData.physical_examination || ''}
              onChange={(e) => handleInputChange('physical_examination', e.target.value)}
              placeholder="Descreva os achados do exame físico..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Diagnósticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnoses.map((diagnosis, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-2">
                <Label>Diagnóstico</Label>
                <Input
                  value={diagnosis.diagnosis_text}
                  onChange={(e) => updateDiagnosis(index, 'diagnosis_text', e.target.value)}
                  placeholder="Descrição do diagnóstico"
                />
              </div>
              <div>
                <Label>Código CID</Label>
                <Input
                  value={diagnosis.diagnosis_code || ''}
                  onChange={(e) => updateDiagnosis(index, 'diagnosis_code', e.target.value)}
                  placeholder="Ex: F32.9"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`primary-${index}`}
                    checked={diagnosis.primary_diagnosis}
                    onChange={(e) => updateDiagnosis(index, 'primary_diagnosis', e.target.checked)}
                  />
                  <Label htmlFor={`primary-${index}`}>Principal</Label>
                </div>
                {diagnoses.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDiagnosis(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addDiagnosis}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Diagnóstico
          </Button>
        </CardContent>
      </Card>

      {/* Exames Solicitados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Exames Solicitados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exams.map((exam, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Tipo de Exame</Label>
                <Input
                  value={exam.exam_type}
                  onChange={(e) => updateExam(index, 'exam_type', e.target.value)}
                  placeholder="Ex: Hemograma completo"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={exam.status}
                  onValueChange={(value) => updateExam(index, 'status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Solicitado</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="completed">Realizado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data do Exame</Label>
                <Input
                  type="date"
                  value={exam.exam_date ? format(exam.exam_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => updateExam(index, 'exam_date', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Resultado</Label>
                <Input
                  value={exam.result || ''}
                  onChange={(e) => updateExam(index, 'result', e.target.value)}
                  placeholder="Resultado do exame"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeExam(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addExam}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Exame
          </Button>
        </CardContent>
      </Card>

      {/* Conduta e Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Avaliação e Plano Terapêutico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assessment_plan">Conduta e Plano</Label>
            <Textarea
              id="assessment_plan"
              value={formData.assessment_plan || ''}
              onChange={(e) => handleInputChange('assessment_plan', e.target.value)}
              placeholder="Descreva a conduta e plano terapêutico..."
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações Adicionais</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações gerais..."
              rows={3}
            />
          </div>

          {/* Botão para abrir prescrição */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              onClick={() => setShowPrescriptionForm(true)}
              className="w-full"
            >
              <Pill className="h-4 w-4 mr-2" />
              Criar Prescrição Médica
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Prontuário'}
        </Button>
      </div>

      {/* Modal de Prescrição */}
      {showPrescriptionForm && recordId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <PrescriptionForm
                medicalRecordId={recordId}
                patientId={formData.patient_id}
                onSave={() => {
                  setShowPrescriptionForm(false);
                  toast({
                    title: "Sucesso",
                    description: "Prescrição criada com sucesso",
                  });
                }}
                onCancel={() => setShowPrescriptionForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordForm;