import { FaTimes } from 'react-icons/fa'
import type { ProductoBoleta } from '../../context/CarritoContext'

interface Props {
  productosSeleccionados: ProductoBoleta[]
  // Si no viene, la tabla queda de solo lectura (sin columna "Eliminar") —
  // se usa para reimprimir una boleta vieja, donde no tiene sentido borrar
  // ítems de una venta que ya pasó.
  handleEliminarDeFactura?: (codigo: number) => void
  // Pedido explicito (26/09/2026): poder sumar/restar cantidad directo en
  // la factura, con los mismos botones "- cant +" que ya tiene el Scanner
  // (misma logica: minimo 1, para sacar del todo se usa la cruz roja). Si
  // no viene (reimpresion de una boleta vieja), la cantidad queda como
  // texto fijo, igual que antes.
  handleActualizarCantidad?: (codigo: number, cantidad: number) => void
  // Pedido explicito (30/09/2026, "el total lo cambia a dolares pero el
  // producto no" -- y 01/10/2026, "si tengo un producto en dolares y
  // cambio el total a pesos, el producto tambien tiene que cambiar a
  // pesos"): clickear el "Total" del pie (ver PieFactura) fuerza TODAS
  // las filas a verse en esa misma moneda, se conviertan o no -- mismo
  // criterio bidireccional que convertirVista en Scanner.tsx. Es solo
  // esta vista/impresion, no toca el producto real ni lo ya vendido.
  finalEnDolares?: boolean
  tasaDolar?: number
}

const TablaProductoFactura = ({
  productosSeleccionados,
  handleEliminarDeFactura,
  handleActualizarCantidad,
  finalEnDolares,
  tasaDolar
}: Props) => {
  return (
    <div className="factura-tabla-scroll">
      <table
        className="table table-bordered table-hover table-sm"
        style={{ margin: 0, width: '100%', textAlign: 'center' }}
      >
        <thead className="thead-light">
          <tr>
            <th>Cantidad</th>
            <th>Descripción</th>
            <th>Precio Unitario</th>
            <th>Total</th>
            {handleEliminarDeFactura && <th className="col-eliminar">Eliminar</th>}
          </tr>
        </thead>
        <tbody>
        {productosSeleccionados.map((producto) => {
          const descripcion = producto.descripcion || 'Sin descripción'
          const cantidad = producto.cantidad || 0
          // Moneda a la que esta forzada TODA la tabla (si no vino
          // finalEnDolares, cada fila se queda en su moneda nativa, igual
          // que antes). Si el producto ya esta en esa moneda, no se toca;
          // si no, se convierte con la tasa del dia -- para cualquiera de
          // los dos sentidos (pesos->dolares y dolares->pesos).
          const monedaDestino: 'USD' | 'UYU' | null = finalEnDolares === undefined ? null : finalEnDolares ? 'USD' : 'UYU'
          const yaEnDestino = monedaDestino === null || producto.currency === monedaDestino
          const precioNum =
            yaEnDestino || !tasaDolar
              ? producto.precio || 0
              : monedaDestino === 'USD'
                ? (producto.precio || 0) / tasaDolar
                : (producto.precio || 0) * tasaDolar
          const simboloMoneda = monedaDestino === null ? (producto.currency === 'USD' ? 'U$S' : '$') : monedaDestino === 'USD' ? 'U$S' : '$'
          const subtotal = precioNum * cantidad

          return (
            <tr key={producto.codigo}>
              <td>
                {handleActualizarCantidad ? (
                  <>
                    <div className="factura-cantidad-controles d-print-none">
                      <button
                        type="button"
                        className="factura-cant-btn"
                        disabled={cantidad <= 1}
                        onClick={() => handleActualizarCantidad(producto.codigo, cantidad - 1)}
                        title="Restar 1 unidad"
                        aria-label={`Restar 1 unidad de ${descripcion}`}
                      >
                        −
                      </button>
                      <span className="factura-cantidad">{cantidad}</span>
                      <button
                        type="button"
                        className="factura-cant-btn"
                        onClick={() => handleActualizarCantidad(producto.codigo, cantidad + 1)}
                        aria-label={`Sumar 1 unidad a ${descripcion}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="d-none d-print-inline">{cantidad}</span>
                  </>
                ) : (
                  cantidad
                )}
              </td>
              <td>{descripcion}</td>
              <td>
                {simboloMoneda}
                {precioNum.toFixed(2)}
              </td>
              <td>
                {simboloMoneda}
                {subtotal.toFixed(2)}
              </td>
              {handleEliminarDeFactura && (
                <td className="col-eliminar">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminarDeFactura(producto.codigo)}
                  >
                    <FaTimes />
                  </button>
                </td>
              )}
            </tr>
          )
        })}
        </tbody>
      </table>
    </div>
  )
}

export default TablaProductoFactura
