type Toast = {
  id: string;
  message: string;
  confirmLabel: string;
};

type ToastStackProps = {
  toasts: Toast[];
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
};

export default function ToastStack({ toasts, onConfirm, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span>{toast.message}</span>
          <div className="toast-actions">
            <button className="ghost" onClick={() => onDismiss(toast.id)} type="button">
              Cancel
            </button>
            <button className="primary" onClick={() => onConfirm(toast.id)} type="button">
              {toast.confirmLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
