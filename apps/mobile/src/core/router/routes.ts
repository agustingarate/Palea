export const routes = {
  projects: '/',
  newApplication: '/applications/new',
  resumes: '/resumes',
  resume: (resumeId: string) => `/resumes/${resumeId}`,
  applicationDetail: (applicationId: string) =>
    `/applications/${applicationId}`,
  newApplicationStage: (applicationId: string) =>
    `/applications/${applicationId}/stages/new`,
  applicationStageDetail: (applicationId: string, stageId: string) =>
    `/applications/${applicationId}/stages/${stageId}`,
  editApplicationStage: (applicationId: string, stageId: string) =>
    `/applications/${applicationId}/stages/${stageId}/edit`,
} as const;
