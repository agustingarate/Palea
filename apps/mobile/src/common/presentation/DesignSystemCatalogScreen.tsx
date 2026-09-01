import { useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  ApplicationCard,
  Avatar,
  Badge,
  BottomNavigation,
  Button,
  Checkbox,
  Chip,
  CollectionFeedback,
  CVCard,
  DateTrigger,
  DetailCard,
  Divider,
  FeedbackMessage,
  FileTrigger,
  FloatingActionButton,
  FocusedFormLayout,
  FormSection,
  FunnelChart,
  Icon,
  IconButton,
  MetricBars,
  PasswordField,
  ProgressIndicator,
  ResourceRow,
  ResponsiveGrid,
  ScrollScreen,
  SearchField,
  SegmentedControl,
  SelectTrigger,
  Skeleton,
  Spinner,
  StageGroup,
  StageTimeline,
  StatTile,
  StickyActionBar,
  Surface,
  Tabs,
  TextAreaField,
  TextField,
  TopAppBar,
  useResponsiveLayout,
} from '@palea/ui-native';
import { useThemeStore, type ThemePreference } from '@/core/state/themeStore';
import { useLocale } from '@/core/localization/LocaleProvider';
import { useRouter } from 'expo-router';

const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const noOp = () => undefined;

export function DesignSystemCatalogScreen() {
  const router = useRouter();
  const { i18n } = useLocale();
  const layout = useResponsiveLayout();
  const [segment, setSegment] = useState('remote');
  const [tab, setTab] = useState('overview');
  const [checked, setChecked] = useState(true);
  const [stageOpen, setStageOpen] = useState(true);
  const [navigation, setNavigation] = useState('home');
  const [showFormTemplate, setShowFormTemplate] = useState(false);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  if (showFormTemplate) {
    return (
      <FocusedFormLayout
        title="Focused form template"
        description="Keyboard-aware single-column form with a sticky action area."
        progress={
          <ProgressIndicator current={2} total={3} label="Step 2 of 3" />
        }
        footer={
          <StickyActionBar>
            <Button
              label="Back to catalog"
              variant="secondary"
              onPress={() => setShowFormTemplate(false)}
            />
            <Button label="Save" trailingIcon="arrowForward" onPress={noOp} />
          </StickyActionBar>
        }
      >
        <FormSection
          title="Core details"
          description="Template composition preview"
        >
          <TextField
            label="Role"
            value="Product Designer"
            onChangeText={noOp}
            required
          />
          <TextAreaField label="Notes" placeholder="Add context" />
        </FormSection>
      </FocusedFormLayout>
    );
  }

  return (
    <ScrollScreen contentClassName="pb-24">
      <View className="gap-2">
        <AppText variant={layout.isExpanded ? 'display' : 'screenTitle'}>
          Palea design system
        </AppText>
        <AppText tone="muted">
          Universal components, states, motion, and adaptive compositions.
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          <Button
            label={`Theme: ${preference}`}
            leadingIcon="eye"
            variant="secondary"
            onPress={() => setPreference(nextTheme[preference])}
          />
          <Button
            label="Form template"
            variant="ghost"
            onPress={() => setShowFormTemplate(true)}
          />
          <Button
            label={`Language: ${i18n.language}`}
            variant="secondary"
            onPress={() =>
              void i18n.changeLanguage(
                i18n.language.startsWith('es') ? 'en' : 'es',
              )
            }
          />
          <Button
            label="Resume library"
            variant="secondary"
            leadingIcon="fileText"
            onPress={() => router.push('/resumes')}
          />
        </View>
      </View>

      <FormSection title="Typography and icons">
        <AppText variant="display">Display 28</AppText>
        <AppText variant="screenTitle">Screen title 24</AppText>
        <AppText variant="sectionTitle">Section title 20</AppText>
        <AppText>Body 16 — calm, concise, and readable.</AppText>
        <AppText variant="bodySmall" tone="muted">
          Supporting body 14
        </AppText>
        <AppText variant="label" tone="interaction">
          LABEL 12
        </AppText>
        <View className="flex-row flex-wrap gap-4">
          {(
            [
              'home',
              'briefcase',
              'search',
              'calendar',
              'fileText',
              'barChart',
              'user',
              'error',
              'checkCircle',
            ] as const
          ).map((name) => (
            <Icon
              key={name}
              name={name}
              size={layout.isExpanded ? 32 : 'lg'}
              accessibilityLabel={name}
            />
          ))}
        </View>
        <Surface variant="subtle" className="items-center gap-2 self-start">
          <Icon
            name="briefcase"
            size={48}
            accessibilityLabel="Large SVG icon"
          />
          <AppText variant="label" tone="muted">
            Large SVG reference
          </AppText>
        </Surface>
        <Divider />
      </FormSection>

      <FormSection title="Surfaces">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <Surface>
            <AppText>Default surface</AppText>
          </Surface>
          <Surface variant="subtle">
            <AppText>Subtle surface</AppText>
          </Surface>
          <Surface variant="elevated">
            <AppText>Elevated surface</AppText>
          </Surface>
          <Surface variant="selected">
            <AppText tone="interaction">Selected surface</AppText>
          </Surface>
        </ResponsiveGrid>
      </FormSection>

      <FormSection title="Buttons and actions">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3 }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button
              key={size}
              label={`Primary ${size}`}
              size={size}
              leadingIcon="add"
              trailingIcon="arrowForward"
              onPress={noOp}
              fullWidth
            />
          ))}
          <Button
            label="Secondary"
            variant="secondary"
            onPress={noOp}
            fullWidth
          />
          <Button label="Ghost" variant="ghost" onPress={noOp} fullWidth />
          <Button
            label="Destructive"
            leadingIcon="trash"
            variant="destructive"
            onPress={noOp}
            fullWidth
          />
          <Button label="Loading" loading onPress={noOp} fullWidth />
          <Button label="Disabled" disabled onPress={noOp} fullWidth />
        </ResponsiveGrid>
        <View className="flex-row items-center gap-3">
          <IconButton
            accessibilityLabel="Default icon button"
            icon="more"
            onPress={noOp}
          />
          <IconButton
            accessibilityLabel="Selected icon button"
            icon="star"
            tone="interaction"
            onPress={noOp}
          />
          <IconButton
            accessibilityLabel="Delete icon button"
            icon="trash"
            tone="danger"
            onPress={noOp}
          />
          <FloatingActionButton
            accessibilityLabel="Add application"
            icon="add"
            onPress={noOp}
          />
        </View>
      </FormSection>

      <FormSection title="Badges, chips, avatar, and loading">
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              'neutral',
              'interaction',
              'success',
              'warning',
              'danger',
              'info',
            ] as const
          ).map((tone) => (
            <Badge key={tone} label={tone} tone={tone} />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Default" onPress={noOp} />
          <Chip label="Selected" selected onPress={noOp} />
          <Chip label="Removable" onRemove={noOp} />
          <Chip label="Disabled" disabled />
        </View>
        <View className="flex-row items-center gap-3">
          <Avatar accessibilityLabel="Small avatar" initials="PA" size="sm" />
          <Avatar accessibilityLabel="Medium avatar" initials="PL" />
          <Avatar accessibilityLabel="Large avatar" initials="DS" size="lg" />
          <Spinner />
        </View>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-12 w-full" />
      </FormSection>

      <FormSection
        title="Fields"
        description="Controlled visual contracts; native pickers are supplied by feature adapters."
      >
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <TextField label="Default input" placeholder="Placeholder" />
          <TextField
            label="Filled input"
            value="Entered text"
            onChangeText={noOp}
            required
          />
          <TextField
            label="Error input"
            value="Invalid input"
            onChangeText={noOp}
            error="Error message here"
          />
          <TextField label="Disabled input" value="Disabled" disabled />
          <TextField label="Read-only input" value="Read-only value" readOnly />
          <PasswordField label="Password" value="secret" onChangeText={noOp} />
          <SearchField label="Search" placeholder="Search applications" />
          <TextAreaField
            label="Notes"
            placeholder="Add private notes"
            helperText="Optional"
          />
          <SelectTrigger
            label="CV selection"
            placeholder="Select CV"
            value="Resume 2026"
            onPress={noOp}
          />
          <DateTrigger
            label="Interview date"
            placeholder="Select date"
            onPress={noOp}
          />
          <FileTrigger
            label="Resume"
            placeholder="Upload PDF"
            helperText="PDF, up to 10 MB"
            onPress={noOp}
          />
          <FileTrigger
            label="Disabled file"
            placeholder="Upload unavailable"
            disabled
            onPress={noOp}
          />
        </ResponsiveGrid>
      </FormSection>

      <FormSection title="Selection">
        <Checkbox
          label="Receive reminders"
          checked={checked}
          onChange={setChecked}
        />
        <Checkbox label="Selected disabled" checked disabled onChange={noOp} />
        <Checkbox
          label="Required consent"
          checked={false}
          error="Required"
          onChange={noOp}
        />
        <SegmentedControl
          label="Work mode"
          items={[
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
          ]}
          value={segment}
          onValueChange={setSegment}
        />
        <SegmentedControl
          disabled
          label="Disabled segmented control"
          items={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
          ]}
          value="easy"
          onValueChange={noOp}
        />
        <Tabs
          accessibilityLabel="Application detail tabs"
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'stages', label: 'Stages' },
            { value: 'notes', label: 'Notes' },
          ]}
          value={tab}
          onValueChange={setTab}
        />
        <ProgressIndicator current={2} total={3} label="Onboarding progress" />
      </FormSection>

      <FormSection title="Content molecules">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <ResourceRow
            title="Resume_Final_2026.pdf"
            subtitle="Updated today"
            actionIcon="download"
            actionLabel="Download resume"
            onPress={noOp}
          />
          <ResourceRow title="Portfolio" icon="link" />
          <StatTile
            label="Applications"
            value={24}
            trend="+12%"
            tone="success"
          />
          <StatTile label="Interviews" value={6} tone="interaction" />
          <FeedbackMessage
            title="Informational feedback"
            message="This component supports semantic tones and optional actions."
            actionLabel="Continue"
            onAction={noOp}
          />
          <FeedbackMessage
            title="Could not load"
            message="Check your connection and try again."
            tone="danger"
            actionLabel="Retry"
            onAction={noOp}
          />
        </ResponsiveGrid>
      </FormSection>

      <FormSection title="Navigation shells">
        <Surface padding="none" className="overflow-hidden">
          <TopAppBar
            title="Applications"
            subtitle="12 active"
            leading={<IconButton accessibilityLabel="Open menu" icon="menu" />}
            trailing={<IconButton accessibilityLabel="Search" icon="search" />}
          />
          <View className="h-20 items-center justify-center">
            <AppText tone="muted">Screen content</AppText>
          </View>
          <BottomNavigation
            items={[
              { value: 'home', label: 'Home', icon: 'home' },
              { value: 'cv', label: 'CV Library', icon: 'fileText' },
              {
                value: 'metrics',
                label: 'Metrics',
                icon: 'barChart',
                unreadCount: '2',
              },
              { value: 'profile', label: 'Profile', icon: 'user' },
            ]}
            value={navigation}
            onValueChange={setNavigation}
          />
        </Surface>
        <StickyActionBar>
          <Button label="Cancel" variant="ghost" onPress={noOp} />
          <Button label="Save" onPress={noOp} />
        </StickyActionBar>
      </FormSection>

      <FormSection title="Application and CV cards">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <ApplicationCard
            title="Product Designer"
            company="Acme Corp"
            status="Active"
            metadata={['Remote', '2 days in stage']}
            tags={['Figma', 'Design Systems']}
            onPress={noOp}
          />
          <ApplicationCard
            title="Frontend Engineer"
            company="TechFlow"
            status="Interview"
            statusTone="warning"
            metadata={['Hybrid', '5 days in stage']}
            variant="list"
            onPress={noOp}
          />
          <ApplicationCard
            title="Selected application"
            company="Palea"
            status="Offer"
            statusTone="success"
            selected
          />
          <ApplicationCard
            title="Disabled application"
            company="Archived"
            status="Rejected"
            statusTone="danger"
            disabled
          />
          <CVCard
            name="Product CV"
            fileName="resume-product.pdf"
            updatedLabel="Updated today"
            primary
            score={82}
            onOpen={noOp}
            onDownload={noOp}
          />
          <CVCard
            name="Engineering CV"
            fileName="resume-engineering.pdf"
            updatedLabel="Updated last week"
          />
        </ResponsiveGrid>
      </FormSection>

      <FormSection title="Detail, stages, and timeline">
        <DetailCard
          title="Private notes"
          icon="notes"
          action={<IconButton accessibilityLabel="Edit notes" icon="edit" />}
        >
          <AppText variant="bodySmall" tone="muted">
            Follow up after the technical interview.
          </AppText>
        </DetailCard>
        <StageGroup
          title="Applied"
          count={3}
          expanded={stageOpen}
          onToggle={() => setStageOpen((value) => !value)}
        >
          <ApplicationCard
            title="Product Designer"
            company="Acme"
            status="Active"
            variant="list"
          />
        </StageGroup>
        <StageGroup
          title="Interview"
          count={2}
          expanded={false}
          onToggle={noOp}
        >
          <AppText>Collapsed content</AppText>
        </StageGroup>
        <StageTimeline
          items={[
            {
              id: '1',
              title: 'Application submitted',
              date: 'Aug 1',
              completed: true,
              tone: 'success',
            },
            {
              id: '2',
              title: 'Initial screening',
              description: 'Call with recruiter',
              date: 'Aug 4',
              completed: true,
              tone: 'success',
            },
            {
              id: '3',
              title: 'Technical interview',
              date: 'Aug 8',
              tone: 'warning',
            },
          ]}
        />
      </FormSection>

      <FormSection title="Metrics">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2 }}>
          <Surface variant="subtle">
            <MetricBars
              items={[
                { label: 'Applied', value: 24 },
                { label: 'Screening', value: 12 },
                { label: 'Interview', value: 6, tone: 'interaction' },
                { label: 'Offer', value: 2 },
              ]}
            />
          </Surface>
          <Surface variant="subtle">
            <FunnelChart
              items={[
                { label: 'Applied', value: 24 },
                { label: 'Screening', value: 12 },
                { label: 'Interview', value: 6 },
                { label: 'Offer', value: 2 },
              ]}
            />
          </Surface>
        </ResponsiveGrid>
      </FormSection>

      <FormSection title="Collection states">
        <CollectionFeedback status="loading" rows={2} />
        <CollectionFeedback
          status="empty"
          title="No applications yet"
          message="Your applications will appear here."
          actionLabel="Add application"
          onAction={noOp}
        />
        <CollectionFeedback
          status="error"
          title="Unable to load"
          message="Try again in a moment."
          actionLabel="Retry"
          onAction={noOp}
        />
        <CollectionFeedback status="content">
          <AppText>Content state</AppText>
        </CollectionFeedback>
      </FormSection>
    </ScrollScreen>
  );
}
