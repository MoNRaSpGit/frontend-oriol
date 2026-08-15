import { useEffect, useState } from 'react'
import { getHistorialCliente, pagarDeudaCliente } from '../../services/clientes.service'
import { pagarBoletaCredito } from '../../services/ventas.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'
import type { ItemVenta, MetodoPago, TipoPagoCredito, Venta } from '../../types/venta'
import PagoCreditoModal from './PagoCreditoModal'

// Crédito (todavía debe) se marca en rojo; contado (efectivo o tarjeta,
// ya está pagado) en verde — para diferenciar de un vistazo qué boletas
// quedaron a deber y cuáles no. Colores sobrios y texto simple (sin
// badges ni pills llamativos): la app la usa gente mayor, prioriza
// legibilidad por sobre diseño moderno.
const ETIQUETA_METODO: Record<MetodoPago, string> = {
  credito: 'Crédito',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
}
const claseMetodo = (metodo: MetodoPago) => (metodo === 'credito' ? 'historial-item--credito' : 'historial-item--contado')

const formatearFecha = (fechaIso: string) => {
  const fecha = new Date(fechaIso)
  const diaTexto = fecha.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const horaTexto = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
  return `${diaTexto} hora ${horaTexto}`
}

// Uruguay es UTC-3 fijo (sin horario de verano) — mismo criterio que
// src/utils/fechas.ts del backend, para que la fecha coincida con la que
// vio el operador al momento de la venta.
const fechaIsoAYMD = (fechaIso: string) => {
  const fechaUy = new Date(new Date(fechaIso).getTime() - 3 * 60 * 60 * 1000)
  return fechaUy.toISOString().slice(0, 10)
}

const parsearItems = (detalleJson: string): ItemVenta[] | null => {
  try {
    return JSON.parse(detalleJson) as ItemVenta[]
  } catch {
    return null
  }
}

interface Props {
  cliente: Cliente
  onReimprimir: (venta: Venta) => void
  onClienteActualizado: (cliente: Cliente) => void
}

