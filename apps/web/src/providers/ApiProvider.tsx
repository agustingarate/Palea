'use client';

import {
  createPaleaApiClient,
  createPaleaQueryOptions,
  type PaleaApiClient,
} from '@palea/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';

interface ApiContextValue {
  client: PaleaApiClient;
  trpc: ReturnType<typeof createPaleaQueryOptions>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() =>
    createPaleaApiClient({
      url: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/trpc`,
    }),
  );
  const [trpc] = useState(() => createPaleaQueryOptions(client, queryClient));
  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={{ client, trpc }}>
        {children}
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}

export function usePaleaApi(): ApiContextValue {
  const value = useContext(ApiContext);
  if (!value) throw new Error('usePaleaApi must be used inside ApiProvider');
  return value;
}
