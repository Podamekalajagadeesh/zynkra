import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'strongPassword', async: false })
export class PasswordStrengthValidator implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const classes = [
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^a-zA-Z0-9]/.test(value),
    ].filter(Boolean).length;
    return value.length >= 8 && classes >= 3;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Password must be at least 8 characters and include at least 3 of: lowercase, uppercase, number, symbol';
  }
}
