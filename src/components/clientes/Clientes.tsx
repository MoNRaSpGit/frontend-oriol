import { useEffect, useMemo, useState } from 'react'
import { eliminarCliente, getClientes } from '../../services/clientes.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'
import type { Venta } from '../../types/venta'
import AltaCliente from './AltaCliente'
import ListaClientes from './ListaClientes'
import DetalleCliente from './DetalleCliente'
import BoletaReimpresa from './BoletaReimpresa'
import '../../styles/clientes/clientes.scss'
import '../../styles/scanner/modal.scss'

// Sin tildes y en minusculas, para que buscar "jose" tambien encuentre a
// "José".
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [boletaAReimprimir, setBoletaAReimprimir] = useState<Venta | null>(null)
  const [modalAltaAbierto, setModalAltaAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar la lista de clientes.')))
      .finally(() => setCargando(false))
  }, [])

  const clientesFiltrados = useMemo(() => {
    const query = normalizar(busqueda.trim())
    if (!query) return clientes
    return clientes.filter((c) => normalizar(c.nombre).includes(query))
  }, [clientes, busqueda])

  const handleClienteCreado = (nuevo: Cliente) => {
    setClientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setModalAltaAbierto(false)
  }

  const handleClienteActualizado = (actualizado: Cliente) => {
    setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)))
    setClienteSeleccionado(actualizado)
  }

  const handleConfirmarEliminar = async () => {
    if (!clienteAEliminar) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await eliminarCliente(clienteAEliminar.id)
      setClientes((prev) => prev.filter((c) => c.id !== clienteAEliminar.id))
      if (clienteSeleccionado?.id === clienteAEliminar.id) {
        setClienteSeleccionado(null)
      }
      setClienteAEliminar(null)
    } catch (err) {
      setErrorEliminar(mensajeDeError(err, 'No se pudo eliminar el cliente.'))
    } finally {
      setEliminando(false)
    }
  }

  if (boletaAReimprimir && clienteSeleccionado) {
    return (
      <BoletaReimpresa
        venta={boletaAReimprimir}
        cliente={clienteSeleccionado}
        onVolver={() => setBoletaAReimprimir(null)}
      />
    )
  }

  return (
    <div className="container-fluid mt-4 clientes-container">
      <h2 className="mb-4">Cuenta corriente</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="clientes-columnas">
        <div className="clientes-col">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Clientes</h5>
            <button type="button" className="btn btn-primary" onClick={() => setModalAltaAbierto(true)}>
              Agregar cliente
            </button>
          </div>

          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar cliente por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {!cargando && clientes.length > 0 && clientesFiltrados.length === 0 ? (
            <p className="text-muted">No se encontraron clientes con ese nombre.</p>
          ) : (
            <ListaClientes
              clientes={clientesFiltrados}
              cargando={cargando}
              clienteSeleccionadoId={clienteSeleccionado?.id ?? null}
              onSeleccionar={setClienteSeleccionado}
              onEliminar={(c) => {
                setErrorEliminar('')
                setClienteAEliminar(c)
              }}
            />
          )}
        </div>

        <div className="clientes-col">
          <h5>Detalle</h5>
          {clienteSeleccionado ? (
            <DetalleCliente
              cliente={clienteSeleccionado}
              onReimprimir={setBoletaAReimprimir}
              onClienteActualizado={handleClienteActualizado}
            />
          ) : (
            <p className="text-muted">Seleccioná un cliente para ver su detalle.</p>
          )}
        </div>
      </div>

      {modalAltaAbierto && (
        <div className="modal-overlay" onClick={() => setModalAltaAbierto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h4>Alta de cliente</h4>
            <AltaCliente onCreado={handleClienteCreado} />
            <button
              type="button"
              className="btn modal-btn-cancelar w-100 mt-2"
              onClick={() => setModalAltaAbierto(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {clienteAEliminar && (
        <div className="modal-overlay" onClick={() => !eliminando && setClienteAEliminar(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h4>Eliminar cliente</h4>
            <p>
              ¿Seguro que querés eliminar a <strong>{clienteAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <p className="text-danger">{errorEliminar}</p>}
            <div className="modal-acciones">
              <button
                type="button"
                className="btn modal-btn-cancelar"
                onClick={() => setClienteAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn modal-btn-eliminar"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clientes
