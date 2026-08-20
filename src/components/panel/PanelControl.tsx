import { useEffect, useState } from 'react'
import { getPanelHoy, actualizarCambio } from '../../services/panel.service'
import { mensajeDeError } from '../../utils/errores'
import EditarCambioModal from './EditarCambioModal'
import EditarPorcentajeGananciaModal from './EditarPorcentajeGananciaModal'
import type { PanelHoy, TotalPorMoneda } from '../../types/panel'
import '../../styles/panel/panel.scss'

const CANTIDAD_MOVIMIENTOS_VISIBLES = 3

// % de la venta diaria que se considera ganancia — editable a mano
// (guardado en el navegador, no en el backend), para que cada negocio lo
// ajuste segun su propio margen.
const PORCENTAJE_GANANCIA_STORAGE_KEY = 'oriol.porcentajeGanancia'
const PORCENTAJE_GANANCIA_DEFAULT = 30

function getPorcentajeGananciaGuardado(): number {
  if (typeof window === 'undefined') return PORCENTAJE_GANANCIA_DEFAULT
  const guardado = Number(window.localStorage.getItem(PORCENTAJE_GANANCIA_STORAGE_KEY))
  return Number.isFinite(guardado) && guardado > 0 ? guardado : PORCENTAJE_GANANCIA_DEFAULT
}

const formatearMoneda = (total: TotalPorMoneda) => {
  const partes: string[] = []
  if (total.pesos > 0) partes.push(`$ ${total.pesos.toFixed(2)}`)
  if (total.dolares > 0) partes.push(`U$ ${total.dolares.toFixed(2)}`)
  return partes.length > 0 ? partes.join(' + ') : '$ 0.00'
}

