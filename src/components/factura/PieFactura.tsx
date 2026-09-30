interface Props {
  totalPesos: number
  totalDolares: number
  finalEnDolares: boolean
  setFinalEnDolares: (value: boolean) => void
  tasaDolar: number
}

const PieFactura = ({ totalPesos, totalDolares, finalEnDolares, setFinalEnDolares, tasaDolar }: Props) => {
  const totalFinalPesos = totalPesos + totalDolares * tasaDolar
  const totalFinalDolares = totalDolares + totalPesos / tasaDolar

  return (
    <div className="factura-footer">
      <div className="pie-rect">
        <div className="pie-col2">
          <div>Desarrollado por LogicLab</div>
          <div>Sistema de facturación</div>
          <div>Cel: 092945696</div>
        </div>

        <div className="pie-col">Firma: _________________________</div>

        <div className="pie-col pie-totales">
          {/* Antes se mostraban 3 lineas ("Total $:", "Dolares:" y esta) --
              pedido explicito (30/09/2026, "saca eso, solo deja un total"):
              queda UNA sola, que cambia de moneda entera al click, igual
              que el toggle del catalogo y del carrito. */}
          <div
            className="total-item total-final"
            style={{ color: 'darkred', cursor: 'pointer' }}
            onClick={() => setFinalEnDolares(!finalEnDolares)}
          >
            <span className="total-label">Total:</span>
            <span className="total-value">
              {finalEnDolares ? `U$S ${totalFinalDolares.toFixed(2)}` : `$ ${totalFinalPesos.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PieFactura
