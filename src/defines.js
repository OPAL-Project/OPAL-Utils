function convBase64ToUTF8 (base64string) {
    let buf = new Buffer(base64string, 'base64');
    let code = buf.toString('utf8');
    return code;
}

function ErrorStack(error_obj, error_stack) {
    let error = {};
    let error_message = '';

    error.toString = function() {
        return JSON.stringify(this);
    };

    //Extract current error message
    if (typeof error_obj === 'string')
        error_message = error_obj;
    else if (typeof error_obj === 'object' && error_obj.hasOwnProperty('message'))
        error_message = error_obj.message;
    else if (typeof error_obj === 'object' && error_obj.hasOwnProperty('error'))
        error_message = error_obj.error;
    else if (error_obj === undefined || error_obj === null)
        error_message = 'Undefined';
    else
        error_message = error_obj.toString();
    error.error =  error_message;

    //Extract error stack
    if (error_stack === undefined && error_obj.hasOwnProperty('stack'))
        error_stack = error_obj.stack;
    if (error_stack !== undefined) {
        if (error_stack instanceof Error)
            error.stack = { error: error_stack.message };
        else
            error.stack = error_stack;
    }

    return error;
}

const jobModel = {
    type : 'eae-job-type',
    status: ['eae_job_created'],
    startDate: new Date(),
    requester: 'Raijin',
    main: 'main.py',
    params: {
        startDate: new Date(0),
        endDate: new Date(0),
        params: {},
        algorithmName: 'density',
        sample: 1,
        resolution: 'location_level_2',
        keySelector: null
    },
    input: [],
    endDate: new Date(0),
    exitCode: -1,
    stdout: null,
    stderr: null,
    output: [],
    message: null,
    statusLock: false,
    executorIP: '127.0.0.1',
    executorPort: '9000'
};

const statusModel = {
    type: 'eae-service',
    computeType: [],
    status: 'eae_service_idle',
    statusLock: false,
    version: null,
    lastUpdate: null,
    port: 8080,
    ip: 'localhost',
    hostname: 'localhost',
    system: {
        arch: 'unknown',
        type: 'unknown',
        platform: 'unknown',
        version: '0.0'
    },
    cpu: {
        cores: [
        ],
        loadavg: [0, 0, 0]
    },
    memory: {
        total: 0,
        free: 0
    }
};


module.exports = {
    SERVICE_TYPE_ALGOSERVICE: 'opal_algoservice',
    SERVICE_TYPE_CACHE: 'opal_cache',
    SERVICE_TYPE_DATABASE: 'opal_db',
    SERVICE_TYPE_PRIVACY: 'opal_privacy',
    SERVICE_TYPE_LOG: 'opal_log',

    PRIVACY_METHOD_FILTER: 'privacy_filter',

    AGGREGATION_METHOD_SUM: 'aggregation_sum',
    AGGREGATION_METHOD_COUNT: 'aggregation_count',

    JOB_STATUS_PRIVACY: 'opal_job_privacy',

    CACHE_COLLECTION: 'opal_cache',
    ALGO_COLLECTION: 'opal_algoservice',
    ILLEGAL_ACCESS_COLLECTION: 'opal_illegal_access',
    QUOTA_TOKENS_COLLECTION: 'opal_users_quota_tokens',
    JOB_MODEL: jobModel,
    convBase64ToUTF8: convBase64ToUTF8,

    STATUS_MODEL: statusModel,
    STATUS_DEFAULT_UPDATE_INTERVAL: 60 * 1000, // 60 * 1000 ms = 1 minute,
    STATUS_COLLECTION_NAME: 'opal_global_status',
    errorStacker: ErrorStack
};
