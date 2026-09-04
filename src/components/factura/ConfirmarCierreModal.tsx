import '../../styles/scanner/modal.scss'

interface Props {
  onConfirmar: () => void
  onCancelar: () => void
}

// Reemplaza el window.confirm() nativo (el cartel feo del navegador) por
// un modal con el mismo estilo que el resto de la app, para confirmar el
// "Cerrar" de una boleta recien confirmada.
const ConfirmarCierreModal = ({ onConfirmar, onCancelar }: Props) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <h4>¿Estás seguro que deseas cerrar?</h4>
      <p>Esto borra la factura actual.</p>

      <div className="modal-acciones">
        <button type="button" className="btn modal-btn-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn modal-btn-cancelar-boleta" onClick={onConfirmar}>
          Sí, cerrar
        </button>
      </div>
    </div>
  </div>
)

export default ConfirmarCierreModal
