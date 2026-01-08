import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
};

export default function Button({ variant = 'primary', children, className = '', ...rest }: Props) {
  const base = 'btn';
  const variantCls = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  return (
    <button className={`${base} ${variantCls} ${className}`} {...rest}>
      {children}
    </button>
  );
}
