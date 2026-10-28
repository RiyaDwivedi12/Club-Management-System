import { useState } from 'react';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

// Profile picture with an initial-letter fallback (also used when the image fails to load).
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZES[size] || SIZES.md;
  // 'default.jpg' and '/default…' paths are placeholders, not uploaded pictures.
  const hasPicture = user?.profilePicture && user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('/default');
  if (hasPicture && !failed) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white border border-blue-100 shrink-0 ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 ${className}`}>
      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
    </div>
  );
};

export default UserAvatar;
