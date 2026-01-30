import { toast as sonnerToast } from 'vue-sonner'

export const useToast = () => {
  return {
    toast: sonnerToast
  }
}

export { sonnerToast as toast }
