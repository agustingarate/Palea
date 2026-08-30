import {
  createApplicationStageInputSchema,
  updateApplicationStageInputSchema,
  type ApplicationStage,
  type ApplicationStageDifficulty,
  type ApplicationStageResult,
} from '@palea/contracts';

export interface ApplicationStageFormValues {
  name: string;
  eventOn: string | null;
  result: ApplicationStageResult;
  difficulty: ApplicationStageDifficulty | null;
  questions: string;
  comments: string;
}

export const emptyApplicationStageForm: ApplicationStageFormValues = {
  name: '',
  eventOn: null,
  result: 'pending',
  difficulty: null,
  questions: '',
  comments: '',
};

export function applicationStageFormFromStage(
  stage: ApplicationStage,
): ApplicationStageFormValues {
  return {
    name: stage.name,
    eventOn: stage.eventOn,
    result: stage.result,
    difficulty: stage.difficulty,
    questions: stage.questions ?? '',
    comments: stage.comments ?? '',
  };
}

export function stageValuesForResult(
  values: ApplicationStageFormValues,
  result: ApplicationStageResult,
) {
  return {
    ...values,
    result,
    difficulty:
      result === 'pending' ? null : (values.difficulty ?? ('easy' as const)),
  };
}

export function toCreateStageInput(
  applicationId: string,
  values: ApplicationStageFormValues,
) {
  return createApplicationStageInputSchema.parse({ applicationId, ...values });
}

export function toUpdateStageInput(
  applicationId: string,
  stageId: string,
  values: ApplicationStageFormValues,
) {
  return updateApplicationStageInputSchema.parse({
    applicationId,
    stageId,
    ...values,
  });
}

export function isPendingStageDue(
  stage: Pick<ApplicationStage, 'result' | 'eventOn'>,
  today = localToday(),
) {
  return (
    stage.result === 'pending' && !!stage.eventOn && stage.eventOn <= today
  );
}

export function localToday(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
