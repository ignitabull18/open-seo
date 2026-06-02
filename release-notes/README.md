# Release Notes

Store finalized release notes in this folder as versioned Markdown files.

Recommended naming:

- `release-notes/v<version>.md`

Typical flow:

1. Generate a draft with `pnpm -s run release:notes`.
2. Copy the final edited notes into a versioned file in this folder.
3. Publish with `gh release create <tag> --target main --title <tag> --notes-file release-notes/<tag>.md`.
