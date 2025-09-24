import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Activity,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Stethoscope,
  Heart,
  FileText,
  ChevronRight,
} from "lucide-react"
import ColoSaudeLogo from './ColoSaudeLogo'
import { useIsMobile } from '@/hooks/use-mobile'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3, description: "Visão geral do sistema" },
  { title: "Pacientes", url: "/patients", icon: Users, description: "Gerenciar pacientes" },
  { title: "Cuidados", url: "/care", icon: Heart, description: "Registros de cuidados" },
  { title: "Relatórios", url: "/reports", icon: FileText, description: "Relatórios e análises" },
  { title: "Configurações", url: "/settings", icon: Settings, description: "Configurações do sistema" },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isActive = (path: string) => currentPath === path

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 scale-[1.02] border-l-4 border-primary-foreground/20" 
      : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted/60 text-muted-foreground hover:text-foreground hover:shadow-md hover:scale-[1.01] hover:border-l-2 hover:border-primary/30"

  return (
    <Sidebar
      className="transition-all duration-300 ease-out h-screen"
      collapsible="icon"
    >
      <SidebarContent className="border-r border-border/50 bg-gradient-to-b from-card/80 to-card/60 backdrop-blur-md shadow-xl h-full flex flex-col md:bg-gradient-to-b md:from-card/80 md:to-card/60 max-md:bg-white/90 max-md:backdrop-blur-xl max-md:shadow-2xl">
        {/* Header */}
        <div className={`border-b border-border/30 flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg flex-shrink-0 transition-transform duration-300 hover:scale-105 ${isMobile ? 'p-1.5' : 'p-2'}`}>
                <ColoSaudeLogo size={isMobile ? "sm" : "md"} />
              </div>
            {!isCollapsed && (
              <div className="transition-all duration-300 ease-out text-center">
                <h2 className={`font-bold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent ${isMobile ? 'text-base' : 'text-lg'}`}>
                  MediCare
                </h2>
                <p className={`text-muted-foreground font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>Sistema de Gestão</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className={`flex-1 overflow-y-auto ${isMobile ? 'py-3' : 'py-4'}`}>
          <SidebarGroupLabel className={`text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center ${isMobile ? 'px-3 py-1' : 'px-4 py-2'}`}>
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className={`space-y-1 ${isMobile ? 'px-1.5' : 'px-2'}`}>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `${getNavClass({ isActive })} flex items-center justify-center gap-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden ${!isCollapsed ? 'justify-start' : ''} ${isMobile ? 'px-2.5 py-2.5 min-h-[44px]' : 'px-3 py-3'}`
                      }
                      onMouseEnter={() => setHoveredItem(item.title)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className={`relative z-10 flex items-center gap-3 w-full ${!isCollapsed ? 'justify-start' : 'justify-center'}`}>
                        <item.icon className={`transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium block truncate ${isMobile ? 'text-sm' : 'text-sm'}`}>{item.title}</span>
                            {hoveredItem === item.title && !isMobile && (
                              <span className="text-xs opacity-75 block truncate animate-in slide-in-from-left-2 duration-200">
                                {item.description}
                              </span>
                            )}
                          </div>
                        )}
                        {!isCollapsed && !isMobile && (
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                        )}
                      </div>
                      
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className={`border-t border-border/30 bg-gradient-to-r from-muted/20 to-transparent flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-center gap-3 group cursor-pointer hover:bg-muted/30 rounded-lg transition-all duration-300 ${!isCollapsed ? 'justify-start' : 'justify-center'} ${isMobile ? 'p-1.5' : 'p-2'}`}>
            <div className={`bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 flex-shrink-0 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}>
              <Activity className={`text-white animate-pulse ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 transition-all duration-300">
                <div className={`font-semibold text-foreground flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Sistema Online
                  <div className={`bg-green-500 rounded-full animate-pulse ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
                </div>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>Todos os sistemas funcionais</p>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}