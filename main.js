const customer = require("./scripts/customer");
const vehicle = require("./scripts/vehicle");

const GENERATORS = {
  customer: customer.generate,
  vehicle: vehicle.generate,
};

function printUsage() {
  console.log(`Usage: node main.js [${Object.keys(GENERATORS).join("|")}|all]`);
}

function main() {
  const target = process.argv[2] || "all";

  if (target === "all") {
    Object.values(GENERATORS).forEach((generate) => generate());
    return;
  }

  const generate = GENERATORS[target];
  if (!generate) {
    console.error(`Unknown target: ${target}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  generate();
}

main();
