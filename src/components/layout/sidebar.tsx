'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Settings,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

const navigation = [
  {
    name: 'ダッシュボード',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: '企業一覧',
    href: '/companies',
    icon: Building2,
  },
];

const futureNavigation = [
  {
    name: 'ターゲット設定',
    href: '/targets',
    icon: Target,
    disabled: true,
    badge: 'Phase 2',
  },
  {
    name: 'データ充実化',
    href: '/enrich',
    icon: Sparkles,
    disabled: true,
    badge: 'Phase 1',
  },
  {
    name: '設定',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">RookieSmart DATA</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'h-8 w-8 shrink-0',
            collapsed && 'absolute -right-3 top-6 bg-background border shadow-sm'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              メイン
            </p>
          )}
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              拡張機能
            </p>
          )}
          {futureNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-foreground">RookieSmart DATA</p>
            <p className="text-xs text-muted-foreground mt-1">
              企業データベース管理
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
