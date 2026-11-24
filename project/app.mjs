import { addShoppingItems, categories, daysLeft, normalize, recommend, sampleState, useIngredient, validateIngredient } from './model.mjs';

const paths = {
  leaf: '<path d="M20 4c-8 0-14 3-14 10a4 4 0 0 0 4 4c7 0 10-6 10-14ZM4 21l10-10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  box: '<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M3 7V4h18v3M9 12h6"/>',
  book: '<path d="M12 6c-3-3-6-3-9-2v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-3-1-6-1-9 2Zm0 0v15"/>',
  cart: '<path d="M2 3h3l3 12h11l3-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M21 10h-6v4h6M16 12h.01"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};

const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const displayDate = date => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
const storageKey = 'pantry-rescue-v1';
const content = document.querySelector('#content');
const dialog = document.querySelector('#dialog');
const notice = document.querySelector('#notice');
const titles = { overview: 'Kitchen overview', inventory: 'My Pantry', recipes: 'Recipes', shopping: 'Shopping List' };
let filter = 'all';
let timeout;
let state = sampleState();

try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  if (stored && Array.isArray(stored.inventory) && Array.isArray(stored.shopping) && Number.isInteger(stored.savedCents)) state = stored;
  else localStorage.setItem(storageKey, JSON.stringify(state));
} catch {
  announce('Browser storage is unavailable. Changes may be lost on refresh.');
}

function announce(message) {
  notice.textContent = message;
  clearTimeout(timeout);
  timeout = setTimeout(() => { notice.textContent = ''; }, 4500);
}

function save(next, message) {
  state = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (message) announce(message);
  } catch {
    announce('Changes apply to this session. Browser storage is unavailable.');
  }
  render();
}

function status(item) {
  const days = daysLeft(item.expiration);
  if (days < 0) return ['expired', 'Past date'];
  if (days === 0) return ['urgent', 'Today'];
  if (days <= 3) return ['soon', days === 1 ? 'Tomorrow' : `In ${days} days`];
  return ['fresh', 'Fresh'];
}

function itemRow(item) {
  const [tone, label] = status(item);
  return `<div class="item-row"><span class="food-icon" aria-hidden="true">${escape(item.emoji || categories[item.category])}</span><div class="item-info"><strong>${escape(item.name)}</strong><small>${escape(item.quantity)} · ${escape(item.category)} · <time datetime="${item.expiration}">${displayDate(item.expiration)}</time></small></div><span class="badge ${tone}" title="${displayDate(item.expiration)}">${label}</span><button class="icon-button" data-action="item" data-id="${escape(item.id)}" aria-label="Manage ${escape(item.name)}">${icon('more')}</button></div>`;
}

function recipeCard(recipe) {
  return `<article class="recipe-card"><div class="recipe-image ${recipe.id}">${recipe.image ? `<img src="${recipe.image}" alt="" loading="lazy">` : `<span aria-hidden="true">${recipe.emoji}</span>`}<span class="badge fresh match">${Math.round(recipe.score * 100)}% match</span></div><div class="recipe-body"><div class="recipe-time">${icon('clock')} ${recipe.time} min${recipe.urgent ? ' · Uses expiring food' : ''}</div><h3>${recipe.name}</h3><p>${recipe.description}</p><button class="button secondary" data-action="recipe" data-id="${recipe.id}">View recipe</button></div></article>`;
}

function overview(items, suggestions) {
  const soon = items.filter(item => { const days = daysLeft(item.expiration); return days >= 0 && days <= 3; });
  const expired = items.filter(item => daysLeft(item.expiration) < 0);
  const priority = [...soon, ...expired].slice(0, 4);
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return `<section class="hero"><div class="hero-content"><span class="eyebrow">${icon('leaf')} WASTE LESS, EAT BETTER</span><h1>Make the most of<br> what you have.</h1><p>A little planning goes a long way. See what’s in your kitchen and give good food a second chance.</p><a class="button hero-button" href="#inventory">Explore my pantry</a></div><div class="hero-photo" role="img" aria-label="A market display of fresh produce"></div></section>
  <div class="section-heading snapshot"><h2>At a glance</h2><span>${today}</span></div>
  <div class="stats">
    <a class="stat" href="#inventory"><span class="stat-icon green">${icon('box')}</span><div><span>In your pantry</span><strong>${items.length}<small> ingredients</small></strong></div></a>
    <a class="stat" href="#urgent"><span class="stat-icon peach">${icon('clock')}</span><div><span>Expiring soon</span><strong>${soon.length}<small> within 3 days</small></strong></div></a>
    <div class="stat"><span class="stat-icon yellow">${icon('wallet')}</span><div><span>Estimated money saved</span><strong>${money(state.savedCents)}</strong></div></div>
  </div>
  <div class="overview-grid"><section class="panel priority"><div class="section-heading"><div><h2>Use these first</h2><p>Ingredients that need your attention.</p></div><a class="text-link" href="#urgent">View all</a></div><div>${priority.map(itemRow).join('') || '<p class="empty">You’re all caught up. Nothing is due soon.</p>'}</div></section>
  <section><div class="section-heading featured-heading"><div><h2>Cook what you have</h2><p>Recipe ideas from your pantry.</p></div><a class="text-link" href="#recipes">All recipes</a></div>${recipeCard(suggestions[0])}</section></div>`;
}

