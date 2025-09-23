import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useFamilyAccess } from './useFamilyAccess'

export interface Patient {
  id: string
  full_name: string
  birth_date: string
  admission_date?: string
  bed: string
  notes: string
  photo?: string
  status: 'estavel' | 'instavel' | 'em_observacao' | 'em_alta'
  is_active: boolean
  created_at: string
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { revokeAllPatientTokens } = useFamilyAccess()

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Mapear dados do Supabase para incluir status padrão se não existir
      const patientsWithStatus = (data || []).map((patient: Record<string, unknown>) => ({
        id: patient.id as string,
        full_name: patient.full_name as string,
        birth_date: patient.birth_date as string,
        admission_date: patient.admission_date as string | undefined,
        bed: patient.bed as string,
        notes: patient.notes as string,
        photo: patient.photo as string | undefined,
        status: (patient.status as Patient['status']) || 'estavel' as const,
        is_active: patient.is_active as boolean,
        created_at: patient.created_at as string
      }))
      
      setPatients(patientsWithStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const addPatient = async (patient: Omit<Patient, 'id' | 'created_at'>) => {
    try {
      const patientWithStatus = {
        ...patient,
        status: patient.status || 'estavel' as const
      }
      
      const { data, error } = await supabase
        .from('patients')
        .insert([patientWithStatus])
        .select()
        .single()

      if (error) throw error
      
      const newPatient = {
        ...data,
        status: (data as Record<string, unknown>).status as Patient['status'] || 'estavel' as const
      }
      
      setPatients(prev => [newPatient, ...prev])
      return newPatient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar paciente')
    }
  }

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const updatedPatient = {
        ...data,
        status: (data as any).status || 'estavel' as const
      }
      
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p))
      return updatedPatient
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar paciente')
    }
  }

  const deletePatient = async (id: string) => {
    try {
      // Primeiro, revogar todos os tokens familiares do paciente
      await revokeAllPatientTokens(id, 'Paciente recebeu alta')
      
      // Depois, marcar o paciente como inativo (alta)
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      setPatients(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao remover paciente')
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients
  }
}