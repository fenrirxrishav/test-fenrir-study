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

interface StyleSelectorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const styles = [
    { id: 'default', name: 'Default', colors: { primary: '215 85% 55%', background: '0 0% 100%', accent: '210 40% 96.1%' } },
    { id: 'forest', name: 'Forest', colors: { primary: '158 64% 52%', background: '120 60% 97%', accent: '158 24% 88%' } },
    { id: 'ocean', name: 'Ocean', colors: { primary: '205 90% 55%', background: '210 100% 98%', accent: '205 50% 92%' } },
    { id: 'sunset', name: 'Sunset', colors: { primary: '20 90% 60%', background: '30 100% 97%', accent: '25 80% 90%' } },
];

export function StyleSelector({ isOpen, onOpenChange }: StyleSelectorProps) {
  
  const handleStyleChange = (style: typeof styles[0]) => {
      // This is a simplified example. A real implementation would likely
      // use a global state management solution (like Context or Zustand)
      // to update the theme across the entire application.
      // For now, we'll just log to the console.
      console.log("Selected style:", style.name);

      // Example of how to change CSS variables directly
      document.documentElement.style.setProperty('--primary', style.colors.primary);
      document.documentElement.style.setProperty('--background', style.colors.background);
      document.documentElement.style.setProperty('--accent', style.colors.accent);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Select Timer Style</SheetTitle>
          <SheetDescription>
            Choose a visual theme for your timer.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
            {styles.map(style => (
                <Button key={style.id} variant="outline" className="w-full justify-start h-14" onClick={() => handleStyleChange(style)}>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                           <div className="h-8 w-8 rounded-full" style={{backgroundColor: `hsl(${style.colors.primary})`}}></div>
                           <div className="h-8 w-8 rounded-full" style={{backgroundColor: `hsl(${style.colors.accent})`}}></div>
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
