export function SectionCard(props: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        'rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_60px_rgba(48,31,18,0.08)]',
        props.className ?? '',
      ].join(' ')}
    >
      {props.children}
    </div>
  );
}
