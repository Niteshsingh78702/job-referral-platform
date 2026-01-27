import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Common email domain typos and their corrections
 */
const DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  gmailcom: 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmsil.com': 'gmail.com',
  'gmqil.com': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  // Hotmail typos
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotamil.com': 'hotmail.com',
  'htmail.com': 'hotmail.com',
  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlool.com': 'outlook.com',
  'outllook.com': 'outlook.com',
  // Rediffmail typos (common in India)
  'rediff.com': 'rediffmail.com',
  'redifmail.com': 'rediffmail.com',
  'redifffmail.com': 'rediffmail.com',
};

/**
 * Extracts domain from email address
 */
function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Custom decorator to validate email domains and catch common typos
 */
export function IsValidEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmailDomain',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const domain = getEmailDomain(value);
          if (!domain) return false;

          // Check if domain is a known typo
          const correction = DOMAIN_TYPOS[domain];
          if (correction) {
            return false; // Fail validation for typos
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (typeof args.value !== 'string') {
            return 'Please enter a valid email address';
          }

          const domain = getEmailDomain(args.value);
          const correction = DOMAIN_TYPOS[domain];

          if (correction) {
            return `Did you mean @${correction}? The domain "@${domain}" appears to be a typo.`;
          }

          return 'Please enter a valid email address';
        },
      },
    });
  };
}
