import { apiFetch, errorDeRespuesta } from './apiClient'
import type { DiaMes, PanelHoy, ResumenMes, HistorialMeses, TotalMes } from '../types/panel'

export async function getPanelHoy(): Promise<PanelHoy> {
  const res = await apiFetch('/panel/hoy')
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el panel'))
  return res.json()
}

export async function getResumenMes(anio: number, mes: number): Promise<ResumenMes> {
  const res = await apiFetch(`/panel/mes/${anio}/${mes}`)
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el resumen del mes'))
  return res.json()
}

export async function getHistorialMeses(cantidad: number): Promise<HistorialMeses> {
  const res = await apiFetch(`/panel/historial-meses?cantidad=${cantidad}`)
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el historial de meses'))
  const data = (await res.json()) as { items: TotalMes[] }
  return { meses: data.items }
}

export async function actualizarCambio(cambio: number): Promise<void> {
  const res = await apiFetch('/panel/cambio', {
    method: 'PATCH',
    body: JSON.stringify({ cambio }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo actualizar el cambio'))
}

// Corrige el cierre de un dia ya cerrado (ej: el operario vendio algo
// fuera del sistema). Desde ahi ese valor queda como fuente de verdad,
// el cierre automatico de medianoche ya no lo vuelve a pisar.
export async function editarCierreDia(fecha: string, totalPesos: number, totalDolares: number): Promise<DiaMes> {
  const res = await apiFetch(`/cierres/${fecha}`, {
    method: 'PATCH',
    body: JSON.stringify({ totalPesos, totalDolares }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo corregir el cierre del dia'))
  const data = (await res.json()) as { item: { fecha: string; totalPesos: number; totalDolares: number } }
  return { ...data.item, diaSemana: '', cerrado: true }
}
