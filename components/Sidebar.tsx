'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navigation = [
  { name: 'Credit Packages', href: '/', icon: '💎' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Transactions', href: '/transactions', icon: '💳' },
  { name: 'Generations', href: '/generations', icon: '🎨' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
  { name: 'Tariffs', href: '/tariffs', icon: '🏷️' },
  { name: 'Broadcasts', href: '/broadcasts', icon: '📢' },
  { name: 'Providers', href: '/providers', icon: '🔌' },
  { name: 'Admin Users', href: '/admin-users', icon: '🔐' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">💎 BananaBot</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
        {session?.user?.name && (
          <p className="text-xs text-gray-500 mt-2">Logged in as: {session.user.name}</p>
        )}
      </div>

      <nav className="px-3 space-y-1 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 w-full transition-colors"
        >
          <span className="text-xl">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}
