interface TeamCardProps {
  name: string;
  role: string;
  accent: string;
}

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function TeamCard({ name, role, accent }: TeamCardProps): JSX.Element {
  return (
    <article className="card interactive-lift p-6 hover:bg-[rgba(247,245,240,0.7)]">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full data-mono text-sm font-semibold text-[var(--text-primary)]"
        style={{ backgroundColor: accent }}
      >
        {getInitials(name)}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{name}</h3>
      <p className="data-mono mt-2 text-sm text-[var(--text-muted)]">{role}</p>
    </article>
  );
}

export default TeamCard;
