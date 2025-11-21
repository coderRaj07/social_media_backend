import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";

function generateRSAKeys(name: string) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  writeFileSync(`${name}_private.pem`, privateKey);
  writeFileSync(`${name}_public.pem`, publicKey);

  console.log(`✔ Generated ${name}_private.pem`);
  console.log(`✔ Generated ${name}_public.pem`);
}

generateRSAKeys("access_token");
generateRSAKeys("refresh_token");

console.log("\nAll RSA keys generated successfully!");

// Locate this file on cmd and run
// ts-node generate-rsa-keys.ts

