import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreateWhiteLabelClient() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    plan: '',
    maxUsers: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simular criação do cliente
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Cliente criado com sucesso!",
        description: `${formData.name} foi adicionado ao sistema.`,
      })
      
      navigate('/super-admin/dashboard')
    } catch (error) {
      toast({
        title: "Erro ao criar cliente",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/super-admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              Criar Novo Cliente
            </h1>
            <p className="text-gray-600 mt-1">
              Adicionar um novo hospital ou clínica ao sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Instituição *</Label>
                  <Input
                    id="name"
                    placeholder="Hospital São Lucas"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domínio *</Label>
                  <Input
                    id="domain"
                    placeholder="saolucas.medicare.com"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email de Contato *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="admin@saolucas.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Telefone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="(11) 99999-9999"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Plano e limitações do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="plan">Plano *</Label>
                  <Select value={formData.plan} onValueChange={(value) => handleInputChange('plan', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico (até 50 usuários)</SelectItem>
                      <SelectItem value="professional">Profissional (até 200 usuários)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (usuários ilimitados)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxUsers">Máximo de Usuários</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    placeholder="100"
                    value={formData.maxUsers}
                    onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua das Flores, 123 - Centro - São Paulo/SP"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Informações adicionais sobre o cliente..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações importantes */}
          <Alert className="mt-6">
            <AlertDescription>
              <strong>Importante:</strong> Após criar o cliente, você poderá configurar o tema personalizado,
              fazer upload de logos e definir outras personalizações específicas.
            </AlertDescription>
          </Alert>

          {/* Botões de ação */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/super-admin/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.domain || !formData.contactEmail || !formData.plan}
            >
              {isLoading ? (
                "Criando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}