const formatearFechaHora = (fechaIso: string) =>
  new Date(fechaIso).toLocaleString('es-UY', {
    timeZone: 'America/Montevideo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatearFechaHoy = () =>
  new Date().toLocaleDateString('es-UY', {
    timeZone: 'America/Montevideo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

const PanelControl = () => {
  const [panel, setPanel] = useState<PanelHoy | null>(null)
  const [error, setError] = useState('')
  const [editandoCambio, setEditandoCambio] = useState(false)
  const [editandoPorcentaje, setEditandoPorcentaje] = useState(false)
  const [porcentajeGanancia, setPorcentajeGanancia] = useState(getPorcentajeGananciaGuardado)
  const [verTodosMovimientos, setVerTodosMovimientos] = useState(false)
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null)

  const cargarPanel = () => {
    getPanelHoy()
      .then((data) => {
        setPanel(data)
        setError('')
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el panel.')))
  }

  useEffect(() => {
    cargarPanel()
  }, [])

  const handleGuardarCambio = async (valor: number) => {
    await actualizarCambio(valor)
    setEditandoCambio(false)
    cargarPanel()
  }

  const handleGuardarPorcentaje = (valor: number) => {
    setPorcentajeGanancia(valor)
    window.localStorage.setItem(PORCENTAJE_GANANCIA_STORAGE_KEY, String(valor))
    setEditandoPorcentaje(false)
  }

  if (!panel) {
    return (
      <div className="container mt-4">
        <h2 className="mb-4">Panel de Control</h2>
        {error ? <div className="alert alert-danger">{error}</div> : <p className="text-muted">Cargando...</p>}
      </div>
    )
  }

  const movimientosVisibles = verTodosMovimientos
    ? panel.movimientos
    : panel.movimientos.slice(0, CANTIDAD_MOVIMIENTOS_VISIBLES)

  return (
    <div className="container mt-4 panel-container">
      <div className="panel-hero">
        <div>
          <div className="panel-hero-kicker">Caja de hoy</div>
          <h2 className="panel-hero-titulo">Panel de Control</h2>
          <div className="panel-hero-subtitulo">{formatearFechaHoy()}</div>
        </div>
        <div className="panel-hero-estado">Abierta</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="panel-section">
        <h4 className="panel-section-title">Caja diaria</h4>
        <div className="panel-tarjetas">
          <div className="panel-metric panel-metric--highlight">
            <div className="panel-metric-titulo">Venta diaria</div>
            <div className="panel-metric-valor">$ {panel.ventasDelDia.toFixed(2)}</div>
          </div>

          <div className="panel-metric">
            <div className="panel-metric-titulo">Ganancia ({porcentajeGanancia}%)</div>
            <div className="panel-metric-valor">$ {((panel.ventasDelDia * porcentajeGanancia) / 100).toFixed(2)}</div>
            <button type="button" className="panel-metric-editar-btn" onClick={() => setEditandoPorcentaje(true)}>
              Editar
            </button>
          </div>
        </div>

        <button type="button" className="panel-caja-inicial-link" onClick={() => setEditandoCambio(true)}>
          Caja inicial: $ {panel.cambio.toFixed(2)} · editar
        </button>
      </section>

      {/* 2. Medios de cobro (equivalente a "Medios de cobro" en LaClaudia) */}
      <section className="panel-section">
        <h4 className="panel-section-title">Medios de cobro</h4>
        <div className="panel-tarjetas">
          <div className="panel-metric">
            <div className="panel-metric-titulo">Efectivo</div>
            <div className="panel-metric-valor">{formatearMoneda(panel.totalEfectivo)}</div>
          </div>
          <div className="panel-metric">
            <div className="panel-metric-titulo">Tarjeta</div>
            <div className="panel-metric-valor">{formatearMoneda(panel.totalTarjeta)}</div>
          </div>
          <div className="panel-metric">
            <div className="panel-metric-titulo">Crédito</div>
            <div className="panel-metric-valor">{formatearMoneda(panel.totalCredito)}</div>
          </div>
        </div>
      </section>

      {/* 3. Movimientos: solo tipo + monto por fila; "Detalle" despliega
          una mini tarjeta con fecha/hora arriba y producto debajo. */}
      <section className="panel-section">
        <div className="panel-section-head">
          <h4 className="panel-section-title">Movimientos</h4>
          {panel.movimientos.length > CANTIDAD_MOVIMIENTOS_VISIBLES && (
            <button
              type="button"
              className="panel-movimiento-detalle-btn"
              onClick={() => setVerTodosMovimientos((v) => !v)}
            >
              {verTodosMovimientos ? 'Ver menos' : `Ver más (${panel.movimientos.length - CANTIDAD_MOVIMIENTOS_VISIBLES})`}
            </button>
          )}
        </div>
        {panel.movimientos.length === 0 ? (
          <p className="text-muted">Todavía no hay movimientos hoy.</p>
        ) : (
          <>
            <ul className="panel-movimientos">
              {movimientosVisibles.map((m, i) => {
                const abierto = detalleAbierto === i
                return (
                  <li key={i} className="panel-movimiento">
                    <div className="panel-movimiento-fila">
                      <span className={`panel-movimiento-tipo panel-movimiento-tipo--${m.tipo}`}>
                        {m.tipo === 'venta' ? 'Venta' : 'Pago'}
                      </span>
                      <span className={m.tipo === 'pago' ? 'panel-movimiento-monto panel-monto-menos' : 'panel-movimiento-monto panel-monto-mas'}>
                        {m.tipo === 'pago' ? '− ' : '+ '}
                        {m.currency === 'USD' ? 'U$' : '$'} {m.monto.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="panel-movimiento-detalle-btn"
                        onClick={() => setDetalleAbierto(abierto ? null : i)}
                      >
                        {abierto ? 'Ocultar detalle' : 'Detalle'}
                      </button>
                    </div>

                    {abierto && (
                      <div className="panel-movimiento-detalle">
                        <div className="panel-movimiento-detalle-info">
                          <span className="panel-movimiento-detalle-fecha">{formatearFechaHora(m.fecha)}</span>
                          <span className="panel-movimiento-detalle-producto">
                            {m.descripcion}
                            {m.cantidad ? ` x${m.cantidad}` : ''}
                          </span>
                        </div>
                        <span className={m.tipo === 'pago' ? 'panel-movimiento-detalle-valor panel-monto-menos' : 'panel-movimiento-detalle-valor panel-monto-mas'}>
                          {m.tipo === 'pago' ? '− ' : '+ '}
                          {m.currency === 'USD' ? 'U$' : '$'} {m.monto.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {editandoCambio && (
        <EditarCambioModal
          valorActual={panel.cambio}
          onCancelar={() => setEditandoCambio(false)}
          onGuardar={handleGuardarCambio}
        />
      )}

      {editandoPorcentaje && (
        <EditarPorcentajeGananciaModal
          valorActual={porcentajeGanancia}
          onCancelar={() => setEditandoPorcentaje(false)}
          onGuardar={handleGuardarPorcentaje}
        />
      )}
    </div>
  )
}

export default PanelControl
