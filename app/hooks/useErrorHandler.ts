import { useCallback } from "react";
import { ApiError } from "../lib/api";

interface UseErrorHandlerOptions {
  showNotification?: (
    message: string,
    type: "error" | "success" | "info"
  ) => void;
  logErrors?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showNotification, logErrors = true } = options;

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      let errorMessage = "An unexpected error occurred";
      let errorCode: string | undefined;
      let statusCode: number | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;

        if ("status" in error) {
          statusCode = (error as any).status;
        }

        if ("code" in error) {
          errorCode = (error as any).code;
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Log error for debugging
      if (logErrors) {
        console.error("Error occurred:", {
          message: errorMessage,
          code: errorCode,
          status: statusCode,
          context,
          originalError: error,
        });
      }

      // Show user-friendly notification
      if (showNotification) {
        let userMessage = errorMessage;

        // Customize message based on status code
        switch (statusCode) {
          case 400:
            userMessage =
              "Invalid request. Please check your input and try again.";
            break;
          case 401:
            userMessage =
              "Authentication required. Please connect your wallet.";
            break;
          case 403:
            userMessage =
              "Access denied. You do not have permission for this action.";
            break;
          case 404:
            userMessage = "Resource not found.";
            break;
          case 429:
            userMessage =
              "Too many requests. Please wait a moment and try again.";
            break;
          case 500:
            userMessage = "Server error. Please try again later.";
            break;
          case 503:
            userMessage =
              "Service temporarily unavailable. Please try again later.";
            break;
          default:
            // Use the original error message for other cases
            break;
        }

        showNotification(userMessage, "error");
      }

      return {
        message: errorMessage,
        code: errorCode,
        status: statusCode,
      };
    },
    [showNotification, logErrors]
  );

  const handleApiError = useCallback(
    (error: ApiError, context?: string) => {
      return handleError(error, context);
    },
    [handleError]
  );

  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, context);
          return null;
        }
      };
    },
    [handleError]
  );

  const withErrorHandlingThrow = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string) => {
      return async (...args: T): Promise<R> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, context);
          throw error;
        }
      };
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
    withErrorHandling,
    withErrorHandlingThrow,
  };
};
