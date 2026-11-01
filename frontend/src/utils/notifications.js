import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export function showNotification({
  title,
  text,
  icon = "success",
  confirmButtonText = "OK",
}) {
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonText,
    buttonsStyling: false,
    customClass: {
      popup: "jj-swal-popup",
      title: "jj-swal-title",
      htmlContainer: "jj-swal-text",
      confirmButton: "jj-swal-confirm",
    },
  });
}

export function confirmAction({
  title,
  text,
  confirmButtonText = "Continue",
  cancelButtonText = "Cancel",
}) {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    buttonsStyling: false,
    customClass: {
      popup: "jj-swal-popup",
      title: "jj-swal-title",
      htmlContainer: "jj-swal-text",
      confirmButton: "jj-swal-confirm",
      cancelButton: "jj-swal-cancel",
    },
  });
}
