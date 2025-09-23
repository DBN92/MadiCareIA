import React, { useState, useRef } from 'react';
import { Upload, RotateCcw, Image, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLogo } from '@/hooks/useLogo';

export function LogoUpload() {
  const { logoUrl, isCustomLogo, uploadLogo, resetToDefaultLogo, defaultLogoUrl } = useLogo();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadLogo(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    resetToDefaultLogo();
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo da Empresa
        </CardTitle>
        <CardDescription>
          Personalize o logo que aparece na sidebar e header do sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview do Logo Atual */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg flex items-center justify-center p-2">
            <img
              src={logoUrl}
              alt="Logo atual"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback para logo padrão se a imagem falhar
                const target = e.target as HTMLImageElement;
                target.src = defaultLogoUrl;
              }}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              {isCustomLogo ? 'Logo Personalizado' : 'Logo Padrão'}
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PNG, JPG, SVG (máx. 5MB)
            </p>
          </div>
        </div>

        {/* Mensagens de Status */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Logo atualizado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Enviando...' : 'Alterar Logo'}
          </Button>

          {isCustomLogo && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Logo Padrão
            </Button>
          )}
        </div>

        {/* Input de Arquivo (Oculto) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}