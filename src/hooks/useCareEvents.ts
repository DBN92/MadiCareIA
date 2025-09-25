import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'

export type CareEvent = Tables<'events'> & {
  humor_scale?: number
  happiness_scale?: number
  humor_notes?: string
}

export const useCareEvents = (patientId?: string) => {
  const [events, setEvents] = useState<CareEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select(`
          *,
          patients(full_name, bed)
        `)
        .order('occurred_at', { ascending: false })

      if (patientId) {
        query = query.eq('patient_id', patientId)
      }

      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros')
    } finally {
      setLoading(false)
    }
  }

  const addEvent = async (event: Omit<CareEvent, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single()

      if (error) {
        throw error
      }
      
      setEvents(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao adicionar registro')
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        throw error
      }
      
      setEvents(prev => prev.filter(event => event.id !== eventId))
      return true
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir registro')
    }
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayEvents = events.filter(event => 
      event.occurred_at.startsWith(today)
    )

    return {
      total: todayEvents.length,
      liquids: todayEvents.filter(e => e.type === 'drink').length,
      medications: todayEvents.filter(e => e.type === 'med').length,
      drainage: todayEvents.filter(e => e.type === 'note').length,
      meals: todayEvents.filter(e => e.type === 'meal').length,
      bathroom: todayEvents.filter(e => e.type === 'bathroom').length
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [patientId])

  return {
    events,
    loading,
    error,
    addEvent,
    deleteEvent,
    refetch: fetchEvents,
    getTodayStats
  }
}