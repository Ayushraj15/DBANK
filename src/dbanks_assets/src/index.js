import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory, canisterId } from "../../declarations/dbanks";

async function init() {
  const agent = new HttpAgent();

  // Only fetch root key in local development
  if (process.env.DFX_NETWORK === "local" || !process.env.DFX_NETWORK) {
    await agent.fetchRootKey().catch(err => {
      console.warn("Unable to fetch root key. Check if local replica is running.");
      console.error(err);
    });
  }

  const dbanks = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  // Set up event listeners AFTER agent is ready
  window.addEventListener("load", async function () {
    await update();
  });

  document.querySelector("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = event.target.querySelector("#submit-btn");
    const inputAmount = parseFloat(document.getElementById("input-amount").value);
    const outputAmount = parseFloat(document.getElementById("withdrawal-amount").value);

    button.setAttribute("disabled", true);

    if (document.getElementById("input-amount").value.length !== 0) {
      await dbanks.topUp(inputAmount);
    }

    if (document.getElementById("withdrawal-amount").value.length !== 0) {
      await dbanks.withdraw(outputAmount);
    }

    await dbanks.compound();
    await update();

    document.getElementById("input-amount").value = "";
    document.getElementById("withdrawal-amount").value = "";

    button.removeAttribute("disabled");
  });

  async function update() {
    const currentAmount = await dbanks.checkBalance();
    document.getElementById("value").innerText =
      Math.round(currentAmount * 100) / 100;
  }
}

// ✅ Ensure everything waits for root key before running
init();

