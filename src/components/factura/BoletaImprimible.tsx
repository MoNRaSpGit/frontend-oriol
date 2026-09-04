import { useState, type ReactNode } from 'react'
import { FaPrint } from 'react-icons/fa'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import CabeceraFactura, { type DatosFactura } from './CabeceraFactura'
import TablaProductoFactura from './TablaProductoFactura'
import PieFactura from './PieFactura'
import type { ProductoBoleta } from '../../context/CarritoContext'
import '../../styles/factura/factura.scss'
import '../../styles/factura/logo.scss'
import '../../styles/factura/rectangulo.scss'
import '../../styles/factura/pie.scss'

// Vista de solo lectura de una boleta ya cerrada (venta recién confirmada o
// reimpresión de una venta vieja) — comparten formato pero cada una arma
// `datosFactura`/`productos` a partir de una fuente de datos distinta.
export { type DatosFactura }

interface Props {
  datosFactura: DatosFactura
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
  textoBotonVolver: string
  onVolver: () => void
  onEditar?: () => void
  detallePago?: ReactNode
  // Solo en la boleta recien confirmada (no en reimpresiones viejas): deja
  // volver al scanner para agregar mas productos a ESTA MISMA boleta, sin
  // cerrarla -- se cierra unicamente con "Cerrar" o "Imprimir".
  onAgregarProductos?: () => void
  // true solo cuando textoBotonVolver es el "Cerrar" de una boleta recien
  // confirmada (no en reimpresiones, donde "Volver" es solo navegacion sin
  // consecuencias): pinta el boton de rojo y pide confirmacion antes de
  // sacar la boleta de la pantalla.
  esCierre?: boolean
}

const BoletaImprimible = ({
  datosFactura,
  productos,
  totalPesos,
  totalDolares,
  textoBotonVolver,
  onVolver,
  onEditar,
  detallePago,
  onAgregarProductos,
  esCierre,
}: Props) => {
  const [finalEnDolares, setFinalEnDolares] = useState(false)
  const tasaDolar = useTasaDolar()

  return (
    <div className="factura-container">
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
        {onAgregarProductos && (
          <button className="btn btn-outline-secondary btn-lg" onClick={onAgregarProductos}>
            Volver
          </button>
        )}
        <button
          className={`btn btn-lg ${esCierre ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
          onClick={() => {
            // "Volver" (agregar mas productos) no pregunta nada -- la
            // boleta sigue abierta. "Cerrar" si, porque saca la boleta de
            // la pantalla y no se puede volver a ella desde aca.
            if (esCierre && !window.confirm('¿Estás seguro que deseas cerrar? Esto borra la factura actual.')) {
              return
            }
            onVolver()
          }}
        >
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
