# Maintainers

This document covers maintainer-only workflow notes that do not belong in the public project README.

## Release updates

GitHub Releases are the main user-facing update channel for OpenSEO.

- Ask interested users to watch the repo and enable release notifications.
- Do not treat stars as a contact list; GitHub does not expose a way to message stargazers directly.

## Release notes workflow

Before drafting release notes, confirm `package.json` has the intended release version. The latest published release note file should match the current version tag.

Generate notes from commits since the latest semver tag:

```sh
pnpm release:notes
```

Useful variants:

```sh
pnpm release:notes -- --from <tag> --to HEAD
pnpm release:notes -- --draft v<version>
```

Supported inputs:

- `--from <tag>`: start changelog generation from a specific tag
- `--to <ref>`: end at a specific ref, default is `HEAD`
- `--draft <tag>`: create a GitHub draft release for that tag using the generated notes
- `--repo <owner/repo>`: override the GitHub repo
- `--help`: show help

The generator:

- uses commits since the latest semver tag by default
- filters out maintenance-only commits like `chore:`, `ci:`, `test:`, `build:`, and `release:`
- groups the remaining changes into short user-facing sections
- can create a draft GitHub release when `--draft` is provided

Store finalized notes in `release-notes/` as versioned Markdown files such as `release-notes/v<version>.md`.

Recommended release flow:

```sh
pnpm -s release:notes
# edit and save the final copy in release-notes/v<version>.md
gh release create v<version> --target main --title v<version> --notes-file release-notes/v<version>.md
```

For now, prefer patch releases while the project is still in rapid early development unless there is a clear reason to cut a minor or major release.

## OpenCode slash command

For convenience inside OpenCode, use:

```text
/release-notes
```

The command definition lives at `.opencode/command/release-notes.md` and forwards any extra arguments to the same generator script.

## Documentation upkeep

Keep these docs aligned when project structure, commands, or deployment behavior changes:

- `README.md`: user-facing setup, self-hosting summary, local development, and cost reference.
- `AGENTS.md`: coding-agent and contributor operating rules.
- `docs/PROJECT_STRUCTURE.md`: repository map and ownership boundaries.
- `docs/SELF_HOSTING_DOCKER.md`: Docker-specific setup and update flow.
- `docs/SELF_HOSTING_CLOUDFLARE.md`: Cloudflare Deploy button flow, Access, MCP, and update guidance.
- `.opencode/command/*.md`: OpenCode slash commands.

When updating DataForSEO cost guidance, verify current public pricing first and include the date of the check in the README.
