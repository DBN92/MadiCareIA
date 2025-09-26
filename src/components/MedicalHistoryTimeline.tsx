import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Pill, 
  Activity, 
  AlertCircle,
  Stethoscope,
  TestTube,
  Syringe,
  Heart,
  Filter,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MedicalEvent {
  id: string;
  date: string;
  time?: string;
  type: 'consultation' | 'procedure' | 'medication' | 'lab_result' | 'imaging' | 'vaccination' | 'hospitalization' | 'emergency' | 'other';
  title: string;
  description?: string;
  provider?: string;
  location?: string;
  outcome?: string;
  attachments?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'completed' | 'ongoing' | 'cancelled' | 'scheduled';
  related_conditions?: string[];
  medications_prescribed?: string[];
  follow_up_required?: boolean;
  follow_up_date?: string;
  notes?: string;
}

interface MedicalHistoryTimelineProps {
  events?: MedicalEvent[];
  readOnly?: boolean;
  showFilters?: boolean;
  groupByPeriod?: 'day' | 'week' | 'month' | 'year';
}

const EVENT_TYPES = [
  { value: 'consultation', label: 'Consulta', icon: Stethoscope, color: 'bg-blue-100 text-blue-800' },
  { value: 'procedure', label: 'Procedimento', icon: Activity, color: 'bg-purple-100 text-purple-800' },
  { value: 'medication', label: 'Medicação', icon: Pill, color: 'bg-green-100 text-green-800' },
  { value: 'lab_result', label: 'Exame Laboratorial', icon: TestTube, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'imaging', label: 'Exame de Imagem', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'vaccination', label: 'Vacinação', icon: Syringe, color: 'bg-teal-100 text-teal-800' },
  { value: 'hospitalization', label: 'Internação', icon: Heart, color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'Emergência', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Outro', icon: FileText, color: 'bg-gray-100 text-gray-800' }
];

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

// Sample data for demonstration
const SAMPLE_EVENTS: MedicalEvent[] = [
  {
    id: '1',
    date: '2024-01-15',
    time: '14:30',
    type: 'consultation',
    title: 'Consulta Cardiológica',
    description: 'Avaliação de rotina cardiovascular',
    provider: 'Dr. João Silva',
    location: 'Clínica CardioVida',
    outcome: 'Paciente estável, manter medicação atual',
    severity: 'low',
    status: 'completed',
    related_conditions: ['Hipertensão'],
    medications_prescribed: ['Losartana 50mg'],
    follow_up_required: true,
    follow_up_date: '2024-04-15',
    notes: 'Pressão arterial controlada. Paciente aderente ao tratamento.'
  },
  {
    id: '2',
    date: '2024-01-10',
    time: '09:00',
    type: 'lab_result',
    title: 'Exames de Rotina',
    description: 'Hemograma completo, glicemia, colesterol',
    provider: 'Lab. Diagnóstica',
    location: 'Laboratório Central',
    outcome: 'Resultados dentro da normalidade',
    severity: 'low',
    status: 'completed',
    notes: 'Todos os parâmetros normais. Manter acompanhamento.'
  },
  {
    id: '3',
    date: '2024-01-05',
    time: '16:00',
    type: 'procedure',
    title: 'Eletrocardiograma',
    description: 'ECG de repouso',
    provider: 'Dr. Maria Santos',
    location: 'Hospital São José',
    outcome: 'Ritmo sinusal normal',
    severity: 'low',
    status: 'completed',
    notes: 'ECG normal, sem alterações significativas.'
  },
  {
    id: '4',
    date: '2023-12-20',
    time: '11:30',
    type: 'vaccination',
    title: 'Vacina da Gripe',
    description: 'Vacinação anual contra influenza',
    provider: 'Enfª. Ana Costa',
    location: 'UBS Central',
    outcome: 'Vacinação realizada com sucesso',
    severity: 'low',
    status: 'completed',
    notes: 'Sem reações adversas imediatas.'
  },
  {
    id: '5',
    date: '2023-11-15',
    time: '08:00',
    type: 'emergency',
    title: 'Atendimento de Emergência',
    description: 'Dor torácica aguda',
    provider: 'Dr. Carlos Lima',
    location: 'Pronto Socorro Municipal',
    outcome: 'Descartado infarto, alta hospitalar',
    severity: 'high',
    status: 'completed',
    related_conditions: ['Ansiedade'],
    notes: 'Dor de origem não cardíaca. Orientado sobre manejo da ansiedade.'
  }
];

export const MedicalHistoryTimeline: React.FC<MedicalHistoryTimelineProps> = ({
  events = SAMPLE_EVENTS,
  readOnly = true,
  showFilters = true,
  groupByPeriod: initialGroupByPeriod = 'month'
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [groupByPeriod, setGroupByPeriod] = useState<'day' | 'week' | 'month' | 'year'>(initialGroupByPeriod);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && event.severity !== selectedSeverity) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.provider?.toLowerCase().includes(searchLower) ||
          event.outcome?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateRange.start && event.date < dateRange.start) return false;
      if (dateRange.end && event.date > dateRange.end) return false;

      return true;
    });
  }, [events, selectedTypes, selectedSeverity, searchTerm, dateRange]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: MedicalEvent[] } = {};

    filteredEvents.forEach(event => {
      let groupKey: string;
      const eventDate = new Date(event.date);

      switch (groupByPeriod) {
        case 'day':
          groupKey = event.date;
          break;
        case 'week':
          const weekStart = new Date(eventDate);
          weekStart.setDate(eventDate.getDate() - eventDate.getDay());
          groupKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          groupKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          groupKey = eventDate.getFullYear().toString();
          break;
        default:
          groupKey = event.date;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });

    // Sort groups by date (newest first)
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .reduce((acc, key) => {
        acc[key] = groups[key].sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare === 0 && a.time && b.time) {
            return b.time.localeCompare(a.time);
          }
          return dateCompare;
        });
        return acc;
      }, {} as { [key: string]: MedicalEvent[] });

    return sortedGroups;
  }, [filteredEvents, groupByPeriod]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventTypeConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  const formatGroupTitle = (groupKey: string) => {
    switch (groupByPeriod) {
      case 'day':
        return new Date(groupKey).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'week':
        const weekStart = new Date(groupKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Semana de ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}`;
      case 'month':
        const [year, month] = groupKey.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long'
        });
      case 'year':
        return groupKey;
      default:
        return groupKey;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico Médico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
                  <Select
                    value={selectedTypes.length === 1 ? selectedTypes[0] : 'all'}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedTypes([]);
                      } else {
                        setSelectedTypes([value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Severidade</label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Agrupar por</label>
                  <Select value={groupByPeriod} onValueChange={(value: any) => setGroupByPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => (
              <div key={groupKey} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-gray-900">
                    {formatGroupTitle(groupKey)}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {groupEvents.length} evento{groupEvents.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Events in Group */}
                <div className="space-y-3 ml-8">
                  {groupEvents.map((event, index) => {
                    const typeConfig = getEventTypeConfig(event.type);
                    const IconComponent = typeConfig.icon;
                    const isExpanded = expandedEvents.has(event.id);

                    return (
                      <Card key={event.id} className="relative">
                        {/* Timeline connector */}
                        {index < groupEvents.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 -z-10" />
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`p-2 rounded-full ${typeConfig.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                                    <Badge className={typeConfig.color} variant="secondary">
                                      {typeConfig.label}
                                    </Badge>
                                    {event.severity && (
                                      <Badge className={SEVERITY_COLORS[event.severity]} variant="secondary">
                                        {event.severity === 'low' && 'Baixa'}
                                        {event.severity === 'medium' && 'Média'}
                                        {event.severity === 'high' && 'Alta'}
                                        {event.severity === 'critical' && 'Crítica'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(event.date).toLocaleDateString('pt-BR')}
                                      {event.time && ` às ${event.time}`}
                                    </div>
                                    {event.provider && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {event.provider}
                                      </div>
                                    )}
                                  </div>

                                  {event.description && (
                                    <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                                  )}

                                  {event.outcome && !isExpanded && (
                                    <p className="text-sm text-gray-600 italic">
                                      Resultado: {event.outcome}
                                    </p>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleEventExpansion(event.id)}
                                  className="ml-2"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                  {event.outcome && (
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900 mb-1">Resultado:</h5>
                                      <p className="text-sm text-gray-700">{event.outcome}</p>
                                    </div>
                                  )}

                                  {event.location && (
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900 mb-1">Local:</h5>
                                      <p className="text-sm text-gray-700">{event.location}</p>
                                    </div>
                                  )}

                                  {event.related_conditions && event.related_conditions.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900 mb-1">Condições Relacionadas:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {event.related_conditions.map((condition, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {condition}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {event.medications_prescribed && event.medications_prescribed.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900 mb-1">Medicamentos Prescritos:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {event.medications_prescribed.map((med, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            <Pill className="h-3 w-3 mr-1" />
                                            {med}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {event.follow_up_required && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-sm text-blue-900">
                                          Acompanhamento Necessário
                                        </span>
                                      </div>
                                      {event.follow_up_date && (
                                        <p className="text-sm text-blue-700">
                                          Próxima consulta: {new Date(event.follow_up_date).toLocaleDateString('pt-BR')}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {event.notes && (
                                    <div>
                                      <h5 className="font-medium text-sm text-gray-900 mb-1">Observações:</h5>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                        {event.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredEvents.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo do Histórico</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total de eventos:</span>
                <p className="font-medium">{filteredEvents.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Consultas:</span>
                <p className="font-medium text-blue-600">
                  {filteredEvents.filter(e => e.type === 'consultation').length}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Exames:</span>
                <p className="font-medium text-yellow-600">
                  {filteredEvents.filter(e => ['lab_result', 'imaging'].includes(e.type)).length}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Emergências:</span>
                <p className="font-medium text-red-600">
                  {filteredEvents.filter(e => e.type === 'emergency').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalHistoryTimeline;