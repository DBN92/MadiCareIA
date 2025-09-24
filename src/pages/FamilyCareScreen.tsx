import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCareEvents } from '@/hooks/useCareEvents'
import { useFamilyAccess } from '@/hooks/useFamilyAccess'
import { usePatients } from '@/hooks/usePatients'
import { FamilyLayout } from '@/components/FamilyLayout'
import { 
  Droplets, 
  Utensils, 
  Pill, 
  Bath, 
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const FamilyCareScreen = () => {
  const { patientId, token } = useParams<{ patientId: string; token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const { addEvent, loading: eventsLoading } = useCareEvents(patientId)
  const { validateTokenWithData, getPermissions } = useFamilyAccess()
  const { patients } = usePatients()
  
  const [patient, setPatient] = useState<any>(null)
  const [permissions, setPermissions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [careType, setCareType] = useState<string>('')
  const [formData, setFormData] = useState({
    volume_ml: '',
    meal_desc: '',
    med_name: '',
    med_dose: '',
    bathroom_type: '',
    notes: ''
  })

  // Validation and data loading
  useState(() => {
    const validateAccess = async () => {
      if (!patientId || !token) {
        navigate('/family/login')
        return
      }

      try {
        const result = await validateTokenWithData(patientId, token)
        if (!result.isValid || !result.patient || !result.tokenData) {
          navigate('/family/login')
          return
        }

        setPatient(result.patient)
        setPermissions(getPermissions(result.tokenData.role))
        
        if (!getPermissions(result.tokenData.role).canEdit) {
          navigate(`/family/${patientId}/${token}/dashboard`)
          return
        }
      } catch (error) {
        navigate('/family/login')
      } finally {
        setLoading(false)
      }
    }

    validateAccess()
  })

  const careTypes = [
    { id: 'drink', label: 'Hidratação', icon: Droplets, color: 'bg-blue-500' },
    { id: 'meal', label: 'Alimentação', icon: Utensils, color: 'bg-green-500' },
    { id: 'med', label: 'Medicação', icon: Pill, color: 'bg-purple-500' },
    { id: 'bathroom', label: 'Higiene', icon: Bath, color: 'bg-orange-500' },
    { id: 'note', label: 'Observação', icon: FileText, color: 'bg-gray-500' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!careType) return

    setSubmitting(true)
    try {
      const eventData = {
         patient_id: patientId!,
         type: careType as any,
         occurred_at: new Date().toISOString(),
         volume_ml: formData.volume_ml ? parseInt(formData.volume_ml) : undefined,
         meal_desc: formData.meal_desc || undefined,
         med_name: formData.med_name || undefined,
         med_dose: formData.med_dose || undefined,
         bathroom_type: formData.bathroom_type || undefined,
         notes: formData.notes || undefined
       }

      await addEvent(eventData)
      
      toast({
        title: "Registro adicionado",
        description: "Cuidado registrado com sucesso!",
      })

      // Reset form
      setCareType('')
      setFormData({
        volume_ml: '',
        meal_desc: '',
        med_name: '',
        med_dose: '',
        bathroom_type: '',
        notes: ''
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar cuidado. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!patient || !permissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Acesso negado</p>
        </div>
      </div>
    )
  }

  const renderCareForm = () => {
    const selectedType = careTypes.find(type => type.id === careType)
    
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            {selectedType && <selectedType.icon className="w-5 h-5" />}
            <span>Registrar {selectedType?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {careType === 'drink' && (
            <div>
              <Label htmlFor="volume">Volume (ml)</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume_ml}
                onChange={(e) => setFormData({...formData, volume_ml: e.target.value})}
                placeholder="Ex: 200"
              />
            </div>
          )}

          {careType === 'meal' && (
            <div>
              <Label htmlFor="meal">Descrição da Refeição</Label>
              <Textarea
                id="meal"
                value={formData.meal_desc}
                onChange={(e) => setFormData({...formData, meal_desc: e.target.value})}
                placeholder="Ex: Almoço - arroz, feijão, frango"
              />
            </div>
          )}

          {careType === 'med' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="medName">Medicamento</Label>
                <Input
                  id="medName"
                  value={formData.med_name}
                  onChange={(e) => setFormData({...formData, med_name: e.target.value})}
                  placeholder="Nome do medicamento"
                />
              </div>
              <div>
                <Label htmlFor="medDose">Dosagem</Label>
                <Input
                  id="medDose"
                  value={formData.med_dose}
                  onChange={(e) => setFormData({...formData, med_dose: e.target.value})}
                  placeholder="Ex: 1 comprimido"
                />
              </div>
            </div>
          )}

          {careType === 'bathroom' && (
            <div>
              <Label htmlFor="bathType">Tipo de Higiene</Label>
              <Select value={formData.bathroom_type} onValueChange={(value) => setFormData({...formData, bathroom_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banho">Banho</SelectItem>
                  <SelectItem value="escovacao">Escovação</SelectItem>
                  <SelectItem value="troca">Troca de Roupa</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Observações adicionais (opcional)"
              rows={2}
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              type="submit" 
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCareType('')}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <FamilyLayout patient={patient} permissions={permissions} currentPage="care">
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Care Type Selection */}
        {!careType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Selecionar Tipo de Cuidado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {careTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => setCareType(type.id)}
                  >
                    <div className={`w-8 h-8 rounded-full ${type.color} flex items-center justify-center mr-3`}>
                      <type.icon className="w-4 h-4 text-white" />
                    </div>
                    <span>{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Care Form */}
        {careType && (
          <form onSubmit={handleSubmit}>
            {renderCareForm()}
          </form>
        )}

        {/* Quick Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dica:</p>
                <p>Registre os cuidados imediatamente após realizá-los para maior precisão.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FamilyLayout>
  )
}

export default FamilyCareScreen