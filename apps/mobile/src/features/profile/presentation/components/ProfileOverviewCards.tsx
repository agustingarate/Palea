import { Pressable, View } from 'react-native';
import { countryFlag, countryName, isIsoAlpha2 } from '@palea/contracts';
import {
  AppText,
  Avatar,
  Button,
  Chip,
  DetailCard,
  Icon,
  Notice,
  Surface,
} from '@palea/ui-native';
import type { TFunction } from 'i18next';
import type { UserProfile } from '../../domain/entities/Profile';

function initials(name: string | null) {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function date(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00`),
  );
}

function nationality(
  value: string | null,
  locale: 'es' | 'en',
  fallback: string,
) {
  if (!value) return fallback;
  if (!isIsoAlpha2(value)) return value;
  return `${countryFlag(value)} ${countryName(value, locale)}`;
}

const bandKey = {
  zero_to_one: 'bandZeroToOne',
  two_to_four: 'bandTwoToFour',
  five_to_eight: 'bandFiveToEight',
  over_eight: 'bandOverEight',
} as const;

export function ProfileIdentityHeader({
  profile,
  t,
}: {
  profile: UserProfile;
  t: TFunction<'profile'>;
}) {
  const name = profile.identity.fullName ?? t('unavailable');
  return (
    <View className="items-center gap-3 py-2">
      <Avatar
        initials={initials(profile.identity.fullName)}
        size="lg"
        accessibilityLabel={t('initials', { name })}
      />
      <View className="items-center gap-1">
        <AppText variant="screenTitle" className="text-center">
          {name}
        </AppText>
        {profile.role.description ? (
          <AppText tone="muted" className="text-center">
            {profile.role.description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function ProfilePersonalInformationCard({
  profile,
  locale,
  t,
}: {
  profile: UserProfile;
  locale: string;
  t: TFunction<'profile'>;
}) {
  const fallback = t('unavailable');
  const identityRows = [
    {
      icon: 'user' as const,
      label: t('fullName'),
      value: profile.identity.fullName ?? fallback,
    },
    {
      icon: 'mail' as const,
      label: t('email'),
      value: profile.identity.email ?? fallback,
    },
    {
      icon: 'calendar' as const,
      label: t('birthDate'),
      value: date(profile.identity.birthDate, locale, fallback),
    },
    {
      icon: 'location' as const,
      label: t('nationality'),
      value: nationality(
        profile.identity.nationality,
        locale.startsWith('en') ? 'en' : 'es',
        fallback,
      ),
    },
  ];
  return (
    <DetailCard title={t('personalTitle')} icon="user">
      <ProfileIdentityHeader profile={profile} t={t} />
      <View className="gap-3 border-t border-border pt-4 dark:border-dark-border">
        {identityRows.map((row) => (
          <View key={row.label} className="flex-row gap-3">
            <Icon name={row.icon} size="sm" tone="muted" />
            <View className="flex-1 gap-0.5">
              <AppText variant="label" tone="muted">
                {row.label}
              </AppText>
              <AppText>{row.value}</AppText>
            </View>
          </View>
        ))}
      </View>
    </DetailCard>
  );
}

export function ProfileRoleSummaryCard({
  profile,
  t,
  onEdit,
}: {
  profile: UserProfile;
  t: TFunction<'profile'>;
  onEdit: () => void;
}) {
  const role = profile.role;
  return (
    <DetailCard
      title={t('professionalTitle')}
      icon="professional"
      action={
        <Button
          label={t('editRole')}
          leadingIcon="edit"
          size="sm"
          variant="secondary"
          onPress={onEdit}
        />
      }
    >
      <AppText variant="bodySmall" tone="muted">
        {t('professionalHelp')}
      </AppText>
      {role.description && role.experienceBand ? (
        <View className="gap-3">
          <View className="gap-1">
            <AppText variant="label" tone="muted">
              {t('role')}
            </AppText>
            <AppText>{role.description}</AppText>
          </View>
          <View className="gap-1">
            <AppText variant="label" tone="muted">
              {t('experienceBand')}
            </AppText>
            <AppText>{t(bandKey[role.experienceBand])}</AppText>
          </View>
          <View className="gap-2">
            <AppText variant="label" tone="muted">
              {t('interests')}
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {role.interests.map((interest) => (
                <Chip key={interest.id} label={interest.label} size="sm" />
              ))}
            </View>
          </View>
        </View>
      ) : (
        <ProfileEmptyState
          icon="professional"
          title={t('roleEmptyTitle')}
          message={t('roleEmpty')}
          actionLabel={t('roleAdd')}
          onAction={onEdit}
        />
      )}
    </DetailCard>
  );
}

export function ProfileExperiencePreview({
  profile,
  locale,
  t,
  onOpen,
}: {
  profile: UserProfile;
  locale: string;
  t: TFunction<'profile'>;
  onOpen: () => void;
}) {
  return (
    <DetailCard
      title={t('experienceTitle')}
      icon="workExperience"
      action={
        <Button
          label={t('experienceSeeMore')}
          leadingIcon="arrowForward"
          size="sm"
          variant="ghost"
          onPress={onOpen}
        />
      }
    >
      <AppText variant="bodySmall" tone="muted">
        {t('experienceRecent')}
      </AppText>
      {profile.experiences.length === 0 ? (
        <ProfileEmptyState
          icon="workExperience"
          title={t('experienceEmptyTitle')}
          message={t('experienceEmptyMessage')}
          actionLabel={t('experienceAddCompact')}
          onAction={onOpen}
        />
      ) : (
        <View className="gap-3">
          {profile.experiences.map((experience) => (
            <Pressable
              key={experience.id}
              accessibilityRole="button"
              accessibilityLabel={t('experienceOpen', {
                role: experience.role,
                company: experience.companyName,
              })}
              className="min-h-touch-target gap-2 border-b border-border pb-4 last:border-b-0 last:pb-0 dark:border-dark-border"
              onPress={onOpen}
            >
              <View className="flex-row items-start gap-3">
                <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-sm bg-surface-subtle dark:bg-dark-surface-subtle">
                  <Icon name="workExperience" size="sm" tone="interaction" />
                </View>
                <View className="flex-1 gap-1">
                  <AppText className="font-semibold">{experience.role}</AppText>
                  <AppText variant="bodySmall" tone="muted">
                    {experience.companyName}
                  </AppText>
                  <AppText variant="label" tone="muted">
                    {experience.isCurrent
                      ? t('experienceFrom', {
                          date: date(
                            experience.startedOn,
                            locale,
                            t('unavailable'),
                          ),
                        })
                      : t('experienceRange', {
                          start: date(
                            experience.startedOn,
                            locale,
                            t('unavailable'),
                          ),
                          end: date(
                            experience.endedOn,
                            locale,
                            t('unavailable'),
                          ),
                        })}
                  </AppText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </DetailCard>
  );
}

export function ProfileSkillsPreview({
  profile,
  t,
  onOpen,
}: {
  profile: UserProfile;
  t: TFunction<'profile'>;
  onOpen: () => void;
}) {
  return (
    <DetailCard
      title={t('skillsTitle')}
      icon="star"
      action={
        <Button
          label={t('skillsManage')}
          leadingIcon="slidersHorizontal"
          size="sm"
          variant="secondary"
          onPress={onOpen}
        />
      }
    >
      <AppText variant="bodySmall" tone="muted">
        {t('skillsSummaryHelp')}
      </AppText>
      {profile.skills.length === 0 ? (
        <ProfileEmptyState
          icon="slidersHorizontal"
          title={t('skillsEmptyTitle')}
          message={t('skillsEmptyMessage')}
          actionLabel={t('skillsManage')}
          onAction={onOpen}
        />
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <Chip key={skill.id} label={skill.label} size="sm" />
          ))}
        </View>
      )}
    </DetailCard>
  );
}

function ProfileEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: 'professional' | 'workExperience' | 'slidersHorizontal';
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View
      accessibilityRole="summary"
      className="gap-4 rounded-sm border border-dashed border-border bg-surface-subtle p-4 dark:border-dark-border dark:bg-dark-surface-subtle"
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-surface dark:bg-dark-surface">
          <Icon name={icon} size="md" tone="interaction" />
        </View>
        <View className="flex-1 gap-1">
          <AppText variant="sectionTitle">{title}</AppText>
          <AppText tone="muted">{message}</AppText>
        </View>
      </View>
      <View className="self-start">
        <Button
          label={actionLabel}
          leadingIcon="add"
          size="sm"
          onPress={onAction}
        />
      </View>
    </View>
  );
}

export function ProfileCompletionNotice({
  profile,
  t,
  onOpenNext,
}: {
  profile: UserProfile;
  t: TFunction<'profile'>;
  onOpenNext: () => void;
}) {
  if (!profile.completion.nextSection) return null;
  return (
    <Surface variant="subtle" className="gap-3">
      <Notice
        title={t('incompleteTitle')}
        message={t('incompleteMessage')}
        tone="info"
      />
      <View className="self-start">
        <Button
          label={t('incompleteCta')}
          size="sm"
          variant="secondary"
          onPress={onOpenNext}
        />
      </View>
    </Surface>
  );
}
