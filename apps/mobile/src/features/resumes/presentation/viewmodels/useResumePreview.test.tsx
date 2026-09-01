import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useResumePreview } from './useResumePreview';

const mockRepository = { createPreview: jest.fn(), createDownload: jest.fn() };
jest.mock('@/core/di/DependenciesProvider', () => ({
  useDependency: () => mockRepository,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRepository.createPreview.mockResolvedValue({
    signedUrl: 'https://example.invalid/pdf',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

it('does not request PDF access or download before explicit selection', async () => {
  const { result, rerender } = renderHook(
    ({ id }: { id: string | null }) => useResumePreview(id),
    { initialProps: { id: null }, wrapper },
  );
  expect(mockRepository.createPreview).not.toHaveBeenCalled();
  expect(result.current.access.fetchStatus).toBe('idle');
  rerender({ id: 'selected-resume' });
  await waitFor(() => expect(result.current.access.isSuccess).toBe(true));
  expect(mockRepository.createPreview).toHaveBeenCalledTimes(1);
  expect(mockRepository.createDownload).not.toHaveBeenCalled();
  rerender({ id: null });
  expect(result.current.access.fetchStatus).toBe('idle');
});

it('renews a failed expired access but does not loop on failures with a fresh URL', async () => {
  mockRepository.createPreview.mockResolvedValueOnce({
    signedUrl: 'https://example.invalid/expired',
    expiresAt: new Date(0).toISOString(),
  });
  const { result } = renderHook(() => useResumePreview('selected-resume'), {
    wrapper,
  });
  await waitFor(() => expect(result.current.access.isSuccess).toBe(true));
  act(() => result.current.recoverAccess());
  await waitFor(() =>
    expect(result.current.access.data?.signedUrl).toBe(
      'https://example.invalid/pdf',
    ),
  );
  act(() => result.current.recoverAccess());
  expect(mockRepository.createPreview).toHaveBeenCalledTimes(2);
});

it('uses a temporary web download link only after the user requests it', async () => {
  const link = {
    href: '',
    download: '',
    rel: '',
    click: jest.fn(),
    remove: jest.fn(),
  };
  const append = jest.fn();
  const originalPlatformOs = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const originalDocument = Object.getOwnPropertyDescriptor(global, 'document');
  const createElement = jest.fn().mockReturnValue(link);
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  Object.defineProperty(global, 'document', {
    configurable: true,
    value: { createElement, body: { append } },
  });
  try {
    mockRepository.createDownload.mockResolvedValue(
      'https://example.invalid/download',
    );
    const { result, unmount } = renderHook(
      () => useResumePreview('selected-resume'),
      {
        wrapper,
      },
    );
    await waitFor(() => expect(result.current.access.isSuccess).toBe(true));
    await act(async () => {
      await result.current.download.mutateAsync('selected-resume');
    });

    expect(mockRepository.createDownload).toHaveBeenCalledWith(
      'selected-resume',
    );
    expect(createElement).toHaveBeenCalledWith('a');
    expect(link).toMatchObject({
      href: 'https://example.invalid/download',
      download: '',
      rel: 'noopener noreferrer',
    });
    expect(append).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(link.remove).toHaveBeenCalledTimes(1);
    await act(async () => unmount());
  } finally {
    if (originalPlatformOs)
      Object.defineProperty(Platform, 'OS', originalPlatformOs);
    if (originalDocument)
      Object.defineProperty(global, 'document', originalDocument);
    else Reflect.deleteProperty(global, 'document');
  }
});
