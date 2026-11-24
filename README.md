# Pantry Rescue

Pantry Rescue is a browser-based inventory and meal-planning app for households that want to use food before it goes to waste. It helps home cooks see what they already have, decide what to cook next, and buy only the ingredients they’re missing.

- **Pantry inventory** lets you add, edit, use, or discard ingredients. Each entry records a category, quantity, expiration date, and estimated value in USD.
- **Expiration alerts** surface ingredients due today through the next three days and flag items already past date.
- **Recipe recommendations** rank four recipes by the share of ingredients you have. Ingredients due soon break ties. Each recipe shows its preparation steps and what’s missing.
- **Shopping list** accepts missing recipe ingredients and manual entries. Check off items as you shop or remove them when you’re done.
- **Estimated savings** increases by the entered value when you mark a whole pantry entry as used. Discarded entries add nothing.

## Run locally

1. Open a terminal at the repository root. If you are using VS Code’s Dev Containers extension, open the repository in the supplied dev container.
2. Start the app from your laptop terminal:

   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1 --directory project
   ```

   From inside a dev container, use the command below, then forward port `8000` in VS Code’s **Ports** panel if it has not been forwarded automatically.

   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0 --directory project
   ```

3. Open [http://localhost:8000/](http://localhost:8000/). Keep the terminal open while using the app. Press **Ctrl+C** to stop the server.

Running the app requires Python 3 and a modern browser. Node.js 20 or newer runs the unit tests. The application uses plain HTML, CSS, and JavaScript modules, with bundled photos and no build step or API keys.

## Screenshots

Both screenshots show the sample household inventory.

| Desktop overview | Mobile overview |
| --- | --- |
| ![Pantry Rescue desktop overview with sidebar, pantry statistics, expiration priorities, and a recipe](docs/pantry-rescue-dashboard.png) | ![Pantry Rescue mobile overview with top navigation and stacked dashboard panels](docs/pantry-rescue-mobile.png) |

## Data and estimates

The first visit seeds eight ingredients with dates relative to that day and an illustrative savings balance of $18.50. Inventory, shopping items, and savings are stored in browser `localStorage` for the current origin. Use the same URL and browser profile to retain your data. Clearing site data restores the sample state on the next visit.

Recipe matching uses ingredient names after normalizing case and whitespace. The match checks ingredient presence and ignores amounts, unit conversions, and substitutions. Past-date entries are excluded. Savings represents the entered value of ingredients marked as used. Actual cash savings will vary.

## Testing and assignment evidence

Run from the repository root:

```bash
node --test project/model.test.mjs
```

See the [ISTG 6005 quality assurance report](docs/qa-report.md) for the coding-agent brief, verified environment and bind mount, Git checkpoints, browser checks, and revisions.

The food photos are bundled in `project/assets` and sourced from Unsplash.
