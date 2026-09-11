import { useState } from 'react'
import type { Producto } from '../../types/producto'
import EditarProductoModal from './EditarProductoModal'
import '../../styles/productos/tarjeta-producto.scss'

interface Props {
  producto: Producto
  tasaDolar: number
  // Interruptor GLOBAL (uno solo para todas las tarjetas, no por
  // producto): clickear el precio de cualquier tarjeta cambia la moneda
  // mostrada en TODAS a la vez, para no dejar una en pesos y otra en
  // dolares en la misma pantalla. Mismo comportamiento que el "Total"
  // clickeable de la boleta (ver PieFactura).
  mostrarEnDolares: boolean
  onToggleMoneda: () => void
  onActualizado: (producto: Producto) => void
  onEliminado: (id: number) => void
}

const TarjetaProducto = ({ producto, tasaDolar, mostrarEnDolares, onToggleMoneda, onActualizado, onEliminado }: Props) => {
  const [editando, setEditando] = useState(false)

  const precioOriginal = parseFloat(producto.price)
  const esNativoEnDolares = producto.currency === 'USD'
  // El precio ORIGINAL del producto no cambia -- esto solo decide que
  // numero mostrar en pantalla segun el modo elegido para toda la lista.
  const precioAMostrar = Number.isFinite(precioOriginal)
    ? mostrarEnDolares
      ? esNativoEnDolares
        ? precioOriginal
        : precioOriginal / tasaDolar
      : esNativoEnDolares
        ? precioOriginal * tasaDolar
        : precioOriginal
    : null

  return (
    <div className="col-md-4 mb-4">
      <div className="card producto-card">
        <div className="product-image d-flex align-items-center justify-content-center">
          <span className="producto-sin-imagen">img</span>
        </div>

        <div className="card-body text-center">
          <div className="card-content">
            <h5 className="card-title">{producto.name}</h5>
            {producto.description && <p className="card-text">{producto.description}</p>}
            <p
              className="card-text fw-bold producto-precio-toggle"
              onClick={onToggleMoneda}
              title="Click para ver el precio en la otra moneda"
            >
              {mostrarEnDolares ? 'U$S' : '$'}
              {precioAMostrar !== null ? precioAMostrar.toFixed(2) : producto.price}
            </p>
            <p className="card-text producto-stock">Stock: {producto.stock}</p>
          </div>

          <div className="divisor-botones"></div>

          <div className="botones-container">
            <button className="btn btn-outline-primary btn-lg w-100" onClick={() => setEditando(true)}>
              Editar
            </button>
          </div>
        </div>
      </div>

      {editando && (
        <EditarProductoModal
          codigo={producto.id}
          onCancelar={() => setEditando(false)}
          onGuardado={(actualizado) => {
            setEditando(false)
            onActualizado(actualizado)
          }}
          onEliminado={(id) => {
            setEditando(false)
            onEliminado(id)
          }}
        />
      )}
    </div>
  )
}

export default TarjetaProducto
