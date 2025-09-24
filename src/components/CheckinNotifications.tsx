import React, { useState, useEffect } from 'react'
import { Bell, MapPin, Clock, User, Navigation, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { usePatients } from '@/hooks/usePatients'
import { useSystemLogs } from '@/hooks/useSystemLogs'

interface CheckinNotification {
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

export const CheckinNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<CheckinNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
  const { patients } = usePatients()
  const { addLog } = useSystemLogs()

  // Simular notificações do sistema de check-in
  useEffect(() => {
    const generateMockNotifications = (): CheckinNotification[] => {
      const mockNotifications: CheckinNotification[] = [
        {
          id: 'notif_1',
          type: 'check_in',
          title: 'Check-in Realizado',
          message: 'Dr. Silva fez check-in para atendimento do paciente Maria Santos',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
          user_id: 'user_1',
          user_name: 'Dr. Silva',
          patient_id: 'patient_1',
          patient_name: 'Maria Santos',
          location: 'Rua das Flores, 123 - São Paulo, SP',
          read: false,
          priority: 'medium'
        },
        {
          id: 'notif_2',
          type: 'navigation',
          title: 'Navegação Iniciada',
          message: 'Enfermeira Ana iniciou navegação para paciente João Oliveira',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
          user_id: 'user_2',
          user_name: 'Enfermeira Ana',
          patient_id: 'patient_2',
          patient_name: 'João Oliveira',
          location: 'Av. Paulista, 456 - São Paulo, SP',
          read: false,
          priority: 'low'
        },
        {
          id: 'notif_3',
          type: 'check_out',
          title: 'Check-out Realizado',
          message: 'Dr. Carlos finalizou atendimento do paciente Pedro Costa',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min atrás
          user_id: 'user_3',
          user_name: 'Dr. Carlos',
          patient_id: 'patient_3',
          patient_name: 'Pedro Costa',
          location: 'Rua Augusta, 789 - São Paulo, SP',
          read: true,
          priority: 'medium'
        },
        {
          id: 'notif_4',
          type: 'location_alert',
          title: 'Alerta de Localização',
          message: 'Enfermeira Lucia está a mais de 2km do paciente designado',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h atrás
          user_id: 'user_4',
          user_name: 'Enfermeira Lucia',
          patient_id: 'patient_4',
          patient_name: 'Ana Silva',
          location: 'Distância: 2.3km',
          read: false,
          priority: 'high'
        }
      ]

      return mockNotifications
    }

    const mockNotifications = generateMockNotifications()
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

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
    
    addLog('info', 'Notificação Lida', 
      `Notificação ${notificationId} marcada como lida`, 
      'Check-in Notifications'
    )
  }

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
    
    addLog('info', 'Todas Notificações Lidas', 
      'Todas as notificações de check-in foram marcadas como lidas', 
      'Check-in Notifications'
    )
  }

  // Obter ícone baseado no tipo
  const getNotificationIcon = (type: CheckinNotification['type']) => {
    switch (type) {
      case 'check_in':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'check_out':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'navigation':
        return <Navigation className="h-4 w-4 text-purple-600" />
      case 'location_alert':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  // Obter cor da prioridade
  const getPriorityColor = (priority: CheckinNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Formatar tempo relativo
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações de Check-in
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Acompanhe atividades de check-in, check-out e navegação da equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação de check-in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                  notification.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority === 'high' ? 'Alta' : 
                           notification.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      notification.read ? 'text-gray-600' : 'text-gray-800'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {notification.user_name}
                      </div>
                      {notification.patient_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.patient_name}
                        </div>
                      )}
                      {notification.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {notification.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}