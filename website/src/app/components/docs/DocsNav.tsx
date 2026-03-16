"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavCategories } from "@/lib/docs";

export default function DocsNav() {
  const pathname = usePathname();
  const categories = getNavCategories();

  function isActive(href: string) {
    // Normalize: strip trailing slashes for comparison
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/docs";
    const normalizedHref = href.replace(/\/+$/, "") || "/docs";
    return normalizedPathname === normalizedHref;
  }

  return (
    <nav className="space-y-6">
      {categories.map((category) => (
        <div key={category.name}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {category.name}
          </h3>
          <ul className="space-y-1">
            {category.pages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive(page.href)
                      ? "bg-amber-500/10 text-amber-400 font-medium"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
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
