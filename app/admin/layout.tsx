"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken, verifyToken } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { AuthUser } from "@/lib/types";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Aplikasi",
    href: "/admin/applications",
    icon: FileText,
  },
  // {
  //   title: "Staging",
  //   href: "/admin/stagings",
  //   icon: FileText,
  // },
  {
    title: "Tools KPR",
    href: "/admin/tools-kpr",
    icon: Wrench,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, logout: authLogout } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAplikasiOpen, setIsAplikasiOpen] = useState(() =>
    pathname.startsWith("/admin/applications") || pathname.startsWith("/admin/staging")
  );

  const stagingLinks = [
    /* Ubah tampilan "Onhand" jadi "Cair" */
    {
      title: "Cair",
      href: "/admin/staging/onhand",
    },
    {
      title: "Akad",
      href: "/admin/staging/akad",
    },
    {
      title: "SPPK",
      href: "/admin/staging/sppk",
    },
    {
      title: "Inproses",
      href: "/admin/staging/inproses",
    },
    {
      title: "Reject/Cancel",
      href: "/admin/staging/reject-cancel",
    },
  ];

  // Sync layout user from auth context when it becomes available (e.g. after login)
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  // Check authentication (token + verify); only layout controls redirects
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        authLogout();
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        setIsLoading(false);
        return;
      }

      try {
        const response = await verifyToken();
        if (response.valid) {
          setUser(response.user);
          if (pathname === "/admin/login") {
            router.push("/admin/dashboard");
          }
        } else {
          authLogout();
          if (pathname !== "/admin/login") {
            router.push("/admin/login");
          }
        }
      } catch {
        authLogout();
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, authLogout]);

  const handleLogout = () => {
    authLogout();
    setUser(null);
    toast.success("Berhasil logout");
    router.push("/admin/login");
  };

  // Don't show layout for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-yellow-500" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white text-gray-900 shadow-lg border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <img src="/logotp.png" alt="LINCA Logo" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 flex flex-col h-screen bg-white text-gray-900 border-r shadow-lg transform transition-transform duration-200 ease-in-out
            lg:translate-x-0 lg:sticky lg:top-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Logo */}
          <div className="hidden lg:flex shrink-0 items-center justify-center px-6 py-5 border-b border-gray-200">
            <img src="/logotp.png" alt="LINCA Logo" className="w-full h-auto max-h-12 object-contain" />
          </div>

          {/* Navigation - scrolls if many items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 mt-12 lg:mt-0 min-h-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              if (item.title === "Aplikasi") {
                const isParentActive =
                  pathname.startsWith("/admin/applications") ||
                  pathname.startsWith("/admin/staging");

                return (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          isParentActive
                            ? "bg-yellow-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">Aplikasi</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsAplikasiOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                    >
                      <span>Staging</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isAplikasiOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isAplikasiOpen && (
                      <div className="mt-1 space-y-1 pl-6 border-l border-gray-200">
                        {stagingLinks.map((staging) => {
                          const isChildActive = pathname === staging.href;
                          return (
                            <Link
                              key={staging.href}
                              href={staging.href}
                              prefetch={false}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
                                ${
                                  isChildActive
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "text-gray-600 hover:bg-gray-50"
                                }
                              `}
                            >
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                              <span>{staging.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-yellow-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions - sticky at bottom of sidebar */}
          <div className="shrink-0 mt-auto p-4 border-t border-gray-200 space-y-2 bg-white">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Ke Dashboard Publik
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
            <div className="px-4 py-2 text-sm text-gray-500">
              Login sebagai: {user.username}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
