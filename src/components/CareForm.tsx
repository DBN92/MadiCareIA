import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { VitalSignsCamera } from "@/components/VitalSignsCamera"
import { VitalSignsData } from "@/services/vitalSignsOCR"
import { 
  Droplets, 
  Utensils, 
  Pill, 
  Activity, 
  WashingMachine,
  Save,
  Clock,
  Heart,
  Smile,
  Camera
} from "lucide-react"

interface CareFormProps {
  patientId?: string
  onSave?: (data: any) => void
}

export function CareForm({ patientId, onSave }: CareFormProps) {
  const [activeTab, setActiveTab] = useState("liquids")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  // Função para obter data e hora atual no formato correto
  const getCurrentDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  // Estados para cada tipo de formulário
  const [liquidForm, setLiquidForm] = useState({
    type: "",
    amount: "",
    time: getCurrentDateTime(),
    notes: ""
  })
  
  const [foodForm, setFoodForm] = useState({
    type: "",
    amount: "",
    time: getCurrentDateTime(),
    description: ""
  })
  
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    dosage: "",
    route: "",
    time: getCurrentDateTime(),
    notes: ""
  })
  
  const [drainForm, setDrainForm] = useState({
    type: "",
    leftAmount: "",
    rightAmount: "",
    leftAspect: "",
    rightAspect: "",
    time: getCurrentDateTime(),
    notes: ""
  })
  
  const [bathroomForm, setBathroomForm] = useState({
    type: "",
    volume: "", // Campo opcional para volume de urina em ML
    time: getCurrentDateTime(),
    notes: ""
  })
  
  const [vitalSignsForm, setVitalSignsForm] = useState({
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
    respiratoryRate: "",
    time: getCurrentDateTime(),
    notes: ""
  })

  const [humorForm, setHumorForm] = useState({
    moodScale: "",
    happinessScale: "",
    time: getCurrentDateTime(),
    notes: ""
  })

  // Estado para controlar o modal da câmera
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  
  // Função para processar dados extraídos da câmera
  const handleCameraDataExtracted = (data: VitalSignsData) => {
    setVitalSignsForm(prev => ({
      ...prev,
      systolicBP: data.systolicBP || prev.systolicBP,
      diastolicBP: data.diastolicBP || prev.diastolicBP,
      heartRate: data.heartRate || prev.heartRate,
      temperature: data.temperature || prev.temperature,
      oxygenSaturation: data.oxygenSaturation || prev.oxygenSaturation,
      respiratoryRate: data.respiratoryRate || prev.respiratoryRate
    }))
    
    toast({
      title: "Dados Preenchidos",
      description: "Os campos foram preenchidos automaticamente com os dados da imagem.",
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      toast({
        title: "Erro",
        description: "Nenhum paciente selecionado",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    
    try {
      let data: any = {
        patient_id: patientId,
        occurred_at: new Date().toISOString() // Será sobrescrito com a data selecionada
      }
      let validationError = ""
      
      switch (activeTab) {
        case "liquids":
          if (!liquidForm.type) validationError = "Tipo de líquido é obrigatório"
          else if (!liquidForm.amount || parseFloat(liquidForm.amount) <= 0) validationError = "Quantidade deve ser maior que zero"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(liquidForm.time).toISOString(),
            type: "meal",
            volume_ml: parseInt(liquidForm.amount),
            notes: `Líquido: ${liquidForm.type}${liquidForm.notes ? ' - ' + liquidForm.notes : ''}`
          }
          break
          
        case "food":
          if (!foodForm.type) validationError = "Tipo de refeição é obrigatório"
          else if (!foodForm.amount || parseFloat(foodForm.amount) <= 0) validationError = "Quantidade deve ser maior que zero"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(foodForm.time).toISOString(),
            type: "meal",
            notes: `Refeição: ${foodForm.type} - ${foodForm.amount}%${foodForm.description ? ' - ' + foodForm.description : ''}`
          }
          break
          
        case "bathroom":
          if (!bathroomForm.type) validationError = "Tipo de eliminação é obrigatório"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(bathroomForm.time).toISOString(),
            type: "bathroom",
            bathroom_type: bathroomForm.type,
            volume_ml: bathroomForm.volume ? parseInt(bathroomForm.volume) : null,
            notes: bathroomForm.notes
          }
          break

        case "humor":
          if (!humorForm.moodScale && !humorForm.happinessScale) validationError = "É necessário preencher pelo menos uma escala (humor ou felicidade)"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(humorForm.time).toISOString(),
            type: "mood",
            mood_scale: parseInt(humorForm.moodScale),
            happiness_scale: humorForm.happinessScale ? parseInt(humorForm.happinessScale) : null,
            mood_notes: humorForm.notes,
            notes: humorForm.notes
          }
          break

        case "medication":
          if (!medicationForm.name) validationError = "Nome da medicação é obrigatório"
          else if (!medicationForm.dosage) validationError = "Dosagem é obrigatória"
          else if (!medicationForm.route) validationError = "Via de administração é obrigatória"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(medicationForm.time).toISOString(),
            type: "medication",
            notes: `Medicação: ${medicationForm.name} - ${medicationForm.dosage} - ${medicationForm.route}${medicationForm.notes ? ' - ' + medicationForm.notes : ''}`
          }
          break

        case "drain":
          if (!drainForm.type) validationError = "Tipo de dreno é obrigatório"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(drainForm.time).toISOString(),
            type: "drain",
            notes: `Dreno: ${drainForm.type}${drainForm.leftAmount ? ' - Esquerdo: ' + drainForm.leftAmount + 'ml' : ''}${drainForm.rightAmount ? ' - Direito: ' + drainForm.rightAmount + 'ml' : ''}${drainForm.notes ? ' - ' + drainForm.notes : ''}`
          }
          break

        case "vitals":
          if (!vitalSignsForm.systolicBP && !vitalSignsForm.diastolicBP && !vitalSignsForm.heartRate && 
              !vitalSignsForm.temperature && !vitalSignsForm.oxygenSaturation && !vitalSignsForm.respiratoryRate) {
            validationError = "Pelo menos um sinal vital deve ser preenchido"
          }
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(vitalSignsForm.time).toISOString(),
            type: "vital_signs",
            notes: `Sinais Vitais - ${vitalSignsForm.systolicBP ? 'PA: ' + vitalSignsForm.systolicBP + '/' + vitalSignsForm.diastolicBP + ' mmHg' : ''}${vitalSignsForm.heartRate ? ' - FC: ' + vitalSignsForm.heartRate + ' bpm' : ''}${vitalSignsForm.temperature ? ' - Temp: ' + vitalSignsForm.temperature + '°C' : ''}${vitalSignsForm.oxygenSaturation ? ' - SpO2: ' + vitalSignsForm.oxygenSaturation + '%' : ''}${vitalSignsForm.respiratoryRate ? ' - FR: ' + vitalSignsForm.respiratoryRate + ' rpm' : ''}${vitalSignsForm.notes ? ' - ' + vitalSignsForm.notes : ''}`
          }
          break
      }
      
      // Resetar formulário após sucesso
      switch (activeTab) {
        case "liquids":
          setLiquidForm({ type: "", amount: "", time: getCurrentDateTime(), notes: "" })
          break
        case "food":
          setFoodForm({ type: "", amount: "", time: getCurrentDateTime(), description: "" })
          break
        case "bathroom":
          setBathroomForm({ type: "", volume: "", time: getCurrentDateTime(), notes: "" })
          break
        case "humor":
          setHumorForm({ moodScale: "", happinessScale: "", time: getCurrentDateTime(), notes: "" })
          break
        case "medication":
          setMedicationForm({ name: "", dosage: "", route: "", time: getCurrentDateTime(), notes: "" })
          break
        case "drain":
          setDrainForm({ type: "", leftAmount: "", rightAmount: "", leftAspect: "", rightAspect: "", time: getCurrentDateTime(), notes: "" })
          break
        case "vitals":
          setVitalSignsForm({ systolicBP: "", diastolicBP: "", heartRate: "", temperature: "", oxygenSaturation: "", respiratoryRate: "", time: getCurrentDateTime(), notes: "" })
          break
      }
      
      toast({
        title: "Sucesso",
        description: "Cuidado registrado com sucesso!",
      })
      
      if (onSave) {
        onSave(data)
      }
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar cuidado",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="medical-card">
        <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-lg sm:text-xl'}`}>
            <Activity className={`text-primary ${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'}`} />
            Registro de Cuidados
          </CardTitle>
          <CardDescription className={`${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}>
            Registre os cuidados realizados para o paciente
          </CardDescription>
        </CardHeader>
      
      <CardContent className={`${isMobile ? 'p-3' : 'p-3 sm:p-4 lg:p-6'}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-4 h-auto p-1 bg-muted/50 ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-4 sm:mb-6'}`}>
            <TabsTrigger value="liquids" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Droplets className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Líquidos</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Líq.</span>
            </TabsTrigger>
            <TabsTrigger value="food" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Utensils className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Alimentos</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Alim.</span>
            </TabsTrigger>
            <TabsTrigger value="bathroom" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Activity className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Banheiro</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Banh.</span>
            </TabsTrigger>
            <TabsTrigger value="humor" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Smile className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Humor</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Humor</span>
            </TabsTrigger>
            <TabsTrigger value="medication" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Pill className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Medicação</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Med.</span>
            </TabsTrigger>
            <TabsTrigger value="drain" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <WashingMachine className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Dreno</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Dreno</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Heart className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Sinais Vitais</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Vitais</span>
            </TabsTrigger>
          </TabsList>

          {/* Líquidos */}
          <TabsContent value="liquids" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="liquid-type" className="text-sm font-medium">Tipo de Líquido *</Label>
                  <Select value={liquidForm.type} onValueChange={(value) => setLiquidForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Água">Água</SelectItem>
                      <SelectItem value="Suco">Suco</SelectItem>
                      <SelectItem value="Chá">Chá</SelectItem>
                      <SelectItem value="Leite">Leite</SelectItem>
                      <SelectItem value="Sopa">Sopa</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="liquid-amount" className="text-sm font-medium">Quantidade (ml) *</Label>
                  <Input 
                    id="liquid-amount" 
                    type="number" 
                    placeholder="0" 
                    value={liquidForm.amount}
                    onChange={(e) => setLiquidForm(prev => ({ ...prev, amount: e.target.value }))}
                    min="1"
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="liquid-time" className="text-sm font-medium">Horário</Label>
                <Input 
                  id="liquid-time" 
                  type="datetime-local" 
                  value={liquidForm.time}
                  onChange={(e) => setLiquidForm(prev => ({ ...prev, time: e.target.value }))}
                  className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                />
              </div>
              
              <div>
                <Label htmlFor="liquid-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="liquid-notes" 
                  placeholder="Observações adicionais..." 
                  value={liquidForm.notes}
                  onChange={(e) => setLiquidForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
              >
                <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </TabsContent>

          {/* Alimentos */}
          <TabsContent value="food" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="food-type" className="text-sm font-medium">Tipo de Refeição *</Label>
                  <Select value={foodForm.type} onValueChange={(value) => setFoodForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Café da Manhã">Café da Manhã</SelectItem>
                      <SelectItem value="Almoço">Almoço</SelectItem>
                      <SelectItem value="Jantar">Jantar</SelectItem>
                      <SelectItem value="Lanche">Lanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="food-amount" className="text-sm font-medium">Quantidade Consumida (%) *</Label>
                  <Input 
                    id="food-amount" 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    value={foodForm.amount}
                    onChange={(e) => setFoodForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="food-time" className="text-sm font-medium">Horário</Label>
                <Input 
                  id="food-time" 
                  type="datetime-local" 
                  value={foodForm.time}
                  onChange={(e) => setFoodForm(prev => ({ ...prev, time: e.target.value }))}
                  className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                />
              </div>
              
              <div>
                  <Label htmlFor="food-description" className="text-sm font-medium">Descrição dos Alimentos</Label>
                  <Textarea 
                    id="food-description" 
                    placeholder="Descreva os alimentos consumidos..." 
                    value={foodForm.description}
                    onChange={(e) => setFoodForm(prev => ({ ...prev, description: e.target.value }))}
                    className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
                >
                  <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                  {loading ? "Salvando..." : "Salvar Registro"}
                </Button>
            </form>
          </TabsContent>

          {/* Medicamentos */}
          <TabsContent value="medication" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="med-name" className="text-sm font-medium">Nome do Medicamento *</Label>
                  <Input 
                    id="med-name" 
                    placeholder="Nome do medicamento" 
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                    value={medicationForm.name}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="med-dosage" className="text-sm font-medium">Dosagem *</Label>
                  <Input 
                    id="med-dosage" 
                    placeholder="Ex: 500mg" 
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="med-route" className="text-sm font-medium">Via de Administração *</Label>
                  <Select value={medicationForm.route} onValueChange={(value) => setMedicationForm(prev => ({ ...prev, route: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione a via" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oral">Oral</SelectItem>
                      <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                      <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                      <SelectItem value="Tópica">Tópica</SelectItem>
                      <SelectItem value="Outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="med-time" className="text-sm font-medium">Horário de Administração</Label>
                  <Input 
                    id="med-time" 
                    type="datetime-local" 
                    value={medicationForm.time}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, time: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="med-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="med-notes" 
                  placeholder="Reações, efeitos observados..." 
                  value={medicationForm.notes}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
              >
                <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </TabsContent>

          {/* Dreno */}
          <TabsContent value="drain" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="drain-type" className="text-sm font-medium">Tipo de Dreno *</Label>
                  <Select value={drainForm.type} onValueChange={(value) => setDrainForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Abdominal">Abdominal</SelectItem>
                      <SelectItem value="Torácico">Torácico</SelectItem>
                      <SelectItem value="Vesical">Vesical</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="drain-left-amount" className="text-sm font-medium">Volume Esquerdo (ml)</Label>
                  <Input 
                    id="drain-left-amount" 
                    type="number" 
                    placeholder="0" 
                    value={drainForm.leftAmount}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, leftAmount: e.target.value }))}
                    min="0"
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="drain-right-amount" className="text-sm font-medium">Volume Direito (ml)</Label>
                  <Input 
                    id="drain-right-amount" 
                    type="number" 
                    placeholder="0" 
                    value={drainForm.rightAmount}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, rightAmount: e.target.value }))}
                    min="0"
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="drain-left-aspect" className="text-sm font-medium">Aspecto Esquerdo</Label>
                  <Select value={drainForm.leftAspect} onValueChange={(value) => setDrainForm(prev => ({ ...prev, leftAspect: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o aspecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Claro">Claro</SelectItem>
                      <SelectItem value="Sanguinolento">Sanguinolento</SelectItem>
                      <SelectItem value="Purulento">Purulento</SelectItem>
                      <SelectItem value="Seroso">Seroso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="drain-right-aspect" className="text-sm font-medium">Aspecto Direito</Label>
                  <Select value={drainForm.rightAspect} onValueChange={(value) => setDrainForm(prev => ({ ...prev, rightAspect: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o aspecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Claro">Claro</SelectItem>
                      <SelectItem value="Sanguinolento">Sanguinolento</SelectItem>
                      <SelectItem value="Purulento">Purulento</SelectItem>
                      <SelectItem value="Seroso">Seroso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="drain-time" className="text-sm font-medium">Horário</Label>
                  <Input 
                    id="drain-time" 
                    type="datetime-local" 
                    value={drainForm.time}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, time: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="drain-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="drain-notes" 
                  placeholder="Observações sobre o débito..." 
                  value={drainForm.notes}
                  onChange={(e) => setDrainForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
              >
                <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </TabsContent>

          {/* Banheiro */}
          <TabsContent value="bathroom" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="bathroom-type" className="text-sm font-medium">Tipo *</Label>
                  <Select value={bathroomForm.type} onValueChange={(value) => setBathroomForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urine">Urina</SelectItem>
                      <SelectItem value="stool">Fezes</SelectItem>
                      <SelectItem value="mixed">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Campo de volume opcional para urina */}
                {(bathroomForm.type === "urine" || bathroomForm.type === "mixed") && (
                  <div>
                    <Label htmlFor="bathroom-volume" className="text-sm font-medium">Volume (ml) - Opcional</Label>
                    <Input 
                      id="bathroom-volume" 
                      type="number" 
                      placeholder="Ex: 250"
                      value={bathroomForm.volume}
                      onChange={(e) => setBathroomForm(prev => ({ ...prev, volume: e.target.value }))}
                      className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="bathroom-time" className="text-sm font-medium">Horário</Label>
                  <Input 
                    id="bathroom-time" 
                    type="datetime-local" 
                    value={bathroomForm.time}
                    onChange={(e) => setBathroomForm(prev => ({ ...prev, time: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bathroom-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="bathroom-notes" 
                  placeholder="Características, volume, cor..." 
                  value={bathroomForm.notes}
                  onChange={(e) => setBathroomForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
              >
                <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </TabsContent>

          {/* Sinais Vitais */}
          <TabsContent value="vitals" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              
              {/* Botão para captura por câmera - apenas em dispositivos móveis */}
              {isMobile && (
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full gap-2 h-12 text-base"
                  >
                    <Camera className="h-4 w-4" />
                    Capturar com Câmera
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Tire uma foto dos equipamentos para preencher automaticamente
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="systolic-bp" className="text-sm font-medium">Pressão Arterial Sistólica (mmHg)</Label>
                  <Input 
                    id="systolic-bp" 
                    type="number" 
                    placeholder="120" 
                    value={vitalSignsForm.systolicBP}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, systolicBP: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="diastolic-bp" className="text-sm font-medium">Pressão Arterial Diastólica (mmHg)</Label>
                  <Input 
                    id="diastolic-bp" 
                    type="number" 
                    placeholder="80" 
                    value={vitalSignsForm.diastolicBP}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, diastolicBP: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="heart-rate" className="text-sm font-medium">Frequência Cardíaca (bpm)</Label>
                  <Input 
                    id="heart-rate" 
                    type="number" 
                    placeholder="72" 
                    value={vitalSignsForm.heartRate}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, heartRate: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="temperature" className="text-sm font-medium">Temperatura (°C)</Label>
                  <Input 
                    id="temperature" 
                    type="number" 
                    step="0.1" 
                    placeholder="36.5" 
                    value={vitalSignsForm.temperature}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, temperature: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="oxygen-saturation" className="text-sm font-medium">Saturação de Oxigênio (%)</Label>
                  <Input 
                    id="oxygen-saturation" 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="98" 
                    value={vitalSignsForm.oxygenSaturation}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="respiratory-rate" className="text-sm font-medium">Frequência Respiratória (rpm)</Label>
                  <Input 
                    id="respiratory-rate" 
                    type="number" 
                    placeholder="16" 
                    value={vitalSignsForm.respiratoryRate}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vitals-time" className="text-sm font-medium">Horário</Label>
                <Input 
                  id="vitals-time" 
                  type="datetime-local" 
                  value={vitalSignsForm.time}
                  onChange={(e) => setVitalSignsForm(prev => ({ ...prev, time: e.target.value }))}
                  className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                />
              </div>
              
              <div>
                <Label htmlFor="vitals-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="vitals-notes" 
                  placeholder="Observações sobre os sinais vitais..." 
                  value={vitalSignsForm.notes}
                  onChange={(e) => setVitalSignsForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`resize-none ${isMobile ? 'min-h-[100px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className={`w-full gap-2 ${isMobile ? 'h-12 text-base' : 'h-10 sm:h-11'}`}
              >
                <Save className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro"}
              </Button>
            </form>
          </TabsContent>

          {/* Humor/Felicidade */}
          <TabsContent value="humor" className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
              <div className="grid grid-cols-1 gap-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-3">* Preencha pelo menos uma das escalas abaixo</p>
                </div>
                <div>
                  <Label htmlFor="mood-scale" className="text-sm font-medium">Escala de Humor (1-5)</Label>
                  <Select value={humorForm.moodScale} onValueChange={(value) => setHumorForm(prev => ({ ...prev, moodScale: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione o humor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Muito Triste 😢</SelectItem>
                      <SelectItem value="2">2 - Triste 😔</SelectItem>
                      <SelectItem value="3">3 - Neutro 😐</SelectItem>
                      <SelectItem value="4">4 - Feliz 😊</SelectItem>
                      <SelectItem value="5">5 - Muito Feliz 😄</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="happiness-scale" className="text-sm font-medium">Escala de Felicidade (1-5)</Label>
                  <Select value={humorForm.happinessScale} onValueChange={(value) => setHumorForm(prev => ({ ...prev, happinessScale: value }))}>
                    <SelectTrigger className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}>
                      <SelectValue placeholder="Selecione a felicidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Muito Infeliz 😭</SelectItem>
                      <SelectItem value="2">2 - Infeliz 😞</SelectItem>
                      <SelectItem value="3">3 - Neutro 😐</SelectItem>
                      <SelectItem value="4">4 - Feliz 😊</SelectItem>
                      <SelectItem value="5">5 - Muito Feliz 🥰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="humor-time" className="text-sm font-medium">Data e Hora *</Label>
                  <Input 
                    id="humor-time" 
                    type="datetime-local" 
                    value={humorForm.time}
                    onChange={(e) => setHumorForm(prev => ({ ...prev, time: e.target.value }))}
                    className={`${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="humor-notes" className="text-sm font-medium">Observações</Label>
                  <Textarea 
                    id="humor-notes" 
                    placeholder="Observações sobre o humor..." 
                    value={humorForm.notes}
                    onChange={(e) => setHumorForm(prev => ({ ...prev, notes: e.target.value }))}
                    className={`${isMobile ? 'min-h-[80px]' : 'min-h-[80px] sm:min-h-[100px]'}`}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className={`w-full ${isMobile ? 'h-12' : 'h-10 sm:h-11'}`}
              >
                <Save className={`mr-2 ${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
                {loading ? "Salvando..." : "Salvar Registro de Humor"}
              </Button>
            </form>
          </TabsContent></Tabs>
      </CardContent>
    </Card>
    
    {/* Modal da câmera para captura de sinais vitais */}
    <VitalSignsCamera
      isOpen={isCameraOpen}
      onClose={() => setIsCameraOpen(false)}
      onDataExtracted={handleCameraDataExtracted}
      patientId={patientId}
    />
  </>
  )
}

export default CareForm