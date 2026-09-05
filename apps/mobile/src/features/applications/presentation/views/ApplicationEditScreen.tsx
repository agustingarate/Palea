import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CollectionFeedback, Screen } from '@palea/ui-native';
import { currencyCatalog, type ApplicationDetail } from '@palea/contracts';
import { PostAuthRouteGuard } from '@/features/auth/presentation/components/PostAuthRouteGuard';
import { useLocale } from '@/core/localization/LocaleProvider';
import {
  applicationCreateDefaults,
  minorToMajor,
  toUpdateApplicationInput,
  type ApplicationCreateFormValues,
} from '../create/applicationCreateModel';
import { ApplicationCreateForm } from '../create/ApplicationCreateForm';
import { useApplicationEditViewModel } from '../edit/useApplicationEditViewModel';

export function ApplicationEditScreen() {
  return (
    <PostAuthRouteGuard>
      <ApplicationEditContent />
    </PostAuthRouteGuard>
  );
}

function ApplicationEditContent() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const router = useRouter();
  const { t } = useLocale('applications');
  const vm = useApplicationEditViewModel(applicationId ?? '');
  const initialValues = useMemo(
    () => (vm.detail.data ? toFormValues(vm.detail.data) : null),
    [vm.detail.data],
  );

  if (!applicationId || (vm.detail.isError && !vm.detail.data)) {
    return (
      <Screen>
        <CollectionFeedback
          status="error"
          title={t('detail.notFound')}
          message={t('error.load')}
          actionLabel={t('detail.back')}
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }
  if (!initialValues) {
    return (
      <Screen>
        <CollectionFeedback status="loading" rows={5} />
      </Screen>
    );
  }
  return (
    <ApplicationCreateForm
      mode="edit"
      initialValues={initialValues}
      onSave={async (values) => {
        await vm.update.mutateAsync(
          toUpdateApplicationInput(applicationId, values),
        );
      }}
      pending={vm.update.isPending}
      onComplete={() => router.replace(`/applications/${applicationId}`)}
      onCancel={() => router.replace(`/applications/${applicationId}`)}
    />
  );
}

function toFormValues(
  application: ApplicationDetail,
): ApplicationCreateFormValues {
  const compensation = (kind: 'expected' | 'offered') => {
    const value = application.compensations.find((item) => item.kind === kind);
    const exponent =
      currencyCatalog.find((currency) => currency.code === value?.currency)
        ?.exponent ?? 2;
    return {
      minimum: minorToMajor(value?.minimumMinor ?? null, exponent),
      maximum: minorToMajor(value?.maximumMinor ?? null, exponent),
      currency: value?.currency ?? 'USD',
      period: value?.period ?? 'month',
    };
  };
  const expected = compensation('expected');
  const offered = compensation('offered');
  return {
    ...applicationCreateDefaults,
    companyName: application.companyName,
    role: application.role,
    appliedOn: application.appliedOn,
    url: application.url ?? '',
    location: application.location ?? '',
    schedule: application.schedule ?? '',
    jobDescriptionHtml: application.descriptionHtml ?? '',
    workMode: application.workMode,
    commitment: application.commitment,
    contractType: application.contractType,
    durationType: application.durationType,
    resumeId: application.resume?.id ?? null,
    expectedMinimum: expected.minimum,
    expectedMaximum: expected.maximum,
    expectedCurrency: expected.currency,
    expectedPeriod: expected.period,
    offeredMinimum: offered.minimum,
    offeredMaximum: offered.maximum,
    offeredCurrency: offered.currency,
    offeredPeriod: offered.period,
  };
}
