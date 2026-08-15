import { useEffect, useState } from 'react'
import { buscarProductosPorNombre } from '../../services/productos.service'
import { mensajeDeError } from '../../utils/errores'
import { useToast } from '../../context/ToastContext'
import type { Producto } from '../../types/producto'
import TarjetaProducto from './TarjetaProducto'
import ProductoFormModal from './ProductoFormModal'

const Productos = () => {
  const [query, setQuery] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const { mostrarToast } = useToast()

  useEffect(() => {
    if (query.trim().length < 2) {
      setProductos([])
      return
    }
    setBuscando(true)
    const timeoutId = setTimeout(() => {
      buscarProductosPorNombre(query.trim())
        .then((resultados) => {
          setProductos(resultados)
          setError('')
        })
        .catch((err) => setError(mensajeDeError(err, 'No se pudo buscar productos.')))
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleProductoCreado = (producto: Producto) => {
    setModalAbierto(false)
    mostrarToast(`"${producto.name}" se agregó correctamente.`)
  }

  const handleProductoActualizado = (producto: Producto) => {
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? producto : p)))
    mostrarToast(`"${producto.name}" se actualizó correctamente.`)
  }

  const handleProductoEliminado = (id: number) => {
    setProductos((prev) => prev.filter((p) => p.id !== id))
    mostrarToast('Producto eliminado correctamente.')
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Productos</h2>
        <button className="btn btn-primary btn-lg" onClick={() => setModalAbierto(true)}>
          Agregar producto
        </button>
      </div>

      <div className="mb-4" style={{ maxWidth: 480 }}>
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Buscar producto por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {query.trim().length < 2 ? (
        <p className="text-muted">Escribí al menos 2 letras para buscar un producto.</p>
      ) : buscando ? (
        <p className="text-muted">Buscando...</p>
      ) : productos.length === 0 ? (
        <p className="text-muted">No se encontraron productos con ese nombre.</p>
      ) : (
        <div className="row">
          {productos.map((producto) => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              onActualizado={handleProductoActualizado}
              onEliminado={handleProductoEliminado}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ProductoFormModal
          titulo="Agregar producto"
          textoBoton="Guardar"
          onCancelar={() => setModalAbierto(false)}
          onGuardado={handleProductoCreado}
        />
      )}
    </div>
  )
}

export default Productos
