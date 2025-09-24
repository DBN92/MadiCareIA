import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSystemLogs } from '@/hooks/useSystemLogs'

export interface CheckinNotification {
  id: string
  type: 'check_in' | 'check_out' | 'navigation' | 'location_alert'
  title: string
  message: string
  timestamp: string
  user_id: string
  user_name: string
  patient_id?: string
  patient_name?: string
  location?: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

export function useCheckinNotifications() {
  const [notifications, setNotifications] = useState<CheckinNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const { addLog } = useSystemLogs()

  // Adicionar nova notificação de check-in
  const addCheckinNotification = (
    type: CheckinNotification['type'],
    title: string,
    message: string,
    patientId?: string,
    patientName?: string,
    location?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    const newNotification: CheckinNotification = {
      id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      user_id: user?.id || '',
      user_name: user?.name || 'Usuário',
      patient_id: patientId,
      patient_name: patientName,
      location,
      read: false,
      priority
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]) // Manter apenas 20 notificações
    setUnreadCount(prev => prev + 1)

    // Log da notificação
    addLog('info', 'Notificação Check-in', 
      `${title}: ${message}`, 
      'Check-in System'
    )

    return newNotification.id
  }

  // Marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }

  // Remover notificação
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      const filtered = prev.filter(n => n.id !== notificationId)
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      return filtered
    })
  }

  // Limpar notificações antigas (mais de 24 horas)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
      
      setNotifications(prev => {
        const filtered = prev.filter(notif => 
          new Date(notif.timestamp).getTime() > twentyFourHoursAgo
        )
        
        if (filtered.length !== prev.length) {
          const removedUnread = prev.filter(n => 
            !n.read && new Date(n.timestamp).getTime() <= twentyFourHoursAgo
          ).length
          
          setUnreadCount(prev => Math.max(0, prev - removedUnread))
        }
        
        return filtered
      })
    }, 60 * 60 * 1000) // Verificar a cada hora

    return () => clearInterval(cleanupInterval)
  }, [])

  return {
    notifications,
    unreadCount,
    addCheckinNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  }
}