import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'An error occurred. Please try again.'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    // Try to get message from response data (API format)
    errMsg =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      errMsg
  } else if (error && typeof error === 'object' && 'message' in error) {
    errMsg = String(error.message)
  }

  toast.error(errMsg)
}
