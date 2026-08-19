import type { Cliente } from '../../types/cliente'

interface Props {
  clientes: Cliente[]
  cargando: boolean
  clienteSeleccionadoId: number | null
  onSeleccionar: (cliente: Cliente) => void
  onEliminar: (cliente: Cliente) => void
}

const ListaClientes = ({ clientes, cargando, clienteSeleccionadoId, onSeleccionar, onEliminar }: Props) => {
  if (cargando) return <p className="text-muted">Cargando...</p>
  if (clientes.length === 0) return <p className="text-muted">Todavía no hay clientes de alta.</p>

  return (
    <ul className="cliente-lista">
      {clientes.map((c) => {
        const tieneDeuda = Number(c.deuda) > 0
        const tieneDeudaDolares = Number(c.deuda_dolares) > 0
        return (
          <li
            key={c.id}
            className={`cliente-item ${c.id === clienteSeleccionadoId ? 'active' : ''}`}
            onClick={() => onSeleccionar(c)}
          >
            <div className="cliente-item-header">
              <div className="cliente-item-nombre">{c.nombre}</div>
              <button
                type="button"
                className="cliente-item-eliminar"
                onClick={(e) => {
                  e.stopPropagation()
                  onEliminar(c)
                }}
              >
                Eliminar
              </button>
            </div>
            <div className={`cliente-item-deuda ${tieneDeuda ? 'cliente-item-deuda--activa' : ''}`}>
              Deuda: $ {Number(c.deuda).toFixed(2)}
            </div>
            {tieneDeudaDolares && (
              <div className="cliente-item-deuda cliente-item-deuda--activa">
                Deuda: U$ {Number(c.deuda_dolares).toFixed(2)}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ListaClientes
