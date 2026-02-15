'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="企業を検索..."
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>
    </header>
  );
}
