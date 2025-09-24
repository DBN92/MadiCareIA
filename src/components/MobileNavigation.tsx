import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  BarChart3,
  Users,
  Heart,
  FileText,
  Settings,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import ColoSaudeLogo from './ColoSaudeLogo'

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3, description: "Visão geral do sistema" },
  { title: "Pacientes", url: "/patients", icon: Users, description: "Gerenciar pacientes" },
  { title: "Cuidados", url: "/care", icon: Heart, description: "Registros de cuidados" },
  { title: "Relatórios", url: "/reports", icon: FileText, description: "Relatórios e análises" },
  { title: "Configurações", url: "/settings", icon: Settings, description: "Configurações do sistema" },
]

interface MobileNavigationProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function MobileNavigation({ isOpen, onToggle, onClose }: MobileNavigationProps) {
  const location = useLocation()
  const isMobile = useIsMobile()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Fechar menu ao navegar
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Fechar menu ao redimensionar para desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      onClose()
    }
  }, [isMobile, isOpen, onClose])

  // Gestos de swipe para fechar o menu
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    
    if (isLeftSwipe) {
      onClose()
    }
  }

  // Prevenir scroll do body quando menu está aberto
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

  if (!isMobile) return null

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-8 w-8 md:hidden"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu lateral mobile */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header do menu */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-1.5">
              <ColoSaudeLogo size="sm" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                MediCare
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Sistema de Gestão</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Navegação
            </p>
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url
                const Icon = item.icon

                return (
                  <li key={item.title}>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-foreground hover:bg-muted/50 active:bg-muted'
                      }`}
                      onClick={onClose}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm block truncate">
                          {item.title}
                        </span>
                        <span className={`text-xs block truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {item.description}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      
                      {/* Efeito de hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Footer do menu */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              <Activity className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Sistema Online</p>
              <p className="text-xs text-muted-foreground">Todos os serviços funcionando</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileNavigation