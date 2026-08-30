import type {
  ApplicationDetail,
  ApplicationNote,
  ApplicationResource,
  ApplicationStage,
  CreateApplicationStageInput,
  UpdateApplicationStageInput,
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

export class CreateApplicationStage {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(input: CreateApplicationStageInput): Promise<ApplicationStage> {
    return this.repository.createStage(input);
  }
}

export class GetApplicationStage {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string, stageId: string): Promise<ApplicationStage> {
    return this.repository.getStage(applicationId, stageId);
  }
}

export class UpdateApplicationStage {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(input: UpdateApplicationStageInput): Promise<ApplicationStage> {
    return this.repository.updateStage(input);
  }
}

export class DeleteApplicationStage {
  constructor(private readonly repository: ApplicationRepository) {}
  execute(applicationId: string, stageId: string): Promise<void> {
    return this.repository.deleteStage(applicationId, stageId);
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
