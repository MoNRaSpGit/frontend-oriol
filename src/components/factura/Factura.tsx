import { useState } from 'react'
import { FaPrint } from 'react-icons/fa'
import { useCarrito } from '../../context/CarritoContext'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import CabeceraFactura, { type DatosFactura } from './CabeceraFactura'
import TablaProductoFactura from './TablaProductoFactura'
import PieFactura from './PieFactura'
import EditarDatosFacturaModal from './EditarDatosFacturaModal'
import '../../styles/factura/factura.scss'
import '../../styles/factura/logo.scss'
import '../../styles/factura/rectangulo.scss'
import '../../styles/factura/pie.scss'

const obtenerFechaActual = () =>
  new Date().toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })

const Factura = () => {
  const { productosSeleccionados, removeProduct, vaciarCarrito } = useCarrito()
  const [finalEnDolares, setFinalEnDolares] = useState(false)
  const tasaDolar = useTasaDolar()

  const [modalAbierto, setModalAbierto] = useState(false)

  const [datosFactura, setDatosFactura] = useState<DatosFactura>({
    rutEmisor: '',
    eFacture: 'e-Factura',
    serie: 'A',
    fecha: obtenerFechaActual(),
    pago: 'Contado',
    moneda: 'UYU',
    rutReceptor: '',
    nombreCliente: 'Cliente final',
    direccionCliente: '',
    ubicacionCliente: 'TACUAREMBÓ, URUGUAY',
  })

  if (!productosSeleccionados.length) {
    return (
      <div className="factura-container">
        <h2 className="text-center mt-4">Factura</h2>
        <p className="text-center">No hay productos agregados a la factura.</p>
      </div>
    )
  }

  let totalPesos = 0
  let totalDolares = 0

  productosSeleccionados.forEach((producto) => {
    const subtotal = producto.precio * producto.cantidad
    if (producto.currency === 'USD') {
      totalDolares += subtotal
    } else {
      totalPesos += subtotal
    }
  })

  return (
    <div className="factura-container">
      <CabeceraFactura
        datosFactura={datosFactura}
        finalEnDolares={finalEnDolares}
        onEditar={() => setModalAbierto(true)}
      />

      <div className="linea-divisoria"></div>

      <TablaProductoFactura
        productosSeleccionados={productosSeleccionados}
        handleEliminarDeFactura={removeProduct}
      />

      <div className="linea-divisoria"></div>

      <PieFactura
        totalPesos={totalPesos}
        totalDolares={totalDolares}
        finalEnDolares={finalEnDolares}
        setFinalEnDolares={setFinalEnDolares}
        tasaDolar={tasaDolar}
      />

      {modalAbierto && (
        <EditarDatosFacturaModal
          datosFactura={datosFactura}
          setDatosFactura={setDatosFactura}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

      <div className="factura-acciones-bar">
        <button className="btn btn-outline-secondary btn-lg" onClick={vaciarCarrito}>
          Cancelar
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            window.print()
            vaciarCarrito()
          }}
        >
          <FaPrint /> Imprimir
        </button>
      </div>
    </div>
  )
}

export default Factura
