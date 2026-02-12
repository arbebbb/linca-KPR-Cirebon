"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Calculator, Gavel, FileCheck, ClipboardCheck, ArrowUpRight, Wrench } from "lucide-react";

const TOOLS = [
  {
    title: "Kalkulator KPR",
    description: "Hitung simulasi KPR kekinian",
    href: "https://hitungkprkekinian.my.canva.site/",
    icon: Calculator,
    accent: "yellow",
  },
  {
    title: "Pendaftaran KPR Mandiri",
    description: "Form pendaftaran KPR Mandiri untuk nasabah secara online.",
    href: "https://hitungkprkekinian.my.canva.site/onhandcab",
    icon: FileCheck,
    accent: "emerald",
  },
  {
    title: "KPR Lelang",
    description: "Dokumen KPR Lelang",
    href: "https://drive.google.com/file/d/1p9edbZ386XOIhb8VyK79lKHJFOeGix0r/view",
    icon: Gavel,
    accent: "navy",
  },
  {
    title: "Form Aplikasi KPR",
    description: "Form pengajuan aplikasi KPR",
    href: "https://drive.google.com/file/d/1M7vPWPpVeFDFKztlBiDeTt264CjLye0H/view",
    icon: FileCheck,
    accent: "emerald",
  },
  {
    title: "Checklist Subsidi (FLPP)",
    description: "Checklist untuk subsidi FLPP",
    href: "https://drive.google.com/file/d/145lNqxdvcq5-g3HCCSpgwBhlCk27-OQU/view",
    icon: ClipboardCheck,
    accent: "violet",
  },
  {
    title: "Checklist Primary",
    description: "Menyusul",
    href: null,
    icon: ClipboardCheck,
    comingSoon: true,
    accent: "slate",
  },
];

const ACCENT_STYLES: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
  yellow: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600",
    border: "border-amber-200 hover:border-amber-400",
    hover: "hover:bg-amber-500/5 group-hover:shadow-amber-500/10",
  },
  navy: {
    bg: "bg-[#1e3a5f]/10",
    icon: "text-[#1e3a5f]",
    border: "border-slate-200 hover:border-[#1e3a5f]/40",
    hover: "hover:bg-[#1e3a5f]/5 group-hover:shadow-[#1e3a5f]/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600",
    border: "border-emerald-200 hover:border-emerald-400",
    hover: "hover:bg-emerald-500/5 group-hover:shadow-emerald-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "text-violet-600",
    border: "border-violet-200 hover:border-violet-400",
    hover: "hover:bg-violet-500/5 group-hover:shadow-violet-500/10",
  },
  slate: {
    bg: "bg-slate-100",
    icon: "text-slate-400",
    border: "border-slate-200 border-dashed",
    hover: "",
  },
};

export default function AdminToolsKPRPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700 mb-4">
          <Wrench className="h-4 w-4" />
          <span>Tools</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1e3a5f]">
          Tools KPR
        </h1>
        <p className="mt-2 text-lg text-slate-600 max-w-xl">
          Kalkulator, form, dan checklist terkait KPR. Klik untuk membuka tool atau dokumen.
        </p>
      </header>

      {/* Tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isComingSoon = tool.comingSoon || !tool.href;
          const styles = ACCENT_STYLES[tool.accent] ?? ACCENT_STYLES.slate;

          if (isComingSoon) {
            return (
              <Card
                key={tool.title}
                className={`overflow-hidden border-2 ${styles.border} bg-white/80 backdrop-blur-sm transition-shadow`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${styles.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-700">{tool.title}</h3>
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Menyusul
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Link
              key={tool.title}
              href={tool.href!}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              className="group block"
            >
              <Card
                className={`h-full overflow-hidden border-2 bg-white shadow-sm transition-all duration-200 ${styles.border} ${styles.hover} hover:shadow-lg`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:scale-105 ${styles.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${styles.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-800 group-hover:text-[#1e3a5f] transition-colors">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {tool.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
                        <span>Buka</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
