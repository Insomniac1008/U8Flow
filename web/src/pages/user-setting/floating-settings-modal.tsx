import ApiContent from '@/components/api-service/chat-overview-modal/api-content';
import { AvatarUpload } from '@/components/avatar-upload';
import PasswordInput from '@/components/originui/password-input';
import { SelectWithSearch } from '@/components/originui/select-with-search';
import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal/modal';
import { Switch } from '@/components/ui/switch';
import { LanguageAbbreviation, ThemeEnum } from '@/constants/common';
import { useTranslate } from '@/hooks/common-hooks';
import { useChangeLanguage } from '@/hooks/logic-hooks';
import { cn } from '@/lib/utils';
import { supportedLanguages } from '@/locales/config';
import { TimezoneList } from '@/pages/user-setting/constants';
import { Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { t as i18nT } from 'i18next';
import {
  Loader2Icon,
  LucideCompass,
  LucideCpu,
  LucideDatabase,
  LucideMoon,
  LucidePlug,
  LucideSlidersHorizontal,
  LucideSun,
  LucideUnplug,
  LucideUser,
  PenLine,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { NICKNAME_MAX_LENGTH, NICKNAME_PATTERN } from './profile/constants';
import { EditType, modalTitle, useProfile } from './profile/hooks/use-profile';

export type SettingsModalTab = 'profile' | 'preferences' | 'api';

export interface FloatingSettingsModalProps {
  open: boolean;
  initialTab?: SettingsModalTab;
  onOpenChange: (open: boolean) => void;
}

const timezoneOptions = TimezoneList.map(({ name }) => ({
  value: name,
  label: name,
}));

const baseSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, { message: i18nT('setting.usernameMessage') })
    .max(NICKNAME_MAX_LENGTH, {
      message: i18nT('setting.usernameMaxLength', {
        max: NICKNAME_MAX_LENGTH,
      }),
    })
    .regex(NICKNAME_PATTERN, {
      message: i18nT('setting.usernameInvalidCharacters'),
    }),
  timeZone: z
    .string()
    .trim()
    .min(1, { message: i18nT('setting.timezonePlaceholder') }),
});

const nameSchema = baseSchema.extend({
  currPasswd: z.string().optional(),
  newPasswd: z.string().optional(),
  confirmPasswd: z.string().optional(),
});

const passwordSchema = baseSchema
  .extend({
    currPasswd: z
      .string({
        required_error: i18nT('setting.currentPasswordMessage'),
      })
      .trim(),
    newPasswd: z
      .string({
        required_error: i18nT('setting.newPasswordMessage'),
      })
      .trim()
      .min(8, { message: i18nT('setting.newPasswordDescription') }),
    confirmPasswd: z
      .string({
        required_error: i18nT('setting.confirmPasswordMessage'),
      })
      .trim()
      .min(8, { message: i18nT('setting.newPasswordDescription') }),
  })
  .superRefine((data, ctx) => {
    if (
      data.newPasswd &&
      data.confirmPasswd &&
      data.newPasswd !== data.confirmPasswd
    ) {
      ctx.addIssue({
        path: ['confirmPasswd'],
        message: i18nT('setting.confirmPasswordNonMatchMessage'),
        code: z.ZodIssueCode.custom,
      });
    }
  });

