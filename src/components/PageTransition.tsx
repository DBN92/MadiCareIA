import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true)
      // Pequeno delay para permitir transição suave
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setIsTransitioning(false)
      }, 150) // Reduzido para transição mais rápida
      
      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return (
    <div
      className={`${className} transition-all duration-150 ease-out ${
        isTransitioning ? 'opacity-95 scale-[0.99]' : 'opacity-100 scale-100'
      }`}
      style={{
        minHeight: '100vh',
        willChange: 'transform, opacity'
      }}
    >
      <div className={displayLocation.pathname !== location.pathname ? 'opacity-0' : 'opacity-100 transition-opacity duration-200 ease-in-out'}>
        {children}
      </div>
    </div>
  )
}

// Alternative transition wrapper for cards and components
export function CardTransition({ children, className = '', delay = 0 }: PageTransitionProps & { delay?: number }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`${className} transition-all duration-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {children}
    </div>
  )
}

// Staggered animation for lists
export function StaggeredTransition({ 
  children, 
  className = '', 
  staggerDelay = 100 
}: PageTransitionProps & { staggerDelay?: number }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  
  useEffect(() => {
    const childrenArray = Array.isArray(children) ? children : [children]
    
    childrenArray.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, index * staggerDelay)
    })
  }, [children, staggerDelay])

  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <div
              key={index}
              className={`transition-all duration-300 ease-out ${visibleItems.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {child}
            </div>
          ))
        : <div className={`transition-all duration-300 ease-out ${visibleItems.includes(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {children}
          </div>
      }
    </div>
  )
}