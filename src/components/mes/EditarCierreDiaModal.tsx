import { useState, type FormEvent } from 'react'
import '../../styles/scanner/modal.scss'

interface Props {
  fecha: string
  totalPesosActual: number
  totalDolaresActual: number
  onCancelar: () => void
  onGuardar: (totalPesos: number, totalDolares: number) => Promise<void>
}

const EditarCierreDiaModal = ({ fecha, totalPesosActual, totalDolaresActual, onCancelar, onGuardar }: Props) => {
  const [totalPesos, setTotalPesos] = useState(String(totalPesosActual))
  const [totalDolares, setTotalDolares] = useState(String(totalDolaresActual))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const pesos = parseFloat(totalPesos)
    const dolares = parseFloat(totalDolares) || 0
    if (Number.isNaN(pesos) || pesos < 0) {
      setError('Ingresá un valor válido.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      await onGuardar(pesos, dolares)
    } catch {
      setError('No se pudo guardar. Probá de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Corregir cierre</h4>
        <p className="text-muted">{fecha.split('-').reverse().join('/')}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Total en pesos</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={totalPesos}
              onChange={(e) => setTotalPesos(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Total en dólares (opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={totalDolares}
              onChange={(e) => setTotalDolares(e.target.value)}
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarCierreDiaModal
