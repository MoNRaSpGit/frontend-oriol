import { useEffect, useState, type FormEvent } from 'react'
import { actualizarProducto, eliminarProducto, getProductoPorId } from '../../services/productos.service'
import { useTasaDolar } from '../../hooks/useTasaDolar'
import { mensajeDeError } from '../../utils/errores'
import type { Producto } from '../../types/producto'
import '../../styles/scanner/modal.scss'

interface Props {
  codigo: number
  onCancelar: () => void
  onGuardado: (producto: Producto) => void
  onEliminado?: (id: number) => void
  // Solo se pasan desde el Scanner, para poder ajustar de una la cantidad
  // de este producto en el carrito actual (ej: poner "50" en vez de hacer
  // 50 clicks de +1). No aplica editando desde el catálogo de Productos.
  cantidadEnCarrito?: number
  onCantidadGuardada?: (cantidad: number) => void
}

const EditarProductoModal = ({ codigo, onCancelar, onGuardado, onEliminado, cantidadEnCarrito, onCantidadGuardada }: Props) => {
  const tasaDolar = useTasaDolar()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [name, setName] = useState('')
  // Dos campos de precio, siempre sincronizados entre si con la tasa de
  // cambio del dia (ver useTasaDolar): sea cual sea la moneda en la que
  // esta guardado el producto, se pueden ver y editar los dos a la vez, y
  // el que no se toco se recalcula solo. Al guardar, el que efectivamente
  // se manda al backend es el de la moneda original del producto
  // (producto.currency) -- eso no cambia aca, solo la forma de editarlo.
  const [priceUsd, setPriceUsd] = useState('')
  const [priceUyu, setPriceUyu] = useState('')
  const [cantidad, setCantidad] = useState(cantidadEnCarrito !== undefined ? String(cantidadEnCarrito) : '')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    getProductoPorId(codigo)
      .then((p) => {
        if (!p) {
          setError('No se encontró el producto.')
          return
        }
        setProducto(p)
        setName(p.name)
      })
      .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar el producto.')))
      .finally(() => setCargando(false))
  }, [codigo])

  // Recien cuando ya tenemos el producto Y la tasa de cambio real (no la de
  // respaldo del hook) se puede armar el precio inicial en las dos monedas
  // sin arriesgarse a mostrar una conversion con una tasa vieja/de
  // respaldo un instante y despues "saltar" al valor correcto.
  useEffect(() => {
    if (!producto) return
    const precioOriginal = parseFloat(producto.price)
    if (!Number.isFinite(precioOriginal)) return

    if (producto.currency === 'USD') {
      setPriceUsd(precioOriginal.toFixed(2))
      setPriceUyu((precioOriginal * tasaDolar).toFixed(2))
    } else {
      setPriceUyu(precioOriginal.toFixed(2))
      setPriceUsd((precioOriginal / tasaDolar).toFixed(2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto, tasaDolar])

  const handlePriceUsdChange = (value: string) => {
    setPriceUsd(value)
    const num = parseFloat(value)
    setPriceUyu(Number.isFinite(num) ? (num * tasaDolar).toFixed(2) : '')
  }

  const handlePriceUyuChange = (value: string) => {
    setPriceUyu(value)
    const num = parseFloat(value)
    setPriceUsd(Number.isFinite(num) ? (num / tasaDolar).toFixed(2) : '')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!producto) return
    const precioNum = parseFloat(producto.currency === 'USD' ? priceUsd : priceUyu)
    if (!name.trim()) {
      setError('Ingresá el nombre del producto.')
      return
    }
    if (!precioNum || precioNum <= 0) {
      setError('Ingresá un precio válido.')
      return
    }
    let cantidadNum: number | null = null
    if (cantidadEnCarrito !== undefined) {
      cantidadNum = Number(cantidad)
      if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
        setError('Ingresá una cantidad válida (mayor a 0).')
        return
      }
    }

    setError('')
    setGuardando(true)
    try {
      const actualizado = await actualizarProducto(producto.id, {
        name: name.trim(),
        price: precioNum,
        currency: producto.currency,
        description: producto.description,
        codigo_barra: producto.codigo_barra,
        stock: producto.stock,
        stock_minimo: producto.stock_minimo,
      })
      if (cantidadNum !== null && cantidadNum !== cantidadEnCarrito) {
        onCantidadGuardada?.(cantidadNum)
      }
      onGuardado(actualizado)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el producto. Probá de nuevo.'))
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!producto) return
    setEliminando(true)
    try {
      await eliminarProducto(producto.id)
      onEliminado?.(producto.id)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el producto. Probá de nuevo.'))
      setEliminando(false)
      setConfirmandoEliminar(false)
    }
  }

  if (onEliminado && confirmandoEliminar && producto) {
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <h4>Eliminar producto</h4>
          <p>¿Seguro que querés eliminar "{producto.name}"? Esta acción no se puede deshacer.</p>
          {error && <p className="text-danger">{error}</p>}
          <div className="modal-acciones">
            <button
              type="button"
              className="btn modal-btn-cancelar"
              onClick={() => setConfirmandoEliminar(false)}
              disabled={eliminando}
            >
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={handleEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Editar producto</h4>

        {cargando ? (
          <p className="text-muted">Cargando...</p>
        ) : (
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
              <label className="form-label">Precio en dólares (U$S)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control input-sin-flechas input-precio-usd"
                value={priceUsd}
                onChange={(e) => handlePriceUsdChange(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Precio en pesos ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control input-sin-flechas input-precio-uyu"
                value={priceUyu}
                onChange={(e) => handlePriceUyuChange(e.target.value)}
              />
              <small className="text-muted">Se convierten solos con la tasa del día ({tasaDolar}).</small>
            </div>

            {cantidadEnCarrito !== undefined && (
              <div className="mb-3">
                <label className="form-label">Cantidad en este carrito</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-control"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
                <small className="text-muted">Cambiala directo en vez de sumar de a uno.</small>
              </div>
            )}

            {error && <p className="text-danger">{error}</p>}

            <div className="modal-acciones">
              <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn modal-btn-confirmar" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            {onEliminado && (
              <button
                type="button"
                className="btn btn-outline-danger w-100 mt-2"
                onClick={() => setConfirmandoEliminar(true)}
                disabled={guardando}
              >
                Eliminar producto
              </button>
            )}
          </form>
        )}

        {!cargando && !producto && (
          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditarProductoModal
