import { apiFetch, errorDeRespuesta } from './apiClient'
import type { Producto } from '../types/producto'

// El backend (NestJS) habla en camelCase y numeros; el resto de la app
// (types/*, componentes) sigue esperando snake_case y strings, igual que
// el backend Express original — se traduce aca, en el borde de la API,
// para no tener que tocar nada mas.
interface ProductoApi {
  id: number
  name: string
  price: number
  description: string | null
  currency: 'UYU' | 'USD'
  codigoBarra: string | null
  stock: number
  stockMinimo: number | null
}

function aProducto(item: ProductoApi): Producto {
  return {
    id: item.id,
    name: item.name,
    price: String(item.price),
    description: item.description ?? '',
    currency: item.currency,
    codigo_barra: item.codigoBarra,
    stock: item.stock,
    stock_minimo: item.stockMinimo,
  }
}

export async function getProductos(): Promise<Producto[]> {
  const res = await apiFetch('/productos')
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener la lista de productos'))
  const data = (await res.json()) as { items: ProductoApi[] }
  return data.items.map(aProducto)
}

export async function getProductoPorCodigoBarra(codigoBarra: string): Promise<Producto | null> {
  const res = await apiFetch(`/productos/codigo/${encodeURIComponent(codigoBarra)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo buscar el producto'))
  const data = (await res.json()) as { item: ProductoApi }
  return aProducto(data.item)
}

export async function buscarProductosPorNombre(query: string): Promise<Producto[]> {
  const res = await apiFetch(`/productos/buscar?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo buscar productos'))
  const data = (await res.json()) as { items: ProductoApi[] }
  return data.items.map(aProducto)
}

export interface NuevoProducto {
  name: string
  price: number
  currency: 'UYU' | 'USD'
  codigo_barra?: string
  stock: number
}

export async function crearProducto(producto: NuevoProducto): Promise<Producto> {
  const res = await apiFetch('/productos', {
    method: 'POST',
    body: JSON.stringify({
      name: producto.name,
      price: producto.price,
      currency: producto.currency,
      codigoBarra: producto.codigo_barra,
      stock: producto.stock,
      description: '',
    }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo crear el producto'))
  const data = (await res.json()) as { item: ProductoApi }
  return aProducto(data.item)
}

export async function getProductoPorId(id: number): Promise<Producto | null> {
  const res = await apiFetch(`/productos/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo obtener el producto'))
  const data = (await res.json()) as { item: ProductoApi }
  return aProducto(data.item)
}

export async function actualizarProducto(id: number, producto: Omit<Producto, 'id' | 'price'> & { price: number }): Promise<Producto> {
  const res = await apiFetch(`/productos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: producto.name,
      price: producto.price,
      description: producto.description,
      currency: producto.currency,
      codigoBarra: producto.codigo_barra ?? undefined,
      stock: producto.stock,
      stockMinimo: producto.stock_minimo ?? undefined,
    }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo actualizar el producto'))
  const data = (await res.json()) as { item: ProductoApi }
  return aProducto(data.item)
}

export async function eliminarProducto(id: number): Promise<void> {
  const res = await apiFetch(`/productos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo eliminar el producto'))
}

export interface StockUpdate {
  stock?: number
  stock_minimo?: number | null
}

export async function actualizarStockProducto(id: number, cambios: StockUpdate): Promise<Producto> {
  const res = await apiFetch(`/productos/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({
      stock: cambios.stock,
      stockMinimo: cambios.stock_minimo ?? undefined,
    }),
  })
  if (!res.ok) throw new Error(await errorDeRespuesta(res, 'No se pudo actualizar el stock'))
  const data = (await res.json()) as { item: ProductoApi }
  return aProducto(data.item)
}
