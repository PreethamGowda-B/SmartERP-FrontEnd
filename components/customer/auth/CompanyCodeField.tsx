'use client';

/**
 * components/customer/auth/CompanyCodeField.tsx
 *
 * Company code input with real-time validation animation.
 * On blur (≥4 chars): calls GET /api/customer/validate-company?code=XXX
 * Shows: loading spinner → green checkmark (valid) or red X (invalid)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import customerApi from '@/lib/customerApi';
import type { CompanyValidationResult } from '@/lib/customerTypes';

interface CompanyCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidated?: (result: CompanyValidationResult) => void;
  error?: string;
  disabled?: boolean;
}

type ValidationState = 'idle' | 'loading' | 'valid' | 'invalid';

export function CompanyCodeField({
  value,
  onChange,
  onValidated,
  error,
  disabled,
}: CompanyCodeFieldProps) {
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [companyName, setCompanyName] = useState<string | null>(null);

  const validate = useCallback(async (code: string) => {
    if (code.length < 4) {
      setValidationState('idle');
      setCompanyName(null);
      return;
    }

    setValidationState('loading');
    setCompanyName(null);

    try {
      const res = await customerApi.get<CompanyValidationResult>(
        `/api/customer/validate-company?code=${encodeURIComponent(code)}`
      );
      const result = res.data;

      if (result.valid) {
        setValidationState('valid');
        setCompanyName(result.companyName || null);
        onValidated?.(result);
      } else {
        setValidationState('invalid');
        onValidated?.({ valid: false });
      }
    } catch {
      setValidationState('invalid');
      onValidated?.({ valid: false });
    }
  }, [onValidated]);

  return (
    <div className="space-y-1">
      <div className="relative">
        <div className="relative">
          <label htmlFor="company_code" className="block text-sm font-medium text-gray-700 mb-2">
            Company code
          </label>
          <div className="relative">
            <input
              type="text"
              id="company_code"
              value={value}
              onChange={(e) => {
                onChange(e.target.value.toUpperCase());
                setValidationState('idle');
                setCompanyName(null);
              }}
              onBlur={() => validate(value)}
              disabled={disabled}
              placeholder="e.g. ACME2024"
              className={`w-full pr-10 pl-4 py-2.5 text-sm text-gray-900 bg-white border rounded-lg outline-none transition-all
                focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
                ${error || validationState === 'invalid'
                  ? 'border-red-400 focus:ring-red-500'
                  : validationState === 'valid'
                  ? 'border-green-400 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }`}
            />

            {/* Validation icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {validationState === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  </motion.div>
                )}
                {validationState === 'valid' && (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </motion.div>
                )}
                {validationState === 'invalid' && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Company name / error display */}
          <AnimatePresence>
            {validationState === 'valid' && companyName && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 text-xs text-green-600 flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                {companyName}
              </motion.p>
            )}
            {(validationState === 'invalid' || error) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 text-xs text-red-600"
              >
                {error || 'Invalid company code. Please check with your service provider.'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
