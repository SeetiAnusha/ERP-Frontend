/**
 * useConfirm Hook
 * 
 * Makes it easy to use ConfirmDialog in any component
 * 
 * Usage:
 * ```typescript
 * const { confirm, dialogProps } = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     confirmText: 'Delete',
 *     variant: 'danger'
 *   });
 *   
 *   if (confirmed) {
 *     // Do the delete
 *   }
 * };
 * 
 * // In your JSX:
 * <ConfirmDialog {...dialogProps} />
 * ```
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
      setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
      setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }
  }, [state.resolve]);

  return {
    confirm,
    dialogProps: {
      isOpen: state.isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: state.title,
      message: state.message,
      confirmText: state.confirmText,
      cancelText: state.cancelText,
      variant: state.variant,
    },
  };
};
