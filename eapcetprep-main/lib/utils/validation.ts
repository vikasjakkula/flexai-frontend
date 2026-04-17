// Validation utilities for API requests

export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing: string[] = [];
  
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(String(field));
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Indian phone number validation (10 digits, optionally with country code)
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateTestId(testId: number): boolean {
  return Number.isInteger(testId) && testId > 0;
}

export function validateQuestionNumber(questionNumber: number): boolean {
  return Number.isInteger(questionNumber) && 
         questionNumber >= 1 && 
         questionNumber <= 160;
}

export function validateAnswerOption(option: string): boolean {
  return ['A', 'B', 'C', 'D', 'E', 'F'].includes(option.toUpperCase());
}

export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

