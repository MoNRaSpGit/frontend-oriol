export type MetodoPago = 'efectivo' | 'tarjeta' | 'credito'

export type OriolCurrency = 'UYU' | 'USD'

export interface ItemVenta {
  id: number
  name: string
  cantidad: number
  precio: number
  currency: OriolCurrency
}

export type TipoPagoCredito = 'completo' | 'parcial'

// ventaId es null en pagos historicos contra la deuda vieja del cliente
// (esa funcion ya no existe, esos registros viejos quedan como estan).
// moneda indica cual de los dos saldos independientes de la boleta pago.
export interface PagoCredito {
  id: number
  ventaId: number | null
  clienteId: number
  monto: number
  moneda: OriolCurrency
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
  // Saldos independientes, sin conversion entre monedas -- una boleta con
  // items mezclados puede tener pendiente en pesos y en dolares a la vez.
  monto_pagado_pesos: number
  monto_pagado_dolares: number
  saldo_pendiente_pesos: number
  saldo_pendiente_dolares: number
  // Solo las boletas de credito creadas desde que existe el pago por
  // boleta puntual se pueden pagar individualmente -- las anteriores
  // tienen su deuda mezclada en el total acumulado del cliente.
  pago_individual_habilitado: boolean
  pagos: PagoCredito[]
}
