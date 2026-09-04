import type { ProductoBoleta, ProductoParaCarrito } from './CarritoContext'

export function addOrUpdateProductoEnLista(
  prev: ProductoBoleta[],
  producto: ProductoParaCarrito
): ProductoBoleta[] {
  const existente = prev.find((p) => p.codigo === producto.id)
  if (existente) {
    return prev.map((p) =>
      p.codigo === producto.id
        ? {
            ...p,
            name: producto.name,
            // El catalogo no tiene un campo de descripcion real (el
            // formulario "Agregar producto" nunca lo pide, siempre queda
            // vacio) -- se usa el nombre como descripcion, igual que ya
            // hace BoletaReimpresa.tsx al reimprimir una venta vieja, para
            // que la columna "Descripcion" de la boleta no quede en blanco.
            descripcion: producto.name,
            precio: producto.price,
            currency: producto.currency || 'UYU',
            cantidad: p.cantidad + 1,
            total: (p.cantidad + 1) * producto.price,
          }
        : p
    )
  }
  return [
    ...prev,
    {
      codigo: producto.id,
      name: producto.name,
      // Mismo criterio que arriba: no hay descripcion real en el
      // catalogo, se usa el nombre.
      descripcion: producto.name,
      precio: producto.price,
      currency: producto.currency || 'UYU',
      cantidad: 1,
      total: producto.price,
    },
  ]
}

export function updateCantidadEnLista(prev: ProductoBoleta[], codigo: number, cantidad: number): ProductoBoleta[] {
  return prev.map((p) => (p.codigo === codigo ? { ...p, cantidad, total: cantidad * p.precio } : p))
}

export function removeProductoDeLista(prev: ProductoBoleta[], codigo: number): ProductoBoleta[] {
  return prev.filter((p) => p.codigo !== codigo)
}

export function actualizarDatosEnLista(
  prev: ProductoBoleta[],
  codigo: number,
  datos: { name: string; precio: number; currency: 'UYU' | 'USD' }
): ProductoBoleta[] {
  return prev.map((p) =>
    p.codigo === codigo
      ? {
          ...p,
          name: datos.name,
          // Mismo criterio que al agregar (ver addOrUpdateProductoEnLista):
          // la descripcion es el nombre. Sin esto, editar un producto que
          // ya estaba en la boleta actualizaba el nombre pero dejaba la
          // descripcion pegada con el nombre viejo -- por eso "a veces
          // agarra y a veces no", dependia de si se habia editado o no.
          descripcion: datos.name,
          precio: datos.precio,
          currency: datos.currency,
          total: p.cantidad * datos.precio,
        }
      : p
  )
}
