# Portfolio + Second Brain (GitHub Pages)

This repo is a GitHub Pages–friendly Jekyll site with a small “second brain”:

- Notes are Markdown files in `_notes/`
- They publish to `/notes/...`
- `/notes/` provides tag filtering + full-text search

## Add a new note

Create a file like `_notes/2026-04-09-my-note.md`:

```markdown
---
title: My note title
date: 2026-04-09
tags: [tag1, tag2]
---

Write in Markdown.
```

## Local preview

If you have Ruby/Jekyll installed:

```bash
bundle exec jekyll serve
```

Or with system Jekyll:

```bash
jekyll serve
```
