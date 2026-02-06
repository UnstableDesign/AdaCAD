[![Documentation](https://img.shields.io/badge/documentation-website-yellow?logo=markdown&logoColor=yellow)](https://docs.adacad.org/)
[![Community](https://img.shields.io/badge/community-discord-5865F2?logo=discord&logoColor=5865F2)](https://discord.gg/Be7ukQcvrC)
[![Youtube Channel](https://img.shields.io/badge/youtube-channel-red?logo=youtube&logoColor=red)](https://www.youtube.com/watch?v=nhHUUaMHx_Y&list=UULFRK7RAt8Z7Nw1u3aJ0FyPuQ)
[![Access](https://img.shields.io/badge/use-adacad.org-blue)](https://adacad.org)

![Adacad_logo2025_SMALL](https://github.com/user-attachments/assets/13ac2355-0f6f-4fb4-bc36-bc405afaf36a)

# AdaCAD

AdaCAD is a **monorepo** of tools and libraries for algorithmically generating and manipulating woven drafts. Everything below lives in this single repository.

## Repository structure

- **packages/** — Libraries and shared code
  - [`adacad-drafting-lib`](./packages/adacad-drafting-lib) — Core data structures and algorithms for draft making and manipulation. Includes all operations code and documentation **(if you want to make your own operation, do it here!)** and the code to render drafts for simulation. TypeScript library also published as an [NPM package](https://www.npmjs.com/package/adacad-drafting-lib).

- **projects/** — Applications and tools
  - [`ui`](./projects/ui) — Angular web app that imports the AdaCAD library. Provides the graph of operations and drafts, user/database integrations, and file load/save. Experimental workspace for parametric weave drafting, supporting algorithmic and playful approaches for shaft and jacquard looms. Use it online at [adacad.org](https://adacad.org/).
  - [`docs`](./projects/docs) — Docusaurus site that imports the library and documents operations, with getting started guides and examples. Available at [docs.adacad.org](https://docs.adacad.org/).
  - [`screenshot-generator`](./projects/screenshot-generator) — Renders each AdaCAD operation in the UI and generates images for keeping operation documentation up to date.

## Development

Clone this repository once. To build or run a specific part of the monorepo, see the README at the root of that package or project (e.g. [packages/adacad-drafting-lib/README.md](./packages/adacad-drafting-lib/README.md), [projects/ui/README.md](./projects/ui/README.md)). The UI and docs depend on the library in `packages/adacad-drafting-lib`, which is typically linked locally in the monorepo.

We invite anyone interested to hack on AdaCAD. If that describes you, you can find support in our [Discord channel](https://discord.gg/Be7ukQcvrC).

This project is maintained by Laura Devendorf and the [Unstable Design Lab](https://unstable.design/). The project is supported by National Science Foundation Grants [#2346150](https://www.nsf.gov/awardsearch/showAward?AWD_ID=2346150&HistoricalAwards=false), [#1943109](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1943109), and [#1755587](https://www.nsf.gov/awardsearch/showAward?AWD_ID=1755587).
