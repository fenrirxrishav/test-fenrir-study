
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
    <div className="fixed bottom-0 inset-x-0 z-50 h-24 pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0}}
        animate={{ y: 0, opacity: 1}}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full h-full max-w-sm mx-auto p-4"
      >
        <div className="relative grid h-full grid-cols-5 bg-background/80 backdrop-blur-lg border rounded-full shadow-lg pointer-events-auto">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200 hover:text-primary z-10',
                pathname === route.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <route.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{route.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
