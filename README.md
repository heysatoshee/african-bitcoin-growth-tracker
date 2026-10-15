# African Bitcoin Ecosystem Growth Tracker + Live Directory API docs

Static website, no build step. Two pages:

- `index.html`: Ecosystem Growth Tracker (Q3 2024 to Q4 2026, Q4 2026 baseline)
- `api.html`: Live Directory API landing page and docs

## Deploy on Netlify (quickest)

1. Go to https://app.netlify.com/drop
2. Drag this whole folder (or the zip) onto the page.
3. Netlify gives you a live link in a few seconds. Rename the site under **Site configuration → Change site name**.

## Deploy on GitHub Pages

1. Create a new repository and upload the contents of this folder to the root (keep `.nojekyll`).
2. Go to **Settings → Pages**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
3. The site appears at `https://<your-username>.github.io/<repo-name>/` after a minute or two.

## Preview on your computer

Open a terminal in this folder and run `python3 -m http.server 8000`, then visit http://localhost:8000.
Opening `index.html` by double-clicking won't load the maps, because browsers block local data files.

## Where things live

| File | What it holds |
|---|---|
| `data.js` | All tracker numbers, from the growth ledger. Update this each quarter. |
| `app.js` / `styles.css` | Growth tracker logic and the shared design system |
| `api.js` | API spec (`CONFIG` and `ENDPOINTS`), code samples and playground |
| `assets/africa.geo.json` | Africa country outlines for the maps |

## Before going public

- API details in `api.js` (`CONFIG` and `ENDPOINTS`) are a draft: base URL, "no key in beta", 60 requests a minute, endpoint names and fields. Confirm with the API team.
- The API playground uses sample data from the Q4 2026 baseline, not the live API.
- Buttons marked `href="#"` (Live Directory, Browse the directory, Share your project, Read the API docs links in the footer) need real URLs.
