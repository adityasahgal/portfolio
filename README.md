# Aditya — Hacker Portfolio (Next.js)

Flow: **Boot / breach logs → Laptop lid open + "WELCOME" glitch → Mission briefing (instructions) → Interactive terminal**

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Content edit
Sab content `data/profile.ts` me hai — naam, about, skills, projects, experience, contact.
`contact` me abhi placeholder email/github/linkedin hain, apne real links daal do.

## Files
- `components/Boot.tsx` — fake kernel logs + red "SYSTEM BREACHED" alarm
- `components/Laptop.tsx` — CSS 3D laptop, lid opens, skull + glitch welcome, Enter → zoom into screen
- `components/Instructions.tsx` — typewriter briefing (Enter = skip/continue)
- `components/Terminal.tsx` — terminal: help, about, skills, projects, project <id>, experience, contact, open <x>, history, clear, exit
  - Hidden: sudo, hack, whoami, ls, date, echo, matrix, rm, coffee
  - TAB autocomplete, ↑/↓ history, Ctrl+L clear
- `components/MatrixRain.tsx` — background canvas rain
- `app/globals.css` — saari styling (colors `:root` me)

Intro ek baar dekhne ke baad same tab session me seedha terminal khulega. `exit` command se intro dobara.

## Deploy
Vercel pe push karo → zero config.
