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
            type: "med",
            med_name: medicationForm.name,
            med_dose: medicationForm.dosage,
            notes: `Via: ${medicationForm.route}${medicationForm.notes ? ` - ${medicationForm.notes}` : ""}`
          }
          break
          
        case "drain":
          if (!drainForm.type) validationError = "Tipo de dreno é obrigatório"
          else if ((!drainForm.leftAmount || parseFloat(drainForm.leftAmount) <= 0) && (!drainForm.rightAmount || parseFloat(drainForm.rightAmount) <= 0)) validationError = "Pelo menos um volume (esquerdo ou direito) deve ser maior que zero"
          
          if (validationError) {
            throw new Error(validationError)
          }
          
          const leftVol = parseFloat(drainForm.leftAmount) || 0
          const rightVol = parseFloat(drainForm.rightAmount) || 0
          const totalVol = leftVol + rightVol
          
          let aspectInfo = ""
          if (drainForm.leftAspect && drainForm.rightAspect) {
            aspectInfo = `Esq: ${drainForm.leftAspect}, Dir: ${drainForm.rightAspect}`
          } else if (drainForm.leftAspect) {
            aspectInfo = `Esq: ${drainForm.leftAspect}`
          } else if (drainForm.rightAspect) {
            aspectInfo = `Dir: ${drainForm.rightAspect}`
          }
          
          data = {
            ...data,
            occurred_at: new Date(drainForm.time).toISOString(),
            type: "note",
            volume_ml: totalVol,
            notes: `Dreno ${drainForm.type} - Total: ${totalVol}ml (Esq: ${leftVol}ml, Dir: ${rightVol}ml)${aspectInfo ? ` - ${aspectInfo}` : ""}${drainForm.notes ? ` - ${drainForm.notes}` : ""}`
          }
          break
          
        case "bathroom":
          if (!bathroomForm.type) validationError = "Tipo é obrigatório"
          
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
      }
      
      // Usar addEvent diretamente em vez de onSave
      await addEvent(data)
      
      // Chamar onSave se fornecido (para compatibilidade)
      await onSave?.(data)
      
      // Limpar formulário após sucesso
      setLiquidForm({ type: "", amount: "", time: getCurrentDateTime(), notes: "" })
      setFoodForm({ type: "", amount: "", time: getCurrentDateTime(), description: "" })
      setMedicationForm({ name: "", dosage: "", route: "", time: getCurrentDateTime(), notes: "" })
      setDrainForm({ type: "", leftAmount: "", rightAmount: "", leftAspect: "", rightAspect: "", time: getCurrentDateTime(), notes: "" })
      setBathroomForm({ type: "", time: getCurrentDateTime(), notes: "" })
      setVitalSignsForm({ 
        systolicBP: "", 
        diastolicBP: "", 
        heartRate: "", 
        temperature: "", 
        oxygenSaturation: "", 
        respiratoryRate: "", 
        time: getCurrentDateTime(), 
        notes: "" 
      })
      
      toast({
        title: "Sucesso",
        description: "Registro salvo com sucesso!"
      })
      
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar registro",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="medical-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Registro de Cuidados
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Registre os cuidados realizados para o paciente
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="liquids" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Droplets className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Líquidos</span>
              <span className="sm:hidden">Líq.</span>
            </TabsTrigger>
            <TabsTrigger value="food" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Alimentos</span>
              <span className="sm:hidden">Alim.</span>
            </TabsTrigger>
            <TabsTrigger value="medication" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Medicamentos</span>
              <span className="sm:hidden">Med.</span>
            </TabsTrigger>
            <TabsTrigger value="drain" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <WashingMachine className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Drenos</span>
              <span className="sm:hidden">Dren.</span>
            </TabsTrigger>
            <TabsTrigger value="bathroom" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Banheiro</span>
              <span className="sm:hidden">Banh.</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex flex-col items-center gap-1 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sinais Vitais</span>
              <span className="sm:hidden">Vitais</span>
            </TabsTrigger>
          </TabsList>

          {/* Líquidos */}
          <TabsContent value="liquids" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="liquid-type" className="text-sm font-medium">Tipo de Líquido *</Label>
                  <Select value={liquidForm.type} onValueChange={(value) => setLiquidForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-10 sm:h-11">
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
                    className="h-10 sm:h-11"
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
                  className="h-10 sm:h-11"
                />
              </div>
              
              <div>
                <Label htmlFor="liquid-notes" className="text-sm font-medium">Observações</Label>
                <Textarea 
                  id="liquid-notes" 
                  placeholder="Observações adicionais..." 
                  value={liquidForm.notes}
                  onChange={(e) => setLiquidForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px] sm:min-h-[100px] resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full h-11 sm:h-12" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Registrar Líquidos"}
              </Button>
            </form>
          </TabsContent>

          {/* Alimentos */}
          <TabsContent value="food" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="food-type" className="text-sm font-medium">Tipo de Refeição *</Label>
                  <Select value={foodForm.type} onValueChange={(value) => setFoodForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-10 sm:h-11">
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
                    className="h-10 sm:h-11"
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
                  className="h-10 sm:h-11"
                />
              </div>
              
              <div>
                  <Label htmlFor="food-description" className="text-sm font-medium">Descrição dos Alimentos</Label>
                  <Textarea 
                    id="food-description" 
                    placeholder="Descreva os alimentos consumidos..." 
                    value={foodForm.description}
                    onChange={(e) => setFoodForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[80px] sm:min-h-[100px] resize-none"
                  />
                </div>
                
                <Button type="submit" className="w-full h-11 sm:h-12" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Registrar Alimentos"}
                </Button>
            </form>
          </TabsContent>

          {/* Medicamentos */}
          <TabsContent value="medication" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="med-name" className="text-sm font-medium">Nome do Medicamento *</Label>
                  <Input 
                    id="med-name" 
                    placeholder="Nome do medicamento" 
                    className="h-10 sm:h-11" 
                    value={medicationForm.name}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="med-dosage">Dosagem *</Label>
                  <Input 
                    id="med-dosage" 
                    placeholder="Ex: 500mg" 
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="med-route">Via de Administração</Label>
                  <Select value={medicationForm.route} onValueChange={(value) => setMedicationForm(prev => ({ ...prev, route: value }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="med-time">Horário de Administração</Label>
                  <Input 
                    id="med-time" 
                    type="datetime-local" 
                    value={medicationForm.time}
                    onChange={(e) => setMedicationForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="med-notes">Observações</Label>
                <Textarea 
                  id="med-notes" 
                  placeholder="Reações, efeitos observados..." 
                  value={medicationForm.notes}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Registrar Medicamento"}
              </Button>
            </form>
          </TabsContent>

          {/* Dreno */}
          <TabsContent value="drain" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="drain-type">Tipo de Dreno *</Label>
                  <Select value={drainForm.type} onValueChange={(value) => setDrainForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="drain-left-amount">Volume Esquerdo (ml)</Label>
                  <Input 
                    id="drain-left-amount" 
                    type="number" 
                    placeholder="0" 
                    value={drainForm.leftAmount}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, leftAmount: e.target.value }))}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="drain-right-amount">Volume Direito (ml)</Label>
                  <Input 
                    id="drain-right-amount" 
                    type="number" 
                    placeholder="0" 
                    value={drainForm.rightAmount}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, rightAmount: e.target.value }))}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="drain-left-aspect">Aspecto Esquerdo</Label>
                  <Select value={drainForm.leftAspect} onValueChange={(value) => setDrainForm(prev => ({ ...prev, leftAspect: value }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="drain-right-aspect">Aspecto Direito</Label>
                  <Select value={drainForm.rightAspect} onValueChange={(value) => setDrainForm(prev => ({ ...prev, rightAspect: value }))}>
                    <SelectTrigger>
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
                  <Label htmlFor="drain-time">Horário</Label>
                  <Input 
                    id="drain-time" 
                    type="datetime-local" 
                    value={drainForm.time}
                    onChange={(e) => setDrainForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="drain-notes">Observações</Label>
                <Textarea 
                  id="drain-notes" 
                  placeholder="Observações sobre o débito..." 
                  value={drainForm.notes}
                  onChange={(e) => setDrainForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Registrar Débito"}
              </Button>
            </form>
          </TabsContent>

          {/* Banheiro */}
          <TabsContent value="bathroom" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="bathroom-type">Tipo *</Label>
                  <Select value={bathroomForm.type} onValueChange={(value) => setBathroomForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urina">Urina</SelectItem>
                      <SelectItem value="Fezes">Fezes</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bathroom-time">Horário</Label>
                  <Input 
                    id="bathroom-time" 
                    type="datetime-local" 
                    value={bathroomForm.time}
                    onChange={(e) => setBathroomForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bathroom-notes">Observações</Label>
                <Textarea 
                  id="bathroom-notes" 
                  placeholder="Características, volume, cor..." 
                  value={bathroomForm.notes}
                  onChange={(e) => setBathroomForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Registrar Eliminação"}
              </Button>
            </form>
          </TabsContent>

          {/* Sinais Vitais */}
          <TabsContent value="vitals">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="systolic-bp">Pressão Arterial Sistólica (mmHg)</Label>
                  <Input 
                    id="systolic-bp" 
                    type="number" 
                    placeholder="120" 
                    value={vitalSignsForm.systolicBP}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, systolicBP: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="diastolic-bp">Pressão Arterial Diastólica (mmHg)</Label>
                  <Input 
                    id="diastolic-bp" 
                    type="number" 
                    placeholder="80" 
                    value={vitalSignsForm.diastolicBP}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, diastolicBP: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="heart-rate">Frequência Cardíaca (bpm)</Label>
                  <Input 
                    id="heart-rate" 
                    type="number" 
                    placeholder="72" 
                    value={vitalSignsForm.heartRate}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, heartRate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="temperature">Temperatura (°C)</Label>
                  <Input 
                    id="temperature" 
                    type="number" 
                    step="0.1" 
                    placeholder="36.5" 
                    value={vitalSignsForm.temperature}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, temperature: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="oxygen-saturation">Saturação de O2 (%)</Label>
                  <Input 
                    id="oxygen-saturation" 
                    type="number" 
                    placeholder="98" 
                    value={vitalSignsForm.oxygenSaturation}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="respiratory-rate">Frequência Respiratória (rpm)</Label>
                  <Input 
                    id="respiratory-rate" 
                    type="number" 
                    placeholder="16" 
                    value={vitalSignsForm.respiratoryRate}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vitals-time">Data e Hora</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="vitals-time" 
                    type="datetime-local" 
                    value={vitalSignsForm.time}
                    onChange={(e) => setVitalSignsForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="vitals-notes">Observações</Label>
                <Textarea 
                  id="vitals-notes" 
                  placeholder="Observações sobre os sinais vitais..." 
                  value={vitalSignsForm.notes}
                  onChange={(e) => setVitalSignsForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Registrar Sinais Vitais"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}