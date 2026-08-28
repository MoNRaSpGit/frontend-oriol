import { useEffect, useState, type FormEvent } from 'react'
import { getClientes } from '../../services/clientes.service'
import { actualizarVenta } from '../../services/ventas.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'
import type { MetodoPago } from '../../types/venta'
import '../../styles/scanner/modal.scss'

// Uruguay es UTC-3 fijo (sin horario de verano) — mismo criterio que
// src/utils/fechas.ts del backend y DetalleCliente.tsx, para que la
// fecha que ve el operario coincida con la real.
const OFFSET_URUGUAY_MS = 3 * 60 * 60 * 1000

const fechaIsoAInputLocal = (fechaIso: string) => {
  const fechaUy = new Date(new Date(fechaIso).getTime() - OFFSET_URUGUAY_MS)
  return fechaUy.toISOString().slice(0, 16)
}

const inputLocalAFechaIso = (valorInput: string) => {
  const [fecha, hora] = valorInput.split('T')
  const [y, m, d] = fecha.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  const comoUtc = Date.UTC(y, m - 1, d, hh, mm)
  return new Date(comoUtc + OFFSET_URUGUAY_MS).toISOString()
}

const hoyEnUruguay = () => fechaIsoAInputLocal(new Date().toISOString()).slice(0, 10)

export interface VentaEditada {
  metodoPago: MetodoPago
  fecha: string
  clienteId: number | null
  clienteNombre: string | null
}

interface Props {
  ventaId: number
  metodoActual: MetodoPago
  fechaActual: string
  clienteIdActual: number | null
  // Nombre que se ve hoy en la factura (o "Cliente final" si no tiene). Solo
  // se usa como valor inicial del campo libre -- no se guarda en la base,
  // vale solo para esta boleta en pantalla.
  nombreClienteActual: string
  onCancelar: () => void
  onGuardado: (resultado: VentaEditada) => void
}

const EditarVentaModal = ({
  ventaId,
  metodoActual,
  fechaActual,
  clienteIdActual,
  nombreClienteActual,
  onCancelar,
  onGuardado,
}: Props) => {
  const fechaInicial = fechaIsoAInputLocal(fechaActual)
  const [metodo, setMetodo] = useState<MetodoPago>(metodoActual)
  const [fechaInput, setFechaInput] = useState(fechaInicial)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState<number | ''>(clienteIdActual ?? '')
  const [nombreLibre, setNombreLibre] = useState(nombreClienteActual === 'Cliente final' ? '' : nombreClienteActual)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (metodo === 'credito') {
      getClientes()
        .then(setClientes)
        .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar la lista de clientes.')))
    }
  }, [metodo])

  const cambiaDeDia = fechaInput.slice(0, 10) !== hoyEnUruguay()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (metodo === 'credito' && !clienteId) {
      setError('Para pasar a crédito hay que elegir un cliente.')
      return
    }

    setError('')
    setGuardando(true)
    const fechaFinal = fechaInput !== fechaInicial ? inputLocalAFechaIso(fechaInput) : fechaActual
    // El nombre "libre" (efectivo/tarjeta) es solo para esta boleta en
    // pantalla -- no se manda al backend, así que no va en actualizarVenta.
    const clienteNombreFinal =
      metodo === 'credito' ? clientes.find((c) => c.id === Number(clienteId))?.nombre ?? null : nombreLibre.trim() || null
    try {
      await actualizarVenta(ventaId, {
        metodo_pago: metodo,
        fecha: fechaInput !== fechaInicial ? fechaFinal : undefined,
        cliente_id: metodo === 'credito' ? Number(clienteId) : undefined,
      })
      onGuardado({
        metodoPago: metodo,
        fecha: fechaFinal,
        clienteId: metodo === 'credito' ? Number(clienteId) : null,
        clienteNombre: clienteNombreFinal,
      })
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar la venta. Probá de nuevo.'))
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Corregir venta</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Método de pago</label>
            <select
              className="form-select"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          {metodo === 'credito' ? (
            <div className="mb-3">
              <label className="form-label">Cliente</label>
              <select
                className="form-select"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Seleccioná un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label">Nombre del cliente</label>
              <input
                type="text"
                className="form-control"
                placeholder="Cliente final"
                value={nombreLibre}
                onChange={(e) => setNombreLibre(e.target.value)}
              />
              <small className="text-muted">Si lo dejás vacío, la factura dice "Cliente final".</small>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Fecha y hora</label>
            <input
              type="datetime-local"
              className="form-control"
              value={fechaInput}
              onChange={(e) => setFechaInput(e.target.value)}
            />
          </div>

          {cambiaDeDia && (
            <p className="text-danger">
              Ojo: con esta fecha, la venta va a quedar fuera del resumen de hoy en el Panel de Control.
            </p>
          )}

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarVentaModal
