'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:apple-glass group-[.toaster]:rounded-2xl group-[.toaster]:text-text-primary',
          description: 'group-[.toast]:text-text-secondary',
          actionButton:
            'group-[.toast]:bg-accent-primary group-[.toast]:text-white group-[.toast]:rounded-lg',
          cancelButton:
            'group-[.toast]:bg-bg-card group-[.toast]:text-text-secondary group-[.toast]:rounded-lg',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
