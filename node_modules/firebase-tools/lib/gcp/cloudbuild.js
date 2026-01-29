"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultServiceAgent = exports.getDefaultServiceAccount = exports.deleteRepository = exports.getRepository = exports.createRepository = exports.fetchLinkableRepositories = exports.deleteConnection = exports.listConnections = exports.getConnection = exports.createConnection = void 0;
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const PAGE_SIZE_MAX = 100;
const client = new apiv2_1.Client({
    urlPrefix: (0, api_1.cloudbuildOrigin)(),
    auth: true,
    apiVersion: "v2",
});
async function createConnection(projectId, location, connectionId, githubConfig = {}) {
    const res = await client.post(`projects/${projectId}/locations/${location}/connections`, { githubConfig }, { queryParams: { connectionId } });
    return res.body;
}
exports.createConnection = createConnection;
async function getConnection(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${location}/connections/${connectionId}`;
    const res = await client.get(name);
    return res.body;
}
exports.getConnection = getConnection;
async function listConnections(projectId, location) {
    const conns = [];
    const getNextPage = async (pageToken = "") => {
        const res = await client.get(`/projects/${projectId}/locations/${location}/connections`, {
            queryParams: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.connections)) {
            conns.push(...res.body.connections);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return conns;
}
exports.listConnections = listConnections;
async function deleteConnection(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${location}/connections/${connectionId}`;
    const res = await client.delete(name);
    return res.body;
}
exports.deleteConnection = deleteConnection;
async function fetchLinkableRepositories(projectId, location, connectionId, pageToken = "", pageSize = 1000) {
    const name = `projects/${projectId}/locations/${location}/connections/${connectionId}:fetchLinkableRepositories`;
    const res = await client.get(name, {
        queryParams: {
            pageSize,
            pageToken,
        },
    });
    return res.body;
}
exports.fetchLinkableRepositories = fetchLinkableRepositories;
async function createRepository(projectId, location, connectionId, repositoryId, remoteUri) {
    const res = await client.post(`projects/${projectId}/locations/${location}/connections/${connectionId}/repositories`, { remoteUri }, { queryParams: { repositoryId } });
    return res.body;
}
exports.createRepository = createRepository;
async function getRepository(projectId, location, connectionId, repositoryId) {
    const name = `projects/${projectId}/locations/${location}/connections/${connectionId}/repositories/${repositoryId}`;
    const res = await client.get(name);
    return res.body;
}
exports.getRepository = getRepository;
async function deleteRepository(projectId, location, connectionId, repositoryId) {
    const name = `projects/${projectId}/locations/${location}/connections/${connectionId}/repositories/${repositoryId}`;
    const res = await client.delete(name);
    return res.body;
}
exports.deleteRepository = deleteRepository;
function getDefaultServiceAccount(projectNumber) {
    return `${projectNumber}@cloudbuild.gserviceaccount.com`;
}
exports.getDefaultServiceAccount = getDefaultServiceAccount;
function getDefaultServiceAgent(projectNumber) {
    return `service-${projectNumber}@gcp-sa-cloudbuild.iam.gserviceaccount.com`;
}
exports.getDefaultServiceAgent = getDefaultServiceAgent;
