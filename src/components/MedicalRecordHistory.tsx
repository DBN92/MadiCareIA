import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  CalendarIcon, 
  Search, 
  Eye, 
  Edit, 
  FileText, 
  User, 
  Clock, 
  Filter,
  Download,
  Share,
  Trash2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MedicalRecordWithRelations extends MedicalRecord {
  patient: Patient;
  profiles: Profile;
}

interface MedicalRecordHistoryProps {
  patientId?: string;
  onViewRecord?: (recordId: string) => void;
  onEditRecord?: (recordId: string) => void;
  onNewRecord?: (patientId?: string) => void;
}

const MedicalRecordHistory: React.FC<MedicalRecordHistoryProps> = ({
  patientId,
  onViewRecord,
  onEditRecord,
  onNewRecord
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MedicalRecordWithRelations[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecordWithRelations[]>([]);
  
  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{id: string, patientName: string} | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(patientId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    loadRecords();
    loadPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, selectedPatient, selectedStatus, dateFrom, dateTo]);

  const loadRecords = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(*),
          profiles:profiles!medical_records_doctor_id_fkey(*)
        `)
        .order('record_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar prontuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de prontuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.assessment_plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por paciente
    if (selectedPatient && selectedPatient !== 'all') {
      filtered = filtered.filter(record => record.patient_id === selectedPatient);
    }

    // Filtro por status
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }

    // Filtro por data
    if (dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.record_date) >= dateFrom
      );
    }

    if (dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.record_date) <= dateTo
      );
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPatient(patientId || '');
    setSelectedStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
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

  const handleDeleteRecord = async (recordId: string) => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prontuário excluído com sucesso",
      });

      loadRecords();
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir prontuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir prontuário",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (recordId: string, patientName: string) => {
    setRecordToDelete({ id: recordId, patientName });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setRecordToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando prontuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Prontuários</h1>
          <p className="text-gray-600">
            {filteredRecords.length} prontuário(s) encontrado(s)
          </p>
        </div>
        <Button onClick={() => onNewRecord?.(selectedPatient)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prontuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar por queixa, plano ou médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {!patientId && (
              <div>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os pacientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pacientes</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Prontuários */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum prontuário encontrado</p>
              <Button 
                className="mt-4" 
                onClick={() => onNewRecord?.(selectedPatient)}
              >
                Criar Primeiro Prontuário
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {record.patient.name}
                      </h3>
                      {getStatusBadge(record.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(record.record_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dr(a). {record.profiles.full_name}
                      </div>
                    </div>

                    {record.chief_complaint && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Queixa Principal:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {record.chief_complaint}
                        </p>
                      </div>
                    )}

                    {record.assessment_plan && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Plano:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {record.assessment_plan}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewRecord?.(record.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRecord?.(record.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(record.id, record.patient.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Atualizado em {format(new Date(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Tem certeza que deseja excluir o prontuário do paciente{' '}
                <strong>{recordToDelete?.patientName}</strong>?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ Esta ação não pode ser desfeita. Todos os dados do prontuário serão perdidos permanentemente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteRecord(recordToDelete?.id || '')}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Prontuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicalRecordHistory;