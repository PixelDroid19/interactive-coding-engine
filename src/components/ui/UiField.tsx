import React, { useId } from 'react';

interface UiFieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.TextareaHTMLAttributes<HTMLTextAreaElement> | React.SelectHTMLAttributes<HTMLSelectElement>>;
}

export const UiField: React.FC<UiFieldProps> = ({ label, hint, error, className = '', children }) => {
  const generatedId = useId();
  const controlId = children.props.id || `ui-field-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`ui-field${error ? ' ui-field--error' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={controlId}>{label}</label>
      {React.cloneElement(children, { id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && <small id={hintId}>{hint}</small>}
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  );
};
