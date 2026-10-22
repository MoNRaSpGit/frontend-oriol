import { useEffect, useState } from 'react'
import type { DatosFactura } from './CabeceraFactura'
import { getClientes } from '../../services/clientes.service'
import type { Cliente } from '../../types/cliente'
import '../../styles/scanner/modal.scss'

interface Props {
  datosFactura: DatosFactura
  setDatosFactura: (datos: DatosFactura) => void
  onCerrar: () => void
}

const EditarDatosFacturaModal = ({ datosFactura, setDatosFactura, onCerrar }: Props) => {
  const handleChange = (campo: keyof DatosFactura) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDatosFactura({ ...datosFactura, [campo]: e.target.value })
  }

  // Elegir un cliente ya de alta, o escribirlo a mano (pedido explicito,
  // 22/10/2026: "tener el modo manual... o el select de los clientes
  // actuales, las dos opciones"). Elegir del select llena el nombre;
  // escribir a mano vuelve a dejar el select en "Seleccioná...".
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState<number | ''>('')

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .catch(() => {
        // Si falla, el modo manual sigue funcionando igual.
      })
  }, [])

  const handleSeleccionarCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : ''
    setClienteId(id)
    if (id) {
      const existente = clientes.find((c) => c.id === id)
      if (existente) setDatosFactura({ ...datosFactura, nombreCliente: existente.nombre })
    }
  }

  const handleNombreManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClienteId('')
    setDatosFactura({ ...datosFactura, nombreCliente: e.target.value })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Datos de la factura</h4>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onCerrar()
          }}
        >
          <div className="mb-3">
            <label className="form-label">RUT emisor</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.rutEmisor}
              onChange={handleChange('rutEmisor')}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Fecha</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.fecha}
              onChange={handleChange('fecha')}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Forma de pago</label>
            <select className="form-select" value={datosFactura.pago} onChange={handleChange('pago')}>
              <option value="Contado">Contado</option>
              <option value="Crédito">Crédito</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">RUT receptor</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.rutReceptor}
              onChange={handleChange('rutReceptor')}
            />
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
            <label className="form-label">Nombre del cliente (a mano)</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.nombreCliente}
              onChange={handleNombreManual}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Dirección del cliente</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.direccionCliente}
              onChange={handleChange('direccionCliente')}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Ubicación del cliente</label>
            <input
              type="text"
              className="form-control"
              value={datosFactura.ubicacionCliente}
              onChange={handleChange('ubicacionCliente')}
            />
          </div>

          <div className="modal-acciones">
            <button type="submit" className="btn modal-btn-confirmar">
              Listo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarDatosFacturaModal
