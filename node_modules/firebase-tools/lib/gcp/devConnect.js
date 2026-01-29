"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoDetailsFromBackend = exports.extractGitRepositoryLinkComponents = exports.generateP4SA = exports.serviceAgentEmail = exports.sortConnectionsByCreateTime = exports.fetchGitRepositoryLinkReadToken = exports.getGitRepositoryLink = exports.createGitRepositoryLink = exports.parseGitRepositoryLinkName = exports.fetchGitHubInstallations = exports.listAllBranches = exports.listAllLinkableGitRepositories = exports.listAllConnections = exports.getConnection = exports.deleteConnection = exports.createConnection = exports.client = void 0;
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const serviceusage_1 = require("./serviceusage");
const error_1 = require("../error");
const githubConnections_1 = require("../apphosting/githubConnections");
const PAGE_SIZE_MAX = 1000;
const LOCATION_OVERRIDE = process.env.FIREBASE_DEVELOPERCONNECT_LOCATION_OVERRIDE;
exports.client = new apiv2_1.Client({
    urlPrefix: (0, api_1.developerConnectOrigin)(),
    auth: true,
    apiVersion: "v1",
});
async function createConnection(projectId, location, connectionId, githubConfig = {}) {
    const config = Object.assign(Object.assign({}, githubConfig), { githubApp: "FIREBASE" });
    const res = await exports.client.post(`projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections`, {
        githubConfig: config,
    }, { queryParams: { connectionId } });
    return res.body;
}
exports.createConnection = createConnection;
async function deleteConnection(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}`;
    const res = await exports.client.delete(name, { queryParams: { force: "true" } });
    return res.body;
}
exports.deleteConnection = deleteConnection;
async function getConnection(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}`;
    const res = await exports.client.get(name);
    return res.body;
}
exports.getConnection = getConnection;
async function listAllConnections(projectId, location) {
    const conns = [];
    const getNextPage = async (pageToken = "") => {
        const res = await exports.client.get(`/projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections`, {
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
exports.listAllConnections = listAllConnections;
async function listAllLinkableGitRepositories(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}:fetchLinkableGitRepositories`;
    const repos = [];
    const getNextPage = async (pageToken = "") => {
        const res = await exports.client.get(name, {
            queryParams: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.linkableGitRepositories)) {
            repos.push(...res.body.linkableGitRepositories);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return repos;
}
exports.listAllLinkableGitRepositories = listAllLinkableGitRepositories;
async function listAllBranches(repoLinkName) {
    const branches = new Set();
    const getNextPage = async (pageToken = "") => {
        const res = await exports.client.get(`${repoLinkName}:fetchGitRefs`, {
            queryParams: {
                refType: "BRANCH",
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.refNames)) {
            res.body.refNames.forEach((branch) => {
                branches.add(branch);
            });
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return branches;
}
exports.listAllBranches = listAllBranches;
async function fetchGitHubInstallations(projectId, location, connectionId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}:fetchGitHubInstallations`;
    const res = await exports.client.get(name);
    return res.body.installations;
}
exports.fetchGitHubInstallations = fetchGitHubInstallations;
function parseGitRepositoryLinkName(gitRepositoryLinkName) {
    const [, projectName, , location, , connectionName, , id] = gitRepositoryLinkName.split("/");
    return { projectName, location, connectionName, id };
}
exports.parseGitRepositoryLinkName = parseGitRepositoryLinkName;
async function createGitRepositoryLink(projectId, location, connectionId, gitRepositoryLinkId, cloneUri) {
    const res = await exports.client.post(`projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}/gitRepositoryLinks`, { cloneUri }, { queryParams: { gitRepositoryLinkId } });
    return res.body;
}
exports.createGitRepositoryLink = createGitRepositoryLink;
async function getGitRepositoryLink(projectId, location, connectionId, gitRepositoryLinkId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}/gitRepositoryLinks/${gitRepositoryLinkId}`;
    const res = await exports.client.get(name);
    return res.body;
}
exports.getGitRepositoryLink = getGitRepositoryLink;
async function fetchGitRepositoryLinkReadToken(projectId, location, connectionId, gitRepositoryLinkId) {
    const name = `projects/${projectId}/locations/${LOCATION_OVERRIDE !== null && LOCATION_OVERRIDE !== void 0 ? LOCATION_OVERRIDE : location}/connections/${connectionId}/gitRepositoryLinks/${gitRepositoryLinkId}:fetchReadToken`;
    const res = await exports.client.post(name);
    return res.body;
}
exports.fetchGitRepositoryLinkReadToken = fetchGitRepositoryLinkReadToken;
function sortConnectionsByCreateTime(connections) {
    return connections.sort((a, b) => {
        return Date.parse(a.createTime) - Date.parse(b.createTime);
    });
}
exports.sortConnectionsByCreateTime = sortConnectionsByCreateTime;
function serviceAgentEmail(projectNumber) {
    return `service-${projectNumber}@${(0, api_1.developerConnectP4SADomain)()}`;
}
exports.serviceAgentEmail = serviceAgentEmail;
async function generateP4SA(projectNumber) {
    const devConnectOrigin = (0, api_1.developerConnectOrigin)();
    await (0, serviceusage_1.generateServiceIdentityAndPoll)(projectNumber, new URL(devConnectOrigin).hostname, "apphosting");
}
exports.generateP4SA = generateP4SA;
function extractGitRepositoryLinkComponents(path) {
    const connectionMatch = /connections\/([^\/]+)/.exec(path);
    const repositoryMatch = /gitRepositoryLinks\/([^\/]+)/.exec(path);
    const connection = connectionMatch ? connectionMatch[1] : null;
    const gitRepoLink = repositoryMatch ? repositoryMatch[1] : null;
    return { connection, gitRepoLink };
}
exports.extractGitRepositoryLinkComponents = extractGitRepositoryLinkComponents;
async function getRepoDetailsFromBackend(projectId, location, gitRepoLinkPath) {
    const { connection, gitRepoLink } = extractGitRepositoryLinkComponents(gitRepoLinkPath);
    if (!connection || !gitRepoLink) {
        throw new error_1.FirebaseError(`Failed to extract connection or repository resource names from backend repository name.`);
    }
    const repoLink = await getGitRepositoryLink(projectId, location, connection, gitRepoLink);
    const repoSlug = (0, githubConnections_1.extractRepoSlugFromUri)(repoLink.cloneUri);
    const owner = repoSlug === null || repoSlug === void 0 ? void 0 : repoSlug.split("/")[0];
    const repo = repoSlug === null || repoSlug === void 0 ? void 0 : repoSlug.split("/")[1];
    if (!owner || !repo) {
        throw new error_1.FirebaseError("Failed to parse owner and repo from git repository link");
    }
    const readToken = await fetchGitRepositoryLinkReadToken(projectId, location, connection, gitRepoLink);
    return {
        repoLink,
        owner,
        repo,
        readToken,
    };
}
exports.getRepoDetailsFromBackend = getRepoDetailsFromBackend;
