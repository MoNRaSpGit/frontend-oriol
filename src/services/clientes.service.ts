import { apiFetch, errorDeRespuesta } from './apiClient'
import type { Cliente } from '../types/cliente'
import type { PagoCredito, TipoPagoCredito, Venta } from '../types/venta'

interface ClienteApi {
  id: number
  nombre: string
  telefono: string | null
  cedula: string | null
  deuda: number
  deudaDolares: number
  createdAt: string
}

function aCliente(item: ClienteApi): Cliente {
  return {
    id: item.id,
    nombre: item.nombre,
    telefono: item.telefono,
    cedula: item.cedula,
    deuda: String(item.deuda),
    deuda_dolares: String(item.deudaDolares),
    created_at: item.createdAt,
  }
}

interface PagoCreditoApi {
  id: number
  ventaId: number | null
  clienteId: number
  monto: number
  moneda: 'UYU' | 'USD'
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
    moneda: item.moneda,
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
  montoPagadoPesos: number
  montoPagadoDolares: number
  saldoPendientePesos: number
  saldoPendienteDolares: number
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
    monto_pagado_pesos: item.montoPagadoPesos,
    monto_pagado_dolares: item.montoPagadoDolares,
    saldo_pendiente_pesos: item.saldoPendientePesos,
    saldo_pendiente_dolares: item.saldoPendienteDolares,
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

export async function eliminarCliente(clienteId: number): Promise<void> {
  const res = await apiFetch(`/clientes/${clienteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo eliminar el cliente'))
}

export async function getHistorialCliente(clienteId: number): Promise<Venta[]> {
  const res = await apiFetch(`/clientes/${clienteId}/historial`)
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el historial'))
  const data = (await res.json()) as { items: VentaApi[] }
  return data.items.map(aVenta)
}
