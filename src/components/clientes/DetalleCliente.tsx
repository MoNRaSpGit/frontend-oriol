import { useEffect, useState } from 'react'
import { getHistorialCliente } from '../../services/clientes.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'
import type { ItemVenta, MetodoPago, Venta } from '../../types/venta'

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
}

const DetalleCliente = ({ cliente, onReimprimir }: Props) => {
  const [historial, setHistorial] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')

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
                <span className="historial-detalle-titulo">Llevó:</span>
                {(() => {
                  const items = parsearItems(v.detalle)
                  if (!items) return <span> detalle no disponible</span>
                  return (
                    <ul className="historial-detalle-items">
                      {items.map((item, i) => (
                        <li key={i}>
                          {item.cantidad} {item.name}
                        </li>
                      ))}
                    </ul>
                  )
                })()}
              </div>
              <div className="historial-pie">
                <div className="historial-total">
                  {Number(v.total_pesos) > 0 && `$ ${Number(v.total_pesos).toFixed(2)} `}
                  {Number(v.total_dolares) > 0 && `U$ ${Number(v.total_dolares).toFixed(2)}`}
                </div>
                <button
                  type="button"
                  className="btn historial-btn-reimprimir btn-sm"
                  onClick={() => onReimprimir(v)}
                >
                  Reimprimir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DetalleCliente
