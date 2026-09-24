interface BookmarkIconProps {
  className?: string;
  /**
   * `filled` (default) is the saved-state mark used on listing cards.
   * `outline` is the navigation affordance used in the navbar.
   */
  variant?: 'filled' | 'outline';
}

function BookmarkIcon({ className, variant = 'filled' }: BookmarkIconProps) {
  const outlineProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={className}
      aria-hidden="true"
      {...(variant === 'outline' ? outlineProps : { fill: 'currentColor' })}
    >
      <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
    </svg>
  );
}

export default BookmarkIcon;
