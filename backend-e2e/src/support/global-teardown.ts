import { killPort } from '@nx/node/utils';
/* eslint-disable */

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await killPort(port);
  const g = globalThis as typeof globalThis & { __TEARDOWN_MESSAGE__?: string };
  if (g.__TEARDOWN_MESSAGE__) console.log(g.__TEARDOWN_MESSAGE__);
};
