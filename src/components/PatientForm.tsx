import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { usePatients } from "@/hooks/usePatients"
import { useFamilyAccess } from "@/hooks/useFamilyAccess"
import { UserPlus, X, Camera, Upload } from "lucide-react"

interface PatientFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export const PatientForm = ({ onClose, onSuccess }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "",
    admission_date: "",
    bed: "",
    notes: "",
    photo: "",
    is_active: true
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { addPatient } = usePatients()
  const { generateFamilyToken } = useFamilyAccess()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.birth_date || !formData.bed) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const newPatient = await addPatient(formData)
      
      // Gerar automaticamente um token familiar para o novo paciente
      try {
        await generateFamilyToken(newPatient.id)
        console.log('✅ Token familiar gerado automaticamente para:', newPatient.full_name)
      } catch (tokenError) {
        console.warn('⚠️ Erro ao gerar token familiar automático:', tokenError)
        // Não falhar a criação do paciente por causa do token
      }
      
      toast({
        title: "Sucesso",
        description: "Paciente adicionado com sucesso! Token familiar gerado automaticamente."
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o paciente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        })
        return
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setPhotoPreview(result)
        setFormData(prev => ({
          ...prev,
          photo: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoPreview(null)
    setFormData(prev => ({
      ...prev,
      photo: ""
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md sm:max-w-lg medical-card max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">Novo Paciente</span>
              </CardTitle>
              <CardDescription className="truncate">
                Cadastre um novo paciente no sistema
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de Foto */}
            <div className="space-y-2">
              <Label>Foto do Paciente</Label>
              <div className="flex flex-col items-center space-y-3">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview da foto"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{photoPreview ? 'Alterar Foto' : 'Adicionar Foto'}</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento *</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admission_date">Data de Internação</Label>
              <Input
                id="admission_date"
                name="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={handleChange}
                placeholder="Data opcional de internação"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bed">Leito *</Label>
              <Input
                id="bed"
                name="bed"
                value={formData.bed}
                onChange={handleChange}
                placeholder="Ex: 101-A"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observações sobre o paciente..."
                rows={3}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 w-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="medical"
                disabled={loading}
                className="flex-1 w-full"
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}