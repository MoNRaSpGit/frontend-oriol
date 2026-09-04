import { useEffect, useState } from 'react'
import { buscarProductosPorNombre, getProductos } from '../../services/productos.service'
import { mensajeDeError } from '../../utils/errores'
import type { Producto } from '../../types/producto'
import AjustarStockModal from './AjustarStockModal'
import '../../styles/stock/stock.scss'

export const STOCK_LIMITE_ROJO = 3
export const STOCK_LIMITE_AMARILLO = 6

export const nivelDeStock = (stock: number, stockMinimo: number | null = null) => {
  if (stockMinimo !== null) {
    return stock < stockMinimo ? 'rojo' : null
  }
  if (stock <= STOCK_LIMITE_ROJO) return 'rojo'
  if (stock <= STOCK_LIMITE_AMARILLO) return 'amarillo'
  return null
}

const Stock = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el stock.')))
      .finally(() => setCargando(false))
  }, [])

  // Busca en TODO el catalogo (no solo los de stock bajo) para poder
  // encontrar y editar cualquier producto desde esta pantalla.
  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultadosBusqueda([])
      return
    }
    setBuscando(true)
    const timeoutId = setTimeout(() => {
      buscarProductosPorNombre(busqueda.trim())
        .then((resultados) => {
          setResultadosBusqueda(resultados)
          setErrorBusqueda('')
        })
        .catch((err) => setErrorBusqueda(mensajeDeError(err, 'No se pudo buscar productos.')))
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [busqueda])

  const handleActualizado = (actualizado: Producto) => {
    setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
    setResultadosBusqueda((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)))
    setProductoSeleccionado(null)
  }

  const productosBajoStock = productos
    .filter((p) => nivelDeStock(p.stock, p.stock_minimo) !== null)
    .sort((a, b) => a.stock - b.stock)

  return (
    <div className="container mt-4 stock-container">
      <h2 className="mb-3">Buscar producto</h2>
      <div className="mb-4" style={{ maxWidth: 480 }}>
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Buscar producto por nombre para editarlo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {errorBusqueda && <div className="alert alert-danger">{errorBusqueda}</div>}

      {busqueda.trim().length >= 2 && (
        <div className="stock-lista mb-4">
          {buscando ? (
            <p className="text-muted">Buscando...</p>
          ) : resultadosBusqueda.length === 0 ? (
            <p className="text-muted">No se encontraron productos con ese nombre.</p>
          ) : (
            resultadosBusqueda.map((p) => (
              <div
                key={p.id}
                className={`stock-item ${nivelDeStock(p.stock, p.stock_minimo) ? `stock-item--${nivelDeStock(p.stock, p.stock_minimo)}` : ''}`}
              >
                <div className="stock-item-info">
                  <div className="stock-item-nombre">{p.name}</div>
                  <div className="stock-item-precio">
                    {p.currency === 'USD' ? 'U$S' : '$'}
                    {p.price}
                  </div>
                </div>
                <div className="stock-item-cantidad">
                  <span className="stock-item-badge">{p.stock}</span>
                  <span className="stock-item-label">{p.stock === 1 ? 'unidad' : 'unidades'}</span>
                </div>
                <button
                  type="button"
                  className="stock-item-editar"
                  onClick={() => setProductoSeleccionado(p)}
                  aria-label={`Editar ${p.name}`}
                >
                  Editar
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <h2 className="mb-4">Stock bajo</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : productosBajoStock.length === 0 ? (
        <p className="text-muted">No hay productos con stock bajo.</p>
      ) : (
        <div className="stock-lista">
          {productosBajoStock.map((p) => (
            <div
              key={p.id}
              className={`stock-item stock-item--${nivelDeStock(p.stock, p.stock_minimo)}`}
            >
              <div className="stock-item-info">
                <div className="stock-item-nombre">{p.name}</div>
                <div className="stock-item-precio">
                  {p.currency === 'USD' ? 'U$S' : '$'}
                  {p.price}
                </div>
              </div>
              <div className="stock-item-cantidad">
                <span className="stock-item-badge">{p.stock}</span>
                <span className="stock-item-label">{p.stock === 1 ? 'unidad' : 'unidades'}</span>
              </div>
              <button
                type="button"
                className="stock-item-editar"
                onClick={() => setProductoSeleccionado(p)}
                aria-label={`Editar ${p.name}`}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {productoSeleccionado && (
        <AjustarStockModal
          producto={productoSeleccionado}
          onCancelar={() => setProductoSeleccionado(null)}
          onActualizado={handleActualizado}
        />
      )}
    </div>
  )
}

export default Stock
