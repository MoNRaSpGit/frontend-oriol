import { useState, type ReactNode } from 'react'
import { FaPrint } from 'react-icons/fa'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import CabeceraFactura, { type DatosFactura } from './CabeceraFactura'
import TablaProductoFactura from './TablaProductoFactura'
import PieFactura from './PieFactura'
import type { ProductoBoleta } from '../../context/CarritoContext'
import '../../styles/factura/factura.scss'
import '../../styles/factura/logo.scss'
import '../../styles/factura/dueno.scss'
import '../../styles/factura/rectangulo.scss'
import '../../styles/factura/pie.scss'

// Vista de solo lectura de una boleta ya cerrada (venta recién confirmada o
// reimpresión de una venta vieja) — comparten formato pero cada una arma
// `datosFactura`/`productos` a partir de una fuente de datos distinta.
export { type DatosFactura }

interface Props {
  titulo?: string
  datosFactura: DatosFactura
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
  textoBotonVolver: string
  onVolver: () => void
  onEditar?: () => void
  detallePago?: ReactNode
}

const BoletaImprimible = ({
  titulo,
  datosFactura,
  productos,
  totalPesos,
  totalDolares,
  textoBotonVolver,
  onVolver,
  onEditar,
  detallePago,
}: Props) => {
  const [finalEnDolares, setFinalEnDolares] = useState(false)
  const tasaDolar = useTasaDolar()

  return (
    <div className="factura-container">
      {titulo && <h2 className="text-center mt-4 mb-3">{titulo}</h2>}

      <CabeceraFactura datosFactura={datosFactura} finalEnDolares={finalEnDolares} onEditar={onEditar} />

      <div className="linea-divisoria"></div>

      <TablaProductoFactura productosSeleccionados={productos} />

      <div className="linea-divisoria"></div>

      <PieFactura
        totalPesos={totalPesos}
        totalDolares={totalDolares}
        finalEnDolares={finalEnDolares}
        setFinalEnDolares={setFinalEnDolares}
        tasaDolar={tasaDolar}
      />

      {detallePago}

      <div className="factura-acciones-bar">
        <button className="btn btn-outline-secondary btn-lg" onClick={onVolver}>
          {textoBotonVolver}
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
          <FaPrint /> Imprimir
        </button>
      </div>
    </div>
  )
}

export default BoletaImprimible
