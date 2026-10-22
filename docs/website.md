# CityAgentBench project page

English-first research project page with an EN/ZH switch, three videos, two capability figures, a vector navigation demo, and a zoomable 12,288 × 18,432 city atlas. CityAgentBench is a working title. The research and benchmark readiness statements are preserved from the local page.

## Deployment

Static sources and a GitHub Actions deployment workflow for the project page. The repository is `Xiaofeng-Han-Res/CityAgentBench`.

1. Push the contents of this directory to the target repository. Do not add the sibling `release-assets/` directory to Git.
2. Create a GitHub Release with tag `website-assets-20260928`. Attach `city_overview_12288x18432.png` from the sibling `release-assets/` directory. Its required hash is in `release-assets.json`.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
4. In **Actions → Deploy project page**, choose **Run workflow** on the default branch. The workflow downloads the original atlas, verifies its SHA-256, and publishes the complete site. A missing or changed asset fails the build before deployment.
5. Open the URL reported by the deployment. Both a repository subpath and an account-level Pages domain are supported through relative asset paths.

Publishing is manually triggered. Later changes are published by running the same workflow after pushing updates.

## Large image handling

GitHub blocks individual Git files above 100 MiB. The original atlas is approximately 193 MiB, so it is stored as a Release asset. The 1,167 image-pyramid tiles stay in `site/`. The build places the full original PNG back at its existing path, preserving the viewer's original-image download and keeping all displayed media on the site's own origin. No Git LFS or external map service is needed.

`site/` alone is a source tree; use the assembly command below to include the original-image download before previewing or deploying.

```bash
python3 -B scripts/assemble_site.py --assets ../release-assets --output _site
python3 -B -m http.server 8000 --directory _site
```

For the original project workstation, use its required data-storage runtime wrapper when starting a server or browser.

## Contents

Only the selected website assets are included. Raw acquisition datasets, Blender/UE projects, evaluation private answers, QA screenshots, logs, and workstation credentials are not part of this repository. This package does not establish an open-source or dataset license.

Reference: [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [GitHub large-file limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
