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
        fixed top-5 z-50
        w-10 h-10 rounded-lg
        bg-[var(--bg-card)] border border-[var(--border-color)]
        flex items-center justify-center
        hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)]
        transition-all duration-150
      `}
      style={{
        left: isOpen ? '276px' : '16px',
        transition: 'left 0.3s ease-out, background-color 0.15s, border-color 0.15s'
      }}
      aria-label={isOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <span
          className={`
            absolute w-4 h-[1.5px] bg-[var(--text-secondary)]
            transition-all duration-200
            ${isOpen ? 'rotate-45' : '-translate-y-1.5'}
          `}
        />
        <span
          className={`
            absolute w-4 h-[1.5px] bg-[var(--text-secondary)]
            transition-all duration-200
            ${isOpen ? 'opacity-0' : 'opacity-100'}
          `}
        />
        <span
          className={`
            absolute w-4 h-[1.5px] bg-[var(--text-secondary)]
            transition-all duration-200
            ${isOpen ? '-rotate-45' : 'translate-y-1.5'}
          `}
        />
      </div>
    </button>
  );
}
