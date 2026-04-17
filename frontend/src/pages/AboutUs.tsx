import TeamCard from "../components/about/TeamCard";
import { Zap } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  accent: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "J Navaneetha Krishnaa",
    role: "Team Lead",
    accent: "var(--pastel-blue)",
  },
  {
    name: "Alfred Mathew",
    role: "Systems Architect, Frontend & Visualization",
    accent: "var(--pastel-green)",
  },
  {
    name: "Pathmajam Suresh",
    role: "Data Engineering and Machine Learning",
    accent: "var(--pastel-yellow)",
  },
  {
    name: "Sushree Sonali Patra",
    role: "Backend and Agent Integration",
    accent: "var(--pastel-lavender)",
  },
];

function AboutUs(): JSX.Element {
  return (
    <div className="fade-in space-y-5">
      <section className="card p-8">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-[var(--pastel-blue)]" aria-hidden="true" />
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">VoltWise</h1>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          AI-Driven Energy Trading Intelligence for Indian Power Markets
        </p>
        <span className="mt-4 inline-block rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-primary)]">
          Cognizant Technoverse 2026 · Team Luminaries
        </span>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {teamMembers.map((member) => (
          <TeamCard key={member.name} name={member.name} role={member.role} accent={member.accent} />
        ))}
      </section>
    </div>
  );
}

export default AboutUs;
