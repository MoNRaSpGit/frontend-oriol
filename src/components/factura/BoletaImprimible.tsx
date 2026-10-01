import { useState, type ReactNode } from 'react'
import { FaPrint } from 'react-icons/fa'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import CabeceraFactura, { type DatosFactura } from './CabeceraFactura'
import TablaProductoFactura from './TablaProductoFactura'
import PieFactura from './PieFactura'
import ConfirmarCierreModal from './ConfirmarCierreModal'
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
  // Solo en la boleta recien confirmada (pedido explicito, 26/09/2026):
  // suma/resta cantidad de un producto que YA esta en la venta guardada.
  // No se pasa en reimpresiones de boletas viejas -- ahi la tabla sigue
  // de solo lectura.
  onActualizarCantidad?: (codigo: number, cantidad: number) => void
  // true solo cuando textoBotonVolver es el "Cerrar" de una boleta recien
  // confirmada (no en reimpresiones, donde "Volver" es solo navegacion sin
  // consecuencias): pinta el boton de rojo y pide confirmacion antes de
  // sacar la boleta de la pantalla.
  esCierre?: boolean
  // Si se pasa, el boton de "Cerrar" (esCierre=true) llama esto en vez de
  // abrir el modal interno de si/no de aca abajo -- lo usa el borrador
  // (01/10/2026, "el cancelar... pregunte si desea guardar o no la
  // boleta") para mostrar su propio modal de 3 opciones (seguir
  // editando / descartar / guardar) en vez del simple si/no de siempre.
  onSolicitarCierre?: () => void
  // Boton extra "Confirmar" (01/10/2026): el guardado pesado real, que
  // ahora pasa a vivir aca en vez de en el checkout. Solo aparece si se
  // pasa (lo usa el borrador, no las boletas ya confirmadas/reimpresas).
  onConfirmar?: () => void
  confirmando?: boolean
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
  onActualizarCantidad,
  esCierre,
  onSolicitarCierre,
  onConfirmar,
  confirmando,
}: Props) => {
  // Arranca en dolares (30/09/2026, pedido explicito: "que lo primero que
  // salga sea en dolar") -- clickeando el total se sigue pudiendo pasar a
  // pesos, ver PieFactura.
  const [finalEnDolares, setFinalEnDolares] = useState(true)
  const [mostrarConfirmarCierre, setMostrarConfirmarCierre] = useState(false)
  const tasaDolar = useTasaDolar()

  return (
    <div className="factura-container">
      <CabeceraFactura datosFactura={datosFactura} finalEnDolares={finalEnDolares} onEditar={onEditar} />

      <div className="linea-divisoria"></div>

      <TablaProductoFactura
        productosSeleccionados={productos}
        handleActualizarCantidad={onActualizarCantidad}
        finalEnDolares={finalEnDolares}
        tasaDolar={tasaDolar}
      />

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
        <button
          className={`btn btn-lg ${esCierre ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
          onClick={() => {
            // "Volver" (agregar mas productos) no pregunta nada -- la
            // boleta sigue abierta. "Cerrar" si, porque saca la boleta de
            // la pantalla y no se puede volver a ella desde aca.
            if (esCierre) {
              if (onSolicitarCierre) {
                onSolicitarCierre()
                return
              }
              setMostrarConfirmarCierre(true)
              return
            }
            onVolver()
          }}
        >
          {textoBotonVolver}
        </button>
        {onAgregarProductos && (
          <button className="btn btn-outline-secondary btn-lg" onClick={onAgregarProductos}>
            Volver
          </button>
        )}
        {onConfirmar && (
          <button className="btn btn-success btn-lg" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? 'Guardando...' : 'Confirmar'}
          </button>
        )}
        <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
          <FaPrint /> Imprimir
        </button>
      </div>

      {mostrarConfirmarCierre && (
        <ConfirmarCierreModal
          onCancelar={() => setMostrarConfirmarCierre(false)}
          onConfirmar={() => {
            setMostrarConfirmarCierre(false)
            onVolver()
          }}
        />
      )}
    </div>
  )
}

export default BoletaImprimible
