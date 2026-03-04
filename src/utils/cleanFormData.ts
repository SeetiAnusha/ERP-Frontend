/**
 * Utility function to clean form data before sending to API
 * Converts empty strings to null for better database compatibility
 * 
 * @param data - The form data object to clean
 * @param integerFields - Array of field names that should be converted to integers
 * @returns Cleaned data object with empty strings converted to null
 * 
 * @example
 * const cleanedData = cleanFormData(formData, ['supplierId', 'bankAccountId', 'cardId']);
 */
export const cleanFormData = (
  data: Record<string, any>,
  integerFields: string[] = []
): Record<string, any> => {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Handle integer fields
    if (integerFields.includes(key)) {
      // Convert to integer if value exists, otherwise null
      cleaned[key] = value && value !== '' ? parseInt(value as string, 10) : null;
    }
    // Handle other fields
    else {
      // Convert empty strings to null, keep other values as-is
      cleaned[key] = value === '' ? null : value;
    }
  }

  return cleaned;
};

/**
 * Validates that required fields are not empty
 * 
 * @param data - The form data to validate
 * @param requiredFields - Array of field names that are required
 * @returns Object with isValid boolean and error message if invalid
 * 
 * @example
 * const validation = validateRequiredFields(formData, ['supplierId', 'date']);
 * if (!validation.isValid) {
 *   alert(validation.error);
 *   return;
 * }
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; error?: string } => {
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      return {
        isValid: false,
        error: `${field} is required`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Converts array of objects to clean format
 * Useful for nested data like purchase items or associated invoices
 * 
 * @param items - Array of objects to clean
 * @param integerFields - Array of field names that should be integers
 * @returns Cleaned array
 */
export const cleanArrayData = (
  items: Record<string, any>[],
  integerFields: string[] = []
): Record<string, any>[] => {
  return items.map(item => cleanFormData(item, integerFields));
};
