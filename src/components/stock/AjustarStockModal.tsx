import { useState, type FormEvent } from 'react'
import { actualizarStockProducto } from '../../services/productos.service'
import { mensajeDeError } from '../../utils/errores'
import type { Producto } from '../../types/producto'
import '../../styles/scanner/modal.scss'

interface Props {
  producto: Producto
  onCancelar: () => void
  onActualizado: (producto: Producto) => void
}

const AjustarStockModal = ({ producto, onCancelar, onActualizado }: Props) => {
  const [nuevoStock, setNuevoStock] = useState(String(producto.stock))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleGuardarStock = async (e: FormEvent) => {
    e.preventDefault()
    const valor = Number(nuevoStock)
    if (!Number.isInteger(valor) || valor < 0) {
      setError('Ingresá una cantidad de stock válida.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const actualizado = await actualizarStockProducto(producto.id, { stock: valor })
      onActualizado(actualizado)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar el stock. Probá de nuevo.'))
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>{producto.name}</h4>

        <form onSubmit={handleGuardarStock}>
          <div className="mb-3">
            <label className="form-label">Cantidad en stock</label>
            <input
              type="number"
              min="0"
              step="1"
              className="form-control"
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              autoFocus
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AjustarStockModal
