"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavCategories } from "@/lib/docs";

export default function DocsNav() {
  const pathname = usePathname();
  const categories = getNavCategories();

  function isActive(href: string) {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/docs";
    const normalizedHref = href.replace(/\/+$/, "") || "/docs";
    return normalizedPathname === normalizedHref;
  }

  return (
    <nav className="space-y-7">
      {categories.map((category) => (
        <div key={category.name}>
          <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            {category.name}
          </h3>
          <ul className="space-y-0.5">
            {category.pages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={`block rounded px-2 py-1 text-sm transition-colors ${
                    isActive(page.href)
                      ? "text-[var(--text-primary)] font-medium bg-[var(--surface-2)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
