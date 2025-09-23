import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Patient } from './usePatients'

export type FamilyRole = 'editor' | 'viewer'

export interface FamilyAccessToken {
  id: string
  patient_id: string
  token: string
  username: string
  password: string
  role: FamilyRole
  is_active: boolean
  created_at: string
  revoked_at?: string
  revoked_reason?: string
}

export interface FamilyPermissions {
  canEdit: boolean
  canView: boolean
  canRegisterLiquids: boolean
  canRegisterMedications: boolean
  canRegisterMeals: boolean
  canRegisterActivities: boolean
}

const FAMILY_TOKENS_KEY = 'bedside_family_tokens'

export const useFamilyAccess = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obter tokens do localStorage
  const getStoredTokens = (): FamilyAccessToken[] => {
    try {
      const stored = localStorage.getItem(FAMILY_TOKENS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Salvar tokens no localStorage
  const saveTokens = (tokens: FamilyAccessToken[]) => {
    localStorage.setItem(FAMILY_TOKENS_KEY, JSON.stringify(tokens))
  }

  // Função para obter permissões baseadas na role
  const getPermissions = useCallback((role: FamilyRole): FamilyPermissions => {
    switch (role) {
      case 'editor':
        return {
          canEdit: true,
          canView: true,
          canRegisterLiquids: true,
          canRegisterMedications: true,
          canRegisterMeals: true,
          canRegisterActivities: true
        }
      case 'viewer':
        return {
          canEdit: false,
          canView: true,
          canRegisterLiquids: false,
          canRegisterMedications: false,
          canRegisterMeals: false,
          canRegisterActivities: false
        }
      default:
        return {
          canEdit: false,
          canView: true,
          canRegisterLiquids: false,
          canRegisterMedications: false,
          canRegisterMeals: false,
          canRegisterActivities: false
        }
    }
  }, [])

  // Gerar credenciais de acesso para um paciente (padrão: editor)
  const generateFamilyToken = useCallback(async (patientId: string, role: FamilyRole = 'editor'): Promise<FamilyAccessToken> => {
    try {
      setLoading(true)
      setError(null)
      
      // Gerar token único
      const token = crypto.randomUUID() + '-' + Date.now().toString(36)
      
      // Gerar credenciais de login
      const username = `familia_${patientId.slice(-6)}_${Date.now().toString(36).slice(-4)}`
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
      
      const newToken: FamilyAccessToken = {
        id: crypto.randomUUID(),
        patient_id: patientId,
        token: token,
        username: username,
        password: password,
        role: role,
        is_active: true,
        created_at: new Date().toISOString()
      }
      
      const tokens = getStoredTokens()
      tokens.push(newToken)
      saveTokens(tokens)
      
      return newToken
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar token'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Validar token e retornar informações de validação
  const validateTokenWithData = useCallback(async (patientId: string, token: string): Promise<{ isValid: boolean; tokenData?: FamilyAccessToken; patient?: Patient }> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Validando token familiar:', { patientId, token: token.substring(0, 10) + '...' })
      
      // Para pacientes de teste, criar tokens automaticamente se não existirem
      if (patientId.startsWith('test-patient') && token.startsWith('test-token')) {
        console.log('🧪 Processando paciente de teste')
        
        // Verificar se já existe um token para este paciente/token
        const tokens = getStoredTokens()
        let tokenData = tokens.find(t => 
          t.patient_id === patientId && 
          t.token === token && 
          t.is_active
        )
        
        // Se não existe, criar automaticamente
        if (!tokenData) {
          console.log('🚀 Criando token de teste automaticamente')
          
          // Determinar role baseado no token (padrão editor para testes)
          const role: FamilyRole = token.includes('viewer') ? 'viewer' : 'editor'
          
          const testToken: FamilyAccessToken = {
            id: 'test-id-' + Date.now(),
            patient_id: patientId,
            token: token,
            username: `familia_${role}`,
            password: 'senha123',
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
          }
          
          // Adicionar o token de teste aos tokens armazenados
          const updatedTokens = [...tokens, testToken]
          saveTokens(updatedTokens)
          tokenData = testToken
          console.log('✅ Token de teste criado e salvo:', { role, token })
        }
        
        // Criar dados mock do paciente
         const mockPatient: Patient = {
           id: patientId,
           full_name: 'Paciente Teste',
           birth_date: '1990-01-01',
           bed: 'Leito 101',
           notes: 'Paciente de teste para desenvolvimento',
           is_active: true,
           created_at: new Date().toISOString()
         }
        
        console.log('✅ Validação de teste bem-sucedida')
        return {
          isValid: true,
          tokenData,
          patient: mockPatient
        }
      }
      
      // Para pacientes reais, usar o fluxo normal
      const tokens = getStoredTokens()
      console.log('📦 Tokens armazenados:', tokens.length)
      
      const tokenData = tokens.find(t => 
        t.patient_id === patientId && 
        t.token === token && 
        t.is_active
      )

      if (!tokenData) {
        console.error('❌ Token não encontrado ou inativo')
        return { isValid: false }
      }

      // Buscar dados do paciente no Supabase
      let patient = null
      let error = null
      
      // Para pacientes de teste, criar dados mock
      if (patientId.startsWith('test-patient')) {
        console.log('🧪 Usando dados de paciente de teste')
        patient = {
          id: patientId,
          full_name: 'João Silva Teste',
          birth_date: '1980-05-15',
          bed: 'Leito 101',
          notes: 'Paciente de teste para sistema familiar',
          is_active: true,
          created_at: new Date().toISOString()
        }
      } else {
        // Para pacientes reais, buscar no Supabase
        const result = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single()
        
        patient = result.data
        error = result.error
      }

      if (error || !patient) {
        console.error('❌ Paciente não encontrado:', error)
        return { isValid: false }
      }

      console.log('✅ Token válido e paciente encontrado')
      return { isValid: true, tokenData, patient }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar token'
      setError(errorMessage)
      console.error('❌ Erro na validação:', errorMessage)
      return { isValid: false }
    } finally {
      setLoading(false)
    }
  }, [])

  // Validar token e obter dados do paciente (função original mantida para compatibilidade)
  const validateFamilyToken = async (patientId: string, token: string): Promise<Patient | null> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Validando token familiar:', { patientId, token: token.substring(0, 10) + '...' })
      
      // Verificar se o token existe e está válido
      const tokens = getStoredTokens()
      console.log('📦 Tokens armazenados:', tokens.length)
      
      let tokenData = tokens.find(t => 
        t.patient_id === patientId && 
        t.token === token && 
        t.is_active
      )

      // Sistema de fallback para pacientes de teste
      if (!tokenData && patientId.startsWith('test-patient') && token.startsWith('test-token')) {
        console.log('🧪 Criando token de teste automaticamente')
        const testToken: FamilyAccessToken = {
          id: 'test-id-' + Date.now(),
          patient_id: patientId,
          token: token,
          username: 'familia_teste',
          password: 'senha123',
          role: 'editor',
          is_active: true,
          created_at: new Date().toISOString()
        }
        
        // Adicionar o token de teste aos tokens armazenados
        const updatedTokens = [...tokens, testToken]
        saveTokens(updatedTokens)
        tokenData = testToken
        console.log('✅ Token de teste criado e salvo')
      }

      if (!tokenData) {
        console.error('❌ Token não encontrado ou inativo')
        console.log('🔍 Procurando por:', { patientId, token: token.substring(0, 10) + '...' })
        console.log('📋 Tokens disponíveis:', tokens.map(t => ({ 
          patient_id: t.patient_id, 
          token: t.token.substring(0, 10) + '...', 
          is_active: t.is_active 
        })))
        throw new Error('Token inválido ou expirado')
      }

      console.log('✅ Token válido encontrado')

      // Se for um paciente de teste, criar dados mock sem consultar o Supabase
      if (patientId.startsWith('test-patient')) {
        console.log('🧪 Detectado paciente de teste, criando dados mock:', patientId)
        const mockPatient = {
          id: patientId,
          full_name: 'Paciente de Teste',
          birth_date: '1980-01-01',
          bed: 'Leito Teste',
          notes: 'Paciente criado para testes do sistema familiar',
          is_active: true,
          created_at: new Date().toISOString()
        }
        console.log('✅ Paciente de teste criado:', mockPatient.full_name)
        return mockPatient
      }

      // Buscar dados do paciente no Supabase apenas para pacientes reais
      console.log('🔍 Buscando dados do paciente no Supabase...')
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('is_active', true)
        .single()

      if (patientError) {
        console.error('❌ Erro do Supabase:', patientError)
        throw new Error(`Erro no banco de dados: ${patientError.message}`)
      }

      if (!patientData) {
        console.error('❌ Paciente não encontrado')
        throw new Error('Paciente não encontrado')
      }

      console.log('✅ Paciente encontrado:', patientData.full_name)
      return patientData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar token'
      console.error('❌ Erro na validação:', errorMessage)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Autenticar com login e senha
  const authenticateFamily = async (username: string, password: string): Promise<{ token: FamilyAccessToken; patient: Patient } | null> => {
    try {
      setLoading(true)
      setError(null)
      
      // Verificar credenciais
      const tokens = getStoredTokens()
      const tokenData = tokens.find(t => 
        t.username === username && 
        t.password === password && 
        t.is_active
      )

      if (!tokenData) {
        throw new Error('Credenciais inválidas')
      }

      // Se for um paciente de teste, criar dados mock sem consultar o Supabase
      if (tokenData.patient_id.startsWith('test-patient')) {
        console.log('🧪 Detectado paciente de teste na autenticação, criando dados mock:', tokenData.patient_id)
        const mockPatient = {
          id: tokenData.patient_id,
          full_name: 'Paciente de Teste',
          birth_date: '1980-01-01',
          bed: 'Leito Teste',
          notes: 'Paciente criado para testes do sistema familiar',
          is_active: true,
          created_at: new Date().toISOString()
        }
        console.log('✅ Paciente de teste criado para autenticação:', mockPatient.full_name)
        return { token: tokenData, patient: mockPatient }
      }

      // Buscar dados do paciente no Supabase apenas para pacientes reais
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', tokenData.patient_id)
        .eq('is_active', true)
        .single()

      if (patientError || !patientData) {
        throw new Error('Paciente não encontrado')
      }

      return { token: tokenData, patient: patientData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao autenticar'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Revogar token
  const revokeFamilyToken = async (tokenId: string, reason: string = 'Revogado manualmente') => {
    try {
      setLoading(true)
      setError(null)
      
      const tokens = getStoredTokens()
      const updatedTokens = tokens.map(t => 
        t.id === tokenId ? { 
          ...t, 
          is_active: false, 
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        } : t
      )
      saveTokens(updatedTokens)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao revogar token'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Revogar todos os tokens de um paciente (usado na alta)
  const revokeAllPatientTokens = async (patientId: string, reason: string = 'Paciente recebeu alta') => {
    try {
      setLoading(true)
      setError(null)
      
      const tokens = getStoredTokens()
      const updatedTokens = tokens.map(t => 
        t.patient_id === patientId && t.is_active ? { 
          ...t, 
          is_active: false, 
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        } : t
      )
      saveTokens(updatedTokens)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao revogar tokens'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Listar tokens ativos de um paciente
  const getPatientTokens = async (patientId: string): Promise<FamilyAccessToken[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const tokens = getStoredTokens()
      const patientTokens = tokens.filter(t => 
        t.patient_id === patientId && 
        t.is_active
      )
      
      return patientTokens
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tokens'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateFamilyToken,
    validateFamilyToken,
    validateTokenWithData,
    authenticateFamily,
    revokeFamilyToken,
    revokeAllPatientTokens,
    getPatientTokens,
    getPermissions
  }
}