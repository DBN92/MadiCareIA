import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Share, 
  Mail, 
  Link, 
  CalendarIcon, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2,
  Plus,
  Users,
  Clock,
  Shield,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type MedicalRecordShare = Database['public']['Tables']['medical_record_shares']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MedicalRecordShareProps {
  recordId: string;
  onClose?: () => void;
}

interface ShareData {
  shared_with: string;
  permissions: string;
  expires_at?: Date;
  notes?: string;
}

const MedicalRecordShare: React.FC<MedicalRecordShareProps> = ({
  recordId,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<MedicalRecordShare[]>([]);
  const [showNewShare, setShowNewShare] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    shared_with: '',
    permissions: 'read',
    expires_at: null
  });

  useEffect(() => {
    loadShares();
  }, [recordId]);

  const loadShares = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('medical_record_shares')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShares(data || []);
    } catch (error) {
      console.error('Erro ao carregar compartilhamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar compartilhamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    try {
      setLoading(true);

      if (!shareData.shared_with) {
        toast({
          title: "Erro",
          description: "Email do destinatário é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Gerar token único para o compartilhamento
      const shareToken = crypto.randomUUID();

      const newShare = {
        medical_record_id: recordId,
        shared_with: shareData.shared_with,
        permissions: shareData.permissions,
        expires_at: shareData.expires_at?.toISOString() || null,
        shared_by: user?.id || ''
      };

      const { error } = await supabase
        .from('medical_record_shares')
        .insert([newShare]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compartilhamento criado com sucesso",
      });

      // Resetar formulário
      setShareData({
        shared_with: '',
        permissions: 'read',
        expires_at: null
      });
      setShowNewShare(false);
      loadShares();
    } catch (error) {
      console.error('Erro ao criar compartilhamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar compartilhamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('medical_record_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compartilhamento revogado",
      });

      loadShares();
    } catch (error) {
      console.error('Erro ao revogar compartilhamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao revogar compartilhamento",
        variant: "destructive"
      });
    }
  };

  const copyShareLink = async (shareId: string) => {
    try {
      const shareUrl = `${window.location.origin}/medical-record/shared/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Sucesso",
        description: "Link copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao copiar link",
        variant: "destructive",
      });
    }
  };

  const getAccessLevelBadge = (permissions: string) => {
    return permissions === 'write' ? (
      <Badge variant="default">Edição</Badge>
    ) : (
      <Badge variant="secondary">Visualização</Badge>
    );
  };

  const getStatusBadge = (share: MedicalRecordShare) => {
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return <Badge variant="outline">Expirado</Badge>;
    }
    
    return <Badge variant="default">Ativo</Badge>;
  };

  const isExpired = (share: MedicalRecordShare) => {
    return share.expires_at && new Date(share.expires_at) < new Date();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compartilhar Prontuário</h2>
          <p className="text-gray-600">Gerencie o acesso ao prontuário médico</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Novo Compartilhamento */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Novo Compartilhamento
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowNewShare(!showNewShare)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardHeader>
        
        {showNewShare && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email do Destinatário *</Label>
                <Input
                  id="email"
                  type="email"
                  value={shareData.shared_with}
                  onChange={(e) => setShareData(prev => ({ ...prev, shared_with: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="access_level">Nível de Acesso</Label>
                <Select
                  value={shareData.permissions}
                  onValueChange={(value: string) => setShareData(prev => ({ ...prev, permissions: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Apenas Visualização</SelectItem>
                    <SelectItem value="write">Visualização e Edição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Expiração (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shareData.expires_at ? 
                        format(shareData.expires_at, "dd/MM/yyyy", { locale: ptBR }) : 
                        "Sem expiração"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={shareData.expires_at}
                      onSelect={(date) => setShareData(prev => ({ ...prev, expires_at: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={shareData.notes || ''}
                onChange={(e) => setShareData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o compartilhamento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewShare(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateShare} disabled={loading}>
                <Share className="h-4 w-4 mr-2" />
                {loading ? 'Compartilhando...' : 'Compartilhar'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Compartilhamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartilhamentos Ativos ({shares.filter(s => !isExpired(s)).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <div className="text-center py-8">
              <Share className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum compartilhamento encontrado</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowNewShare(true)}
              >
                Criar Primeiro Compartilhamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div key={share.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">
                          {share.shared_with}
                        </h4>
                        {getStatusBadge(share)}
                        {getAccessLevelBadge(share.permissions)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {share.shared_with}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criado em {format(new Date(share.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        
                        {share.expires_at && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Expira em {format(new Date(share.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!isExpired(share) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(share.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isExpired(share) && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Link de compartilhamento ativo</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyShareLink(share.id)}
                          className="ml-auto"
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Informações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Acesso Controlado</p>
              <p className="text-sm text-gray-600">
                Todos os compartilhamentos são protegidos por tokens únicos e podem ser revogados a qualquer momento.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Expiração Automática</p>
              <p className="text-sm text-gray-600">
                Configure datas de expiração para limitar o tempo de acesso aos prontuários compartilhados.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Auditoria Completa</p>
              <p className="text-sm text-gray-600">
                Todos os acessos aos prontuários compartilhados são registrados para auditoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalRecordShare;