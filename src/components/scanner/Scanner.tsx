import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useCarrito, type ProductoBoleta } from '../../context/CarritoContext'
import { useToast } from '../../context/ToastContext'
import { getProductoPorCodigoBarra, buscarProductosPorNombre } from '../../services/productos.service'
import { actualizarVenta } from '../../services/ventas.service'
import ProductoFormModal from '../productos/ProductoFormModal'
import EditarProductoModal from '../productos/EditarProductoModal'
import CheckoutModal, { type VentaConfirmadaInfo } from './CheckoutModal'
import BoletaConfirmada, { type VentaAbiertaInfo } from './BoletaConfirmada'
import { mensajeDeError } from '../../utils/errores'
import type { Producto } from '../../types/producto'
import type { ItemVenta, MetodoPago } from '../../types/venta'
import '../../styles/scanner/scanner.scss'

const esSoloDigitos = (texto: string) => /^\d+$/.test(texto.trim())

interface BoletaParaImprimir {
  ventaId: number
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
  metodoPago: MetodoPago
  fecha: string
  nombreCliente?: string
  clienteId?: number
}

// Suma productos nuevos a los que ya tenia la boleta, juntando cantidades
// si es el mismo producto (mismo codigo) -- para armar la lista final que
// se muestra despues de agregar mas cosas a una venta ya guardada.
function mergearProductos(previos: ProductoBoleta[], nuevos: ProductoBoleta[]): ProductoBoleta[] {
  let resultado = previos
  for (const nuevo of nuevos) {
    const existente = resultado.find((p) => p.codigo === nuevo.codigo)
    resultado = existente
      ? resultado.map((p) =>
          p.codigo === nuevo.codigo ? { ...p, cantidad: p.cantidad + nuevo.cantidad, total: p.total + nuevo.total } : p
        )
      : [...resultado, nuevo]
  }
  return resultado
}

const Scanner = () => {
  const {
    productosSeleccionados,
    addOrUpdateProduct,
    updateProductQuantity,
    removeProduct,
    actualizarDatosProducto,
    vaciarCarrito,
  } = useCarrito()
  const { mostrarToast } = useToast()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [codigoNoEncontrado, setCodigoNoEncontrado] = useState<string | null>(null)
  const [productoEditando, setProductoEditando] = useState<number | null>(null)
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [resultadosNombre, setResultadosNombre] = useState<Producto[]>([])
  const [buscandoNombre, setBuscandoNombre] = useState(false)
  const [boletaParaImprimir, setBoletaParaImprimir] = useState<BoletaParaImprimir | null>(null)
  // Cuando no es null, el scanner esta en modo "agregar mas productos a una
  // boleta ya guardada" (boton Volver de la boleta final) -- el carrito
  // vuelve a arrancar vacio y "Confirmar compra" pasa a sumar contra esta
  // venta en vez de crear una nueva.
  const [ventaAbierta, setVentaAbierta] = useState<VentaAbiertaInfo | null>(null)
  const [agregandoProductos, setAgregandoProductos] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const modoNombre = query.trim().length > 0 && !esSoloDigitos(query)

  // Mientras se tipea un nombre (contiene letras), busca en vivo con debounce.
  // Si es solo dígitos (código de barra, sea escaneado o tipeado), no hace
  // falta buscar por cada tecla: se espera al Enter/submit para un match exacto.
  useEffect(() => {
    if (!modoNombre || query.trim().length < 2) {
      setResultadosNombre([])
      return
    }
    setBuscandoNombre(true)
    const timeoutId = setTimeout(() => {
      buscarProductosPorNombre(query.trim())
        .then(setResultadosNombre)
        .catch(() => setResultadosNombre([]))
        .finally(() => setBuscandoNombre(false))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [query, modoNombre])

  const agregarAlCarrito = (producto: Producto) => {
    addOrUpdateProduct({
      id: producto.id,
      name: producto.name,
      description: producto.description,
      price: parseFloat(producto.price),
      currency: producto.currency,
    })
  }

  const buscarPorCodigoBarra = async (codigoBarra: string) => {
    setError('')
    try {
      const producto = await getProductoPorCodigoBarra(codigoBarra.trim())
      if (!producto) {
        setCodigoNoEncontrado(codigoBarra.trim())
        return
      }
      agregarAlCarrito(producto)
      setQuery('')
      inputRef.current?.focus()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo conectar con el backend.'))
      setQuery('')
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const texto = query.trim()
    if (!texto) {
      // Input vacío (recién se agregó un producto): Enter pasa directo a
      // confirmar la compra, en vez de no hacer nada.
      if (productosSeleccionados.length > 0) {
        if (ventaAbierta) {
          handleAgregarAVentaAbierta()
        } else {
          setMostrarCheckout(true)
        }
      }
      return
    }
    // Enter solo dispara el match exacto por código de barra.
    // La búsqueda por nombre se resuelve haciendo click en un resultado.
    if (esSoloDigitos(texto)) {
      buscarPorCodigoBarra(texto)
    }
  }

  const handleProductoGuardado = (producto: Producto) => {
    agregarAlCarrito(producto)
    setCodigoNoEncontrado(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleCancelarModal = () => {
    setCodigoNoEncontrado(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleSeleccionarResultado = (producto: Producto) => {
    agregarAlCarrito(producto)
    setQuery('')
    setResultadosNombre([])
    inputRef.current?.focus()
  }

  const handleProductoActualizado = (producto: Producto) => {
    actualizarDatosProducto(producto.id, {
      name: producto.name,
      precio: parseFloat(producto.price),
      currency: producto.currency,
    })
    setProductoEditando(null)
  }

  const handleVentaConfirmada = (info: VentaConfirmadaInfo) => {
    // Confirmar cierra el ciclo al toque: se guarda una copia de la
    // boleta para poder imprimirla (o no) como paso aparte, y el
    // carrito se vacía ya mismo para que el scanner quede listo para
    // la próxima venta sin esperar a que alguien imprima.
    setBoletaParaImprimir({
      ventaId: info.ventaId,
      productos: productosSeleccionados,
      totalPesos,
      totalDolares,
      metodoPago: info.metodo,
      fecha: info.fecha,
      nombreCliente: info.nombreCliente,
      clienteId: info.clienteId,
    })
    vaciarCarrito()
    setMostrarCheckout(false)
    mostrarToast('Venta confirmada correctamente.')
    setQuery('')
  }

  // Suma los productos recien escaneados a la venta ya guardada (boton
  // Volver de la boleta final) en vez de crear una boleta nueva.
  const handleAgregarAVentaAbierta = async () => {
    if (!ventaAbierta || productosSeleccionados.length === 0 || agregandoProductos) return
    setError('')
    setAgregandoProductos(true)
    const itemsNuevos: ItemVenta[] = productosSeleccionados.map((p) => ({
      id: p.codigo,
      name: p.name,
      cantidad: p.cantidad,
      precio: p.precio,
      currency: p.currency,
    }))
    try {
      const venta = await actualizarVenta(ventaAbierta.ventaId, { items_nuevos: itemsNuevos })
      setBoletaParaImprimir({
        ventaId: ventaAbierta.ventaId,
        productos: mergearProductos(ventaAbierta.productosPrevios, productosSeleccionados),
        totalPesos: venta.total_pesos,
        totalDolares: venta.total_dolares,
        metodoPago: ventaAbierta.metodoPago,
        fecha: ventaAbierta.fecha,
        nombreCliente: ventaAbierta.nombreCliente,
        clienteId: ventaAbierta.clienteId,
      })
      setVentaAbierta(null)
      vaciarCarrito()
      mostrarToast('Productos agregados a la boleta.')
      setQuery('')
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar los productos a la boleta.'))
    } finally {
      setAgregandoProductos(false)
    }
  }

  // Se arrepiente de agregar mas productos: vuelve a mostrar la boleta tal
  // cual estaba, sin mandar nada al backend, y descarta lo que haya
  // escaneado de mas en este ida y vuelta.
  const handleCancelarVentaAbierta = () => {
    if (!ventaAbierta) return
    setBoletaParaImprimir({
      ventaId: ventaAbierta.ventaId,
      productos: ventaAbierta.productosPrevios,
      totalPesos: ventaAbierta.totalPesosPrevio,
      totalDolares: ventaAbierta.totalDolaresPrevio,
      metodoPago: ventaAbierta.metodoPago,
      fecha: ventaAbierta.fecha,
      nombreCliente: ventaAbierta.nombreCliente,
      clienteId: ventaAbierta.clienteId,
    })
    setVentaAbierta(null)
    vaciarCarrito()
    setQuery('')
  }

  let totalPesos = 0
  let totalDolares = 0
  productosSeleccionados.forEach((p) => {
    if (p.currency === 'USD') totalDolares += p.total
    else totalPesos += p.total
  })

  if (boletaParaImprimir) {
    return (
      <BoletaConfirmada
        ventaId={boletaParaImprimir.ventaId}
        productos={boletaParaImprimir.productos}
        totalPesos={boletaParaImprimir.totalPesos}
        totalDolares={boletaParaImprimir.totalDolares}
        metodoPago={boletaParaImprimir.metodoPago}
        fecha={boletaParaImprimir.fecha}
        nombreCliente={boletaParaImprimir.nombreCliente}
        clienteId={boletaParaImprimir.clienteId}
        onCerrar={() => setBoletaParaImprimir(null)}
        onAgregarProductos={(info) => {
          setVentaAbierta(info)
          setBoletaParaImprimir(null)
        }}
      />
    )
  }

  return (
    <div className="container mt-4 scanner-container">
      <h2 className="mb-4">Producto</h2>

      {ventaAbierta && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>Agregando productos a la boleta #{ventaAbierta.ventaId}.</span>
          <button type="button" className="btn btn-link p-0" onClick={handleCancelarVentaAbierta}>
            Cancelar y volver a la boleta
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="scanner-form">
        <div className="scanner-busqueda">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            className="form-control scanner-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {buscandoNombre && <p className="text-muted mb-0 mt-1">Buscando...</p>}
          {resultadosNombre.length > 0 && (
            <ul className="scanner-resultados-nombre">
              {resultadosNombre.map((producto) => (
                <li key={producto.id} onClick={() => handleSeleccionarResultado(producto)}>
                  <span className="scanner-resultado-nombre">{producto.name}</span>
                  <span className="scanner-resultado-precio">
                    {producto.currency === 'USD' ? 'U$' : '$'}
                    {producto.price}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {modoNombre && !buscandoNombre && query.trim().length >= 2 && resultadosNombre.length === 0 && (
            <p className="text-muted mb-0 mt-1">Sin resultados.</p>
          )}
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {productosSeleccionados.length === 0 ? (
        <p className="text-muted">Esperando lectura de código de barra...</p>
      ) : (
        <div className="scanner-lista">
          <div className="scanner-item-header">
            <span className="scanner-item-img scanner-header-spacer" />
            <span className="scanner-item-info">Producto</span>
            <span className="scanner-item-editar-wrap">
              <span className="scanner-item-editar scanner-header-spacer" />
            </span>
            <span className="scanner-item-resultado">
              <span className="scanner-item-cantidad">Cant.</span>
              <span className="scanner-item-total">Total</span>
            </span>
          </div>
          {productosSeleccionados.map((p) => (
            <div className="scanner-item" key={p.codigo}>
              <div className="scanner-item-img scanner-item-img--vacia">
                <span>img</span>
              </div>
              <div className="scanner-item-info">
                <div className="scanner-item-nombre">{p.name}</div>
                <div className="scanner-item-precio">
                  {p.currency === 'USD' ? 'U$' : '$'}
                  {p.precio.toFixed(2)} c/u
                </div>
              </div>
              <div className="scanner-item-editar-wrap">
                <button
                  type="button"
                  className="scanner-item-editar"
                  onClick={() => setProductoEditando(p.codigo)}
                  aria-label={`Editar ${p.name}`}
                >
                  Editar
                </button>
              </div>
              <div className="scanner-item-resultado">
                <div className="scanner-item-cantidad-controles">
                  <button
                    type="button"
                    className="scanner-item-cant-btn"
                    onClick={() => (p.cantidad > 1 ? updateProductQuantity(p.codigo, p.cantidad - 1) : removeProduct(p.codigo))}
                    title={p.cantidad > 1 ? 'Restar 1 unidad' : 'Quitar producto'}
                    aria-label={`Restar 1 unidad de ${p.name}`}
                  >
                    −
                  </button>
                  <span className="scanner-item-cantidad">{p.cantidad}</span>
                  <button
                    type="button"
                    className="scanner-item-cant-btn"
                    onClick={() => updateProductQuantity(p.codigo, p.cantidad + 1)}
                    aria-label={`Sumar 1 unidad a ${p.name}`}
                  >
                    +
                  </button>
                </div>
                <div className="scanner-item-total">
                  {p.currency === 'USD' ? 'U$' : '$'}
                  {p.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          <div className="scanner-total">
            {totalPesos > 0 && <div>Total $: {totalPesos.toFixed(2)}</div>}
            {totalDolares > 0 && <div>Total U$: {totalDolares.toFixed(2)}</div>}
          </div>

          <button
            className="btn btn-success btn-lg mt-3 w-100"
            disabled={agregandoProductos}
            onClick={() => (ventaAbierta ? handleAgregarAVentaAbierta() : setMostrarCheckout(true))}
          >
            {ventaAbierta ? (agregandoProductos ? 'Agregando...' : 'Agregar a la boleta') : 'Confirmar compra'}
          </button>
        </div>
      )}

      {codigoNoEncontrado && (
        <ProductoFormModal
          titulo="Producto no encontrado"
          textoBoton="Guardar y agregar"
          codigoBarraFijo={codigoNoEncontrado}
          onCancelar={handleCancelarModal}
          onGuardado={handleProductoGuardado}
        />
      )}

      {productoEditando !== null && (
        <EditarProductoModal
          codigo={productoEditando}
          cantidadEnCarrito={productosSeleccionados.find((p) => p.codigo === productoEditando)?.cantidad}
          onCantidadGuardada={(cantidad) => updateProductQuantity(productoEditando, cantidad)}
          onCancelar={() => setProductoEditando(null)}
          onGuardado={handleProductoActualizado}
        />
      )}

      {mostrarCheckout && (
        <CheckoutModal
          productos={productosSeleccionados}
          totalPesos={totalPesos}
          totalDolares={totalDolares}
          onCancelar={() => setMostrarCheckout(false)}
          onConfirmado={handleVentaConfirmada}
        />
      )}
    </div>
  )
}

export default Scanner
