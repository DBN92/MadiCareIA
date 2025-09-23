import { useParams } from 'react-router-dom'
import { FamilyLayout } from '@/components/FamilyLayout'
import FamilyCare from '@/components/FamilyCare'
import { useFamilyAccess, FamilyPermissions, FamilyAccessToken } from '@/hooks/useFamilyAccess'
import { useEffect, useState } from 'react'
import { Patient } from '@/hooks/usePatients'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Shield } from 'lucide-react'

const FamilyCareScreen = () => {
  const { patientId, token } = useParams<{ patientId: string; token: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [permissions, setPermissions] = useState<FamilyPermissions | null>(null)
  const [tokenData, setTokenData] = useState<FamilyAccessToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { validateTokenWithData, getPermissions, generateFamilyToken } = useFamilyAccess()

  useEffect(() => {
    const validateAccess = async () => {
      if (!patientId || !token) {
        setError('Token ou ID do paciente não encontrado')
        setLoading(false)
        return
      }

      try {
        const result = await validateTokenWithData(patientId, token)
        if (result.isValid && result.patient && result.tokenData) {
          setPatient(result.patient)
          setTokenData(result.tokenData)
          setPermissions(getPermissions(result.tokenData.role))
        } else {
          // Token inválido - criar automaticamente um novo token
          console.log('🔄 Token inválido, criando automaticamente...')
          try {
            const newToken = await generateFamilyToken(patientId, 'editor')
            console.log('✅ Token criado automaticamente:', newToken.token)
            
            // Revalidar com o novo token
            const newResult = await validateTokenWithData(patientId, newToken.token)
            if (newResult.isValid && newResult.patient && newResult.tokenData) {
              setPatient(newResult.patient)
              setTokenData(newResult.tokenData)
              setPermissions(getPermissions(newResult.tokenData.role))
            } else {
              setError('Erro ao validar novo token criado')
            }
          } catch (tokenError) {
            console.error('❌ Erro ao criar token automaticamente:', tokenError)
            setError('Erro ao criar token de acesso automaticamente')
          }
        }
      } catch (err) {
        setError('Erro ao validar acesso')
      } finally {
        setLoading(false)
      }
    }

    validateAccess()
  }, [patientId, token, validateTokenWithData, getPermissions, generateFamilyToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !patient || !permissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              {error || 'Não foi possível validar seu acesso.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              Verifique se você possui um token válido para acessar esta página.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verificar se o usuário tem permissão para registrar cuidados
  if (!permissions.canEdit) {
    return (
      <FamilyLayout patient={patient} permissions={permissions} currentPage="care">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Você não possui permissão para registrar cuidados. Apenas usuários com perfil de "Editor" podem acessar esta funcionalidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              Entre em contato com a equipe médica para solicitar as permissões necessárias.
            </div>
          </CardContent>
        </Card>
      </FamilyLayout>
    )
  }

  return (
    <FamilyLayout patient={patient} permissions={permissions} currentPage="care">
      <FamilyCare patient={patient} permissions={permissions} />
    </FamilyLayout>
  )
}

export default FamilyCareScreen