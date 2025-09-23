// Scrollbar visibility handler
// This script adds a 'scrolling' class to elements when they are being scrolled
// to ensure the scrollbar remains visible during scroll operations

let scrollTimeout;

function handleScroll(element) {
  // Add scrolling class
  element.classList.add('scrolling');
  
  // Clear existing timeout
  clearTimeout(scrollTimeout);
  
  // Set timeout to remove scrolling class after scroll ends
  scrollTimeout = setTimeout(() => {
    element.classList.remove('scrolling');
  }, 1000); // Hide scrollbar 1 second after scrolling stops
}

// Apply to all scrollable elements
function initScrollbarHandler() {
  const scrollableElements = document.querySelectorAll('*');
  
  scrollableElements.forEach(element => {
    // Check if element is scrollable
    const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
    const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;
    
    if (hasVerticalScrollbar || hasHorizontalScrollbar) {
      element.addEventListener('scroll', () => handleScroll(element), { passive: true });
    }
  });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollbarHandler);
} else {
  initScrollbarHandler();
}

// Re-initialize for dynamically added content
const observer = new MutationObserver(() => {
  initScrollbarHandler();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

export { initScrollbarHandler };