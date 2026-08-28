import { useEffect, useRef, useState } from 'react'
import {
  FaBoxOpen,
  FaFileInvoice,
  FaBarcode,
  FaUsers,
  FaChartBar,
  FaUserCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
} from 'react-icons/fa'
import { useCarrito } from '../../context/CarritoContext'
import { getHealth } from '../../services/health.service'
import { getTasaDolar, actualizarTasaDolar } from '../../services/config.service'
import EditarTasaDolarModal from './EditarTasaDolarModal'
import '../../styles/layout/navbar.scss'

export type Vista = 'productos' | 'factura' | 'scanner' | 'clientes' | 'panel' | 'stock' | 'mes'

interface Props {
  vista: Vista
  setVista: (v: Vista) => void
}

interface Tab {
  vista: Vista
  etiqueta: string
  icono: React.ReactNode
}

const TABS_VISIBLES: Tab[] = [
  { vista: 'scanner', etiqueta: 'Producto', icono: <FaBarcode /> },
  { vista: 'factura', etiqueta: 'Factura', icono: <FaFileInvoice /> },
  { vista: 'stock', etiqueta: 'Stock', icono: <FaExclamationTriangle /> },
]

const TABS_MENU: Tab[] = [
  { vista: 'productos', etiqueta: 'Productos', icono: <FaBoxOpen /> },
  { vista: 'clientes', etiqueta: 'Cuenta corriente', icono: <FaUsers /> },
  { vista: 'panel', etiqueta: 'Panel', icono: <FaChartBar /> },
  { vista: 'mes', etiqueta: 'Mes', icono: <FaCalendarAlt /> },
]

// Render (plan free) duerme el backend tras ~15 min sin pedidos entrantes,
// y el primer pedido después de eso tarda bastante en "despertarlo". Repetir
// este chequeo mientras la app sigue abierta evita ese arranque en frío —
// de paso, mantiene el indicador "Conectado"/"Sin conexión" al día en vez
// de chequear una sola vez al cargar la página.
const INTERVALO_KEEPALIVE_MS = 3 * 60 * 1000

const NavBar = ({ vista, setVista }: Props) => {
  const { productosSeleccionados } = useCarrito()
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [tasaDolar, setTasaDolar] = useState<number | null>(null)
  const [editandoTasaDolar, setEditandoTasaDolar] = useState(false)

  useEffect(() => {
    const chequearSalud = () => {
      getHealth()
        .then((ok) => setApiStatus(ok ? 'ok' : 'error'))
        .catch(() => setApiStatus('error'))
    }
    chequearSalud()

    const intervalId = setInterval(() => {
      // No tiene sentido gastar el pedido si la pestaña está en segundo
      // plano (nadie la está usando en este momento) o si el dispositivo
      // ya sabe que no tiene internet.
      if (document.visibilityState === 'visible' && navigator.onLine) {
        chequearSalud()
      }
    }, INTERVALO_KEEPALIVE_MS)

    return () => clearInterval(intervalId)
  }, [])

  // La tasa se muestra siempre en la barra superior (no solo en el Panel)
  // para que se vea "a cuanto la pusimos" sin importar en que seccion se
  // esta -- es la misma fuente de verdad que usa el checkout para convertir
  // pesos/dolares (ver useTasaDolar).
  useEffect(() => {
    getTasaDolar()
      .then(setTasaDolar)
      .catch(() => {})
  }, [])

  const handleGuardarTasaDolar = async (valor: number) => {
    const guardado = await actualizarTasaDolar(valor)
    setTasaDolar(guardado)
    setEditandoTasaDolar(false)
  }

  useEffect(() => {
    if (!menuAbierto) return
    const cerrarSiEsAfuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', cerrarSiEsAfuera)
    return () => document.removeEventListener('mousedown', cerrarSiEsAfuera)
  }, [menuAbierto])

  const irA = (v: Vista) => {
    setVista(v)
    setMenuAbierto(false)
  }

  return (
    <nav className="app-navbar">
      <div className="app-navbar-top">
        <div className="app-navbar-brand">Agro Insumos</div>
        {tasaDolar !== null && (
          <button
            type="button"
            className="app-navbar-tasa"
            onClick={() => setEditandoTasaDolar(true)}
            title="Click para editar la tasa"
          >
            Tasa dólar: $ {tasaDolar.toFixed(2)} <span className="app-navbar-tasa-editar">editar</span>
          </button>
        )}
        <div className={`app-navbar-status app-navbar-status--${apiStatus}`}>
          <span className="app-navbar-status-dot" />
          {apiStatus === 'checking' && 'Conectando...'}
          {apiStatus === 'ok' && 'Conectado'}
          {apiStatus === 'error' && 'Sin conexión'}
        </div>
      </div>

      {editandoTasaDolar && tasaDolar !== null && (
        <EditarTasaDolarModal
          valorActual={tasaDolar}
          onCancelar={() => setEditandoTasaDolar(false)}
          onGuardar={handleGuardarTasaDolar}
        />
      )}

      <div className="app-navbar-links">
        {TABS_VISIBLES.map((tab) => (
          <button
            key={tab.vista}
            className={vista === tab.vista ? 'nav-link active' : 'nav-link'}
            onClick={() => setVista(tab.vista)}
          >
            <span className="nav-link-icono">{tab.icono}</span>
            <span className="nav-link-texto">{tab.etiqueta}</span>
            {tab.vista === 'factura' && productosSeleccionados.length > 0 && (
              <span className="badge">{productosSeleccionados.length}</span>
            )}
          </button>
        ))}

        <div className="app-navbar-menu" ref={menuRef}>
          <button
            className={TABS_MENU.some((t) => t.vista === vista) ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Más opciones"
          >
            <span className="nav-link-icono">
              <FaUserCircle />
            </span>
          </button>

          {menuAbierto && (
            <div className="app-navbar-dropdown">
              {TABS_MENU.map((tab) => (
                <button
                  key={tab.vista}
                  className={vista === tab.vista ? 'dropdown-item active' : 'dropdown-item'}
                  onClick={() => irA(tab.vista)}
                >
                  <span className="nav-link-icono">{tab.icono}</span>
                  <span>{tab.etiqueta}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default NavBar
