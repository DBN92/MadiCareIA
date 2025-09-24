import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Check, RotateCcw, Loader2, AlertCircle, SwitchCamera, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useVitalSignsOCR, VitalSignsData } from '@/services/vitalSignsOCR'

interface VitalSignsCameraProps {
  onDataExtracted: (data: VitalSignsData) => void
  onClose: () => void
  isOpen: boolean
}

export const VitalSignsCamera: React.FC<VitalSignsCameraProps> = ({
  onDataExtracted,
  onClose,
  isOpen
}) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<VitalSignsData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editableData, setEditableData] = useState<VitalSignsData | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const { toast } = useToast()
  const { processImage } = useVitalSignsOCR()

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setIsStreaming(true)
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive"
      })
    }
  }, [facingMode, toast])

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // Alternar câmera (frontal/traseira)
  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [stopCamera])

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converter para base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    stopCamera()
  }, [stopCamera])

  // Processar imagem capturada
  const handleProcessImage = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    
    try {
      const result = await processImage(capturedImage)
      
      if (result.success && result.data) {
        setExtractedData(result.data)
        setEditableData({ ...result.data }) // Cria cópia editável
        toast({
          title: "Dados Extraídos",
          description: `Confiança: ${Math.round((result.confidence || 0) * 100)}%`,
        })
      } else {
        toast({
          title: "Nenhum Dado Encontrado",
          description: "Não foi possível extrair sinais vitais da imagem. Tente novamente com uma imagem mais clara.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro no processamento:', error)
      toast({
        title: "Erro no Processamento",
        description: "Ocorreu um erro ao processar a imagem.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, processImage, toast])

  // Validar dados extraídos
  const validateData = useCallback((data: VitalSignsData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Validação de Pressão Arterial Sistólica
    if (data.systolicBP && (Number(data.systolicBP) < 70 || Number(data.systolicBP) > 250)) {
      errors.push('Pressão sistólica deve estar entre 70-250 mmHg')
    }
    
    // Validação de Pressão Arterial Diastólica
    if (data.diastolicBP && (Number(data.diastolicBP) < 40 || Number(data.diastolicBP) > 150)) {
      errors.push('Pressão diastólica deve estar entre 40-150 mmHg')
    }
    
    // Validação de Frequência Cardíaca
    if (data.heartRate && (Number(data.heartRate) < 30 || Number(data.heartRate) > 220)) {
      errors.push('Frequência cardíaca deve estar entre 30-220 bpm')
    }
    
    // Validação de Temperatura
    if (data.temperature && (Number(data.temperature) < 32 || Number(data.temperature) > 45)) {
      errors.push('Temperatura deve estar entre 32-45°C')
    }
    
    // Validação de Saturação de Oxigênio
    if (data.oxygenSaturation && (Number(data.oxygenSaturation) < 70 || Number(data.oxygenSaturation) > 100)) {
      errors.push('Saturação de oxigênio deve estar entre 70-100%')
    }
    
    // Validação de Frequência Respiratória
    if (data.respiratoryRate && (Number(data.respiratoryRate) < 8 || Number(data.respiratoryRate) > 60)) {
      errors.push('Frequência respiratória deve estar entre 8-60 rpm')
    }
    
    return { isValid: errors.length === 0, errors }
  }, [])

  // Iniciar edição dos dados
  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  // Cancelar edição
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    if (extractedData) {
      setEditableData({ ...extractedData })
    }
  }, [extractedData])

  // Salvar edição
  const saveEditing = useCallback(() => {
    if (!editableData) return
    
    const validation = validateData(editableData)
    
    if (!validation.isValid) {
      toast({
        title: "Dados Inválidos",
        description: validation.errors.join(', '),
        variant: "destructive"
      })
      return
    }
    
    setExtractedData(editableData)
    setIsEditing(false)
    
    toast({
      title: "Dados Atualizados",
      description: "Os dados foram validados e atualizados com sucesso.",
    })
  }, [editableData, validateData, toast])

  // Confirmar dados extraídos
  const confirmData = useCallback(() => {
    if (!extractedData) return
    
    const validation = validateData(extractedData)
    
    if (!validation.isValid) {
      toast({
        title: "Validação Necessária",
        description: "Por favor, corrija os dados antes de confirmar: " + validation.errors.join(', '),
        variant: "destructive"
      })
      return
    }
    
    onDataExtracted(extractedData)
    onClose()
  }, [extractedData, validateData, onDataExtracted, onClose, toast])

  // Recomeçar processo
  const restart = useCallback(() => {
    setCapturedImage(null)
    setExtractedData(null)
    setIsProcessing(false)
    startCamera()
  }, [startCamera])

  // Efeitos
  useEffect(() => {
    if (isOpen && !isStreaming && !capturedImage) {
      startCamera()
    }
    
    return () => {
      if (!isOpen) {
        stopCamera()
        setCapturedImage(null)
        setExtractedData(null)
        setIsProcessing(false)
      }
    }
  }, [isOpen, isStreaming, capturedImage, startCamera, stopCamera])

  // Alternar câmera quando facingMode muda
  useEffect(() => {
    if (isStreaming) {
      startCamera()
    }
  }, [facingMode, isStreaming, startCamera])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Captura de Sinais Vitais</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {!capturedImage 
              ? "Posicione o dispositivo sobre os dados dos sinais vitais"
              : extractedData 
                ? "Dados extraídos com sucesso"
                : "Processando imagem..."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Área de vídeo/imagem */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay de guia */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Posicione os dados aqui</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Imagem capturada"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Dados extraídos */}
          {extractedData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Dados Detectados:</h4>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    className="h-7 px-2"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              
              {!isEditing ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {extractedData.systolicBP && extractedData.diastolicBP && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">PA</Badge>
                      <span>{extractedData.systolicBP}/{extractedData.diastolicBP} mmHg</span>
                    </div>
                  )}
                  {extractedData.heartRate && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">FC</Badge>
                      <span>{extractedData.heartRate} bpm</span>
                    </div>
                  )}
                  {extractedData.temperature && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Temp</Badge>
                      <span>{extractedData.temperature}°C</span>
                    </div>
                  )}
                  {extractedData.oxygenSaturation && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">SpO2</Badge>
                      <span>{extractedData.oxygenSaturation}%</span>
                    </div>
                  )}
                  {extractedData.respiratoryRate && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">FR</Badge>
                      <span>{extractedData.respiratoryRate} rpm</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="systolic" className="text-xs">PA Sistólica (mmHg)</Label>
                      <Input
                        id="systolic"
                        type="number"
                        value={editableData?.systolicBP || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, systolicBP: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="diastolic" className="text-xs">PA Diastólica (mmHg)</Label>
                      <Input
                        id="diastolic"
                        type="number"
                        value={editableData?.diastolicBP || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, diastolicBP: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heartRate" className="text-xs">Freq. Cardíaca (bpm)</Label>
                      <Input
                        id="heartRate"
                        type="number"
                        value={editableData?.heartRate || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, heartRate: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature" className="text-xs">Temperatura (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={editableData?.temperature || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, temperature: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="36.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="oxygenSat" className="text-xs">Saturação O2 (%)</Label>
                      <Input
                        id="oxygenSat"
                        type="number"
                        value={editableData?.oxygenSaturation || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, oxygenSaturation: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="98"
                      />
                    </div>
                    <div>
                      <Label htmlFor="respRate" className="text-xs">Freq. Respiratória (rpm)</Label>
                      <Input
                        id="respRate"
                        type="number"
                        value={editableData?.respiratoryRate || ''}
                        onChange={(e) => setEditableData(prev => prev ? { ...prev, respiratoryRate: e.target.value } : null)}
                        className="h-8 text-sm"
                        placeholder="16"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={saveEditing}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            {!capturedImage ? (
              <>
                <Button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  disabled={!isStreaming}
                  className="px-3"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              </>
            ) : !extractedData ? (
              <>
                <Button
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  )}
                  {isProcessing ? 'Processando...' : 'Processar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={restart}
                  disabled={isProcessing}
                  className="px-3"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={confirmData}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  onClick={startEditing}
                  className="px-3"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={restart}
                  className="px-3"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}