"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCodeBlock = exports.generateOperation = exports.chatWithFirebase = exports.generateSchema = exports.PROMPT_GENERATE_SEED_DATA = exports.PROMPT_GENERATE_CONNECTOR = void 0;
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const error_1 = require("../error");
const apiClient = new apiv2_1.Client({ urlPrefix: (0, api_1.cloudAiCompanionOrigin)(), auth: true });
const SCHEMA_GENERATOR_EXPERIENCE = "/appeco/firebase/fdc-schema-generator";
const GEMINI_IN_FIREBASE_EXPERIENCE = "/appeco/firebase/firebase-chat/free";
const OPERATION_GENERATION_EXPERIENCE = "/appeco/firebase/fdc-query-generator";
const FIREBASE_CHAT_REQUEST_CONTEXT_TYPE_NAME = "type.googleapis.com/google.cloud.cloudaicompanion.v1main.FirebaseChatRequestContext";
exports.PROMPT_GENERATE_CONNECTOR = "Create 4 operations for an app using the instance schema with proper authentication.";
exports.PROMPT_GENERATE_SEED_DATA = "Create a mutation to populate the database with some seed data.";
async function generateSchema(prompt, project, chatHistory = []) {
    const res = await apiClient.post(`/v1beta/projects/${project}/locations/global/instances/default:completeTask`, {
        input: { messages: [...chatHistory, { content: prompt, author: "USER" }] },
        experienceContext: {
            experience: SCHEMA_GENERATOR_EXPERIENCE,
        },
    });
    return extractCodeBlock(res.body.output.messages[0].content);
}
exports.generateSchema = generateSchema;
async function chatWithFirebase(prompt, project, chatHistory = []) {
    const res = await apiClient.post(`/v1beta/projects/${project}/locations/global/instances/default:completeTask`, {
        input: { messages: [...chatHistory, { content: prompt, author: "USER" }] },
        experienceContext: {
            experience: GEMINI_IN_FIREBASE_EXPERIENCE,
        },
    });
    return res.body;
}
exports.chatWithFirebase = chatWithFirebase;
async function generateOperation(prompt, service, project, chatHistory = []) {
    const res = await apiClient.post(`/v1beta/projects/${project}/locations/global/instances/default:completeTask`, {
        input: { messages: [...chatHistory, { content: prompt, author: "USER" }] },
        experienceContext: {
            experience: OPERATION_GENERATION_EXPERIENCE,
        },
        clientContext: {
            additionalContext: {
                "@type": FIREBASE_CHAT_REQUEST_CONTEXT_TYPE_NAME,
                fdcInfo: { fdcServiceName: service, requiresQuery: true },
            },
        },
    });
    return extractCodeBlock(res.body.output.messages[0].content);
}
exports.generateOperation = generateOperation;
function extractCodeBlock(text) {
    const regex = /```(?:[a-z]+\n)?([\s\S]*?)```/m;
    const match = text.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    throw new error_1.FirebaseError(`No code block found in the generated response: ${text}`);
}
exports.extractCodeBlock = extractCodeBlock;
