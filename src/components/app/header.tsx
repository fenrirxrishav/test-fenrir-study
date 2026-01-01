import { MainNav } from './main-nav';
import { UserNav } from './user-nav';
import { ThemeToggle } from './theme-toggle';
import { BookOpenCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <BookOpenCheck className="mr-2 h-6 w-6" />
          <span className="font-bold">StudyFlow</span>
        </div>
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
