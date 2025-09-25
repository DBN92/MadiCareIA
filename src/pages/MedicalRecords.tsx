import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Plus, 
  History, 
  Users, 
  BarChart3,
  Search,
  Calendar as CalendarIcon,
  User,
  Filter,
  TrendingUp,
  Clock,
  Activity,
  Stethoscope,
  Eye,
  Edit,
  Download,
  Share,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import MedicalRecordForm from '@/components/MedicalRecordForm';
import MedicalRecordHistory from '@/components/MedicalRecordHistory';
import MedicalRecordView from '@/components/MedicalRecordView';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'dashboard' | 'new' | 'edit' | 'view' | 'history';
type SortField = 'date' | 'patient' | 'doctor' | 'status';
type SortOrder = 'asc' | 'desc';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MedicalRecordWithRelations extends MedicalRecord {
  patient: Patient;
  doctor: Profile;
}

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const MedicalRecords: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPatient, setFilterPatient] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Data states
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<MedicalRecordWithRelations[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecordWithRelations[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);

  // Dados de estatísticas (em uma implementação real, viriam da API)
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Prontuários Hoje',
      value: 12,
      change: '+2 desde ontem',
      trend: 'up',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Pacientes Ativos',
      value: 248,
      change: '+12% este mês',
      trend: 'up',
      icon: <Users className="h-5 w-5" />,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Prescrições Enviadas',
      value: 89,
      change: '+5 hoje',
      trend: 'up',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Consultas Agendadas',
      value: 24,
      change: 'Para esta semana',
      trend: 'neutral',
      icon: <CalendarIcon className="h-5 w-5" />,
      color: 'from-orange-500 to-orange-600'
    }
  ]);

  // Load data on component mount
  useEffect(() => {
    loadRecords();
    loadPatients();
    loadDoctors();
  }, []);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [records, searchTerm, filterStatus, filterPatient, filterDoctor, dateFrom, dateTo, sortField, sortOrder]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(*),
          doctor:profiles(*)
        `)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      updateStats(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar prontuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .order('full_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const updateStats = (recordsData: MedicalRecordWithRelations[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = recordsData.filter(record => {
      const recordDate = new Date(record.record_date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    const activePatients = new Set(recordsData.map(record => record.patient_id)).size;
    const completedRecords = recordsData.filter(record => record.status === 'completed').length;
    const pendingRecords = recordsData.filter(record => record.status === 'draft').length;

    setStats([
      {
        title: 'Prontuários Hoje',
        value: todayRecords.length,
        change: `+${todayRecords.length} hoje`,
        trend: 'up',
        icon: <FileText className="h-5 w-5" />,
        color: 'from-blue-500 to-blue-600'
      },
      {
        title: 'Pacientes Ativos',
        value: activePatients,
        change: `${activePatients} únicos`,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'from-green-500 to-green-600'
      },
      {
        title: 'Concluídos',
        value: completedRecords,
        change: `${Math.round((completedRecords / recordsData.length) * 100)}% do total`,
        trend: 'up',
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'from-purple-500 to-purple-600'
      },
      {
        title: 'Pendentes',
        value: pendingRecords,
        change: 'Aguardando finalização',
        trend: 'neutral',
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'from-orange-500 to-orange-600'
      }
    ]);
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...records];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.chief_complaint?.toLowerCase().includes(searchLower) ||
        record.assessment_plan?.toLowerCase().includes(searchLower) ||
        record.patient.name.toLowerCase().includes(searchLower) ||
        record.doctor.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    // Apply patient filter
    if (filterPatient !== 'all') {
      filtered = filtered.filter(record => record.patient_id === filterPatient);
    }

    // Apply doctor filter
    if (filterDoctor !== 'all') {
      filtered = filtered.filter(record => record.doctor_id === filterDoctor);
    }

    // Apply date filters
    if (dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.record_date) >= dateFrom
      );
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(record => 
        new Date(record.record_date) <= endDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.record_date);
          bValue = new Date(b.record_date);
          break;
        case 'patient':
          aValue = a.patient.name.toLowerCase();
          bValue = b.patient.name.toLowerCase();
          break;
        case 'doctor':
          aValue = a.doctor.full_name?.toLowerCase() || '';
          bValue = b.doctor.full_name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPatient('all');
    setFilterDoctor('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortField('date');
    setSortOrder('desc');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="h-4 w-4 ml-1" /> : 
      <SortDesc className="h-4 w-4 ml-1" />;
  };

  const handleNewRecord = (patientId?: string) => {
    setSelectedPatientId(patientId || null);
    setSelectedRecordId(null);
    setCurrentView('new');
  };

  const handleEditRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    setCurrentView('edit');
  };

  const handleViewRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    setCurrentView('view');
  };

  const handleSaveRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    setCurrentView('view');
    loadRecords(); // Reload data after save
    toast({
      title: "Sucesso!",
      description: "Prontuário salvo com sucesso.",
    });
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedRecordId(null);
    setSelectedPatientId(null);
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
    setSelectedRecordId(null);
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadRecords();
    await loadPatients();
    await loadDoctors();
    toast({
      title: "Dados atualizados",
      description: "As informações foram atualizadas com sucesso.",
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Concluído', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      archived: { label: 'Arquivado', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Cabeçalho Moderno - Mobile Optimized */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 sm:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Prontuários Médicos
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg max-w-2xl">
                Sistema completo para gerenciamento de prontuários médicos, prescrições e histórico de pacientes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                onClick={refreshData} 
                variant="secondary" 
                size="default"
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={() => handleNewRecord()} 
                size="default"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Novo Prontuário
              </Button>
            </div>
          </div>
          
          {/* Elementos decorativos - Hidden on mobile */}
          <div className="hidden sm:block absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Barra de Busca e Filtros Avançados - Mobile Optimized */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Busca Principal */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Buscar por paciente, médico, queixa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filtros Avançados - Mobile Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 text-sm">
                    <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPatient} onValueChange={setFilterPatient}>
                  <SelectTrigger className="h-10 text-sm">
                    <User className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Pacientes</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <span className="truncate">{patient.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                  <SelectTrigger className="h-10 text-sm">
                    <Stethoscope className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Médicos</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <span className="truncate">Dr(a). {doctor.full_name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 justify-start text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 justify-start text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Ordenação e Ações - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('date')}
                    className="flex items-center text-xs sm:text-sm"
                  >
                    Data
                    {getSortIcon('date')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('patient')}
                    className="flex items-center text-xs sm:text-sm"
                  >
                    Paciente
                    {getSortIcon('patient')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('status')}
                    className="flex items-center text-xs sm:text-sm"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs sm:text-sm">
                    Limpar Filtros
                  </Button>
                  <Badge variant="secondary" className="px-3 py-1 text-xs sm:text-sm justify-center sm:justify-start">
                    {filteredRecords.length} resultado(s)
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas Modernos - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="p-3 sm:p-6 relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <div className="h-4 w-4 sm:h-5 sm:w-5">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    {getTrendIcon(stat.trend)}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide line-clamp-2">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 line-clamp-1">
                    <span className="sm:hidden">
                      {getTrendIcon(stat.trend)}
                    </span>
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações Rápidas com Design Moderno - Mobile Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100" 
            onClick={() => handleNewRecord()}
          >
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Novo Prontuário
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Criar um novo prontuário médico completo para um paciente
              </p>
              <div className="flex items-center justify-center text-blue-600 font-medium group-hover:gap-3 gap-2 transition-all text-sm sm:text-base">
                Começar agora
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100" 
            onClick={() => setCurrentView('history')}
          >
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <History className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Histórico Completo
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Visualizar e pesquisar todos os prontuários existentes
              </p>
              <div className="flex items-center justify-center text-green-600 font-medium group-hover:gap-3 gap-2 transition-all text-sm sm:text-base">
                Ver histórico
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 md:col-span-1 col-span-1">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Busca Avançada
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Encontrar prontuários com filtros avançados e inteligentes
              </p>
              <div className="flex items-center justify-center text-purple-600 font-medium group-hover:gap-3 gap-2 transition-all text-sm sm:text-base">
                Buscar agora
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Prontuários Recentes com Tabs e Lista Funcional - Mobile Optimized */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                Prontuários Recentes
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setCurrentView('history')} className="text-xs sm:text-sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm sm:text-base">Carregando prontuários...</p>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4 text-sm sm:text-base">Nenhum prontuário encontrado</p>
                <Button onClick={() => handleNewRecord()} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Prontuário
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredRecords.slice(0, 5).map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow border border-gray-100">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {record.patient.name}
                            </h3>
                            {getStatusBadge(record.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(record.record_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                Dr(a). {record.doctor.full_name}
                              </span>
                            </div>
                          </div>

                          {record.chief_complaint && (
                            <div className="mb-2">
                              <p className="text-xs sm:text-sm font-medium text-gray-700">Queixa Principal:</p>
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                {record.chief_complaint}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRecord(record.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Ver</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRecord(record.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Editar</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'new':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <MedicalRecordForm
              patientId={selectedPatientId || undefined}
              onSave={handleSaveRecord}
              onCancel={handleBackToDashboard}
            />
          </div>
        );

      case 'edit':
        return selectedRecordId ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <MedicalRecordForm
              recordId={selectedRecordId}
              onSave={handleSaveRecord}
              onCancel={handleBackToDashboard}
            />
          </div>
        ) : null;

      case 'view':
        return selectedRecordId ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <MedicalRecordView
              recordId={selectedRecordId}
              onEdit={handleEditRecord}
              onBack={handleBackToHistory}
            />
          </div>
        ) : null;

      case 'history':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-6">
              <div className="mb-8">
                <Button 
                  onClick={handleBackToDashboard}
                  variant="outline"
                  className="mb-4"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Voltar ao Dashboard
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Histórico de Prontuários</h1>
                <p className="text-gray-600 mt-2">Visualize e gerencie todos os prontuários médicos</p>
              </div>
              <MedicalRecordHistory
                onViewRecord={handleViewRecord}
                onEditRecord={handleEditRecord}
                onNewRecord={handleNewRecord}
              />
            </div>
          </div>
        );

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navegação Breadcrumb Moderna */}
      {currentView !== 'dashboard' && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex items-center space-x-3 text-sm">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <FileText className="h-4 w-4" />
                Prontuários
              </button>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium">
                {currentView === 'new' && 'Novo Prontuário'}
                {currentView === 'edit' && 'Editar Prontuário'}
                {currentView === 'view' && 'Visualizar Prontuário'}
                {currentView === 'history' && 'Histórico'}
              </span>
            </nav>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default MedicalRecords;