import { useState } from 'react'
import BoletaImprimible, { type DatosFactura } from '../factura/BoletaImprimible'
import EditarVentaModal from '../factura/EditarVentaModal'
import type { Cliente } from '../../types/cliente'
import type { ItemVenta, Venta } from '../../types/venta'
import type { ProductoBoleta } from '../../context/CarritoContext'

const PAGO_POR_METODO: Record<Venta['metodo_pago'], string> = {
  efectivo: 'Contado',
  tarjeta: 'Contado',
  credito: 'Crédito',
}

const formatearFecha = (fechaIso: string) =>
  new Date(fechaIso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })

interface Props {
  venta: Venta
  cliente: Cliente
  onVolver: () => void
}

const BoletaReimpresa = ({ venta, cliente, onVolver }: Props) => {
  const [metodoPago, setMetodoPago] = useState(venta.metodo_pago)
  const [fecha, setFecha] = useState(venta.fecha)
  const [clienteId, setClienteId] = useState<number | null>(venta.cliente_id)
  const [nombreCliente, setNombreCliente] = useState(cliente.nombre)
  const [mostrarEditar, setMostrarEditar] = useState(false)

  let items: ItemVenta[] = []
  try {
    items = JSON.parse(venta.detalle)
  } catch {
    items = []
  }

  // El detalle guardado de la venta solo tiene el nombre del producto (no
  // una descripcion aparte, esa vive en el catalogo actual y puede haber
  // cambiado desde entonces) -- se usa el nombre como descripcion para
  // que la tabla de la boleta no quede en blanco.
  const productos: ProductoBoleta[] = items.map((item) => ({
    codigo: item.id,
    name: item.name,
    descripcion: item.name,
    precio: item.precio,
    currency: item.currency,
    cantidad: item.cantidad,
    total: item.precio * item.cantidad,
  }))

  const datosFactura: DatosFactura = {
    rutEmisor: '',
    eFacture: 'e-Factura (reimpresión)',
    serie: 'A',
    fecha: formatearFecha(fecha),
    pago: PAGO_POR_METODO[metodoPago],
    moneda: 'UYU',
    rutReceptor: '',
    nombreCliente,
    direccionCliente: '',
    ubicacionCliente: 'MONTEVIDEO, URUGUAY',
  }

  return (
    <>
      <BoletaImprimible
        datosFactura={datosFactura}
        productos={productos}
        totalPesos={Number(venta.total_pesos)}
        totalDolares={Number(venta.total_dolares)}
        textoBotonVolver="Volver"
        onVolver={onVolver}
        onEditar={() => setMostrarEditar(true)}
      />

      {mostrarEditar && (
        <EditarVentaModal
          ventaId={venta.id}
          metodoActual={metodoPago}
          fechaActual={fecha}
          clienteIdActual={clienteId}
          onCancelar={() => setMostrarEditar(false)}
          onGuardado={(resultado) => {
            setMetodoPago(resultado.metodoPago)
            setFecha(resultado.fecha)
            if (resultado.clienteNombre) {
              setClienteId(resultado.clienteId)
              setNombreCliente(resultado.clienteNombre)
            }
            setMostrarEditar(false)
          }}
        />
      )}
    </>
  )
}

export default BoletaReimpresa
