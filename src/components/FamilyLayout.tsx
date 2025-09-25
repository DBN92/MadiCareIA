import { ReactNode, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Patient } from '@/hooks/usePatients'
import { FamilyPermissions } from '@/hooks/useFamilyAccess'
import { 
  Heart, 
  Home, 
  Activity, 
  User, 
  Calendar,
  LogOut,
  Menu,
  X,
  FileText
} from 'lucide-react'

interface FamilyLayoutProps {
  children: ReactNode
  patient: Patient
  permissions: FamilyPermissions | null
  currentPage: 'dashboard' | 'care' | 'reports' | 'medical'
}

export const FamilyLayout = ({ children, patient, permissions, currentPage }: FamilyLayoutProps) => {
  const navigate = useNavigate()
  const { patientId, token } = useParams<{ patientId: string; token: string }>()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Painel',
      icon: Home,
      path: `/family/${patientId}/${token}/dashboard`
    },
    {
      id: 'care',
      label: 'Cuidados',
      icon: Activity,
      path: `/family/${patientId}/${token}/care`,
      disabled: !permissions?.canEdit
    },
    {
       id: 'medical',
       label: 'Prontuário',
       icon: FileText,
       path: `/family/${patientId}/${token}/medical`
     }
  ]

  const handleLogout = () => {
    navigate('/family/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Patient Info Always Visible */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Patient Info - Always Visible */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {patient.photo ? (
                  <img 
                    src={patient.photo} 
                    alt={patient.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 truncate">
                  {patient.full_name}
                </h1>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Leito {patient.bed}</span>
                  <span>•</span>
                  <span>{new Date(patient.birth_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  disabled={item.disabled}
                  className="flex items-center space-x-1"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Sair</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    navigate(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                  disabled={item.disabled}
                  className="w-full justify-start"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Compact Footer */}
      <footer className="bg-white border-t border-gray-200 py-2">
        <div className="px-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3 text-red-500" />
              <span>MediCare Family</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}