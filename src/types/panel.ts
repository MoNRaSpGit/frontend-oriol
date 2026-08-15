export interface TotalPorMoneda {
  pesos: number
  dolares: number
}

export interface MovimientoPanel {
  tipo: 'venta' | 'pago'
  descripcion: string
  cantidad: number | null
  monto: number
  currency: 'UYU' | 'USD' | null
  fecha: string
}

export interface PanelHoy {
  totalTarjeta: TotalPorMoneda
  totalEfectivo: TotalPorMoneda
  totalCredito: TotalPorMoneda
  totalPagos: number
  cambio: number
  caja: number
  ventasDelDia: number
  ganancias: number
  movimientos: MovimientoPanel[]
}

export interface DiaMes {
  fecha: string
  diaSemana: string
  totalPesos: number
  totalDolares: number
  // true si ya paso por el cierre automatico de medianoche (o se corrigio
  // a mano) — ese valor es la fuente de verdad. false = todavia se esta
  // calculando en vivo (el dia de hoy).
  cerrado: boolean
}

export interface SemanaMes {
  numero: number
  dias: DiaMes[]
  totalPesos: number
  totalDolares: number
}

export interface ResumenMes {
  anio: number
  mes: number
  semanas: SemanaMes[]
  totalPesos: number
  totalDolares: number
}

export interface TotalMes {
  anio: number
  mes: number
  totalPesos: number
  totalDolares: number
}

export interface HistorialMeses {
  meses: TotalMes[]
}
