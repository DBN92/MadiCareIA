import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FamilyAccessToken } from '@/hooks/useFamilyAccess'
import { Copy, Eye, EyeOff, User, Lock, Link, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FamilyCredentialsModalProps {
  isOpen: boolean
  onClose: () => void
  credentials: FamilyAccessToken | null
  patientName: string
}

const FamilyCredentialsModal = ({ isOpen, onClose, credentials, patientName }: FamilyCredentialsModalProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copiado!",
        description: `${fieldName} copiado para a área de transferência.`
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive"
      })
    }
  }

  const loginUrl = `${window.location.origin}/family/login`
  const directUrl = credentials ? `${window.location.origin}/family/${credentials.patient_id}/${credentials.token}` : ''

  if (!credentials) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Credenciais de Acesso Familiar
          </DialogTitle>
          <DialogDescription>
            Credenciais geradas para acesso aos dados de {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert de Segurança */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Compartilhe essas credenciais apenas com familiares autorizados. 
              Elas permitem acesso completo aos dados médicos do paciente.
            </AlertDescription>
          </Alert>

          {/* Credenciais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados de Acesso</CardTitle>
              <CardDescription>
                Use essas credenciais para fazer login no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usuário */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuário
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={credentials.username}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.username, 'Usuário')}
                    className={copiedField === 'Usuário' ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copiedField === 'Usuário' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      readOnly
                      className="font-mono pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.password, 'Senha')}
                    className={copiedField === 'Senha' ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copiedField === 'Senha' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links de Acesso</CardTitle>
              <CardDescription>
                Duas formas de acessar os dados do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link de Login */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Página de Login (Recomendado)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={loginUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(loginUrl, 'Link de Login')}
                    className={copiedField === 'Link de Login' ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copiedField === 'Link de Login' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use este link e faça login com as credenciais acima
                </p>
              </div>

              {/* Link Direto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Acesso Direto
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={directUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(directUrl, 'Link Direto')}
                    className={copiedField === 'Link Direto' ? 'bg-green-50 border-green-200' : ''}
                  >
                    {copiedField === 'Link Direto' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acesso direto aos dados (sem necessidade de login)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Token: {credentials.token.slice(0, 8)}...
              </Badge>
              <Badge variant="outline">
                Criado: {new Date(credentials.created_at).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FamilyCredentialsModal