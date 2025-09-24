import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, User, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { usePatients } from '@/hooks/usePatients'
import { useSystemLogs } from '@/hooks/useSystemLogs'
import { useNotifications } from '@/hooks/useNotifications'
import { useCheckinSystem } from '@/hooks/useCheckinSystem'

interface CheckinRecord {
  id: string
  user_id: string
  patient_id: string
  type: 'check_in' | 'check_out'
  timestamp: string
  location_latitude?: number
  location_longitude?: number
  location_address?: string
  distance_to_patient?: number
  notes?: string
}

interface PatientLocation {
  id: string
  full_name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
}

export const CheckinPanel: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [notes, setNotes] = useState('')

  const {
    records,
    loading,
    error,
    currentLocation,
    locationLoading,
    checkin,
    checkout,
    getPatientsWithLocation,
    getActiveCheckin,
    getNavigationUrl,
    getCurrentLocation
  } = useCheckinSystem()

  const activeCheckin = getActiveCheckin()

  const { user } = useAuth()
  const { patients } = usePatients()
  const { toast } = useToast()
  const { addLog } = useSystemLogs()

  const patientsWithLocation = getPatientsWithLocation()



  // Realizar check-in
  const handleCheckin = async () => {
    if (!selectedPatientId) {
      toast({
        title: "Selecione um paciente",
        description: "É necessário selecionar um paciente para fazer check-in",
        variant: "destructive"
      })
      return
    }

    try {
      await checkin(selectedPatientId, notes)
      setNotes('')
      setSelectedPatientId('')
      
      const patient = patients.find(p => p.id === selectedPatientId)
      toast({
        title: "Check-in realizado!",
        description: `Check-in realizado para ${patient?.full_name}`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar check-in'
      toast({
        title: "Erro no check-in",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Realizar check-out
  const handleCheckout = async () => {
    if (!activeCheckin) return

    try {
      await checkout(notes)
      setNotes('')
      
      const patient = patients.find(p => p.id === activeCheckin.patient_id)
      toast({
        title: "Check-out realizado!",
        description: `Check-out realizado para ${patient?.full_name}`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar check-out'
      toast({
        title: "Erro no check-out",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }



  // Abrir navegação
  const openNavigation = (app: 'waze' | 'google') => {
    const patientId = activeCheckin?.patient_id || selectedPatientId
    const patient = patientsWithLocation.find(p => p.id === patientId)
    
    if (!patient) {
      toast({
        title: "Erro",
        description: "Paciente não encontrado",
        variant: "destructive"
      })
      return
    }

    const url = getNavigationUrl(patient, app)
    if (url === '#') {
      toast({
        title: "Erro",
        description: "Coordenadas do paciente não disponíveis",
        variant: "destructive"
      })
      return
    }

    window.open(url, '_blank')
    
    addLog('info', 'Navegação Iniciada', 
      `Navegação ${app} iniciada para paciente ${patient.full_name}`, 
      'Check-in System'
    )
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId)
  const activePatient = activeCheckin ? patients.find(p => p.id === activeCheckin.patient_id) : null

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Status de Check-in
          </CardTitle>
          <CardDescription>
            {activeCheckin 
              ? `Você está em check-in com ${activePatient?.full_name}` 
              : 'Nenhum check-in ativo'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCheckin ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Check-in Ativo
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Paciente:</strong> {activePatient?.full_name}
                </div>
                <div>
                  <strong>Leito:</strong> {activePatient?.bed}
                </div>
                <div>
                  <strong>Check-in:</strong> {new Date(activeCheckin.timestamp).toLocaleString('pt-BR')}
                </div>
                <div>
                  <strong>Localização:</strong> {activeCheckin.location_address}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => openNavigation('google')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Google Maps
                  <ExternalLink className="h-3 w-3" />
                </Button>
                
                <Button 
                  onClick={() => openNavigation('waze')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Waze
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Selecione um paciente para fazer check-in</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de check-in/check-out */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeCheckin ? 'Check-out' : 'Check-in'}
          </CardTitle>
          <CardDescription>
            {activeCheckin 
              ? 'Finalize o atendimento ao paciente' 
              : 'Inicie o atendimento a um paciente'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeCheckin && (
            <div className="space-y-2">
              <Label htmlFor="patient-select">Selecionar Paciente</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {patient.full_name} - {patient.bed}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o atendimento..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            {activeCheckin ? (
              <Button 
                onClick={handleCheckout}
                disabled={loading || locationLoading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Realizando check-out...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Fazer Check-out
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleCheckin}
                disabled={loading || locationLoading || !selectedPatientId}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Realizando check-in...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Fazer Check-in
                  </>
                )}
              </Button>
            )}

            {locationLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Obtendo localização...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico recente */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>
            Seus últimos registros de check-in/check-out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Nenhum registro encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 5).map(record => {
                const patient = patients.find(p => p.id === record.patient_id)
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={record.type === 'check_in' ? 'default' : 'secondary'}
                        className={record.type === 'check_in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {record.type === 'check_in' ? 'Check-in' : 'Check-out'}
                      </Badge>
                      <div>
                        <div className="font-medium">{patient?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(record.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.location_address}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}