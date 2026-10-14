
import { useEffect } from "react";
import "../Common/CustomModal.css";

const CustomModal = ({
  isOpen,
  title,
  message,
  type = "success",
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onCancel) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const icon = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i",
  }[type] || "i";

  return (
    <div
      className="custom-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <section
        className="custom-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="custom-modal-title"
        aria-describedby="custom-modal-message"
      >
        <div className={`custom-modal-icon ${type}`}>
          {icon}
        </div>

        <h2 id="custom-modal-title">{title}</h2>

        <p id="custom-modal-message">{message}</p>

        <div className="custom-modal-actions">
          {showCancel && (
            <button
              type="button"
              className="custom-modal-button secondary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className="custom-modal-button primary"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomModal;
