'use client';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        fixed top-4 z-50
        w-12 h-12 rounded-xl
        bg-[var(--bg-card)] border border-[var(--border-color)]
        flex items-center justify-center
        hover:bg-[var(--bg-secondary)] transition-all duration-200
        shadow-lg
      `}
      style={{
        left: isOpen ? '296px' : '16px',
        transition: 'left 0.3s ease-in-out'
      }}
      aria-label={isOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
    >
      <div className="relative w-6 h-6">
        <span
          className={`
            absolute top-0 left-0 w-6 h-0.5 bg-white
            transition-all duration-300
            ${isOpen ? 'rotate-45 top-2.5' : ''}
          `}
        />
        <span
          className={`
            absolute top-2.5 left-0 w-6 h-0.5 bg-white
            transition-all duration-300
            ${isOpen ? 'opacity-0' : 'opacity-100'}
          `}
        />
        <span
          className={`
            absolute top-5 left-0 w-6 h-0.5 bg-white
            transition-all duration-300
            ${isOpen ? '-rotate-45 top-2.5' : ''}
          `}
        />
      </div>
    </button>
  );
}
