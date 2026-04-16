import { logSearchAction, getPlatformStats } from "./src/app/actions/flightActions";

async function run() {
  await logSearchAction("DEL", "BOM", "2024-05-15", 5);
  const stats = await getPlatformStats();
  console.log("Stats:", stats);
}
run();
