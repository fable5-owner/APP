# Artwork (not used in the current UI)

The redesigned UI intentionally uses no drawn faces (initial/orb avatars + a dot-matrix map). The notes below are kept for a future illustrated version.

# Custom artwork (optional)

The game ships with procedurally drawn SVG portraits as placeholders. To use real illustrations:

1. Put image files in this folder (4:5 portrait works best, e.g. 800×1000).
2. Create `manifest.json` here mapping a character id to its file:

```json
{
  "hero": "hero.png",
  "mira": "mira.png",
  "victor": "victor.png",
  "jonah": "jonah.png",
  "lin": "lin.png",
  "dana": "dana.png",
  "elias": "elias.png",
  "aria": "aria.png",
  "sage": "sage.png"
}
```

Any id you leave out keeps its placeholder. Reload the page to see the new art.
