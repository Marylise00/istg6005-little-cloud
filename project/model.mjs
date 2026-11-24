export const categories = { Produce: '🥬', Dairy: '🥛', Protein: '🥚', Grains: '🌾', Pantry: '🫙', Other: '📦' };

export function dateKey(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index ? 2 : 4, '0')).join('-');
}

export function daysLeft(expiration, today = dateKey()) {
  return (Date.parse(expiration) - Date.parse(today)) / 86400000;
}

export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
}

export function validateIngredient(fields) {
  if (!fields.name.trim() || fields.name.trim().length > 60) return 'Enter an ingredient name up to 60 characters.';
  if (!Object.hasOwn(categories, fields.category)) return 'Choose a category.';
  if (!fields.quantity.trim() || fields.quantity.trim().length > 40) return 'Enter a quantity such as 2 cups.';
  if (!validDate(fields.expiration)) return 'Enter a valid expiration date.';
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(fields.cost.trim())) return 'Enter a value from $0 to $99,999.99 with up to two decimal places.';
  return '';
}

export const recipes = [
  { id: 'pasta', name: 'Creamy Spinach Pasta', time: 20, image: 'assets/pasta.jpg', emoji: '🍝', description: 'A cozy weeknight pasta with tender greens and a simple creamy sauce.', ingredients: ['Pasta', 'Baby spinach', 'Greek yogurt', 'Parmesan'], steps: ['Cook 8 oz pasta according to the package. Reserve half a cup of the cooking water, then drain.', 'Wilt 2 cups baby spinach in a skillet with a splash of pasta water.', 'Take the skillet off the heat. Toss the pasta with the spinach, ½ cup Greek yogurt and ¼ cup grated Parmesan. Loosen with reserved water and season to taste.'] },
  { id: 'toast', name: 'Avocado & Egg Toast', time: 15, emoji: '🥑', description: 'Crisp toast with mashed avocado and eggs.', ingredients: ['Avocado', 'Eggs', 'Bread'], steps: ['Toast 2 slices of bread.', 'Cook 2 eggs to your preference. Mash the avocado and season to taste.', 'Spread the avocado on the toast and top with the eggs.'] },
  { id: 'salad', name: 'Tomato & Chickpea Salad', time: 10, emoji: '🥗', description: 'A quick pantry salad with juicy tomatoes and a lemon dressing.', ingredients: ['Cherry tomatoes', 'Chickpeas', 'Lemon', 'Olive oil'], steps: ['Drain and rinse 1 can chickpeas. Halve 1 cup cherry tomatoes.', 'Toss with 1 tablespoon olive oil and lemon juice to taste. Season and serve.'] },
  { id: 'bowl', name: 'Spinach & Chickpea Bowl', time: 25, emoji: '🥣', description: 'Warm chickpeas and wilted greens served over rice.', ingredients: ['Rice', 'Chickpeas', 'Baby spinach', 'Olive oil'], steps: ['Cook ½ cup rice according to the package.', 'Warm 1 can drained chickpeas in a tablespoon of olive oil. Fold in 2 cups baby spinach until wilted.', 'Spoon over the rice and season to taste.'] },
];

export const normalize = name => name.trim().toLowerCase().replace(/\s+/g, ' ');

export function recommend(inventory, today = dateKey()) {
  const available = new Map();
  for (const item of inventory) {
    const days = daysLeft(item.expiration, today);
    const name = normalize(item.name);
    if (days >= 0 && (!available.has(name) || days < available.get(name))) available.set(name, days);
  }
  return recipes.map(recipe => {
    const missing = recipe.ingredients.filter(name => !available.has(normalize(name)));
    const urgent = recipe.ingredients.filter(name => available.get(normalize(name)) <= 3).length;
    const matched = recipe.ingredients.length - missing.length;
    return { ...recipe, missing, urgent, matched, score: matched / recipe.ingredients.length };
  }).sort((a, b) => b.score - a.score || b.urgent - a.urgent || a.time - b.time);
}

export function addShoppingItems(list, names, makeId = () => crypto.randomUUID()) {
  const existing = new Set(list.map(item => normalize(item.name)));
  const additions = [];
  for (const name of names) {
    const key = normalize(name);
    if (!key || existing.has(key)) continue;
    additions.push({ id: makeId(), name: name.trim(), checked: false });
    existing.add(key);
  }
  return [...list, ...additions];
}

export function useIngredient(state, id) {
  const item = state.inventory.find(entry => entry.id === id);
  if (!item) return state;
  return { ...state, inventory: state.inventory.filter(entry => entry.id !== id), savedCents: state.savedCents + item.cents };
}

export function sampleState(today = new Date()) {
  const samples = [
    ['Baby spinach', 'Produce', '1 bag', 0, 350, '🥬'],
    ['Greek yogurt', 'Dairy', '1 tub', 1, 475, '🥛'],
    ['Avocado', 'Produce', '2 whole', 2, 300, '🥑'],
    ['Cherry tomatoes', 'Produce', '1 pint', 5, 425, '🍅'],
    ['Eggs', 'Protein', '6 eggs', 11, 320, '🥚'],
    ['Rolled oats', 'Grains', '1 bag', 60, 399, '🌾'],
    ['Pasta', 'Grains', '1 box', 45, 250, '🍝'],
    ['Chickpeas', 'Pantry', '1 can', 90, 189, '🫙'],
  ];
  return { inventory: samples.map(([name, category, quantity, offset, cents, emoji], index) => {
    const expiration = new Date(today);
    expiration.setDate(expiration.getDate() + offset);
    return { id: `sample-${index}`, name, category, quantity, expiration: dateKey(expiration), cents, emoji };
  }), shopping: [], savedCents: 1850 };
}