function inventory(items, urgentView) {
  const choices = [['all', 'All ingredients'], ['soon', 'Expiring soon'], ['expired', 'Past date']];
  const selected = urgentView ? items.filter(item => daysLeft(item.expiration) <= 3) :
    items.filter(item => filter === 'all' || (filter === 'expired' ? daysLeft(item.expiration) < 0 : ['soon', 'urgent'].includes(status(item)[0])));
  return `<div class="page-heading"><h1>${urgentView ? 'Expiration alerts' : 'My Pantry'}</h1><p>${urgentView ? 'Review ingredients due within three days or already past date.' : 'Track what you have and when to use it.'}</p></div>
    <section class="panel">${urgentView ? '<a class="text-link" href="#inventory">All ingredients</a>' : `<div class="filters" aria-label="Filter inventory">${choices.map(([value, label]) => `<button class="button secondary" data-action="filter" data-id="${value}" aria-pressed="${filter === value}">${label}</button>`).join('')}</div>`}
    ${selected.map(itemRow).join('') || '<p class="empty">No ingredients in this view.</p>'}</section>`;
}

function shopping() {
  const rows = [...state.shopping].sort((a, b) => Number(a.checked) - Number(b.checked));
  return `<div class="page-heading"><h1>Shopping List</h1><p>Keep track of missing ingredients and groceries.</p></div><section class="panel">
  <form id="shopping-form" class="shopping-form"><label for="shopping-name">Shopping item</label><div><input id="shopping-name" name="name" maxlength="60" required placeholder="e.g. Parmesan"><button class="button primary" type="submit">Add item</button></div><p class="form-error" role="alert"></p></form>
  ${rows.map(item => `<div class="shopping-row"><label><input type="checkbox" data-shopping-id="${escape(item.id)}" ${item.checked ? 'checked' : ''}><span>${escape(item.name)}</span></label><button class="icon-button" data-action="remove-shopping" data-id="${escape(item.id)}" aria-label="Remove ${escape(item.name)}">${icon('close')}</button></div>`).join('') || '<p class="empty">Your list is empty. Add an item here or from a recipe.</p>'}</section>`;
}

