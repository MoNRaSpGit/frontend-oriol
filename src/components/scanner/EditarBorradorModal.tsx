import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getClientes } from '../../services/clientes.service'
import type { Cliente } from '../../types/cliente'
import type { MetodoPago } from '../../types/venta'
import '../../styles/scanner/modal.scss'

// Uruguay es UTC-3 fijo (sin horario de verano) -- mismo criterio que
// EditarVentaModal.tsx (el modal equivalente para ventas YA guardadas).
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

export interface BorradorEditado {
  metodoPago: MetodoPago
  fecha: string
  clienteId: number | null
  nombreCliente: string | null
}

interface Props {
  metodoActual: MetodoPago
  fechaActual: string
  clienteIdActual: number | null
  nombreActual: string
  onCancelar: () => void
  onGuardar: (resultado: BorradorEditado) => void
}

// Editar la boleta ANTES de confirmarla (pedido explicito, 22/10/2026:
// "el modal antiguo que tenia tipo de pago, cliente, etc -- lo unico que
// le agregamos es el cliente del select"). Mismos campos que
// EditarVentaModal.tsx, pero 100% local -- no toca el backend hasta que
// se confirma la venta de verdad (BoletaBorrador.tsx).
const EditarBorradorModal = ({ metodoActual, fechaActual, clienteIdActual, nombreActual, onCancelar, onGuardar }: Props) => {
  const [metodo, setMetodo] = useState<MetodoPago>(metodoActual)
  const [fechaInput, setFechaInput] = useState(fechaIsoAInputLocal(fechaActual))
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState<number | ''>(clienteIdActual ?? '')
  const [nombreLibre, setNombreLibre] = useState(nombreActual === 'Cliente final' ? '' : nombreActual)
  const [error, setError] = useState('')

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .catch(() => setError('No se pudo cargar la lista de clientes (igual podés escribir el nombre a mano).'))
  }, [])

  const handleSeleccionarCliente = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : ''
    setClienteId(id)
    if (id) {
      const existente = clientes.find((c) => c.id === id)
      if (existente) setNombreLibre(existente.nombre)
    }
  }

  const handleNombreManual = (e: ChangeEvent<HTMLInputElement>) => {
    setClienteId('')
    setNombreLibre(e.target.value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (metodo === 'credito' && !clienteId) {
      setError('Para crédito hay que elegir un cliente ya de alta.')
      return
    }
    setError('')
    onGuardar({
      metodoPago: metodo,
      fecha: inputLocalAFechaIso(fechaInput),
      clienteId: clienteId || null,
      nombreCliente: nombreLibre.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Corregir boleta</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Método de pago</label>
            <select className="form-select" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Fecha y hora</label>
            <input type="datetime-local" className="form-control" value={fechaInput} onChange={(e) => setFechaInput(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Cliente ya de alta</label>
            <select className="form-select" value={clienteId} onChange={handleSeleccionarCliente}>
              <option value="">Seleccioná...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">O escribilo a mano</label>
            <input
              type="text"
              className="form-control"
              placeholder="Cliente final"
              value={nombreLibre}
              onChange={handleNombreManual}
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarBorradorModal
