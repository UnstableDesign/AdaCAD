"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLatestRevisionTagged = exports.setRewriteTags = exports.setGarbageCollectionThreshold = exports.gcTagsForServices = exports.TODO_TAG_NAME = void 0;
const node_path_1 = require("node:path");
const run = require("../gcp/run");
const api = require("./api");
const error_1 = require("../error");
const functional_1 = require("../functional");
exports.TODO_TAG_NAME = "this is an invalid tag name so it cannot be real";
async function gcTagsForServices(project, services) {
    var _a;
    const validTagsByServiceByRegion = {};
    const sites = await api.listSites(project);
    const allVersionsNested = await Promise.all(sites.map((site) => api.listVersions(node_path_1.posix.basename(site.name))));
    const activeVersions = [...(0, functional_1.flattenArray)(allVersionsNested)].filter((version) => {
        return version.status === "CREATED" || version.status === "FINALIZED";
    });
    for (const version of activeVersions) {
        for (const rewrite of ((_a = version === null || version === void 0 ? void 0 : version.config) === null || _a === void 0 ? void 0 : _a.rewrites) || []) {
            if (!("run" in rewrite) || !rewrite.run.tag) {
                continue;
            }
            validTagsByServiceByRegion[rewrite.run.region] =
                validTagsByServiceByRegion[rewrite.run.region] || {};
            validTagsByServiceByRegion[rewrite.run.region][rewrite.run.serviceId] =
                validTagsByServiceByRegion[rewrite.run.region][rewrite.run.serviceId] || new Set();
            validTagsByServiceByRegion[rewrite.run.region][rewrite.run.serviceId].add(rewrite.run.tag);
        }
    }
    for (const service of services) {
        const { region, serviceId } = run.gcpIds(service);
        service.spec.traffic = (service.spec.traffic || []).filter((traffic) => {
            var _a, _b;
            if (traffic.percent) {
                return true;
            }
            if (!traffic.tag) {
                return true;
            }
            if (!traffic.tag.startsWith("fh-")) {
                return true;
            }
            if ((_b = (_a = validTagsByServiceByRegion[region]) === null || _a === void 0 ? void 0 : _a[serviceId]) === null || _b === void 0 ? void 0 : _b.has(traffic.tag)) {
                return true;
            }
            return false;
        });
    }
}
exports.gcTagsForServices = gcTagsForServices;
let garbageCollectionThreshold = 500;
function setGarbageCollectionThreshold(threshold) {
    garbageCollectionThreshold = threshold;
}
exports.setGarbageCollectionThreshold = setGarbageCollectionThreshold;
async function setRewriteTags(rewrites, project, version) {
    const services = await Promise.all(rewrites
        .map((rewrite) => {
        if (!("run" in rewrite)) {
            return null;
        }
        if (rewrite.run.tag !== exports.TODO_TAG_NAME) {
            return null;
        }
        return run.getService(`projects/${project}/locations/${rewrite.run.region}/services/${rewrite.run.serviceId}`);
    })
        .filter((s) => s !== null));
    if (!services.length) {
        return;
    }
    const needsGC = services
        .map((service) => {
        return service.spec.traffic.filter((traffic) => traffic.tag).length;
    })
        .some((length) => length >= garbageCollectionThreshold);
    if (needsGC) {
        await exports.gcTagsForServices(project, services);
    }
    const tags = await exports.ensureLatestRevisionTagged(services, `fh-${version}`);
    for (const rewrite of rewrites) {
        if (!("run" in rewrite) || rewrite.run.tag !== exports.TODO_TAG_NAME) {
            continue;
        }
        const tag = tags[rewrite.run.region][rewrite.run.serviceId];
        rewrite.run.tag = tag;
    }
}
exports.setRewriteTags = setRewriteTags;
async function ensureLatestRevisionTagged(services, defaultTag) {
    var _a;
    const tags = {};
    const updateServices = [];
    for (const service of services) {
        const { projectNumber, region, serviceId } = run.gcpIds(service);
        tags[region] = tags[region] || {};
        const latestRevision = (_a = service.status) === null || _a === void 0 ? void 0 : _a.latestReadyRevisionName;
        if (!latestRevision) {
            throw new error_1.FirebaseError(`Assertion failed: service ${service.metadata.name} has no ready revision`);
        }
        const alreadyTagged = service.spec.traffic.find((target) => target.revisionName === latestRevision && target.tag);
        if (alreadyTagged) {
            tags[region][serviceId] = alreadyTagged.tag;
            continue;
        }
        tags[region][serviceId] = defaultTag;
        service.spec.traffic.push({
            revisionName: latestRevision,
            tag: defaultTag,
        });
        updateServices.push(run.updateService(`projects/${projectNumber}/locations/${region}/services/${serviceId}`, service));
    }
    await Promise.all(updateServices);
    return tags;
}
exports.ensureLatestRevisionTagged = ensureLatestRevisionTagged;
