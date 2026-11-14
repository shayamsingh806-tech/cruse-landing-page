import { Link } from "@tanstack/react-router";
import { comboLinks } from "@/lib/combos";

export function ExperienceLink({ slug, children, className, onClick }: { slug: string; children: React.ReactNode; className?: string | undefined; onClick?: (() => void) | undefined }) {
  const combo = comboLinks.find(([, path]) => path === `/combos/${slug}`);
  return combo
    ? <Link to={combo[1]} className={className} onClick={onClick}>{children}</Link>
    : <Link to="/experiences/$slug" params={{ slug }} className={className} onClick={onClick}>{children}</Link>;
}