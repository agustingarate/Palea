import type { useProfileRoleViewModel } from '../viewmodels/useProfileRoleViewModel';

export type ReturnTypeUseProfileRoleViewModel = ReturnType<
  typeof useProfileRoleViewModel
> & {
  search: string;
};
