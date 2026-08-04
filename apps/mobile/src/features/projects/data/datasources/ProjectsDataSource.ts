export interface ProjectsDataSource {
  list(signal?: AbortSignal): Promise<unknown>;
}
