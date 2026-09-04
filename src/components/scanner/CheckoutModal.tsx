import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { getClientes, crearCliente } from '../../services/clientes.service'
import { registrarVentaCredito, registrarVentaContado } from '../../services/ventas.service'
import { mensajeDeError } from '../../utils/errores'
import type { ProductoBoleta } from '../../context/CarritoContext'
import type { Cliente } from '../../types/cliente'
import type { ItemVenta, MetodoPago } from '../../types/venta'
import VincularClienteModal, { type ClienteVinculado } from './VincularClienteModal'
import '../../styles/scanner/modal.scss'

// Oculto a pedido (04/09/2026): no se usa por ahora, pero se deja el
// metodo/boton en el codigo por si vuelve a hacer falta mas adelante.
const MOSTRAR_METODO_TARJETA = false

export interface VentaConfirmadaInfo {
  metodo: MetodoPago
  nombreCliente?: string
  ventaId: number
  fecha: string
  clienteId?: number
}

interface Props {
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
  onCancelar: () => void
  onConfirmado: (info: VentaConfirmadaInfo) => void
}

const CheckoutModal = ({ productos, totalPesos, totalDolares, onCancelar, onConfirmado }: Props) => {
  const [metodo, setMetodo] = useState<MetodoPago | null>('efectivo')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vincularCliente, setVincularCliente] = useState(false)
  // Cliente elegido o creado en el momento -- se usa tanto para credito
  // (obligatorio) como para vincular una boleta en efectivo/tarjeta
  // (opcional), con el mismo modal de seleccionar/crear cliente para los
  // dos casos, en vez de que credito tenga su propio <select> aparte.
  const [clienteVinculado, setClienteVinculado] = useState<ClienteVinculado | null>(null)
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Ventas a crédito siempre necesitan la lista de clientes; en
  // efectivo/tarjeta solo se pide si el usuario decide vincular una boleta
  // a un cliente (opcional, para poder reimprimirla después).
  const necesitaListaClientes = metodo === 'credito' || vincularCliente

  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  useEffect(() => {
    if (necesitaListaClientes) {
      getClientes()
        .then(setClientes)
        .catch((err) => setError(mensajeDeError(err, 'No se pudo cargar la lista de clientes.')))
    }
  }, [necesitaListaClientes])

  const items: ItemVenta[] = productos.map((p) => ({
    id: p.codigo,
    name: p.name,
    cantidad: p.cantidad,
    precio: p.precio,
    currency: p.currency,
  }))

  const handleConfirmar = async () => {
    setError('')

    if (metodo === 'credito') {
      if (!clienteVinculado) {
        setError('Seleccioná un cliente o ingresá uno nuevo.')
        return
      }
      setGuardando(true)
      let clienteIdCredito: number
      if (clienteVinculado.tipo === 'nuevo') {
        try {
          const nuevoCliente = await crearCliente(clienteVinculado.nombre, clienteVinculado.telefono, clienteVinculado.cedula)
          clienteIdCredito = nuevoCliente.id
        } catch (err) {
          setError(mensajeDeError(err, 'No se pudo crear el cliente.'))
          setGuardando(false)
          return
        }
      } else {
        clienteIdCredito = clienteVinculado.clienteId!
      }
      try {
        const venta = await registrarVentaCredito({
          cliente_id: clienteIdCredito,
          total_pesos: totalPesos,
          total_dolares: totalDolares,
          items,
        })
        onConfirmado({
          metodo: 'credito',
          nombreCliente: clienteVinculado.nombre,
          ventaId: venta.id,
          fecha: venta.fecha,
          clienteId: clienteIdCredito,
        })
      } catch (err) {
        setError(mensajeDeError(err, 'No se pudo registrar la venta. Probá de nuevo.'))
        setGuardando(false)
      }
      return
    }

    // Efectivo o tarjeta: por defecto no queda a nombre de nadie, pero se
    // puede vincular a un cliente (nuevo o existente) para poder
    // reimprimir la boleta más adelante. No afecta la deuda.
    let clienteIdFinal: number | undefined
    if (vincularCliente) {
      if (!clienteVinculado) {
        setError('Seleccioná un cliente o ingresá uno nuevo.')
        return
      }
      if (clienteVinculado.tipo === 'nuevo') {
        setGuardando(true)
        try {
          const nuevoCliente = await crearCliente(
            clienteVinculado.nombre,
            clienteVinculado.telefono,
            clienteVinculado.cedula
          )
          clienteIdFinal = nuevoCliente.id
        } catch (err) {
          setError(mensajeDeError(err, 'No se pudo crear el cliente.'))
          setGuardando(false)
          return
        }
      } else {
        clienteIdFinal = clienteVinculado.clienteId
      }
    }

    setGuardando(true)
    try {
      const venta = await registrarVentaContado({
        metodo_pago: metodo as 'efectivo' | 'tarjeta',
        total_pesos: totalPesos,
        total_dolares: totalDolares,
        items,
        cliente_id: clienteIdFinal,
      })
      onConfirmado({
        metodo: metodo as 'efectivo' | 'tarjeta',
        nombreCliente: vincularCliente ? clienteVinculado?.nombre : undefined,
        ventaId: venta.id,
        fecha: venta.fecha,
        clienteId: clienteIdFinal,
      })
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo registrar la venta. Probá de nuevo.'))
      setGuardando(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    // Si el foco está en un input de texto (nombre/teléfono del cliente
    // nuevo), Enter no debe disparar la confirmación de la venta todavía.
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT') return
    e.preventDefault()
    if (!guardando && metodo) handleConfirmar()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" ref={modalRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <h4>Confirmar compra</h4>

        <div className="modal-total-destacado">
          <span className="modal-total-label">Total a cobrar</span>
          <span className="modal-total-valor">
            {totalPesos > 0 && <span>$ {totalPesos.toFixed(2)}</span>}
            {totalDolares > 0 && <span>U$ {totalDolares.toFixed(2)}</span>}
          </span>
        </div>

        <div className="mb-3">
          <label className="form-label">Método de pago</label>
          <div className="modal-metodo-pago">
            <button
              type="button"
              className={`btn metodo-btn ${metodo === 'efectivo' ? 'active' : ''}`}
              onClick={() => setMetodo('efectivo')}
            >
              Efectivo
            </button>
            {/* Tarjeta: oculta a pedido (no se saca el codigo, puede volver a
                mostrarse mas adelante -- ver MOSTRAR_METODO_TARJETA). No
                afecta ventas viejas hechas con este metodo, ni la logica
                de metodo_pago del backend. */}
            {MOSTRAR_METODO_TARJETA && (
              <button
                type="button"
                className={`btn metodo-btn ${metodo === 'tarjeta' ? 'active' : ''}`}
                onClick={() => setMetodo('tarjeta')}
              >
                Tarjeta
              </button>
            )}
            <button
              type="button"
              className={`btn metodo-btn ${metodo === 'credito' ? 'active' : ''}`}
              onClick={() => setMetodo('credito')}
            >
              Crédito
            </button>
          </div>
        </div>

        {metodo === 'credito' && (
          <div className="mb-3">
            <label className="form-label">Cliente</label>
            {!clienteVinculado ? (
              <div>
                <button type="button" className="btn btn-primary" onClick={() => setMostrarModalCliente(true)}>
                  Seleccionar cliente
                </button>
              </div>
            ) : (
              <div className="modal-cliente-vinculado">
                <span>
                  Cliente: <strong>{clienteVinculado.nombre}</strong>
                </span>
                <button type="button" className="btn btn-link p-0" onClick={() => setMostrarModalCliente(true)}>
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {(metodo === 'efectivo' || metodo === 'tarjeta') && (
          <div className="mb-3 modal-vincular-cliente">
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={vincularCliente}
                onChange={(e) => {
                  const checked = e.target.checked
                  setVincularCliente(checked)
                  if (checked) {
                    setMostrarModalCliente(true)
                  } else {
                    setClienteVinculado(null)
                  }
                }}
              />
              Guardar boleta
            </label>

            {vincularCliente && clienteVinculado && (
              <div className="mt-2 modal-cliente-vinculado">
                <span>
                  Cliente: <strong>{clienteVinculado.nombre}</strong>
                </span>
                <button type="button" className="btn btn-link p-0" onClick={() => setMostrarModalCliente(true)}>
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-danger">{error}</p>}

        <div className="modal-acciones">
          <button type="button" className="btn modal-btn-cancelar-boleta" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn modal-btn-confirmar"
            onClick={handleConfirmar}
            disabled={!metodo || guardando}
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>

      {mostrarModalCliente && (
        <VincularClienteModal
          clientes={clientes}
          onCancelar={() => {
            setMostrarModalCliente(false)
            if (!clienteVinculado) setVincularCliente(false)
          }}
          onConfirmar={(cliente) => {
            setClienteVinculado(cliente)
            setMostrarModalCliente(false)
          }}
        />
      )}
    </div>
  )
}

export default CheckoutModal
