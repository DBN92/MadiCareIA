import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProfileImageUploadProps {
  currentImage?: string
  userName?: string
  onImageChange: (imageUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export function ProfileImageUpload({ 
  currentImage, 
  userName, 
  onImageChange, 
  size = 'md' 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Atualizar previewImage quando currentImage mudar
  React.useEffect(() => {
    setPreviewImage(currentImage || null)
  }, [currentImage])

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      })
      return
    }

    // Validar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setPreviewImage(imageUrl)
      onImageChange(imageUrl)
      setIsUploading(false)
      
      toast({
        title: "Sucesso",
        description: "Imagem de perfil atualizada com sucesso!",
      })
    }
    
    reader.onerror = () => {
      setIsUploading(false)
      toast({
        title: "Erro",
        description: "Erro ao carregar a imagem. Tente novamente.",
        variant: "destructive"
      })
    }
    
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    toast({
      title: "Sucesso",
      description: "Imagem de perfil removida.",
    })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getInitials = (name?: string) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} cursor-pointer transition-all duration-200 group-hover:opacity-80`}>
          <AvatarImage 
            src={previewImage || undefined} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(userName) || <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay com ícone de câmera */}
        <div 
          className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={triggerFileInput}
        >
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Carregando...' : 'Alterar Foto'}
        </Button>
        
        {previewImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}