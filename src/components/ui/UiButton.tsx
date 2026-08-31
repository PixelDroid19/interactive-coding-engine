import React from 'react';
import { useTheme } from '../../themes/ThemeProvider';
import { buttonAugmentation, type UiButtonVariant } from './uiAugmentation';

export interface UiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UiButtonVariant;
}

export const UiButton: React.FC<UiButtonProps> = ({ variant = 'secondary', className = '', type = 'button', ...props }) => {
  const { themeId } = useTheme();
  return <button type={type} data-augmented-ui={buttonAugmentation(themeId, variant)} className={`ui-button ui-button--${variant}${className ? ` ${className}` : ''}`} {...props} />;
};
