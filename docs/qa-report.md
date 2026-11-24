# ISTG 6005 quality assurance report

## Coding-agent assignment

The agent was asked to inspect the existing repository, preserve the assignment files and dev container, and build Pantry Rescue with sample data, validation, tests, and local launch instructions. The app was then committed and pushed. For the final review, the agent was asked to test household workflows, accessibility and responsiveness, make improvements based on findings, document the environment and Git checkpoints, scan for credentials, and leave the final changes for the student to commit and push.

## Verified environment

| Check | Observed result |
| --- | --- |
| `python3 --version` | Python 3.14.4 |
| `node --version` | v26.13.1 |
| `codex --version` | codex-cli 0.172.0 |
| `findmnt --mountpoint /data` | `/data` was mounted read/write. |
| Bind mount content | A temporary file written at the workspace root was readable with identical bytes at `/data`. The probe was removed after the check. |
| Dev container | The configuration parses as JSON and matches the committed configuration semantically. It specifies an Ubuntu base image, Python, Node.js LTS, the workspace bind mount at `/data`, and a post-create command that installs Codex and prints its version. The local feature lock parses and its Python and Node.js entries match the declared features. |

These versions describe the running environment. The dev container configuration selects Node.js LTS and the latest Codex at setup time, so future builds can resolve different versions. This review checked the running container and its configuration. It did not rebuild the container.

## Assignment checkpoints

The four implementation checkpoints below are present in the current branch history after the initial repository commit, `c9e6972`. They are identified from the repository history because the checkout does not include a separate grading rubric.

| Checkpoint | Evidence |
| --- | --- |
| Ubuntu development container | `2936758` adds the Ubuntu dev container. |
| Python and workspace bind mount | `d57213c` adds Python and the project mount at `/data`. The live mount was verified independently. |
| Codex setup | `16c2f48` adds automatic Codex installation and a post-create version check. Node.js LTS and Codex were also verified in the running environment. |
| Application delivery | `fdd01df` adds the app, sample data, assets, tests, and README. The commit was previously verified on GitHub `main`. |

## Test results

The app was served locally using Python. Browser testing used Playwright with Chromium 153.0.8010.0. Automated accessibility scans used axe-core 4.14.1 with WCAG 2.0 and 2.1 A and AA rules. Browser tools were installed outside the repository.

| Area | Checks performed and results |
| --- | --- |
| Ingredient management | Added a test ingredient, rejected whitespace-only names and negative cost, edited the quantity, cancelled a discard, then confirmed it. Verified that the pantry and filtered list updated. |
| Expiration alerts | Verified the three seeded upcoming items, opened the alerts page, and used the past-date filter. Unit tests checked calendar-day arithmetic and impossible dates. |
| Recommendations | Verified four recipe cards, opened the top recipe, and added its missing Parmesan twice. Unit tests checked ranking, urgency tie-breaking, normalized matching, and exclusion of past-date ingredients. |
| Shopping and persistence | Added a manual item, rejected a duplicate with different casing, checked it off, reloaded to verify its checked state, and removed it. Reload also preserved ingredient use and updated savings. |
| Estimated savings | Discarding the test ingredient left the estimate at $18.50. Marking the $3.50 sample spinach as used raised it to $22.00 and removed the item. A separate smoke flow checked another value. |
| Responsive design | Checked all five views for horizontal overflow at widths of 320, 390, 540, 768, 1024, and 1440 pixels. Reviewed the desktop and mobile overview screenshots for legibility, hierarchy, and wrapping. |
| Accessibility and usability | Axe reported zero violations across the overview, pantry, alerts, recipes, shopping list, ingredient form, and recipe dialog. Keyboard checks verified Escape dismissal and focus after editing and discarding. Screen reader behavior was not tested. |
| Assets, text, and errors | Chromium loaded and decoded the pasta image, and the produce image returned HTTP 200 and appeared in the screenshots. The scripted flow recorded no browser console errors, uncaught page errors, or failed requests. Reviewed visible copy and tested controls for clarity and spelling. |
| Unit tests | `node --test project/model.test.mjs` passed all six tests. `node --check project/app.mjs` passed. |
| Sensitive files | Reviewed the candidate files and scanned their contents and tracked history for common credential patterns. No matching credentials or unexpected sensitive files were found in the submission scope. |

## Revisions from testing

- Saving an ingredient edit originally left keyboard focus on the page body after the inventory rerendered. The updated app returns focus to the ingredient’s menu after edits and moves focus to the page heading after removal. The browser test verified both outcomes.
- Screenshot review revealed a hard line break that stranded “of” in the hero headline and unsupported emoji glyphs in the test browser. The headline now wraps naturally and decorative icons use the app’s inline icon set.
- The README now describes the audience, launch commands, storage behavior, estimate assumptions, and test command. The screenshots show sample data only.

The final review covered one Chromium build. Browser results describe the tested workflows and widths.
