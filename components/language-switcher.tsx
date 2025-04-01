"use client"

import { Button } from "@/components/ui/button"
import { Language } from "@/lib/i18n"

interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const toggleLanguage = () => {
    const newLanguage: Language = currentLanguage === 'zh' ? 'en' : 'zh'
    onLanguageChange(newLanguage)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="absolute top-4 right-4"
    >
      {currentLanguage === 'zh' ? 'English' : '中文'}
    </Button>
  )
}