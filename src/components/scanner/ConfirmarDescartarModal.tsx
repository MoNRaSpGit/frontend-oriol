import '../../styles/scanner/modal.scss'

interface Props {
  guardando: boolean
  onSeguirEditando: () => void
  onDescartar: () => void
  onGuardar: () => void
}

// Pedido explicito (01/10/2026): como ahora la boleta no se guarda hasta
// tocar "Confirmar", el "Cancelar" ya no puede cerrar sin mas -- tiene
// que preguntar si se quiere guardar la venta igual antes de salir, o
// descartarla del todo. Reemplaza al simple si/no de ConfirmarCierreModal
// SOLO para la boleta todavia sin confirmar (ver BoletaBorrador).
const ConfirmarDescartarModal = ({ guardando, onSeguirEditando, onDescartar, onGuardar }: Props) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <h4>¿Qué hacemos con esta boleta?</h4>
      <p>Todavía no se guardó nada. Podés seguir editando, descartarla, o guardarla tal como está.</p>

      <div className="modal-acciones modal-acciones-columna">
        <button type="button" className="btn modal-btn-cancelar" onClick={onSeguirEditando} disabled={guardando}>
          Seguir editando
        </button>
        <button type="button" className="btn modal-btn-cancelar-boleta" onClick={onDescartar} disabled={guardando}>
          Descartar (no guardar nada)
        </button>
        <button type="button" className="btn modal-btn-confirmar" onClick={onGuardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar y salir'}
        </button>
      </div>
    </div>
  </div>
)

export default ConfirmarDescartarModal
