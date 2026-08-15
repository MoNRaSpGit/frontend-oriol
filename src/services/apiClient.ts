import { API_BASE_URL } from '../config/api'

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  try {
    return await fetch(`${API_BASE_URL}/oriol${path}`, { ...options, headers })
  } catch {
    // fetch solo tira acá por fallas de red o bloqueos de CORS — el browser
    // no expone mas detalle que esto por seguridad.
    throw new Error('No se pudo conectar con el servidor (red o CORS).')
  }
}

// Arma un mensaje de error legible a partir de una respuesta no-ok. El
// backend (NestJS) manda { message: "..." | ["...", ...] } en vez del
// { error: "..." } del backend original.
export async function errorDeRespuesta(res: Response, mensajePorDefecto: string): Promise<string> {
  const data = await res.json().catch(() => null)
  const mensaje = data?.message
  const detalle = Array.isArray(mensaje) ? mensaje[0] : mensaje || mensajePorDefecto
  return `(${res.status}) ${detalle}`
}
