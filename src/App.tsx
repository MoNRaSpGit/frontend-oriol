import { useState } from 'react'
import { CarritoProvider } from './context/CarritoContext'
import { ToastProvider } from './context/ToastContext'
import NavBar, { type Vista } from './components/layout/NavBar'
import AvisoNuevaVersion from './components/layout/AvisoNuevaVersion'
import Productos from './components/productos/Productos'
import Factura from './components/factura/Factura'
import Scanner from './components/scanner/Scanner'
import Clientes from './components/clientes/Clientes'
import PanelControl from './components/panel/PanelControl'
import Stock from './components/stock/Stock'
import Mes from './components/mes/Mes'

function App() {
  const [vista, setVista] = useState<Vista>('scanner')

  return (
    <ToastProvider>
      <CarritoProvider>
        {/* Franja de prueba TEMPORAL (22/10/2026, pedido explicito: "pone
            una franja roja para ver si sube los cambios") -- saco esto en
            cuanto confirmemos que el deploy esta llegando bien. */}
        <div
          style={{
            background: '#dc2626',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 800,
            padding: '6px 10px',
            fontSize: 14,
          }}
        >
          PRUEBA DE DEPLOY — si ves esta franja roja, el cambio nuevo SÍ llegó
        </div>
        <NavBar vista={vista} setVista={setVista} />
        {vista === 'productos' && <Productos />}
        {vista === 'factura' && <Factura />}
        {vista === 'scanner' && <Scanner />}
        {vista === 'clientes' && <Clientes />}
        {vista === 'panel' && <PanelControl />}
        {vista === 'stock' && <Stock />}
        {vista === 'mes' && <Mes />}
        <AvisoNuevaVersion />
      </CarritoProvider>
    </ToastProvider>
  )
}

export default App
