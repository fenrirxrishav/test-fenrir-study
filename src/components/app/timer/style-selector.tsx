
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface StyleSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const styles = [
    { 
      id: 'default', 
      name: 'Default', 
      light: { primary: '215 85% 55%', background: '0 0% 100%', accent: '210 40% 96.1%', card: '0 0% 100%' },
      dark: { primary: '215 85% 55%', background: '224 71% 4%', accent: '217.2 32.6% 17.5%', card: '224 71% 4%' },
    },
    { 
      id: 'forest', 
      name: 'Forest',
      light: { primary: '158 64% 52%', background: '120 60% 97%', accent: '158 24% 88%', card: '120 60% 97%' },
      dark: { primary: '158 64% 52%', background: '160 50% 5%', accent: '158 34% 15%', card: '160 50% 5%' },
    },
    { 
      id: 'ocean', 
      name: 'Ocean', 
      light: { primary: '205 90% 55%', background: '210 100% 98%', accent: '205 50% 92%', card: '210 100% 98%' },
      dark: { primary: '205 90% 55%', background: '220 60% 6%', accent: '215 40% 16%', card: '220 60% 6%' },
    },
    { 
      id: 'sunset', 
      name: 'Sunset', 
      light: { primary: '20 90% 60%', background: '30 100% 97%', accent: '25 80% 90%', card: '30 100% 97%' },
      dark: { primary: '20 90% 60%', background: '20 40% 5%', accent: '20 30% 15%', card: '20 40% 5%' },
    },
    { 
      id: 'matrix', 
      name: 'Matrix', 
      light: { primary: '130 100% 40%', background: '0 0% 95%', accent: '0 0% 80%', card: '0 0% 95%' },
      dark: { primary: '130 100% 50%', background: '0 0% 2%', accent: '130 50% 10%', card: '0 0% 2%' },
    },
];

export function StyleSelector({ isOpen, onOpenChange }: StyleSelectorProps) {
  const { theme: mode } = useTheme();

  const handleStyleChange = (style: typeof styles[0]) => {
      const isDark = mode === 'dark';
      const selectedTheme = isDark ? style.dark : style.light;

      const root = document.documentElement;
      root.style.setProperty('--primary', selectedTheme.primary);
      root.style.setProperty('--background', selectedTheme.background);
      root.style.setProperty('--accent', selectedTheme.accent);
      root.style.setProperty('--card', selectedTheme.card);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Select Timer Style</SheetTitle>
          <SheetDescription>
            Choose a visual theme for your timer. These styles adapt to light and dark mode.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
            {styles.map(style => (
                <Button key={style.id} variant="outline" className="w-full justify-start h-14" onClick={() => handleStyleChange(style)}>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                           <div className="h-8 w-8 rounded-full border" style={{backgroundColor: `hsl(${style.light.primary})`}}></div>
                           <div className="h-8 w-8 rounded-full border" style={{backgroundColor: `hsl(${style.dark.primary})`}}></div>
                        </div>
                        <span>{style.name}</span>
                    </div>
                </Button>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
