import { toast } from "sonner";

type ToastMessage = {
  title: string;
  description?: string;
};

const baseOptions = {
  duration: 3500,
};

export const appToast = {
  success({ title, description }: ToastMessage) {
    toast.success(title, {
      description,
      ...baseOptions,
    });
  },

  error({ title, description }: ToastMessage) {
    toast.error(title, {
      description,
      ...baseOptions,
    });
  },

  message({ title, description }: ToastMessage) {
    toast.message(title, {
      description,
      ...baseOptions,
    });
  },

  loading({ title, description }: ToastMessage) {
    return toast.loading(title, {
      description,
      ...baseOptions,
    });
  },

  dismiss(id?: string | number) {
    toast.dismiss(id);
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: ToastMessage;
      success: ToastMessage;
      error: ToastMessage;
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading.title,
      success: messages.success.title,
      error: messages.error.title,
    });
  },
};