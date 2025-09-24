import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Notification {
  id: string
  type: 'patient_update' | 'care_record' | 'vital_signs' | 'medication' | 'check_in' | 'check_out' | 'navigation' | 'location_alert'
  title: string
  message: string
  patientName: string
  patientId: string
  timestamp: string
  read: boolean
}

interface CareRecord {
  id: string
  type: string
  created_at: string
  patient_id: string
  med_name?: string
  med_dose?: string
  volume_ml?: number
  meal_desc?: string
  bathroom_type?: string
  notes?: string
}

interface Patient {
  id: string
  full_name: string
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Buscar notificações iniciais
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // Buscar registros de cuidados recentes (últimas 24 horas)
      const { data: careRecords, error: careError } = await supabase
        .from('events')
        .select(`
          id,
          type,
          created_at,
          patient_id,
          med_name,
          med_dose,
          volume_ml,
          meal_desc,
          bathroom_type,
          notes
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (careError) throw careError

      // Buscar dados dos pacientes para os eventos
      const patientIds = [...new Set(careRecords?.map(record => record.patient_id) || [])]
      if (patientIds.length === 0) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, full_name, created_at')
        .in('id', patientIds)

      if (patientsError) throw patientsError

      // Criar mapa de pacientes
      const patientsMap = new Map<string, Patient>((patients || []).map(p => [p.id, p]))

      // Converter para formato de notificações
      const careNotifications: Notification[] = (careRecords || []).map(record => {
        const patient = patientsMap.get(record.patient_id)
        return {
          id: `care_${record.id}`,
          type: 'care_record' as const,
          title: getNotificationTitle(record.type),
          message: getNotificationMessage(record),
          patientName: patient?.full_name || 'Paciente desconhecido',
          patientId: record.patient_id,
          timestamp: record.created_at,
          read: false
        }
      })

      // Combinar e ordenar por timestamp
      const allNotifications = [...careNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15) // Limitar a 15 notificações mais recentes

      setNotifications(allNotifications)
      setUnreadCount(allNotifications.length)
      
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Configurar escuta em tempo real
  useEffect(() => {
    fetchNotifications()

    // Escutar mudanças em events
    const careSubscription = supabase
      .channel('events_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'events' 
        }, 
        async (payload) => {
          // Buscar dados do paciente para a nova notificação
          const { data: patient } = await supabase
            .from('patients')
            .select('full_name')
            .eq('id', payload.new.patient_id)
            .single()

          // Criar objeto CareRecord tipado a partir do payload
          const careRecord: CareRecord = {
            id: payload.new.id,
            type: payload.new.type,
            created_at: payload.new.created_at,
            patient_id: payload.new.patient_id,
            med_name: payload.new.med_name,
            med_dose: payload.new.med_dose,
            volume_ml: payload.new.volume_ml,
            meal_desc: payload.new.meal_desc,
            bathroom_type: payload.new.bathroom_type,
            notes: payload.new.notes
          }

          const newNotification: Notification = {
            id: `care_${payload.new.id}`,
            type: 'care_record',
            title: getNotificationTitle(payload.new.type),
            message: getNotificationMessage(careRecord),
            patientName: patient?.full_name || 'Paciente',
            patientId: payload.new.patient_id,
            timestamp: payload.new.created_at,
            read: false
          }

          setNotifications(prev => [newNotification, ...prev.slice(0, 14)])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      careSubscription.unsubscribe()
    }
  }, [])

  // Marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  }
}

// Funções auxiliares
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'drink': return 'Registro de Líquidos'
    case 'meal': return 'Registro de Alimentação'
    case 'med': return 'Administração de Medicamento'
    case 'bathroom': return 'Registro de Eliminação'
    case 'note': return 'Anotação Médica'
    default: return 'Novo Registro de Cuidado'
  }
}

function getNotificationMessage(record: CareRecord): string {
  switch (record.type) {
    case 'drink':
      return `${record.volume_ml}ml de líquido administrado`
    case 'meal':
      return `Refeição registrada: ${record.meal_desc || 'Sem descrição'}`
    case 'med':
      return `${record.med_name} ${record.med_dose} administrado`
    case 'bathroom':
      return `Eliminação registrada: ${record.bathroom_type || 'Tipo não especificado'}`
    case 'note':
      return record.notes || 'Nova anotação médica'
    default:
      return 'Novo registro de cuidado'
  }
}