interface PasswordStrengthMeterProps {
  password: string;
}

function getStrength(password: string): {
  score: number;
  label: string;
  passes: boolean;
  checks: { label: string; met: boolean }[];
} {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (classes >= 3) score += 1;
  if (classes === 4) score += 1;

  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
  const passes = password.length >= 8 && classes >= 3;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase and lowercase letters', met: hasLower && hasUpper },
    { label: 'At least one number', met: hasDigit },
    { label: 'At least one symbol', met: hasSymbol },
  ];

  return { score, label, passes, checks };
}

const BAR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label, passes, checks } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= score ? BAR_COLORS[Math.min(score, 3)] : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span
          className={`text-xs font-medium ${
            passes ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((check) => (
          <li
            key={check.label}
            className={`flex items-center gap-1.5 text-xs ${
              check.met ? 'text-green-600 dark:text-green-400' : 'text-dark-500 dark:text-white/50'
            }`}
          >
            <span>{check.met ? '✓' : '•'}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