const DetalleCliente = ({ cliente, onReimprimir, onClienteActualizado }: Props) => {
  const [historial, setHistorial] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [pagandoDeuda, setPagandoDeuda] = useState(false)
  const [boletaAPagar, setBoletaAPagar] = useState<Venta | null>(null)

  useEffect(() => {
    setCargando(true)
    getHistorialCliente(cliente.id)
      .then((data) => {
        setHistorial(data)
        setError('')
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el historial.')))
      .finally(() => setCargando(false))
  }, [cliente.id])

  const handlePagarDeuda = async (tipo: TipoPagoCredito, monto?: number) => {
    const actualizado = await pagarDeudaCliente(cliente.id, tipo, monto)
    onClienteActualizado(actualizado)
    setPagandoDeuda(false)
  }

  const handlePagarBoleta = async (tipo: TipoPagoCredito, monto?: number) => {
    if (!boletaAPagar) return
    const ventaActualizada = await pagarBoletaCredito(boletaAPagar.id, tipo, monto)
    setHistorial((prev) => prev.map((v) => (v.id === ventaActualizada.id ? ventaActualizada : v)))
    const montoPagado = tipo === 'completo' ? boletaAPagar.saldo_pendiente : monto ?? 0
    onClienteActualizado({
      ...cliente,
      deuda: String(Math.max(Number(cliente.deuda) - montoPagado, 0)),
    })
    setBoletaAPagar(null)
  }

  const historialFiltrado = fechaFiltro
    ? historial.filter((v) => fechaIsoAYMD(v.fecha) === fechaFiltro)
    : historial

  return (
    <div>
      <div className="cliente-detalle-cabecera">
        <h4 className="mb-1">{cliente.nombre}</h4>
        {cliente.telefono && <p className="text-muted mb-0">Tel: {cliente.telefono}</p>}
        {cliente.cedula && <p className="text-muted mb-0">CI: {cliente.cedula}</p>}
      </div>

      <div className={`cliente-deuda-box ${Number(cliente.deuda) > 0 ? 'cliente-deuda-box--con-deuda' : ''}`}>
        <span className="cliente-deuda-label">Deuda actual</span>
        <span className="cliente-deuda-valor">$ {Number(cliente.deuda).toFixed(2)}</span>
        {Number(cliente.deuda) > 0 && (
          <button type="button" className="btn btn-sm cliente-deuda-btn-pagar" onClick={() => setPagandoDeuda(true)}>
            Pagar deuda
          </button>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
        <h6 className="mb-0">Historial de compras</h6>
        <input
          type="date"
          className="form-control form-control-sm cliente-filtro-fecha"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          title="Buscar por fecha"
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : historial.length === 0 ? (
        <p className="text-muted">Sin compras registradas.</p>
      ) : historialFiltrado.length === 0 ? (
        <p className="text-muted">No hay compras en esa fecha.</p>
      ) : (
        <ul className="historial-lista">
          {historialFiltrado.map((v) => (
            <li key={v.id} className={`historial-item ${claseMetodo(v.metodo_pago)}`}>
              <div className="historial-item-header">
                <div className="historial-fecha">{formatearFecha(v.fecha)}</div>
                <span className={`historial-metodo historial-metodo--${v.metodo_pago === 'credito' ? 'credito' : 'contado'}`}>
                  {ETIQUETA_METODO[v.metodo_pago]}
                </span>
              </div>
              <div className="historial-detalle">
                {(() => {
                  const items = parsearItems(v.detalle)
                  if (!items) return <p className="text-muted mb-0">Detalle no disponible</p>
                  return (
                    <table className="table table-bordered table-sm historial-detalle-tabla">
                      <thead>
                        <tr>
                          <th>Cant.</th>
                          <th>Descripción</th>
                          <th>P. Unit.</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => {
                          const simboloMoneda = item.currency === 'USD' ? 'U$' : '$'
                          return (
                            <tr key={i}>
                              <td>{item.cantidad}</td>
                              <td>{item.name}</td>
                              <td>
                                {simboloMoneda}
                                {item.precio.toFixed(2)}
                              </td>
                              <td>
                                {simboloMoneda}
                                {(item.precio * item.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                })()}
              </div>

              {v.metodo_pago === 'credito' && v.pagos.length > 0 && (
                <div className="historial-pagos">
                  {v.pagos.map((pago) => (
                    <p key={pago.id} className="historial-pago-linea text-muted mb-0">
                      Pago {pago.tipo === 'completo' ? 'completo' : 'parcial'} el {formatearFecha(pago.fecha)}: $ {pago.monto.toFixed(2)}
                      {' '}(saldo $ {pago.saldoNuevo.toFixed(2)})
                    </p>
                  ))}
                </div>
              )}

              <div className="historial-pie">
                <div className="historial-total">
                  {Number(v.total_pesos) > 0 && `$ ${Number(v.total_pesos).toFixed(2)} `}
                  {Number(v.total_dolares) > 0 && `U$ ${Number(v.total_dolares).toFixed(2)}`}
                  {v.metodo_pago === 'credito' && v.pago_individual_habilitado && (
                    <span className="historial-saldo-pendiente"> · saldo $ {v.saldo_pendiente.toFixed(2)}</span>
                  )}
                </div>
                <div className="historial-botones">
                  {v.metodo_pago === 'credito' && v.pago_individual_habilitado && v.saldo_pendiente > 0 && (
                    <button
                      type="button"
                      className="btn historial-btn-pagar btn-sm"
                      onClick={() => setBoletaAPagar(v)}
                    >
                      Pagar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn historial-btn-reimprimir btn-sm"
                    onClick={() => onReimprimir(v)}
                  >
                    Reimprimir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pagandoDeuda && (
        <PagoCreditoModal
          titulo="Pagar deuda"
          subtitulo={`Deuda acumulada de ${cliente.nombre}`}
          saldoPendiente={Number(cliente.deuda)}
          onCancelar={() => setPagandoDeuda(false)}
          onConfirmar={handlePagarDeuda}
        />
      )}

      {boletaAPagar && (
        <PagoCreditoModal
          titulo="Pagar boleta"
          subtitulo={formatearFecha(boletaAPagar.fecha)}
          saldoPendiente={boletaAPagar.saldo_pendiente}
          onCancelar={() => setBoletaAPagar(null)}
          onConfirmar={handlePagarBoleta}
        />
      )}
    </div>
  )
}

export default DetalleCliente
