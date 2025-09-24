import { NavLink, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  Heart, 
  FileText, 
  Settings 
} from 'lucide-react'

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: BarChart3, 
    shortTitle: "Home"
  },
  { 
    title: "Pacientes", 
    url: "/patients", 
    icon: Users, 
    shortTitle: "Pacientes"
  },
  { 
    title: "Cuidados", 
    url: "/care", 
    icon: Heart, 
    shortTitle: "Cuidados"
  },
  { 
    title: "Relatórios", 
    url: "/reports", 
    icon: FileText, 
    shortTitle: "Relatórios"
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings, 
    shortTitle: "Config"
  },
]

export function BottomNavigation() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full h-[70px] bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] flex justify-around items-center md:hidden z-50">
        <div className="flex items-center justify-around w-full h-full px-2 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.url)
          
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 rounded-xl transition-all duration-300 transform active:scale-95 ${
                active
                  ? 'text-primary bg-primary/15 scale-105 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105'
              }`}
              aria-label={item.title}
            >
              <div className={`relative ${active ? 'animate-pulse' : ''}`}>
                <Icon 
                  className={`h-5 w-5 mb-1 transition-all duration-300 ${
                    active ? 'scale-110 drop-shadow-sm' : ''
                  }`} 
                />
                {active && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-xs font-medium truncate max-w-full transition-all duration-300 ${
                active ? 'font-semibold text-primary' : ''
              }`}>
                {item.shortTitle}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation