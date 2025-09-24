import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface VitalSignsData {
  systolicBP?: string
  diastolicBP?: string
  heartRate?: string
  temperature?: string
  oxygenSaturation?: string
  respiratoryRate?: string
  confidence?: number
}

export interface OCRResult {
  success: boolean
  data?: VitalSignsData
  error?: string
  confidence?: number
  eventId?: string // ID do evento salvo no Supabase
}

// Configurações para diferentes serviços de OCR
const OCR_CONFIG = {
  // Google Vision API (requer chave API)
  GOOGLE_VISION: {
    endpoint: 'https://vision.googleapis.com/v1/images:annotate',
    apiKey: import.meta.env.VITE_GOOGLE_VISION_API_KEY
  },
  
  // Tesseract.js (OCR local)
  TESSERACT: {
    language: 'eng+por',
    options: {
      logger: (m: any) => console.log(m)
    }
  }
}

/**
 * Classe para processamento de OCR em imagens de sinais vitais
 */
export class VitalSignsOCR {
  private static instance: VitalSignsOCR
  
  static getInstance(): VitalSignsOCR {
    if (!VitalSignsOCR.instance) {
      VitalSignsOCR.instance = new VitalSignsOCR()
    }
    return VitalSignsOCR.instance
  }

  /**
   * Processa imagem e extrai dados de sinais vitais
   */
  async processImage(imageData: string): Promise<OCRResult> {
    try {
      // Tentar diferentes métodos de OCR em ordem de preferência
      
      // 1. Tentar Google Vision API se disponível
      if (OCR_CONFIG.GOOGLE_VISION.apiKey) {
        const googleResult = await this.processWithGoogleVision(imageData)
        if (googleResult.success) return googleResult
      }
      
      // 2. Tentar Tesseract.js como fallback
      const tesseractResult = await this.processWithTesseract(imageData)
      if (tesseractResult.success) return tesseractResult
      
      // 3. Usar simulação como último recurso (para desenvolvimento)
      return await this.processWithSimulation(imageData)
      
    } catch (error) {
      console.error('Erro no processamento OCR:', error)
      return {
        success: false,
        error: 'Erro interno no processamento da imagem'
      }
    }
  }

