"use strict";
// Copyright 2025 Google LLC
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTxtRecord = resolveTxtRecord;
const node_dns_1 = __importDefault(require("node:dns"));
const errors_1 = require("./errors");
async function resolveTxtRecord(name) {
    return new Promise((resolve, reject) => {
        node_dns_1.default.resolveTxt(name, (err, addresses) => {
            if (err) {
                reject(new errors_1.CloudSQLConnectorError({
                    code: 'EDOMAINNAMELOOKUPERROR',
                    message: 'Error looking up TXT record for domain ' + name,
                    errors: [err],
                }));
                return;
            }
            if (!addresses || addresses.length === 0) {
                reject(new errors_1.CloudSQLConnectorError({
                    code: 'EDOMAINNAMELOOKUPFAILED',
                    message: 'No records returned for domain ' + name,
                }));
                return;
            }
            // Each result may be split into multiple strings. Join the strings.
            const joinedAddresses = addresses.map(strs => strs.join(''));
            // Sort the results alphabetically for consistency,
            joinedAddresses.sort((a, b) => a.localeCompare(b));
            // Return the first result.
            resolve(joinedAddresses[0]);
        });
    });
}
//# sourceMappingURL=dns-lookup.js.map