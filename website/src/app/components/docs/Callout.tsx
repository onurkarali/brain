import { ReactNode } from "react";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "danger";
  title?: string;
  children: ReactNode;
}

const styles = {
  info: {
    container: "border-blue-500/30 bg-blue-500/5",
    icon: "text-blue-400",
    title: "text-blue-400",
  },
  warning: {
    container: "border-yellow-500/30 bg-yellow-500/5",
    icon: "text-yellow-400",
    title: "text-yellow-400",
  },
  tip: {
    container: "border-emerald-500/30 bg-emerald-500/5",
    icon: "text-emerald-400",
    title: "text-emerald-400",
  },
  danger: {
    container: "border-red-500/30 bg-red-500/5",
    icon: "text-red-400",
    title: "text-red-400",
  },
};

const icons = {
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  tip: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  danger: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

const defaultTitles = {
  info: "Info",
  warning: "Warning",
  tip: "Tip",
  danger: "Danger",
};

export default function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  const style = styles[type];
  const displayTitle = title ?? defaultTitles[type];

  return (
    <div
      className={`my-6 rounded-lg border p-4 ${style.container}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={style.icon}>{icons[type]}</span>
        <span className={`text-sm font-semibold ${style.title}`}>
          {displayTitle}
        </span>
      </div>
      <div className="text-sm text-gray-300 [&>p]:mb-0">{children}</div>
    </div>
  );
}
