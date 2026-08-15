import { useState } from 'react'
import type { Producto } from '../../types/producto'
import EditarProductoModal from './EditarProductoModal'
import '../../styles/productos/tarjeta-producto.scss'

interface Props {
  producto: Producto
  onActualizado: (producto: Producto) => void
  onEliminado: (id: number) => void
}

const TarjetaProducto = ({ producto, onActualizado, onEliminado }: Props) => {
  const [editando, setEditando] = useState(false)

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
            <p className="card-text fw-bold">
              {producto.currency === 'USD' ? 'U$' : '$'}
              {producto.price}
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
