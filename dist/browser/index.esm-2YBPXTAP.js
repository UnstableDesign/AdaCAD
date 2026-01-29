import {
  Component,
  D,
  ErrorFactory,
  LogLevel,
  Logger,
  _getProvider,
  _registerComponent,
  areCookiesEnabled,
  deepEqual,
  getApp,
  getModularInstance,
  isIndexedDBAvailable,
  ot,
  registerVersion,
  rt,
  validateIndexedDBOpenable
} from "./chunk-FRS2CDCJ.js";
import {
  __spreadValues
} from "./chunk-TWWAJFRB.js";

// node_modules/@firebase/performance/dist/esm/index.esm.js
var name = "@firebase/performance";
var version = "0.7.9";
var SDK_VERSION = version;
var TRACE_START_MARK_PREFIX = "FB-PERF-TRACE-START";
var TRACE_STOP_MARK_PREFIX = "FB-PERF-TRACE-STOP";
var TRACE_MEASURE_PREFIX = "FB-PERF-TRACE-MEASURE";
var OOB_TRACE_PAGE_LOAD_PREFIX = "_wt_";
var FIRST_PAINT_COUNTER_NAME = "_fp";
var FIRST_CONTENTFUL_PAINT_COUNTER_NAME = "_fcp";
var FIRST_INPUT_DELAY_COUNTER_NAME = "_fid";
var LARGEST_CONTENTFUL_PAINT_METRIC_NAME = "_lcp";
var LARGEST_CONTENTFUL_PAINT_ATTRIBUTE_NAME = "lcp_element";
var INTERACTION_TO_NEXT_PAINT_METRIC_NAME = "_inp";
var INTERACTION_TO_NEXT_PAINT_ATTRIBUTE_NAME = "inp_interactionTarget";
var CUMULATIVE_LAYOUT_SHIFT_METRIC_NAME = "_cls";
var CUMULATIVE_LAYOUT_SHIFT_ATTRIBUTE_NAME = "cls_largestShiftTarget";
var CONFIG_LOCAL_STORAGE_KEY = "@firebase/performance/config";
var CONFIG_EXPIRY_LOCAL_STORAGE_KEY = "@firebase/performance/configexpire";
var SERVICE = "performance";
var SERVICE_NAME = "Performance";
var ERROR_DESCRIPTION_MAP = {
  [
    "trace started"
    /* ErrorCode.TRACE_STARTED_BEFORE */
  ]: "Trace {$traceName} was started before.",
  [
    "trace stopped"
    /* ErrorCode.TRACE_STOPPED_BEFORE */
  ]: "Trace {$traceName} is not running.",
  [
    "nonpositive trace startTime"
    /* ErrorCode.NONPOSITIVE_TRACE_START_TIME */
  ]: "Trace {$traceName} startTime should be positive.",
  [
    "nonpositive trace duration"
    /* ErrorCode.NONPOSITIVE_TRACE_DURATION */
  ]: "Trace {$traceName} duration should be positive.",
  [
    "no window"
    /* ErrorCode.NO_WINDOW */
  ]: "Window is not available.",
  [
    "no app id"
    /* ErrorCode.NO_APP_ID */
  ]: "App id is not available.",
  [
    "no project id"
    /* ErrorCode.NO_PROJECT_ID */
  ]: "Project id is not available.",
  [
    "no api key"
    /* ErrorCode.NO_API_KEY */
  ]: "Api key is not available.",
  [
    "invalid cc log"
    /* ErrorCode.INVALID_CC_LOG */
  ]: "Attempted to queue invalid cc event",
  [
    "FB not default"
    /* ErrorCode.FB_NOT_DEFAULT */
  ]: "Performance can only start when Firebase app instance is the default one.",
  [
    "RC response not ok"
    /* ErrorCode.RC_NOT_OK */
  ]: "RC response is not ok",
  [
    "invalid attribute name"
    /* ErrorCode.INVALID_ATTRIBUTE_NAME */
  ]: "Attribute name {$attributeName} is invalid.",
  [
    "invalid attribute value"
    /* ErrorCode.INVALID_ATTRIBUTE_VALUE */
  ]: "Attribute value {$attributeValue} is invalid.",
  [
    "invalid custom metric name"
    /* ErrorCode.INVALID_CUSTOM_METRIC_NAME */
  ]: "Custom metric name {$customMetricName} is invalid",
  [
    "invalid String merger input"
    /* ErrorCode.INVALID_STRING_MERGER_PARAMETER */
  ]: "Input for String merger is invalid, contact support team to resolve.",
  [
    "already initialized"
    /* ErrorCode.ALREADY_INITIALIZED */
  ]: "initializePerformance() has already been called with different options. To avoid this error, call initializePerformance() with the same options as when it was originally called, or call getPerformance() to return the already initialized instance."
};
var ERROR_FACTORY = new ErrorFactory(SERVICE, SERVICE_NAME, ERROR_DESCRIPTION_MAP);
var consoleLogger = new Logger(SERVICE_NAME);
consoleLogger.logLevel = LogLevel.INFO;
var apiInstance;
var windowInstance;
var Api = class _Api {
  constructor(window2) {
    this.window = window2;
    if (!window2) {
      throw ERROR_FACTORY.create(
        "no window"
        /* ErrorCode.NO_WINDOW */
      );
    }
    this.performance = window2.performance;
    this.PerformanceObserver = window2.PerformanceObserver;
    this.windowLocation = window2.location;
    this.navigator = window2.navigator;
    this.document = window2.document;
    if (this.navigator && this.navigator.cookieEnabled) {
      this.localStorage = window2.localStorage;
    }
    if (window2.perfMetrics && window2.perfMetrics.onFirstInputDelay) {
      this.onFirstInputDelay = window2.perfMetrics.onFirstInputDelay;
    }
    this.onLCP = ot;
    this.onINP = rt;
    this.onCLS = D;
  }
  getUrl() {
    return this.windowLocation.href.split("?")[0];
  }
  mark(name2) {
    if (!this.performance || !this.performance.mark) {
      return;
    }
    this.performance.mark(name2);
  }
  measure(measureName, mark1, mark2) {
    if (!this.performance || !this.performance.measure) {
      return;
    }
    this.performance.measure(measureName, mark1, mark2);
  }
  getEntriesByType(type) {
    if (!this.performance || !this.performance.getEntriesByType) {
      return [];
    }
    return this.performance.getEntriesByType(type);
  }
  getEntriesByName(name2) {
    if (!this.performance || !this.performance.getEntriesByName) {
      return [];
    }
    return this.performance.getEntriesByName(name2);
  }
  getTimeOrigin() {
    return this.performance && (this.performance.timeOrigin || this.performance.timing.navigationStart);
  }
  requiredApisAvailable() {
    if (!fetch || !Promise || !areCookiesEnabled()) {
      consoleLogger.info("Firebase Performance cannot start if browser does not support fetch and Promise or cookie is disabled.");
      return false;
    }
    if (!isIndexedDBAvailable()) {
      consoleLogger.info("IndexedDB is not supported by current browser");
      return false;
    }
    return true;
  }
  setupObserver(entryType, callback) {
    if (!this.PerformanceObserver) {
      return;
    }
    const observer = new this.PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });
    observer.observe({ entryTypes: [entryType] });
  }
  static getInstance() {
    if (apiInstance === void 0) {
      apiInstance = new _Api(windowInstance);
    }
    return apiInstance;
  }
};
function setupApi(window2) {
  windowInstance = window2;
}
var iid;
function getIidPromise(installationsService) {
  const iidPromise = installationsService.getId();
  iidPromise.then((iidVal) => {
    iid = iidVal;
  });
  return iidPromise;
}
function getIid() {
  return iid;
}
function getAuthTokenPromise(installationsService) {
  const authTokenPromise = installationsService.getToken();
  authTokenPromise.then((authTokenVal) => {
  });
  return authTokenPromise;
}
function mergeStrings(part1, part2) {
  const sizeDiff = part1.length - part2.length;
  if (sizeDiff < 0 || sizeDiff > 1) {
    throw ERROR_FACTORY.create(
      "invalid String merger input"
      /* ErrorCode.INVALID_STRING_MERGER_PARAMETER */
    );
  }
  const resultArray = [];
  for (let i = 0; i < part1.length; i++) {
    resultArray.push(part1.charAt(i));
    if (part2.length > i) {
      resultArray.push(part2.charAt(i));
    }
  }
  return resultArray.join("");
}
var settingsServiceInstance;
var SettingsService = class _SettingsService {
  constructor() {
    this.instrumentationEnabled = true;
    this.dataCollectionEnabled = true;
    this.loggingEnabled = false;
    this.tracesSamplingRate = 1;
    this.networkRequestsSamplingRate = 1;
    this.logEndPointUrl = "https://firebaselogging.googleapis.com/v0cc/log?format=json_proto";
    this.flTransportEndpointUrl = mergeStrings("hts/frbslgigp.ogepscmv/ieo/eaylg", "tp:/ieaeogn-agolai.o/1frlglgc/o");
    this.transportKey = mergeStrings("AzSC8r6ReiGqFMyfvgow", "Iayx0u-XT3vksVM-pIV");
    this.logSource = 462;
    this.logTraceAfterSampling = false;
    this.logNetworkAfterSampling = false;
    this.configTimeToLive = 12;
    this.logMaxFlushSize = 40;
  }
  getFlTransportFullUrl() {
    return this.flTransportEndpointUrl.concat("?key=", this.transportKey);
  }
  static getInstance() {
    if (settingsServiceInstance === void 0) {
      settingsServiceInstance = new _SettingsService();
    }
    return settingsServiceInstance;
  }
};
var VisibilityState;
(function(VisibilityState2) {
  VisibilityState2[VisibilityState2["UNKNOWN"] = 0] = "UNKNOWN";
  VisibilityState2[VisibilityState2["VISIBLE"] = 1] = "VISIBLE";
  VisibilityState2[VisibilityState2["HIDDEN"] = 2] = "HIDDEN";
})(VisibilityState || (VisibilityState = {}));
var RESERVED_ATTRIBUTE_PREFIXES = ["firebase_", "google_", "ga_"];
var ATTRIBUTE_FORMAT_REGEX = new RegExp("^[a-zA-Z]\\w*$");
var MAX_ATTRIBUTE_NAME_LENGTH = 40;
var MAX_ATTRIBUTE_VALUE_LENGTH = 100;
function getServiceWorkerStatus() {
  const navigator2 = Api.getInstance().navigator;
  if (navigator2?.serviceWorker) {
    if (navigator2.serviceWorker.controller) {
      return 2;
    } else {
      return 3;
    }
  } else {
    return 1;
  }
}
function getVisibilityState() {
  const document = Api.getInstance().document;
  const visibilityState = document.visibilityState;
  switch (visibilityState) {
    case "visible":
      return VisibilityState.VISIBLE;
    case "hidden":
      return VisibilityState.HIDDEN;
    default:
      return VisibilityState.UNKNOWN;
  }
}
function getEffectiveConnectionType() {
  const navigator2 = Api.getInstance().navigator;
  const navigatorConnection = navigator2.connection;
  const effectiveType = navigatorConnection && navigatorConnection.effectiveType;
  switch (effectiveType) {
    case "slow-2g":
      return 1;
    case "2g":
      return 2;
    case "3g":
      return 3;
    case "4g":
      return 4;
    default:
      return 0;
  }
}
function isValidCustomAttributeName(name2) {
  if (name2.length === 0 || name2.length > MAX_ATTRIBUTE_NAME_LENGTH) {
    return false;
  }
  const matchesReservedPrefix = RESERVED_ATTRIBUTE_PREFIXES.some((prefix) => name2.startsWith(prefix));
  return !matchesReservedPrefix && !!name2.match(ATTRIBUTE_FORMAT_REGEX);
}
function isValidCustomAttributeValue(value) {
  return value.length !== 0 && value.length <= MAX_ATTRIBUTE_VALUE_LENGTH;
}
function getAppId(firebaseApp) {
  const appId = firebaseApp.options?.appId;
  if (!appId) {
    throw ERROR_FACTORY.create(
      "no app id"
      /* ErrorCode.NO_APP_ID */
    );
  }
  return appId;
}
function getProjectId(firebaseApp) {
  const projectId = firebaseApp.options?.projectId;
  if (!projectId) {
    throw ERROR_FACTORY.create(
      "no project id"
      /* ErrorCode.NO_PROJECT_ID */
    );
  }
  return projectId;
}
function getApiKey(firebaseApp) {
  const apiKey = firebaseApp.options?.apiKey;
  if (!apiKey) {
    throw ERROR_FACTORY.create(
      "no api key"
      /* ErrorCode.NO_API_KEY */
    );
  }
  return apiKey;
}
var REMOTE_CONFIG_SDK_VERSION = "0.0.1";
var DEFAULT_CONFIGS = {
  loggingEnabled: true
};
var FIS_AUTH_PREFIX = "FIREBASE_INSTALLATIONS_AUTH";
function getConfig(performanceController, iid2) {
  const config = getStoredConfig();
  if (config) {
    processConfig(config);
    return Promise.resolve();
  }
  return getRemoteConfig(performanceController, iid2).then(processConfig).then(
    (config2) => storeConfig(config2),
    /** Do nothing for error, use defaults set in settings service. */
    () => {
    }
  );
}
function getStoredConfig() {
  const localStorage = Api.getInstance().localStorage;
  if (!localStorage) {
    return;
  }
  const expiryString = localStorage.getItem(CONFIG_EXPIRY_LOCAL_STORAGE_KEY);
  if (!expiryString || !configValid(expiryString)) {
    return;
  }
  const configStringified = localStorage.getItem(CONFIG_LOCAL_STORAGE_KEY);
  if (!configStringified) {
    return;
  }
  try {
    const configResponse = JSON.parse(configStringified);
    return configResponse;
  } catch {
    return;
  }
}
function storeConfig(config) {
  const localStorage = Api.getInstance().localStorage;
  if (!config || !localStorage) {
    return;
  }
  localStorage.setItem(CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(config));
  localStorage.setItem(CONFIG_EXPIRY_LOCAL_STORAGE_KEY, String(Date.now() + SettingsService.getInstance().configTimeToLive * 60 * 60 * 1e3));
}
var COULD_NOT_GET_CONFIG_MSG = "Could not fetch config, will use default configs";
function getRemoteConfig(performanceController, iid2) {
  return getAuthTokenPromise(performanceController.installations).then((authToken) => {
    const projectId = getProjectId(performanceController.app);
    const apiKey = getApiKey(performanceController.app);
    const configEndPoint = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/namespaces/fireperf:fetch?key=${apiKey}`;
    const request = new Request(configEndPoint, {
      method: "POST",
      headers: { Authorization: `${FIS_AUTH_PREFIX} ${authToken}` },
      /* eslint-disable camelcase */
      body: JSON.stringify({
        app_instance_id: iid2,
        app_instance_id_token: authToken,
        app_id: getAppId(performanceController.app),
        app_version: SDK_VERSION,
        sdk_version: REMOTE_CONFIG_SDK_VERSION
      })
      /* eslint-enable camelcase */
    });
    return fetch(request).then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw ERROR_FACTORY.create(
        "RC response not ok"
        /* ErrorCode.RC_NOT_OK */
      );
    });
  }).catch(() => {
    consoleLogger.info(COULD_NOT_GET_CONFIG_MSG);
    return void 0;
  });
}
function processConfig(config) {
  if (!config) {
    return config;
  }
  const settingsServiceInstance2 = SettingsService.getInstance();
  const entries = config.entries || {};
  if (entries.fpr_enabled !== void 0) {
    settingsServiceInstance2.loggingEnabled = String(entries.fpr_enabled) === "true";
  } else {
    settingsServiceInstance2.loggingEnabled = DEFAULT_CONFIGS.loggingEnabled;
  }
  if (entries.fpr_log_source) {
    settingsServiceInstance2.logSource = Number(entries.fpr_log_source);
  } else if (DEFAULT_CONFIGS.logSource) {
    settingsServiceInstance2.logSource = DEFAULT_CONFIGS.logSource;
  }
  if (entries.fpr_log_endpoint_url) {
    settingsServiceInstance2.logEndPointUrl = entries.fpr_log_endpoint_url;
  } else if (DEFAULT_CONFIGS.logEndPointUrl) {
    settingsServiceInstance2.logEndPointUrl = DEFAULT_CONFIGS.logEndPointUrl;
  }
  if (entries.fpr_log_transport_key) {
    settingsServiceInstance2.transportKey = entries.fpr_log_transport_key;
  } else if (DEFAULT_CONFIGS.transportKey) {
    settingsServiceInstance2.transportKey = DEFAULT_CONFIGS.transportKey;
  }
  if (entries.fpr_vc_network_request_sampling_rate !== void 0) {
    settingsServiceInstance2.networkRequestsSamplingRate = Number(entries.fpr_vc_network_request_sampling_rate);
  } else if (DEFAULT_CONFIGS.networkRequestsSamplingRate !== void 0) {
    settingsServiceInstance2.networkRequestsSamplingRate = DEFAULT_CONFIGS.networkRequestsSamplingRate;
  }
  if (entries.fpr_vc_trace_sampling_rate !== void 0) {
    settingsServiceInstance2.tracesSamplingRate = Number(entries.fpr_vc_trace_sampling_rate);
  } else if (DEFAULT_CONFIGS.tracesSamplingRate !== void 0) {
    settingsServiceInstance2.tracesSamplingRate = DEFAULT_CONFIGS.tracesSamplingRate;
  }
  if (entries.fpr_log_max_flush_size) {
    settingsServiceInstance2.logMaxFlushSize = Number(entries.fpr_log_max_flush_size);
  } else if (DEFAULT_CONFIGS.logMaxFlushSize) {
    settingsServiceInstance2.logMaxFlushSize = DEFAULT_CONFIGS.logMaxFlushSize;
  }
  settingsServiceInstance2.logTraceAfterSampling = shouldLogAfterSampling(settingsServiceInstance2.tracesSamplingRate);
  settingsServiceInstance2.logNetworkAfterSampling = shouldLogAfterSampling(settingsServiceInstance2.networkRequestsSamplingRate);
  return config;
}
function configValid(expiry) {
  return Number(expiry) > Date.now();
}
function shouldLogAfterSampling(samplingRate) {
  return Math.random() <= samplingRate;
}
var initializationStatus = 1;
var initializationPromise;
function getInitializationPromise(performanceController) {
  initializationStatus = 2;
  initializationPromise = initializationPromise || initializePerf(performanceController);
  return initializationPromise;
}
function isPerfInitialized() {
  return initializationStatus === 3;
}
function initializePerf(performanceController) {
  return getDocumentReadyComplete().then(() => getIidPromise(performanceController.installations)).then((iid2) => getConfig(performanceController, iid2)).then(() => changeInitializationStatus(), () => changeInitializationStatus());
}
function getDocumentReadyComplete() {
  const document = Api.getInstance().document;
  return new Promise((resolve) => {
    if (document && document.readyState !== "complete") {
      const handler = () => {
        if (document.readyState === "complete") {
          document.removeEventListener("readystatechange", handler);
          resolve();
        }
      };
      document.addEventListener("readystatechange", handler);
    } else {
      resolve();
    }
  });
}
function changeInitializationStatus() {
  initializationStatus = 3;
}
var DEFAULT_SEND_INTERVAL_MS = 10 * 1e3;
var INITIAL_SEND_TIME_DELAY_MS = 5.5 * 1e3;
var MAX_EVENT_COUNT_PER_REQUEST = 1e3;
var DEFAULT_REMAINING_TRIES = 3;
var MAX_SEND_BEACON_PAYLOAD_SIZE = 65536;
var TEXT_ENCODER = new TextEncoder();
var remainingTries = DEFAULT_REMAINING_TRIES;
var queue = [];
var isTransportSetup = false;
function setupTransportService() {
  if (!isTransportSetup) {
    processQueue(INITIAL_SEND_TIME_DELAY_MS);
    isTransportSetup = true;
  }
}
function processQueue(timeOffset) {
  setTimeout(() => {
    if (remainingTries <= 0) {
      return;
    }
    if (queue.length > 0) {
      dispatchQueueEvents();
    }
    processQueue(DEFAULT_SEND_INTERVAL_MS);
  }, timeOffset);
}
function dispatchQueueEvents() {
  const staged = queue.splice(0, MAX_EVENT_COUNT_PER_REQUEST);
  const data = buildPayload(staged);
  postToFlEndpoint(data).then(() => {
    remainingTries = DEFAULT_REMAINING_TRIES;
  }).catch(() => {
    queue = [...staged, ...queue];
    remainingTries--;
    consoleLogger.info(`Tries left: ${remainingTries}.`);
    processQueue(DEFAULT_SEND_INTERVAL_MS);
  });
}
function buildPayload(events) {
  const log_event = events.map((evt) => ({
    source_extension_json_proto3: evt.message,
    event_time_ms: String(evt.eventTime)
  }));
  const transportBatchLog = {
    request_time_ms: String(Date.now()),
    client_info: {
      client_type: 1,
      // 1 is JS
      js_client_info: {}
    },
    log_source: SettingsService.getInstance().logSource,
    log_event
  };
  return JSON.stringify(transportBatchLog);
}
function postToFlEndpoint(body) {
  const flTransportFullUrl = SettingsService.getInstance().getFlTransportFullUrl();
  const size = TEXT_ENCODER.encode(body).length;
  if (size <= MAX_SEND_BEACON_PAYLOAD_SIZE && navigator.sendBeacon && navigator.sendBeacon(flTransportFullUrl, body)) {
    return Promise.resolve();
  } else {
    return fetch(flTransportFullUrl, {
      method: "POST",
      body
    });
  }
}
function addToQueue(evt) {
  if (!evt.eventTime || !evt.message) {
    throw ERROR_FACTORY.create(
      "invalid cc log"
      /* ErrorCode.INVALID_CC_LOG */
    );
  }
  queue = [...queue, evt];
}
function transportHandler(serializer2) {
  return (...args) => {
    const message = serializer2(...args);
    addToQueue({
      message,
      eventTime: Date.now()
    });
  };
}
function flushQueuedEvents() {
  const flTransportFullUrl = SettingsService.getInstance().getFlTransportFullUrl();
  while (queue.length > 0) {
    const staged = queue.splice(-SettingsService.getInstance().logMaxFlushSize);
    const body = buildPayload(staged);
    if (navigator.sendBeacon && navigator.sendBeacon(flTransportFullUrl, body)) {
      continue;
    } else {
      queue = [...queue, ...staged];
      break;
    }
  }
  if (queue.length > 0) {
    const body = buildPayload(queue);
    fetch(flTransportFullUrl, {
      method: "POST",
      body
    }).catch(() => {
      consoleLogger.info(`Failed flushing queued events.`);
    });
  }
}
var logger;
function sendLog(resource, resourceType) {
  if (!logger) {
    logger = {
      send: transportHandler(serializer),
      flush: flushQueuedEvents
    };
  }
  logger.send(resource, resourceType);
}
function logTrace(trace2) {
  const settingsService = SettingsService.getInstance();
  if (!settingsService.instrumentationEnabled && trace2.isAuto) {
    return;
  }
  if (!settingsService.dataCollectionEnabled && !trace2.isAuto) {
    return;
  }
  if (!Api.getInstance().requiredApisAvailable()) {
    return;
  }
  if (isPerfInitialized()) {
    sendTraceLog(trace2);
  } else {
    getInitializationPromise(trace2.performanceController).then(() => sendTraceLog(trace2), () => sendTraceLog(trace2));
  }
}
function flushLogs() {
  if (logger) {
    logger.flush();
  }
}
function sendTraceLog(trace2) {
  if (!getIid()) {
    return;
  }
  const settingsService = SettingsService.getInstance();
  if (!settingsService.loggingEnabled || !settingsService.logTraceAfterSampling) {
    return;
  }
  sendLog(
    trace2,
    1
    /* ResourceType.Trace */
  );
}
function logNetworkRequest(networkRequest) {
  const settingsService = SettingsService.getInstance();
  if (!settingsService.instrumentationEnabled) {
    return;
  }
  const networkRequestUrl = networkRequest.url;
  const logEndpointUrl = settingsService.logEndPointUrl.split("?")[0];
  const flEndpointUrl = settingsService.flTransportEndpointUrl.split("?")[0];
  if (networkRequestUrl === logEndpointUrl || networkRequestUrl === flEndpointUrl) {
    return;
  }
  if (!settingsService.loggingEnabled || !settingsService.logNetworkAfterSampling) {
    return;
  }
  sendLog(
    networkRequest,
    0
    /* ResourceType.NetworkRequest */
  );
}
function serializer(resource, resourceType) {
  if (resourceType === 0) {
    return serializeNetworkRequest(resource);
  }
  return serializeTrace(resource);
}
function serializeNetworkRequest(networkRequest) {
  const networkRequestMetric = {
    url: networkRequest.url,
    http_method: networkRequest.httpMethod || 0,
    http_response_code: 200,
    response_payload_bytes: networkRequest.responsePayloadBytes,
    client_start_time_us: networkRequest.startTimeUs,
    time_to_response_initiated_us: networkRequest.timeToResponseInitiatedUs,
    time_to_response_completed_us: networkRequest.timeToResponseCompletedUs
  };
  const perfMetric = {
    application_info: getApplicationInfo(networkRequest.performanceController.app),
    network_request_metric: networkRequestMetric
  };
  return JSON.stringify(perfMetric);
}
function serializeTrace(trace2) {
  const traceMetric = {
    name: trace2.name,
    is_auto: trace2.isAuto,
    client_start_time_us: trace2.startTimeUs,
    duration_us: trace2.durationUs
  };
  if (Object.keys(trace2.counters).length !== 0) {
    traceMetric.counters = trace2.counters;
  }
  const customAttributes = trace2.getAttributes();
  if (Object.keys(customAttributes).length !== 0) {
    traceMetric.custom_attributes = customAttributes;
  }
  const perfMetric = {
    application_info: getApplicationInfo(trace2.performanceController.app),
    trace_metric: traceMetric
  };
  return JSON.stringify(perfMetric);
}
function getApplicationInfo(firebaseApp) {
  return {
    google_app_id: getAppId(firebaseApp),
    app_instance_id: getIid(),
    web_app_info: {
      sdk_version: SDK_VERSION,
      page_url: Api.getInstance().getUrl(),
      service_worker_status: getServiceWorkerStatus(),
      visibility_state: getVisibilityState(),
      effective_connection_type: getEffectiveConnectionType()
    },
    application_process_state: 0
  };
}
function createNetworkRequestEntry(performanceController, entry) {
  const performanceEntry = entry;
  if (!performanceEntry || performanceEntry.responseStart === void 0) {
    return;
  }
  const timeOrigin = Api.getInstance().getTimeOrigin();
  const startTimeUs = Math.floor((performanceEntry.startTime + timeOrigin) * 1e3);
  const timeToResponseInitiatedUs = performanceEntry.responseStart ? Math.floor((performanceEntry.responseStart - performanceEntry.startTime) * 1e3) : void 0;
  const timeToResponseCompletedUs = Math.floor((performanceEntry.responseEnd - performanceEntry.startTime) * 1e3);
  const url = performanceEntry.name && performanceEntry.name.split("?")[0];
  const networkRequest = {
    performanceController,
    url,
    responsePayloadBytes: performanceEntry.transferSize,
    startTimeUs,
    timeToResponseInitiatedUs,
    timeToResponseCompletedUs
  };
  logNetworkRequest(networkRequest);
}
var MAX_METRIC_NAME_LENGTH = 100;
var RESERVED_AUTO_PREFIX = "_";
var oobMetrics = [
  FIRST_PAINT_COUNTER_NAME,
  FIRST_CONTENTFUL_PAINT_COUNTER_NAME,
  FIRST_INPUT_DELAY_COUNTER_NAME,
  LARGEST_CONTENTFUL_PAINT_METRIC_NAME,
  CUMULATIVE_LAYOUT_SHIFT_METRIC_NAME,
  INTERACTION_TO_NEXT_PAINT_METRIC_NAME
];
function isValidMetricName(name2, traceName) {
  if (name2.length === 0 || name2.length > MAX_METRIC_NAME_LENGTH) {
    return false;
  }
  return traceName && traceName.startsWith(OOB_TRACE_PAGE_LOAD_PREFIX) && oobMetrics.indexOf(name2) > -1 || !name2.startsWith(RESERVED_AUTO_PREFIX);
}
function convertMetricValueToInteger(providedValue) {
  const valueAsInteger = Math.floor(providedValue);
  if (valueAsInteger < providedValue) {
    consoleLogger.info(`Metric value should be an Integer, setting the value as : ${valueAsInteger}.`);
  }
  return valueAsInteger;
}
var Trace = class _Trace {
  /**
   * @param performanceController The performance controller running.
   * @param name The name of the trace.
   * @param isAuto If the trace is auto-instrumented.
   * @param traceMeasureName The name of the measure marker in user timing specification. This field
   * is only set when the trace is built for logging when the user directly uses the user timing
   * api (performance.mark and performance.measure).
   */
  constructor(performanceController, name2, isAuto = false, traceMeasureName) {
    this.performanceController = performanceController;
    this.name = name2;
    this.isAuto = isAuto;
    this.state = 1;
    this.customAttributes = {};
    this.counters = {};
    this.api = Api.getInstance();
    this.randomId = Math.floor(Math.random() * 1e6);
    if (!this.isAuto) {
      this.traceStartMark = `${TRACE_START_MARK_PREFIX}-${this.randomId}-${this.name}`;
      this.traceStopMark = `${TRACE_STOP_MARK_PREFIX}-${this.randomId}-${this.name}`;
      this.traceMeasure = traceMeasureName || `${TRACE_MEASURE_PREFIX}-${this.randomId}-${this.name}`;
      if (traceMeasureName) {
        this.calculateTraceMetrics();
      }
    }
  }
  /**
   * Starts a trace. The measurement of the duration starts at this point.
   */
  start() {
    if (this.state !== 1) {
      throw ERROR_FACTORY.create("trace started", {
        traceName: this.name
      });
    }
    this.api.mark(this.traceStartMark);
    this.state = 2;
  }
  /**
   * Stops the trace. The measurement of the duration of the trace stops at this point and trace
   * is logged.
   */
  stop() {
    if (this.state !== 2) {
      throw ERROR_FACTORY.create("trace stopped", {
        traceName: this.name
      });
    }
    this.state = 3;
    this.api.mark(this.traceStopMark);
    this.api.measure(this.traceMeasure, this.traceStartMark, this.traceStopMark);
    this.calculateTraceMetrics();
    logTrace(this);
  }
  /**
   * Records a trace with predetermined values. If this method is used a trace is created and logged
   * directly. No need to use start and stop methods.
   * @param startTime Trace start time since epoch in millisec
   * @param duration The duration of the trace in millisec
   * @param options An object which can optionally hold maps of custom metrics and custom attributes
   */
  record(startTime, duration, options) {
    if (startTime <= 0) {
      throw ERROR_FACTORY.create("nonpositive trace startTime", {
        traceName: this.name
      });
    }
    if (duration <= 0) {
      throw ERROR_FACTORY.create("nonpositive trace duration", {
        traceName: this.name
      });
    }
    this.durationUs = Math.floor(duration * 1e3);
    this.startTimeUs = Math.floor(startTime * 1e3);
    if (options && options.attributes) {
      this.customAttributes = __spreadValues({}, options.attributes);
    }
    if (options && options.metrics) {
      for (const metricName of Object.keys(options.metrics)) {
        if (!isNaN(Number(options.metrics[metricName]))) {
          this.counters[metricName] = Math.floor(Number(options.metrics[metricName]));
        }
      }
    }
    logTrace(this);
  }
  /**
   * Increments a custom metric by a certain number or 1 if number not specified. Will create a new
   * custom metric if one with the given name does not exist. The value will be floored down to an
   * integer.
   * @param counter Name of the custom metric
   * @param numAsInteger Increment by value
   */
  incrementMetric(counter, numAsInteger = 1) {
    if (this.counters[counter] === void 0) {
      this.putMetric(counter, numAsInteger);
    } else {
      this.putMetric(counter, this.counters[counter] + numAsInteger);
    }
  }
  /**
   * Sets a custom metric to a specified value. Will create a new custom metric if one with the
   * given name does not exist. The value will be floored down to an integer.
   * @param counter Name of the custom metric
   * @param numAsInteger Set custom metric to this value
   */
  putMetric(counter, numAsInteger) {
    if (isValidMetricName(counter, this.name)) {
      this.counters[counter] = convertMetricValueToInteger(numAsInteger ?? 0);
    } else {
      throw ERROR_FACTORY.create("invalid custom metric name", {
        customMetricName: counter
      });
    }
  }
  /**
   * Returns the value of the custom metric by that name. If a custom metric with that name does
   * not exist will return zero.
   * @param counter
   */
  getMetric(counter) {
    return this.counters[counter] || 0;
  }
  /**
   * Sets a custom attribute of a trace to a certain value.
   * @param attr
   * @param value
   */
  putAttribute(attr, value) {
    const isValidName = isValidCustomAttributeName(attr);
    const isValidValue = isValidCustomAttributeValue(value);
    if (isValidName && isValidValue) {
      this.customAttributes[attr] = value;
      return;
    }
    if (!isValidName) {
      throw ERROR_FACTORY.create("invalid attribute name", {
        attributeName: attr
      });
    }
    if (!isValidValue) {
      throw ERROR_FACTORY.create("invalid attribute value", {
        attributeValue: value
      });
    }
  }
  /**
   * Retrieves the value a custom attribute of a trace is set to.
   * @param attr
   */
  getAttribute(attr) {
    return this.customAttributes[attr];
  }
  removeAttribute(attr) {
    if (this.customAttributes[attr] === void 0) {
      return;
    }
    delete this.customAttributes[attr];
  }
  getAttributes() {
    return __spreadValues({}, this.customAttributes);
  }
  setStartTime(startTime) {
    this.startTimeUs = startTime;
  }
  setDuration(duration) {
    this.durationUs = duration;
  }
  /**
   * Calculates and assigns the duration and start time of the trace using the measure performance
   * entry.
   */
  calculateTraceMetrics() {
    const perfMeasureEntries = this.api.getEntriesByName(this.traceMeasure);
    const perfMeasureEntry = perfMeasureEntries && perfMeasureEntries[0];
    if (perfMeasureEntry) {
      this.durationUs = Math.floor(perfMeasureEntry.duration * 1e3);
      this.startTimeUs = Math.floor((perfMeasureEntry.startTime + this.api.getTimeOrigin()) * 1e3);
    }
  }
  /**
   * @param navigationTimings A single element array which contains the navigationTIming object of
   * the page load
   * @param paintTimings A array which contains paintTiming object of the page load
   * @param firstInputDelay First input delay in millisec
   */
  static createOobTrace(performanceController, navigationTimings, paintTimings, webVitalMetrics2, firstInputDelay2) {
    const route = Api.getInstance().getUrl();
    if (!route) {
      return;
    }
    const trace2 = new _Trace(performanceController, OOB_TRACE_PAGE_LOAD_PREFIX + route, true);
    const timeOriginUs = Math.floor(Api.getInstance().getTimeOrigin() * 1e3);
    trace2.setStartTime(timeOriginUs);
    if (navigationTimings && navigationTimings[0]) {
      trace2.setDuration(Math.floor(navigationTimings[0].duration * 1e3));
      trace2.putMetric("domInteractive", Math.floor(navigationTimings[0].domInteractive * 1e3));
      trace2.putMetric("domContentLoadedEventEnd", Math.floor(navigationTimings[0].domContentLoadedEventEnd * 1e3));
      trace2.putMetric("loadEventEnd", Math.floor(navigationTimings[0].loadEventEnd * 1e3));
    }
    const FIRST_PAINT = "first-paint";
    const FIRST_CONTENTFUL_PAINT = "first-contentful-paint";
    if (paintTimings) {
      const firstPaint = paintTimings.find((paintObject) => paintObject.name === FIRST_PAINT);
      if (firstPaint && firstPaint.startTime) {
        trace2.putMetric(FIRST_PAINT_COUNTER_NAME, Math.floor(firstPaint.startTime * 1e3));
      }
      const firstContentfulPaint = paintTimings.find((paintObject) => paintObject.name === FIRST_CONTENTFUL_PAINT);
      if (firstContentfulPaint && firstContentfulPaint.startTime) {
        trace2.putMetric(FIRST_CONTENTFUL_PAINT_COUNTER_NAME, Math.floor(firstContentfulPaint.startTime * 1e3));
      }
      if (firstInputDelay2) {
        trace2.putMetric(FIRST_INPUT_DELAY_COUNTER_NAME, Math.floor(firstInputDelay2 * 1e3));
      }
    }
    this.addWebVitalMetric(trace2, LARGEST_CONTENTFUL_PAINT_METRIC_NAME, LARGEST_CONTENTFUL_PAINT_ATTRIBUTE_NAME, webVitalMetrics2.lcp);
    this.addWebVitalMetric(trace2, CUMULATIVE_LAYOUT_SHIFT_METRIC_NAME, CUMULATIVE_LAYOUT_SHIFT_ATTRIBUTE_NAME, webVitalMetrics2.cls);
    this.addWebVitalMetric(trace2, INTERACTION_TO_NEXT_PAINT_METRIC_NAME, INTERACTION_TO_NEXT_PAINT_ATTRIBUTE_NAME, webVitalMetrics2.inp);
    logTrace(trace2);
    flushLogs();
  }
  static addWebVitalMetric(trace2, metricKey, attributeKey, metric) {
    if (metric) {
      trace2.putMetric(metricKey, Math.floor(metric.value * 1e3));
      if (metric.elementAttribution) {
        if (metric.elementAttribution.length > MAX_ATTRIBUTE_VALUE_LENGTH) {
          trace2.putAttribute(attributeKey, metric.elementAttribution.substring(0, MAX_ATTRIBUTE_VALUE_LENGTH));
        } else {
          trace2.putAttribute(attributeKey, metric.elementAttribution);
        }
      }
    }
  }
  static createUserTimingTrace(performanceController, measureName) {
    const trace2 = new _Trace(performanceController, measureName, false, measureName);
    logTrace(trace2);
  }
};
var webVitalMetrics = {};
var sentPageLoadTrace = false;
var firstInputDelay;
function setupOobResources(performanceController) {
  if (!getIid()) {
    return;
  }
  setTimeout(() => setupOobTraces(performanceController), 0);
  setTimeout(() => setupNetworkRequests(performanceController), 0);
  setTimeout(() => setupUserTimingTraces(performanceController), 0);
}
function setupNetworkRequests(performanceController) {
  const api = Api.getInstance();
  const resources = api.getEntriesByType("resource");
  for (const resource of resources) {
    createNetworkRequestEntry(performanceController, resource);
  }
  api.setupObserver("resource", (entry) => createNetworkRequestEntry(performanceController, entry));
}
function setupOobTraces(performanceController) {
  const api = Api.getInstance();
  if ("onpagehide" in window) {
    api.document.addEventListener("pagehide", () => sendOobTrace(performanceController));
  } else {
    api.document.addEventListener("unload", () => sendOobTrace(performanceController));
  }
  api.document.addEventListener("visibilitychange", () => {
    if (api.document.visibilityState === "hidden") {
      sendOobTrace(performanceController);
    }
  });
  if (api.onFirstInputDelay) {
    api.onFirstInputDelay((fid) => {
      firstInputDelay = fid;
    });
  }
  api.onLCP((metric) => {
    webVitalMetrics.lcp = {
      value: metric.value,
      elementAttribution: metric.attribution?.element
    };
  });
  api.onCLS((metric) => {
    webVitalMetrics.cls = {
      value: metric.value,
      elementAttribution: metric.attribution?.largestShiftTarget
    };
  });
  api.onINP((metric) => {
    webVitalMetrics.inp = {
      value: metric.value,
      elementAttribution: metric.attribution?.interactionTarget
    };
  });
}
function setupUserTimingTraces(performanceController) {
  const api = Api.getInstance();
  const measures = api.getEntriesByType("measure");
  for (const measure of measures) {
    createUserTimingTrace(performanceController, measure);
  }
  api.setupObserver("measure", (entry) => createUserTimingTrace(performanceController, entry));
}
function createUserTimingTrace(performanceController, measure) {
  const measureName = measure.name;
  if (measureName.substring(0, TRACE_MEASURE_PREFIX.length) === TRACE_MEASURE_PREFIX) {
    return;
  }
  Trace.createUserTimingTrace(performanceController, measureName);
}
function sendOobTrace(performanceController) {
  if (!sentPageLoadTrace) {
    sentPageLoadTrace = true;
    const api = Api.getInstance();
    const navigationTimings = api.getEntriesByType("navigation");
    const paintTimings = api.getEntriesByType("paint");
    setTimeout(() => {
      Trace.createOobTrace(performanceController, navigationTimings, paintTimings, webVitalMetrics, firstInputDelay);
    }, 0);
  }
}
var PerformanceController = class {
  constructor(app, installations) {
    this.app = app;
    this.installations = installations;
    this.initialized = false;
  }
  /**
   * This method *must* be called internally as part of creating a
   * PerformanceController instance.
   *
   * Currently it's not possible to pass the settings object through the
   * constructor using Components, so this method exists to be called with the
   * desired settings, to ensure nothing is collected without the user's
   * consent.
   */
  _init(settings) {
    if (this.initialized) {
      return;
    }
    if (settings?.dataCollectionEnabled !== void 0) {
      this.dataCollectionEnabled = settings.dataCollectionEnabled;
    }
    if (settings?.instrumentationEnabled !== void 0) {
      this.instrumentationEnabled = settings.instrumentationEnabled;
    }
    if (Api.getInstance().requiredApisAvailable()) {
      validateIndexedDBOpenable().then((isAvailable) => {
        if (isAvailable) {
          setupTransportService();
          getInitializationPromise(this).then(() => setupOobResources(this), () => setupOobResources(this));
          this.initialized = true;
        }
      }).catch((error) => {
        consoleLogger.info(`Environment doesn't support IndexedDB: ${error}`);
      });
    } else {
      consoleLogger.info('Firebase Performance cannot start if the browser does not support "Fetch" and "Promise", or cookies are disabled.');
    }
  }
  set instrumentationEnabled(val) {
    SettingsService.getInstance().instrumentationEnabled = val;
  }
  get instrumentationEnabled() {
    return SettingsService.getInstance().instrumentationEnabled;
  }
  set dataCollectionEnabled(val) {
    SettingsService.getInstance().dataCollectionEnabled = val;
  }
  get dataCollectionEnabled() {
    return SettingsService.getInstance().dataCollectionEnabled;
  }
};
var DEFAULT_ENTRY_NAME = "[DEFAULT]";
function getPerformance(app = getApp()) {
  app = getModularInstance(app);
  const provider = _getProvider(app, "performance");
  const perfInstance = provider.getImmediate();
  return perfInstance;
}
function initializePerformance(app, settings) {
  app = getModularInstance(app);
  const provider = _getProvider(app, "performance");
  if (provider.isInitialized()) {
    const existingInstance = provider.getImmediate();
    const initialSettings = provider.getOptions();
    if (deepEqual(initialSettings, settings ?? {})) {
      return existingInstance;
    } else {
      throw ERROR_FACTORY.create(
        "already initialized"
        /* ErrorCode.ALREADY_INITIALIZED */
      );
    }
  }
  const perfInstance = provider.initialize({
    options: settings
  });
  return perfInstance;
}
function trace(performance, name2) {
  performance = getModularInstance(performance);
  return new Trace(performance, name2);
}
var factory = (container, { options: settings }) => {
  const app = container.getProvider("app").getImmediate();
  const installations = container.getProvider("installations-internal").getImmediate();
  if (app.name !== DEFAULT_ENTRY_NAME) {
    throw ERROR_FACTORY.create(
      "FB not default"
      /* ErrorCode.FB_NOT_DEFAULT */
    );
  }
  if (typeof window === "undefined") {
    throw ERROR_FACTORY.create(
      "no window"
      /* ErrorCode.NO_WINDOW */
    );
  }
  setupApi(window);
  const perfInstance = new PerformanceController(app, installations);
  perfInstance._init(settings);
  return perfInstance;
};
function registerPerformance() {
  _registerComponent(new Component(
    "performance",
    factory,
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ));
  registerVersion(name, version);
  registerVersion(name, version, "esm2020");
}
registerPerformance();
export {
  getPerformance,
  initializePerformance,
  trace
};
/*! Bundled license information:

@firebase/performance/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
//# sourceMappingURL=index.esm-2YBPXTAP.js.map
