import { runBotCrefisa } from "./crefisa.js";

const credentials = [
  { username: "1305.47486068869", password: "Prospcref#03" },
  { username: "1305.30839099851", password: "Prospcref#01" },
];

const credentialQueue = [];
let inUse = new Set();

function waitForCredential() {
  return new Promise((resolve) => {
    credentialQueue.push(resolve);
  });
}

function getAvailableCredential() {
  return credentials.find((cred) => !inUse.has(cred.username));
}

function releaseCredential(username) {
  inUse.delete(username);
  if (credentialQueue.length > 0) {
    const next = credentialQueue.shift();
    next();
  }
}

export async function enqueueBotJob(cpf, benefitNumber, clientName) {
  let cred = getAvailableCredential();

  // Espera até que alguma credencial fique disponível
  while (!cred) {
    await waitForCredential();
    cred = getAvailableCredential();
  }

  inUse.add(cred.username);

  console.log("Usando credencial:", cred.username);
  console.log("Número da fila:", credentialQueue.length + 1);

  try {
    const result = await runBotCrefisa(
      cred.username,
      cred.password,
      cpf,
      benefitNumber,
      clientName
    );
    return result;
  } finally {
    releaseCredential(cred.username);
  }
}
