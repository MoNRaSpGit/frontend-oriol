import { useState } from 'react'
import BoletaImprimible, { type DatosFactura } from '../factura/BoletaImprimible'
import EditarVentaModal from '../factura/EditarVentaModal'
import type { ProductoBoleta } from '../../context/CarritoContext'
import type { MetodoPago } from '../../types/venta'

const PAGO_POR_METODO: Record<MetodoPago, string> = {
  efectivo: 'Contado',
  tarjeta: 'Contado',
  credito: 'Crédito',
}

const formatearFecha = (fechaIso: string) =>
  new Date(fechaIso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
}

const BoletaConfirmada = ({
  ventaId,
  productos,
  totalPesos,
  totalDolares,
  metodoPago: metodoPagoProp,
  fecha: fechaProp,
  nombreCliente: nombreClienteProp,
  clienteId: clienteIdProp,
  onCerrar,
}: Props) => {
  const [metodoPago, setMetodoPago] = useState(metodoPagoProp)
  const [fecha, setFecha] = useState(fechaProp)
  const [clienteId, setClienteId] = useState<number | null>(clienteIdProp ?? null)
  const [nombreCliente, setNombreCliente] = useState(nombreClienteProp)
  const [mostrarEditar, setMostrarEditar] = useState(false)

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
        onEditar={() => setMostrarEditar(true)}
      />

      {mostrarEditar && (
        <EditarVentaModal
          ventaId={ventaId}
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

export default BoletaConfirmada
