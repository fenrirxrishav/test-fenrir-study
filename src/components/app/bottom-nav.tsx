
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, LayoutDashboard, Book, History, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Timer', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/subjects', label: 'Subjects', icon: Book },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  // Hide nav on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 h-20 md:hidden">
        <div className="w-full h-full bg-background/80 backdrop-blur-lg border-t">
          <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200',
                  pathname === route.href ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <route.icon className="h-5 w-5" />
                <span>{route.label}</span>
              </Link>
            ))}
          </div>
        </div>
    </div>
  );
}
