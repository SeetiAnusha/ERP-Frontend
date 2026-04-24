import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  const reset = useCallback((newInitialValues?: T) => {
    setValues(newInitialValues || initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // ✅ CRITICAL: Prevent duplicate submissions
    if (isSubmitting) {
      console.warn('⚠️ Form submission already in progress, ignoring duplicate click');
      return;
    }

    // Validate if validator provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      // ✅ IMPORTANT: Keep isSubmitting=true until mutation completes
      // The onSubmit callback will handle resetting via onSuccess/onError
    } catch (error) {
      console.error('Form submission error:', error);
      // ✅ CRITICAL: Reset isSubmitting on synchronous errors only
      setIsSubmitting(false);
    }
    // ✅ REMOVED: finally block that resets isSubmitting too early
    // Forms must manually reset via salesForm.reset() or updateSubmitting(false)
  }, [values, validate, onSubmit, isSubmitting]);

  // ✅ NEW: Manual control over isSubmitting for async mutations
  const updateSubmitting = useCallback((value: boolean) => {
    setIsSubmitting(value);
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setValues: updateValues,
    updateSubmitting,
    reset,
    handleSubmit
  };
}