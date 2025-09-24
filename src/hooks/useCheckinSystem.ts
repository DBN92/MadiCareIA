import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSystemLogs } from '@/hooks/useSystemLogs'
import { useCheckinNotifications } from '@/hooks/useCheckinNotifications'
import { usePatients } from '@/hooks/usePatients'

export interface CheckinRecord {
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
  created_at: string
  updated_at: string
}

export interface PatientLocation {
  id: string
  full_name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
}

interface GeolocationPosition {
  latitude: number
  longitude: number
  accuracy: number
}

export const useCheckinSystem = () => {
  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  
  const { user } = useAuth()
  const { addLog } = useSystemLogs()
  const { addCheckinNotification } = useCheckinNotifications()
  const { patients } = usePatients()

  // Buscar registros do localStorage (temporário até configurar o banco)
  const fetchRecords = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const storedRecords = localStorage.getItem(`checkin_records_${user.id}`)
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar registros'
      setError(errorMessage)
      addLog('error', 'Erro ao buscar registros de check-in', errorMessage, 'Check-in System')
    } finally {
      setLoading(false)
    }
  }, [user, addLog])

  // Salvar registros no localStorage
  const saveRecords = useCallback((newRecords: CheckinRecord[]) => {
    if (!user) return
    localStorage.setItem(`checkin_records_${user.id}`, JSON.stringify(newRecords))
    setRecords(newRecords)
  }, [user])

  // Obter localização atual
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'))
        return
      }

      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          setCurrentLocation(location)
          setLocationLoading(false)
          resolve(location)
        },
        (error) => {
          setLocationLoading(false)
          reject(new Error(`Erro de geolocalização: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      )
    })
  }, [])

  // Geocodificação reversa (obter endereço a partir de coordenadas)
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Usando uma API de geocodificação gratuita
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
      )
      
      if (!response.ok) {
        throw new Error('Erro na geocodificação reversa')
      }
      
      const data = await response.json()
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.warn('Erro na geocodificação reversa:', error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }, [])

  // Fazer check-in
  const checkin = useCallback(async (patientId: string, notes?: string): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      setError(null)

      // Verificar se já existe check-in ativo
      const activeCheckin = records.find(r => 
        r.user_id === user.id && 
        r.type === 'check_in' && 
        !records.some(checkout => 
          checkout.user_id === user.id && 
          checkout.patient_id === r.patient_id && 
          checkout.type === 'check_out' && 
          checkout.timestamp > r.timestamp
        )
      )

      if (activeCheckin) {
        throw new Error('Você já possui um check-in ativo. Faça check-out primeiro.')
      }

      // Obter localização atual
      const location = await getCurrentLocation()
      const address = await reverseGeocode(location.latitude, location.longitude)

      // Calcular distância até o paciente (simulado)
      const distance = Math.random() * 5 + 0.1 // 0.1 a 5.1 km

      // Criar registro de check-in
      const newRecord: CheckinRecord = {
        id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        patient_id: patientId,
        type: 'check_in',
        timestamp: new Date().toISOString(),
        location_latitude: location.latitude,
        location_longitude: location.longitude,
        location_address: address,
        distance_to_patient: distance,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar registro
      const updatedRecords = [newRecord, ...records]
      saveRecords(updatedRecords)

      // Encontrar nome do paciente
      const patient = patients.find(p => p.id === patientId)
      const patientName = patient?.full_name || 'Paciente'

      // Adicionar notificação
      addCheckinNotification(
        'check_in',
        'Check-in Realizado',
        `Check-in realizado para ${patientName} em ${address}`,
        patientId,
        patientName,
        address,
        'medium'
      )

      // Log da ação
      addLog('info', 'Check-in Realizado', 
        `Check-in para paciente ${patientName} em ${address}`, 
        'Check-in System'
      )

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer check-in'
      setError(errorMessage)
      addLog('error', 'Erro no Check-in', errorMessage, 'Check-in System')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, records, getCurrentLocation, reverseGeocode, saveRecords, patients, addCheckinNotification, addLog])

  // Fazer check-out
  const checkout = useCallback(async (notes?: string): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      setError(null)

      // Encontrar check-in ativo
      const activeCheckin = records.find(r => 
        r.user_id === user.id && 
        r.type === 'check_in' && 
        !records.some(checkout => 
          checkout.user_id === user.id && 
          checkout.patient_id === r.patient_id && 
          checkout.type === 'check_out' && 
          checkout.timestamp > r.timestamp
        )
      )

      if (!activeCheckin) {
        throw new Error('Nenhum check-in ativo encontrado')
      }

      // Obter localização atual
      const location = await getCurrentLocation()
      const address = await reverseGeocode(location.latitude, location.longitude)

      // Criar registro de check-out
      const newRecord: CheckinRecord = {
        id: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        patient_id: activeCheckin.patient_id,
        type: 'check_out',
        timestamp: new Date().toISOString(),
        location_latitude: location.latitude,
        location_longitude: location.longitude,
        location_address: address,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Salvar registro
      const updatedRecords = [newRecord, ...records]
      saveRecords(updatedRecords)

      // Encontrar nome do paciente
      const patient = patients.find(p => p.id === activeCheckin.patient_id)
      const patientName = patient?.full_name || 'Paciente'

      // Adicionar notificação
      addCheckinNotification(
        'check_out',
        'Check-out Realizado',
        `Check-out realizado para ${patientName} em ${address}`,
        activeCheckin.patient_id,
        patientName,
        address,
        'medium'
      )

      // Log da ação
      addLog('info', 'Check-out Realizado', 
        `Check-out para paciente ${patientName} em ${address}`, 
        'Check-in System'
      )

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer check-out'
      setError(errorMessage)
      addLog('error', 'Erro no Check-out', errorMessage, 'Check-in System')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, records, getCurrentLocation, reverseGeocode, saveRecords, patients, addCheckinNotification, addLog])

  // Obter pacientes com localização (simulado)
  const getPatientsWithLocation = useCallback((): PatientLocation[] => {
    return patients.map(patient => ({
      id: patient.id,
      full_name: patient.full_name,
      address: `Rua ${Math.floor(Math.random() * 1000)}, ${Math.floor(Math.random() * 100)}`,
      city: 'São Paulo',
      state: 'SP',
      zip_code: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
      latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
      longitude: -46.6333 + (Math.random() - 0.5) * 0.1
    }))
  }, [patients])

  // Verificar check-in ativo
  const getActiveCheckin = useCallback((): CheckinRecord | null => {
    if (!user) return null

    return records.find(r => 
      r.user_id === user.id && 
      r.type === 'check_in' && 
      !records.some(checkout => 
        checkout.user_id === user.id && 
        checkout.patient_id === r.patient_id && 
        checkout.type === 'check_out' && 
        checkout.timestamp > r.timestamp
      )
    ) || null
  }, [user, records])

  // Gerar URL de navegação
  const getNavigationUrl = useCallback((
    patientLocation: PatientLocation, 
    app: 'google' | 'waze' = 'google'
  ): string => {
    const { latitude, longitude, address } = patientLocation
    
    if (app === 'waze') {
      return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&zoom=17`
    } else {
      const destination = address || `${latitude},${longitude}`
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    }
  }, [])

  // Inicializar dados
  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    locationLoading,
    error,
    currentLocation,
    checkin,
    checkout,
    getPatientsWithLocation,
    getActiveCheckin,
    getNavigationUrl,
    getCurrentLocation,
    refresh: fetchRecords
  }
}