function render() {
  const view = location.hash.slice(1);
  const urgentView = view === 'urgent';
  const active = urgentView ? 'inventory' : Object.hasOwn(titles, view) ? view : 'overview';
  const items = [...state.inventory].sort((a, b) => a.expiration.localeCompare(b.expiration) || a.name.localeCompare(b.name));
  const suggestions = recommend(items);
  document.querySelector('#breadcrumb').textContent = urgentView ? 'Expiration alerts' : titles[active];
  document.querySelectorAll('nav a').forEach(link => {
    if (link.dataset.view === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (active === 'inventory') content.innerHTML = inventory(items, urgentView);
  else if (active === 'shopping') content.innerHTML = shopping();
  else if (active === 'recipes') content.innerHTML = `<div class="page-heading"><h1>Recipes</h1><p>Ideas ranked by how many ingredients you already have.</p></div><div class="recipe-grid">${suggestions.map(recipeCard).join('')}</div>`;
  else content.innerHTML = overview(items, suggestions);
}

function showDialog(title, body) {
  dialog.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Close dialog">${icon('close')}</button></div>${body}`;
  if (!dialog.open) dialog.showModal();
}

function ingredientForm(item) {
  showDialog(item ? 'Edit ingredient' : 'Add ingredient', `<form id="ingredient-form" data-id="${item?.id || ''}">
  <label>Ingredient name<input name="name" required maxlength="60" value="${escape(item?.name || '')}" placeholder="e.g. Baby spinach" autofocus></label>
  <div class="form-grid"><label>Category<select name="category">${Object.keys(categories).map(category => `<option ${item?.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label>
  <label>Quantity<input name="quantity" required maxlength="40" value="${escape(item?.quantity || '')}" placeholder="e.g. 1 bag"></label>
  <label>Expiration date<input type="date" name="expiration" required value="${item?.expiration || ''}"></label>
  <label>Estimated value ($)<input name="cost" type="text" inputmode="decimal" required maxlength="8" value="${item ? (item.cents / 100).toFixed(2) : '0.00'}"></label></div>
  <p class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" data-action="close">Cancel</button><button class="button primary" type="submit">Save ingredient</button></div></form>`);
  dialog.querySelector('[name="name"]').focus();
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const item = state.inventory.find(entry => entry.id === id);
  if (action === 'add' || (action === 'edit' && item)) ingredientForm(item);
  if (action === 'close') dialog.close();
  if (action === 'filter') {
    filter = id;
    render();
    content.querySelector(`[data-action="filter"][data-id="${id}"]`)?.focus();
  }
  if (action === 'item' && item) {
    showDialog(escape(item.name), `<p>${escape(item.quantity)} · ${escape(item.category)} · ${money(item.cents)}</p><p>Expiration date: ${displayDate(item.expiration)}</p>
      <div class="dialog-actions"><button class="button secondary" data-action="remove" data-id="${id}">Discard</button><button class="button secondary" data-action="edit" data-id="${id}">Edit</button><button class="button primary" data-action="used" data-id="${id}">Mark as used</button></div>`);
  }
  if (action === 'remove' && item) {
    showDialog('Discard ingredient?', `<p>Remove ${escape(item.name)} from your pantry?</p><div class="dialog-actions"><button class="button secondary" data-action="item" data-id="${id}">Cancel</button><button class="button primary" data-action="confirm-remove" data-id="${id}">Discard ingredient</button></div>`);
  }
  if (action === 'used' && item) {
    dialog.close();
    save(useIngredient(state, id), `Marked ${item.name} as used.`);
  }
  if (action === 'confirm-remove' && item) {
    dialog.close();
    save({ ...state, inventory: state.inventory.filter(entry => entry.id !== id) }, `Discarded ${item.name}.`);
  }
  if (action === 'recipe' || action === 'missing') {
    const recipe = recommend(state.inventory).find(entry => entry.id === id);
    if (!recipe) return;
    if (action === 'missing') {
      const list = addShoppingItems(state.shopping, recipe.missing);
      save({ ...state, shopping: list }, list.length === state.shopping.length ? 'Missing ingredients already on your list.' : 'Missing ingredients added to your list.');
      dialog.querySelector('.recipe-feedback').textContent = list.length ? 'Missing ingredients are on your shopping list.' : '';
      return;
    }
    showDialog(recipe.name, `<p>${recipe.description}</p><h3>Ingredients</h3><ul class="recipe-ingredients">${recipe.ingredients.map(name => `<li>${name}<span class="badge ${recipe.missing.includes(name) ? 'soon' : 'fresh'}">${recipe.missing.includes(name) ? 'Missing' : 'In pantry'}</span></li>`).join('')}</ul><h3>Preparation</h3><ol>${recipe.steps.map(step => `<li>${step}</li>`).join('')}</ol>${recipe.missing.length ? `<button class="button primary" data-action="missing" data-id="${id}">Add missing to shopping list</button><p class="recipe-feedback" role="status"></p>` : ''}`);
  }
  if (action === 'remove-shopping') save({ ...state, shopping: state.shopping.filter(entry => entry.id !== id) }, 'Shopping item removed.');
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (!['ingredient-form', 'shopping-form'].includes(form.id)) return;
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  const error = form.querySelector('.form-error');
  if (form.id === 'shopping-form') {
    if (!fields.name.trim() || fields.name.trim().length > 60) { error.textContent = 'Enter an item name up to 60 characters.'; return; }
    if (state.shopping.some(item => normalize(item.name) === normalize(fields.name))) { error.textContent = 'That item is already on your list.'; return; }
    save({ ...state, shopping: addShoppingItems(state.shopping, [fields.name]) }, 'Shopping item added.');
    document.querySelector('#shopping-name').focus();
    return;
  }
  const issue = validateIngredient(fields);
  if (issue) { error.textContent = issue; return; }
  const previous = state.inventory.find(item => item.id === form.dataset.id);
  const ingredient = { id: previous?.id || crypto.randomUUID(), name: fields.name.trim(), category: fields.category, quantity: fields.quantity.trim(), expiration: fields.expiration, cents: Math.round(Number(fields.cost) * 100), emoji: previous?.category === fields.category ? previous.emoji : categories[fields.category] };
  const inventory = previous ? state.inventory.map(item => item.id === ingredient.id ? ingredient : item) : [...state.inventory, ingredient];
  dialog.close();
  save({ ...state, inventory }, `${ingredient.name} saved.`);
});

document.addEventListener('change', event => {
  const { shoppingId } = event.target.dataset;
  if (!shoppingId) return;
  save({ ...state, shopping: state.shopping.map(item => item.id === shoppingId ? { ...item, checked: event.target.checked } : item) });
  document.querySelector(`[data-shopping-id="${shoppingId}"]`)?.focus();
});

document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
window.addEventListener('hashchange', () => { filter = 'all'; render(); window.scrollTo(0, 0); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !dialog.open) render(); });
render();
