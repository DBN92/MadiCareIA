import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Trash2, FileImage, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AssetManager() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  
  // Mock data para assets existentes
  const [assets, setAssets] = useState([
    {
      id: '1',
      name: 'logo-principal.png',
      type: 'logo',
      url: '/placeholder.svg',
      size: '45 KB',
      uploadDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'favicon.ico',
      type: 'favicon',
      url: '/favicon.ico',
      size: '12 KB',
      uploadDate: '2024-01-15'
    },
    {
      id: '3',
      name: 'background-login.jpg',
      type: 'background',
      url: '/placeholder.svg',
      size: '234 KB',
      uploadDate: '2024-01-10'
    }
  ])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newAsset = {
        id: Date.now().toString(),
        name: file.name,
        type,
        url: URL.createObjectURL(file),
        size: `${Math.round(file.size / 1024)} KB`,
        uploadDate: new Date().toISOString().split('T')[0]
      }
      
      setAssets(prev => [...prev, newAsset])
      
      toast({
        title: "Upload realizado com sucesso!",
        description: `${file.name} foi adicionado aos assets.`,
      })
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId))
    toast({
      title: "Asset removido",
      description: "O arquivo foi removido com sucesso.",
    })
  }

  const getAssetTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      logo: 'Logo',
      favicon: 'Favicon',
      background: 'Imagem de Fundo',
      icon: 'Ícone',
      other: 'Outro'
    }
    return types[type] || 'Desconhecido'
  }

  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      logo: 'bg-blue-100 text-blue-800',
      favicon: 'bg-green-100 text-green-800',
      background: 'bg-purple-100 text-purple-800',
      icon: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
              <FileImage className="h-8 w-8 text-orange-600" />
              Gerenciador de Assets
            </h1>
            <p className="text-gray-600 mt-1">
              Cliente ID: {clientId} - Gerencie logos, ícones e imagens
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Upload de Assets</CardTitle>
              <CardDescription>
                Adicione novos arquivos ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo-upload">Logo Principal</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, SVG até 2MB
                </p>
              </div>

              <div>
                <Label htmlFor="favicon-upload">Favicon</Label>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept=".ico,.png"
                  onChange={(e) => handleFileUpload(e, 'favicon')}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ICO, PNG 16x16 ou 32x32
                </p>
              </div>

              <div>
                <Label htmlFor="background-upload">Imagem de Fundo</Label>
                <Input
                  id="background-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'background')}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG até 5MB
                </p>
              </div>

              <div>
                <Label htmlFor="other-upload">Outros Assets</Label>
                <Input
                  id="other-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'other')}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Qualquer tipo de imagem
                </p>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Fazendo upload...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assets List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Assets Existentes</CardTitle>
              <CardDescription>
                Arquivos atualmente disponíveis para o cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <FileImage className="w-6 h-6 text-gray-400 hidden" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{asset.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getAssetTypeColor(asset.type)}`}>
                            {getAssetTypeLabel(asset.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {asset.size} • Enviado em {asset.uploadDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {assets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum asset encontrado</p>
                    <p className="text-sm">Faça upload de arquivos para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Diretrizes para Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Logo Principal</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Formato: PNG, SVG preferível</li>
                  <li>• Tamanho: 200x60px ideal</li>
                  <li>• Fundo transparente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Favicon</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Formato: ICO, PNG</li>
                  <li>• Tamanho: 16x16, 32x32px</li>
                  <li>• Design simples</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Imagem de Fundo</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Formato: JPG, PNG</li>
                  <li>• Resolução: 1920x1080px</li>
                  <li>• Otimizada para web</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Geral</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Tamanho máximo: 5MB</li>
                  <li>• Nomes descritivos</li>
                  <li>• Qualidade otimizada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}