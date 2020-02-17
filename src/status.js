const os = require('os');
const mongodb = require('mongodb').MongoClient;
const bytes = require('bytes');
const ip = require('ip');
const timer = require('timers');

const defines = require('./defines.js');

/**
 * @fn StatusHelper
 * @desc Global status manager. Use it to update the node's status within EAE
 * @param config [in] Additional fields to include in the status
 * @constructor
 */
function StatusHelper(config = {}) {
    //Init member vars
    this._client = null;
    this._statusCollection = null;
    this._config = config;
    this._data = Object.assign({}, defines.STATUS_MODEL, this._config);
    this._intervalTimeout = null;

    //Bind member functions
    this.getDataModel = StatusHelper.prototype.getDataModel.bind(this);
    this.getStatus = StatusHelper.prototype.getStatus.bind(this);
    this.setComputeType = StatusHelper.prototype.setComputeType.bind(this);
    this.setStatus = StatusHelper.prototype.setStatus.bind(this);
    this.setCollection = StatusHelper.prototype.setCollection.bind(this);
    this.setClient = StatusHelper.prototype.setClient.bind(this);
    this.startPeriodicUpdate = StatusHelper.prototype.startPeriodicUpdate.bind(this);
    this.stopPeriodicUpdate = StatusHelper.prototype.stopPeriodicUpdate.bind(this);
    this._update = StatusHelper.prototype._update.bind(this);
    this._sync = StatusHelper.prototype._sync.bind(this);
}

/**
 * @fn getDataModel
 * @desc Getter on status data
 * @return The status model in plain JS object
 */
StatusHelper.prototype.getDataModel = function() {
   return this._data;
};

/**
 * @fn getStatus
 * @desc Getter on node status
 * @return {String} Current status string
 */
StatusHelper.prototype.getStatus = function() {
    return this._data.status;
};

/**
 * @fn setStatus
 * @desc Setter on node status
 * @param status The new status string
 * @return {String} Current status string
 */
StatusHelper.prototype.setStatus = function(status) {
    if (this._data.statusLock === false) {
        this._data.status = status;
    }
    return this._data.status;
};

/**
 * @fn setComputeType
 * @desc Setter on node computeType
 * @param {Array} computeType The compute types of the node
 * @return {Array} Current compute types of the node
 */
StatusHelper.prototype.setComputeType = function(computeType) {
    if (this._data.statusLock === false) {
        this._data.computeType = computeType;
    }
    return this._data.computeType;
};

/**
 * @fn setCollection
 * @desc Setup the mongoDB collection to sync against
 * @param statusCollection Initialized mongodb collection to sync against
 */
StatusHelper.prototype.setCollection = function(statusCollection) {
    this._statusCollection = statusCollection;
};

/**
 * @fn setClient
 * @desc Setup the mongoDB client to be able to close it when stopping the statusHelper
 * @param client Initialized mongodb client
 */
StatusHelper.prototype.setClient = function(client) {
    this._client = client;
};

/**
 * @fn _update
 * @desc Initialise model from OS information
 * @private
 */
StatusHelper.prototype._update = function() {
    let _this = this;

    //Assign status values
    this._data.lastUpdate = new Date();
    this._data.ip = ip.address().toString();
    this._data.hostname = os.hostname();

    //Retrieving system information
    this._data.system.arch = os.arch();
    this._data.system.type = os.type();
    this._data.system.platform = os.platform();
    this._data.system.version = os.release();

    //Retrieving memory information
    this._data.memory.total = bytes(os.totalmem());
    this._data.memory.free = bytes(os.freemem());

    //Retrieving CPUs information
    this._data.cpu.loadavg = os.loadavg();
    this._data.cpu.cores = [];
    os.cpus().forEach(function (cpu) {
        _this._data.cpu.cores.push({
                model: cpu.model,
                mhz: cpu.speed
            }
        );
    });
};

/**
 * @fn _sync
 * @desc Update the status in the global status collection.
 * Identification is based on the ip/port combination
 * @return {Promise} Resolve to true if update operation has been successful
 * @private
 */
StatusHelper.prototype._sync = function() {
    let _this = this;
    return new Promise(function(resolve, reject) {
        if (_this._statusCollection === null || _this._statusCollection === undefined) {
            reject(defines.errorStacker('No MongoDB collection to sync against'));
            return;
        }

        let filter = { //Filter is based on ip/port combination
            ip: _this._data.ip,
            port: _this._data.port
        };
        //Updates model in base, upsert if does not exists
        _this._statusCollection.findOneAndUpdate(filter,
                                                 { $set : _this._data },
                                                 { upsert: true, returnOriginal: false })
            .then(function(updatedModel) {
                delete updatedModel.value._id;  //Remove ID field, let MongoDB handle ids
                _this._data = updatedModel.value;
                resolve(true);
            }, function(error) {
                reject(defines.errorStacker('Update status failed', error));
            });
    });
};

/**
 * @fn startPeriodicUpdate
 * @desc Start an automatic update and synchronisation of the status
 * @param delay The intervals (in milliseconds) on how often to update the status
 */
StatusHelper.prototype.startPeriodicUpdate = function(delay = defines.STATUS_DEFAULT_UPDATE_INTERVAL) {
    let _this = this;

    //Stop previous interval if any
    _this.stopPeriodicUpdate();
    //Start a new interval update
    _this._intervalTimeout = timer.setInterval(function(){
        _this._update(); //Update model
        _this._sync(); //Attempt to sync in base
    }, delay);
};

/**
 * @fn stopPeriodicUpdate
 * @desc Stops the automatic update and synchronisation.
 * Does nothing if the periodic update was not running
 */
StatusHelper.prototype.stopPeriodicUpdate = function() {
    let _this = this;

    if (_this._intervalTimeout !== null && _this._intervalTimeout !== undefined) {
        timer.clearInterval(_this._intervalTimeout);
        _this._intervalTimeout = null;
    }
    if(_this._client !== null && _this._client !== undefined){
        _this._client.close(true);
    }
};

/**
 * @fn StatusHelperExport
 * @param type {String} Display name of the service
 * @param port {Number} The port number used by this eae service
 * @param mongoURL {String} A valid MongoDB connection url
 * @param options {Object} Additional custom fields
 * @return {StatusHelper} Helper class
 */
function StatusHelperExport(type = 'eae-service', port = 8080, mongoURL = null, options = {}) {
    let opts = Object.assign({}, {
        type : type,
        port: port
    }, options);

    let status_helper = new StatusHelper(opts);

    if (mongoURL !== null && mongoURL !== undefined) {
        mongodb.connect(mongoURL, {}, function (err, client) {
            if (err !== null && err !== undefined) {
                throw defines.errorStacker('Failed to connect to MongoDB', err);
            }
            else {
                let db = client.db();
                let statusCollection = db.collection(defines.STATUS_COLLECTION_NAME);
                status_helper.setClient(client);
                status_helper.setCollection(statusCollection);
            }
        });
    }
    return status_helper;
}

module.exports = StatusHelperExport;
