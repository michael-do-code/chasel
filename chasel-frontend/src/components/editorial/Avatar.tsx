import './Avatar.css';

interface AvatarProps {
  /** Display name; the first letter becomes the monogram. */
  name: string;
  /** Shows the rust presence dot when true. */
  online?: boolean;
  size?: 'sm' | 'md';
}

/** Ink disc with a serif monogram, used wherever a person is represented. */
function Avatar({ name, online = false, size = 'md' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`ed-avatar ed-avatar-${size}`}>
      <span aria-hidden="true">{initial}</span>
      {online && <span className="ed-avatar-presence" title="Online now" />}
    </span>
  );
}

export default Avatar;
