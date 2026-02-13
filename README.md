# F5 XC Documentation Theme

Branding assets for all F5 XC documentation sites. Changes pushed here are picked up automatically on the next build of any content site.

## What's in this repo

| Folder | Contents | What to edit |
|--------|----------|--------------|
| `fonts/` | Custom web fonts (woff2) and `font-face.css` declarations | Replace font files or update `font-face.css` to change typefaces |
| `styles/` | `custom.css` -- colors, spacing, code blocks, Mermaid diagrams | Edit CSS variables and rules to change the look and feel |
| `assets/` | `f5-logo.svg` -- sidebar logo | Replace the SVG to update the logo across all sites |
| `components/` | `Footer.astro` -- custom footer with social links | Edit HTML/SVG to change footer links or icons |

## How to make changes

1. Edit the file you want to change (use the GitHub web editor or clone locally)
2. Commit and push to `main`
3. The next time any documentation site rebuilds, it will use your updated theme

No npm, no build tools, no technical setup required.

## File reference

### Fonts (`fonts/`)

- **`font-face.css`** -- Declares which font files to load and at which weights
- **`neusaNextProWide-*.woff2`** -- Heading font (weights: 300, 400, 500, 700)
- **`proximaNova-*.woff2`** -- Body text font (weights: 400, 500, 600, 700)

To change a font: replace the `.woff2` file with a new one (keep the same filename), or update `font-face.css` to point to a different file.

### Styles (`styles/custom.css`)

Key CSS variables you can change:

```css
:root {
  --sl-font: "proximaNova", ...;    /* Body font family */
  --sl-content-width: 60rem;         /* Main content area width */
  --sl-sidebar-width: 15rem;         /* Left sidebar width */
}
```

The file also controls:
- Heading font family
- Mermaid diagram container styling (border, shadow, background)
- Code block appearance (rounded corners, terminal-style header)
- Aside/callout box styling

### Logo (`assets/f5-logo.svg`)

The SVG file displayed in the sidebar header. Replace it with any SVG file using the same filename.

### Footer (`components/Footer.astro`)

Custom footer with social media links (Facebook, X, LinkedIn, Instagram, YouTube). Edit the HTML to change links, add new icons, or update styling.

## Architecture

This repo is checked out at build time by the [f5xc-docs-builder](https://github.com/f5xc-salesdemos/docs-builder) reusable workflow into a `theme/` directory. The Astro config references these files as `./theme/fonts/...`, `./theme/styles/...`, etc.

```
Content repo push
  -> Builder workflow runs
     -> Checks out this theme repo into builder/theme/
     -> Astro build uses theme files
     -> Site deployed with your branding
```