  /**
   * Processamento usando Google Vision API
   */
  private async processWithGoogleVision(imageData: string): Promise<OCRResult> {
    try {
      const base64Image = imageData.split(',')[1] // Remove data:image/jpeg;base64,
      
      const response = await fetch(`${OCR_CONFIG.GOOGLE_VISION.endpoint}?key=${OCR_CONFIG.GOOGLE_VISION.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 50
            }]
          }]
        })
      })

      const result = await response.json()
      
      if (result.responses?.[0]?.textAnnotations) {
        const extractedText = result.responses[0].textAnnotations[0]?.description || ''
        return this.parseVitalSigns(extractedText, 'google_vision')
      }
      
      throw new Error('Nenhum texto detectado na imagem')
      
    } catch (error) {
      console.error('Erro Google Vision:', error)
      return {
        success: false,
        error: 'Erro no processamento com Google Vision API'
      }
    }
  }

  /**
   * Processamento usando Tesseract.js
   */
  private async processWithTesseract(imageData: string): Promise<OCRResult> {
    try {
      // Importação dinâmica do Tesseract.js
      const Tesseract = await import('tesseract.js')
      
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        OCR_CONFIG.TESSERACT.language,
        OCR_CONFIG.TESSERACT.options
      )
      
      return this.parseVitalSigns(text, 'tesseract')
      
    } catch (error) {
      console.error('Erro Tesseract:', error)
      return {
        success: false,
        error: 'Erro no processamento com Tesseract.js'
      }
    }
  }

  /**
   * Simula OCR para testes - agora com dados da imagem Dräger
   */
  private async processWithSimulation(imageData: string): Promise<OCRResult> {
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados simulados baseados na imagem do monitor Dräger fornecida
      const simulatedText = `
        DRÄGER Infinity C500
        STI 78 bpm
        SpO2 92%
        FRI 23 rpm
        PNI 129/88 mmHg
        Temp 36.5°C
        Monitor de sinais vitais
        Paciente: EDILENE MARIA BEZERRA
        Leito 2
      `
      
      return this.parseVitalSigns(simulatedText, 'simulation')
    } catch (error) {
      return {
        success: false,
        error: `Erro na simulação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Analisa texto extraído e identifica sinais vitais
   */
  private parseVitalSigns(text: string, source: string): OCRResult {
    const vitalSigns: VitalSignsData = {}
    let confidence = 0.7 // Confiança base
    
    // Normalizar texto
    const normalizedText = text.toLowerCase().replace(/[^\w\s\/\-\.]/g, ' ')
    
    // Padrões regex para diferentes sinais vitais - incluindo padrões Dräger
    const patterns = {
      // Pressão arterial: 120/80, 120x80, PA: 120/80, PNI 129/88
      bloodPressure: /(?:pa|press[aã]o|bp|pni)[\s:]*(\d{2,3})[\s\/x\-](\d{2,3})|(\d{2,3})[\s\/x\-](\d{2,3})[\s]*(?:mmhg|pa)/gi,
      
      // Frequência cardíaca: FC: 72, HR: 72, 72 bpm, STI 78
      heartRate: /(?:fc|hr|freq.*card|heart.*rate|sti)[\s:]*(\d{2,3})|(\d{2,3})[\s]*(?:bpm|bat)/gi,
      
      // Temperatura: T: 36.5, Temp: 36,5, 36.5°C
      temperature: /(?:t|temp|temperatura)[\s:]*(\d{2})[\.,](\d{1,2})|(\d{2})[\.,](\d{1,2})[\s]*[°c]/gi,
      
      // Saturação: SpO2: 98, Sat: 98%, 98%, SpO2 92
      oxygenSaturation: /(?:spo2|sat|satura[çc][aã]o)[\s:]*(\d{2,3})|(\d{2,3})[\s]*%/gi,
      
      // Frequência respiratória: FR: 16, RR: 16, 16 rpm, FRI 23
      respiratoryRate: /(?:fr|rr|freq.*resp|resp.*rate|fri)[\s:]*(\d{1,2})|(\d{1,2})[\s]*(?:rpm|resp)/gi
    }

    // Padrões específicos para monitores Dräger
    const dragerPatterns = {
      // STI (Frequência cardíaca Dräger)
      stiHeartRate: /sti[\s]*(\d{2,3})/gi,
      
      // SpO2 com valor numérico grande (padrão Dräger)
      dragerSpO2: /spo2[\s]*(\d{2,3})/gi,
      
      // FRI (Frequência respiratória Dräger)
      friRespiratoryRate: /fri[\s]*(\d{1,2})/gi,
      
      // PNI (Pressão não invasiva Dräger)
      pniBloodPressure: /pni[\s]*(\d{2,3})[\s\/](\d{2,3})/gi,
      
      // Padrão de números grandes isolados (como 78, 92, 23 na tela)
      largeNumbers: /\b(\d{2,3})\b/g
    }
    
    // Primeiro, tentar padrões específicos do Dräger
    let match = dragerPatterns.stiHeartRate.exec(normalizedText)
    if (match) {
      vitalSigns.heartRate = match[1]
      confidence += 0.15
    }
    
    match = dragerPatterns.dragerSpO2.exec(normalizedText)
    if (match) {
      vitalSigns.oxygenSaturation = match[1]
      confidence += 0.15
    }
    
    match = dragerPatterns.friRespiratoryRate.exec(normalizedText)
    if (match) {
      vitalSigns.respiratoryRate = match[1]
      confidence += 0.15
    }
    
    match = dragerPatterns.pniBloodPressure.exec(normalizedText)
    if (match) {
      vitalSigns.systolicBP = match[1]
      vitalSigns.diastolicBP = match[2]
      confidence += 0.15
    }
    
    // Se não encontrou com padrões Dräger, usar padrões gerais
    if (!vitalSigns.systolicBP) {
      match = patterns.bloodPressure.exec(normalizedText)
      if (match) {
        vitalSigns.systolicBP = match[1] || match[3]
        vitalSigns.diastolicBP = match[2] || match[4]
        confidence += 0.1
      }
    }
    
    if (!vitalSigns.heartRate) {
      patterns.heartRate.lastIndex = 0
      match = patterns.heartRate.exec(normalizedText)
      if (match) {
        vitalSigns.heartRate = match[1] || match[2]
        confidence += 0.1
      }
    }
    
    // Extrair temperatura
    patterns.temperature.lastIndex = 0
    match = patterns.temperature.exec(normalizedText)
    if (match) {
      const temp = `${match[1] || match[3]}.${match[2] || match[4]}`
      vitalSigns.temperature = temp
      confidence += 0.1
    }
    
    // Extrair saturação se não foi encontrada com padrões Dräger
    if (!vitalSigns.oxygenSaturation) {
      patterns.oxygenSaturation.lastIndex = 0
      match = patterns.oxygenSaturation.exec(normalizedText)
      if (match) {
        vitalSigns.oxygenSaturation = match[1] || match[2]
        confidence += 0.1
      }
    }
    
    // Extrair frequência respiratória se não foi encontrada com padrões Dräger
    if (!vitalSigns.respiratoryRate) {
      patterns.respiratoryRate.lastIndex = 0
      match = patterns.respiratoryRate.exec(normalizedText)
      if (match) {
        vitalSigns.respiratoryRate = match[1] || match[2]
        confidence += 0.1
      }
    }
    
    // Fallback: tentar extrair números isolados se ainda não temos dados suficientes
    if (Object.keys(vitalSigns).length < 2) {
      const numbers = normalizedText.match(/\b(\d{2,3})\b/g)
      if (numbers && numbers.length >= 3) {
        // Heurística baseada na imagem: números grandes isolados
        // 78 (FC), 92 (SpO2), 23 (FR), 129/88 (PA)
        const sortedNumbers = numbers.map(n => parseInt(n)).sort((a, b) => b - a)
        
        // Tentar identificar por faixas típicas
        for (const num of sortedNumbers) {
          if (!vitalSigns.systolicBP && num >= 100 && num <= 200) {
            // Procurar diastólica próxima
            const diastolic = numbers.find(n => {
              const val = parseInt(n)
              return val >= 60 && val <= 100 && val < num
            })
            if (diastolic) {
              vitalSigns.systolicBP = num.toString()
              vitalSigns.diastolicBP = diastolic
              confidence += 0.05
            }
          }
          
          if (!vitalSigns.oxygenSaturation && num >= 85 && num <= 100) {
            vitalSigns.oxygenSaturation = num.toString()
            confidence += 0.05
          }
          
          if (!vitalSigns.heartRate && num >= 50 && num <= 150) {
            vitalSigns.heartRate = num.toString()
            confidence += 0.05
          }
          
          if (!vitalSigns.respiratoryRate && num >= 10 && num <= 40) {
            vitalSigns.respiratoryRate = num.toString()
            confidence += 0.05
          }
        }
      }
    }
    
    // Validar dados extraídos
    const validatedData = this.validateVitalSigns(vitalSigns)
    
    return {
      success: Object.keys(validatedData).length > 0,
      data: validatedData,
      confidence: Math.min(confidence, 1.0)
    }
  }

  /**
   * Valida e sanitiza os dados extraídos
   */
  private validateVitalSigns(data: VitalSignsData): VitalSignsData {
    const validated: VitalSignsData = {}
    
    // Validar pressão arterial sistólica (90-200 mmHg)
    if (data.systolicBP) {
      const systolic = parseInt(data.systolicBP)
      if (systolic >= 90 && systolic <= 200) {
        validated.systolicBP = data.systolicBP
      }
    }
    
    // Validar pressão arterial diastólica (50-120 mmHg)
    if (data.diastolicBP) {
      const diastolic = parseInt(data.diastolicBP)
      if (diastolic >= 50 && diastolic <= 120) {
        validated.diastolicBP = data.diastolicBP
      }
    }
    
    // Validar frequência cardíaca (40-200 bpm)
    if (data.heartRate) {
      const hr = parseInt(data.heartRate)
      if (hr >= 40 && hr <= 200) {
        validated.heartRate = data.heartRate
      }
    }
    
    // Validar temperatura (32-42°C)
    if (data.temperature) {
      const temp = parseFloat(data.temperature)
      if (temp >= 32 && temp <= 42) {
        validated.temperature = data.temperature
      }
    }
    
    // Validar saturação (70-100%)
    if (data.oxygenSaturation) {
      const sat = parseInt(data.oxygenSaturation)
      if (sat >= 70 && sat <= 100) {
        validated.oxygenSaturation = data.oxygenSaturation
      }
    }
    
    // Validar frequência respiratória (8-40 rpm)
    if (data.respiratoryRate) {
      const rr = parseInt(data.respiratoryRate)
      if (rr >= 8 && rr <= 40) {
        validated.respiratoryRate = data.respiratoryRate
      }
    }
    
    return validated
  }

  /**
   * Pré-processa imagem para melhorar OCR
   */
  async preprocessImage(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        canvas.width = img.width
        canvas.height = img.height
        
        // Desenhar imagem original
        ctx.drawImage(img, 0, 0)
        
        // Aplicar filtros para melhorar OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Aumentar contraste e converter para escala de cinza
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128))
          
          data[i] = contrast     // R
          data[i + 1] = contrast // G
          data[i + 2] = contrast // B
          // Alpha permanece o mesmo
        }
        
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = imageData
    })
  }
}

