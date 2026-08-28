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

const formatearFechaHora = (fechaIso: string) => {
  const fecha = new Date(fechaIso)
  return `${formatearFecha(fechaIso)} ${fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}`
}

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
    ubicacionCliente: 'TACUAREMBÓ, URUGUAY',
  }

  const tienePagos = venta.metodo_pago === 'credito' && venta.pagos.length > 0

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
        detallePago={
          tienePagos ? (
            <div className="boleta-detalle-pago">
              <div className="linea-divisoria"></div>
              <p className="boleta-detalle-pago-titulo">Detalle de pago</p>
              {venta.pagos.map((pago) => {
                const simboloPago = pago.moneda === 'USD' ? 'U$' : '$'
                return (
                  <p key={pago.id} className="boleta-detalle-pago-linea">
                    Pago {pago.tipo === 'completo' ? 'completo' : 'parcial'} — {formatearFechaHora(pago.fecha)} — monto {simboloPago} {pago.monto.toFixed(2)}
                  </p>
                )
              })}
              {venta.saldo_pendiente_pesos > 0 && (
                <p className="boleta-detalle-pago-saldo">Saldo pendiente: $ {venta.saldo_pendiente_pesos.toFixed(2)}</p>
              )}
              {venta.saldo_pendiente_dolares > 0 && (
                <p className="boleta-detalle-pago-saldo">Saldo pendiente: U$ {venta.saldo_pendiente_dolares.toFixed(2)}</p>
              )}
            </div>
          ) : undefined
        }
      />

      {mostrarEditar && (
        <EditarVentaModal
          ventaId={venta.id}
          metodoActual={metodoPago}
          fechaActual={fecha}
          clienteIdActual={clienteId}
          nombreClienteActual={nombreCliente}
          onCancelar={() => setMostrarEditar(false)}
          onGuardado={(resultado) => {
            setMetodoPago(resultado.metodoPago)
            setFecha(resultado.fecha)
            setClienteId(resultado.metodoPago === 'credito' ? resultado.clienteId : clienteId)
            setNombreCliente(resultado.clienteNombre ?? nombreCliente)
            setMostrarEditar(false)
          }}
        />
      )}
    </>
  )
}

export default BoletaReimpresa
