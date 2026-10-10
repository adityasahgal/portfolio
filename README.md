# Aditya — Portfolio

A hacker-themed developer portfolio built with Next.js. It opens with a cinematic intrusion sequence, then lands on a full portfolio with a macOS-style interactive terminal, a recruiter-friendly profile page, and a password-protected CMS for managing every piece of content.

## Features

- **Intro sequence:** a boot log, a "root access granted" alarm, a laptop welcome screen, and a typed mission briefing. All of the text can be edited from the CMS, and the intro can be turned off.
- **Command center:** the main portfolio page. It includes:
  - an interactive particle network
  - a profile photo rendered entirely as live hex code
  - animated skill gauges
  - 3D-tilt project cards with detail modals
  - an experience timeline and a contact section
- **Terminal window:** a draggable, macOS-style window. It has close, minimise-to-dock and zoom controls, plus multiple independent tabs. Open it with the `` ` `` key.
- **Recruiter page (`/hr`):** a clean one-page summary covering availability, notice period, target roles, experience, skills and projects. It is print-friendly.
- **Admin CMS (`/admin`):** manage the profile, photo, résumé, HR details, skills with proficiency levels, experience, projects, metrics, intro text, site copy and the colour theme. Changes go live as soon as you publish.
- **Theming:** five colour presets plus custom colours. The theme drives the intro, site, terminal, recruiter page and admin.

## Tech stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Plain CSS with theme tokens (no UI framework)
- A JSON file as the data store, plus local file uploads. No database is required.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

### Environment variables

| Variable         | Required | Description                                                             |
| ---------------- | -------- | ----------------------------------------------------------------------- |
| `ADMIN_PASSWORD` | Yes      | Password for `/admin`. The CMS stays locked until this is set.          |
| `ADMIN_SECRET`   | No       | Separate secret for signing session cookies. Defaults to the password.  |

## Managing content

1. Open `/admin` and sign in with `ADMIN_PASSWORD`.
2. Edit any tab:
   - **Profile:** name, role, tagline, photo, résumé PDF, contact links
   - **HR:** summary, availability, notice period, work mode, target roles
   - **Skills:** categories, with a proficiency slider for each skill
   - **Experience:** roles, periods and achievements
   - **Projects:** summary, stack, key results, live and repository links, screenshot
   - **Metrics:** headline numbers shown on the home page and the recruiter page
   - **Intro:** boot log lines, alarm banner, welcome screen and briefing text
   - **Appearance:** colour theme and site copy
3. Click **Publish**.

Content is stored in `data/content.json`, and uploaded files go to `uploads/`. Both are read at request time, so no rebuild is needed after editing.

## Terminal commands

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `help`           | List all commands                    |
| `about`          | Profile summary                      |
| `skills`         | Skills with proficiency bars         |
| `projects`       | Project list                         |
| `project <id>`   | Details for a single project         |
| `experience`     | Professional experience              |
| `hr`             | Recruiter summary                    |
| `resume`         | Open the résumé                      |
| `contact`        | Contact channels                     |
| `history`        | Command history                      |
| `clear`          | Clear the screen                     |
| `exit`           | Close the current tab                |

Keyboard shortcuts: `TAB` autocompletes, `↑`/`↓` move through command history, `Ctrl+L` clears the screen, and `Esc` minimises the window. A few commands are undocumented.

## Project structure

```
app/
  page.tsx              Home (intro + command center)
  hr/                   Recruiter profile page
  admin/                CMS entry point
  api/auth/             Login / logout
  api/content/          Read / update content
  api/upload/           File uploads
  uploads/[file]/       Serves uploaded files
  globals.css           Intro, terminal, HR and admin styles
  landing.css           Command center and terminal window styles
components/
  Boot, Laptop, Instructions   Intro sequence
  landing/                     Command center sections and effects
  terminal/                    Terminal window and sessions
  admin/                       CMS interface
lib/
  content.ts            Content model, defaults, themes, validation
  store.ts              JSON file storage
  auth.ts               Session cookies and password check
data/content.json       Site content
```

## Deployment

The CMS writes to `data/content.json` and `uploads/` on disk, so the app needs a host with a **persistent filesystem**. Good options are a VPS, a Docker container with a mounted volume, Railway, Render with a disk, or Fly.io with a volume.

Serverless platforms such as Vercel can serve the site, but changes saved from the admin panel will not persist there.

## Security notes

- Admin sessions use signed, HTTP-only cookies that expire after seven days.
- Uploads are limited to JPG, PNG, WEBP, GIF and PDF files, up to 8 MB each, and are stored under random file names.
- Never commit `.env` or `.env.local`.
