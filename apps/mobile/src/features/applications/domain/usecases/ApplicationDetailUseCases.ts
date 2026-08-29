import type {
  ApplicationDetail,
  ApplicationNote,
  ApplicationResource,
  ApplicationStage,
} from '../entities/Application';
import type { ApplicationRepository } from '../repositories/ApplicationRepository';

export class GetApplicationDetail {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string): Promise<ApplicationDetail> {
    return this.repository.get(applicationId);
  }
}

export class ListApplicationStages {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string): Promise<ApplicationStage[]> {
    return this.repository.listStages(applicationId);
  }
}

export class GetApplicationNote {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string): Promise<ApplicationNote | null> {
    return this.repository.getNote(applicationId);
  }
}

export class ListApplicationResources {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string): Promise<ApplicationResource[]> {
    return this.repository.listResources(applicationId);
  }
}

export class UpdateApplicationResume {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string, resumeId: string | null): Promise<void> {
    return this.repository.updateResume(applicationId, resumeId);
  }
}
