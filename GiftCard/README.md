# The 1890s London Parlor

A static site in two rooms. The parlor turns a card into a grimoire. The open book leads to the Midnight Gazette exhibition. There is no build step: GitHub Pages can serve this folder as it stands.

## Run it locally

Open `index.html` in a browser, or from this folder:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Publish on GitHub Pages

1. Create a repository and push this folder to the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch `main` and folder **`/ (root)`**, then save.

The site will be at `https://USERNAME.github.io/REPOSITORY/`. Relative links are used throughout, so the same files also work if the repository is `USERNAME.github.io` and the site lives at the domain root.

`.nojekyll` is included so GitHub Pages will not run the files through Jekyll.

## Rooms

- `index.html` — the card, the flash, and the book
- `exhibition.html` — the cabinets behind the last page
- `404.html` — used automatically by GitHub Pages for unknown addresses

The open book asks a question before it lets anyone through. The answer is not stored in the site. The destination address is sealed in `js/gate.js`, and the typed answer is the only key that can open it.

The placeholder question is “Name the street where the lamps go dark.” The placeholder answer is `gaslight`, and it opens `exhibition.html`. Change both before you publish. The real answer is only typed into this command; do not commit it.

```bash
node scripts/seal.mjs --question "Your question" --answer "your secret phrase" --url "https://example.com"
```

A short or common answer can be guessed from the sealed file. Use a phrase.

Photographs are from Unsplash and stored in `images/`. The only request the live site makes is for the display fonts.
