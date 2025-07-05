import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        welcome: "Welcome to Flex.AI!",
        login: "Login",
        logout: "Logout",
        leaderboard: "Leaderboard",
        streak: "Daily Streak",
        goals: "Goals",
        // Add more keys as needed
      }
    },
    hi: {
      translation: {
        welcome: "फ्लेक्स.एआई में आपका स्वागत है!",
        login: "लॉगिन",
        logout: "लॉगआउट",
        leaderboard: "लीडरबोर्ड",
        streak: "दैनिक स्ट्रीक",
        goals: "लक्ष्य",
        // Add more keys as needed
      }
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n; 