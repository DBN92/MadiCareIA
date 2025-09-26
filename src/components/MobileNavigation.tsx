import React, { useEffect, useState } from 'react'
import { X, Home, Users, Heart, FileText, Settings, Activity, ChevronRight, User, BarChart3, LogOut, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import ColoSaudeLogo from './ColoSaudeLogo'
import { useAuth } from '@/contexts/AuthContext'

// Usando os mesmos itens de navegação do AppSidebar
const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3, description: "Visão geral do sistema" },
  { title: "Pacientes", url: "/patients", icon: Users, description: "Gerenciar pacientes" },
  { title: "Prontuários", url: "/medical-records", icon: Stethoscope, description: "Prontuários médicos" },
  { title: "Cuidados", url: "/care", icon: Heart, description: "Registros de cuidados" },
  { title: "Relatórios", url: "/reports", icon: FileText, description: "Relatórios e análises" },
  { title: "Configurações", url: "/settings", icon: Settings, description: "Configurações do sistema" },
]

interface MobileNavigationProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

// Componente do botão hambúrguer animado
const AnimatedHamburgerButton = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  const handleClick = () => {
    console.log('Hamburger button clicked!', { isOpen })
    onClick()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative flex items-center justify-center hover:bg-muted/80 transition-all duration-300 h-11 w-11 p-0 z-[9999] group"
      aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
    >
      <div className="relative w-6 h-6 flex flex-col justify-center items-center">
        {/* Linha superior */}
        <span 
          className={`block h-0.5 w-6 bg-foreground transition-all duration-300 ease-in-out transform origin-center ${
            isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
          }`}
        />
        {/* Linha do meio */}
        <span 
          className={`block h-0.5 w-6 bg-foreground transition-all duration-300 ease-in-out ${
            isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          }`}
        />
        {/* Linha inferior */}
        <span 
          className={`block h-0.5 w-6 bg-foreground transition-all duration-300 ease-in-out transform origin-center ${
            isOpen ? '-rotate-45 -translate-y-0' : 'translate-y-1.5'
          }`}
        />
      </div>
      
      {/* Efeito de ripple */}
      <div className="absolute inset-0 rounded-full bg-primary/10 scale-0 group-active:scale-100 transition-transform duration-200" />
    </Button>
  )
}

export function MobileNavigation({ isOpen, onToggle, onClose }: MobileNavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  console.log('MobileNavigation render:', { isOpen, user: !!user })

  // Fechar menu quando navegar ou redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onClose])

  // Fechar menu ao navegar
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
  }, [location.pathname, onClose])

  // Prevenir scroll do body quando menu estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Gestos de swipe melhorados
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    
    if (isLeftSwipe && isOpen) {
      onClose()
    }
  }

  // Fechar menu com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'doctor':
        return 'Médico'
      case 'nurse':
        return 'Enfermeiro'
      default:
        return 'Usuário'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'doctor':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'nurse':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  return (
    <>
      {/* Botão do menu hambúrguer animado - sempre visível para debug */}
      <AnimatedHamburgerButton isOpen={isOpen} onClick={onToggle} />

      {/* Overlay com blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] transition-all duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu lateral mobile redesenhado */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl transform transition-all duration-500 ease-out z-[9997] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header do menu com perfil do usuário */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          
          <div className="relative p-6 border-b border-border/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-2">
                  <ColoSaudeLogo size="sm" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    MediCare
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">Sistema de Gestão</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-muted/80 transition-all duration-200 rounded-full h-10 w-10"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Perfil do usuário */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {user.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {user.email}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(user.role || 'user')}`}
                  >
                    {getRoleLabel(user.role || 'user')}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              Menu Principal
            </p>
            
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url
                const Icon = item.icon

                return (
                  <li key={item.title}>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-foreground hover:bg-muted/60 active:bg-muted/80'
                      }`}
                      onClick={onClose}
                    >
                      {/* Ícone */}
                      <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary-foreground/20' 
                          : 'bg-muted/50 group-hover:bg-muted group-hover:scale-110'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm block truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className={`text-xs block truncate mt-0.5 ${
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                      
                      {/* Seta indicadora */}
                      <ChevronRight className={`h-4 w-4 transition-all duration-300 ${
                        isActive 
                          ? 'text-primary-foreground opacity-100 translate-x-0' 
                          : 'text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                      }`} />
                      
                      {/* Efeito de hover */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Footer com status do sistema e logout */}
        <div className="border-t border-border/30 p-4 space-y-3">
          {/* Status do sistema */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30">
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <Activity className="h-4 w-4 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Sistema Online
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Todos os serviços funcionando
              </p>
            </div>
          </div>

          {/* Botão de logout */}
          {user && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await logout()
                  navigate('/login')
                  onClose()
                } catch (error) {
                  console.error('Erro ao fazer logout:', error)
                }
              }}
              className="w-full flex items-center gap-3 p-3 h-auto justify-start text-left hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">
                  Sair da conta
                </span>
                <span className="text-xs text-muted-foreground block">
                  Fazer logout do sistema
                </span>
              </div>
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

export default MobileNavigation