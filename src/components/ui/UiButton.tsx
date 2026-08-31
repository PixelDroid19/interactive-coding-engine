import React from 'react';

type UiButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'icon';

export interface UiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UiButtonVariant;
}

export const UiButton: React.FC<UiButtonProps> = ({ variant = 'secondary', className = '', type = 'button', ...props }) => (
  <button type={type} className={`ui-button ui-button--${variant}${className ? ` ${className}` : ''}`} {...props} />
);
