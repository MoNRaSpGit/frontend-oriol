import '../../styles/factura/cabecera.scss'

export interface DatosFactura {
  rutEmisor: string
  eFacture: string
  serie: string
  fecha: string
  pago: string
  moneda: string
  rutReceptor: string
  nombreCliente: string
  direccionCliente: string
  ubicacionCliente: string
}

interface Props {
  datosFactura: DatosFactura
  finalEnDolares: boolean
  onEditar?: () => void
}

const CabeceraFactura = ({ datosFactura, finalEnDolares, onEditar }: Props) => {
  const monedaAMostrar = finalEnDolares ? 'USD' : datosFactura.moneda

  return (
    <div className="factura-header">
      <div className="factura-logo-container">
        <img src={`${import.meta.env.BASE_URL}LogoOriol.jpeg`} alt="Agro Insumos Tacuarembó" className="factura-logo" />
        <div className="factura-logo-datos">
          <div>W. Ferreira Aldunate y Olimpia Pintos</div>
          <div>46329790 - 098796127</div>
        </div>
      </div>

      <div
        className="header-box"
        onClick={onEditar}
        role={onEditar ? 'button' : undefined}
        title={onEditar ? 'Editar datos de la factura' : undefined}
      >
        <div className="header-row header-rut">RUT EMISOR: {datosFactura.rutEmisor}</div>
        <div className="header-row header-efacture">{datosFactura.eFacture}</div>
        <div className="header-multi">
          <div className="header-titles-values">
            <div className="header-col header-title">SERIE</div>
            <div className="header-col header-title">FECHA</div>
            <div className="header-col header-title">PAGO</div>
            <div className="header-col header-title">MONEDA</div>
          </div>
          <div className="header-titles-values">
            <div className="header-col header-value">{datosFactura.serie}</div>
            <div className="header-col header-value">{datosFactura.fecha}</div>
            <div className="header-col header-value">{datosFactura.pago}</div>
            <div className="header-col header-value">{monedaAMostrar}</div>
          </div>
        </div>
        <div className="header-row header-receptor">RUT RECEPTOR: {datosFactura.rutReceptor}</div>
        <div className="header-row header-cliente">
          <div className="nombre-cliente">{datosFactura.nombreCliente}</div>
          <div>{datosFactura.direccionCliente}</div>
          <div>{datosFactura.ubicacionCliente}</div>
        </div>
      </div>
    </div>
  )
}

export default CabeceraFactura
