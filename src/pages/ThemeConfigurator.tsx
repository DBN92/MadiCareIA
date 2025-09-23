import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Palette, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ThemeConfigurator() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [theme, setTheme] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderRadius: '8',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: ''
  })

  const handleColorChange = (field: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simular salvamento do tema
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Tema salvo com sucesso!",
        description: "As personalizações foram aplicadas ao cliente.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar tema",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const presetThemes = [
    {
      name: 'Azul Hospitalar',
      colors: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#10b981',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
      }
    },
    {
      name: 'Verde Saúde',
      colors: {
        primaryColor: '#059669',
        secondaryColor: '#6b7280',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
      }
    },
    {
      name: 'Roxo Moderno',
      colors: {
        primaryColor: '#7c3aed',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
      }
    }
  ]

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setTheme(prev => ({
      ...prev,
      ...preset.colors
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-0">
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
              <Palette className="h-8 w-8 text-purple-600" />
              Configurador de Tema
            </h1>
            <p className="text-gray-600 mt-1">
              Cliente ID: {clientId} - Personalize a aparência do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações */}
          <div className="space-y-6">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="typography">Tipografia</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Paleta de Cores</CardTitle>
                    <CardDescription>
                      Defina as cores principais do tema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Cor Primária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={theme.primaryColor}
                            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={theme.primaryColor}
                            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondaryColor">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={theme.secondaryColor}
                            onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={theme.secondaryColor}
                            onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                            placeholder="#64748b"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="accentColor">Cor de Destaque</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={theme.accentColor}
                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={theme.accentColor}
                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                            placeholder="#10b981"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={theme.backgroundColor}
                            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={theme.backgroundColor}
                            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Label>Temas Predefinidos</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {presetThemes.map((preset, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset(preset)}
                            className="justify-start"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.colors.primaryColor }}
                              />
                              {preset.name}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tipografia</CardTitle>
                    <CardDescription>
                      Configure fontes e estilos de texto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fontFamily">Família da Fonte</Label>
                      <select
                        id="fontFamily"
                        value={theme.fontFamily}
                        onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Poppins">Poppins</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="borderRadius">Raio da Borda (px)</Label>
                      <Input
                        id="borderRadius"
                        type="number"
                        value={theme.borderRadius}
                        onChange={(e) => handleColorChange('borderRadius', e.target.value)}
                        placeholder="8"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assets</CardTitle>
                    <CardDescription>
                      Configure logos e ícones personalizados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl">URL do Logo</Label>
                      <Input
                        id="logoUrl"
                        value={theme.logoUrl}
                        onChange={(e) => handleColorChange('logoUrl', e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </div>

                    <div>
                      <Label htmlFor="faviconUrl">URL do Favicon</Label>
                      <Input
                        id="faviconUrl"
                        value={theme.faviconUrl}
                        onChange={(e) => handleColorChange('faviconUrl', e.target.value)}
                        placeholder="https://exemplo.com/favicon.ico"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview do Tema
              </CardTitle>
              <CardDescription>
                Visualização das personalizações aplicadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-6 space-y-4"
                style={{ 
                  backgroundColor: theme.backgroundColor,
                  color: theme.textColor,
                  fontFamily: theme.fontFamily
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <h3 className="font-bold">MediCare System</h3>
                </div>
                
                <div 
                  className="p-4 rounded"
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                    borderRadius: `${theme.borderRadius}px`
                  }}
                >
                  <h4 className="font-semibold">Botão Primário</h4>
                  <p className="text-sm opacity-90">Exemplo de elemento principal</p>
                </div>

                <div 
                  className="p-4 rounded border"
                  style={{ 
                    borderColor: theme.secondaryColor,
                    borderRadius: `${theme.borderRadius}px`
                  }}
                >
                  <h4 className="font-semibold">Card de Conteúdo</h4>
                  <p className="text-sm" style={{ color: theme.secondaryColor }}>
                    Exemplo de conteúdo secundário
                  </p>
                </div>

                <div 
                  className="inline-block px-3 py-1 rounded text-sm"
                  style={{ 
                    backgroundColor: theme.accentColor,
                    color: 'white',
                    borderRadius: `${theme.borderRadius}px`
                  }}
                >
                  Badge de Destaque
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/super-admin/dashboard')}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              "Salvando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Tema
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}