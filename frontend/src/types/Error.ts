export const isFetchBaseQueryErrorType = (
  error: any,
): error is FetchBaseQueryErrorType => {
  if (error) {
    return "data" in error;
  } else {
    return false;
  }
};

interface FetchBaseQueryErrorType {
  data: {
    error: string;
  };
}
