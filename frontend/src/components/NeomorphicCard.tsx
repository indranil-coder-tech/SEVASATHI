import React from 'react';

interface NeomorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'raised' | 'inset' | 'flat';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const NeomorphicCard: React.FC<NeomorphicCardProps> = React.memo(({
  children,
  className = '',
  variant = 'raised',
  hoverEffect = false,
  onClick,
}) => {
  let baseStyle = 'p-5 md:p-6 transition-all duration-200';

  if (variant === 'raised') {
    baseStyle += ' neo-card';
  } else if (variant === 'inset') {
    baseStyle += ' neo-inset';
  } else {
    baseStyle += ' bg-[#E9EEE8] rounded-2xl';
  }

  if (hoverEffect) {
    baseStyle += ' hover:-translate-y-1 hover:shadow-lg cursor-pointer';
  }

  return (
    <div className={`${baseStyle} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
});
