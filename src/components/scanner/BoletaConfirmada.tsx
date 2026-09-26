import { useState } from 'react'
import BoletaImprimible, { type DatosFactura } from '../factura/BoletaImprimible'
import EditarVentaModal from '../factura/EditarVentaModal'
import { useToast } from '../../context/ToastContext'
import { actualizarCantidadItemVenta } from '../../services/ventas.service'
import { mensajeDeError } from '../../utils/errores'
import type { ProductoBoleta } from '../../context/CarritoContext'
import type { ItemVenta, MetodoPago } from '../../types/venta'

// El backend devuelve el detalle como items "crudos" (id/name/cantidad/
// precio/currency) -- se convierte al shape que ya usa toda la pantalla de
// factura (ProductoBoleta) despues de cambiar una cantidad.
function itemsVentaAProductosBoleta(items: ItemVenta[]): ProductoBoleta[] {
  return items.map((item) => ({
    codigo: item.id,
    name: item.name,
    descripcion: item.name,
    precio: item.precio,
    currency: item.currency,
    cantidad: item.cantidad,
    total: item.precio * item.cantidad,
  }))
}

const PAGO_POR_METODO: Record<MetodoPago, string> = {
  efectivo: 'Contado',
  tarjeta: 'Contado',
  credito: 'Crédito',
}

const formatearFecha = (fechaIso: string) =>
  new Date(fechaIso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })

export interface VentaAbiertaInfo {
  ventaId: number
  metodoPago: MetodoPago
  fecha: string
  nombreCliente?: string
  clienteId?: number
  productosPrevios: ProductoBoleta[]
  totalPesosPrevio: number
  totalDolaresPrevio: number
}

interface Props {
  ventaId: number
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
  metodoPago: MetodoPago
  fecha: string
  nombreCliente?: string
  clienteId?: number
  onCerrar: () => void
  // "Volver": manda al scanner a seguir agregando productos a ESTA MISMA
  // boleta -- la boleta no se cierra hasta Cerrar o Imprimir.
  onAgregarProductos: (info: VentaAbiertaInfo) => void
}

const BoletaConfirmada = ({
  ventaId,
  productos: productosProp,
  totalPesos: totalPesosProp,
  totalDolares: totalDolaresProp,
  metodoPago: metodoPagoProp,
  fecha: fechaProp,
  nombreCliente: nombreClienteProp,
  clienteId: clienteIdProp,
  onCerrar,
  onAgregarProductos,
}: Props) => {
  const { mostrarToast } = useToast()
  // Cantidad editable con "-1+" (pedido explicito, 26/09/2026): productos y
  // totales pasan a vivir en estado local (antes eran solo props fijas) para
  // poder actualizarlos apenas el backend confirma el cambio.
  const [productos, setProductos] = useState(productosProp)
  const [totalPesos, setTotalPesos] = useState(totalPesosProp)
  const [totalDolares, setTotalDolares] = useState(totalDolaresProp)
  const [metodoPago, setMetodoPago] = useState(metodoPagoProp)
  const [fecha, setFecha] = useState(fechaProp)
  const [clienteId, setClienteId] = useState<number | null>(clienteIdProp ?? null)
  const [nombreCliente, setNombreCliente] = useState(nombreClienteProp)
  const [mostrarEditar, setMostrarEditar] = useState(false)

  async function handleActualizarCantidad(codigo: number, cantidad: number) {
    try {
      const venta = await actualizarCantidadItemVenta(ventaId, codigo, cantidad)
      setProductos(itemsVentaAProductosBoleta(JSON.parse(venta.detalle) as ItemVenta[]))
      setTotalPesos(Number(venta.total_pesos))
      setTotalDolares(Number(venta.total_dolares))
    } catch (error) {
      mostrarToast(mensajeDeError(error, 'No se pudo actualizar la cantidad'), 'error')
    }
  }

  const datosFactura: DatosFactura = {
    rutEmisor: '',
    eFacture: 'e-Factura',
    serie: 'A',
    fecha: formatearFecha(fecha),
    pago: PAGO_POR_METODO[metodoPago],
    moneda: 'UYU',
    rutReceptor: '',
    nombreCliente: nombreCliente || 'Cliente final',
    direccionCliente: '',
    ubicacionCliente: 'TACUAREMBÓ, URUGUAY',
  }

  return (
    <>
      <BoletaImprimible
        datosFactura={datosFactura}
        productos={productos}
        totalPesos={totalPesos}
        totalDolares={totalDolares}
        textoBotonVolver="Cerrar"
        onVolver={onCerrar}
        esCierre
        onEditar={() => setMostrarEditar(true)}
        onActualizarCantidad={handleActualizarCantidad}
        onAgregarProductos={() =>
          onAgregarProductos({
            ventaId,
            metodoPago,
            fecha,
            nombreCliente,
            clienteId: clienteId ?? undefined,
            productosPrevios: productos,
            totalPesosPrevio: totalPesos,
            totalDolaresPrevio: totalDolares,
          })
        }
      />

      {mostrarEditar && (
        <EditarVentaModal
          ventaId={ventaId}
          metodoActual={metodoPago}
          fechaActual={fecha}
          clienteIdActual={clienteId}
          nombreClienteActual={datosFactura.nombreCliente}
          onCancelar={() => setMostrarEditar(false)}
          onGuardado={(resultado) => {
            setMetodoPago(resultado.metodoPago)
            setFecha(resultado.fecha)
            setClienteId(resultado.metodoPago === 'credito' ? resultado.clienteId : clienteId)
            setNombreCliente(resultado.clienteNombre ?? undefined)
            setMostrarEditar(false)
          }}
        />
      )}
    </>
  )
}

export default BoletaConfirmada
