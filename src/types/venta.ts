export type MetodoPago = 'efectivo' | 'tarjeta' | 'credito'

export interface ItemVenta {
  id: number
  name: string
  cantidad: number
  precio: number
  currency: 'UYU' | 'USD'
}

export type TipoPagoCredito = 'completo' | 'parcial'

// ventaId es null cuando el pago es contra la deuda vieja del cliente (no
// atado a una boleta puntual) -- ver pagarDeudaCliente en el backend.
export interface PagoCredito {
  id: number
  ventaId: number | null
  clienteId: number
  monto: number
  tipo: TipoPagoCredito
  saldoAnterior: number
  saldoNuevo: number
  fecha: string
}

export interface Venta {
  id: number
  cliente_id: number | null
  metodo_pago: MetodoPago
  fecha: string
  total_pesos: string
  total_dolares: string
  detalle: string
  monto_pagado: number
  saldo_pendiente: number
  // Solo las boletas de credito creadas desde que existe el pago por
  // boleta puntual se pueden pagar individualmente -- las anteriores
  // tienen su deuda mezclada en el total acumulado del cliente.
  pago_individual_habilitado: boolean
  pagos: PagoCredito[]
}
