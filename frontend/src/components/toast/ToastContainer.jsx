import { useToast } from '../../context/ToastContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
