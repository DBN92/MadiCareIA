import { useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface ProfilePhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfilePhotoModal({ open, onOpenChange }: ProfilePhotoModalProps) {
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      // Converter imagem para base64 para salvar no localStorage
      const base64String = await convertFileToBase64(selectedFile)
      
      // Atualizar perfil do usuário com a nova foto
      updateUserProfile({ profilePhoto: base64String })
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      })
      
      // Fechar modal
      onOpenChange(false)
      
      // Limpar estado
      setSelectedFile(null)
      setPreviewUrl(null)
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto de perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    setIsUploading(true)
    
    try {
      // Remover foto do perfil do usuário
      updateUserProfile({ profilePhoto: undefined })
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso!",
      })
      
      onOpenChange(false)
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover foto de perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Função para converter arquivo para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Escolha uma nova foto para seu perfil ou remova a atual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          {/* Avatar atual ou preview */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={previewUrl || user?.profilePhoto} 
                alt={user?.name}
                className="object-cover"
              />
              <AvatarFallback className="text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <Camera className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            {previewUrl && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Informações do usuário */}
          <div className="text-center">
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col w-full space-y-3">
            {!selectedFile ? (
              <>
                <label htmlFor="photo-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Escolher Nova Foto
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {user?.profilePhoto && (
                  <Button
                    variant="destructive"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                  >
                    {isUploading ? "Removendo..." : "Remover Foto Atual"}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Salvando..." : "Salvar Foto"}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}