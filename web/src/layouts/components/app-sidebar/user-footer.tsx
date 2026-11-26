import { IconFontFill } from '@/components/icon-font';
import { RAGFlowAvatar } from '@/components/ragflow-avatar';
import { useIsDarkTheme, useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Domain, LanguageAbbreviation, ThemeEnum } from '@/constants/common';
import {
  EnterpriseHeaderPlanBadge,
  EnterpriseHeaderTicketsLink,
  EnterpriseSidebarTenantSwitcher,
} from '@/ee/layouts/components/header-enterprise';
import { useChangeLanguage } from '@/hooks/logic-hooks';
import { useLogout } from '@/hooks/use-login-request';
import {
  useFetchSystemVersion,
  useFetchUserInfo,
  useListTenant,
} from '@/hooks/use-user-setting-request';
import { cn } from '@/lib/utils';
import { supportedLanguages } from '@/locales/config';
import { TenantMembershipStatus } from '@/pages/user-setting/constants';
import type { SettingsModalTab } from '@/pages/user-setting/floating-settings-modal';
import {
  LucideBookOpen,
  LucideCheck,
  LucideChevronLeft,
  LucideCircleHelp,
  LucideCompass,
  LucideExternalLink,
  LucideLanguages,
  LucideLogOut,
  LucideMoon,
  LucideSettings,
  LucideSun,
  LucideUnplug,
} from 'lucide-react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BellButton } from '../bell-button';
import { useSidebarCollapse } from './use-sidebar-collapse';

const LazyFloatingSettingsModal = lazy(
  () => import('@/pages/user-setting/floating-settings-modal'),
);

const HelpUrl = 'https://ragflow.io/docs/dev/category/user-guides';
const GitHubUrl = 'https://github.com/infiniflow/ragflow';
const AuthorGitHubUrl = 'https://github.com/Insomniac1008';

