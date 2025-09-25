import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFamilyAccess, FamilyAccessToken, FamilyPermissions } from '@/hooks/useFamilyAccess';
import { useCareEvents } from '@/hooks/useCareEvents';
import { Patient } from '@/hooks/usePatients';
import { FamilyLayout } from '@/components/FamilyLayout';
import FamilyCare from '@/components/FamilyCare';
import { 
  Heart, 
  Droplets, 
  Pill, 
  Utensils, 
  FileText, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Activity,
  Clock,
  User,
  AlertCircle,
  Smile
} from 'lucide-react';

interface CareEvent {
  id: string;
  patient_id: string;
  type: string;
  description?: string;
  created_at: string;
  created_by: string;
  metadata?: any;
  humor_scale?: number;
  happiness_scale?: number;
  humor_notes?: string;
}

const FamilyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId, token: urlToken } = useParams<{ patientId: string; token: string }>();
  const { validateTokenWithData, getPermissions } = useFamilyAccess();
  const { events, loading: eventsLoading } = useCareEvents();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [token, setToken] = useState<FamilyAccessToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const view = new URLSearchParams(location.search).get('view') || 'dashboard';

  useEffect(() => {
    const validateAccess = async () => {
      try {
        // Usar parâmetros da URL em vez de localStorage
        if (!patientId || !urlToken) {
          navigate('/family/login');
          return;
        }

        const result = await validateTokenWithData(patientId, urlToken);
        if (!result.isValid || !result.patient || !result.tokenData) {
          navigate('/family/login');
          return;
        }

        setToken(result.tokenData);
        setPatient(result.patient);
      } catch (err) {
        console.error('Validation error:', err);
        setError('Erro ao validar acesso');
        navigate('/family/login');
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [navigate, validateTokenWithData, patientId, urlToken]);

  // Helper functions
  const getTypeIcon = (type: string) => {
    const icons = {
      drink: Droplets,
      med: Pill,
      meal: Utensils,
      note: FileText,
      bathroom: Heart,
      humor: Smile
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      drink: 'text-blue-600',
      med: 'text-green-600',
      meal: 'text-orange-600',
      note: 'text-gray-600',
      bathroom: 'text-purple-600',
      humor: 'text-yellow-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      drink: 'bg-blue-100 text-blue-800',
      med: 'bg-green-100 text-green-800',
      meal: 'bg-orange-100 text-orange-800',
      note: 'bg-gray-100 text-gray-800',
      bathroom: 'bg-purple-100 text-purple-800',
      humor: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getHumorEmoji = (scale: number) => {
    const emojis = {
      1: '😢',
      2: '😔',
      3: '😐',
      4: '😊',
      5: '😄'
    };
    return emojis[scale as keyof typeof emojis] || '😐';
  };

  const getHappinessEmoji = (scale: number) => {
    const emojis = {
      1: '😭',
      2: '😞',
      3: '😐',
      4: '😊',
      5: '🥰'
    };
    return emojis[scale as keyof typeof emojis] || '😐';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !patient || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">{error || 'Token inválido ou expirado'}</p>
            <Button onClick={() => navigate('/family/login')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const permissions = getPermissions(token.role);
  const patientEvents = events.filter(event => event.patient_id === patient.id);
  
  // Calculate stats
  const today = new Date().toDateString();
  const todayEvents = patientEvents.filter(event => 
    new Date(event.created_at).toDateString() === today
  );
  
  const stats = {
    liquids: todayEvents.filter(e => e.type === 'drink').length,
    medications: todayEvents.filter(e => e.type === 'med').length,
    meals: todayEvents.filter(e => e.type === 'meal').length,
    notes: todayEvents.filter(e => e.type === 'note').length,
    humor: todayEvents.filter(e => e.type === 'humor').length
  };

  // Get latest humor data
  const latestHumorEvent = todayEvents
    .filter(e => e.type === 'humor')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Patient Info - Always Visible */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {patient.photo ? (
                <img 
                  src={patient.photo} 
                  alt={patient.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{patient.full_name}</h2>
              <p className="text-blue-100 text-sm">
                {patient.bed && `Leito: ${patient.bed}`}
                {patient.birth_date && ` • Nascimento: ${new Date(patient.birth_date).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Humor Status */}
      {latestHumorEvent && (
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smile className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">Estado Emocional</h3>
                  <p className="text-yellow-100 text-sm">
                    Última atualização: {new Date(latestHumorEvent.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">Humor:</span>
                  <span className="text-2xl">{getHumorEmoji(latestHumorEvent.humor_scale || 3)}</span>
                <span className="text-lg font-bold">{latestHumorEvent.humor_scale}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Felicidade:</span>
                  <span className="text-2xl">{getHappinessEmoji(latestHumorEvent.happiness_scale || 3)}</span>
                  <span className="text-lg font-bold">{latestHumorEvent.happiness_scale}/5</span>
                </div>
              </div>
            </div>
            {latestHumorEvent.humor_notes && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Observações:</strong> {latestHumorEvent.humor_notes}
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Líquidos', value: stats.liquids, icon: Droplets, color: 'blue' },
          { label: 'Medicamentos', value: stats.medications, icon: Pill, color: 'green' },
          { label: 'Refeições', value: stats.meals, icon: Utensils, color: 'orange' },
          { label: 'Anotações', value: stats.notes, icon: FileText, color: 'purple' },
          { label: 'Humor', value: stats.humor, icon: Smile, color: 'yellow' }
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 text-${color}-600`} />
              <div>
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Permissions */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium">Permissões</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.canView && (
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Visualizar
            </Badge>
          )}
          {permissions.canEdit && (
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Registrar
            </Badge>
          )}
        </div>
      </Card>

      {/* Recent Activities */}
      {todayEvents.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium">Hoje ({todayEvents.length})</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {todayEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className={getTypeColor(event.type)}>
                  {getTypeIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  {event.type === 'humor' ? (
                    <div>
                      <p className="text-sm font-medium">
                        Humor: {getHumorEmoji(event.humor_scale || 3)} {event.humor_scale}/5 • 
                        Felicidade: {getHappinessEmoji(event.happiness_scale || 3)} {event.happiness_scale}/5
                      </p>
                      {event.humor_notes && (
                        <p className="text-xs text-gray-500 truncate">{event.humor_notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-medium truncate">{event.notes || 'Sem descrição'}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge className={`text-xs ${getTypeBadgeColor(event.type)}`}>
                  {event.type === 'humor' ? 'humor' : event.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderCare = () => (
    <div className="space-y-4">
      {/* Patient Info - Always Visible */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {patient.photo ? (
                <img 
                  src={patient.photo} 
                  alt={patient.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Activity className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{patient.full_name}</h2>
              <p className="text-green-100 text-sm">Registrar Cuidados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!permissions.canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para registrar cuidados.
          </AlertDescription>
        </Alert>
      )}

      {permissions.canEdit && (
        <Card className="p-4">
          <FamilyCare 
            patient={patient} 
            permissions={permissions}
          />
        </Card>
      )}
    </div>
  );

  return (
    <FamilyLayout patient={patient} permissions={permissions} currentPage={view === 'care' ? 'care' : 'dashboard'}>
      <div className="p-4 max-w-4xl mx-auto">
        {view === 'care' ? renderCare() : renderDashboard()}
      </div>
    </FamilyLayout>
  );
};

export default FamilyDashboard;