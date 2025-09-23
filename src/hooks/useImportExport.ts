import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { CareEvent } from './useCareEvents'
import { Patient } from './usePatients'

export interface ExportOptions {
  patientId?: string
  startDate?: string
  endDate?: string
  eventTypes?: string[]
  format: 'json' | 'csv'
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
}

export const useImportExport = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Exportar cuidados
  const exportCareEvents = async (options: ExportOptions): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('events')
        .select(`
          *,
          patients(full_name, bed)
        `)
        .order('occurred_at', { ascending: false })

      // Aplicar filtros
      if (options.patientId && options.patientId !== 'all') {
        query = query.eq('patient_id', options.patientId)
      }

      if (options.startDate) {
        query = query.gte('occurred_at', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('occurred_at', options.endDate)
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        query = query.in('type', options.eventTypes as ('drink' | 'meal' | 'med' | 'bathroom' | 'note')[])
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('Nenhum registro encontrado para exportar')
      }

      // Preparar dados para exportação
      const exportData = data.map(event => ({
        id: event.id,
        patient_id: event.patient_id,
        patient_name: event.patients?.full_name || 'N/A',
        patient_bed: event.patients?.bed || 'N/A',
        type: event.type,
        occurred_at: event.occurred_at,
        scheduled_at: event.scheduled_at,
        volume_ml: event.volume_ml,
        meal_desc: event.meal_desc,
        med_name: event.med_name,
        med_dose: event.med_dose,
        bathroom_type: event.bathroom_type,
        notes: event.notes,
        created_at: event.created_at
      }))

      // Gerar arquivo baseado no formato
      if (options.format === 'json') {
        downloadJSON(exportData, generateFileName('cuidados', options.format))
      } else if (options.format === 'csv') {
        downloadCSV(exportData, generateFileName('cuidados', options.format))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Importar cuidados
  const importCareEvents = async (file: File): Promise<ImportResult> => {
    try {
      setLoading(true)
      setError(null)

      const fileContent = await readFile(file)
      let importData: any[]

      // Determinar formato do arquivo
      if (file.name.endsWith('.json')) {
        importData = JSON.parse(fileContent)
      } else if (file.name.endsWith('.csv')) {
        importData = parseCSV(fileContent)
      } else {
        throw new Error('Formato de arquivo não suportado. Use JSON ou CSV.')
      }

      if (!Array.isArray(importData)) {
        throw new Error('Formato de dados inválido')
      }

      const result: ImportResult = {
        success: false,
        imported: 0,
        errors: [],
        duplicates: 0
      }

      // Validar e processar cada registro
      const validEvents: Omit<CareEvent, 'id' | 'created_at'>[] = []
      const existingIds = new Set<string>()

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i]
        
        try {
          // Verificar se já existe (por ID se fornecido)
          if (item.id) {
            const { data: existing } = await supabase
              .from('events')
              .select('id')
              .eq('id', item.id)
              .single()

            if (existing) {
              result.duplicates++
              continue
            }
          }

          // Validar campos obrigatórios
          const validatedEvent = validateEventData(item, i + 1)
          if (validatedEvent) {
            validEvents.push(validatedEvent)
          }
        } catch (validationError) {
          result.errors.push(`Linha ${i + 1}: ${validationError instanceof Error ? validationError.message : 'Erro de validação'}`)
        }
      }

      // Inserir eventos válidos
      if (validEvents.length > 0) {
        const { data, error } = await supabase
          .from('events')
          .insert(validEvents)
          .select()

        if (error) {
          throw new Error(`Erro ao inserir dados: ${error.message}`)
        }

        result.imported = data?.length || 0
      }

      result.success = result.imported > 0 || result.duplicates > 0

      return result

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar dados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Funções auxiliares
  const validateEventData = (item: any, lineNumber: number): Omit<CareEvent, 'id' | 'created_at'> | null => {
    if (!item.patient_id) {
      throw new Error('patient_id é obrigatório')
    }

    if (!item.type || !['drink', 'meal', 'med', 'bathroom', 'note'].includes(item.type)) {
      throw new Error('type deve ser: drink, meal, med, bathroom ou note')
    }

    if (!item.occurred_at) {
      throw new Error('occurred_at é obrigatório')
    }

    // Validar data
    const occurredAt = new Date(item.occurred_at)
    if (isNaN(occurredAt.getTime())) {
      throw new Error('occurred_at deve ser uma data válida')
    }

    return {
      patient_id: item.patient_id,
      type: item.type,
      occurred_at: item.occurred_at,
      scheduled_at: item.scheduled_at || null,
      volume_ml: item.volume_ml ? Number(item.volume_ml) : null,
      meal_desc: item.meal_desc || null,
      med_name: item.med_name || null,
      med_dose: item.med_dose || null,
      bathroom_type: item.bathroom_type || null,
      notes: item.notes || null
    }
  }

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(file)
    })
  }

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('Arquivo CSV deve ter pelo menos cabeçalho e uma linha de dados')

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      
      data.push(row)
    }

    return data
  }

  const downloadJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, filename)
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return value !== null && value !== undefined ? `"${value}"` : '""'
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateFileName = (prefix: string, format: string): string => {
    const now = new Date()
    const timestamp = now.toISOString().split('T')[0].replace(/-/g, '')
    return `${prefix}_${timestamp}.${format}`
  }

  return {
    loading,
    error,
    exportCareEvents,
    importCareEvents
  }
}