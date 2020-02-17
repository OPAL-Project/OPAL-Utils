const defines = require('./defines.js');
let StatusHelperModule = require('./status.js');


//Expose utilities in package
module.exports = {
    StatusHelper: StatusHelperModule,
    DataModel: {
        OPAL_JOB_MODEL: defines.JOB_MODEL
    },
    Constants_Opal: {
        OPAL_SERVICE_TYPE_ALGOSERVICE: defines.SERVICE_TYPE_ALGOSERVICE,
        OPAL_SERVICE_TYPE_CACHE: defines.SERVICE_TYPE_CACHE,
        OPAL_SERVICE_TYPE_DATABASE: defines.SERVICE_TYPE_DATABASE,
        OPAL_SERVICE_TYPE_PRIVACY: defines.SERVICE_TYPE_PRIVACY,
        OPAL_SERVICE_TYPE_LOG: defines.SERVICE_TYPE_LOG,

        OPAL_PRIVACY_METHOD_FILTER: defines.PRIVACY_METHOD_FILTER,

        OPAL_AGGREGATION_METHOD_SUM: defines.AGGREGATION_METHOD_SUM,
        OPAL_AGGREGATION_METHOD_COUNT: defines.AGGREGATION_METHOD_COUNT,

        OPAL_JOB_STATUS_PRIVACY: defines.JOB_STATUS_PRIVACY,

        OPAL_CACHE_COLLECTION: defines.CACHE_COLLECTION,
        OPAL_ALGO_COLLECTION: defines.ALGO_COLLECTION,
        OPAL_ILLEGAL_ACCESS_COLLECTION: defines.ILLEGAL_ACCESS_COLLECTION,
        OPAL_QUOTA_TOKENS_COLLECTION: defines.QUOTA_TOKENS_COLLECTION
    },
    Helpers: {
        ConvBase64ToUTF8: defines.convBase64ToUTF8
    }
};
