import { FaTimes } from 'react-icons/fa'
import type { ProductoBoleta } from '../../context/CarritoContext'

interface Props {
  productosSeleccionados: ProductoBoleta[]
  // Si no viene, la tabla queda de solo lectura (sin columna "Eliminar") —
  // se usa para reimprimir una boleta vieja, donde no tiene sentido borrar
  // ítems de una venta que ya pasó.
  handleEliminarDeFactura?: (codigo: number) => void
}

const TablaProductoFactura = ({ productosSeleccionados, handleEliminarDeFactura }: Props) => {
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
              <td>{cantidad}</td>
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
