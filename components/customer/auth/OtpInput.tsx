'use client';

/**
 * components/customer/auth/OtpInput.tsx
 *
 * 6-digit OTP input with individual boxes, auto-focus, and resend button.
 * Resend button is disabled for 60 seconds after send with countdown timer.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onResend: () => Promise<void>;
  error?: string;
  disabled?: boolean;
}

const RESEND_COOLDOWN = 60; // seconds

export function OtpInput({ value, onChange, onResend, error, disabled }: OtpInputProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  // Start cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      const sanitized = char.replace(/\D/g, '').slice(-1);
      const newDigits = [...digits];
      newDigits[index] = sanitized;
      onChange(newDigits.join(''));

      // Auto-advance focus
      if (sanitized && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
          inputRefs.current[index - 1]?.focus();
        } else {
          const newDigits = [...digits];
          newDigits[index] = '';
          onChange(newDigits.join(''));
        }
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      onChange(pasted.padEnd(6, '').slice(0, 6));
      // Focus last filled box
      const lastIndex = Math.min(pasted.length, 5);
      inputRefs.current[lastIndex]?.focus();
    },
    [onChange]
  );

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN);
      onChange(''); // Clear OTP input
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* OTP boxes */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`w-11 h-12 text-center text-lg font-bold rounded-xl border bg-white/5 text-white outline-none transition-all focus:ring-2
              ${error
                ? 'border-red-500 focus:ring-red-500/30'
                : digits[i]
                ? 'border-indigo-500 focus:ring-indigo-500/30'
                : 'border-white/20 focus:ring-indigo-500/30 focus:border-indigo-500'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Resend button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || disabled}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : isResending
            ? 'Sending...'
            : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
