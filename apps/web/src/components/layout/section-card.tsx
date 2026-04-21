import { cn } from "@/lib/utils";

export function SectionCard(props: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-(--line) p-6 shadow-[0_18px_60px_rgba(48,31,18,0.08)]',
        props.className ?? '')}
    >
      {props.children}
    </div>
  );
}
