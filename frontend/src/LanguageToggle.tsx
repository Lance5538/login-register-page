import type { AuthLocale } from './content';

type LanguageToggleProps = {
  locale: AuthLocale;
  onChange: (locale: AuthLocale) => void;
  compact?: boolean;
  className?: string;
};

export default function LanguageToggle({ locale, onChange, compact = false, className = '' }: LanguageToggleProps) {
  const frameClasses = compact
    ? 'inline-flex rounded-full border border-slate-200 bg-white p-[2px] shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
    : 'inline-flex rounded-full border border-slate-200 bg-white p-[3px] shadow-sm';
  const buttonClasses = compact
    ? 'h-7 min-w-[48px] rounded-full px-3 text-[11px]'
    : 'h-9 min-w-[56px] rounded-full px-3 text-xs';

  return (
    <div className={`${frameClasses} ${className}`.trim()} role="group" aria-label={locale === 'zh' ? '语言切换' : 'Language switch'}>
      <button
        className={`${buttonClasses} font-semibold leading-none transition ${locale === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        type="button"
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        className={`${buttonClasses} font-semibold leading-none transition ${locale === 'zh' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        type="button"
        onClick={() => onChange('zh')}
      >
        中文
      </button>
    </div>
  );
}
