/* eslint-disable @typescript-eslint/no-magic-numbers -- Disabling magic numbers rule for HTTP status code enum as these are industry-standard values */
export enum StatusCodes {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
