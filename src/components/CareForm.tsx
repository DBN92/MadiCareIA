import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  Droplets, 
  Utensils, 
  Pill, 
  Activity, 
  WashingMachine,
  Save,
  Clock,
  Heart
} from "lucide-react"

interface CareFormProps {
  patientId?: string
  onSave?: (data: any) => void
}

export function CareForm({ patientId, onSave }: CareFormProps) {
  const [activeTab, setActiveTab] = useState("liquids")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { addEvent } = useCareEvents(patientId)
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
            type: "drink",
            volume_ml: parseInt(liquidForm.amount),
            notes: `${liquidForm.type}${liquidForm.notes ? ` - ${liquidForm.notes}` : ""}`
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
            meal_desc: `${foodForm.type} - ${foodForm.amount}% consumido${foodForm.description ? ` - ${foodForm.description}` : ""}`
          }
          break
          
        case "medication":
          if (!medicationForm.name) validationError = "Nome do medicamento é obrigatório"
          else if (!medicationForm.dosage) validationError = "Dosagem é obrigatória"
          else if (!medicationForm.route) validationError = "Via de administração é obrigatória"
          
          if (validationError) {
            throw new Error(validationError)
          }
          data = {
            ...data,
            occurred_at: new Date(medicationForm.time).toISOString(),
            type: "medication",
            medication_name: medicationForm.name,
            dosage: medicationForm.dosage,
            route: medicationForm.route,
            notes: medicationForm.notes
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
            drain_type: drainForm.type,
            left_amount: drainForm.leftAmount ? parseInt(drainForm.leftAmount) : null,
            right_amount: drainForm.rightAmount ? parseInt(drainForm.rightAmount) : null,
            left_aspect: drainForm.leftAspect,
            right_aspect: drainForm.rightAspect,
            notes: drainForm.notes
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
            notes: bathroomForm.notes
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
            systolic_bp: vitalSignsForm.systolicBP ? parseInt(vitalSignsForm.systolicBP) : null,
            diastolic_bp: vitalSignsForm.diastolicBP ? parseInt(vitalSignsForm.diastolicBP) : null,
            heart_rate: vitalSignsForm.heartRate ? parseInt(vitalSignsForm.heartRate) : null,
            temperature: vitalSignsForm.temperature ? parseFloat(vitalSignsForm.temperature) : null,
            oxygen_saturation: vitalSignsForm.oxygenSaturation ? parseInt(vitalSignsForm.oxygenSaturation) : null,
            respiratory_rate: vitalSignsForm.respiratoryRate ? parseInt(vitalSignsForm.respiratoryRate) : null,
            notes: vitalSignsForm.notes
          }
          break
      }
      
      await addEvent(data)
      
      // Reset form
      switch (activeTab) {
        case "liquids":
          setLiquidForm({ type: "", amount: "", time: getCurrentDateTime(), notes: "" })
          break
        case "food":
          setFoodForm({ type: "", amount: "", time: getCurrentDateTime(), description: "" })
          break
        case "medication":
          setMedicationForm({ name: "", dosage: "", route: "", time: getCurrentDateTime(), notes: "" })
          break
        case "drain":
          setDrainForm({ type: "", leftAmount: "", rightAmount: "", leftAspect: "", rightAspect: "", time: getCurrentDateTime(), notes: "" })
          break
        case "bathroom":
          setBathroomForm({ type: "", time: getCurrentDateTime(), notes: "" })
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
          <TabsList className={`grid w-full mb-4 h-auto p-1 bg-muted/50 ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6'}`}>
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
            <TabsTrigger value="medication" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Pill className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Medicamentos</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Med.</span>
            </TabsTrigger>
            <TabsTrigger value="drain" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <WashingMachine className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Drenos</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Dren.</span>
            </TabsTrigger>
            <TabsTrigger value="bathroom" className={`flex flex-col items-center gap-1 text-xs ${isMobile ? 'py-2 px-2 min-h-[60px]' : 'py-2 px-1 sm:px-2 sm:text-sm'}`}>
              <Activity className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3 sm:h-4 sm:w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'hidden sm:inline'}`}>Banheiro</span>
              <span className={`${isMobile ? 'hidden' : 'sm:hidden'}`}>Banh.</span>
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
                      <SelectItem value="urina">Urina</SelectItem>
                      <SelectItem value="fezes">Fezes</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
        </Tabs>
      </CardContent>
    </Card>
  )
}