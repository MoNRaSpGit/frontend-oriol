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
          {/* Pedido explicito (30/09/2026, "saca eso, solo deja un total"):
              una sola linea de total, que cambia de moneda entera al
              click. Pedido explicito (01/10/2026): de yapa, una
              referencia en pesos SOLO cuando se esta viendo en dolares
              (si ya se esta viendo en pesos, esa referencia seria
              redundante con el total de abajo -- por eso desaparece
              sola al tocar el total). No es clickeable, es solo para
              consulta rapida. */}
          {finalEnDolares && (
            <div className="total-item">
              <span className="total-label">Total en $:</span>
              <span className="total-value">{totalFinalPesos.toFixed(2)}</span>
            </div>
          )}
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
