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
}

const TablaProductoFactura = ({ productosSeleccionados, handleEliminarDeFactura, handleActualizarCantidad }: Props) => {
  return (
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
          const precioNum = producto.precio || 0
          const cantidad = producto.cantidad || 0
          const simboloMoneda = producto.currency === 'USD' ? 'U$S' : '$'
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
  )
}

export default TablaProductoFactura
