interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const bgColor = {
    success: 'bg-secondary',
    error: 'bg-red-500',
    info: 'bg-primary',
  }[type];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-lg font-medium`}>
        {message}
      </div>
    </div>
  );
};