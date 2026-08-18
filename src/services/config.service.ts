import { apiFetch, errorDeRespuesta } from './apiClient'

export async function getTasaDolar(): Promise<number> {
  const res = await apiFetch('/config')
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener la configuración'))
  const data = (await res.json()) as { tasaDolar: number }
  return data.tasaDolar
}

// Fuente de verdad unica para la conversion dolar->pesos: la usan el
// checkout (PieFactura, via useTasaDolar) y el Panel (caja del dia,
// ganancia). Cambiarla se refleja en todos lados sin necesitar deploy.
export async function actualizarTasaDolar(tasaDolar: number): Promise<number> {
  const res = await apiFetch('/config/tasa-dolar', {
    method: 'PATCH',
    body: JSON.stringify({ tasaDolar }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo actualizar la tasa'))
  const data = (await res.json()) as { item: { tasaDolar: number } }
  return data.item.tasaDolar
}
