import { ref } from 'vue'

export interface ToastMessage {
  text: string
  color?: 'success' | 'error' | 'info' | 'warning'
  timeout?: number
}

const toast = ref<ToastMessage | null>(null)
let timeoutId: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(message: string, color: ToastMessage['color'] = 'info', timeout = 3000) {
    if (timeoutId) clearTimeout(timeoutId)
    toast.value = { text: message, color, timeout }
    timeoutId = setTimeout(() => {
      toast.value = null
      timeoutId = null
    }, timeout)
  }

  function success(message: string) {
    show(message, 'success')
  }

  function error(message: string) {
    show(message, 'error', 5000)
  }

  function info(message: string) {
    show(message, 'info')
  }

  function warning(message: string) {
    show(message, 'warning', 4000)
  }

  function clear() {
    if (timeoutId) clearTimeout(timeoutId)
    toast.value = null
    timeoutId = null
  }

  return { toast, show, success, error, info, warning, clear }
}
