"use client";

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalPanel({ title, children, className = "" }: Props) {
  return (
    <div className={`term-panel ${className}`}>
      <div className="term-header">{title}</div>
      <div className="term-body">{children}</div>
    </div>
  );
}