export default function FloatingSettingsModal({
  open,
  initialTab = 'profile',
  onOpenChange,
}: FloatingSettingsModalProps) {
  const { t } = useTranslate('setting');
  const { t: tGlobal, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const changeLanguage = useChangeLanguage();

  const [activeTab, setActiveTab] = useState<SettingsModalTab>(initialTab);
  const [docLang, setDocLang] = useState(
    () => document.documentElement.lang || '',
  );
  const [u8GuideVisible, setU8GuideVisible] = useState(() => {
    try {
      const v = localStorage.getItem('ragflow_u8_guide_visible');
      return v === null ? true : v === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDocLang(document.documentElement.lang || '');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => observer.disconnect();
  }, []);

  const {
    profile,
    editType,
    isEditing,
    submitLoading,
    editForm,
    handleEditClick,
    handleCancel,
    handleSave,
    handleAvatarUpload,
  } = useProfile();

  const form = useForm<z.infer<typeof baseSchema | typeof passwordSchema>>({
    resolver: zodResolver(
      editType === EditType.editPassword ? passwordSchema : nameSchema,
    ),
    defaultValues: {
      userName: '',
      timeZone: '',
    },
  });

  useEffect(() => {
    form.reset({ ...editForm, currPasswd: undefined });
  }, [editForm, form]);

  const timezone = useMemo(() => {
    const tz = TimezoneList.find((item) => item.name === profile.timeZone);
    return tz?.name ?? '';
  }, [profile.timeZone]);

  const languageOptions = useMemo(
    () => [
      ...supportedLanguages.map((lang) => ({
        value: lang.code,
        label: lang.displayName,
      })),
      { value: 'th', label: 'ภาษาไทย' },
    ],
    [],
  );

  const activeLanguageValue =
    docLang.toLowerCase() === 'th'
      ? 'th'
      : i18n.language || LanguageAbbreviation.Zh;

  const handlePreferenceLanguageChange = (value: string) => {
    if (value === 'th') {
      window.dispatchEvent(
        new CustomEvent('u8-set-language', { detail: 'th' }),
      );
      return;
    }
    if (docLang.toLowerCase() === 'th') {
      window.dispatchEvent(
        new CustomEvent('u8-set-language', { detail: 'other' }),
      );
    }
    changeLanguage(value);
  };

  const handleU8GuideToggle = (checked: boolean) => {
    setU8GuideVisible(checked);
    try {
      localStorage.setItem('ragflow_u8_guide_visible', checked ? '1' : '0');
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new CustomEvent('u8-guide-visibility-changed'));
  };

  const jumpToRoute = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const openU8Help = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent('u8-open-help-modal'));
  };

  const navItems: {
    key: SettingsModalTab;
    label: string;
    icon: typeof LucideUser;
  }[] = [
    { key: 'profile', label: t('profile'), icon: LucideUser },
    {
      key: 'preferences',
      label: t('preferences'),
      icon: LucideSlidersHorizontal,
    },
    { key: 'api', label: t('api'), icon: LucideUnplug },
  ];

  const integrationShortcuts = [
    {
      label: t('model'),
      path: `${Routes.Integrations}${Routes.Model}`,
      icon: LucideCpu,
    },
    {
      label: tGlobal('sidebar.mcp'),
      path: `${Routes.Integrations}${Routes.Mcp}`,
      icon: LucidePlug,
    },
    {
      label: tGlobal('sidebar.u8Db'),
      path: `${Routes.Integrations}${Routes.U8Db}`,
      icon: LucideDatabase,
    },
  ];

  const headerMeta: Record<
    SettingsModalTab,
    { title: string; description: string }
  > = {
    profile: {
      title: t('profile'),
      description: t('profileDescription'),
    },
    preferences: {
      title: t('preferences'),
      description: t('preferencesDescription'),
    },
    api: {
      title: t('api'),
      description: t('apiDescription'),
    },
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          closable={false}
          data-testid="floating-settings-modal"
          className="flex flex-row w-[min(92vw,980px)] max-w-[980px] h-[min(84vh,700px)] p-0 gap-0 overflow-hidden rounded-2xl border-0.5 border-border-button/80 apple-glass-heavy shadow-2xl"
        >
          {/* Left Antigravity-style Settings Sidebar */}
          <aside className="w-[220px] shrink-0 border-r border-border-button/60 bg-black/[0.03] dark:bg-white/[0.025] flex flex-col p-3 overflow-hidden">
            <div className="px-2.5 pt-1 pb-2 text-xs font-medium text-text-secondary">
              {tGlobal('header.setting')}
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-testid={`settings-tab-${item.key}`}
                    onClick={() => setActiveTab(item.key)}
                    className={cn(
                      'w-full h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-sm text-left transition-colors duration-150',
                      active
                        ? 'bg-bg-input text-text-primary font-medium shadow-sm border-0.5 border-border-button/70'
                        : 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="px-2.5 pt-5 pb-2 text-xs font-medium text-text-secondary">
              {tGlobal('sidebar.integrations')}
            </div>
            <div className="space-y-1">
              {integrationShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => jumpToRoute(item.path)}
                    className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors duration-150"
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-3 border-t border-border-button/50 space-y-2.5">
              <button
                type="button"
                onClick={openU8Help}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2 text-xs text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
              >
                <LucideCompass className="size-3.5 shrink-0 text-accent-primary" />
                <span className="truncate">{t('helpU8Title')}</span>
              </button>

              <div className="flex items-center gap-2.5 px-2 py-1">
                <RAGFlowAvatar
                  isPerson
                  className="size-7 shrink-0"
                  avatar={profile.avatar}
                  name={profile.userName}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-text-primary truncate">
                    {profile.userName || profile.email}
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">
                    {profile.email}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Content Pane */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg-base">
            <div className="flex items-start justify-between gap-4 px-8 pt-7 pb-5 shrink-0">
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold text-text-primary">
                  {headerMeta[activeTab].title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-text-secondary">
                  {headerMeta[activeTab].description}
                </DialogDescription>
              </div>
              <DialogClose
                aria-label={tGlobal('common.close')}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors outline-none"
              >
                <X className="size-4" />
              </DialogClose>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-auto px-8 pb-8">
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border-button/80 divide-y divide-border-button/60 bg-black/[0.02] dark:bg-white/[0.03]">
                    {/* Avatar */}
                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {t('avatar')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {t('photoDescription')}
                        </div>
                      </div>
                      <AvatarUpload
                        value={profile.avatar}
                        onChange={handleAvatarUpload}
                        tips={t('avatarTip')}
                      />
                    </div>

                    {/* Username */}
                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {t('username')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5 truncate">
                          {profile.userName || '-'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => handleEditClick(EditType.editName)}
                      >
                        <PenLine className="size-3.5" />
                        {t('edit')}
                      </Button>
                    </div>

                    {/* Timezone */}
                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {t('timezone')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5 truncate">
                          {timezone || '-'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => handleEditClick(EditType.editTimeZone)}
                      >
                        <PenLine className="size-3.5" />
                        {t('edit')}
                      </Button>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {t('email')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {t('emailDescription')}
                        </div>
                      </div>
                      <span className="text-sm text-text-primary font-mono shrink-0">
                        {profile.email}
                      </span>
                    </div>

                    {/* Password */}
                    {(!profile.loginChannel ||
                      profile.loginChannel === 'password') && (
                      <div className="flex items-center justify-between gap-6 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-text-primary">
                            {t('password')}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            ********
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => handleEditClick(EditType.editPassword)}
                        >
                          <PenLine className="size-3.5" />
                          {t('edit')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Appearance & Preferences (Antigravity card layout) */}
              {activeTab === 'preferences' && (
                <div className="space-y-6" data-u8-native-guide-toggle="1">
                  {/* Visual Theme Cards */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-text-primary">
                      {t('colorSchema')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme(ThemeEnum.Light)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all duration-150 space-y-2',
                          theme === ThemeEnum.Light
                            ? 'border-accent-primary/70 bg-accent-primary/10 shadow-sm'
                            : 'border-border-button/80 bg-black/[0.02] dark:bg-white/[0.03] hover:border-border-default hover:bg-bg-card/60',
                        )}
                      >
                        <LucideSun
                          className={cn(
                            'size-5',
                            theme === ThemeEnum.Light
                              ? 'text-accent-primary'
                              : 'text-text-secondary',
                          )}
                        />
                        <div className="text-sm font-medium text-text-primary">
                          {t('lightModeTitle')}
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                          {t('lightModeDesc')}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme(ThemeEnum.Dark)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all duration-150 space-y-2',
                          theme === ThemeEnum.Dark
                            ? 'border-accent-primary/70 bg-accent-primary/10 shadow-sm'
                            : 'border-border-button/80 bg-black/[0.02] dark:bg-white/[0.03] hover:border-border-default hover:bg-bg-card/60',
                        )}
                      >
                        <LucideMoon
                          className={cn(
                            'size-5',
                            theme === ThemeEnum.Dark
                              ? 'text-accent-primary'
                              : 'text-text-secondary',
                          )}
                        />
                        <div className="text-sm font-medium text-text-primary">
                          {t('darkModeTitle')}
                        </div>
                        <div className="text-xs text-text-secondary leading-relaxed">
                          {t('darkModeDesc')}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Language & U8 Guide Card Group */}
                  <div className="rounded-xl border border-border-button/80 divide-y divide-border-button/60 bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {tGlobal('sidebar.language')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {t('languageDescription')}
                        </div>
                      </div>
                      <div className="w-48 shrink-0">
                        <SelectWithSearch
                          options={languageOptions}
                          value={activeLanguageValue}
                          onChange={handlePreferenceLanguageChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">
                          {t('u8Guide')}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {t('u8GuideDescription')}
                        </div>
                      </div>
                      <Switch
                        checked={u8GuideVisible}
                        onCheckedChange={handleU8GuideToggle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: API */}
              {activeTab === 'api' && (
                <div className="min-w-0">
                  <ApiContent idKey="dialogId" />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Edit Dialog for Name / Timezone / Password */}
      {editType && isEditing && (
        <Modal
          title={t(modalTitle[editType])}
          open={isEditing}
          showfooter={false}
          maskClosable={false}
          titleClassName="text-base"
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              handleCancel();
            }
          }}
          className="!w-[480px]"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => handleSave(data as any))}
              className="flex flex-col mt-6 mb-8 ml-2 space-y-6"
            >
              {editType === EditType.editName && (
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem className="items-center space-y-0">
                      <div className="flex flex-col w-full gap-2">
                        <FormLabel className="text-sm text-text-secondary whitespace-nowrap">
                          {t('username')}
                        </FormLabel>
                        <FormControl className="w-full">
                          <Input
                            placeholder=""
                            maxLength={NICKNAME_MAX_LENGTH}
                            {...field}
                            className="bg-bg-input border-border-default"
                          />
                        </FormControl>
                      </div>
                      <div className="flex w-full pt-1">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {editType === EditType.editTimeZone && (
                <FormField
                  control={form.control}
                  name="timeZone"
                  render={({ field }) => (
                    <FormItem className="items-center space-y-0">
                      <div className="flex flex-col w-full gap-2">
                        <FormLabel className="text-sm text-text-secondary whitespace-nowrap">
                          {t('timezone')}
                        </FormLabel>
                        <SelectWithSearch
                          options={timezoneOptions}
                          placeholder="Select a timeZone"
                          onChange={field.onChange}
                          value={field.value}
                        />
                      </div>
                      <div className="flex w-full pt-1">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {editType === EditType.editPassword && (
                <>
                  <FormField
                    control={form.control}
                    name="currPasswd"
                    render={({ field }) => (
                      <FormItem className="items-center space-y-0">
                        <div className="flex flex-col w-full gap-2">
                          <FormLabel
                            required
                            className="text-sm flex text-text-secondary whitespace-nowrap"
                          >
                            {t('currentPassword')}
                          </FormLabel>
                          <FormControl className="w-full">
                            <PasswordInput
                              {...field}
                              placeholder={t('currentPassword')}
                              autoComplete="current-password"
                              className="bg-bg-input border-border-default"
                            />
                          </FormControl>
                        </div>
                        <div className="flex w-full pt-1">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPasswd"
                    render={({ field }) => (
                      <FormItem className="items-center space-y-0">
                        <div className="flex flex-col w-full gap-2">
                          <FormLabel
                            required
                            className="text-sm text-text-secondary whitespace-nowrap"
                          >
                            {t('newPassword')}
                          </FormLabel>
                          <FormControl className="w-full">
                            <PasswordInput
                              {...field}
                              placeholder={t('newPassword')}
                              autoComplete="new-password"
                              className="bg-bg-input border-border-default"
                            />
                          </FormControl>
                        </div>
                        <div className="flex w-full pt-1">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPasswd"
                    render={({ field }) => (
                      <FormItem className="items-center space-y-0">
                        <div className="flex flex-col w-full gap-2">
                          <FormLabel
                            required
                            className="text-sm text-text-secondary whitespace-nowrap"
                          >
                            {t('confirmPassword')}
                          </FormLabel>
                          <FormControl className="w-full">
                            <PasswordInput
                              {...field}
                              placeholder={t('confirmPassword')}
                              className="bg-bg-input border-border-default"
                              autoComplete="new-password"
                              onBlur={() => {
                                form.trigger('confirmPasswd');
                              }}
                              onChange={(ev) => {
                                form.setValue(
                                  'confirmPasswd',
                                  ev.target.value.trim(),
                                );
                              }}
                            />
                          </FormControl>
                        </div>
                        <div className="flex w-full pt-1">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="w-full text-right space-x-4 !mt-11">
                <Button type="reset" variant="secondary" onClick={handleCancel}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2Icon className="animate-spin" />}
                  {t('save', { keyPrefix: 'common' })}
                </Button>
              </div>
            </form>
          </Form>
        </Modal>
      )}
    </>
  );
}
