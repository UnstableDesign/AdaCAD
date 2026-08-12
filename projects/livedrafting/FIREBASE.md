# Firebase Hosting (separate project)

Live Drafting uses its **own** Firebase project, independent of the main AdaCAD app (`adacad-beta-fa4dc` / `adacad-5`).

Default project id in `.firebaserc`: `livedrafting-adacad` (change if that id is taken).

## One-time setup

1. **Install the CLI** (or use the project devDependency via `npx`):

   ```bash
   npm install -g firebase-tools
   ```

2. **Log in:**

   ```bash
   firebase login
   ```

3. **Create a new Firebase project** in the [console](https://console.firebase.google.com/) or:

   ```bash
   firebase projects:create livedrafting-adacad --display-name "Live Drafting"
   ```

4. **Point this folder at your project** (skip if you kept `livedrafting-adacad`):

   ```bash
   cd projects/livedrafting
   firebase use --add
   ```

   Or edit `.firebaserc` and set `"default"` to your project id (see `.firebaserc.example`).

5. **Enable Hosting** in the Firebase console for that project (Build → Hosting → Get started). No need to run `firebase init` again — `firebase.json` is already in this directory.

6. **Install dependencies** (includes `firebase-tools`):

   ```bash
   npm install
   ```

## Deploy

From `projects/livedrafting`:

```bash
npm run deploy
```

This builds `adacad-drafting-lib`, runs `vite build`, and deploys `dist/` to Firebase Hosting.

Preview channel (optional):

```bash
npm run deploy:preview
```

## Custom domain

Firebase console → Hosting → Add custom domain (e.g. `livedrafting.adacad.org`).

## What gets published

Only static files from `dist/`:

- `index.html`, `about.html`
- Bundled JS/CSS
- `esbuild.wasm` (served as `application/wasm` via `firebase.json` headers)

No Cloud Functions, Firestore, or Auth are configured for this project.
