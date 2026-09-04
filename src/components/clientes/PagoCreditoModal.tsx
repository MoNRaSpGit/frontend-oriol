import { useState, type FormEvent } from 'react'
import type { OriolCurrency, TipoPagoCredito } from '../../types/venta'
import '../../styles/scanner/modal.scss'

interface Props {
  titulo: string
  subtitulo?: string
  moneda: OriolCurrency
  saldoPendiente: number
  onCancelar: () => void
  onConfirmar: (tipo: TipoPagoCredito, monto?: number) => Promise<void>
}

const PagoCreditoModal = ({ titulo, subtitulo, moneda, saldoPendiente, onCancelar, onConfirmar }: Props) => {
  const [tipo, setTipo] = useState<TipoPagoCredito>('completo')
  const [monto, setMonto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const simbolo = moneda === 'USD' ? 'U$S' : '$'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (tipo === 'parcial') {
      const montoNum = parseFloat(monto)
      if (!montoNum || montoNum <= 0) {
        setError('Ingresá un monto válido.')
        return
      }
      if (montoNum > saldoPendiente) {
        setError(`El monto no puede ser mayor al saldo pendiente (${simbolo} ${saldoPendiente.toFixed(2)}).`)
        return
      }
      setEnviando(true)
      try {
        await onConfirmar('parcial', montoNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo registrar el pago. Probá de nuevo.')
        setEnviando(false)
      }
      return
    }

    setEnviando(true)
    try {
      await onConfirmar('completo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago. Probá de nuevo.')
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>{titulo}</h4>
        {subtitulo && <p className="text-muted">{subtitulo}</p>}

        <div className="modal-total-destacado">
          <span className="modal-total-label">Saldo pendiente</span>
          <span className="modal-total-valor">{simbolo} {saldoPendiente.toFixed(2)}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-metodo-pago mb-3">
            <button
              type="button"
              className={`btn metodo-btn ${tipo === 'completo' ? 'active' : ''}`}
              onClick={() => setTipo('completo')}
              disabled={enviando}
            >
              Pago completo
            </button>
            <button
              type="button"
              className={`btn metodo-btn ${tipo === 'parcial' ? 'active' : ''}`}
              onClick={() => setTipo('parcial')}
              disabled={enviando}
            >
              Pago parcial
            </button>
          </div>

          {tipo === 'parcial' && (
            <div className="mb-3">
              <label className="form-label">Monto a pagar</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={saldoPendiente}
                className="form-control"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                autoFocus
                placeholder={`Máximo ${simbolo} ${saldoPendiente.toFixed(2)}`}
              />
            </div>
          )}

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PagoCreditoModal
