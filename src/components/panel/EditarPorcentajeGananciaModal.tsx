import { useState, type FormEvent } from 'react'
import '../../styles/scanner/modal.scss'

interface Props {
  valorActual: number
  onCancelar: () => void
  onGuardar: (porcentaje: number) => void
}

const EditarPorcentajeGananciaModal = ({ valorActual, onCancelar, onGuardar }: Props) => {
  const [valor, setValor] = useState(String(valorActual))
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const num = parseFloat(valor)
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setError('Ingresá un porcentaje entre 0 y 100.')
      return
    }
    onGuardar(num)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h4>Porcentaje de ganancia</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">% de la venta diaria que se considera ganancia</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="form-control"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
            />
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="modal-acciones">
            <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn modal-btn-confirmar">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarPorcentajeGananciaModal
