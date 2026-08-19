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
          <div>Uso interno</div>
          <div>Cel: 092945696</div>
        </div>

        <div className="pie-col">Firma: _________________________</div>

        <div className="pie-col pie-totales">
          <div className="total-item">
            <span className="total-label">Total $:</span>
            <span className="total-value">{totalPesos.toFixed(2)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Dólares:</span>
            <span className="total-value">{totalDolares.toFixed(2)}</span>
          </div>

          <div
            className="total-item total-final"
            style={{ color: 'darkred', cursor: 'pointer' }}
            onClick={() => setFinalEnDolares(!finalEnDolares)}
          >
            <span className="total-label">Total:</span>
            <span className="total-value">
              {finalEnDolares ? `U$ ${totalFinalDolares.toFixed(2)}` : `$ ${totalFinalPesos.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PieFactura
