# Guess the Party — U.S. Congress

<p align="center">
  <a href="https://rexjensen.github.io/Guess-the-party-US/">
    <img src="docs/ad.png" alt="Guess the Party — U.S. Congress Edition. Can you tell Democrat from Republican?" width="480">
  </a>
</p>

A small browser game: you're shown a photo of a random sitting member of the U.S. Congress, and you guess their party (Democrat or Republican).

**Play it:** https://rexjensen.github.io/Guess-the-party-US/

## How to play

- Click **Democrat** or **Republican** — or press **D** or **R**.
- The member's name, chamber, and state are revealed after each guess.
- Press **Space**, **Enter**, or **N** to advance to the next member.
- Your best streak is saved in `localStorage`.

## Data sources

- Legislators: [`unitedstates/congress-legislators`](https://github.com/unitedstates/congress-legislators) (`legislators-current.json`).
- Photos: the public-domain [`unitedstates/images`](https://github.com/unitedstates/images) archive, served via GitHub Pages, with `theunitedstates.io` as a fallback.

Only members whose current term lists a party of Democrat or Republican are included. Independents (e.g., Bernie Sanders, Angus King) are reclassified as Democrats since they caucus with the Democratic party.

## Run locally

It's a static site — no build step. From the repo root:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly via `file://` won't work because of CORS on the legislator JSON fetch.)

## Deploying to GitHub Pages

In the repo's **Settings → Pages**, set the source to the `claude/congress-guessing-game-7l9vM` branch (or merge to `main` and use that), root folder `/`. The site will be served at the URL above.

## Files

- `index.html` — markup
- `styles.css` — styling
- `app.js` — fetches legislators, picks random members, handles guesses and scoring
