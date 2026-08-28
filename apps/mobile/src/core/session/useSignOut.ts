import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDependency } from '../di/DependenciesProvider';
import { dependencyTokens } from '../di/dependencies';

/** Clears the authenticated local session and all registered user-scoped state. */
export function useSignOut() {
  const authRepository = useDependency(dependencyTokens.authRepository);
  const cleanupRegistry = useDependency(
    dependencyTokens.sessionCleanupRegistry,
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authRepository.signOut();
      const cleanupFailures = await cleanupRegistry.clear();
      queryClient.clear();
      return { cleanupFailures };
    },
  });
}
