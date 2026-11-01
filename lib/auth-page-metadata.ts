import type { Metadata } from 'next'
import { pickLocaleText, type Locale } from './locale-config'

const copy = {
  login: {
    title: { en: 'Sign In', es: 'Iniciar sesión', it: 'Accedi' },
    description: { en: 'Sign in to your TravNeeds account to manage bookings and trips.', es: 'Inicia sesión en tu cuenta de TravNeeds para gestionar reservas y viajes.', it: 'Accedi al tuo account TravNeeds per gestire prenotazioni e viaggi.' },
  },
  register: {
    title: { en: 'Create Account', es: 'Crear cuenta', it: 'Crea un account' },
    description: { en: 'Create your TravNeeds account to book Egypt trips and manage your travel.', es: 'Crea tu cuenta de TravNeeds para reservar viajes a Egipto y gestionar tu viaje.', it: 'Crea il tuo account TravNeeds per prenotare viaggi in Egitto e gestire il tuo viaggio.' },
  },
  forgotPassword: {
    title: { en: 'Forgot Password', es: 'Recuperar contraseña', it: 'Recupera password' },
    description: { en: 'Reset your TravNeeds account password.', es: 'Restablece la contraseña de tu cuenta de TravNeeds.', it: 'Reimposta la password del tuo account TravNeeds.' },
  },
  resetPassword: {
    title: { en: 'Reset Password', es: 'Restablecer contraseña', it: 'Reimposta password' },
    description: { en: 'Set a new password for your TravNeeds account.', es: 'Establece una nueva contraseña para tu cuenta de TravNeeds.', it: 'Imposta una nuova password per il tuo account TravNeeds.' },
  },
} as const

export function authPageMetadata(page: keyof typeof copy, locale: Locale): Metadata {
  return {
    title: pickLocaleText(locale, copy[page].title),
    description: pickLocaleText(locale, copy[page].description),
    robots: { index: false, follow: false, nocache: true },
  }
}
