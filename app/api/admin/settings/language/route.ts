import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET() {
  try {
    // Get language usage stats from settings
    const languageStats = await prisma.settings.groupBy({
      by: ["language"],
      _count: { language: true },
    })

    // Mock languages data (in production, this would come from a Languages table)
    const languages = [
      {
        id: "1",
        code: "en",
        name: "English",
        nativeName: "English",
        flag: "🇺🇸",
        isDefault: true,
        isEnabled: true,
        translationProgress: 100,
        lastUpdated: "2024-01-15",
        direction: "ltr" as const,
      },
      {
        id: "2",
        code: "es",
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        isDefault: false,
        isEnabled: true,
        translationProgress: 85,
        lastUpdated: "2024-01-10",
        direction: "ltr" as const,
      },
      {
        id: "3",
        code: "fr",
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
        isDefault: false,
        isEnabled: true,
        translationProgress: 78,
        lastUpdated: "2024-01-08",
        direction: "ltr" as const,
      },
      {
        id: "4",
        code: "de",
        name: "German",
        nativeName: "Deutsch",
        flag: "🇩🇪",
        isDefault: false,
        isEnabled: true,
        translationProgress: 72,
        lastUpdated: "2024-01-05",
        direction: "ltr" as const,
      },
      {
        id: "5",
        code: "ar",
        name: "Arabic",
        nativeName: "العربية",
        flag: "🇸🇦",
        isDefault: false,
        isEnabled: true,
        translationProgress: 65,
        lastUpdated: "2024-01-03",
        direction: "rtl" as const,
      },
      {
        id: "6",
        code: "zh",
        name: "Chinese",
        nativeName: "中文",
        flag: "🇨🇳",
        isDefault: false,
        isEnabled: false,
        translationProgress: 45,
        lastUpdated: "2023-12-20",
        direction: "ltr" as const,
      },
      {
        id: "7",
        code: "ja",
        name: "Japanese",
        nativeName: "日本語",
        flag: "🇯🇵",
        isDefault: false,
        isEnabled: false,
        translationProgress: 38,
        lastUpdated: "2023-12-15",
        direction: "ltr" as const,
      },
      {
        id: "8",
        code: "hi",
        name: "Hindi",
        nativeName: "हिन्दी",
        flag: "🇮🇳",
        isDefault: false,
        isEnabled: true,
        translationProgress: 55,
        lastUpdated: "2024-01-02",
        direction: "ltr" as const,
      },
    ]

    // Mock translations data
    const translations = [
      {
        id: "1",
        key: "common.welcome",
        category: "common",
        translations: { en: "Welcome", es: "Bienvenido", fr: "Bienvenue", de: "Willkommen", ar: "أهلاً", hi: "स्वागत" },
        lastUpdated: "2024-01-15",
      },
      {
        id: "2",
        key: "common.login",
        category: "auth",
        translations: {
          en: "Login",
          es: "Iniciar sesión",
          fr: "Connexion",
          de: "Anmelden",
          ar: "تسجيل الدخول",
          hi: "लॉग इन",
        },
        lastUpdated: "2024-01-15",
      },
      {
        id: "3",
        key: "common.signup",
        category: "auth",
        translations: {
          en: "Sign Up",
          es: "Registrarse",
          fr: "S'inscrire",
          de: "Registrieren",
          ar: "إنشاء حساب",
          hi: "साइन अप",
        },
        lastUpdated: "2024-01-15",
      },
      {
        id: "4",
        key: "events.browse",
        category: "events",
        translations: {
          en: "Browse Events",
          es: "Explorar eventos",
          fr: "Parcourir les événements",
          de: "Veranstaltungen durchsuchen",
          ar: "تصفح الأحداث",
          hi: "इवेंट्स ब्राउज़ करें",
        },
        lastUpdated: "2024-01-14",
      },
      {
        id: "5",
        key: "events.register",
        category: "events",
        translations: {
          en: "Register for Event",
          es: "Registrarse en el evento",
          fr: "S'inscrire à l'événement",
          de: "Für Veranstaltung anmelden",
        },
        lastUpdated: "2024-01-14",
      },
      {
        id: "6",
        key: "nav.home",
        category: "navigation",
        translations: { en: "Home", es: "Inicio", fr: "Accueil", de: "Startseite", ar: "الرئيسية", hi: "होम" },
        lastUpdated: "2024-01-13",
      },
      {
        id: "7",
        key: "nav.events",
        category: "navigation",
        translations: {
          en: "Events",
          es: "Eventos",
          fr: "Événements",
          de: "Veranstaltungen",
          ar: "الأحداث",
          hi: "इवेंट्स",
        },
        lastUpdated: "2024-01-13",
      },
      {
        id: "8",
        key: "nav.profile",
        category: "navigation",
        translations: { en: "Profile", es: "Perfil", fr: "Profil", de: "Profil", ar: "الملف الشخصي", hi: "प्रोफाइल" },
        lastUpdated: "2024-01-13",
      },
      {
        id: "9",
        key: "errors.notFound",
        category: "errors",
        translations: {
          en: "Page not found",
          es: "Página no encontrada",
          fr: "Page non trouvée",
          de: "Seite nicht gefunden",
          ar: "الصفحة غير موجودة",
        },
        lastUpdated: "2024-01-12",
      },
      {
        id: "10",
        key: "errors.serverError",
        category: "errors",
        translations: { en: "Server error", es: "Error del servidor", fr: "Erreur serveur", de: "Serverfehler" },
        lastUpdated: "2024-01-12",
      },
      {
        id: "11",
        key: "users.profile",
        category: "users",
        translations: {
          en: "User Profile",
          es: "Perfil de usuario",
          fr: "Profil utilisateur",
          de: "Benutzerprofil",
          ar: "ملف المستخدم",
          hi: "यूजर प्रोफाइल",
        },
        lastUpdated: "2024-01-11",
      },
      {
        id: "12",
        key: "notifications.newEvent",
        category: "notifications",
        translations: {
          en: "New event available",
          es: "Nuevo evento disponible",
          fr: "Nouvel événement disponible",
          de: "Neue Veranstaltung verfügbar",
        },
        lastUpdated: "2024-01-10",
      },
    ]

    // Default locale settings
    const settings = {
      defaultLanguage: "en",
      fallbackLanguage: "en",
      autoDetect: true,
      showLanguageSwitcher: true,
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      timezone: "UTC",
      currency: "USD",
      currencyPosition: "before" as const,
      numberFormat: "1,234.56",
      firstDayOfWeek: 0,
    }

    return NextResponse.json({
      languages,
      translations,
      settings,
      stats: languageStats,
    })
  } catch (error) {
    console.error("Error fetching language settings:", error)
    return NextResponse.json({ error: "Failed to fetch language settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const settings = await request.json()

    // In production, save settings to database
    // For now, just return success
    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error saving language settings:", error)
    return NextResponse.json({ error: "Failed to save language settings" }, { status: 500 })
  }
}
