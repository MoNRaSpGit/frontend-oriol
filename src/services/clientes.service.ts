import { apiFetch, errorDeRespuesta } from './apiClient'
import type { Cliente } from '../types/cliente'
import type { PagoCredito, TipoPagoCredito, Venta } from '../types/venta'

interface ClienteApi {
  id: number
  nombre: string
  telefono: string | null
  cedula: string | null
  deuda: number
  createdAt: string
}

function aCliente(item: ClienteApi): Cliente {
  return {
    id: item.id,
    nombre: item.nombre,
    telefono: item.telefono,
    cedula: item.cedula,
    deuda: String(item.deuda),
    created_at: item.createdAt,
  }
}

interface PagoCreditoApi {
  id: number
  ventaId: number | null
  clienteId: number
  monto: number
  tipo: TipoPagoCredito
  saldoAnterior: number
  saldoNuevo: number
  fecha: string
}

function aPagoCredito(item: PagoCreditoApi): PagoCredito {
  return {
    id: item.id,
    ventaId: item.ventaId,
    clienteId: item.clienteId,
    monto: item.monto,
    tipo: item.tipo,
    saldoAnterior: item.saldoAnterior,
    saldoNuevo: item.saldoNuevo,
    fecha: item.fecha,
  }
}

export interface VentaApi {
  id: number
  clienteId: number | null
  metodoPago: Venta['metodo_pago']
  fecha: string
  totalPesos: number
  totalDolares: number
  montoPagado: number
  saldoPendiente: number
  pagoIndividualHabilitado: boolean
  detalle: unknown
  pagos: PagoCreditoApi[]
}

export function aVenta(item: VentaApi): Venta {
  return {
    id: item.id,
    cliente_id: item.clienteId,
    metodo_pago: item.metodoPago,
    fecha: item.fecha,
    total_pesos: String(item.totalPesos),
    total_dolares: String(item.totalDolares),
    detalle: JSON.stringify(item.detalle),
    monto_pagado: item.montoPagado,
    saldo_pendiente: item.saldoPendiente,
    pago_individual_habilitado: item.pagoIndividualHabilitado,
    pagos: item.pagos.map(aPagoCredito),
  }
}

export async function getClientes(): Promise<Cliente[]> {
  const res = await apiFetch('/clientes')
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener la lista de clientes'))
  const data = (await res.json()) as { items: ClienteApi[] }
  return data.items.map(aCliente)
}

export async function crearCliente(nombre: string, telefono?: string, cedula?: string): Promise<Cliente> {
  const res = await apiFetch('/clientes', {
    method: 'POST',
    body: JSON.stringify({ nombre, telefono, cedula }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo crear el cliente'))
  const data = (await res.json()) as { item: ClienteApi }
  return aCliente(data.item)
}

export async function getHistorialCliente(clienteId: number): Promise<Venta[]> {
  const res = await apiFetch(`/clientes/${clienteId}/historial`)
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el historial'))
  const data = (await res.json()) as { items: VentaApi[] }
  return data.items.map(aVenta)
}

// Pago (total o parcial) contra la deuda vieja acumulada del cliente, sin
// atarlo a ninguna boleta puntual (ver pago_individual_habilitado en Venta).
export async function pagarDeudaCliente(clienteId: number, tipo: TipoPagoCredito, monto?: number): Promise<Cliente> {
  const res = await apiFetch(`/clientes/${clienteId}/pagos-deuda`, {
    method: 'POST',
    body: JSON.stringify({ tipo, monto }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo registrar el pago'))
  const data = (await res.json()) as { item: ClienteApi }
  return aCliente(data.item)
}
