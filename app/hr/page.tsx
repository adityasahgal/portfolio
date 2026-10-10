import type { Metadata } from "next";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  return { title: `${profile.name} — Recruiter Profile`, description: profile.tagline };
}

export default async function HrPage() {
  const { profile, contact, hr, stats, skills, experience, projects } = await getContent();

  const facts: [string, string][] = (
    [
      ["Availability", hr.availability],
      ["Notice period", hr.noticePeriod],
      ["Work mode", hr.workMode],
      ["Location", profile.location],
      ["Relocation", hr.relocation],
      ["Engagement", hr.employmentTypes.join(", ")],
      ["Languages", hr.languages.join(", ")],
    ] as [string, string][]
  ).filter(([, v]) => v);

  const links = (
    [
      ["Email", contact.email && `mailto:${contact.email}`, contact.email],
      ["Phone", contact.phone && `tel:${contact.phone}`, contact.phone],
      ["LinkedIn", contact.linkedin, contact.linkedin],
      ["GitHub", contact.github, contact.github],
      ["Website", contact.website, contact.website],
    ] as [string, string, string][]
  ).filter(([, h]) => h);

  return (
    <div className="page hr">
      <div className="hr-wrap">
        <nav className="hr-nav">
          <a href="/">← Back to terminal</a>
          <span>Recruiter profile</span>
        </nav>

        <header className="hr-head">
          <div className="hr-photo">
            {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span>{profile.name.slice(0, 2)}</span>}
          </div>
          <div className="hr-id">
            <h1>{profile.name.charAt(0) + profile.name.slice(1).toLowerCase()}</h1>
            <p className="hr-role">{profile.role}</p>
            <p className="hr-tag">{profile.tagline}</p>
            {hr.availability && <span className="hr-badge">{hr.availability}</span>}
          </div>
          <div className="hr-cta">
            {contact.email && <a className="btn primary" href={`mailto:${contact.email}`}>Contact</a>}
            {profile.resume && <a className="btn" href={profile.resume} download>Download résumé</a>}
          </div>
        </header>

        {stats.length > 0 && (
          <section className="hr-stats">
            {stats.map((s) => (
              <div key={s.id}><b>{s.value}</b><span>{s.label}</span></div>
            ))}
          </section>
        )}

        <div className="hr-grid">
          <div>
            {hr.summary && (
              <section className="card">
                <h2>Summary</h2>
                <p>{hr.summary}</p>
              </section>
            )}

            {experience.length > 0 && (
              <section className="card">
                <h2>Experience</h2>
                <ol className="timeline">
                  {experience.map((e) => (
                    <li key={e.id}>
                      <div className="tl-head">
                        <strong>{e.title}</strong> · {e.org}
                        <span>{[e.period, e.location].filter(Boolean).join(" · ")}</span>
                      </div>
                      <ul>{e.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {projects.length > 0 && (
              <section className="card">
                <h2>Selected projects</h2>
                <div className="proj-grid">
                  {projects.map((p) => (
                    <article key={p.id}>
                      {p.image && <img src={p.image} alt="" />}
                      <h3>{p.name}</h3>
                      <p className="muted small">{p.stack}</p>
                      <p>{p.summary}</p>
                      {p.impact.length > 0 && <ul>{p.impact.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                      <div className="proj-links">
                        {p.link && <a href={p.link} target="_blank" rel="noreferrer">Live ↗</a>}
                        {p.repo && <a href={p.repo} target="_blank" rel="noreferrer">Code ↗</a>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside>
            {facts.length > 0 && (
              <section className="card">
                <h2>At a glance</h2>
                <dl className="facts">
                  {facts.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </section>
            )}

            {hr.preferredRoles.length > 0 && (
              <section className="card">
                <h2>Target roles</h2>
                <div className="tags">{hr.preferredRoles.map((r) => <span key={r}>{r}</span>)}</div>
              </section>
            )}

            {skills.length > 0 && (
              <section className="card">
                <h2>Technical skills</h2>
                {skills.map((g) => (
                  <div className="skill-group" key={g.id}>
                    <h3>{g.category}</h3>
                    {g.items.map((s) => (
                      <div className="skill" key={s.name}>
                        <span>{s.name}</span>
                        <div className="meter"><i style={{ width: `${s.level}%` }} /></div>
                        <em>{s.level}%</em>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            )}

            {links.length > 0 && (
              <section className="card">
                <h2>Contact</h2>
                <dl className="facts">
                  {links.map(([k, h, label]) => (
                    <div key={k}><dt>{k}</dt><dd><a href={h} target="_blank" rel="noreferrer">{label.replace(/^https?:\/\/(www\.)?/, "")}</a></dd></div>
                  ))}
                </dl>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
