import axios, { type AxiosError, type AxiosInstance, type Method } from 'axios';
import type { ZodType } from 'zod';

export interface HttpRequest<TBody = unknown> {
  method: Method;
  path: string;
  body?: TBody;
  headers?: Readonly<Record<string, string>>;
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
  signal?: AbortSignal;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Readonly<Record<string, string>>;
}

export type HttpErrorCode =
  | 'cancelled'
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'server'
  | 'invalid-response';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly code: HttpErrorCode,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'HttpError';
  }
}

export interface HttpClient {
  request<T>(
    request: HttpRequest,
    responseSchema: ZodType<T>,
  ): Promise<HttpResponse<T>>;
}

export interface AxiosHttpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  defaultHeaders?: Readonly<Record<string, string>>;
  axiosInstance?: AxiosInstance;
}

export class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  constructor(options: AxiosHttpClientOptions) {
    this.instance =
      options.axiosInstance ??
      axios.create({
        baseURL: options.baseUrl,
        timeout: options.timeoutMs ?? 10_000,
        headers: options.defaultHeaders,
      });
  }

  async request<T>(
    request: HttpRequest,
    responseSchema: ZodType<T>,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.instance.request({
        method: request.method,
        url: request.path,
        data: request.body,
        params: request.query,
        headers: request.headers,
        signal: request.signal,
      });
      const parsed = responseSchema.safeParse(response.data);
      if (!parsed.success) {
        throw new HttpError(
          'The server returned an invalid response',
          'invalid-response',
          response.status,
          {
            cause: parsed.error,
          },
        );
      }
      return {
        data: parsed.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw normalizeAxiosError(error);
    }
  }
}

function normalizeAxiosError(error: unknown): HttpError {
  if (!axios.isAxiosError(error))
    return new HttpError('Unexpected HTTP failure', 'network', undefined, {
      cause: error,
    });
  const axiosError = error as AxiosError;
  if (axiosError.code === 'ERR_CANCELED')
    return new HttpError('Request cancelled', 'cancelled', undefined, {
      cause: error,
    });
  if (axiosError.code === 'ECONNABORTED')
    return new HttpError('Request timed out', 'timeout', undefined, {
      cause: error,
    });
  const status = axiosError.response?.status;
  if (status === 401 || status === 403)
    return new HttpError('Request is not authorized', 'unauthorized', status, {
      cause: error,
    });
  if (status && status >= 500)
    return new HttpError('Remote service failed', 'server', status, {
      cause: error,
    });
  return new HttpError('Network request failed', 'network', status, {
    cause: error,
  });
}
