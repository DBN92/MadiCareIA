import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCareEvents } from "@/hooks/useCareEvents"
import { Patient } from "@/hooks/usePatients"
import { FamilyPermissions } from "@/hooks/useFamilyAccess"
import FamilyCareForm from "@/components/FamilyCareForm"
import { 
  Heart, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  Plus,
  Eye,
  Lock,
  Info
} from "lucide-react"

interface FamilyCareProps {
  patient: Patient
  permissions?: FamilyPermissions | null
}

const FamilyCare = ({ patient, permissions }: FamilyCareProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showAddForm, setShowAddForm] = useState(false)
  
  const { events, refetch } = useCareEvents(patient.id)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drink': return Droplets
      case 'med': return Pill
      case 'note': return Activity
      case 'meal': return Utensils
      case 'bathroom': return Toilet
      default: return Heart
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'text-primary'
      case 'med': return 'text-secondary'
      case 'note': return 'text-accent'
      case 'meal': return 'text-muted-foreground'
      case 'bathroom': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'drink': return 'Líquidos'
      case 'med': return 'Medicamentos'
      case 'note': return 'Anotações'
      case 'meal': return 'Alimentação'
      case 'bathroom': return 'Banheiro'
      default: return 'Outros'
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'bg-primary/10 text-primary border-primary/20'
      case 'med': return 'bg-secondary/10 text-secondary border-secondary/20'
      case 'note': return 'bg-accent/10 text-accent border-accent/20'
      case 'meal': return 'bg-muted text-muted-foreground border-muted'
      case 'bathroom': return 'bg-muted text-muted-foreground border-muted'
      default: return 'bg-muted text-muted-foreground border-muted'
    }
  }

  // Filtrar eventos apenas do paciente específico
  const patientEvents = events.filter(event => event.patient_id === patient.id)

  // Aplicar filtros de busca e categoria
  const filteredEvents = patientEvents.filter(event => {
    const searchText = (event.notes || event.med_name || event.meal_desc || '').toLowerCase()
    const matchesSearch = searchText.includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || event.type === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Ordenar por data mais recente
  const sortedEvents = filteredEvents.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Registros de Cuidados</h2>
          <p className="text-muted-foreground">Histórico de cuidados para {patient.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {!permissions?.canEdit && permissions && (
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Modo visualização</span>
            </div>
          )}
          {permissions?.canEdit ? (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cuidado
            </Button>
          ) : permissions && (
            <Button 
              disabled
              variant="outline"
              className="opacity-50 cursor-not-allowed"
              title="Você não tem permissão para registrar cuidados"
            >
              <Lock className="h-4 w-4 mr-2" />
              Sem Permissão
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de Adicionar Cuidado */}
      {showAddForm && (
        <FamilyCareForm 
          patient={patient}
          permissions={permissions}
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            refetch()
            setShowAddForm(false)
          }}
        />
      )}

      {/* Filtros */}
      <Card className="medical-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="drink">Líquidos</SelectItem>
                <SelectItem value="med">Medicamentos</SelectItem>
                <SelectItem value="meal">Alimentação</SelectItem>
                <SelectItem value="note">Anotações</SelectItem>
                <SelectItem value="bathroom">Banheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Aviso para usuários sem permissão de edição */}
      {permissions && !permissions.canEdit && (
        <Card className="medical-card border-l-4 border-l-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-primary mb-1">Acesso Somente Leitura</h3>
                <p className="text-sm text-primary/80">
                  Você pode visualizar todos os registros de cuidados, mas não pode adicionar novos registros. 
                  Para registrar cuidados, solicite acesso de editor ao responsável pelo paciente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Eventos */}
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <Card className="medical-card">
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "all" 
                  ? "Não foram encontrados registros com os filtros aplicados."
                  : "Ainda não há registros de cuidados para este paciente."
                }
              </p>
              {permissions?.canEdit && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Registro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event) => {
            const IconComponent = getTypeIcon(event.type)
            return (
              <Card key={event.id} className="medical-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${getTypeColor(event.type)}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium text-foreground">
                          {event.med_name || event.meal_desc || event.notes || getTypeLabel(event.type)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.occurred_at || event.created_at).toLocaleDateString('pt-BR')}
                          <Clock className="h-3 w-3 ml-2" />
                          {new Date(event.occurred_at || event.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getBadgeColor(event.type)}>
                      {getTypeLabel(event.type)}
                    </Badge>
                  </div>
                </CardHeader>
                {event.notes && (
                  <CardContent className="pt-0">
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {event.notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FamilyCare