import { Sandbox } from "@vercel/sandbox";

const base = await Sandbox.create({ persistent: false });
await base.runCommand("corepack", ["enable"]);
const snapshot = await base.snapshot({
  expiration: 14 * 24 * 60 * 60 * 1000,
});
console.log(snapshot.snapshotId);