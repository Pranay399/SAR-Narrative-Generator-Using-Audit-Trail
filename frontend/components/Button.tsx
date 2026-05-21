'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    children?: ReactNode;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    className?: string;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
        primary: 'bg-[#0058bc] text-white shadow-lg shadow-[#0058bc]/20 hover:bg-[#004ca3] focus:ring-[#0058bc]/40',
        secondary: 'bg-[#f6f3f5] text-[#1b1b1d] hover:bg-[#e4e2e4] focus:ring-zinc-400/20',
        outline: 'border border-[#c1c6d7]/30 bg-transparent text-[#414755] hover:bg-[#f6f3f5] focus:ring-zinc-400/20',
        ghost: 'bg-transparent text-[#414755] hover:bg-[#f6f3f5] focus:ring-zinc-400/20',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-400/20',
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
        icon: 'p-2',
    };

    return (
        <motion.button
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 88, 188, 0.1), 0 8px 10px -6px rgba(0, 88, 188, 0.1)' }}
            whileTap={{ scale: 0.97, y: 0 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </motion.button>
    );
}
