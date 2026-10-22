import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getClientes } from '../../services/clientes.service'
import type { Cliente } from '../../types/cliente'
import '../../styles/scanner/modal.scss'

export interface NombreClienteEditado {
  clienteId: number | null
  nombreCliente: string | null
}

interface Props {
  clienteIdActual: number | null
  nombreActual: string
  onCancelar: () => void
  onGuardar: (resultado: NombreClienteEditado) => void
}

// Nombre del cliente en el borrador, ANTES de guardar la venta de verdad
// (pedido explicito, 22/10/2026: "poner el nombre de un cliente que ya
// esta de alta, o a mano si es nuevo") -- no toca el backend, solo
// cambia lo que se ve en esta boleta todavia sin confirmar.
const EditarNombreBorradorModal = ({ clienteIdActual, nombreActual, onCancelar, onGuardar }: Props) => {
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
    onGuardar({
      clienteId: clienteId || null,
      nombreCliente: nombreLibre.trim() || null,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Nombre del cliente</h4>

        <form onSubmit={handleSubmit}>
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

          <hr />

          <div className="mb-3">
            <label className="form-label">O escribilo a mano</label>
            <input
              type="text"
              className="form-control"
              placeholder="Cliente final"
              value={nombreLibre}
              onChange={handleNombreManual}
              autoFocus
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

export default EditarNombreBorradorModal
