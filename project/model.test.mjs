import test from 'node:test';
import assert from 'node:assert/strict';
import { addShoppingItems, dateKey, daysLeft, recommend, sampleState, useIngredient, validDate, validateIngredient } from './model.mjs';

const today = '2026-11-24';

test('date calculations use calendar days and reject impossible dates', () => {
  assert.equal(dateKey(new Date(2026, 10, 24, 23)), today);
  assert.equal(daysLeft('2026-11-27', today), 3);
  assert.equal(daysLeft('2026-11-23', today), -1);
  assert.equal(daysLeft('2026-03-09', '2026-03-08'), 1);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
});

test('ingredient validation checks whitespace, category, quantity, dates and value', () => {
  const fields = { name: 'Spinach', category: 'Produce', quantity: '1 bag', expiration: today, cost: '3.50' };
  assert.equal(validateIngredient(fields), '');
  for (const invalid of [{ name: ' ' }, { category: 'constructor' }, { quantity: '' }, { expiration: '2026-11-31' }, { cost: '-1' }, { cost: '3.001' }, { cost: '1e2' }]) {
    assert.notEqual(validateIngredient({ ...fields, ...invalid }), '');
  }
});

test('sample dates are relative and pasta leads with one missing ingredient', () => {
  const { inventory } = sampleState(new Date(2026, 10, 24));
  assert.equal(inventory.filter(item => daysLeft(item.expiration, today) <= 3).length, 3);
  const [top] = recommend(inventory, today);
  assert.equal(top.id, 'pasta');
  assert.equal(top.score, 0.75);
  assert.deepEqual(top.missing, ['Parmesan']);
});

test('matching normalizes names, excludes past dates and breaks ties by urgency', () => {
  const ranked = recommend([
    { name: ' baby  SPINACH ', expiration: today },
    { name: 'Pasta', expiration: '2026-11-23' },
    { name: 'Greek yogurt', expiration: '2026-12-01' },
    { name: 'Lemon', expiration: '2026-12-01' },
    { name: 'Chickpeas', expiration: '2026-12-01' },
  ], today);
  assert.ok(ranked.findIndex(recipe => recipe.id === 'pasta') < ranked.findIndex(recipe => recipe.id === 'salad'));
  assert.deepEqual(ranked.find(recipe => recipe.id === 'pasta').missing, ['Pasta', 'Parmesan']);
});

test('shopping list deduplicates names and preserves checked state', () => {
  const list = [{ id: '1', name: 'Olive oil', checked: true }];
  const updated = addShoppingItems(list, ['olive  OIL', 'Parmesan', ' parmesan '], () => '2');
  assert.deepEqual(updated, [...list, { id: '2', name: 'Parmesan', checked: false }]);
});

test('using an ingredient adds its value in cents once', () => {
  const state = sampleState(new Date(2026, 10, 24));
  const item = state.inventory[0];
  const updated = useIngredient(state, item.id);
  assert.equal(updated.savedCents, state.savedCents + item.cents);
  assert.equal(updated.inventory.length, state.inventory.length - 1);
  assert.equal(useIngredient(updated, item.id), updated);
});
