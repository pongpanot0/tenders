'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Search,
  List,
  Bell,
  User,
  Settings,
  Book,
  MessageCircle,
  MoreVertical,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const primaryNavItems: NavItem[] = [
  { label: 'Inbox', href: '/inbox', icon: <Target size={16} /> },
  { label: 'Explore', href: '/explore', icon: <Search size={16} /> },
  { label: 'Pipeline', href: '/pipeline', icon: <List size={16} /> },
  { label: 'Alerts', href: '/alerts', icon: <Bell size={16} /> },
];

const accountNavItems: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: <User size={16} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
];

const bottomNavItems: NavItem[] = [
  { label: 'Docs', href: '/docs', icon: <Book size={16} /> },
  { label: 'Feedback', href: '/feedback', icon: <MessageCircle size={16} /> },
];

const mobileNavItems: NavItem[] = [
  { label: 'Inbox', href: '/inbox', icon: <Target size={20} /> },
  { label: 'Explore', href: '/explore', icon: <Search size={20} /> },
  { label: 'Pipeline', href: '/pipeline', icon: <List size={20} /> },
  { label: 'Alerts', href: '/alerts', icon: <Bell size={20} /> },
  { label: 'More', href: '/settings', icon: <MoreVertical size={20} /> },
];

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 px-4 py-3 text-sm border-l-2 rounded-r-sm transition-all ${
        isActive
          ? 'border-l-accent bg-accent/5 text-accent font-medium'
          : 'border-l-transparent text-ink-muted hover:bg-surface-raised hover:text-ink'
      }`}
      data-testid={`nav-item-${item.label.toLowerCase()}`}
      data-active={isActive}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function MobileNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-sm transition-all flex-1 text-center ${
        isActive
          ? 'text-accent bg-accent/5'
          : 'text-ink-faint hover:text-accent hover:bg-accent/5'
      }`}
      data-testid={`mobile-nav-item-${item.label.toLowerCase()}`}
      data-active={isActive}
    >
      {item.icon}
      <span className="text-xs">{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className="hidden lg:flex h-16 border-b border-rule bg-surface px-8 items-center justify-between shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2 font-display text-base font-bold text-accent whitespace-nowrap">
            <Target size={20} />
            Tender Intelligence
          </div>

          {/* Org Selector */}
          <select
            className="px-3 py-2 text-sm bg-surface-raised border border-rule rounded-sm text-ink cursor-pointer min-w-32"
            defaultValue="Acme Software"
          >
            <option>Acme Software</option>
          </select>

          {/* Search Box */}
          <div className="flex-1 max-w-96 px-4 py-2 bg-surface-raised border border-rule rounded-md text-sm text-ink-muted flex items-center gap-2">
            <span>Search tenders...</span>
            <span className="ml-auto text-xs text-ink-faint font-mono">⌘K</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          <button className="text-sm text-ink-muted hover:text-ink cursor-pointer">
            ? Help
          </button>
          <div className="w-9 h-9 bg-surface-raised border border-rule rounded-md flex items-center justify-center text-sm cursor-pointer font-medium">
            A
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:flex flex-col w-58 border-r border-rule bg-surface px-4 py-6 gap-8 overflow-y-auto">
          {/* Primary Section */}
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-ink-faint uppercase px-2 py-3 tracking-wider">
              Primary
            </div>
            {primaryNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Account Section */}
          <div className="flex flex-col gap-1">
            <div className="text-xs font-semibold text-ink-faint uppercase px-2 py-3 tracking-wider">
              Account
            </div>
            {accountNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Section */}
          <div className="flex flex-col gap-1">
            {bottomNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-canvas">
          <div className="p-8 lg:p-8">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden flex h-15 border-t border-rule bg-surface justify-around px-3 py-3 shadow-sm">
        {mobileNavItems.map((item) => (
          <MobileNavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </div>
  );
}
