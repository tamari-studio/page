# Tamari: sales lines

Draft, 2026-11-23. It goes with `tamari-history.md`. Every line below rests on something the product
does today; the proof is in brackets.

## Chosen lines (owner's pick, 2026-11-23)

1. **Your team's side projects deserve a home.**
2. **Ship the tool, not the infrastructure.**
3. **Tools outlive the person who built them.**
4. **Stop paying for ten small apps. Build the three you need.**

## The problem, said once

Every team is building its own small tools now. One person has a dashboard on localhost, another a
Claude artifact, someone else a Vercel preview that only they know the link to. Each one works and
each one is alone: its own login, its own copy of the data, its own API key in a `.env`. When the
person who built it moves on, the tool stops working and nobody notices.

**Name for it:** tool sprawl. The everyday words are "the localhost graveyard" and "the artifact
pile".

## The positioning line

> Everybody is building their own tools now. Tamari is where they live together: one sign-in, one
> set of permissions, one pool of data, so every tool someone builds makes the whole team faster.

Short form: **Build it alone. Use it together.**

## Headlines

1. **Your team's side projects deserve a home.**
2. **Stop shipping tools to localhost.**
3. **Every tool you build makes the next one easier.** (They share data, sign-in and a design kit.)
4. **From artifact to everyone's tool in one push.** (A space is a folder in your repo; push and it
   deploys.)
5. **Vibe-coded, team-owned.**
6. **One place for all the software your team writes for itself.**

## For engineers

The pitch: you keep writing code. You stop writing auth, hosting, permissions and settings pages
for every small tool.

- **Write the tool, skip the plumbing.** Sign-in, roles, hosting and a database are already there.
  A space is views, widgets and `*.server.ts` functions in one folder.
- **Your API keys never reach the browser.** Data access runs in server functions, and keys live on
  the Connectors page, not in someone's `.env`.
- **Permissions you don't have to build.** Row level security and space access by role, department
  or person. Hidden means hidden, for people and for agents.
- **Your agent already knows the format.** The repo ships the rules (`AGENTS.md`,
  `docs/space-design.md`, a UI kit), so what Claude Code builds looks and behaves like the rest.
- **Your AI reads the same data your team sees.** One MCP connection, with the same access as the
  person who connected it, and search across every shared record (on branch `feat/search-records`,
  not merged yet).
- **It's TypeScript and git, not a no-code box.** React, Bun, Postgres, tests, pull requests,
  tagged releases. You can read and change all of it.

One-liners:
- "Ship the tool, not the infrastructure."
- "`git push` is your deploy button. The sign-in page is already done."
- "Build on localhost. Live in Tamari."

## For startup teams

The pitch: the tools your people build stop being private experiments and become shared,
maintained parts of how the company works.

- **One login for every internal tool.** No more "who has the link?".
- **Tools outlive the person who built them.** They live in the company's repo and database, not on
  a laptop or a personal account.
- **Everyone sees what they need, nothing more.** Roles and departments decide who sees which space.
- **Work adds up instead of piling up.** Shared data, notes and change history collect in one
  place, and anyone (or their AI) can find them with one search.
- **Start from a template, not a blank page.** Ready-made spaces for agencies, startups, events,
  go-to-market and product teams.
- **Your data stays yours.** Each company gets its own copy and its own database.

One-liners:
- "Less tabs. More team."
- "Your team builds the tools. Tamari keeps them running."
- "Stop paying for ten small apps. Build the three you need."

## Answers to the usual pushback

- **"We already have Notion, Linear, Retool…"** Keep them. Tamari is for the tools those products
  don't have, the ones your team builds itself, and it brings their data in through connectors.
- **"Why not just deploy each tool to Vercel?"** Because then each one needs its own sign-in,
  permissions, secrets and someone to look after it. In Tamari they share all of that and stay in
  one place.
- **"Is vibe-coded software safe to run?"** Space code reaches data only through server functions
  that check every argument, under row level security, and secrets never reach the browser. The
  rules ship with the repo, so your agent follows them too.
- **"Who maintains it?"** The shell updates through tagged releases (`miso update`). Your spaces
  are small folders in one repo, so anyone on the team, or their agent, can pick one up.

## Don't claim (not true yet)

- No whiteboard, chat or email. Don't sell an all-in-one suite.
- No one-click import of an existing artifact or localhost app. You rebuild it as a space, usually
  with your agent.
- No hosted sign-up yet. Hosted Supabase and a public sign-up aren't live.
- No AI included. People connect the AI they already use.
