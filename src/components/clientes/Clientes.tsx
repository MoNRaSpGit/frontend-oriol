import { useEffect, useState } from 'react'
import { getClientes } from '../../services/clientes.service'
import { mensajeDeError } from '../../utils/errores'
import type { Cliente } from '../../types/cliente'
import type { Venta } from '../../types/venta'
import AltaCliente from './AltaCliente'
import ListaClientes from './ListaClientes'
import DetalleCliente from './DetalleCliente'
import BoletaReimpresa from './BoletaReimpresa'
import '../../styles/clientes/clientes.scss'
import '../../styles/scanner/modal.scss'

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [boletaAReimprimir, setBoletaAReimprimir] = useState<Venta | null>(null)
  const [modalAltaAbierto, setModalAltaAbierto] = useState(false)

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar la lista de clientes.')))
      .finally(() => setCargando(false))
  }, [])

  const handleClienteCreado = (nuevo: Cliente) => {
    setClientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setModalAltaAbierto(false)
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
          <ListaClientes
            clientes={clientes}
            cargando={cargando}
            clienteSeleccionadoId={clienteSeleccionado?.id ?? null}
            onSeleccionar={setClienteSeleccionado}
          />
        </div>

        <div className="clientes-col">
          <h5>Detalle</h5>
          {clienteSeleccionado ? (
            <DetalleCliente cliente={clienteSeleccionado} onReimprimir={setBoletaAReimprimir} />
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
    </div>
  )
}

export default Clientes
