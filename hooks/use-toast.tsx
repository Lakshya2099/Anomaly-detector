// hooks/use-toast.ts
import { useSonnerToast } from "sonner"

export const useToast = () => {
  const toast = useSonnerToast()
  return toast
}
