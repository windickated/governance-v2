import { writable } from 'svelte/store';

type ToastType = 'info' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (
      message: string,
      type: ToastType = 'info',
      duration: number = 10000,
    ) => {
      const id = Date.now();
      update((toasts) => [...toasts, { id, message, type, duration }]);

      setTimeout(() => {
        update((toasts) => toasts.filter((toast) => toast.id !== id));
      }, duration);
    },
    close: (id: number) => {
      update((toasts) => toasts.filter((toast) => toast.id !== id));
    },
  };
}

export const toastStore = createToastStore();
