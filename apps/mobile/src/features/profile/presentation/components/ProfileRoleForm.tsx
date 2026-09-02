import { useMemo } from 'react';
import { View } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { updateProfileRoleInputSchema } from '@palea/contracts';
import {
  AppText,
  Button,
  Chip,
  CollectionFeedback,
  SearchField,
  TextField,
  useResponsiveLayout,
} from '@palea/ui-native';
import type { TFunction } from 'i18next';
import { useSnackbar } from '@palea/ui-native';
import type {
  ExperienceBand,
  ProfileCatalogItem,
  ProfileRole,
} from '../../domain/entities/Profile';
import type { ReturnTypeUseProfileRoleViewModel } from './profileRoleViewModel.types';

const bandKey: Record<
  ExperienceBand,
  'bandZeroToOne' | 'bandTwoToFour' | 'bandFiveToEight' | 'bandOverEight'
> = {
  zero_to_one: 'bandZeroToOne',
  two_to_four: 'bandTwoToFour',
  five_to_eight: 'bandFiveToEight',
  over_eight: 'bandOverEight',
};

export function ProfileRoleForm({
  role,
  viewModel,
  t,
  onSearchChange,
}: {
  role: ProfileRole;
  viewModel: ReturnTypeUseProfileRoleViewModel;
  t: TFunction<'profile'>;
  onSearchChange: (value: string) => void;
}) {
  const { showSnackbar } = useSnackbar();
  const layout = useResponsiveLayout();
  const webFieldWidth = layout.isWeb ? { maxWidth: 540 } : undefined;
  const interests = useMemo(
    () => mergeInterests(role.interests, viewModel.interests),
    [role.interests, viewModel.interests],
  );
  const form = useForm({
    defaultValues: {
      roleDescription: role.description ?? '',
      experienceBand: role.experienceBand ?? ('zero_to_one' as ExperienceBand),
      interestIds: role.interests.map((interest) => interest.id),
    },
    validators: { onSubmit: updateProfileRoleInputSchema },
    onSubmit: async ({ value }) => {
      try {
        await viewModel.updateRole.mutateAsync(value);
        showSnackbar({ variant: 'success', message: t('roleSaveSuccess') });
      } catch {
        // The mutation's error state renders below and keeps the form draft.
      }
    },
  });

  return (
    <View className="gap-6">
      <form.Field name="roleDescription">
        {(field) => (
          <View style={webFieldWidth}>
            <TextField
              label={t('role')}
              placeholder={t('rolePlaceholder')}
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              maxLength={500}
              disabled={viewModel.updateRole.isPending}
              error={
                field.state.meta.isTouched && field.state.meta.errors.length
                  ? t('validationRole')
                  : undefined
              }
            />
          </View>
        )}
      </form.Field>
      <View className="gap-2">
        <AppText variant="label">{t('experienceBand')}</AppText>
        <form.Field name="experienceBand">
          {(field) => (
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t('experienceBand')}
              className="flex-row flex-wrap gap-2"
            >
              {(Object.keys(bandKey) as ExperienceBand[]).map((band) => (
                <Chip
                  key={band}
                  label={t(bandKey[band])}
                  selected={field.state.value === band}
                  disabled={viewModel.updateRole.isPending}
                  onPress={() => field.handleChange(band)}
                />
              ))}
            </View>
          )}
        </form.Field>
      </View>
      <View className="gap-3">
        <View className="gap-1">
          <AppText variant="sectionTitle">{t('interests')}</AppText>
          <AppText variant="bodySmall" tone="muted">
            {t('interestsHelp')}
          </AppText>
        </View>
        <View style={webFieldWidth}>
          <SearchField
            label={t('interestSearch')}
            placeholder={t('interestSearchPlaceholder')}
            value={viewModel.search}
            onChangeText={onSearchChange}
            disabled={viewModel.updateRole.isPending}
          />
        </View>
        {viewModel.isInterestsLoading ? (
          <CollectionFeedback status="loading" rows={2} />
        ) : null}
        {!viewModel.isInterestsLoading && interests.length === 0 ? (
          <CollectionFeedback
            status="empty"
            title={t('interestEmpty')}
            message={t('interestEmpty')}
          />
        ) : null}
        <form.Field name="interestIds">
          {(field) => (
            <>
              {interests.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {interests.map((interest) => {
                    const selected = field.state.value.includes(interest.id);
                    return (
                      <Chip
                        key={interest.id}
                        label={interest.label}
                        selected={selected}
                        disabled={
                          viewModel.updateRole.isPending ||
                          (!selected && field.state.value.length >= 3)
                        }
                        onPress={() =>
                          field.handleChange(
                            selected
                              ? field.state.value.filter(
                                  (id) => id !== interest.id,
                                )
                              : [...field.state.value, interest.id],
                          )
                        }
                      />
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </form.Field>
        {viewModel.interestError ? (
          <View className="gap-2">
            <AppText accessibilityLiveRegion="polite" tone="danger">
              {t('errorMessage')}
            </AppText>
            <Button
              label={t('retry')}
              size="sm"
              variant="ghost"
              onPress={() => void viewModel.retryInterests()}
            />
          </View>
        ) : null}
        {viewModel.hasMoreInterests ? (
          <Button
            label={t('loadMore')}
            size="sm"
            variant="secondary"
            loading={viewModel.isFetchingMoreInterests}
            disabled={viewModel.updateRole.isPending}
            onPress={() => void viewModel.loadMoreInterests()}
          />
        ) : null}
      </View>
      {viewModel.updateRole.error ? (
        <AppText accessibilityLiveRegion="polite" tone="danger">
          {t('roleSaveError')}
        </AppText>
      ) : null}
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isDirty: state.isDirty,
        })}
      >
        {({ canSubmit, isDirty }) => (
          <View
            className={layout.isWeb ? 'self-center' : undefined}
            style={
              layout.isWeb ? { alignSelf: 'center', width: 220 } : undefined
            }
          >
            <Button
              label={viewModel.updateRole.isPending ? t('saving') : t('save')}
              fullWidth
              loading={viewModel.updateRole.isPending}
              disabled={
                !canSubmit || !isDirty || viewModel.updateRole.isPending
              }
              onPress={() => form.handleSubmit()}
            />
          </View>
        )}
      </form.Subscribe>
    </View>
  );
}

function mergeInterests(
  initial: readonly ProfileCatalogItem[],
  current: readonly ProfileCatalogItem[],
) {
  const entries = new Map<string, ProfileCatalogItem>();
  for (const interest of [...initial, ...current])
    entries.set(interest.id, interest);
  return [...entries.values()];
}
