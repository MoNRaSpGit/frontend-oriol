import { useState, type FormEvent } from 'react'
import { crearProducto } from '../../services/productos.service'
import { mensajeDeError } from '../../utils/errores'
import type { Producto } from '../../types/producto'
import '../../styles/scanner/modal.scss'

interface Props {
  titulo: string
  textoBoton: string
  // Si viene un código de barra fijo (ej. el que se acaba de escanear), se
  // muestra como dato informativo y no se pide en el formulario. Si no
  // viene, el código de barra queda como campo opcional editable.
  codigoBarraFijo?: string
  onCancelar: () => void
  onGuardado: (producto: Producto) => void
}

const ProductoFormModal = ({ titulo, textoBoton, codigoBarraFijo, onCancelar, onGuardado }: Props) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [currency, setCurrency] = useState<'UYU' | 'USD'>('UYU')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const precioNum = parseFloat(price)
    const stockNum = stock.trim() ? parseInt(stock, 10) : 0
    if (!name.trim()) {
      setError('Ingresá el nombre del producto.')
      return
    }
    if (!precioNum || precioNum <= 0) {
      setError('Ingresá un precio válido.')
      return
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError('Ingresá un stock válido.')
      return
    }

    setError('')
    setGuardando(true)
    try {
      const producto = await crearProducto({
        name: name.trim(),
        price: precioNum,
        currency,
        codigo_barra: codigoBarraFijo,
        stock: stockNum,
      })
      onGuardado(producto)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el producto. Probá de nuevo.'))
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>{titulo}</h4>
        {codigoBarraFijo && (
          <p className="text-muted">
            Código escaneado: <strong>{codigoBarraFijo}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Precio</label>
            <div className="modal-precio-row">
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <div className="modal-moneda-toggle">
                <button
                  type="button"
                  className={currency === 'UYU' ? 'btn btn-primary' : 'btn btn-outline-secondary'}
                  onClick={() => setCurrency('UYU')}
                >
                  $ Pesos
                </button>
                <button
                  type="button"
                  className={currency === 'USD' ? 'btn btn-primary' : 'btn btn-outline-secondary'}
                  onClick={() => setCurrency('USD')}
                >
                  U$ Dólares
                </button>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input
              type="number"
              step="1"
              min="0"
              className="form-control"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar" disabled={guardando}>
              {guardando ? 'Guardando...' : textoBoton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoFormModal
