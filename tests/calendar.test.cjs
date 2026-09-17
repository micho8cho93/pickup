const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8')
  .replaceAll('import.meta.url', "'https://example.test/script.js'")
  .replace(/\/\/ Start the application when DOM is ready[\s\S]*$/, 'globalThis.testExports = { utils, ui };');
const context = {
  window: { location: { hostname: 'localhost', origin: 'http://localhost:3000' } },
  document: { getElementById: () => ({}) },
  URL,
};
vm.runInNewContext(source, context);
const { utils, ui } = context.testExports;

test('calendar shows today and 29 further dates across month and week boundaries', () => {
  const dates = utils.getVisibleDates();
  assert.equal(dates.length, 30);
  assert.equal(utils.getDayKey(dates[0]), utils.getDayKey(new Date()));

  const lastExpected = new Date(dates[0]);
  lastExpected.setDate(lastExpected.getDate() + 29);
  assert.equal(utils.getDayKey(dates[29]), utils.getDayKey(lastExpected));

  const games = [new Date(2026, 8, 30, 12), new Date(2026, 9, 7, 12)]
    .map((date, id) => ({ id, time: date.toISOString() }));
  const grouped = ui.groupGamesByDay(games);
  assert.equal(grouped['2026-09-30'].length, 1);
  assert.equal(grouped['2026-10-07'].length, 1);
});

test('game title links valid Maps URLs and safely renders legacy or invalid links', () => {
  const game = {
    id: 1, location: 'Downtown', location_map_url: 'https://maps.app.goo.gl/abc?x=1&y=2',
    time: new Date().toISOString(), max_players: 10, current_players: 0, price: 5,
  };
  const linked = ui.createGameCard(game);
  assert.match(linked, /class="location-link"/);
  assert.match(linked, /href="https:\/\/maps\.app\.goo\.gl\/abc\?x=1&amp;y=2"/);

  const legacy = ui.createGameCard({ ...game, location_map_url: '' });
  assert.doesNotMatch(legacy, /class="location-link"/);

  const unsafe = ui.createGameCard({
    ...game, location: '<img src=x onerror=alert(1)>', location_map_url: 'javascript:alert(1)',
  });
  assert.doesNotMatch(unsafe, /<img/);
  assert.doesNotMatch(unsafe, /class="location-link"/);
});
