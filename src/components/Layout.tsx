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
import { VirtualAssistant, VirtualAssistantToggle } from '@/components/VirtualAssistant'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

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
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
              </div>
              <div className="flex items-center gap-4">
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/80 transition-colors duration-200">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={user?.profilePhoto} alt={user?.name || 'Usuário'} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-0">
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={user?.profilePhoto} alt={user?.name || 'Usuário'} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium leading-none mb-1">
                              {user?.name || 'Usuário'}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground mb-2">
                              {user?.email}
                            </p>
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getRoleBadgeVariant(user?.role || 'user')}`}>
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
          <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gradient-to-br from-background to-muted/20">
            {children}
          </div>
        </main>
      </div>
      <ProfilePhotoModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
      <VirtualAssistantToggle
        onClick={() => setIsAssistantOpen(true)}
        isOpen={isAssistantOpen}
      />
      <VirtualAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
      />
    </SidebarProvider>
  )
}