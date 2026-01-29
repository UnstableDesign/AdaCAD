// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { promisify } from 'node:util';
import { cryptoModule } from './node-crypto.js';
import { CloudSQLConnectorError } from './errors.js';
export async function generateKeys() {
    const crypto = await cryptoModule();
    const keygen = promisify(crypto.generateKeyPair);
    const { privateKey, publicKey } = await keygen('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
    });
    return {
        privateKey,
        publicKey,
    };
}
export async function parseCert(cert) {
    const { X509Certificate } = await cryptoModule();
    try {
        const parsed = new X509Certificate(cert);
        if (parsed && parsed.validTo) {
            return {
                cert,
                expirationTime: parsed.validTo,
            };
        }
        throw new CloudSQLConnectorError({
            message: 'Could not read ephemeral certificate.',
            code: 'EPARSESQLADMINEPH',
        });
    }
    catch (err) {
        throw new CloudSQLConnectorError({
            message: 'Failed to parse as X.509 certificate.',
            code: 'EPARSESQLADMINEPH',
            errors: [err],
        });
    }
}
//# sourceMappingURL=crypto.js.map