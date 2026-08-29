export const routes = {
  projects: '/',
  newApplication: '/applications/new',
  applicationDetail: (applicationId: string) =>
    `/applications/${applicationId}`,
} as const;
