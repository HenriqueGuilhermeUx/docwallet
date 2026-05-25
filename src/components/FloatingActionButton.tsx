import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-90 z-30 sm:hidden"
      style={{ boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}
    >
      <Plus size={28} />
    </button>
  );
};