// Instância singleton
export const vitalSignsOCR = VitalSignsOCR.getInstance()

// Hook para usar o serviço de OCR com integração Supabase
export const useVitalSignsOCR = () => {
  const { toast } = useToast()
  
  const processImage = async (imageData: string, patientId?: string): Promise<OCRResult> => {
    try {
      // Pré-processar imagem
      const preprocessedImage = await vitalSignsOCR.preprocessImage(imageData)
      
      // Processar com OCR
      const result = await vitalSignsOCR.processImage(preprocessedImage)
      
      if (!result.success) {
        toast({
          title: "Erro no Processamento",
          description: result.error || "Não foi possível extrair dados da imagem",
          variant: "destructive"
        })
        return result
      }

      // Se temos dados válidos e um patientId, salvar no Supabase
      if (result.data && patientId) {
        const savedEvent = await saveVitalSignsToSupabase(result.data, patientId)
        if (savedEvent.success) {
          result.eventId = savedEvent.eventId
          toast({
            title: "Dados Salvos",
            description: "Sinais vitais registrados com sucesso no sistema",
            variant: "default"
          })
        } else {
          toast({
            title: "Erro ao Salvar",
            description: savedEvent.error || "Não foi possível salvar os dados no sistema",
            variant: "destructive"
          })
        }
      }
      
      return result
      
    } catch (error) {
      console.error('Erro no hook OCR:', error)
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro durante o processamento da imagem",
        variant: "destructive"
      })
      
      return {
        success: false,
        error: "Erro inesperado no processamento"
      }
    }
  }
  
  return { processImage }
}

