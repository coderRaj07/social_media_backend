import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';

function generateRSAKeys(name: string) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Write original PEM files (optional)
  writeFileSync(`${name}_private.pem`, privateKey);
  writeFileSync(`${name}_public.pem`, publicKey);

  // Convert to base64 for env usage
  const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
  const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

  // Save base64 versions (optional)
  writeFileSync(`${name}_private.b64`, privateKeyBase64);
  writeFileSync(`${name}_public.b64`, publicKeyBase64);

  console.log(`✔ ${name} keys generated`);
  console.log(`Private Key (base64):\n${privateKeyBase64}\n`);
  console.log(`Public Key (base64):\n${publicKeyBase64}\n`);
}

// Generate access & refresh token keys
generateRSAKeys('access_token');
generateRSAKeys('refresh_token');

console.log('All RSA keys generated in base64 format!');

// Locate this file on cmd and run
// ts-node generate-rsa-keys.ts

