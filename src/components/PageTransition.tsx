import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`${className} ${
        transitionStage === 'fadeIn' ? 'page-enter' : ''
      }`}
      onAnimationEnd={() => {
        if (transitionStage === 'fadeOut') {
          setTransitionStage('fadeIn')
          setDisplayLocation(location)
        }
      }}
    >
      {children}
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
      className={`${className} ${isVisible ? 'card-enter' : 'opacity-0'}`}
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
              className={`${visibleItems.includes(index) ? 'page-enter-bottom' : 'opacity-0'}`}
            >
              {child}
            </div>
          ))
        : <div className={`${visibleItems.includes(0) ? 'page-enter-bottom' : 'opacity-0'}`}>
            {children}
          </div>
      }
    </div>
  )
}