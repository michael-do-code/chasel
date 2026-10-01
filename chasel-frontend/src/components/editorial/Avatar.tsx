import './Avatar.css';

interface AvatarProps {
  /** Display name; the first letter becomes the monogram. */
  name: string;
  /** Profile photo; falls back to the monogram when absent. */
  imageUrl?: string | null;
  /** Shows the rust presence dot when true. */
  online?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/** Ink disc with a serif monogram, used wherever a person is represented. */
function Avatar({ name, imageUrl, online = false, size = 'md' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`ed-avatar ed-avatar-${size}`}>
      {imageUrl ? (
        <img className="ed-avatar-image" src={imageUrl} alt="" />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
      {online && <span className="ed-avatar-presence" title="Online now" />}
    </span>
  );
}

export default Avatar;
