import { useEffect, useRef, useState } from 'react'
import { Workbox } from 'workbox-window'

// Chequea cada 3 minutos si hay una versión nueva del service worker —
// pensado para la tablet que queda con la app abierta todo el día.
const INTERVALO_CHEQUEO_MS = 3 * 60 * 1000

// Si no hay ninguna interacción (click/tecla/toque) durante este tiempo,
// se considera que nadie está usando la app en este momento.
const INACTIVIDAD_MS = 2 * 60 * 1000
// Cada cuánto se revisa, mientras hay una versión esperando, si ya se
// llegó a ese umbral de inactividad.
const CHEQUEO_INACTIVIDAD_MS = 15 * 1000

export function useServiceWorkerUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const wbRef = useRef<Workbox | null>(null)
  const ultimaActividadRef = useRef(Date.now())
  const autoActualizadoRef = useRef(false)

  // Registra actividad del usuario para saber si la app esta "en uso" o
  // no en cualquier momento dado.
  useEffect(() => {
    const marcarActividad = () => {
      ultimaActividadRef.current = Date.now()
    }
    const eventos: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    eventos.forEach((evento) => window.addEventListener(evento, marcarActividad, { passive: true }))
    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, marcarActividad))
    }
  }, [])

  useEffect(() => {
    // El service worker solo se genera en el build de producción (no en
    // "npm run dev"), así que acá no hay nada que registrar.
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return

    const wb = new Workbox(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      // Clave: sin esto, GitHub Pages (Cache-Control: max-age=600 en
      // sw.js) puede hacer que el navegador siga viendo la versión
      // vieja del service worker durante ese rato, aunque el chequeo
      // periódico de más abajo se dispare igual.
      updateViaCache: 'none',
    })
    wbRef.current = wb

    wb.addEventListener('waiting', () => setNeedRefresh(true))

    // Se registra acá (al montar) y no dentro de actualizar(), porque el
    // service worker nuevo queda compartido por todas las pestañas/PWA
    // abiertas en el mismo origen. Si el usuario actualiza desde OTRA
    // pestaña, esta también recibe "controlling" — y si el listener
    // solo se agregaba al hacer clic en "Actualizar", esta pestaña se
    // perdía el evento (ya había pasado) y el botón quedaba pegado
    // pidiendo un F5 manual para arreglarse.
    wb.addEventListener('controlling', () => window.location.reload())

    let intervalId: ReturnType<typeof setInterval> | undefined
    wb.register().then((registration) => {
      if (!registration) return
      intervalId = setInterval(() => {
        registration.update()
      }, INTERVALO_CHEQUEO_MS)
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const actualizar = () => {
    autoActualizadoRef.current = true
    wbRef.current?.messageSkipWaiting()
  }

  // Mientras hay una version nueva esperando, se fija cada quince
  // segundos si ya pasaron los dos minutos de inactividad -- si la app
  // quedo sin uso, actualiza sola (sin que el usuario tenga que tocar
  // "Actualizar"). Si en cambio esta en uso activo, no hace nada y sigue
  // mostrando el cartel para que la persona decida cuando cortar.
  useEffect(() => {
    if (!needRefresh || autoActualizadoRef.current) return
    const intervalId = setInterval(() => {
      const inactivo = Date.now() - ultimaActividadRef.current >= INACTIVIDAD_MS
      if (inactivo) {
        actualizar()
        clearInterval(intervalId)
      }
    }, CHEQUEO_INACTIVIDAD_MS)
    return () => clearInterval(intervalId)
  }, [needRefresh])

  return { needRefresh, actualizar }
}
