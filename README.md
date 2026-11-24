# istg6005-little-cloud

## Pantry Rescue

Pantry Rescue is a household dashboard for tracking ingredients, finding recipes, and shopping for what’s missing.

### Run locally

From the repository root, start a static server with Python 3.

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory project
```

Open [Pantry Rescue](http://127.0.0.1:8000) in a modern browser. If you’re using a dev container, forward port `8000` in your editor. No package installation or API keys are needed.

### Use the app

1. Select **Add ingredient** and enter a name, category, quantity, expiration date, and estimated value in USD.
2. Review **Use these first** for upcoming dates, or open **Expiration alerts** to see all ingredients due within three days or already past date. Open an ingredient’s menu to edit, discard, or mark it as used.
3. Open **Recipes** to see how each recipe matches your pantry. Open a recipe for preparation steps and to add missing ingredients to your **Shopping List**.
4. Add other shopping items manually and check off or remove items as you shop.

On first launch, the app loads eight sample ingredients with expiration dates relative to that day and a sample savings balance of $18.50. Marking a whole inventory entry as used adds its entered value to the estimate. Discarding it adds nothing. This estimates the value of food used. Actual cash savings depend on what you would otherwise have bought or thrown away.

### Implementation

- `project/index.html` and `project/styles.css` define the responsive interface. The layout changes from a desktop sidebar and dashboard columns to top navigation and stacked panels on small screens.
- `project/app.mjs` handles navigation, forms, and browser storage. Data is saved to `localStorage` for the current browser and origin.
- `project/model.mjs` contains the date calculations, validation, recipe ranking, and savings logic. Recipes are ranked by matched ingredient share, with near-expiration ingredients breaking ties. Matching ignores case and extra spaces, excludes past-date ingredients, and checks ingredient names without converting quantities or units.
- `project/model.test.mjs` covers validation, expiration boundaries, recommendation ranking, shopping list deduplication, and savings accounting.

Photos from Unsplash are bundled under `project/assets` so they load when the app runs locally.

### Run the tests

With Node.js 20 or newer, run the built-in test runner from the repository root.

```bash
node --test project/model.test.mjs
```
