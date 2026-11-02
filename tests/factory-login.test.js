const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { factory, tempHome, runScript, browser, TOKEN } = require('./fixtures/factory-fake');

function run(t, action, api, onLine) {
  return runIn(tempHome(t), action, api, onLine);
}
function runIn(home, action, api, onLine) {
  return runScript('factory-login', [action], { home, api, onLine });
}

test('login trades the one-time code for the token, stores it owner-only and never prints it', async t => {
  const fake = await factory(t);
  const out = await run(t, 'login', fake.api, browser(fake));
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Connected to factory custom/);
  assert.equal(out.stdout.includes(TOKEN), false);
  assert.equal(fs.readFileSync(path.join(out.home, 'factory-token'), 'utf8').trim(), TOKEN);
  assert.equal(fake.seen.exchange[0].auth, undefined);
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(out.home, 'factory-token')).mode & 0o777, 0o600);
  const link = new URL(out.stdout.match(/https:\/\/\S+/)[0]);
  assert.ok(Number(link.searchParams.get('port')) >= 1024);
  assert.equal(link.searchParams.get('challenge').length, 43);
});

test('a forged state, a foreign Host header or a denial never stores a token', async t => {
  const fake = await factory(t);
  const forged = await run(t, 'login', fake.api, browser(fake, { state: 'forged' }));
  assert.match(forged.stdout, /timed out/);
  const hostile = await run(t, 'login', fake.api, browser(fake, { host: 'evil.example' }));
  assert.match(hostile.stdout, /timed out/);
  const denied = await run(t, 'login', fake.api, browser(fake, { deny: true }));
  assert.match(denied.stdout, /declined.*aviso formal/);
  for (const out of [forged, hostile, denied]) {
    assert.equal(out.status, 1);
    assert.equal(fs.existsSync(path.join(out.home, 'factory-token')), false);
  }
  assert.equal(fake.seen.exchange.length, 0);
});

test('a code factory refuses ends the login with the reason factory gave and no token', async t => {
  const fake = await factory(t);
  fake.approve = () => {};
  const out = await run(t, 'login', fake.api, browser(fake));
  assert.equal(out.status, 1);
  assert.match(out.stdout, /Invalid or expired authorization code/);
  assert.equal(fs.existsSync(path.join(out.home, 'factory-token')), false);
});

test('status reports the person and expiry; logout revokes and deletes even when factory is down', async t => {
  const fake = await factory(t);
  const home = tempHome(t);
  assert.match((await runIn(home, 'status', fake.api)).stdout, /Not connected/);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  assert.match((await runIn(home, 'status', fake.api)).stdout, /as Ana, token expires on 2027-01-05/);
  assert.match((await runIn(home, 'logout', fake.api)).stdout, /revoked in factory/);
  assert.equal(fake.seen.deleted, 1);
  assert.equal(fs.existsSync(path.join(home, 'factory-token')), false);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  const offline = await runIn(home, 'logout', 'http://127.0.0.1:9/api/v1');
  assert.match(offline.stdout, /could not confirm the revocation/);
  assert.equal(fs.existsSync(path.join(home, 'factory-token')), false);
});

test('the browser ends on the factory result screen, named only by the outcome', async t => {
  const fake = await factory(t);
  const connected = [];
  const ok = await run(t, 'login', fake.api, browser(fake, { answers: connected }));
  assert.equal(ok.status, 0, ok.stdout);
  assert.deepEqual(connected, [{ status: 303, location: 'https://web.example/my-hours/connect/done?result=connected', cache: 'no-store' }]);
  const declined = [];
  await run(t, 'login', fake.api, browser(fake, { deny: true, answers: declined }));
  assert.equal(declined[0].location, 'https://web.example/my-hours/connect/done?result=denied');
  const refused = [];
  const failing = await factory(t);
  failing.approve = () => {};
  await run(t, 'login', failing.api, browser(failing, { answers: refused }));
  assert.equal(refused[0].location, 'https://web.example/my-hours/connect/done?result=failed');
});

test('a replayed callback is refused and starts no second exchange', async t => {
  const fake = await factory(t);
  const answers = [];
  const out = await run(t, 'login', fake.api, browser(fake, { replay: true, answers }));
  assert.equal(out.status, 0, out.stdout);
  assert.equal(fake.seen.exchange.length, 1);
  assert.ok(answers.length <= 2 && answers.filter((a) => a.status === 303).length === 1);
});
