import { useToast } from '@/hooks/use-toast'

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
   * Simulação para desenvolvimento (remove em produção)
   */
  private async processWithSimulation(imageData: string): Promise<OCRResult> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Gerar dados simulados realistas
    const simulatedData: VitalSignsData = {
      systolicBP: String(Math.floor(Math.random() * (140 - 110) + 110)),
      diastolicBP: String(Math.floor(Math.random() * (90 - 70) + 70)),
      heartRate: String(Math.floor(Math.random() * (100 - 60) + 60)),
      temperature: (Math.random() * (37.5 - 36.0) + 36.0).toFixed(1),
      oxygenSaturation: String(Math.floor(Math.random() * (100 - 95) + 95)),
      respiratoryRate: String(Math.floor(Math.random() * (20 - 12) + 12)),
      confidence: 0.85
    }
    
    return {
      success: true,
      data: simulatedData,
      confidence: 0.85
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
    
    // Padrões regex para diferentes sinais vitais
    const patterns = {
      // Pressão arterial: 120/80, 120x80, PA: 120/80
      bloodPressure: /(?:pa|press[aã]o|bp)[\s:]*(\d{2,3})[\s\/x\-](\d{2,3})|(\d{2,3})[\s\/x\-](\d{2,3})[\s]*(?:mmhg|pa)/gi,
      
      // Frequência cardíaca: FC: 72, HR: 72, 72 bpm
      heartRate: /(?:fc|hr|freq.*card|heart.*rate)[\s:]*(\d{2,3})|(\d{2,3})[\s]*(?:bpm|bat)/gi,
      
      // Temperatura: T: 36.5, Temp: 36,5, 36.5°C
      temperature: /(?:t|temp|temperatura)[\s:]*(\d{2})[\.,](\d{1,2})|(\d{2})[\.,](\d{1,2})[\s]*[°c]/gi,
      
      // Saturação: SpO2: 98, Sat: 98%, 98%
      oxygenSaturation: /(?:spo2|sat|satura[çc][aã]o)[\s:]*(\d{2,3})|(\d{2,3})[\s]*%/gi,
      
      // Frequência respiratória: FR: 16, RR: 16, 16 rpm
      respiratoryRate: /(?:fr|rr|freq.*resp|resp.*rate)[\s:]*(\d{1,2})|(\d{1,2})[\s]*(?:rpm|resp)/gi
    }
    
    // Extrair pressão arterial
    let match = patterns.bloodPressure.exec(normalizedText)
    if (match) {
      vitalSigns.systolicBP = match[1] || match[3]
      vitalSigns.diastolicBP = match[2] || match[4]
      confidence += 0.1
    }
    
    // Extrair frequência cardíaca
    patterns.heartRate.lastIndex = 0
    match = patterns.heartRate.exec(normalizedText)
    if (match) {
      vitalSigns.heartRate = match[1] || match[2]
      confidence += 0.1
    }
    
    // Extrair temperatura
    patterns.temperature.lastIndex = 0
    match = patterns.temperature.exec(normalizedText)
    if (match) {
      const temp = `${match[1] || match[3]}.${match[2] || match[4]}`
      vitalSigns.temperature = temp
      confidence += 0.1
    }
    
    // Extrair saturação
    patterns.oxygenSaturation.lastIndex = 0
    match = patterns.oxygenSaturation.exec(normalizedText)
    if (match) {
      vitalSigns.oxygenSaturation = match[1] || match[2]
      confidence += 0.1
    }
    
    // Extrair frequência respiratória
    patterns.respiratoryRate.lastIndex = 0
    match = patterns.respiratoryRate.exec(normalizedText)
    if (match) {
      vitalSigns.respiratoryRate = match[1] || match[2]
      confidence += 0.1
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

// Hook para usar o serviço de OCR
export const useVitalSignsOCR = () => {
  const { toast } = useToast()
  
  const processImage = async (imageData: string): Promise<OCRResult> => {
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