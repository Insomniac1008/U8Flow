import type { PropsWithChildren } from 'react';

type SharedResourceOwnerBadgeProps = PropsWithChildren<{
  userId?: string;
  currentUserId?: string;
  currentUserNickname?: string;
  ownerNickname?: string;
}>;

/** Preserves the community edition's nickname-based shared badge. */
export function SharedResourceOwnerBadge({
  children,
  currentUserNickname,
}: SharedResourceOwnerBadgeProps) {
  if (typeof children === 'string' && currentUserNickname === children) {
    return null;
  }

  return (
    <span
      title={typeof children === 'string' ? children : undefined}
      className="inline-block max-w-[120px] truncate align-middle bg-bg-card border-0.5 border-border-button rounded-md px-1.5 py-0.5 text-xs text-text-secondary"
    >
      {children}
    </span>
  );
}
