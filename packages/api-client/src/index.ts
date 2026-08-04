import type { AppRouter } from '@palea/trpc';
import type { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, type TRPCClient } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

export interface PaleaApiClientOptions {
  url: string;
  headers?: () => Promise<Record<string, string>> | Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

export type PaleaApiClient = TRPCClient<AppRouter>;

export function createPaleaApiClient(
  options: PaleaApiClientOptions,
): PaleaApiClient {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: options.url,
        headers: options.headers,
        fetch: options.fetch,
      }),
    ],
  });
}

export function createPaleaQueryOptions(
  client: PaleaApiClient,
  queryClient: QueryClient,
) {
  return createTRPCOptionsProxy<AppRouter>({ client, queryClient });
}