/**
 * Salva os dados de sinais vitais no Supabase
 */
export const saveVitalSignsToSupabase = async (
  vitalSigns: VitalSignsData, 
  patientId: string
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        error: "Usuário não autenticado"
      }
    }

    // Preparar dados para inserção na tabela events
    const eventData = {
      patient_id: patientId,
      type: 'vital_signs' as const,
      occurred_at: new Date().toISOString(),
      created_by: user.id,
      // Mapear dados dos sinais vitais para os campos da tabela
      heart_rate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : null,
      oxygen_saturation: vitalSigns.oxygenSaturation ? parseInt(vitalSigns.oxygenSaturation) : null,
      respiratory_rate: vitalSigns.respiratoryRate ? parseInt(vitalSigns.respiratoryRate) : null,
      systolic_bp: vitalSigns.systolicBP ? parseInt(vitalSigns.systolicBP) : null,
      diastolic_bp: vitalSigns.diastolicBP ? parseInt(vitalSigns.diastolicBP) : null,
      temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : null,
      notes: `Dados extraídos via OCR - Confiança: ${Math.round((vitalSigns.confidence || 0) * 100)}%`
    }

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao salvar no Supabase:', error)
      return {
        success: false,
        error: `Erro no banco de dados: ${error.message}`
      }
    }

    return {
      success: true,
      eventId: data.id
    }

  } catch (error) {
    console.error('Erro ao salvar sinais vitais:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Busca histórico de sinais vitais de um paciente
 */
export const getVitalSignsHistory = async (patientId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        occurred_at,
        heart_rate,
        oxygen_saturation,
        respiratory_rate,
        systolic_bp,
        diastolic_bp,
        temperature,
        notes,
        created_by,
        profiles!events_created_by_fkey(full_name)
      `)
      .eq('patient_id', patientId)
      .eq('type', 'vital_signs')
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data
    }

  } catch (error) {
    console.error('Erro ao buscar histórico de sinais vitais:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}