"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("colorette");
const loadCJSON_1 = require("../../loadCJSON");
const rulesDeploy_1 = require("../../rulesDeploy");
const utils = require("../../utils");
const fsConfig = require("../../firestore/fsConfig");
const logger_1 = require("../../logger");
function prepareRules(context, rulesDeploy, databaseId, rulesFile) {
    rulesDeploy.addFile(rulesFile);
    context.firestore.rules.push({
        databaseId,
        rulesFile,
    });
}
function prepareIndexes(context, options, databaseId, indexesFileName) {
    const indexesPath = options.config.path(indexesFileName);
    const indexesRawSpec = (0, loadCJSON_1.loadCJSON)(indexesPath);
    utils.logBullet(`${clc.bold(clc.cyan("firestore:"))} reading indexes from ${clc.bold(indexesFileName)}...`);
    context.firestore.indexes.push({
        databaseId,
        indexesFileName,
        indexesRawSpec,
    });
}
async function default_1(context, options) {
    var _a;
    if (options.only) {
        const targets = options.only.split(",");
        const excludeRules = targets.indexOf("firestore:indexes") >= 0;
        const excludeIndexes = targets.indexOf("firestore:rules") >= 0;
        const includeRules = targets.indexOf("firestore:rules") >= 0;
        const includeIndexes = targets.indexOf("firestore:indexes") >= 0;
        const onlyFirestore = targets.indexOf("firestore") >= 0;
        context.firestoreIndexes = !excludeIndexes || includeIndexes || onlyFirestore;
        context.firestoreRules = !excludeRules || includeRules || onlyFirestore;
    }
    else {
        context.firestoreIndexes = true;
        context.firestoreRules = true;
    }
    const firestoreConfigs = fsConfig.getFirestoreConfig(context.projectId, options);
    if (!firestoreConfigs || firestoreConfigs.length === 0) {
        return;
    }
    context.firestore = context.firestore || {};
    context.firestore.indexes = [];
    context.firestore.rules = [];
    const rulesDeploy = new rulesDeploy_1.RulesDeploy(options, rulesDeploy_1.RulesetServiceType.CLOUD_FIRESTORE);
    context.firestore.rulesDeploy = rulesDeploy;
    for (const firestoreConfig of firestoreConfigs) {
        if (firestoreConfig.indexes) {
            prepareIndexes(context, options, firestoreConfig.database, firestoreConfig.indexes);
        }
        if (firestoreConfig.rules) {
            prepareRules(context, rulesDeploy, firestoreConfig.database, firestoreConfig.rules);
        }
    }
    if (context.firestore.rules.length > 0) {
        await rulesDeploy.compile();
    }
    const rulesContext = (_a = context === null || context === void 0 ? void 0 : context.firestore) === null || _a === void 0 ? void 0 : _a.rules;
    for (const ruleContext of rulesContext) {
        const databaseId = ruleContext.databaseId;
        const rulesFile = ruleContext.rulesFile;
        if (!rulesFile) {
            logger_1.logger.error(`Invalid firestore config for ${databaseId} database: ${JSON.stringify(options.config.src.firestore)}`);
        }
    }
}
exports.default = default_1;
