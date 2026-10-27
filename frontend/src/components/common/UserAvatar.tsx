import React, { useState, useEffect } from 'react';
import { getNameInitial, getAvatarColorPalette, getAvatarUrl } from '@/utils/avatar.utils';

export interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  border?: string;
  alt?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  title?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  size = 34,
  fontSize,
  className = '',
  style = {},
  border,
  alt,
  onClick,
  title,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = getAvatarUrl(src);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const initial = getNameInitial(name);
  const palette = getAvatarColorPalette(name);
  const computedFontSize = fontSize || Math.max(10, Math.round(size * 0.42));

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
    border: border || (normalizedSrc && !hasError ? '1.5px solid var(--color-border)' : `1.5px solid ${palette.border}`),
    boxSizing: 'border-box',
    ...style,
  };

  if (normalizedSrc && !hasError) {
    return (
      <div
        className={className}
        style={containerStyle}
        onClick={onClick}
        title={title || name}
      >
        <img
          src={normalizedSrc}
          alt={alt || name}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: palette.bg,
        color: palette.text,
        fontWeight: 700,
        fontSize: computedFontSize,
        fontFamily: 'inherit',
        lineHeight: 1,
      }}
      onClick={onClick}
      title={title || name}
    >
      <span style={{ display: 'inline-block', lineHeight: 1 }}>{initial}</span>
    </div>
  );
};
