import { useState } from 'react'
import { CarritoProvider } from './context/CarritoContext'
import { ToastProvider } from './context/ToastContext'
import NavBar, { type Vista } from './components/layout/NavBar'
import AvisoNuevaVersion from './components/layout/AvisoNuevaVersion'
import Productos from './components/productos/Productos'
import Factura from './components/factura/Factura'
import Scanner from './components/scanner/Scanner'
import Clientes from './components/clientes/Clientes'
import Pagos from './components/pagos/Pagos'
import PanelControl from './components/panel/PanelControl'
import Stock from './components/stock/Stock'
import Mes from './components/mes/Mes'

function App() {
  const [vista, setVista] = useState<Vista>('scanner')

  return (
    <ToastProvider>
      <CarritoProvider>
        <NavBar vista={vista} setVista={setVista} />
        {vista === 'productos' && <Productos />}
        {vista === 'factura' && <Factura />}
        {vista === 'scanner' && <Scanner />}
        {vista === 'clientes' && <Clientes />}
        {vista === 'pagos' && <Pagos />}
        {vista === 'panel' && <PanelControl />}
        {vista === 'stock' && <Stock />}
        {vista === 'mes' && <Mes />}
        <AvisoNuevaVersion />
      </CarritoProvider>
    </ToastProvider>
  )
}

export default App
