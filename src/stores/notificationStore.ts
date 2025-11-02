import { notification } from 'antd'

// Helper hook for convenience - now uses Ant Design notification directly
export const useToast = () => {
  return {
    success: (message: string, title?: string) => {
      notification.success({
        message: title || 'Success',
        description: message,
        placement: 'topRight',
        duration: 4.5,
      })
    },
    error: (message: string, title?: string) => {
      notification.error({
        message: title || 'Error',
        description: message,
        placement: 'topRight',
        duration: 4.5,
      })
    },
    info: (message: string, title?: string) => {
      notification.info({
        message: title || 'Info',
        description: message,
        placement: 'topRight',
        duration: 4.5,
      })
    },
    warning: (message: string, title?: string) => {
      notification.warning({
        message: title || 'Warning',
        description: message,
        placement: 'topRight',
        duration: 4.5,
      })
    },
  }
}
