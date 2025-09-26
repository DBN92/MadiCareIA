import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Info,
  Timer,
  Zap
} from 'lucide-react';

interface Medication {
  id?: string;
  name: string;
  active_ingredient?: string;
  dosage: string;
  unit: string;
  frequency: string;
  route: string;
  start_date: string;
  end_date?: string;
  duration_days?: number;
  instructions: string;
  prescriber?: string;
  indication?: string;
  is_controlled?: boolean;
  is_continuous?: boolean;
  schedule?: MedicationSchedule[];
  interactions?: string[];
  side_effects?: string[];
  notes?: string;
  status: 'active' | 'completed' | 'discontinued' | 'suspended';
}

interface MedicationSchedule {
  time: string;
  dose: string;
  taken?: boolean;
  taken_at?: string;
}

interface MedicationManagerProps {
  initialMedications?: Medication[];
  onMedicationsChange: (medications: Medication[]) => void;
  readOnly?: boolean;
  showSchedule?: boolean;
}

const MEDICATION_UNITS = [
  'mg', 'g', 'mcg', 'ml', 'L', 'UI', 'comprimido(s)', 'cápsula(s)', 
  'gota(s)', 'colher(es)', 'ampola(s)', 'frasco(s)', 'aplicação(ões)'
];

const FREQUENCY_OPTIONS = [
  { value: '1x/dia', label: '1x ao dia', times: ['08:00'] },
  { value: '2x/dia', label: '2x ao dia (12/12h)', times: ['08:00', '20:00'] },
  { value: '3x/dia', label: '3x ao dia (8/8h)', times: ['08:00', '16:00', '00:00'] },
  { value: '4x/dia', label: '4x ao dia (6/6h)', times: ['06:00', '12:00', '18:00', '00:00'] },
  { value: '6x/dia', label: '6x ao dia (4/4h)', times: ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'] },
  { value: 'SOS', label: 'Se necessário (SOS)', times: [] },
  { value: 'custom', label: 'Personalizado', times: [] }
];

const ROUTE_OPTIONS = [
  'Oral', 'Sublingual', 'Intramuscular', 'Intravenosa', 'Subcutânea',
  'Tópica', 'Oftálmica', 'Otológica', 'Nasal', 'Retal', 'Vaginal', 'Inalatória'
];

const COMMON_MEDICATIONS = [
  { name: 'Paracetamol', ingredient: 'Paracetamol', defaultDose: '500', unit: 'mg' },
  { name: 'Ibuprofeno', ingredient: 'Ibuprofeno', defaultDose: '400', unit: 'mg' },
  { name: 'Dipirona', ingredient: 'Dipirona sódica', defaultDose: '500', unit: 'mg' },
  { name: 'Omeprazol', ingredient: 'Omeprazol', defaultDose: '20', unit: 'mg' },
  { name: 'Losartana', ingredient: 'Losartana potássica', defaultDose: '50', unit: 'mg' },
  { name: 'Metformina', ingredient: 'Metformina', defaultDose: '850', unit: 'mg' },
  { name: 'Sinvastatina', ingredient: 'Sinvastatina', defaultDose: '20', unit: 'mg' },
  { name: 'Captopril', ingredient: 'Captopril', defaultDose: '25', unit: 'mg' },
  { name: 'Hidroclorotiazida', ingredient: 'Hidroclorotiazida', defaultDose: '25', unit: 'mg' },
  { name: 'Atenolol', ingredient: 'Atenolol', defaultDose: '50', unit: 'mg' }
];

export const MedicationManager: React.FC<MedicationManagerProps> = ({
  initialMedications = [],
  onMedicationsChange,
  readOnly = false,
  showSchedule = true
}) => {
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCommonMeds, setShowCommonMeds] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  useEffect(() => {
    onMedicationsChange(medications);
  }, [medications, onMedicationsChange]);

  const addMedication = (template?: Partial<Medication>) => {
    const newMedication: Medication = {
      id: Date.now().toString(),
      name: template?.name || '',
      active_ingredient: template?.active_ingredient || '',
      dosage: template?.dosage || '',
      unit: template?.unit || 'mg',
      frequency: '1x/dia',
      route: 'Oral',
      start_date: new Date().toISOString().split('T')[0],
      instructions: '',
      is_controlled: false,
      is_continuous: false,
      status: 'active',
      schedule: [],
      interactions: [],
      side_effects: [],
      ...template
    };

    setMedications(prev => [...prev, newMedication]);
    setSelectedMedication(newMedication);
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    setMedications(prev => {
      const updated = prev.map((med, i) => {
        if (i === index) {
          const updatedMed = { ...med, [field]: value };
          
          // Auto-generate schedule when frequency changes
          if (field === 'frequency') {
            const freqOption = FREQUENCY_OPTIONS.find(f => f.value === value);
            if (freqOption && freqOption.times.length > 0) {
              updatedMed.schedule = freqOption.times.map(time => ({
                time,
                dose: updatedMed.dosage,
                taken: false
              }));
            }
          }
          
          // Calculate end date when duration changes
          if (field === 'duration_days' && value && updatedMed.start_date) {
            const startDate = new Date(updatedMed.start_date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(value));
            updatedMed.end_date = endDate.toISOString().split('T')[0];
          }
          
          return updatedMed;
        }
        return med;
      });
      
      // Update selected medication if it's the one being edited
      if (selectedMedication && selectedMedication.id === prev[index].id) {
        setSelectedMedication(updated[index]);
      }
      
      return updated;
    });
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
    setSelectedMedication(null);
  };

  const addCommonMedication = (commonMed: typeof COMMON_MEDICATIONS[0]) => {
    addMedication({
      name: commonMed.name,
      active_ingredient: commonMed.ingredient,
      dosage: commonMed.defaultDose,
      unit: commonMed.unit
    });
    setShowCommonMeds(false);
  };

  const getStatusColor = (status: Medication['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Medication['status']) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'discontinued': return XCircle;
      case 'suspended': return Timer;
      default: return Info;
    }
  };

  const checkInteractions = (medications: Medication[]): string[] => {
    // Simplified interaction checking - in real app, this would use a drug interaction database
    const interactions: string[] = [];
    const activeIngredients = medications
      .filter(med => med.status === 'active')
      .map(med => med.active_ingredient?.toLowerCase())
      .filter(Boolean);

    // Example interactions
    if (activeIngredients.includes('varfarina') && activeIngredients.includes('aspirina')) {
      interactions.push('Varfarina + Aspirina: Risco aumentado de sangramento');
    }
    
    if (activeIngredients.includes('digoxina') && activeIngredients.includes('furosemida')) {
      interactions.push('Digoxina + Furosemida: Risco de toxicidade da digoxina');
    }

    return interactions;
  };

  const filteredCommonMeds = COMMON_MEDICATIONS.filter(med =>
    searchTerm === '' || 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const interactions = checkInteractions(medications);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medicamentos
          {!readOnly && (
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCommonMeds(!showCommonMeds)}
              >
                <Search className="h-4 w-4 mr-1" />
                Medicamentos Comuns
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addMedication()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactions Alert */}
        {interactions.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">
                    Possíveis Interações Medicamentosas
                  </h4>
                  <ul className="space-y-1 text-sm text-orange-700">
                    {interactions.map((interaction, index) => (
                      <li key={index}>• {interaction}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common Medications Panel */}
        {showCommonMeds && !readOnly && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Buscar medicamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
              <div className="grid gap-2">
                {filteredCommonMeds.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => addCommonMedication(med)}
                  >
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-600">
                        {med.ingredient} - {med.defaultDose}{med.unit}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medications List */}
        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum medicamento prescrito</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((medication, index) => {
              const StatusIcon = getStatusIcon(medication.status);
              
              return (
                <Card key={medication.id || index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Basic Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nome do Medicamento</Label>
                            <Input
                              placeholder="Ex: Paracetamol"
                              value={medication.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                          
                          <div>
                            <Label>Princípio Ativo</Label>
                            <Input
                              placeholder="Ex: Paracetamol"
                              value={medication.active_ingredient || ''}
                              onChange={(e) => updateMedication(index, 'active_ingredient', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Dosagem</Label>
                            <Input
                              placeholder="500"
                              value={medication.dosage}
                              onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                          
                          <div>
                            <Label>Unidade</Label>
                            <Select
                              value={medication.unit}
                              onValueChange={(value) => updateMedication(index, 'unit', value)}
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MEDICATION_UNITS.map(unit => (
                                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Frequência</Label>
                            <Select
                              value={medication.frequency}
                              onValueChange={(value) => updateMedication(index, 'frequency', value)}
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FREQUENCY_OPTIONS.map(freq => (
                                  <SelectItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Via</Label>
                            <Select
                              value={medication.route}
                              onValueChange={(value) => updateMedication(index, 'route', value)}
                              disabled={readOnly}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROUTE_OPTIONS.map(route => (
                                  <SelectItem key={route} value={route}>{route}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Data de Início</Label>
                            <Input
                              type="date"
                              value={medication.start_date}
                              onChange={(e) => updateMedication(index, 'start_date', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                          
                          <div>
                            <Label>Duração (dias)</Label>
                            <Input
                              type="number"
                              placeholder="7"
                              value={medication.duration_days || ''}
                              onChange={(e) => updateMedication(index, 'duration_days', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                          
                          <div>
                            <Label>Data de Término</Label>
                            <Input
                              type="date"
                              value={medication.end_date || ''}
                              onChange={(e) => updateMedication(index, 'end_date', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Instruções de Uso</Label>
                          <Textarea
                            placeholder="Tomar com água, após as refeições..."
                            value={medication.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            disabled={readOnly}
                            className="min-h-[80px]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Indicação</Label>
                            <Input
                              placeholder="Ex: Dor de cabeça"
                              value={medication.indication || ''}
                              onChange={(e) => updateMedication(index, 'indication', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                          
                          <div>
                            <Label>Prescritor</Label>
                            <Input
                              placeholder="Dr. João Silva"
                              value={medication.prescriber || ''}
                              onChange={(e) => updateMedication(index, 'prescriber', e.target.value)}
                              disabled={readOnly}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={medication.is_controlled || false}
                              onChange={(e) => updateMedication(index, 'is_controlled', e.target.checked)}
                              disabled={readOnly}
                            />
                            <span className="text-sm">Medicamento Controlado</span>
                          </label>
                          
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={medication.is_continuous || false}
                              onChange={(e) => updateMedication(index, 'is_continuous', e.target.checked)}
                              disabled={readOnly}
                            />
                            <span className="text-sm">Uso Contínuo</span>
                          </label>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="space-y-4">
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={medication.status}
                            onValueChange={(value: Medication['status']) => updateMedication(index, 'status', value)}
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="discontinued">Descontinuado</SelectItem>
                              <SelectItem value="suspended">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={getStatusColor(medication.status)}>
                            {medication.status === 'active' && 'Ativo'}
                            {medication.status === 'completed' && 'Concluído'}
                            {medication.status === 'discontinued' && 'Descontinuado'}
                            {medication.status === 'suspended' && 'Suspenso'}
                          </Badge>
                        </div>

                        {medication.is_controlled && (
                          <Badge variant="destructive" className="w-fit">
                            <Zap className="h-3 w-3 mr-1" />
                            Controlado
                          </Badge>
                        )}

                        {!readOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMedication(index)}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Schedule */}
                    {showSchedule && medication.schedule && medication.schedule.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horários de Administração
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {medication.schedule.map((schedule, scheduleIndex) => (
                            <div
                              key={scheduleIndex}
                              className={`p-3 rounded-lg border text-center ${
                                schedule.taken 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="font-medium">{schedule.time}</div>
                              <div className="text-sm text-gray-600">
                                {schedule.dose} {medication.unit}
                              </div>
                              {schedule.taken && schedule.taken_at && (
                                <div className="text-xs text-green-600 mt-1">
                                  ✓ {new Date(schedule.taken_at).toLocaleTimeString('pt-BR')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {medications.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumo da Medicação
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total:</span>
                <p className="font-medium">{medications.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Ativos:</span>
                <p className="font-medium text-green-600">
                  {medications.filter(m => m.status === 'active').length}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Controlados:</span>
                <p className="font-medium text-red-600">
                  {medications.filter(m => m.is_controlled).length}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Uso Contínuo:</span>
                <p className="font-medium text-blue-600">
                  {medications.filter(m => m.is_continuous).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationManager;