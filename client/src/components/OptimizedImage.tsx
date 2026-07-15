import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  cloudinaryWidth?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  cloudinaryWidth,
  className = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Apply Cloudinary or fallback transforms if applicable
  let finalSrc = src;
  if (src.includes('cloudinary.com') && cloudinaryWidth) {
    // Basic Cloudinary width insertion transformation
    finalSrc = src.replace('/upload/', `/upload/w_${cloudinaryWidth},f_auto,q_auto/`);
  }

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {/* Blur placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-white/5 backdrop-blur-md animate-pulse" />
      )}
      
      <img
        src={error ? fallbackSrc : finalSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-all duration-500 ease-out object-cover ${
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-md'
        } ${className}`}
        style={{ contentVisibility: 'auto' }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
