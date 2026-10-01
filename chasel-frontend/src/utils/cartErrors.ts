import axios from 'axios';

/**
 * Turns a failed add-to-cart into something a shopper can act on: the API's
 * own reason (e.g. "Only 2 available") when it gave one, else a generic line.
 */
export const cartErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; detail?: string } | undefined;
    const reason = data?.detail ?? data?.message;
    if (reason) return reason;
  } else if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Could not add this piece to your cart.';
};
