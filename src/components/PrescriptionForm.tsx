import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { memedApi, MemedMedication, MemedPrescriptionItem } from "@/services/memedApi";
import { supabase } from "@/integrations/supabase/client";
import MedicationSearch from "./MedicationSearch";
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Share2, 
  Save, 
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface PrescriptionFormProps {
  patientId: string;
  medicalRecordId?: string;
  onSave?: (prescriptionId: string) => void;
  onCancel?: () => void;
}

interface PrescriptionItem extends MemedPrescriptionItem {
  id: string;
  searchQuery?: string;
  selectedMedication?: MemedMedication;
}

interface PrescriptionData {
  id?: string;
  prescription_date: string;
  notes: string;
  status: 'draft' | 'active' | 'dispensed' | 'cancelled';
  items: PrescriptionItem[];
  memed_prescription_id?: string;
  memed_url?: string;
  memed_status?: string;
}

export default function PrescriptionForm({ 
  patientId, 
  medicalRecordId, 
  onSave, 
  onCancel 
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchingMeds, setSearchingMeds] = useState<string[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  
  const [prescription, setPrescription] = useState<PrescriptionData>({
    prescription_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'draft',
    items: []
  });

  // Carregar dados do paciente e médico
  useEffect(() => {
    loadPatientData();
    loadDoctorData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do paciente",
        variant: "destructive"
      });
    }
  };

  const loadDoctorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error('Erro ao carregar dados do médico:', error);
    }
  };

  // Adicionar novo item à prescrição
  const addPrescriptionItem = () => {
    const newItem: PrescriptionItem = {
      id: `item-${Date.now()}`,
      medicationId: '',
      medicationName: '',
      dosage: '',
      form: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: '',
      genericSubstitution: true,
      urgent: false
    };

    setPrescription(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Adicionar medicamento selecionado da busca
  const addMedicationFromSearch = (medication: MemedMedication) => {
    const newItem: PrescriptionItem = {
      id: `item-${Date.now()}`,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.concentration || '',
      form: medication.form || '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: '',
      genericSubstitution: medication.genericAvailable || true,
      urgent: false,
      selectedMedication: medication
    };

    setPrescription(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Remover item da prescrição
  const removePrescriptionItem = (itemId: string) => {
    setPrescription(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Atualizar item da prescrição
  const updatePrescriptionItem = (itemId: string, updates: Partial<PrescriptionItem>) => {
    setPrescription(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  // Buscar medicamentos no Memed
  const searchMedications = async (itemId: string, query: string) => {
    if (query.length < 3) return;

    setSearchingMeds(prev => [...prev, itemId]);
    
    try {
      const response = await memedApi.searchMedications(query, 10);
      
      if (response.success && response.data) {
        // Aqui você pode implementar um dropdown com os resultados
        // Por simplicidade, vamos apenas mostrar no console
        console.log('Medicamentos encontrados:', response.data);
        
        // Atualizar o item com os resultados da busca
        updatePrescriptionItem(itemId, { 
          searchQuery: query,
          // selectedMedication: response.data[0] // Selecionar o primeiro resultado
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhum medicamento encontrado",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro na busca de medicamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar medicamentos no Memed",
        variant: "destructive"
      });
    } finally {
      setSearchingMeds(prev => prev.filter(id => id !== itemId));
    }
  };

  // Salvar prescrição localmente
  const savePrescription = async (status: 'draft' | 'active' = 'draft') => {
    if (!patient || prescription.items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um medicamento à prescrição",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const prescriptionData = {
        patient_id: patientId,
        medical_record_id: medicalRecordId,
        prescription_date: prescription.prescription_date,
        status,
        notes: prescription.notes,
        total_items: prescription.items.length
      };

      const { data: savedPrescription, error: prescriptionError } = await supabase
        .from('medical_prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Salvar itens da prescrição
      const itemsData = prescription.items.map(item => ({
        prescription_id: savedPrescription.id,
        medication_name: item.medicationName,
        dosage: item.dosage,
        form: item.form,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        generic_substitution: item.genericSubstitution,
        urgent: item.urgent,
        memed_medication_id: item.medicationId
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Sucesso",
        description: `Prescrição ${status === 'draft' ? 'salva como rascunho' : 'criada'} com sucesso`,
        variant: "default"
      });

      if (onSave) {
        onSave(savedPrescription.id);
      }

      // Atualizar estado com ID da prescrição salva
      setPrescription(prev => ({ ...prev, id: savedPrescription.id }));

    } catch (error) {
      console.error('Erro ao salvar prescrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar prescrição",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Enviar para o Memed
  const sendToMemed = async () => {
    if (!patient || !doctor || prescription.items.length === 0) {
      toast({
        title: "Erro",
        description: "Dados incompletos para envio ao Memed",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Primeiro salvar localmente se ainda não foi salvo
      if (!prescription.id) {
        await savePrescription('active');
      }

      // Preparar dados para o Memed
      const memedPrescription = {
        patientName: patient.full_name,
        patientCpf: patient.cpf,
        patientBirthDate: patient.birth_date,
        patientGender: patient.gender,
        doctorName: doctor.full_name,
        doctorCrm: doctor.crm || 'CRM123456', // Valor padrão para teste
        doctorCrmState: doctor.crm_state || 'SP',
        items: prescription.items,
        notes: prescription.notes
      };

      const response = await memedApi.createPrescription(memedPrescription);

      if (response.success && response.data) {
        // Atualizar prescrição com dados do Memed
        const { error } = await supabase
          .from('medical_prescriptions')
          .update({
            memed_prescription_id: response.data.id,
            memed_url: response.data.url,
            memed_status: response.data.status,
            memed_created_at: response.data.createdAt,
            status: 'active'
          })
          .eq('id', prescription.id);

        if (error) throw error;

        setPrescription(prev => ({
          ...prev,
          memed_prescription_id: response.data!.id,
          memed_url: response.data!.url,
          memed_status: response.data!.status,
          status: 'active'
        }));

        toast({
          title: "Sucesso",
          description: "Prescrição enviada para o Memed com sucesso",
          variant: "default"
        });
      } else {
        throw new Error(response.error?.message || 'Erro ao enviar para Memed');
      }
    } catch (error) {
      console.error('Erro ao enviar para Memed:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar prescrição para o Memed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'dispensed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'dispensed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nova Prescrição Médica
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(prescription.status)} flex items-center gap-1`}>
                {getStatusIcon(prescription.status)}
                {prescription.status === 'draft' ? 'Rascunho' : 
                 prescription.status === 'active' ? 'Ativa' :
                 prescription.status === 'dispensed' ? 'Dispensada' : 'Cancelada'}
              </Badge>
              {prescription.memed_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(prescription.memed_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver no Memed
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient">Paciente</Label>
              <Input
                id="patient"
                value={patient?.full_name || 'Carregando...'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="date">Data da Prescrição</Label>
              <Input
                id="date"
                type="date"
                value={prescription.prescription_date}
                onChange={(e) => setPrescription(prev => ({ 
                  ...prev, 
                  prescription_date: e.target.value 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medicamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medicamentos Prescritos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addPrescriptionItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Medicamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca de Medicamentos */}
          <div className="mb-6">
            <MedicationSearch 
              onSelect={addMedicationFromSearch}
              placeholder="Busque medicamentos na base do Memed..."
            />
          </div>

          <div className="space-y-4">
            {prescription.items.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Medicamento {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrescriptionItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2 lg:col-span-1">
                      <Label>Nome do Medicamento</Label>
                      <Input
                        value={item.medicationName}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          medicationName: e.target.value 
                        })}
                        placeholder="Digite o nome do medicamento"
                        disabled={!!item.selectedMedication}
                      />
                      {item.selectedMedication && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <p className="text-green-800 font-medium">
                            Medicamento do Memed selecionado
                          </p>
                          {item.selectedMedication.activeIngredient && (
                            <p className="text-green-600">
                              {item.selectedMedication.activeIngredient}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Dosagem</Label>
                      <Input
                        value={item.dosage}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          dosage: e.target.value 
                        })}
                        placeholder="Ex: 500mg"
                      />
                    </div>

                    <div>
                      <Label>Forma Farmacêutica</Label>
                      <Select
                        value={item.form}
                        onValueChange={(value) => updatePrescriptionItem(item.id, { 
                          form: value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comprimido">Comprimido</SelectItem>
                          <SelectItem value="capsula">Cápsula</SelectItem>
                          <SelectItem value="xarope">Xarope</SelectItem>
                          <SelectItem value="solucao">Solução</SelectItem>
                          <SelectItem value="pomada">Pomada</SelectItem>
                          <SelectItem value="creme">Creme</SelectItem>
                          <SelectItem value="gotas">Gotas</SelectItem>
                          <SelectItem value="spray">Spray</SelectItem>
                          <SelectItem value="injecao">Injeção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Frequência</Label>
                      <Input
                        value={item.frequency}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          frequency: e.target.value 
                        })}
                        placeholder="Ex: 8/8h, 2x ao dia"
                      />
                    </div>

                    <div>
                      <Label>Duração</Label>
                      <Input
                        value={item.duration}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          duration: e.target.value 
                        })}
                        placeholder="Ex: 7 dias, uso contínuo"
                      />
                    </div>

                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        value={item.quantity}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          quantity: e.target.value 
                        })}
                        placeholder="Ex: 30 comprimidos"
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <Label>Instruções de Uso</Label>
                      <Textarea
                        value={item.instructions}
                        onChange={(e) => updatePrescriptionItem(item.id, { 
                          instructions: e.target.value 
                        })}
                        placeholder="Instruções específicas para o paciente"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`generic-${item.id}`}
                          checked={item.genericSubstitution}
                          onCheckedChange={(checked) => updatePrescriptionItem(item.id, { 
                            genericSubstitution: checked as boolean 
                          })}
                        />
                        <Label htmlFor={`generic-${item.id}`}>
                          Aceita medicamento genérico
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`urgent-${item.id}`}
                          checked={item.urgent}
                          onCheckedChange={(checked) => updatePrescriptionItem(item.id, { 
                            urgent: checked as boolean 
                          })}
                        />
                        <Label htmlFor={`urgent-${item.id}`}>
                          Urgente
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {prescription.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum medicamento adicionado</p>
                <p className="text-sm">Use a busca acima ou clique em "Adicionar Medicamento" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={prescription.notes}
            onChange={(e) => setPrescription(prev => ({ 
              ...prev, 
              notes: e.target.value 
            }))}
            placeholder="Observações adicionais, orientações especiais, etc."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => savePrescription('draft')}
            disabled={loading || prescription.items.length === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar Rascunho
          </Button>

          <Button
            onClick={() => savePrescription('active')}
            disabled={loading || prescription.items.length === 0}
          >
            <FileText className="h-4 w-4 mr-1" />
            Criar Prescrição
          </Button>

          <Button
            onClick={sendToMemed}
            disabled={loading || prescription.items.length === 0 || !patient || !doctor}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-1" />
            Enviar para Memed
          </Button>
        </div>
      </div>
    </div>
  );
}