export function UserFooter() {
  const { t, i18n } = useTranslation();
  const changeLanguage = useChangeLanguage();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();
  const isDark = useIsDarkTheme();
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsModalTab>('profile');
  const [settingsModalKey, setSettingsModalKey] = useState(0);

  const openFloatingSettings = useCallback((tab: SettingsModalTab) => {
    setSettingsTab(tab);
    setSettingsModalKey((k) => k + 1);
    setSettingsOpen(true);
  }, []);

  const {
    data: { language = LanguageAbbreviation.Zh, avatar, nickname, email },
  } = useFetchUserInfo();

  const [docLang, setDocLang] = useState(
    () => document.documentElement.lang || '',
  );

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

  const isThaiMode = docLang.toLowerCase() === 'th';
  const activeLanguage = i18n?.language || language;
  const activeLanguageLabel = useMemo(() => {
    if (isThaiMode) return 'ภาษาไทย';
    return (
      supportedLanguages.find((x) => x.code === activeLanguage)?.displayName ||
      ''
    );
  }, [activeLanguage, isThaiMode]);

  const { data: tenantData } = useListTenant();
  const hasNotification = useMemo(
    () => tenantData?.some((x) => x.status === TenantMembershipStatus.Invited),
    [tenantData],
  );

  const { version, fetchSystemVersion } = useFetchSystemVersion();
  useEffect(() => {
    if (location.host !== Domain) {
      fetchSystemVersion();
    }
  }, [fetchSystemVersion]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === ThemeEnum.Dark ? ThemeEnum.Light : ThemeEnum.Dark);
  }, [setTheme, theme]);

  const handleLanguageChange = useCallback(
    (code: string) => () => {
      changeLanguage(code);
    },
    [changeLanguage],
  );

  const openHelp = useCallback(() => {
    window.open(HelpUrl, '_blank', 'noreferrer,noopener');
  }, []);

  const openU8Help = useCallback(() => {
    window.dispatchEvent(new CustomEvent('u8-open-help-modal'));
  }, []);

  const openGitHub = useCallback(() => {
    window.open(GitHubUrl, '_blank', 'noreferrer,noopener');
  }, []);

  const openAuthorGitHub = useCallback(() => {
    window.open(AuthorGitHubUrl, '_blank', 'noreferrer,noopener');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const ThemeIcon = isDark ? LucideMoon : LucideSun;

  return (
    <footer
      className={cn(
        'mt-auto flex shrink-0 flex-col gap-2 p-2',
        !collapsed && 'md:p-3',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-1',
          !collapsed && 'md:justify-end',
        )}
      >
        {hasNotification && <BellButton className="!size-8" />}
        <EnterpriseHeaderTicketsLink />
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label={nickname || email}
              data-testid="settings-entrypoint"
              className={cn(
                'h-auto justify-start gap-2.5 px-2 py-2 rounded-xl',
                !collapsed && 'md:min-w-0 md:flex-1',
                collapsed
                  ? 'size-10 justify-center p-0'
                  : 'max-md:size-10 max-md:justify-center max-md:p-0',
              )}
            >
              <span className="relative shrink-0">
                <RAGFlowAvatar
                  name={nickname}
                  avatar={avatar}
                  isPerson
                  className="size-8"
                />
                <EnterpriseHeaderPlanBadge />
              </span>
              <span
                className={cn(
                  'hidden min-w-0 flex-1 truncate text-start text-sm',
                  !collapsed && 'md:inline',
                )}
              >
                {nickname || email}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            data-u8-native-menu="1"
            className="w-64 rounded-2xl p-1.5"
          >
            {/* Compact Antigravity-style account header */}
            <div className="flex items-center gap-2.5 px-2 py-2">
              <RAGFlowAvatar
                name={nickname}
                avatar={avatar}
                isPerson
                className="size-9 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {nickname || email}
                  </span>
                  {version && (
                    <span className="shrink-0 rounded-md border-0.5 border-border-button bg-bg-card px-1.5 py-0.5 text-[10px] font-medium leading-none text-text-secondary">
                      {version}
                    </span>
                  )}
                </div>
                {email && (
                  <div className="truncate text-xs text-text-secondary mt-0.5">
                    {email}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('sidebar.theme')}
                title={`${t('sidebar.theme')}：${isDark ? t('setting.dark') : t('setting.bright')}`}
                onClick={toggleTheme}
                className="shrink-0 rounded-lg text-text-secondary hover:text-text-primary"
              >
                <ThemeIcon className="size-4" />
              </Button>
            </div>

            <EnterpriseSidebarTenantSwitcher />
            <DropdownMenuSeparator className="my-1.5 bg-border-button/60" />

            {/* Core Settings & API (opens Antigravity floating overlay modal) */}
            <DropdownMenuItem
              justifyBetween={false}
              onClick={() => openFloatingSettings('profile')}
              className="gap-2.5 px-2.5 py-2 text-text-primary cursor-pointer"
            >
              <LucideSettings className="size-4 text-text-secondary" />
              <span className="flex-1 truncate">{t('header.setting')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              justifyBetween={false}
              onClick={() => openFloatingSettings('api')}
              className="gap-2.5 px-2.5 py-2 text-text-primary cursor-pointer"
            >
              <LucideUnplug className="size-4 text-text-secondary" />
              <span className="flex-1 truncate">{t('setting.api')}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-border-button/60" />

            {/* Language, Help, GitHub — all native hover/click Submenus keeping parent open */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2.5 px-2.5 py-2 text-text-primary">
                <LucideLanguages className="size-4 text-text-secondary" />
                <span className="flex-1 truncate">{t('sidebar.language')}</span>
                {activeLanguageLabel && (
                  <span className="text-xs text-text-secondary truncate max-w-[84px]">
                    {activeLanguageLabel}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                className="w-44 max-h-80 rounded-2xl p-1.5"
              >
                {supportedLanguages.map((x) => {
                  const isActive = !isThaiMode && x.code === activeLanguage;
                  return (
                    <DropdownMenuItem
                      key={x.code}
                      onClick={handleLanguageChange(x.code)}
                      className="cursor-pointer px-2.5 py-1.5 text-text-primary"
                    >
                      <span
                        className={cn(
                          isActive && 'font-semibold text-accent-primary',
                        )}
                      >
                        {x.displayName}
                      </span>
                      {isActive && (
                        <LucideCheck className="size-3.5 text-accent-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2.5 px-2.5 py-2 text-text-primary">
                <LucideCircleHelp className="size-4 text-text-secondary" />
                <span className="flex-1 truncate">{t('header.help')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                data-u8-preserve-brand="1"
                className="w-64 rounded-2xl p-1.5"
              >
                <DropdownMenuItem
                  justifyBetween={false}
                  onClick={openHelp}
                  className="items-start gap-2.5 px-2.5 py-2 cursor-pointer"
                >
                  <LucideBookOpen className="size-4 mt-0.5 text-text-secondary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <span className="truncate">
                        {t('setting.helpRagflowTitle')}
                      </span>
                      <LucideExternalLink className="size-3 text-text-secondary/70 shrink-0" />
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {t('setting.helpRagflowDesc')}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  justifyBetween={false}
                  onClick={openU8Help}
                  className="items-start gap-2.5 px-2.5 py-2 cursor-pointer"
                >
                  <LucideCompass className="size-4 mt-0.5 text-accent-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {t('setting.helpU8Title')}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {t('setting.helpU8Desc')}
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2.5 px-2.5 py-2 text-text-primary">
                <IconFontFill name="GitHub" className="text-text-secondary" />
                <span className="flex-1 truncate">{t('header.github')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                sideOffset={8}
                data-u8-preserve-brand="1"
                className="w-64 rounded-2xl p-1.5"
              >
                <DropdownMenuItem
                  justifyBetween={false}
                  onClick={openGitHub}
                  className="items-start gap-2.5 px-2.5 py-2 cursor-pointer"
                >
                  <IconFontFill
                    name="GitHub"
                    className="mt-0.5 text-text-secondary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <span className="truncate">RAGFlow GitHub</span>
                      <LucideExternalLink className="size-3 text-text-secondary/70 shrink-0" />
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {t('setting.githubRagflowDesc')}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  justifyBetween={false}
                  onClick={openAuthorGitHub}
                  className="items-start gap-2.5 px-2.5 py-2 cursor-pointer"
                >
                  <IconFontFill
                    name="GitHub"
                    className="mt-0.5 text-accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <span className="truncate">Insomniac1008 (IcyFrog)</span>
                      <LucideExternalLink className="size-3 text-text-secondary/70 shrink-0" />
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {t('setting.githubAuthorDesc')}
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="my-1.5 bg-border-button/60" />

            {/* Sign out */}
            <DropdownMenuItem
              justifyBetween={false}
              onClick={handleLogout}
              className="gap-2.5 px-2.5 py-2 text-text-secondary focus:bg-state-error/10 focus:text-state-error cursor-pointer"
            >
              <LucideLogOut className="size-4" />
              <span className="flex-1 truncate">{t('setting.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('sidebar.collapseSidebar')}
            title={t('sidebar.collapseSidebar')}
            onClick={toggleCollapsed}
            className="shrink-0 max-md:hidden"
          >
            <LucideChevronLeft className="size-4" />
          </Button>
        )}
      </div>

      {settingsOpen && (
        <Suspense fallback={null}>
          <LazyFloatingSettingsModal
            key={settingsModalKey}
            open={settingsOpen}
            initialTab={settingsTab}
            onOpenChange={setSettingsOpen}
          />
        </Suspense>
      )}
    </footer>
  );
}
