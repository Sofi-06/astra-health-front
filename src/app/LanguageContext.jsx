import { createContext, useContext, useEffect, useState } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('astra-language') === 'en' ? 'en' : 'es' } catch { return 'es' }
  })

  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('astra-language', language) } catch { /* Storage may be disabled. */ }
  }, [language])

  const tr = (spanish, english) => language === 'en' ? english : spanish
  return <LanguageContext.Provider value={{ language, setLanguage, tr }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
