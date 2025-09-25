import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProfileImageUpload } from '@/components/ProfileImageUpload'
import { LogoUpload } from '@/components/LogoUpload'
import { 
  Settings as SettingsIcon, 
  Users, 
  Building2, 
  Shield, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  FileText,
  User,
  Bell,
  Database,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Image,
  MessageCircle,
  Bot,
  Key,
  Sliders
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from '@/contexts/AuthContext'
import { useSystemLogs } from '@/hooks/useSystemLogs'
import { useChatSettings } from '@/hooks/useChatSettings'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'nurse' | 'doctor'
  hospital: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface Hospital {
  id: string
  name: string
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  action: string
  user: string
  details: string
  ip?: string
}

export default function Settings() {
  const { user, updateUserProfile } = useAuth()
  const { logs, addLog, clearLogs, exportLogs, getLogsByLevel } = useSystemLogs()
  const { settings: globalChatSettings, saveSettings: saveChatSettings, resetToDefaults: resetChatSettings, validateSettings } = useChatSettings()
  
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Dr. Amir Charruf',
      email: 'amir.charruf@hospital.com',
      role: 'doctor',
      hospital: 'Hospital Central',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Enfª Maria Santos',
      email: 'maria.santos@hospital.com',
      role: 'nurse',
      hospital: 'Hospital Central',
      status: 'active',
      createdAt: '2024-01-20'
    }
  ])

  // Carregar usuários do banco de dados
  useEffect(() => {
    loadUsersFromDatabase()
  }, [])

  const loadUsersFromDatabase = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar usuários:', error)
        return
      }

      if (profiles && profiles.length > 0) {
        const formattedUsers = profiles.map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Nome não informado',
          email: `${profile.full_name?.toLowerCase().replace(/\s+/g, '.')}@hospital.com` || 'email@hospital.com',
          role: (profile.role as 'admin' | 'doctor' | 'nurse') || 'nurse',
          hospital: 'Hospital Central',
          status: 'active' as const,
          createdAt: new Date(profile.created_at).toISOString().split('T')[0]
        }))
        setUsers(formattedUsers)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const [hospitals, setHospitals] = useState<Hospital[]>([
    {
      id: '1',
      name: 'Hospital Central',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(11) 3333-4444',
      email: 'contato@hospitalcentral.com',
      status: 'active',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Hospital São José',
      address: 'Av. Paulista, 456 - Bela Vista',
      phone: '(11) 5555-6666',
      email: 'contato@hospitalsaojose.com',
      status: 'active',
      createdAt: '2024-01-10'
    }
  ])

  const [showPassword, setShowPassword] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isHospitalDialogOpen, setIsHospitalDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null)

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'nurse' as 'admin' | 'nurse' | 'doctor',
    hospital: '',
    status: 'active' as 'active' | 'inactive'
  })

  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  })

  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all')

  // Estados locais para configurações do chat
  const [chatSettings, setChatSettings] = useState(globalChatSettings)
  const [chatSettingsErrors, setChatSettingsErrors] = useState<string[]>([])

  // Atualiza configurações locais quando as configurações globais mudam
  useEffect(() => {
    setChatSettings(globalChatSettings)
  }, [globalChatSettings])

  // Adicionar alguns logs de exemplo quando o componente carrega
  useEffect(() => {
    if (logs.length === 0) {
      addLog('info', 'Sistema Iniciado', 'Página de configurações carregada com sucesso')
      addLog('info', 'Acesso à Configurações', `Usuário ${user?.name || 'Anônimo'} acessou as configurações do sistema`)
    }
  }, [logs.length, addLog, user?.name])

  const handleAddUser = async () => {
    try {
      setIsCreatingUser(true)
      
      // Validar campos obrigatórios
      if (!userForm.name || !userForm.email || !userForm.password) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        return
      }

      // Criar usuário usando auth.signUp (método correto)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: userForm.password,
        options: {
          data: {
            full_name: userForm.name,
            role: userForm.role
          }
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário:', authError)
        
        // Tratamento específico para rate limiting
        if (authError.message.includes('For security purposes, you can only request this after')) {
          const match = authError.message.match(/after (\d+) seconds/)
          const seconds = match ? parseInt(match[1]) : 60
          
          setRateLimitCooldown(seconds)
          
          // Iniciar countdown
          const countdown = setInterval(() => {
            setRateLimitCooldown(prev => {
              if (prev && prev > 1) {
                return prev - 1
              } else {
                clearInterval(countdown)
                return null
              }
            })
          }, 1000)
          
          toast({
            title: "Limite de tentativas atingido",
            description: `Por segurança, aguarde ${seconds} segundos antes de tentar criar outro usuário.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro",
            description: authError.message || "Não foi possível criar o usuário. Tente novamente.",
            variant: "destructive",
          })
        }
        return
      }

      if (!authData.user) {
        toast({
          title: "Erro",
          description: "Erro ao criar usuário. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Aguardar um pouco para o trigger criar o profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verificar se o profile foi criado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao verificar profile:', profileError)
        // Mesmo com erro no profile, o usuário foi criado
      }

      // Atualizar lista local
      const newUser: User = {
        id: authData.user.id,
        name: profile?.full_name || userForm.name,
        email: authData.user.email || userForm.email,
        role: (profile?.role as 'admin' | 'nurse' | 'doctor') || userForm.role,
        hospital: userForm.hospital,
        status: userForm.status,
        createdAt: new Date(authData.user.created_at).toISOString().split('T')[0]
      }
      
      setUsers([...users, newUser])
      setUserForm({ name: '', email: '', password: '', role: 'nurse', hospital: '', status: 'active' })
      setIsUserDialogOpen(false)
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      hospital: user.hospital,
      status: user.status
    })
    setIsUserDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (editingUser) {
      try {
        // Atualizar usuário na tabela profiles
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.name,
            role: userForm.role
          })
          .eq('id', editingUser.id)

        if (error) {
          console.error('Erro ao atualizar usuário:', error)
          toast({
            title: "Erro",
            description: "Não foi possível atualizar o usuário. Tente novamente.",
            variant: "destructive",
          })
          return
        }

        // Atualizar lista local
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...userForm }
            : user
        ))
        setEditingUser(null)
        setUserForm({ name: '', email: '', password: '', role: 'nurse', hospital: '', status: 'active' })
        setIsUserDialogOpen(false)
        
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        })
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error)
        toast({
          title: "Erro",
          description: "Erro interno. Tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Deletar usuário da tabela profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Erro ao deletar usuário:', error)
        toast({
          title: "Erro",
          description: "Não foi possível deletar o usuário. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Atualizar lista local
      setUsers(users.filter(user => user.id !== userId))
      
      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAddHospital = () => {
    const newHospital: Hospital = {
      id: Date.now().toString(),
      ...hospitalForm,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setHospitals([...hospitals, newHospital])
    setHospitalForm({ name: '', address: '', phone: '', email: '', status: 'active' })
    setIsHospitalDialogOpen(false)
  }

  const handleEditHospital = (hospital: Hospital) => {
    setEditingHospital(hospital)
    setHospitalForm({
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      status: hospital.status
    })
    setIsHospitalDialogOpen(true)
  }

  const handleUpdateHospital = () => {
    if (editingHospital) {
      setHospitals(hospitals.map(hospital => 
        hospital.id === editingHospital.id 
          ? { ...hospital, ...hospitalForm }
          : hospital
      ))
      setEditingHospital(null)
      setHospitalForm({ name: '', address: '', phone: '', email: '', status: 'active' })
      setIsHospitalDialogOpen(false)
    }
  }

  const handleDeleteHospital = (hospitalId: string) => {
    setHospitals(hospitals.filter(hospital => hospital.id !== hospitalId))
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      admin: 'Administrador',
      doctor: 'Médico',
      nurse: 'Enfermeiro(a)'
    }
    return roles[role as keyof typeof roles] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      admin: 'destructive',
      doctor: 'default',
      nurse: 'secondary'
    }
    return variants[role as keyof typeof variants] || 'default'
  }

  const getLogLevelBadgeVariant = (level: string) => {
    const variants = {
      info: 'default',
      warning: 'secondary',
      error: 'destructive',
      debug: 'outline'
    }
    return variants[level as keyof typeof variants] || 'default'
  }

  const getLogLevelColor = (level: string) => {
    const colors = {
      info: 'text-primary',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      debug: 'text-gray-600'
    }
    return colors[level as keyof typeof colors] || 'text-gray-600'
  }

  // Função para obter estatísticas dos logs
  const getLogStats = () => {
    return {
      total: logs.length,
      info: getLogsByLevel('info').length,
      warning: getLogsByLevel('warning').length,
      error: getLogsByLevel('error').length,
      debug: getLogsByLevel('debug').length
    }
  }

  // Função para exportar logs como arquivo
  const handleExportLogs = () => {
    const logsData = exportLogs()
    const blob = new Blob([logsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bedside-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const logStats = getLogStats()
  const filteredLogs = logFilter === 'all' 
    ? logs 
    : logs.filter(log => log.level === logFilter)

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Funções para configurações do chat
  const handleChatSettingChange = (key: keyof typeof chatSettings, value: any) => {
    setChatSettings(prev => ({ ...prev, [key]: value }))
  }

  const { toast } = useToast()

  const handleSaveChatSettings = () => {
    const validation = validateSettings(chatSettings)
    setChatSettingsErrors(validation.errors)
    
    if (validation.isValid) {
      const success = saveChatSettings(chatSettings)
      if (success) {
        addLog('info', 'Configurações do chat atualizadas', user?.name || 'Sistema')
        toast({
          title: "Configurações atualizadas",
          description: "As configurações do chat foram salvas com sucesso.",
        })
      } else {
        addLog('error', 'Erro ao salvar configurações do chat', user?.name || 'Sistema')
        toast({
          title: "Erro",
          description: "Não foi possível salvar as configurações do chat.",
          variant: "destructive"
        })
      }
    } else {
      addLog('warning', 'Configurações do chat inválidas', user?.name || 'Sistema')
      toast({
        title: "Validação falhou",
        description: "Verifique os campos destacados e tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleResetChatSettings = () => {
    resetChatSettings()
    setChatSettings(globalChatSettings)
    setChatSettingsErrors([])
    addLog('info', 'Configurações do chat restauradas para padrão', user?.name || 'Sistema')
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-6 backdrop-blur-sm bg-white/70 border-b border-white/20 shadow-sm flex-shrink-0">
          <SettingsIcon className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Configurações da Plataforma
          </h1>
        </div>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <div className="w-full backdrop-blur-sm bg-white/70 border-b border-white/20 shadow-sm flex-shrink-0">
            <TabsList className="w-full h-auto p-1 bg-transparent justify-start overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                <TabsTrigger 
                  value="profile" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger 
                  value="branding" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <Image className="h-4 w-4 flex-shrink-0" />
                  Logo
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger 
                  value="hospitals" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  Hospitais
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  Permissões
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <Bot className="h-4 w-4 flex-shrink-0" />
                  Chat IA
                </TabsTrigger>
                <TabsTrigger 
                  value="logs" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap px-4 py-2.5 rounded-md"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  Logs
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          {/* Configurações de Perfil */}
          <TabsContent value="profile" className="flex-1 overflow-y-auto p-6">
            <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] max-w-4xl mx-auto">
              <CardHeader className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-t-lg">
                <CardTitle className="text-gray-800">Meu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
              <div className="flex flex-col items-center space-y-4">
                <ProfileImageUpload
                  currentImage={user?.profilePhoto}
                  userName={user?.name}
                  onImageChange={(imageUrl) => {
                    // Atualizar perfil do usuário com a nova foto
                    updateUserProfile({ profilePhoto: imageUrl || undefined })
                  }}
                  size="lg"
                />
              </div>
              
              <div className="grid gap-4 max-w-md mx-auto">
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Nome Completo</Label>
                  <Input
                    id="profile-name"
                    value={user?.name || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="profile-role">Função</Label>
                  <Input
                    id="profile-role"
                    value={getRoleLabel(user?.role || '')}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="profile-hospital">Hospital</Label>
                  <Input
                    id="profile-hospital"
                    value={user?.hospital || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalização do Logo */}
        <TabsContent value="branding" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Personalização do Logo</CardTitle>
              <CardDescription>
                Personalize o logo da aplicação que aparece na sidebar e outras áreas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogoUpload />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestão de Usuários */}
        <TabsContent value="users" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie usuários, suas credenciais e permissões no sistema
                  </CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingUser(null)
                      setUserForm({ name: '', email: '', password: '', role: 'nurse', hospital: '', status: 'active' })
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingUser ? 'Atualize as informações do usuário.' : 'Crie um novo usuário no sistema.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="usuario@hospital.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder={editingUser ? 'Deixe em branco para manter a atual' : 'Digite a senha'}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Função</Label>
                        <Select value={userForm.role} onValueChange={(value: User['role']) => setUserForm({ ...userForm, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="doctor">Médico</SelectItem>
                            <SelectItem value="nurse">Enfermeiro(a)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hospital">Hospital</Label>
                        <Select value={userForm.hospital} onValueChange={(value) => setUserForm({ ...userForm, hospital: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            {hospitals.map((hospital) => (
                              <SelectItem key={hospital.id} value={hospital.name}>
                                {hospital.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={userForm.status} onValueChange={(value: User['status']) => setUserForm({ ...userForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={editingUser ? handleUpdateUser : handleAddUser}
                        disabled={isCreatingUser || (rateLimitCooldown !== null && !editingUser)}
                      >
                        {isCreatingUser ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : rateLimitCooldown !== null && !editingUser ? (
                          `Aguarde ${rateLimitCooldown}s`
                        ) : (
                          `${editingUser ? 'Atualizar' : 'Criar'} Usuário`
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role) as "default" | "secondary" | "destructive" | "outline"}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.hospital}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestão de Hospitais */}
        <TabsContent value="hospitals" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Hospitais</CardTitle>
                  <CardDescription>
                    Gerencie os hospitais onde os pacientes são registrados
                  </CardDescription>
                </div>
                <Dialog open={isHospitalDialogOpen} onOpenChange={setIsHospitalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingHospital(null)
                      setHospitalForm({ name: '', address: '', phone: '', email: '', status: 'active' })
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Hospital
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingHospital ? 'Editar Hospital' : 'Novo Hospital'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingHospital ? 'Atualize as informações do hospital.' : 'Cadastre um novo hospital no sistema.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="hospital-name">Nome do Hospital</Label>
                        <Input
                          id="hospital-name"
                          value={hospitalForm.name}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                          placeholder="Digite o nome do hospital"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          value={hospitalForm.address}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                          placeholder="Rua, número, bairro, cidade"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={hospitalForm.phone}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                          placeholder="(11) 3333-4444"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hospital-email">Email</Label>
                        <Input
                          id="hospital-email"
                          type="email"
                          value={hospitalForm.email}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                          placeholder="contato@hospital.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hospital-status">Status</Label>
                        <Select value={hospitalForm.status} onValueChange={(value: Hospital['status']) => setHospitalForm({ ...hospitalForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={editingHospital ? handleUpdateHospital : handleAddHospital}>
                        {editingHospital ? 'Atualizar' : 'Criar'} Hospital
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>{hospital.address}</TableCell>
                      <TableCell>{hospital.phone}</TableCell>
                      <TableCell>{hospital.email}</TableCell>
                      <TableCell>
                        <Badge variant={hospital.status === 'active' ? 'default' : 'secondary'}>
                          {hospital.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(hospital.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditHospital(hospital)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHospital(hospital.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controle de Permissões */}
        <TabsContent value="permissions" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Controle de Permissões</CardTitle>
              <CardDescription>
                Gerencie as permissões e níveis de acesso dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Níveis de Acesso</h3>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Administrador</h4>
                        <Badge variant="destructive">Acesso Total</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Acesso completo ao sistema, incluindo configurações, usuários e relatórios.
                      </p>
                      <div className="text-sm">
                        <strong>Permissões:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Gerenciar usuários e hospitais</li>
                          <li>Visualizar todos os pacientes e cuidados</li>
                          <li>Gerar relatórios completos</li>
                          <li>Configurar sistema</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Médico</h4>
                        <Badge variant="default">Acesso Clínico</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Acesso aos dados clínicos dos pacientes e relatórios médicos.
                      </p>
                      <div className="text-sm">
                        <strong>Permissões:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Visualizar e editar dados dos pacientes</li>
                          <li>Registrar cuidados médicos</li>
                          <li>Gerar relatórios de pacientes</li>
                          <li>Visualizar histórico completo</li>
                        </ul>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Enfermeiro(a)</h4>
                        <Badge variant="secondary">Acesso Operacional</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Acesso para registrar cuidados diários e visualizar dados dos pacientes.
                      </p>
                      <div className="text-sm">
                        <strong>Permissões:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Registrar cuidados diários</li>
                          <li>Visualizar dados dos pacientes</li>
                          <li>Gerar relatórios básicos</li>
                          <li>Atualizar informações de cuidados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações do Chat IA */}
        <TabsContent value="chat" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configurações do Chat IA
              </CardTitle>
              <CardDescription>
                Configure as configurações da inteligência artificial para o chat assistente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Configurações da API */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Configurações da API
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="api-key">Chave da API OpenAI</Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showPassword ? 'text' : 'password'}
                          value={chatSettings.apiKey}
                          onChange={(e) => handleChatSettingChange('apiKey', e.target.value)}
                          placeholder="sk-..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sua chave da API OpenAI para usar o chat assistente
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Select value={chatSettings.model} onValueChange={(value) => handleChatSettingChange('model', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Parâmetros do Modelo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    Parâmetros do Modelo
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="temperature">Temperatura: {chatSettings.temperature}</Label>
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={chatSettings.temperature}
                        onChange={(e) => handleChatSettingChange('temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Controla a criatividade das respostas (0 = mais focado, 2 = mais criativo)
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="max-tokens">Máximo de Tokens</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        min="1"
                        max="4000"
                        value={chatSettings.maxTokens}
                        onChange={(e) => handleChatSettingChange('maxTokens', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Número máximo de tokens na resposta
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="presence-penalty">Penalidade de Presença: {chatSettings.presencePenalty}</Label>
                      <input
                        id="presence-penalty"
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={chatSettings.presencePenalty}
                        onChange={(e) => handleChatSettingChange('presencePenalty', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Penaliza a repetição de tópicos já mencionados
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="frequency-penalty">Penalidade de Frequência: {chatSettings.frequencyPenalty}</Label>
                      <input
                        id="frequency-penalty"
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={chatSettings.frequencyPenalty}
                        onChange={(e) => handleChatSettingChange('frequencyPenalty', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Penaliza a repetição de palavras específicas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prompt do Sistema */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Prompt do Sistema
                  </h3>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="system-prompt">Instruções para o Assistente</Label>
                    <textarea
                      id="system-prompt"
                      value={chatSettings.systemPrompt}
                      onChange={(e) => handleChatSettingChange('systemPrompt', e.target.value)}
                      className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Digite as instruções para o assistente IA..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Define o comportamento e conhecimento do assistente IA
                    </p>
                  </div>
                </div>

                {/* Exibir erros de validação */}
                {chatSettingsErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Erros de Configuração</h4>
                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                          {chatSettingsErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveChatSettings}>
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" onClick={handleResetChatSettings}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restaurar Padrões
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs do Sistema */}
        <TabsContent value="logs" className="flex-1 overflow-y-auto p-6">
          <Card className="max-w-7xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs do Sistema</CardTitle>
                  <CardDescription>
                    Visualize e monitore todas as atividades do sistema
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={logFilter} onValueChange={(value: LogEntry['level'] | 'all') => setLogFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                  <Button variant="outline" size="sm" onClick={handleExportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Logs
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Estatísticas dos Logs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">Info</p>
                        <p className="text-2xl font-bold text-primary">
                          {logStats.info}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Warning</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {logStats.warning}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600">Error</p>
                        <p className="text-2xl font-bold text-red-700">
                          {logStats.error}
                        </p>
                      </div>
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-gray-700">{logStats.total}</p>
                      </div>
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela de Logs */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getLogLevelBadgeVariant(log.level) as any}>
                              {log.level.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell className="max-w-xs truncate" title={log.details}>
                            {log.details}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {log.ip || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum log encontrado
                    </h3>
                    <p className="text-muted-foreground">
                      Não há logs disponíveis para o filtro selecionado.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  )
}