import React, { useState } from 'react';
import { ImageOff, Info } from 'lucide-react';

export interface AgriImageProps {
  /** Image name matching public/images/agriculture/{name}.webp and .jpg */
  name: string;
  /** Meaningful descriptive alt text for accessibility */
  alt: string;
  /** Optional caption displayed below the image */
  caption?: string;
  /** Whether this is an illustrative representation (displays subtle badge to prevent facility confusion) */
  isIllustrative?: boolean;
  /** Badge text override for illustrative label */
  illustrativeLabel?: string;
  /** Tailwind aspect ratio class, e.g. aspect-[16/9], aspect-[4/3], or h-48 */
  aspectRatio?: string;
  /** Additional classes for container */
  className?: string;
  /** Object fit style (cover by default) */
  objectFit?: 'cover' | 'contain';
  /** Priority loading for above-the-fold hero images */
  priority?: boolean;
}

export const AgriImage: React.FC<AgriImageProps> = ({
  name,
  alt,
  caption,
  isIllustrative = false,
  illustrativeLabel = 'प्रात्यक्षिक छायाचित्र (Illustrative)',
  aspectRatio = 'aspect-[16/9]',
  className = '',
  objectFit = 'cover',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const basePath = `/images/agriculture/${name}`;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`w-full ${aspectRatio} rounded-2xl neo-inset bg-[#E0E6DF] flex flex-col items-center justify-center p-4 text-center text-[#69776D] ${className}`}
      >
        <ImageOff className="w-8 h-8 text-[#52785B]/60 mb-2" />
        <span className="text-xs font-semibold text-[#304C38]">{alt}</span>
        {caption && <span className="text-[11px] text-[#69776D] mt-1">{caption}</span>}
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div className={`relative w-full ${aspectRatio} overflow-hidden rounded-2xl bg-[#DCE4DB]`}>
        <picture>
          <source srcSet={`${basePath}.webp`} type="image/webp" />
          <img
            src={`${basePath}.jpg`}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            // @ts-expect-error React 19 fetchPriority
            fetchpriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full transition-opacity duration-300 ${
              objectFit === 'cover' ? 'object-cover' : 'object-contain'
            } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </picture>

        {/* Subtle illustrative badge to distinguish from specific verified facility */}
        {isIllustrative && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1 shadow-sm pointer-events-none">
            <Info className="w-3 h-3 text-[#A9C3AC]" />
            <span>{illustrativeLabel}</span>
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="text-[11px] text-[#69776D] mt-1.5 px-1 italic flex items-center justify-between">
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
};
