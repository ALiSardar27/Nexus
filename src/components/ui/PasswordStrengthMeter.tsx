import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Number', test: (pw) => /\d/.test(pw) },
  { label: 'Special character (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-green-500',
];
const STRENGTH_TEXT_COLORS = [
  'text-red-600',
  'text-orange-600',
  'text-amber-600',
  'text-blue-600',
  'text-green-600',
];

export const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  const results = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );

  const score = results.filter((r) => r.passed).length;
  const strengthIdx = Math.max(0, score - 1);

  if (!password) return null;

  return (
    <div className="space-y-2.5 mt-2">
      {/* Bar */}
      <div className="flex gap-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? STRENGTH_COLORS[strengthIdx] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${STRENGTH_TEXT_COLORS[strengthIdx]}`}>
          {STRENGTH_LABELS[strengthIdx]}
        </span>
        <span className="text-xs text-gray-400">{score}/{RULES.length} rules</span>
      </div>

      {/* Rules checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {results.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            {r.passed ? (
              <Check size={12} className="text-green-500 shrink-0" />
            ) : (
              <X size={12} className="text-gray-300 shrink-0" />
            )}
            <span
              className={`text-[11px] ${
                r.passed ? 'text-green-700' : 'text-gray-400'
              }`}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
