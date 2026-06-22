export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal confirm-modal">
        <div className="modal-header">
          <h2>Confirm Delete</h2>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger-solid" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}
