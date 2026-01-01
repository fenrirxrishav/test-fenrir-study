'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Timer' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/subjects', label: 'Subjects' },
    { href: '/history', label: 'History' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav
      className={cn('hidden items-center space-x-4 md:flex lg:space-x-6', className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === route.href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
