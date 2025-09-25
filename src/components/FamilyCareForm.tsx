import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useFamilyAccess, FamilyPermissions } from "@/hooks/useFamilyAccess"
import { Patient } from "@/hooks/usePatients"
import { useToast } from "@/hooks/use-toast"
import { 
  Heart, 
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  Save,
  X
} from "lucide-react"

interface FamilyCareFormProps {
  patient: Patient
  permissions?: FamilyPermissions | null
  onClose: () => void
  onSave: () => void
}

const FamilyCareForm = ({ patient, permissions, onClose, onSave }: FamilyCareFormProps) => {
  const [formData, setFormData] = useState({
    type: '' as 'drink' | 'meal' | 'med' | 'bathroom' | 'note' | '',
    occurred_at: (() => {
      const now = new Date()
      const offset = now.getTimezoneOffset() * 60000
      const localTime = new Date(now.getTime() - offset)
      return localTime.toISOString().slice(0, 16)
    })(),
    volume_ml: '',
    meal_desc: '',
    med_name: '',
    med_dose: '',
    bathroom_type: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const { addEvent } = useCareEvents()
  const { toast } = useToast()



  // Filtrar tipos de cuidado baseado nas permissões
  const getAllCareTypes = () => [
    { value: 'drink', label: 'Líquidos', icon: Droplets, color: 'text-blue-600', permission: 'canRegisterLiquids' },
    { value: 'meal', label: 'Alimentação', icon: Utensils, color: 'text-orange-600', permission: 'canRegisterMeals' },
    { value: 'med', label: 'Medicamentos', icon: Pill, color: 'text-green-600', permission: 'canRegisterMedications' },
    { value: 'bathroom', label: 'Banheiro', icon: Toilet, color: 'text-gray-600', permission: 'canRegisterActivities' },
    { value: 'note', label: 'Anotações', icon: Activity, color: 'text-purple-600', permission: 'canRegisterActivities' }
  ]

  const careTypes = permissions 
    ? getAllCareTypes().filter(type => permissions[type.permission])
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar se o usuário tem permissões de edição
    if (!permissions || !permissions.canEdit) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para registrar cuidados. Seu acesso é somente leitura.",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.type) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de cuidado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await addEvent({
        patient_id: patient.id,
        type: formData.type,
        occurred_at: formData.occurred_at,
        volume_ml: formData.volume_ml ? parseInt(formData.volume_ml) : undefined,
        meal_desc: formData.meal_desc || undefined,
        med_name: formData.med_name || undefined,
        med_dose: formData.med_dose || undefined,
        bathroom_type: formData.bathroom_type || undefined,
        notes: formData.notes || undefined
      })

      toast({
        title: "Sucesso",
        description: "Registro de cuidado adicionado com sucesso"
      })
      
      onSave()
      onClose()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar registro de cuidado",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'drink':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="volume_ml">Volume (ml)</Label>
              <Input
                id="volume_ml"
                type="number"
                placeholder="Ex: 250"
                value={formData.volume_ml}
                onChange={(e) => setFormData(prev => ({ ...prev, volume_ml: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'meal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="meal_desc">Descrição da Refeição</Label>
              <Input
                id="meal_desc"
                placeholder="Ex: Almoço - Arroz, feijão, frango"
                value={formData.meal_desc}
                onChange={(e) => setFormData(prev => ({ ...prev, meal_desc: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'med':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="med_name">Nome do Medicamento</Label>
              <Input
                id="med_name"
                placeholder="Ex: Dipirona"
                value={formData.med_name}
                onChange={(e) => setFormData(prev => ({ ...prev, med_name: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
            <div>
              <Label htmlFor="med_dose">Dosagem</Label>
              <Input
                id="med_dose"
                placeholder="Ex: 500mg"
                value={formData.med_dose}
                onChange={(e) => setFormData(prev => ({ ...prev, med_dose: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'bathroom':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bathroom_type">Tipo</Label>
              <Select 
                value={formData.bathroom_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, bathroom_type: value }))}
                disabled={!permissions || !permissions.canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urine">Urina</SelectItem>
                  <SelectItem value="stool">Fezes</SelectItem>
                  <SelectItem value="mixed">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
              {patient.photo ? (
                <img
                  src={patient.photo}
                  alt={`Foto de ${patient.full_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary/60" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Registrar Cuidado
              </CardTitle>
              <CardDescription>
                Adicionar novo registro de cuidado para {patient.full_name}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mensagem para usuários somente leitura */}
        {permissions && !permissions.canEdit && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800">
              <Activity className="h-4 w-4" />
              <span className="font-medium">Acesso Somente Leitura</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Você tem permissão apenas para visualizar os dados. Para registrar cuidados, solicite acesso de edição.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Cuidado */}
          <div>
            <Label htmlFor="type">Tipo de Cuidado *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              disabled={!permissions || !permissions.canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de cuidado" />
              </SelectTrigger>
              <SelectContent>
                {careTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora */}
          <div>
            <Label htmlFor="occurred_at">Data e Hora *</Label>
            <Input
              id="occurred_at"
              type="datetime-local"
              value={formData.occurred_at}
              onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
              disabled={!permissions || !permissions.canEdit}
              required
            />
          </div>

          {/* Campos específicos por tipo */}
          {renderTypeSpecificFields()}

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais sobre o cuidado..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={!permissions || !permissions.canEdit}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !permissions || !permissions.canEdit} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Registro
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default FamilyCareForm