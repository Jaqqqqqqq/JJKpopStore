import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "../../App.css";

export default function CustomModal({
  isOpen,
  title,
  message,
  type = "success",
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}) {
  const actionsRef = useRef({ onConfirm, onCancel });
  actionsRef.current = { onConfirm, onCancel };

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;

    Swal.fire({
      icon: type,
      title,
      text: message,
      showCancelButton: showCancel,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      allowOutsideClick: false,
      allowEscapeKey: showCancel,
      buttonsStyling: false,
      customClass: {
        popup: "jj-swal-popup",
        title: "jj-swal-title",
        htmlContainer: "jj-swal-text",
        confirmButton: "jj-swal-confirm",
        cancelButton: "jj-swal-cancel",
      },
    }).then((result) => {
      if (!active) return;
      if (result.isConfirmed) actionsRef.current.onConfirm?.();
      else actionsRef.current.onCancel?.();
    });

    return () => {
      active = false;
      Swal.close();
    };
  }, [isOpen, title, message, type, confirmText, cancelText, showCancel]);

  return null;
}
