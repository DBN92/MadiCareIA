import { useState } from 'react'
import { Bell, LogOut, Menu, User, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { ProfilePhotoModal } from '@/components/ProfilePhotoModal'
import { useIsMobile } from '@/hooks/use-mobile'
import BottomNavigation from '@/components/BottomNavigation'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleLogout = () => {
    logout()
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'doctor':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'nurse':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20 relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className={`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 flex-shrink-0 ${isMobile ? 'h-14' : 'h-16'}`}>
            <div className={`flex items-center justify-between h-full ${isMobile ? 'px-3' : 'px-4 md:px-6'}`}>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    MediCare
                  </div>
                </div>
                {!isMobile && (
                  <SidebarTrigger className="h-8 w-8" />
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`relative rounded-full hover:bg-muted/80 transition-colors duration-200 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}>
                      <Avatar className={`border-2 border-primary/20 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}>
                        <AvatarImage src={user?.profilePhoto} alt={user?.name || 'Usuário'} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xs">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={`p-4 ${isMobile ? 'w-72' : 'w-80'}`} align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-0">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className={`border-2 border-primary/20 ${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`}>
                            <AvatarImage src={user?.profilePhoto} alt={user?.name || 'Usuário'} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className={`font-medium leading-none mb-1 truncate ${isMobile ? 'text-sm' : 'text-sm'}`}>
                              {user?.name || 'Usuário'}
                            </p>
                            <p className={`leading-none text-muted-foreground mb-2 truncate ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              {user?.email}
                            </p>
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors ${getRoleBadgeVariant(user?.role || 'user')} ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              {getRoleLabel(user?.role || 'user')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-3" />
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 p-3 rounded-lg"
                      onClick={() => setIsProfileModalOpen(true)}
                    >
                      <User className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 p-3 rounded-lg">
                      <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-destructive/10 text-destructive transition-colors duration-200 p-3 rounded-lg"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="text-sm">Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <div className={`flex-1 overflow-y-auto space-y-4 md:space-y-6 bg-gradient-to-br from-background to-muted/20 ${isMobile ? 'p-3 pt-4 pb-20' : 'p-4 md:p-8 pt-6'}`}>
            {children}
          </div>
        </main>
        {/* BottomNavigation removido daqui - será renderizado separadamente no App.tsx */}
      </div>
      <ProfilePhotoModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </SidebarProvider>
  )
}