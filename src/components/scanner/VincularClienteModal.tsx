import { useState, type FormEvent } from 'react'
import type { Cliente } from '../../types/cliente'
import '../../styles/scanner/modal.scss'

export interface ClienteVinculado {
  tipo: 'existente' | 'nuevo'
  clienteId?: number
  nombre: string
  telefono?: string
  cedula?: string
}

interface Props {
  clientes: Cliente[]
  onCancelar: () => void
  onConfirmar: (cliente: ClienteVinculado) => void
}

// Sin tildes ni mayusculas, para que "jose" encuentre "José".
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const MAX_RESULTADOS = 8

const VincularClienteModal = ({ clientes, onCancelar, onConfirmar }: Props) => {
  const [clienteId, setClienteId] = useState<number | ''>('')
  // Buscador en vez de <select> (30/10/2026, pedido explicito: "pone las
  // primeras tres letras y ya te saca el filtro"). Busca por nombre, cedula
  // o telefono, en cualquier parte del texto.
  const [busqueda, setBusqueda] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const [error, setError] = useState('')

  const termino = normalizar(busqueda.trim())
  const resultados = termino
    ? clientes
        .filter((c) => [c.nombre, c.cedula ?? '', c.telefono ?? ''].some((campo) => normalizar(campo).includes(termino)))
        .slice(0, MAX_RESULTADOS)
    : []
  const seleccionado = clienteId ? clientes.find((c) => c.id === clienteId) ?? null : null

  const elegir = (cliente: Cliente) => {
    setClienteId(cliente.id)
    setBusqueda('')
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Enter en el buscador con resultados = elegir el primero.
    if (!clienteId && termino && resultados.length && !nombre.trim()) {
      elegir(resultados[0])
      return
    }
    if (clienteId) {
      const existente = clientes.find((c) => c.id === clienteId)
      if (!existente) return
      onConfirmar({ tipo: 'existente', clienteId: existente.id, nombre: existente.nombre })
      return
    }
    if (!nombre.trim()) {
      setError('Ingresá el nombre del cliente.')
      return
    }
    onConfirmar({
      tipo: 'nuevo',
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      cedula: cedula.trim() || undefined,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Guardar boleta a nombre de un cliente</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="buscar-cliente">
              Cliente existente
            </label>
            {seleccionado ? (
              <div className="modal-cliente-vinculado">
                <span>
                  <strong>{seleccionado.nombre}</strong>
                  {seleccionado.cedula ? ` · ${seleccionado.cedula}` : ''}
                </span>
                <button type="button" className="btn btn-link p-0" onClick={() => setClienteId('')}>
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <input
                  id="buscar-cliente"
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={!!nombre.trim()}
                  autoComplete="off"
                  autoFocus
                />
                {termino && (
                  <ul className="buscador-clientes-lista">
                    {resultados.length ? (
                      resultados.map((c) => (
                        <li key={c.id}>
                          <button type="button" onClick={() => elegir(c)}>
                            <span>{c.nombre}</span>
                            {(c.cedula || c.telefono) && <small>{c.cedula || c.telefono}</small>}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="buscador-clientes-vacio">No hay clientes con "{busqueda.trim()}". Cargalo abajo como nuevo.</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          <hr />

          <p className="form-label">O cliente nuevo</p>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!!clienteId}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Teléfono (opcional)</label>
            <input
              type="text"
              className="form-control"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={!!clienteId}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Cédula (opcional)</label>
            <input
              type="text"
              className="form-control"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={!!clienteId}
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar">
              Guardar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VincularClienteModal
