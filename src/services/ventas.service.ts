import { apiFetch, errorDeRespuesta } from './apiClient'
import { aVenta, type VentaApi } from './clientes.service'
import type { ItemVenta, MetodoPago, OriolCurrency, TipoPagoCredito, Venta } from '../types/venta'

export interface NuevaVentaCredito {
  cliente_id: number
  total_pesos: number
  total_dolares: number
  items: ItemVenta[]
}

export interface NuevaVentaContado {
  metodo_pago: 'efectivo' | 'tarjeta'
  total_pesos: number
  total_dolares: number
  items: ItemVenta[]
  cliente_id?: number
}

export interface VentaCreada {
  id: number
  fecha: string
}

// total_pesos/total_dolares no se mandan: el backend los recalcula el
// mismo a partir de los items, para no confiar en un total ya calculado
// del lado del cliente.
export async function registrarVentaCredito(venta: NuevaVentaCredito): Promise<VentaCreada> {
  const res = await apiFetch('/ventas/credito', {
    method: 'POST',
    body: JSON.stringify({ clienteId: venta.cliente_id, items: venta.items }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo registrar la venta'))
  const data = (await res.json()) as { item: { id: number; fecha: string } }
  return { id: data.item.id, fecha: data.item.fecha }
}

export async function registrarVentaContado(venta: NuevaVentaContado): Promise<VentaCreada> {
  const res = await apiFetch('/ventas/contado', {
    method: 'POST',
    body: JSON.stringify({ metodoPago: venta.metodo_pago, clienteId: venta.cliente_id, items: venta.items }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo registrar la venta'))
  const data = (await res.json()) as { item: { id: number; fecha: string } }
  return { id: data.item.id, fecha: data.item.fecha }
}

export interface VentaActualizar {
  metodo_pago?: MetodoPago
  fecha?: string
  cliente_id?: number
}

export async function actualizarVenta(id: number, cambios: VentaActualizar): Promise<void> {
  const res = await apiFetch(`/ventas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ metodoPago: cambios.metodo_pago, fecha: cambios.fecha, clienteId: cambios.cliente_id }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo actualizar la venta'))
}

// Pago (total o parcial) de una boleta de credito puntual, contra uno de
// los dos saldos independientes de la boleta (pesos o dolares) -- solo
// disponible si la boleta trae pago_individual_habilitado en true.
export async function pagarBoletaCredito(
  ventaId: number,
  moneda: OriolCurrency,
  tipo: TipoPagoCredito,
  monto?: number
): Promise<Venta> {
  const res = await apiFetch(`/ventas/${ventaId}/pagos-credito`, {
    method: 'POST',
    body: JSON.stringify({ moneda, tipo, monto }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo registrar el pago'))
  const data = (await res.json()) as { item: VentaApi }
  return aVenta(data.item)
}
