import { useState } from 'react'
import BoletaImprimible, { type DatosFactura } from '../factura/BoletaImprimible'
import ConfirmarDescartarModal from './ConfirmarDescartarModal'
import { useToast } from '../../context/ToastContext'
import { registrarVentaContado, registrarVentaCredito } from '../../services/ventas.service'
import { mensajeDeError } from '../../utils/errores'
import type { ProductoBoleta } from '../../context/CarritoContext'
import type { ItemVenta, MetodoPago } from '../../types/venta'

// Pedido explicito (01/10/2026, "el movimiento pesado lo pasamos a la
// factura"): esta pantalla reemplaza a lo que antes era "la boleta recien
// confirmada" (BoletaConfirmada) para el tramo ANTES de guardar de
// verdad. Nada de lo que pasa aca toca el backend -- ni los +/- de
// cantidad, ni "Volver" -- hasta que se toca "Confirmar", que es el
// UNICO guardado real (registrarVentaContado/Credito). Una vez que eso
// sale bien, Scanner.tsx cambia a mostrar BoletaConfirmada (sin tocar,
// esa sigue siendo "una venta ya guardada", con sus mismas reglas de
// siempre: +/- pega al backend, etc.).
const PAGO_POR_METODO: Record<MetodoPago, string> = {
  efectivo: 'Contado',
  tarjeta: 'Contado',
  credito: 'Crédito',
}

const formatearFecha = (fechaIso: string) =>
  new Date(fechaIso).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })

function recalcularTotales(productos: ProductoBoleta[]) {
  let totalPesos = 0
  let totalDolares = 0
  for (const p of productos) {
    if (p.currency === 'USD') totalDolares += p.total
    else totalPesos += p.total
  }
  return { totalPesos, totalDolares }
}

export interface BorradorInfo {
  metodoPago: MetodoPago
  fecha: string
  nombreCliente?: string
  clienteId?: number
  productos: ProductoBoleta[]
  totalPesos: number
  totalDolares: number
}

interface Props {
  borrador: BorradorInfo
  // Se descarta todo, sin guardar nada -- vuelve al scanner vacio.
  onDescartar: () => void
  // Vuelve al scanner a escanear algo que se olvido, conservando este
  // mismo borrador (se suma al volver, ver Scanner.tsx#handleVolverABorrador).
  onAgregarProductos: (borradorActual: BorradorInfo) => void
  // Se guardo de verdad -- Scanner.tsx pasa a mostrar BoletaConfirmada.
  onConfirmada: (info: { ventaId: number; fecha: string; borrador: BorradorInfo }) => void
}

const BoletaBorrador = ({ borrador, onDescartar, onAgregarProductos, onConfirmada }: Props) => {
  const { mostrarToast } = useToast()
  const [productos, setProductos] = useState(borrador.productos)
  const [totalPesos, setTotalPesos] = useState(borrador.totalPesos)
  const [totalDolares, setTotalDolares] = useState(borrador.totalDolares)
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Cantidad editable -- 100% local, sin pegarle al backend (ese era el
  // problema original: cada click quedaba pesado porque la venta ya
  // estaba guardada). Minimo 1 -- para sacar el producto del todo por
  // ahora no hay boton aca (mismo criterio que la boleta ya confirmada).
  function handleActualizarCantidad(codigo: number, cantidad: number) {
    if (cantidad < 1) return
    setProductos((actuales) => {
      const siguientes = actuales.map((p) => (p.codigo === codigo ? { ...p, cantidad, total: p.precio * cantidad } : p))
      const { totalPesos: nuevoPesos, totalDolares: nuevoDolares } = recalcularTotales(siguientes)
      setTotalPesos(nuevoPesos)
      setTotalDolares(nuevoDolares)
      return siguientes
    })
  }

  function armarItems(): ItemVenta[] {
    return productos.map((p) => ({
      id: p.codigo,
      name: p.name,
      cantidad: p.cantidad,
      precio: p.precio,
      currency: p.currency,
    }))
  }

  // EL guardado real -- unico lugar de toda la pantalla que pega contra
  // el backend para crear la venta. Lo usan tanto el boton "Confirmar"
  // como "Guardar y salir" del modal de cancelar.
  async function guardarVenta(): Promise<{ ventaId: number; fecha: string } | null> {
    setError('')
    setGuardando(true)
    try {
      const items = armarItems()
      const venta =
        borrador.metodoPago === 'credito'
          ? await registrarVentaCredito({
              cliente_id: borrador.clienteId!,
              total_pesos: totalPesos,
              total_dolares: totalDolares,
              items,
            })
          : await registrarVentaContado({
              metodo_pago: borrador.metodoPago as 'efectivo' | 'tarjeta',
              total_pesos: totalPesos,
              total_dolares: totalDolares,
              items,
              cliente_id: borrador.clienteId,
            })
      return { ventaId: venta.id, fecha: venta.fecha }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar la venta. Probá de nuevo.'))
      return null
    } finally {
      setGuardando(false)
    }
  }

  async function handleConfirmar() {
    const resultado = await guardarVenta()
    if (!resultado) return
    mostrarToast('Venta confirmada correctamente.')
    onConfirmada({ ...resultado, borrador: { ...borrador, productos, totalPesos, totalDolares } })
  }

  async function handleGuardarYSalir() {
    const resultado = await guardarVenta()
    if (!resultado) return
    setMostrarConfirmarSalida(false)
    mostrarToast('Venta confirmada correctamente.')
    onConfirmada({ ...resultado, borrador: { ...borrador, productos, totalPesos, totalDolares } })
  }

  const datosFactura: DatosFactura = {
    rutEmisor: '',
    eFacture: 'e-Factura',
    serie: 'A',
    fecha: formatearFecha(borrador.fecha),
    pago: PAGO_POR_METODO[borrador.metodoPago],
    moneda: 'UYU',
    rutReceptor: '',
    nombreCliente: borrador.nombreCliente || 'Cliente final',
    direccionCliente: '',
    ubicacionCliente: 'TACUAREMBÓ, URUGUAY',
  }

  return (
    <>
      <BoletaImprimible
        datosFactura={datosFactura}
        productos={productos}
        totalPesos={totalPesos}
        totalDolares={totalDolares}
        textoBotonVolver="Cancelar"
        onVolver={onDescartar}
        esCierre
        onSolicitarCierre={() => setMostrarConfirmarSalida(true)}
        onActualizarCantidad={handleActualizarCantidad}
        onAgregarProductos={() => onAgregarProductos({ ...borrador, productos, totalPesos, totalDolares })}
        onConfirmar={handleConfirmar}
        confirmando={guardando}
      />

      {error && <p className="text-danger text-center">{error}</p>}

      {mostrarConfirmarSalida && (
        <ConfirmarDescartarModal
          guardando={guardando}
          onSeguirEditando={() => setMostrarConfirmarSalida(false)}
          onDescartar={() => {
            setMostrarConfirmarSalida(false)
            onDescartar()
          }}
          onGuardar={handleGuardarYSalir}
        />
      )}
    </>
  )
}

export default BoletaBorrador
