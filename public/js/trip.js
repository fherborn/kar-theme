/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/@mapbox/fusspot/lib/index.js":
/*!***************************************************!*\
  !*** ./node_modules/@mapbox/fusspot/lib/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Validators are functions which assert certain type.
 * They can return a string which can then be used
 * to display a helpful error message.
 * They can also return a function for a custom error message.
 */
var isPlainObject = __webpack_require__(/*! is-plain-obj */ "./node_modules/is-plain-obj/index.js");
var xtend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");

var DEFAULT_ERROR_PATH = 'value';
var NEWLINE_INDENT = '\n  ';

var v = {};

/**
 * Runners
 *
 * Take root validators and run assertion
 */
v.assert = function(rootValidator, options) {
  options = options || {};
  return function(value) {
    var message = validate(rootValidator, value);
    // all good
    if (!message) {
      return;
    }

    var errorMessage = processMessage(message, options);

    if (options.apiName) {
      errorMessage = options.apiName + ': ' + errorMessage;
    }

    throw new Error(errorMessage);
  };
};

/**
 * Higher Order Validators
 *
 * validators which take other validators as input
 * and output a new validator
 */
v.shape = function shape(validatorObj) {
  var validators = objectEntries(validatorObj);
  return function shapeValidator(value) {
    var validationResult = validate(v.plainObject, value);

    if (validationResult) {
      return validationResult;
    }

    var key, validator;
    var errorMessages = [];

    for (var i = 0; i < validators.length; i++) {
      key = validators[i].key;
      validator = validators[i].value;
      validationResult = validate(validator, value[key]);

      if (validationResult) {
        // return [key].concat(validationResult);
        errorMessages.push([key].concat(validationResult));
      }
    }

    if (errorMessages.length < 2) {
      return errorMessages[0];
    }

    // enumerate all the error messages
    return function(options) {
      errorMessages = errorMessages.map(function(message) {
        var key = message[0];
        var renderedMessage = processMessage(message, options)
          .split('\n')
          .join(NEWLINE_INDENT); // indents any inner nesting
        return '- ' + key + ': ' + renderedMessage;
      });

      var objectId = options.path.join('.');
      var ofPhrase = objectId === DEFAULT_ERROR_PATH ? '' : ' of ' + objectId;

      return (
        'The following properties' +
        ofPhrase +
        ' have invalid values:' +
        NEWLINE_INDENT +
        errorMessages.join(NEWLINE_INDENT)
      );
    };
  };
};

v.strictShape = function strictShape(validatorObj) {
  var shapeValidator = v.shape(validatorObj);
  return function strictShapeValidator(value) {
    var shapeResult = shapeValidator(value);
    if (shapeResult) {
      return shapeResult;
    }

    var invalidKeys = Object.keys(value).reduce(function(memo, valueKey) {
      if (validatorObj[valueKey] === undefined) {
        memo.push(valueKey);
      }
      return memo;
    }, []);

    if (invalidKeys.length !== 0) {
      return function() {
        return 'The following keys are invalid: ' + invalidKeys.join(', ');
      };
    }
  };
};

v.arrayOf = function arrayOf(validator) {
  return createArrayValidator(validator);
};

v.tuple = function tuple() {
  var validators = Array.isArray(arguments[0])
    ? arguments[0]
    : Array.prototype.slice.call(arguments);
  return createArrayValidator(validators);
};

// Currently array validation fails when the first invalid item is found.
function createArrayValidator(validators) {
  var validatingTuple = Array.isArray(validators);
  var getValidator = function(index) {
    if (validatingTuple) {
      return validators[index];
    }
    return validators;
  };

  return function arrayValidator(value) {
    var validationResult = validate(v.plainArray, value);
    if (validationResult) {
      return validationResult;
    }

    if (validatingTuple && value.length !== validators.length) {
      return 'an array with ' + validators.length + ' items';
    }

    for (var i = 0; i < value.length; i++) {
      validationResult = validate(getValidator(i), value[i]);
      if (validationResult) {
        return [i].concat(validationResult);
      }
    }
  };
}

v.required = function required(validator) {
  function requiredValidator(value) {
    if (value == null) {
      return function(options) {
        return formatErrorMessage(
          options,
          isArrayCulprit(options.path)
            ? 'cannot be undefined/null.'
            : 'is required.'
        );
      };
    }
    return validator.apply(this, arguments);
  }
  requiredValidator.__required = true;

  return requiredValidator;
};

v.oneOfType = function oneOfType() {
  var validators = Array.isArray(arguments[0])
    ? arguments[0]
    : Array.prototype.slice.call(arguments);
  return function oneOfTypeValidator(value) {
    var messages = validators
      .map(function(validator) {
        return validate(validator, value);
      })
      .filter(Boolean);

    // If we don't have as many messages as no. of validators,
    // then at least one validator was ok with the value.
    if (messages.length !== validators.length) {
      return;
    }

    // check primitive type
    if (
      messages.every(function(message) {
        return message.length === 1 && typeof message[0] === 'string';
      })
    ) {
      return orList(
        messages.map(function(m) {
          return m[0];
        })
      );
    }

    // Complex oneOfTypes like
    // `v.oneOftypes(v.shape({name: v.string})`, `v.shape({name: v.number}))`
    // are complex ¯\_(ツ)_/¯. For the current scope only returning the longest message.
    return messages.reduce(function(max, arr) {
      return arr.length > max.length ? arr : max;
    });
  };
};

/**
 * Meta Validators
 * which take options as argument (not validators)
 * and return a new primitive validator
 */
v.equal = function equal(compareWith) {
  return function equalValidator(value) {
    if (value !== compareWith) {
      return JSON.stringify(compareWith);
    }
  };
};

v.oneOf = function oneOf() {
  var options = Array.isArray(arguments[0])
    ? arguments[0]
    : Array.prototype.slice.call(arguments);
  var validators = options.map(function(value) {
    return v.equal(value);
  });

  return v.oneOfType.apply(this, validators);
};

v.range = function range(compareWith) {
  var min = compareWith[0];
  var max = compareWith[1];
  return function rangeValidator(value) {
    var validationResult = validate(v.number, value);

    if (validationResult || value < min || value > max) {
      return 'number between ' + min + ' & ' + max + ' (inclusive)';
    }
  };
};

/**
 * Primitive validators
 *
 * simple validators which return a string or undefined
 */
v.any = function any() {
  return;
};

v.boolean = function boolean(value) {
  if (typeof value !== 'boolean') {
    return 'boolean';
  }
};

v.number = function number(value) {
  if (typeof value !== 'number') {
    return 'number';
  }
};

v.plainArray = function plainArray(value) {
  if (!Array.isArray(value)) {
    return 'array';
  }
};

v.plainObject = function plainObject(value) {
  if (!isPlainObject(value)) {
    return 'object';
  }
};

v.string = function string(value) {
  if (typeof value !== 'string') {
    return 'string';
  }
};

v.func = function func(value) {
  if (typeof value !== 'function') {
    return 'function';
  }
};

function validate(validator, value) {
  // assertions are optional by default unless wrapped in v.require
  if (value == null && !validator.hasOwnProperty('__required')) {
    return;
  }

  var result = validator(value);

  if (result) {
    return Array.isArray(result) ? result : [result];
  }
}

function processMessage(message, options) {
  // message array follows the convention
  // [...path, result]
  // path is an array of object keys / array indices
  // result is output of the validator
  var len = message.length;

  var result = message[len - 1];
  var path = message.slice(0, len - 1);

  if (path.length === 0) {
    path = [DEFAULT_ERROR_PATH];
  }
  options = xtend(options, { path: path });

  return typeof result === 'function'
    ? result(options) // allows customization of result
    : formatErrorMessage(options, prettifyResult(result));
}

function orList(list) {
  if (list.length < 2) {
    return list[0];
  }
  if (list.length === 2) {
    return list.join(' or ');
  }
  return list.slice(0, -1).join(', ') + ', or ' + list.slice(-1);
}

function prettifyResult(result) {
  return 'must be ' + addArticle(result) + '.';
}

function addArticle(nounPhrase) {
  if (/^an? /.test(nounPhrase)) {
    return nounPhrase;
  }
  if (/^[aeiou]/i.test(nounPhrase)) {
    return 'an ' + nounPhrase;
  }
  if (/^[a-z]/i.test(nounPhrase)) {
    return 'a ' + nounPhrase;
  }
  return nounPhrase;
}

function formatErrorMessage(options, prettyResult) {
  var arrayCulprit = isArrayCulprit(options.path);
  var output = options.path.join('.') + ' ' + prettyResult;
  var prepend = arrayCulprit ? 'Item at position ' : '';

  return prepend + output;
}

function isArrayCulprit(path) {
  return typeof path[path.length - 1] == 'number' || typeof path[0] == 'number';
}

function objectEntries(obj) {
  return Object.keys(obj || {}).map(function(key) {
    return { key: key, value: obj[key] };
  });
}

v.validate = validate;
v.processMessage = processMessage;

module.exports = v;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/events.js":
/*!***************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-gl-geocoder/lib/events.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var nanoid = __webpack_require__(/*! nanoid */ "./node_modules/nanoid/index.browser.js")

/**
 * Construct a new mapbox event client to send interaction events to the mapbox event service
 * @param {Object} options options with which to create the service
 * @param {String} options.accessToken the mapbox access token to make requests
 * @param {Number} [options.flushInterval=1000] the number of ms after which to flush the event queue
 * @param {Number} [options.maxQueueSize=100] the number of events to queue before flushing
 * @private
 */
function MapboxEventManager(options) {
  this.origin = options.origin || 'https://api.mapbox.com';
  this.endpoint = 'events/v2';
  this.access_token = options.accessToken;
  this.version = '0.2.0'
  this.sessionID = this.generateSessionID();
  this.userAgent = this.getUserAgent();

  this.options = options;
  this.send = this.send.bind(this);


  // parse global options to be sent with each request
  this.countries = (options.countries) ? options.countries.split(",") : null;
  this.types = (options.types) ? options.types.split(",") : null;
  this.bbox = (options.bbox) ? options.bbox : null;
  this.language = (options.language) ? options.language.split(",") : null;
  this.limit = (options.limit) ? +options.limit : null;
  this.locale = navigator.language || null;
  this.enableEventLogging = this.shouldEnableLogging(options);
  this.eventQueue = new Array();
  this.flushInterval = options.flushInterval || 1000;
  this.maxQueueSize = options.maxQueueSize || 100;
  this.timer = (this.flushInterval) ? setTimeout(this.flush.bind(this), this.flushInterval) : null;
  // keep some state to deduplicate requests if necessary
  this.lastSentInput = "";
  this.lastSentIndex = 0;
}

MapboxEventManager.prototype = {
  /**
     * Send a search.select event to the mapbox events service
     * This event marks the array index of the item selected by the user out of the array of possible options
     * @private
     * @param {Object} selected the geojson feature selected by the user
     * @param {Object} geocoder a mapbox-gl-geocoder instance
     * @returns {Promise}
     */
  select: function(selected, geocoder){
    var resultIndex = this.getSelectedIndex(selected, geocoder);
    var payload = this.getEventPayload('search.select', geocoder);
    payload.resultIndex = resultIndex;
    payload.resultPlaceName  = selected.place_name;
    payload.resultId = selected.id;
    if ((resultIndex === this.lastSentIndex && payload.queryString === this.lastSentInput) || resultIndex == -1) {
      // don't log duplicate events if the user re-selected the same feature on the same search
      return;
    }
    this.lastSentIndex = resultIndex;
    this.lastSentInput = payload.queryString;
    if (!payload.queryString) return; // will be rejected
    return this.push(payload)
  },

  /**
     * Send a search-start event to the mapbox events service
     * This turnstile event marks when a user starts a new search
     * @private
     * @param {Object} geocoder a mapbox-gl-geocoder instance
     * @returns {Promise}
     */
  start: function(geocoder){
    var payload = this.getEventPayload('search.start', geocoder);
    if (!payload.queryString) return; // will be rejected
    return this.push(payload);
  },

  /**
   * Send a search-keyevent event to the mapbox events service
   * This event records each keypress in sequence
   * @private
   * @param {Object} keyEvent the keydown event to log
   * @param {Obeject} geocoder a mapbox-gl-geocoder instance
   * 
   */
  keyevent: function(keyEvent, geocoder){

    //pass invalid event
    if (!keyEvent.key) return;
    // don't send events for keys that don't change the input
    // TAB, ESC, LEFT, RIGHT, ENTER, UP, DOWN
    if (keyEvent.metaKey || [9, 27, 37, 39, 13, 38, 40].indexOf(keyEvent.keyCode) !== -1) return;
    var payload = this.getEventPayload('search.keystroke', geocoder);
    payload.lastAction = keyEvent.key;
    if (!payload.queryString) return; // will be rejected
    return this.push(payload);
  },

  /**
   * Send an event to the events service
   *
   * The event is skipped if the instance is not enabled to send logging events
   *
   * @private
   * @param {Object} payload the http POST body of the event
   * @param {Function} [callback] a callback function to invoke when the send has completed
   * @returns {Promise}
   */
  send: function (payload, callback) {
    if (!this.enableEventLogging) {
      if (callback) return callback();
      return;
    }
    var options = this.getRequestOptions(payload);
    this.request(options, function(err){
      if (err) return this.handleError(err, callback);
      if (callback) {
        return callback();
      }
    }.bind(this))
  },
  /**
   * Get http request options
   * @private
   * @param {*} payload
   */
  getRequestOptions: function(payload){
    if (!Array.isArray(payload)) payload = [payload];
    var options = {
      // events must be sent with POST
      method: "POST",
      host: this.origin,
      path: this.endpoint +  "?access_token=" + this.access_token,
      headers: {
        'Content-Type': 'application/json'
      },
      body:JSON.stringify(payload) //events are arrays
    }
    return options
  },

  /**
   * Get the event payload to send to the events service
   * Most payload properties are shared across all events
   * @private
   * @param {String} event the name of the event to send to the events service. Valid options are 'search.start', 'search.select', 'search.feedback'.
   * @param {Object} geocoder a mapbox-gl-geocoder instance
   * @returns {Object} an event payload
   */
  getEventPayload: function (event, geocoder) {
    var proximity;
    if (!geocoder.options.proximity) proximity = null;
    else proximity = [geocoder.options.proximity.longitude, geocoder.options.proximity.latitude];

    var zoom = (geocoder._map) ? geocoder._map.getZoom() : undefined;
    var payload = {
      event: event,
      created: +new Date(),
      sessionIdentifier: this.sessionID,
      country: this.countries,
      userAgent: this.userAgent,
      language: this.language,
      bbox: this.bbox,
      types: this.types,
      endpoint: 'mapbox.places',
      // fuzzyMatch: search.fuzzy, //todo  --> add to plugin
      proximity: proximity,
      limit: geocoder.options.limit,
      // routing: search.routing, //todo --> add to plugin
      mapZoom: zoom,
      keyboardLocale: this.locale
    }

    // get the text in the search bar
    if (event === "search.select"){
      payload.queryString = geocoder.inputString;
    }else if (event != "search.select" && geocoder._inputEl){
      payload.queryString = geocoder._inputEl.value;
    }else{
      payload.queryString = geocoder.inputString;
    }
    return payload;
  },

  /**
   * Wraps the request function for easier testing
   * Make an http request and invoke a callback
   * @private
   * @param {Object} opts options describing the http request to be made
   * @param {Function} callback the callback to invoke when the http request is completed
   */
  request: function (opts, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 ) {
        if (this.status == 204){
          //success
          return callback(null);
        }else {
          return callback(this.statusText);
        }
      }
    };

    xhttp.open(opts.method, opts.host + '/' + opts.path, true);
    for (var header in opts.headers){
      var headerValue = opts.headers[header];
      xhttp.setRequestHeader(header, headerValue)
    }
    xhttp.send(opts.body);
  },

  /**
   * Handle an error that occurred while making a request
   * @param {Object} err an error instance to log
   * @private
   */
  handleError: function (err, callback) {
    if (callback) return callback(err);
  },

  /**
   * Generate a session ID to be returned with all of the searches made by this geocoder instance
   * ID is random and cannot be tracked across sessions
   * @private
   */
  generateSessionID: function () {
    return nanoid();
  },

  /**
   * Get a user agent string to send with the request to the events service
   * @private
   */
  getUserAgent: function () {
    return 'mapbox-gl-geocoder.' + this.version + "." + navigator.userAgent;
  },

  /**
     * Get the 0-based numeric index of the item that the user selected out of the list of options
     * @private
     * @param {Object} selected the geojson feature selected by the user
     * @param {Object} geocoder a Mapbox-GL-Geocoder instance
     * @returns {Number} the index of the selected result
     */
  getSelectedIndex: function(selected, geocoder){
    if (!geocoder._typeahead) return;
    var results = geocoder._typeahead.data;
    var selectedID = selected.id;
    var resultIDs = results.map(function (feature) {
      return feature.id;
    });
    var selectedIdx = resultIDs.indexOf(selectedID);
    return selectedIdx;
  },

  /**
     * Check whether events should be logged
     * Clients using a localGeocoder or an origin other than mapbox should not have events logged
     * @private
     */
  shouldEnableLogging: function(options){
    if (options.enableEventLogging === false) return false;
    if (options.origin && options.origin.indexOf('api.mapbox.com') == -1) return false;
    // hard to make sense of events when a local instance is suplementing results from origin
    if (options.localGeocoder) return false;
    // hard to make sense of events when a custom filter is in use
    if (options.filter) return false;
    return true;
  },

  /**
   * Flush out the event queue by sending events to the events service
   * @private
   */
  flush: function(){
    if (this.eventQueue.length > 0){
      this.send(this.eventQueue);
      this.eventQueue = new Array();
    }
    // //reset the timer
    if (this.timer)  clearTimeout(this.timer);
    if (this.flushInterval) this.timer = setTimeout(this.flush.bind(this), this.flushInterval)
  },

  /**
   * Push event into the pending queue
   * @param {Object} evt the event to send to the events service
   * @param {Boolean} forceFlush indicates that the event queue should be flushed after adding this event regardless of size of the queue
   * @private
   */
  push: function(evt, forceFlush){
    this.eventQueue.push(evt);
    if (this.eventQueue.length >= this.maxQueueSize || forceFlush){
      this.flush();
    }
  },

  /**
   * Flush any remaining events from the queue before it is removed
   * @private
   */
  remove: function(){
    this.flush();
  }
}



module.exports = MapboxEventManager;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/exceptions.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-gl-geocoder/lib/exceptions.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = {
  'fr': {
    'name': 'France',
    'bbox': [[-4.59235, 41.380007], [9.560016, 51.148506]]
  },
  'us': {
    'name': 'United States',
    'bbox': [[-171.791111, 18.91619], [-66.96466, 71.357764]]
  },
  'ru': {
    'name': 'Russia',
    'bbox': [[19.66064, 41.151416], [190.10042, 81.2504]]
  },
  'ca': {
    'name': 'Canada',
    'bbox': [[-140.99778, 41.675105], [-52.648099, 83.23324]]
  }
};


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/index.js":
/*!**************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-gl-geocoder/lib/index.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Typeahead = __webpack_require__(/*! suggestions */ "./node_modules/suggestions/index.js");
var debounce = __webpack_require__(/*! lodash.debounce */ "./node_modules/lodash.debounce/index.js");
var extend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");
var EventEmitter = __webpack_require__(/*! events */ "./node_modules/events/events.js").EventEmitter;
var exceptions = __webpack_require__(/*! ./exceptions */ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/exceptions.js");
var MapboxClient = __webpack_require__(/*! @mapbox/mapbox-sdk */ "./node_modules/@mapbox/mapbox-sdk/index.js");
var mbxGeocoder = __webpack_require__(/*! @mapbox/mapbox-sdk/services/geocoding */ "./node_modules/@mapbox/mapbox-sdk/services/geocoding.js");
var MapboxEventManager = __webpack_require__(/*! ./events */ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/events.js");
var localization = __webpack_require__(/*! ./localization */ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/localization.js");
var subtag = __webpack_require__(/*! subtag */ "./node_modules/subtag/subtag.js");

/**
 * A geocoder component using Mapbox Geocoding API
 * @class MapboxGeocoder
 * @param {Object} options
 * @param {String} options.accessToken Required.
 * @param {String} options.origin Use to set a custom API origin. Defaults to https://api.mapbox.com.
 * @param {Object} [options.mapboxgl] A [mapbox-gl](https://github.com/mapbox/mapbox-gl-js) instance to use when creating [Markers](https://docs.mapbox.com/mapbox-gl-js/api/#marker). Required if `options.marker` is true.
 * @param {Number} [options.zoom=16] On geocoded result what zoom level should the map animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`.
 * @param {Boolean|Object} [options.flyTo] If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, the object will be passed to the map method to specify a custom animation when a result is selected.
 * @param {String} [options.placeholder="Search"] Override the default placeholder attribute value.
 * @param {Object} [options.proximity] a proximity argument: this is
 * a geographical point given as an object with latitude and longitude
 * properties. Search results closer to this point will be given
 * higher priority.
 * @param {Boolean} [options.trackProximity=true] If true, the geocoder proximity will automatically update based on the map view.
 * @param {Boolean} [options.collapsed=false] If true, the geocoder control will collapse until hovered or in focus.
 * @param {Boolean} [options.clearAndBlurOnEsc=false] If true, the geocoder control will clear it's contents and blur when user presses the escape key.
 * @param {Boolean} [options.clearOnBlur=false] If true, the geocoder control will clear its value when the input blurs.
 * @param {Array} [options.bbox] a bounding box argument: this is
 * a bounding box given as an array in the format [minX, minY, maxX, maxY].
 * Search results will be limited to the bounding box.
 * @param {string} [options.countries] a comma separated list of country codes to
 * limit results to specified country or countries.
 * @param {string} [options.types] a comma seperated list of types that filter
 * results to match those specified. See https://docs.mapbox.com/api/search/#data-types
 * for available types.
 * If reverseGeocode is enabled, you should specify one type. If you configure more than one type, the first type will be used.
 * @param {Number} [options.minLength=2] Minimum number of characters to enter before results are shown.
 * @param {Number} [options.limit=5] Maximum number of results to show.
 * @param {string} [options.language] Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas.
 * @param {Function} [options.filter] A function which accepts a Feature in the [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) format to filter out results from the Geocoding API response before they are included in the suggestions list. Return `true` to keep the item, `false` otherwise.
 * @param {Function} [options.localGeocoder] A function accepting the query string which performs local geocoding to supplement results from the Mapbox Geocoding API. Expected to return an Array of GeoJSON Features in the [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) format.
 * @param {'distance'|'score'} [options.reverseMode='distance'] - Set the factors that are used to sort nearby results.
 * @param {boolean} [options.reverseGeocode] Enable reverse geocoding. Defaults to false. Expects coordinates to be lat, lon.
 * @param {Boolean} [options.enableEventLogging=true] Allow Mapbox to collect anonymous usage statistics from the plugin
 * @param {Boolean|Object} [options.marker=true]  If `true`, a [Marker](https://docs.mapbox.com/mapbox-gl-js/api/#marker) will be added to the map at the location of the user-selected result using a default set of Marker options.  If the value is an object, the marker will be constructed using these options. If `false`, no marker will be added to the map. Requires that `options.mapboxgl` also be set.
 * @param {Function} [options.render] A function that specifies how the results should be rendered in the dropdown menu. Accepts a single [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) object  as input and return a string. Any html in the returned string will be rendered.
 * @param {Function} [options.getItemValue] A function that specifies how the selected result should be rendered in the search bar. This function should accept a single [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) object  as input and return a string. HTML tags in the output string will not be rendered.
 * @param {String} [options.mode='mapbox.places'] A string specifying the geocoding [endpoint](https://docs.mapbox.com/api/search/#endpoints) to query. Options are `mapbox.places` and `mapbox.places-permanent`. The `mapbox.places-permanent` mode requires an enterprise license for permanent geocodes. 
 * @param {Boolean} [options.localGeocoderOnly] If `true`, indicates that the localGeocoder results should be the only ones returned to the user. If `false`, indicates that the localGeocoder results should be combined with those from the Mapbox API. 
 * @example
 * var geocoder = new MapboxGeocoder({ accessToken: mapboxgl.accessToken });
 * map.addControl(geocoder);
 * @return {MapboxGeocoder} `this`
 *
 */

function MapboxGeocoder(options) {
  this._eventEmitter = new EventEmitter();
  this.options = extend({}, this.options, options);
  this.inputString = '';
  this.fresh = true;
  this.lastSelected = null;
}

MapboxGeocoder.prototype = {
  options: {
    zoom: 16,
    flyTo: true,
    trackProximity: true,
    minLength: 2,
    reverseGeocode: false,
    limit: 5,
    origin: 'https://api.mapbox.com',
    enableEventLogging: true,
    marker: true,
    mapboxgl: null,
    collapsed: false,
    clearAndBlurOnEsc: false,
    clearOnBlur: false,
    getItemValue: function(item) {
      return item.place_name
    },
    render: function(item) {
      var placeName = item.place_name.split(',');
      return '<div class="mapboxgl-ctrl-geocoder--suggestion"><div class="mapboxgl-ctrl-geocoder--suggestion-title">' + placeName[0]+ '</div><div class="mapboxgl-ctrl-geocoder--suggestion-address">' + placeName.splice(1, placeName.length).join(',') + '</div></div>';
    }
  },

  /**
   * Add the geocoder to a container. The container can be either a mapboxgl.Map or a reference to an HTML class or ID. 
   * 
   * If the container is a mapboxgl.Map, this function will behave identically to Map.addControl(geocoder)
   * If the container is an html id or class, the geocoder will be appended to that element
   * 
   * This function will throw an error if the container is not one a map or a class/id reference
   * It will also throw an error if the referenced html element cannot be found in the document.body
   * @param {String|mapboxgl.Map} container A reference to the container to which to add the geocoder 
   */
  addTo: function(container){
    // if the container is a map, add the control like normal
    if (container._controlContainer){
      //  it's a mapbox-gl map, add like normal 
      container.addControl(this)
    }
    // if the container is not a map, but an html element, then add the control to that element
    else if (typeof container == 'string' && (container.startsWith('#') || container.startsWith('.'))){
      const parent = document.querySelectorAll(container);
      if (parent.length == 0){
        throw new Error("Element ", container, "not found.")
      }

      if (parent.length > 1){
        throw new Error("Geocoder can only be added to a single html element")
      }

      parent.forEach(function(parentEl){
        const el = this.onAdd(); //returns the input elements, which are then added to the requested html container
        parentEl.appendChild(el);
      }.bind(this))

    }else{
      throw new Error("Error: addTo Container must be a mapbox-gl-js map or a html element reference")
    }
  },

  onAdd: function(map) {
    if (map && typeof map != 'string'){
      this._map = map;
    }

    this.setLanguage();

    if (!this.options.localGeocoderOnly){
      this.geocoderService = mbxGeocoder(
        MapboxClient({
          accessToken: this.options.accessToken,
          origin: this.options.origin
        })
      );  
    }

    if (this.options.localGeocoderOnly && !this.options.localGeocoder){
      throw new Error("A localGeocoder function must be specified to use localGeocoderOnly mode")
    }

    this.eventManager = new MapboxEventManager(this.options);

    this._onChange = this._onChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPaste = this._onPaste.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._showButton = this._showButton.bind(this);
    this._hideButton = this._hideButton.bind(this);
    this._onQueryResult = this._onQueryResult.bind(this);
    this.clear = this.clear.bind(this);
    this._updateProximity = this._updateProximity.bind(this);
    this._collapse = this._collapse.bind(this);
    this._unCollapse = this._unCollapse.bind(this);
    this._clear = this._clear.bind(this);
    this._clearOnBlur = this._clearOnBlur.bind(this);

    var el = (this.container = document.createElement('div'));
    el.className = 'mapboxgl-ctrl-geocoder mapboxgl-ctrl';

    var searchIcon = this.createIcon('search', '<path d="M7.4 2.5c-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9c1 0 1.8-.2 2.5-.8l3.7 3.7c.2.2.4.3.8.3.7 0 1.1-.4 1.1-1.1 0-.3-.1-.5-.3-.8L11.4 10c.4-.8.8-1.6.8-2.5.1-2.8-2.1-5-4.8-5zm0 1.6c1.8 0 3.2 1.4 3.2 3.2s-1.4 3.2-3.2 3.2-3.3-1.3-3.3-3.1 1.4-3.3 3.3-3.3z"/>')

    this._inputEl = document.createElement('input');
    this._inputEl.type = 'text';
    this._inputEl.className = 'mapboxgl-ctrl-geocoder--input';

    this.setPlaceholder();

    if (this.options.collapsed) {
      this._collapse();
      this.container.addEventListener('mouseenter', this._unCollapse);
      this.container.addEventListener('mouseleave', this._collapse);
      this._inputEl.addEventListener('focus', this._unCollapse);
    }

    if (this.options.collapsed || this.options.clearOnBlur) {
      this._inputEl.addEventListener('blur', this._onBlur);
    }

    this._inputEl.addEventListener('keydown', debounce(this._onKeyDown, 200));
    this._inputEl.addEventListener('paste', this._onPaste);
    this._inputEl.addEventListener('change', this._onChange);
    this.container.addEventListener('mouseenter', this._showButton);
    this.container.addEventListener('mouseleave', this._hideButton);
    this._inputEl.addEventListener('keyup', function(e){
      this.eventManager.keyevent(e, this);
    }.bind(this));

    var actions = document.createElement('div');
    actions.classList.add('mapboxgl-ctrl-geocoder--pin-right');

    this._clearEl = document.createElement('button');
    this._clearEl.setAttribute('aria-label', 'Clear');
    this._clearEl.addEventListener('click', this.clear);
    this._clearEl.className = 'mapboxgl-ctrl-geocoder--button';

    var buttonIcon = this.createIcon('close', '<path d="M3.8 2.5c-.6 0-1.3.7-1.3 1.3 0 .3.2.7.5.8L7.2 9 3 13.2c-.3.3-.5.7-.5 1 0 .6.7 1.3 1.3 1.3.3 0 .7-.2 1-.5L9 10.8l4.2 4.2c.2.3.7.3 1 .3.6 0 1.3-.7 1.3-1.3 0-.3-.2-.7-.3-1l-4.4-4L15 4.6c.3-.2.5-.5.5-.8 0-.7-.7-1.3-1.3-1.3-.3 0-.7.2-1 .3L9 7.1 4.8 2.8c-.3-.1-.7-.3-1-.3z"/>')
    this._clearEl.appendChild(buttonIcon);

    this._loadingEl = this.createIcon('loading', '<path fill="#333" d="M4.4 4.4l.8.8c2.1-2.1 5.5-2.1 7.6 0l.8-.8c-2.5-2.5-6.7-2.5-9.2 0z"/><path opacity=".1" d="M12.8 12.9c-2.1 2.1-5.5 2.1-7.6 0-2.1-2.1-2.1-5.5 0-7.7l-.8-.8c-2.5 2.5-2.5 6.7 0 9.2s6.6 2.5 9.2 0 2.5-6.6 0-9.2l-.8.8c2.2 2.1 2.2 5.6 0 7.7z"/>');

    actions.appendChild(this._clearEl);
    actions.appendChild(this._loadingEl);

    el.appendChild(searchIcon);
    el.appendChild(this._inputEl);
    el.appendChild(actions);

    this._typeahead = new Typeahead(this._inputEl, [], {
      filter: false,
      minLength: this.options.minLength,
      limit: this.options.limit
    });

    this.setRenderFunction(this.options.render);
    this._typeahead.getItemValue = this.options.getItemValue;

    this.mapMarker = null;
    this._handleMarker = this._handleMarker.bind(this);
    if (this._map){
      if (this.options.trackProximity ) {
        this._updateProximity();
        this._map.on('moveend', this._updateProximity);
      }
      this._mapboxgl = this.options.mapboxgl;
      if (!this._mapboxgl && this.options.marker) {
       // eslint-disable-next-line no-console
        console.error("No mapboxgl detected in options. Map markers are disabled. Please set options.mapboxgl.");
        this.options.marker = false;
      }
    }
    return el;
  },

  createIcon: function(name, path) {
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'mapboxgl-ctrl-geocoder--icon mapboxgl-ctrl-geocoder--icon-' + name);
    icon.setAttribute('viewBox', '0 0 18 18');
    icon.setAttribute('xml:space','preserve');
    icon.setAttribute('width', 18);
    icon.setAttribute('height', 18);
    icon.innerHTML = path;
    return icon;
  },

  onRemove: function() {
    this.container.parentNode.removeChild(this.container);

    if (this.options.trackProximity && this._map) {
      this._map.off('moveend', this._updateProximity);
    }

    this._removeMarker();

    this._map = null;

    return this;
  },

  _onPaste: function(e){
    var value = (e.clipboardData || window.clipboardData).getData('text');
    if (value.length >= this.options.minLength) {
      this._geocode(value);
    }
  },

  _onKeyDown: function(e) {
    var ESC_KEY_CODE = 27,
      TAB_KEY_CODE = 9;

    if (e.keyCode === ESC_KEY_CODE && this.options.clearAndBlurOnEsc) {
      this._clear(e);
      return this._inputEl.blur();
    }

    // if target has shadowRoot, then get the actual active element inside the shadowRoot
    var target = e.target && e.target.shadowRoot
      ? e.target.shadowRoot.activeElement
      : e.target;
    var value = target ? target.value : '';

    this.lastSelected = null;

    if (!value) {
      this.fresh = true;
      // the user has removed all the text
      if (e.keyCode !== TAB_KEY_CODE) this.clear(e);
      return (this._clearEl.style.display = 'none');
    }

    // TAB, ESC, LEFT, RIGHT, ENTER, UP, DOWN
    if ((e.metaKey || [TAB_KEY_CODE, ESC_KEY_CODE, 37, 39, 13, 38, 40].indexOf(e.keyCode) !== -1))
      return;

    if (target.value.length >= this.options.minLength) {
      this._geocode(target.value);
    }
  },

  _showButton: function() {
    if (this._typeahead.selected) this._clearEl.style.display = 'block';
  },

  _hideButton: function() {
    if (this._typeahead.selected) this._clearEl.style.display = 'none';
  },

  _onBlur: function(e) {
    if (this.options.clearOnBlur) {
      this._clearOnBlur(e);
    }
    if (this.options.collapsed) {
      this._collapse();
    }
  },
  _onChange: function() {
    var selected = this._typeahead.selected;
    if (selected  && JSON.stringify(selected) !== this.lastSelected) {
      this._clearEl.style.display = 'none';
      if (this.options.flyTo) {
        var flyOptions;
        if (selected.properties && !exceptions[selected.properties.short_code] && selected.bbox) {
          var bbox = selected.bbox;
          flyOptions = extend({}, this.options.flyTo);
          if (this._map){
            this._map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], flyOptions);
          }
        } else if (selected.properties && exceptions[selected.properties.short_code]) {
          // Certain geocoder search results return (and therefore zoom to fit)
          // an unexpectedly large bounding box: for example, both Russia and the
          // USA span both sides of -180/180, or France includes the island of
          // Reunion in the Indian Ocean. An incomplete list of these exceptions
          // at ./exceptions.json provides "reasonable" bounding boxes as a
          // short-term solution; this may be amended as necessary.
          flyOptions = extend({}, this.options.flyTo);
          if (this._map){
            this._map.fitBounds(exceptions[selected.properties.short_code].bbox, flyOptions);
          }
        } else {
          var defaultFlyOptions = {
            zoom: this.options.zoom
          }
          flyOptions = extend({}, defaultFlyOptions, this.options.flyTo);
          //  ensure that center is not overriden by custom options
          flyOptions.center = selected.center;
          if (this._map){
            this._map.flyTo(flyOptions);
          }
        }
      }
      if (this.options.marker && this._mapboxgl){
        this._handleMarker(selected);
      }

      // After selecting a feature, re-focus the textarea and set
      // cursor at start.
      this._inputEl.focus();
      this._inputEl.scrollLeft = 0;
      this._inputEl.setSelectionRange(0, 0);
      this.lastSelected = JSON.stringify(selected);
      this._eventEmitter.emit('result', { result: selected });
      this.eventManager.select(selected, this);
    }
  },

  _geocode: function(searchInput) {
    this._loadingEl.style.display = 'block';
    this._eventEmitter.emit('loading', { query: searchInput });
    this.inputString = searchInput;
    // Possible config proprerties to pass to client
    var keys = [
      'bbox',
      'limit',
      'proximity',
      'countries',
      'types',
      'language',
      'reverseMode',
      'mode'
    ];
    var self = this;
    // Create config object
    var config = keys.reduce(function(config, key) {
      if (self.options[key]) {
        // countries, types, and language need to be passed in as arrays to client
        // https://github.com/mapbox/mapbox-sdk-js/blob/master/services/geocoding.js#L38-L47
        ['countries', 'types', 'language'].indexOf(key) > -1
          ? (config[key] = self.options[key].split(/[\s,]+/))
          : (config[key] = self.options[key]);

        if (key === 'proximity' && self.options[key] && self.options[key].longitude && self.options[key].latitude) {
          config[key] = [self.options[key].longitude, self.options[key].latitude]
        }
      }
      return config;
    }, {});

    var request;
    if (this.options.localGeocoderOnly){
      request = Promise.resolve();
    }
    // check if searchInput resembles coordinates, and if it does,
    // make the request a reverseGeocode
    else if (
      this.options.reverseGeocode &&
      /(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)[ ]*$/.test(searchInput)
    ) {
      // parse coordinates
      var coords = searchInput.split(/[\s(,)?]+/).map(function(c) {
        return parseFloat(c, 10);
      }).reverse();

      // client only accepts one type for reverseGeocode, so
      // use first config type if one, if not default to poi
      config.types ? [config.types[0]] : ["poi"];
      config = extend(config, { query: coords, limit: 1 });
      request = this.geocoderService.reverseGeocode(config).send();
    } else {
      config = extend(config, { query: searchInput });
      request = this.geocoderService.forwardGeocode(config).send();
    }

    var localGeocoderRes = [];
    if (this.options.localGeocoder) {
      localGeocoderRes = this.options.localGeocoder(searchInput);
      if (!localGeocoderRes) {
        localGeocoderRes = [];
      }
    }

    request.then(
      function(response) {
        this._loadingEl.style.display = 'none';

        var res = {};

        if (!response){
          res = {
            type: 'FeatureCollection',
            features: []
          }
        }else if (response.statusCode == '200') {
          res = response.body;
          res.request = response.request
          res.headers = response.headers
        }

        res.config = config;
        if (this.fresh){
          this.eventManager.start(this);
          this.fresh = false;
        }
        // supplement Mapbox Geocoding API results with locally populated results
        res.features = res.features
          ? localGeocoderRes.concat(res.features)
          : localGeocoderRes;

        // apply results filter if provided
        if (this.options.filter && res.features.length) {
          res.features = res.features.filter(this.options.filter);
        }

        if (res.features.length) {
          this._clearEl.style.display = 'block';
          this._eventEmitter.emit('results', res);
          this._typeahead.update(res.features);
        } else {
          this._clearEl.style.display = 'none';
          this._typeahead.selected = null;
          this._renderNoResults();
          this._eventEmitter.emit('results', res);
        }

      }.bind(this)
    );

    request.catch(
      function(err) {
        this._loadingEl.style.display = 'none';

        // in the event of an error in the Mapbox Geocoding API still display results from the localGeocoder
        if (localGeocoderRes.length && this.options.localGeocoder) {
          this._clearEl.style.display = 'block';
          this._typeahead.update(localGeocoderRes);
        } else {
          this._clearEl.style.display = 'none';
          this._typeahead.selected = null;
          this._renderError();
        }

        this._eventEmitter.emit('results', { features: localGeocoderRes });
        this._eventEmitter.emit('error', { error: err });
      }.bind(this)
    );

    return request;
  },

  /**
   * Shared logic for clearing input
   * @param {Event} [ev] the event that triggered the clear, if available
   * @private
   *
   */
  _clear: function(ev) {
    if (ev) ev.preventDefault();
    this._inputEl.value = '';
    this._typeahead.selected = null;
    this._typeahead.clear();
    this._onChange();
    this._clearEl.style.display = 'none';
    this._removeMarker();
    this.lastSelected = null;
    this._eventEmitter.emit('clear');
    this.fresh = true;
  },

  /**
   * Clear and then focus the input.
   * @param {Event} [ev] the event that triggered the clear, if available
   *
   */
  clear: function(ev) {
    this._clear(ev);
    this._inputEl.focus();
  },


  /**
   * Clear the input, without refocusing it. Used to implement clearOnBlur
   * constructor option.
   * @param {Event} [ev] the blur event
   * @private
   */
  _clearOnBlur: function(ev) {
    var ctx = this;

    /**
    * If relatedTarget is not found, assume user targeted the suggestions list.
    * In that case, do not clear on blur. There are other edge cases where
    * ev.relatedTarget could be null. Clicking on list always results in null
    * relatedtarget because of upstream behavior in `suggestions`.
    *
    * The ideal solution would be to check if ev.relatedTarget is a child of
    * the list. See issue #258 for details on why we can't do that yet.
    */
    if (ev.relatedTarget) {
      ctx._clear(ev);
    }
  },

  _onQueryResult: function(response) {
    var results = response.body;
    if (!results.features.length) return;
    var result = results.features[0];
    this._typeahead.selected = result;
    this._inputEl.value = result.place_name;
    this._onChange();
  },

  _updateProximity: function() {
    // proximity is designed for local scale, if the user is looking at the whole world,
    // it doesn't make sense to factor in the arbitrary centre of the map
    if (!this._map){
      return;
    }
    if (this._map.getZoom() > 9) {
      var center = this._map.getCenter().wrap();
      this.setProximity({ longitude: center.lng, latitude: center.lat });
    } else {
      this.setProximity(null);
    }
  },

  _collapse: function() {
    // do not collapse if input is in focus
    if (!this._inputEl.value && this._inputEl !== document.activeElement) this.container.classList.add('mapboxgl-ctrl-geocoder--collapsed');
  },

  _unCollapse: function() {
    this.container.classList.remove('mapboxgl-ctrl-geocoder--collapsed');
  },

  /**
   * Set & query the input
   * @param {string} searchInput location name or other search input
   * @returns {MapboxGeocoder} this
   */
  query: function(searchInput) {
    this._geocode(searchInput).then(this._onQueryResult);
    return this;
  },

  _renderError: function(){
    var errorMessage = "<div class='mapbox-gl-geocoder--error'>There was an error reaching the server</div>"
    this._renderMessage(errorMessage);
  },

  _renderNoResults: function(){
    var errorMessage = "<div class='mapbox-gl-geocoder--error mapbox-gl-geocoder--no-results'>No results found</div>";
    this._renderMessage(errorMessage);
  },

  _renderMessage: function(msg){
    this._typeahead.update([]);
    this._typeahead.selected = null;
    this._typeahead.clear();
    this._typeahead.renderError(msg);
  },

  /**
   * Get the text to use as the search bar placeholder
   *
   * If placeholder is provided in options, then use options.placeholder
   * Otherwise, if language is provided in options, then use the localized string of the first language if available
   * Otherwise use the default
   *
   * @returns {String} the value to use as the search bar placeholder
   * @private
   */
  _getPlaceholderText: function(){
    if (this.options.placeholder) return this.options.placeholder;
    if (this.options.language){
      var firstLanguage = this.options.language.split(",")[0];
      var language = subtag.language(firstLanguage);
      var localizedValue = localization.placeholder[language];
      if (localizedValue)  return localizedValue;
    }
    return 'Search';
  },

  /**
   * Set input
   * @param {string} searchInput location name or other search input
   * @returns {MapboxGeocoder} this
   */
  setInput: function(searchInput) {
    // Set input value to passed value and clear everything else.
    this._inputEl.value = searchInput;
    this._typeahead.selected = null;
    this._typeahead.clear();
    this._onChange();
    return this;
  },

  /**
   * Set proximity
   * @param {Object} proximity The new options.proximity value. This is a geographical point given as an object with latitude and longitude properties.
   * @returns {MapboxGeocoder} this
   */
  setProximity: function(proximity) {
    this.options.proximity = proximity;
    return this;
  },

  /**
   * Get proximity
   * @returns {Object} The geocoder proximity
   */
  getProximity: function() {
    return this.options.proximity;
  },

  /**
   * Set the render function used in the results dropdown
   * @param {Function} fn The function to use as a render function. This function accepts a single [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) object as input and returns a string.
   * @returns {MapboxGeocoder} this
   */
  setRenderFunction: function(fn){
    if (fn && typeof(fn) == "function"){
      this._typeahead.render = fn;
    }
    return this;
  },

  /**
   * Get the function used to render the results dropdown
   *
   * @returns {Function} the render function
   */
  getRenderFunction: function(){
    return this._typeahead.render;
  },

  /**
   * Get the language to use in UI elements and when making search requests
   *
   * Look first at the explicitly set options otherwise use the browser's language settings
   * @param {String} language Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas.
   * @returns {MapboxGeocoder} this
   */
  setLanguage: function(language){
    var browserLocale = navigator.language || navigator.userLanguage || navigator.browserLanguage;
    this.options.language = language || this.options.language || browserLocale;
    return this;
  },

  /**
   * Get the language to use in UI elements and when making search requests
   * @returns {String} The language(s) used by the plugin, if any
   */
  getLanguage: function(){
    return this.options.language;
  },

  /**
   * Get the zoom level the map will move to when there is no bounding box on the selected result
   * @returns {Number} the map zoom
   */
  getZoom: function(){
    return this.options.zoom;
  },

  /**
   * Set the zoom level
   * @param {Number} zoom The zoom level that the map should animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`.
   * @returns {MapboxGeocoder} this
   */
  setZoom: function(zoom){
    this.options.zoom = zoom;
    return this;
  },

  /**
   * Get the parameters used to fly to the selected response, if any
   * @returns {MapboxGeocoder} this
   */
  getFlyTo: function(){
    return this.options.flyTo;
  },

  /**
   * Set the flyTo options
   * @param {Object|Boolean} flyTo  If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, the object will be passed to the flyTo map method to specify a custom animation.
   */
  setFlyTo: function(flyTo){
    this.options.flyTo = flyTo;
    return this;
  },

  /**
   * Get the value of the placeholder string
   * @returns {String} The input element's placeholder value
   */
  getPlaceholder: function(){
    return this.options.placeholder;
  },

  /**
   * Set the value of the input element's placeholder
   * @param {String} placeholder the text to use as the input element's placeholder
   * @returns {MapboxGeocoder} this
   */
  setPlaceholder: function(placeholder){
    this.placeholder = (placeholder) ? placeholder : this._getPlaceholderText();
    this._inputEl.placeholder = this.placeholder;
    return this
  },

  /**
   * Get the bounding box used by the plugin
   * @returns {Array<Number>} the bounding box, if any
   */
  getBbox: function(){
    return this.options.bbox;
  },

  /**
   * Set the bounding box to limit search results to
   * @param {Array<Number>} bbox a bounding box given as an array in the format [minX, minY, maxX, maxY].
   * @returns {MapboxGeocoder} this
   */
  setBbox: function(bbox){
    this.options.bbox = bbox;
    return this;
  },

  /**
   * Get a list of the countries to limit search results to
   * @returns {String} a comma separated list of countries to limit to, if any
   */
  getCountries: function(){
    return this.options.countries;
  },

  /**
   * Set the countries to limit search results to
   * @param {String} countries a comma separated list of countries to limit to
   * @returns {MapboxGeocoder} this
   */
  setCountries: function(countries){
    this.options.countries = countries;
    return this;
  },

  /**
   * Get a list of the types to limit search results to
   * @returns {String} a comma separated list of types to limit to
   */
  getTypes: function(){
    return this.options.types;
  },

  /**
   * Set the types to limit search results to
   * @param {String} countries a comma separated list of types to limit to
   * @returns {MapboxGeocoder} this
   */
  setTypes: function(types){
    this.options.types = types;
    return this;
  },

  /**
   * Get the minimum number of characters typed to trigger results used in the plugin
   * @returns {Number} The minimum length in characters before a search is triggered
   */
  getMinLength: function(){
    return this.options.minLength;
  },

  /**
   * Set the minimum number of characters typed to trigger results used by the plugin
   * @param {Number} minLength the minimum length in characters
   * @returns {MapboxGeocoder} this
   */
  setMinLength: function(minLength){
    this.options.minLength = minLength;
    if (this._typeahead)  this._typeahead.minLength = minLength;
    return this;
  },

  /**
   * Get the limit value for the number of results to display used by the plugin
   * @returns {Number} The limit value for the number of results to display used by the plugin
   */
  getLimit: function(){
    return this.options.limit;
  },

  /**
   * Set the limit value for the number of results to display used by the plugin
   * @param {Number} limit the number of search results to return
   * @returns {MapboxGeocoder}
   */
  setLimit: function(limit){
    this.options.limit = limit;
    if (this._typeahead) this._typeahead.options.limit = limit;
    return this;
  },

  /**
   * Get the filter function used by the plugin
   * @returns {Function} the filter function
   */
  getFilter: function(){
    return this.options.filter;
  },

  /**
   * Set the filter function used by the plugin.
   * @param {Function} filter A function which accepts a Feature in the [Carmen GeoJSON](https://github.com/mapbox/carmen/blob/master/carmen-geojson.md) format to filter out results from the Geocoding API response before they are included in the suggestions list. Return `true` to keep the item, `false` otherwise.
   * @returns {MapboxGeocoder} this
   */
  setFilter: function(filter){
    this.options.filter = filter;
    return this;
  },

  /**
   * Set the geocoding endpoint used by the plugin.
   * @param {Function} origin A function which accepts an HTTPS URL to specify the endpoint to query results from.
   * @returns {MapboxGeocoder} this
   */
  setOrigin: function(origin){
    this.options.origin = origin;
    this.geocoderService = mbxGeocoder(
      MapboxClient({
        accessToken: this.options.accessToken,
        origin: this.options.origin
      })
    );  
    return this;
  },

  /**
   * Get the geocoding endpoint the plugin is currently set to
   * @returns {Function} the endpoint URL
   */
  getOrigin: function(){
    return this.options.origin;
  },

  /**
   * Handle the placement of a result marking the selected result
   * @private
   * @param {Object} selected the selected geojson feature
   * @returns {MapboxGeocoder} this
   */
  _handleMarker: function(selected){
    // clean up any old marker that might be present
    if (!this._map){
      return;
    }
    this._removeMarker();
    var defaultMarkerOptions = {
      color: '#4668F2'
    }
    var markerOptions = extend({}, defaultMarkerOptions, this.options.marker)
    this.mapMarker = new this._mapboxgl.Marker(markerOptions);
    this.mapMarker
      .setLngLat(selected.center)
      .addTo(this._map);
    return this;
  },

  /**
   * Handle the removal of a result marker
   * @private
   */
  _removeMarker: function(){
    if (this.mapMarker){
      this.mapMarker.remove();
      this.mapMarker = null;
    }
  },

  /**
   * Subscribe to events that happen within the plugin.
   * @param {String} type name of event. Available events and the data passed into their respective event objects are:
   *
   * - __clear__ `Emitted when the input is cleared`
   * - __loading__ `{ query } Emitted when the geocoder is looking up a query`
   * - __results__ `{ results } Fired when the geocoder returns a response`
   * - __result__ `{ result } Fired when input is set`
   * - __error__ `{ error } Error as string`
   * @param {Function} fn function that's called when the event is emitted.
   * @returns {MapboxGeocoder} this;
   */
  on: function(type, fn) {
    this._eventEmitter.on(type, fn);
    return this;
  },

  /**
   * Remove an event
   * @returns {MapboxGeocoder} this
   * @param {String} type Event name.
   * @param {Function} fn Function that should unsubscribe to the event emitted.
   */
  off: function(type, fn) {
    this._eventEmitter.removeListener(type, fn);
    this.eventManager.remove();
    return this;
  }
};

module.exports = MapboxGeocoder;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/localization.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-gl-geocoder/lib/localization.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Localized values for the placeholder string
 * 
 * @private
 */
var placeholder = {
    // list drawn from https://docs.mapbox.com/api/search/#language-coverage
  'de': 'Suche', // german
  'it': 'Ricerca', //italian
  'en': 'Search', // english
  'nl': 'Zoeken', //dutch
  'fr': 'Chercher',  //french
  'ca': 'Cerca', //catalan
  'he': 'לחפש', //hebrew
  'ja': 'サーチ',  //japanese
  'lv': 'Meklēt', //latvian
  'pt': 'Procurar', //portuguese 
  'sr': 'Претрага', //serbian
  'zh': '搜索', //chinese-simplified
  'cs': 'Vyhledávání', //czech
  'hu': 'Keresés', //hungarian
  'ka': 'ძიება', // georgian
  'nb': 'Søke', //norwegian
  'sk': 'Vyhľadávanie', //slovak
  'th': 'ค้นหา', //thai
  'fi': 'Hae',//finnish
  'is': 'Leita',//icelandic
  'ko': '수색',//korean
  'pl':  'Szukaj', //polish
  'sl': 'Iskanje' //slovenian
}

module.exports = {placeholder: placeholder};

/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/index.js":
/*!**************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/index.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var client = __webpack_require__(/*! ./lib/client */ "./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-client.js");

module.exports = client;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-client.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-client.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var browser = __webpack_require__(/*! ./browser-layer */ "./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-layer.js");
var MapiClient = __webpack_require__(/*! ../classes/mapi-client */ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-client.js");

function BrowserClient(options) {
  MapiClient.call(this, options);
}
BrowserClient.prototype = Object.create(MapiClient.prototype);
BrowserClient.prototype.constructor = BrowserClient;

BrowserClient.prototype.sendRequest = browser.browserSend;
BrowserClient.prototype.abortRequest = browser.browserAbort;

/**
 * Create a client for the browser.
 *
 * @param {Object} options
 * @param {string} options.accessToken
 * @param {string} [options.origin]
 * @returns {MapiClient}
 */
function createBrowserClient(options) {
  return new BrowserClient(options);
}

module.exports = createBrowserClient;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-layer.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-layer.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var MapiResponse = __webpack_require__(/*! ../classes/mapi-response */ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-response.js");
var MapiError = __webpack_require__(/*! ../classes/mapi-error */ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-error.js");
var constants = __webpack_require__(/*! ../constants */ "./node_modules/@mapbox/mapbox-sdk/lib/constants.js");
var parseHeaders = __webpack_require__(/*! ../helpers/parse-headers */ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-headers.js");

// Keys are request IDs, values are XHRs.
var requestsUnderway = {};

function browserAbort(request) {
  var xhr = requestsUnderway[request.id];
  if (!xhr) return;
  xhr.abort();
  delete requestsUnderway[request.id];
}

function createResponse(request, xhr) {
  return new MapiResponse(request, {
    body: xhr.response,
    headers: parseHeaders(xhr.getAllResponseHeaders()),
    statusCode: xhr.status
  });
}

function normalizeBrowserProgressEvent(event) {
  var total = event.total;
  var transferred = event.loaded;
  var percent = (100 * transferred) / total;
  return {
    total: total,
    transferred: transferred,
    percent: percent
  };
}

function sendRequestXhr(request, xhr) {
  return new Promise(function(resolve, reject) {
    xhr.onprogress = function(event) {
      request.emitter.emit(
        constants.EVENT_PROGRESS_DOWNLOAD,
        normalizeBrowserProgressEvent(event)
      );
    };

    var file = request.file;
    if (file) {
      xhr.upload.onprogress = function(event) {
        request.emitter.emit(
          constants.EVENT_PROGRESS_UPLOAD,
          normalizeBrowserProgressEvent(event)
        );
      };
    }

    xhr.onerror = function(error) {
      reject(error);
    };

    xhr.onabort = function() {
      var mapiError = new MapiError({
        request: request,
        type: constants.ERROR_REQUEST_ABORTED
      });
      reject(mapiError);
    };

    xhr.onload = function() {
      delete requestsUnderway[request.id];
      if (xhr.status < 200 || xhr.status >= 400) {
        var mapiError = new MapiError({
          request: request,
          body: xhr.response,
          statusCode: xhr.status
        });
        reject(mapiError);
        return;
      }
      resolve(xhr);
    };

    var body = request.body;

    // matching service needs to send a www-form-urlencoded request
    if (typeof body === 'string') {
      xhr.send(body);
    } else if (body) {
      xhr.send(JSON.stringify(body));
    } else if (file) {
      xhr.send(file);
    } else {
      xhr.send();
    }

    requestsUnderway[request.id] = xhr;
  }).then(function(xhr) {
    return createResponse(request, xhr);
  });
}

// The accessToken argument gives this function flexibility
// for Mapbox's internal client.
function createRequestXhr(request, accessToken) {
  var url = request.url(accessToken);
  var xhr = new window.XMLHttpRequest();
  xhr.open(request.method, url);
  Object.keys(request.headers).forEach(function(key) {
    xhr.setRequestHeader(key, request.headers[key]);
  });
  return xhr;
}

function browserSend(request) {
  return Promise.resolve().then(function() {
    var xhr = createRequestXhr(request, request.client.accessToken);
    return sendRequestXhr(request, xhr);
  });
}

module.exports = {
  browserAbort: browserAbort,
  sendRequestXhr: sendRequestXhr,
  browserSend: browserSend,
  createRequestXhr: createRequestXhr
};


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-client.js":
/*!********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-client.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var parseToken = __webpack_require__(/*! @mapbox/parse-mapbox-token */ "./node_modules/@mapbox/parse-mapbox-token/index.js");
var MapiRequest = __webpack_require__(/*! ./mapi-request */ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-request.js");
var constants = __webpack_require__(/*! ../constants */ "./node_modules/@mapbox/mapbox-sdk/lib/constants.js");

/**
 * A low-level Mapbox API client. Use it to create service clients
 * that share the same configuration.
 *
 * Services and `MapiRequest`s use the underlying `MapiClient` to
 * determine how to create, send, and abort requests in a way
 * that is appropriate to the configuration and environment
 * (Node or the browser).
 *
 * @class MapiClient
 * @property {string} accessToken - The Mapbox access token assigned
 *   to this client.
 * @property {string} [origin] - The origin
 *   to use for API requests. Defaults to https://api.mapbox.com.
 */

function MapiClient(options) {
  if (!options || !options.accessToken) {
    throw new Error('Cannot create a client without an access token');
  }
  // Try parsing the access token to determine right away if it's valid.
  parseToken(options.accessToken);

  this.accessToken = options.accessToken;
  this.origin = options.origin || constants.API_ORIGIN;
}

MapiClient.prototype.createRequest = function createRequest(requestOptions) {
  return new MapiRequest(this, requestOptions);
};

module.exports = MapiClient;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-error.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-error.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(/*! ../constants */ "./node_modules/@mapbox/mapbox-sdk/lib/constants.js");

/**
 * A Mapbox API error.
 *
 * If there's an error during the API transaction,
 * the Promise returned by `MapiRequest`'s [`send`](#send)
 * method should reject with a `MapiError`.
 *
 * @class MapiError
 * @hideconstructor
 * @property {MapiRequest} request - The errored request.
 * @property {string} type - The type of error. Usually this is `'HttpError'`.
 *   If the request was aborted, so the error was
 *   not sent from the server, the type will be
 *   `'RequestAbortedError'`.
 * @property {number} [statusCode] - The numeric status code of
 *   the HTTP response.
 * @property {Object | string} [body] - If the server sent a response body,
 *   this property exposes that response, parsed as JSON if possible.
 * @property {string} [message] - Whatever message could be derived from the
 *   call site and HTTP response.
 *
 * @param {MapiRequest} options.request
 * @param {number} [options.statusCode]
 * @param {string} [options.body]
 * @param {string} [options.message]
 * @param {string} [options.type]
 */
function MapiError(options) {
  var errorType = options.type || constants.ERROR_HTTP;

  var body;
  if (options.body) {
    try {
      body = JSON.parse(options.body);
    } catch (e) {
      body = options.body;
    }
  } else {
    body = null;
  }

  var message = options.message || null;
  if (!message) {
    if (typeof body === 'string') {
      message = body;
    } else if (body && typeof body.message === 'string') {
      message = body.message;
    } else if (errorType === constants.ERROR_REQUEST_ABORTED) {
      message = 'Request aborted';
    }
  }

  this.message = message;
  this.type = errorType;
  this.statusCode = options.statusCode || null;
  this.request = options.request;
  this.body = body;
}

module.exports = MapiError;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-request.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-request.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var parseToken = __webpack_require__(/*! @mapbox/parse-mapbox-token */ "./node_modules/@mapbox/parse-mapbox-token/index.js");
var xtend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");
var EventEmitter = __webpack_require__(/*! eventemitter3 */ "./node_modules/@mapbox/mapbox-sdk/node_modules/eventemitter3/index.js");
var urlUtils = __webpack_require__(/*! ../helpers/url-utils */ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/url-utils.js");
var constants = __webpack_require__(/*! ../constants */ "./node_modules/@mapbox/mapbox-sdk/lib/constants.js");

var requestId = 1;

/**
 * A Mapbox API request.
 *
 * Note that creating a `MapiRequest` does *not* send the request automatically.
 * Use the request's `send` method to send it off and get a `Promise`.
 *
 * The `emitter` property is an `EventEmitter` that emits the following events:
 *
 * - `'response'` - Listeners will be called with a `MapiResponse`.
 * - `'error'` - Listeners will be called with a `MapiError`.
 * - `'downloadProgress'` - Listeners will be called with `ProgressEvents`.
 * - `'uploadProgress'` - Listeners will be called with `ProgressEvents`.
 *   Upload events are only available when the request includes a file.
 *
 * @class MapiRequest
 * @property {EventEmitter} emitter - An event emitter. See above.
 * @property {MapiClient} client - This request's `MapiClient`.
 * @property {MapiResponse|null} response - If this request has been sent and received
 *   a response, the response is available on this property.
 * @property {MapiError|Error|null} error - If this request has been sent and
 *   received an error in response, the error is available on this property.
 * @property {boolean} aborted - If the request has been aborted
 *   (via [`abort`](#abort)), this property will be `true`.
 * @property {boolean} sent - If the request has been sent, this property will
 *   be `true`. You cannot send the same request twice, so if you need to create
 *   a new request that is the equivalent of an existing one, use
 *   [`clone`](#clone).
 * @property {string} path - The request's path, including colon-prefixed route
 *   parameters.
 * @property {string} origin - The request's origin.
 * @property {string} method - The request's HTTP method.
 * @property {Object} query - A query object, which will be transformed into
 *   a URL query string.
 * @property {Object} params - A route parameters object, whose values will
 *   be interpolated the path.
 * @property {Object} headers - The request's headers.
 * @property {Object|string|null} body - Data to send with the request.
 *   If the request has a body, it will also be sent with the header
 *   `'Content-Type: application/json'`.
 * @property {Blob|ArrayBuffer|string|ReadStream} file - A file to
 *   send with the request. The browser client accepts Blobs and ArrayBuffers;
 *   the Node client accepts strings (filepaths) and ReadStreams.
 */

/**
 * @ignore
 * @param {MapiClient} client
 * @param {Object} options
 * @param {string} options.method
 * @param {string} options.path
 * @param {Object} [options.query={}]
 * @param {Object} [options.params={}]
 * @param {string} [options.origin]
 * @param {Object} [options.headers]
 * @param {Object} [options.body=null]
 * @param {Blob|ArrayBuffer|string|ReadStream} [options.file=null]
 */
function MapiRequest(client, options) {
  if (!client) {
    throw new Error('MapiRequest requires a client');
  }
  if (!options || !options.path || !options.method) {
    throw new Error(
      'MapiRequest requires an options object with path and method properties'
    );
  }

  var defaultHeaders = {};
  if (options.body) {
    defaultHeaders['content-type'] = 'application/json';
  }

  var headersWithDefaults = xtend(defaultHeaders, options.headers);

  // Disallows duplicate header names of mixed case,
  // e.g. Content-Type and content-type.
  var headers = Object.keys(headersWithDefaults).reduce(function(memo, name) {
    memo[name.toLowerCase()] = headersWithDefaults[name];
    return memo;
  }, {});

  this.id = requestId++;
  this._options = options;

  this.emitter = new EventEmitter();
  this.client = client;
  this.response = null;
  this.error = null;
  this.sent = false;
  this.aborted = false;
  this.path = options.path;
  this.method = options.method;
  this.origin = options.origin || client.origin;
  this.query = options.query || {};
  this.params = options.params || {};
  this.body = options.body || null;
  this.file = options.file || null;
  this.headers = headers;
}

/**
 * Get the URL of the request.
 *
 * @param {string} [accessToken] - By default, the access token of the request's
 *   client is used.
 * @return {string}
 */
MapiRequest.prototype.url = function url(accessToken) {
  var url = urlUtils.prependOrigin(this.path, this.origin);
  url = urlUtils.appendQueryObject(url, this.query);
  var routeParams = this.params;
  if (accessToken) {
    url = urlUtils.appendQueryParam(url, 'access_token', accessToken);
    var accessTokenOwnerId = parseToken(accessToken).user;
    routeParams = xtend({ ownerId: accessTokenOwnerId }, routeParams);
  }
  url = urlUtils.interpolateRouteParams(url, routeParams);
  return url;
};

/**
 * Send the request. Returns a Promise that resolves with a `MapiResponse`.
 * You probably want to use `response.body`.
 *
 * `send` only retrieves the first page of paginated results. You can get
 * the next page by using the `MapiResponse`'s [`nextPage`](#nextpage)
 * function, or iterate through all pages using [`eachPage`](#eachpage)
 * instead of `send`.
 *
 * @returns {Promise<MapiResponse>}
 */
MapiRequest.prototype.send = function send() {
  var self = this;

  if (self.sent) {
    throw new Error(
      'This request has already been sent. Check the response and error properties. Create a new request with clone().'
    );
  }
  self.sent = true;

  return self.client.sendRequest(self).then(
    function(response) {
      self.response = response;
      self.emitter.emit(constants.EVENT_RESPONSE, response);
      return response;
    },
    function(error) {
      self.error = error;
      self.emitter.emit(constants.EVENT_ERROR, error);
      throw error;
    }
  );
};

/**
 * Abort the request.
 *
 * Any pending `Promise` returned by [`send`](#send) will be rejected with
 * an error with `type: 'RequestAbortedError'`. If you've created a request
 * that might be aborted, you need to catch and handle such errors.
 *
 * This method will also abort any requests created while fetching subsequent
 * pages via [`eachPage`](#eachpage).
 *
 * If the request has not been sent or has already been aborted, nothing
 * will happen.
 */
MapiRequest.prototype.abort = function abort() {
  if (this._nextPageRequest) {
    this._nextPageRequest.abort();
    delete this._nextPageRequest;
  }

  if (this.response || this.error || this.aborted) return;

  this.aborted = true;
  this.client.abortRequest(this);
};

/**
 * Invoke a callback for each page of a paginated API response.
 *
 * The callback should have the following signature:
 *
 * ```js
 * (
 *   error: MapiError,
 *   response: MapiResponse,
 *   next: () => void
 * ) => void
 * ```
 *
 * **The next page will not be fetched until you've invoked the
 * `next` callback**, indicating that you're ready for it.
 *
 * @param {Function} callback
 */
MapiRequest.prototype.eachPage = function eachPage(callback) {
  var self = this;

  function handleResponse(response) {
    function getNextPage() {
      delete self._nextPageRequest;
      var nextPageRequest = response.nextPage();
      if (nextPageRequest) {
        self._nextPageRequest = nextPageRequest;
        getPage(nextPageRequest);
      }
    }
    callback(null, response, getNextPage);
  }

  function handleError(error) {
    callback(error, null, function() {});
  }

  function getPage(request) {
    request.send().then(handleResponse, handleError);
  }
  getPage(this);
};

/**
 * Clone this request.
 *
 * Each request can only be sent *once*. So if you'd like to send the
 * same request again, clone it and send away.
 *
 * @returns {MapiRequest} - A new `MapiRequest` configured just like this one.
 */
MapiRequest.prototype.clone = function clone() {
  return this._extend();
};

/**
 * @ignore
 */
MapiRequest.prototype._extend = function _extend(options) {
  var extendedOptions = xtend(this._options, options);
  return new MapiRequest(this.client, extendedOptions);
};

module.exports = MapiRequest;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-response.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-response.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var parseLinkHeader = __webpack_require__(/*! ../helpers/parse-link-header */ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-link-header.js");

/**
 * A Mapbox API response.
 *
 * @class MapiResponse
 * @property {Object} body - The response body, parsed as JSON.
 * @property {string} rawBody - The raw response body.
 * @property {number} statusCode - The response's status code.
 * @property {Object} headers - The parsed response headers.
 * @property {Object} links - The parsed response links.
 * @property {MapiRequest} request - The response's originating `MapiRequest`.
 */

/**
 * @ignore
 * @param {MapiRequest} request
 * @param {Object} responseData
 * @param {Object} responseData.headers
 * @param {string} responseData.body
 * @param {number} responseData.statusCode
 */
function MapiResponse(request, responseData) {
  this.request = request;
  this.headers = responseData.headers;
  this.rawBody = responseData.body;
  this.statusCode = responseData.statusCode;
  try {
    this.body = JSON.parse(responseData.body || '{}');
  } catch (parseError) {
    this.body = responseData.body;
  }
  this.links = parseLinkHeader(this.headers.link);
}

/**
 * Check if there is a next page that you can fetch.
 *
 * @returns {boolean}
 */
MapiResponse.prototype.hasNextPage = function hasNextPage() {
  return !!this.links.next;
};

/**
 * Create a request for the next page, if there is one.
 * If there is no next page, returns `null`.
 *
 * @returns {MapiRequest | null}
 */
MapiResponse.prototype.nextPage = function nextPage() {
  if (!this.hasNextPage()) return null;
  return this.request._extend({
    path: this.links.next.url
  });
};

module.exports = MapiResponse;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/constants.js":
/*!**********************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/constants.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  API_ORIGIN: 'https://api.mapbox.com',
  EVENT_PROGRESS_DOWNLOAD: 'downloadProgress',
  EVENT_PROGRESS_UPLOAD: 'uploadProgress',
  EVENT_ERROR: 'error',
  EVENT_RESPONSE: 'response',
  ERROR_HTTP: 'HttpError',
  ERROR_REQUEST_ABORTED: 'RequestAbortedError'
};


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-headers.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-headers.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function parseSingleHeader(raw) {
  var boundary = raw.indexOf(':');
  var name = raw
    .substring(0, boundary)
    .trim()
    .toLowerCase();
  var value = raw.substring(boundary + 1).trim();
  return {
    name: name,
    value: value
  };
}

/**
 * Parse raw headers into an object with lowercase properties.
 * Does not fully parse headings into more complete data structure,
 * as larger libraries might do. Also does not deal with duplicate
 * headers because Node doesn't seem to deal with those well, so
 * we shouldn't let the browser either, for consistency.
 *
 * @param {string} raw
 * @returns {Object}
 */
function parseHeaders(raw) {
  var headers = {};
  if (!raw) {
    return headers;
  }

  raw
    .trim()
    .split(/[\r|\n]+/)
    .forEach(function(rawHeader) {
      var parsed = parseSingleHeader(rawHeader);
      headers[parsed.name] = parsed.value;
    });

  return headers;
}

module.exports = parseHeaders;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-link-header.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/helpers/parse-link-header.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Like https://github.com/thlorenz/lib/parse-link-header but without any
// additional dependencies.

function parseParam(param) {
  var parts = param.match(/\s*(.+)\s*=\s*"?([^"]+)"?/);
  if (!parts) return null;

  return {
    key: parts[1],
    value: parts[2]
  };
}

function parseLink(link) {
  var parts = link.match(/<?([^>]*)>(.*)/);
  if (!parts) return null;

  var linkUrl = parts[1];
  var linkParams = parts[2].split(';');
  var rel = null;
  var parsedLinkParams = linkParams.reduce(function(result, param) {
    var parsed = parseParam(param);
    if (!parsed) return result;
    if (parsed.key === 'rel') {
      if (!rel) {
        rel = parsed.value;
      }
      return result;
    }
    result[parsed.key] = parsed.value;
    return result;
  }, {});
  if (!rel) return null;

  return {
    url: linkUrl,
    rel: rel,
    params: parsedLinkParams
  };
}

/**
 * Parse a Link header.
 *
 * @param {string} linkHeader
 * @returns {{
 *   [string]: {
 *     url: string,
 *     params: { [string]: string }
 *   }
 * }}
 */
function parseLinkHeader(linkHeader) {
  if (!linkHeader) return {};

  return linkHeader.split(/,\s*</).reduce(function(result, link) {
    var parsed = parseLink(link);
    if (!parsed) return result;
    // rel value can be multiple whitespace-separated rels.
    var splitRel = parsed.rel.split(/\s+/);
    splitRel.forEach(function(rel) {
      if (!result[rel]) {
        result[rel] = {
          url: parsed.url,
          params: parsed.params
        };
      }
    });
    return result;
  }, {});
}

module.exports = parseLinkHeader;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/lib/helpers/url-utils.js":
/*!******************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/lib/helpers/url-utils.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Encode each item of an array individually. The comma
// delimiters should not themselves be encoded.
function encodeArray(arrayValue) {
  return arrayValue.map(encodeURIComponent).join(',');
}

function encodeValue(value) {
  if (Array.isArray(value)) {
    return encodeArray(value);
  }
  return encodeURIComponent(String(value));
}

/**
 * Append a query parameter to a URL.
 *
 * @param {string} url
 * @param {string} key
 * @param {string|number|boolean|Array<*>>} [value] - Provide an array
 *   if the value is a list and commas between values need to be
 *   preserved, unencoded.
 * @returns {string} - Modified URL.
 */
function appendQueryParam(url, key, value) {
  if (value === false || value === null) {
    return url;
  }
  var punctuation = /\?/.test(url) ? '&' : '?';
  var query = encodeURIComponent(key);
  if (value !== undefined && value !== '' && value !== true) {
    query += '=' + encodeValue(value);
  }
  return '' + url + punctuation + query;
}

/**
 * Derive a query string from an object and append it
 * to a URL.
 *
 * @param {string} url
 * @param {Object} [queryObject] - Values should be primitives.
 * @returns {string} - Modified URL.
 */
function appendQueryObject(url, queryObject) {
  if (!queryObject) {
    return url;
  }

  var result = url;
  Object.keys(queryObject).forEach(function(key) {
    var value = queryObject[key];
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value = value
        .filter(function(v) {
          return !!v;
        })
        .join(',');
    }
    result = appendQueryParam(result, key, value);
  });
  return result;
}

/**
 * Prepend an origin to a URL. If the URL already has an
 * origin, do nothing.
 *
 * @param {string} url
 * @param {string} origin
 * @returns {string} - Modified URL.
 */
function prependOrigin(url, origin) {
  if (!origin) {
    return url;
  }

  if (url.slice(0, 4) === 'http') {
    return url;
  }

  var delimiter = url[0] === '/' ? '' : '/';
  return '' + origin.replace(/\/$/, '') + delimiter + url;
}

/**
 * Interpolate values into a route with express-style,
 * colon-prefixed route parameters.
 *
 * @param {string} route
 * @param {Object} [params] - Values should be primitives
 *   or arrays of primitives. Provide an array if the value
 *   is a list and commas between values need to be
 *   preserved, unencoded.
 * @returns {string} - Modified URL.
 */
function interpolateRouteParams(route, params) {
  if (!params) {
    return route;
  }
  return route.replace(/\/:([a-zA-Z0-9]+)/g, function(_, paramId) {
    var value = params[paramId];
    if (value === undefined) {
      throw new Error('Unspecified route parameter ' + paramId);
    }
    var preppedValue = encodeValue(value);
    return '/' + preppedValue;
  });
}

module.exports = {
  appendQueryObject: appendQueryObject,
  appendQueryParam: appendQueryParam,
  prependOrigin: prependOrigin,
  interpolateRouteParams: interpolateRouteParams
};


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/node_modules/eventemitter3/index.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/node_modules/eventemitter3/index.js ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/geocoding.js":
/*!***************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/geocoding.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var xtend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");
var v = __webpack_require__(/*! ./service-helpers/validator */ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/validator.js");
var pick = __webpack_require__(/*! ./service-helpers/pick */ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/pick.js");
var stringifyBooleans = __webpack_require__(/*! ./service-helpers/stringify-booleans */ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/stringify-booleans.js");
var createServiceFactory = __webpack_require__(/*! ./service-helpers/create-service-factory */ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/create-service-factory.js");

/**
 * Geocoding API service.
 *
 * Learn more about this service and its responses in
 * [the HTTP service documentation](https://www.mapbox.com/api-documentation/#geocoding).
 */
var Geocoding = {};

var featureTypes = [
  'country',
  'region',
  'postcode',
  'district',
  'place',
  'locality',
  'neighborhood',
  'address',
  'poi',
  'poi.landmark'
];

/**
 * Search for a place.
 *
 * See the [public documentation](https://www.mapbox.com/api-documentation/#search-for-places).
 *
 * @param {Object} config
 * @param {string} config.query - A place name.
 * @param {'mapbox.places'|'mapbox.places-permanent'} [config.mode="mapbox.places"] - Either `mapbox.places` for ephemeral geocoding, or `mapbox.places-permanent` for storing results and batch geocoding.
 * @param {Array<string>} [config.countries] - Limits results to the specified countries.
 *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
 * @param {Coordinates} [config.proximity] - Bias local results based on a provided location.
 * @param {Array<'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'|'poi'|'poi.landmark'>} [config.types] - Filter results by feature types.
 * @param {boolean} [config.autocomplete=true] - Return autocomplete results or not.
 * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
 * @param {number} [config.limit=5] - Limit the number of results returned.
 * @param {Array<string>} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
 *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
 *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
 * @return {MapiRequest}
 */
Geocoding.forwardGeocode = function(config) {
  v.assertShape({
    query: v.required(v.string),
    mode: v.oneOf('mapbox.places', 'mapbox.places-permanent'),
    countries: v.arrayOf(v.string),
    proximity: v.coordinates,
    types: v.arrayOf(v.oneOf(featureTypes)),
    autocomplete: v.boolean,
    bbox: v.arrayOf(v.number),
    limit: v.number,
    language: v.arrayOf(v.string)
  })(config);

  config.mode = config.mode || 'mapbox.places';

  var query = stringifyBooleans(
    xtend(
      { country: config.countries },
      pick(config, [
        'proximity',
        'types',
        'autocomplete',
        'bbox',
        'limit',
        'language'
      ])
    )
  );

  return this.client.createRequest({
    method: 'GET',
    path: '/geocoding/v5/:mode/:query.json',
    params: pick(config, ['mode', 'query']),
    query: query
  });
};

/**
 * Search for places near coordinates.
 *
 * See the [public documentation](https://www.mapbox.com/api-documentation/#retrieve-places-near-a-location).
 *
 * @param {Object} config
 * @param {Coordinates} config.query - Coordinates at which features will be searched.
 * @param {'mapbox.places'|'mapbox.places-permanent'} [config.mode="mapbox.places"] - Either `mapbox.places` for ephemeral geocoding, or `mapbox.places-permanent` for storing results and batch geocoding.
 * @param {Array<string>} [config.countries] - Limits results to the specified countries.
 *   Each item in the array should be an [ISO 3166 alpha 2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
 * @param {Array<'country'|'region'|'postcode'|'district'|'place'|'locality'|'neighborhood'|'address'|'poi'|'poi.landmark'>} [config.types] - Filter results by feature types.
 * @param {BoundingBox} [config.bbox] - Limit results to a bounding box.
 * @param {number} [config.limit=1] - Limit the number of results returned. If using this option, you must provide a single item for `types`.
 * @param {Array<string>} [config.language] - Specify the language to use for response text and, for forward geocoding, query result weighting.
 *  Options are [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) comprised of a mandatory
 *  [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) and optionally one or more IETF subtags for country or script.
 * @param {'distance'|'score'} [config.reverseMode='distance'] - Set the factors that are used to sort nearby results.
 * @return {MapiRequest}
 */
Geocoding.reverseGeocode = function(config) {
  v.assertShape({
    query: v.required(v.coordinates),
    mode: v.oneOf('mapbox.places', 'mapbox.places-permanent'),
    countries: v.arrayOf(v.string),
    types: v.arrayOf(v.oneOf(featureTypes)),
    bbox: v.arrayOf(v.number),
    limit: v.number,
    language: v.arrayOf(v.string),
    reverseMode: v.oneOf('distance', 'score')
  })(config);

  config.mode = config.mode || 'mapbox.places';

  var query = stringifyBooleans(
    xtend(
      { country: config.countries },
      pick(config, [
        'country',
        'types',
        'bbox',
        'limit',
        'language',
        'reverseMode'
      ])
    )
  );

  return this.client.createRequest({
    method: 'GET',
    path: '/geocoding/v5/:mode/:query.json',
    params: pick(config, ['mode', 'query']),
    query: query
  });
};

module.exports = createServiceFactory(Geocoding);


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/create-service-factory.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/service-helpers/create-service-factory.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var MapiClient = __webpack_require__(/*! ../../lib/classes/mapi-client */ "./node_modules/@mapbox/mapbox-sdk/lib/classes/mapi-client.js");
// This will create the environment-appropriate client.
var createClient = __webpack_require__(/*! ../../lib/client */ "./node_modules/@mapbox/mapbox-sdk/lib/browser/browser-client.js");

function createServiceFactory(ServicePrototype) {
  return function(clientOrConfig) {
    var client;
    if (MapiClient.prototype.isPrototypeOf(clientOrConfig)) {
      client = clientOrConfig;
    } else {
      client = createClient(clientOrConfig);
    }
    var service = Object.create(ServicePrototype);
    service.client = client;
    return service;
  };
}

module.exports = createServiceFactory;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/object-map.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/service-helpers/object-map.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function objectMap(obj, cb) {
  return Object.keys(obj).reduce(function(result, key) {
    result[key] = cb(key, obj[key]);
    return result;
  }, {});
}

module.exports = objectMap;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/pick.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/service-helpers/pick.js ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Create a new object by picking properties off an existing object.
 * The second param can be overloaded as a callback for
 * more fine grained picking of properties.
 * @param {Object} source
 * @param {Array<string>|function(string, Object):boolean} keys
 * @returns {Object}
 */
function pick(source, keys) {
  var filter = function(key, val) {
    return keys.indexOf(key) !== -1 && val !== undefined;
  };

  if (typeof keys === 'function') {
    filter = keys;
  }

  return Object.keys(source)
    .filter(function(key) {
      return filter(key, source[key]);
    })
    .reduce(function(result, key) {
      result[key] = source[key];
      return result;
    }, {});
}

module.exports = pick;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/stringify-booleans.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/service-helpers/stringify-booleans.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var objectMap = __webpack_require__(/*! ./object-map */ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/object-map.js");

/**
 * Stringify all the boolean values in an object, so true becomes "true".
 *
 * @param {Object} obj
 * @returns {Object}
 */
function stringifyBoolean(obj) {
  return objectMap(obj, function(_, value) {
    return typeof value === 'boolean' ? JSON.stringify(value) : value;
  });
}

module.exports = stringifyBoolean;


/***/ }),

/***/ "./node_modules/@mapbox/mapbox-sdk/services/service-helpers/validator.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@mapbox/mapbox-sdk/services/service-helpers/validator.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var xtend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");
var v = __webpack_require__(/*! @mapbox/fusspot */ "./node_modules/@mapbox/fusspot/lib/index.js");

function file(value) {
  // If we're in a browser so Blob is available, the file must be that.
  // In Node, however, it could be a filepath or a pipeable (Readable) stream.
  if (typeof window !== 'undefined') {
    if (value instanceof global.Blob || value instanceof global.ArrayBuffer) {
      return;
    }
    return 'Blob or ArrayBuffer';
  }
  if (typeof value === 'string' || value.pipe !== undefined) {
    return;
  }
  return 'Filename or Readable stream';
}

function assertShape(validatorObj, apiName) {
  return v.assert(v.strictShape(validatorObj), apiName);
}

function date(value) {
  var msg = 'date';
  if (typeof value === 'boolean') {
    return msg;
  }
  try {
    var date = new Date(value);
    if (date.getTime && isNaN(date.getTime())) {
      return msg;
    }
  } catch (e) {
    return msg;
  }
}

function coordinates(value) {
  return v.tuple(v.number, v.number)(value);
}

module.exports = xtend(v, {
  file: file,
  date: date,
  coordinates: coordinates,
  assertShape: assertShape
});

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/@mapbox/parse-mapbox-token/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@mapbox/parse-mapbox-token/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var base64 = __webpack_require__(/*! base-64 */ "./node_modules/base-64/base64.js");

var tokenCache = {};

function parseToken(token) {
  if (tokenCache[token]) {
    return tokenCache[token];
  }

  var parts = token.split('.');
  var usage = parts[0];
  var rawPayload = parts[1];
  if (!rawPayload) {
    throw new Error('Invalid token');
  }

  var parsedPayload = parsePaylod(rawPayload);

  var result = {
    usage: usage,
    user: parsedPayload.u
  };
  if (has(parsedPayload, 'a')) result.authorization = parsedPayload.a;
  if (has(parsedPayload, 'exp')) result.expires = parsedPayload.exp * 1000;
  if (has(parsedPayload, 'iat')) result.created = parsedPayload.iat * 1000;
  if (has(parsedPayload, 'scopes')) result.scopes = parsedPayload.scopes;
  if (has(parsedPayload, 'client')) result.client = parsedPayload.client;
  if (has(parsedPayload, 'll')) result.lastLogin = parsedPayload.ll;
  if (has(parsedPayload, 'iu')) result.impersonator = parsedPayload.iu;

  tokenCache[token] = result;
  return result;
}

function parsePaylod(rawPayload) {
  try {
    return JSON.parse(base64.decode(rawPayload));
  } catch (parseError) {
    throw new Error('Invalid token');
  }
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

module.exports = parseToken;


/***/ }),

/***/ "./node_modules/base-64/base64.js":
/*!****************************************!*\
  !*** ./node_modules/base-64/base64.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports =  true && exports;

	// Detect free variable `module`.
	var freeModule =  true && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var InvalidCharacterError = function(message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function(message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function(input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};

	var base64 = {
		'encode': encode,
		'decode': decode,
		'version': '0.1.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
			return base64;
		}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}	else { var key; }

}(this));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module), __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = $getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    ReflectApply(this.listener, this.target, args);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),

/***/ "./node_modules/fuzzy/lib/fuzzy.js":
/*!*****************************************!*\
  !*** ./node_modules/fuzzy/lib/fuzzy.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*
 * Fuzzy
 * https://github.com/myork/fuzzy
 *
 * Copyright (c) 2012 Matt York
 * Licensed under the MIT license.
 */

(function() {

var root = this;

var fuzzy = {};

// Use in node or in browser
if (true) {
  module.exports = fuzzy;
} else {}

// Return all elements of `array` that have a fuzzy
// match against `pattern`.
fuzzy.simpleFilter = function(pattern, array) {
  return array.filter(function(str) {
    return fuzzy.test(pattern, str);
  });
};

// Does `pattern` fuzzy match `str`?
fuzzy.test = function(pattern, str) {
  return fuzzy.match(pattern, str) !== null;
};

// If `pattern` matches `str`, wrap each matching character
// in `opts.pre` and `opts.post`. If no match, return null
fuzzy.match = function(pattern, str, opts) {
  opts = opts || {};
  var patternIdx = 0
    , result = []
    , len = str.length
    , totalScore = 0
    , currScore = 0
    // prefix
    , pre = opts.pre || ''
    // suffix
    , post = opts.post || ''
    // String to compare against. This might be a lowercase version of the
    // raw string
    , compareString =  opts.caseSensitive && str || str.toLowerCase()
    , ch;

  pattern = opts.caseSensitive && pattern || pattern.toLowerCase();

  // For each character in the string, either add it to the result
  // or wrap in template if it's the next string in the pattern
  for(var idx = 0; idx < len; idx++) {
    ch = str[idx];
    if(compareString[idx] === pattern[patternIdx]) {
      ch = pre + ch + post;
      patternIdx += 1;

      // consecutive characters should increase the score more than linearly
      currScore += 1 + currScore;
    } else {
      currScore = 0;
    }
    totalScore += currScore;
    result[result.length] = ch;
  }

  // return rendered string if we have a match for every char
  if(patternIdx === pattern.length) {
    // if the string is an exact match with pattern, totalScore should be maxed
    totalScore = (compareString === pattern) ? Infinity : totalScore;
    return {rendered: result.join(''), score: totalScore};
  }

  return null;
};

// The normal entry point. Filters `arr` for matches against `pattern`.
// It returns an array with matching values of the type:
//
//     [{
//         string:   '<b>lah' // The rendered string
//       , index:    2        // The index of the element in `arr`
//       , original: 'blah'   // The original element in `arr`
//     }]
//
// `opts` is an optional argument bag. Details:
//
//    opts = {
//        // string to put before a matching character
//        pre:     '<b>'
//
//        // string to put after matching character
//      , post:    '</b>'
//
//        // Optional function. Input is an entry in the given arr`,
//        // output should be the string to test `pattern` against.
//        // In this example, if `arr = [{crying: 'koala'}]` we would return
//        // 'koala'.
//      , extract: function(arg) { return arg.crying; }
//    }
fuzzy.filter = function(pattern, arr, opts) {
  if(!arr || arr.length === 0) {
    return [];
  }
  if (typeof pattern !== 'string') {
    return arr;
  }
  opts = opts || {};
  return arr
    .reduce(function(prev, element, idx, arr) {
      var str = element;
      if(opts.extract) {
        str = opts.extract(element);
      }
      var rendered = fuzzy.match(pattern, str, opts);
      if(rendered != null) {
        prev[prev.length] = {
            string: rendered.rendered
          , score: rendered.score
          , index: idx
          , original: element
        };
      }
      return prev;
    }, [])

    // Sort by score. Browsers are inconsistent wrt stable/unstable
    // sorting, so force stable by using the index in the case of tie.
    // See http://ofb.net/~sethml/is-sort-stable.html
    .sort(function(a,b) {
      var compare = b.score - a.score;
      if(compare) return compare;
      return a.index - b.index;
    });
};


}());



/***/ }),

/***/ "./node_modules/is-plain-obj/index.js":
/*!********************************************!*\
  !*** ./node_modules/is-plain-obj/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};


/***/ }),

/***/ "./node_modules/jquery/dist/jquery.js":
/*!********************************************!*\
  !*** ./node_modules/jquery/dist/jquery.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * jQuery JavaScript Library v3.4.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2019-05-01T21:04Z
 */
( function( global, factory ) {

	"use strict";

	if (  true && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      return typeof obj === "function" && typeof obj.nodeType !== "number";
  };


var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};




	var preservedScriptAttributes = {
		type: true,
		src: true,
		nonce: true,
		noModule: true
	};

	function DOMEval( code, node, doc ) {
		doc = doc || document;

		var i, val,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {

				// Support: Firefox 64+, Edge 18+
				// Some browsers don't support the "nonce" property on scripts.
				// On the other hand, just using `getAttribute` is not enough as
				// the `nonce` attribute is reset to an empty string whenever it
				// becomes browsing-context connected.
				// See https://github.com/whatwg/html/issues/2369
				// See https://html.spec.whatwg.org/#nonce-attributes
				// The `node.getAttribute` check was added for the sake of
				// `jQuery.globalEval` so that it can fake a nonce-containing node
				// via an object.
				val = node[ i ] || node.getAttribute && node.getAttribute( i );
				if ( val ) {
					script.setAttribute( i, val );
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.4.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				copy = options[ name ];

				// Prevent Object.prototype pollution
				// Prevent never-ending loop
				if ( name === "__proto__" || target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {
					src = target[ name ];

					// Ensure proper type for the source value
					if ( copyIsArray && !Array.isArray( src ) ) {
						clone = [];
					} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {
						clone = {};
					} else {
						clone = src;
					}
					copyIsArray = false;

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// Evaluates a script in a global context
	globalEval: function( code, options ) {
		DOMEval( code, { nonce: options && options.nonce } );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.4
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://js.foundation/
 *
 * Date: 2019-04-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	nonnativeSelectorCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
	rdescend = new RegExp( whitespace + "|>" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rhtml = /HTML$/i,
	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	inDisabledFieldset = addCombinator(
		function( elem ) {
			return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!nonnativeSelectorCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) &&

				// Support: IE 8 only
				// Exclude object elements
				(nodeType !== 1 || context.nodeName.toLowerCase() !== "object") ) {

				newSelector = selector;
				newContext = context;

				// qSA considers elements outside a scoping root when evaluating child or
				// descendant combinators, which is not what we want.
				// In such cases, we work around the behavior by prefixing every selector in the
				// list with an ID selector referencing the scope context.
				// Thanks to Andrew Dupont for this technique.
				if ( nodeType === 1 && rdescend.test( selector ) ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch ( qsaError ) {
					nonnativeSelectorCache( selector, true );
				} finally {
					if ( nid === expando ) {
						context.removeAttribute( "id" );
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						inDisabledFieldset( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	var namespace = elem.namespaceURI,
		docElem = (elem.ownerDocument || elem).documentElement;

	// Support: IE <=8
	// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
	// https://bugs.jquery.com/ticket/4833
	return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	if ( support.matchesSelector && documentIsHTML &&
		!nonnativeSelectorCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {
			nonnativeSelectorCache( expr, true );
		}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ?
				argument + length :
				argument > length ?
					length :
					argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

};
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
		if ( typeof elem.contentDocument !== "undefined" ) {
			return elem.contentDocument;
		}

		// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
		// Treat the template element as a regular one in browsers that
		// don't support it.
		if ( nodeName( elem, "template" ) ) {
			elem = elem.content || elem;
		}

		return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var documentElement = document.documentElement;



	var isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem );
		},
		composed = { composed: true };

	// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
	// Check attachment across shadow DOM boundaries when possible (gh-3504)
	// Support: iOS 10.0-10.2 only
	// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
	// leading to errors. We need to check for `getRootNode`.
	if ( documentElement.getRootNode ) {
		isAttached = function( elem ) {
			return jQuery.contains( elem.ownerDocument, elem ) ||
				elem.getRootNode( composed ) === elem.ownerDocument;
		};
	}
var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			isAttached( elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = elem.nodeType &&
			( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, attached, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( toType( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		attached = isAttached( elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( attached ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 - 11+
// focus() and blur() are asynchronous, except when they are no-op.
// So expect focus to be synchronous when the element is already active,
// and blur to be synchronous when the element is not already active.
// (focus and blur are always synchronous in other supported browsers,
// this just defines when we can count on it).
function expectSync( elem, type ) {
	return ( elem === safeActiveElement() ) === ( type === "focus" );
}

// Support: IE <=9 only
// Accessing document.activeElement can throw unexpectedly
// https://bugs.jquery.com/ticket/13393
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// If the event is namespaced, then each handler is only invoked if it is
				// specially universal or its namespaces are a superset of the event's.
				if ( !event.rnamespace || handleObj.namespace === false ||
					event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		click: {

			// Utilize native event to ensure correct state for checkable inputs
			setup: function( data ) {

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Claim the first handler
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					// dataPriv.set( el, "click", ... )
					leverageNative( el, "click", returnTrue );
				}

				// Return false to allow normal processing in the caller
				return false;
			},
			trigger: function( data ) {

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Force setup before triggering a click
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					leverageNative( el, "click" );
				}

				// Return non-false to allow normal event-path propagation
				return true;
			},

			// For cross-browser consistency, suppress native .click() on links
			// Also prevent it if we're currently inside a leveraged native-event stack
			_default: function( event ) {
				var target = event.target;
				return rcheckableType.test( target.type ) &&
					target.click && nodeName( target, "input" ) &&
					dataPriv.get( target, "click" ) ||
					nodeName( target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
function leverageNative( el, type, expectSync ) {

	// Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
	if ( !expectSync ) {
		if ( dataPriv.get( el, type ) === undefined ) {
			jQuery.event.add( el, type, returnTrue );
		}
		return;
	}

	// Register the controller as a special universal handler for all event namespaces
	dataPriv.set( el, type, false );
	jQuery.event.add( el, type, {
		namespace: false,
		handler: function( event ) {
			var notAsync, result,
				saved = dataPriv.get( this, type );

			if ( ( event.isTrigger & 1 ) && this[ type ] ) {

				// Interrupt processing of the outer synthetic .trigger()ed event
				// Saved data should be false in such cases, but might be a leftover capture object
				// from an async native handler (gh-4350)
				if ( !saved.length ) {

					// Store arguments for use when handling the inner native event
					// There will always be at least one argument (an event object), so this array
					// will not be confused with a leftover capture object.
					saved = slice.call( arguments );
					dataPriv.set( this, type, saved );

					// Trigger the native event and capture its result
					// Support: IE <=9 - 11+
					// focus() and blur() are asynchronous
					notAsync = expectSync( this, type );
					this[ type ]();
					result = dataPriv.get( this, type );
					if ( saved !== result || notAsync ) {
						dataPriv.set( this, type, false );
					} else {
						result = {};
					}
					if ( saved !== result ) {

						// Cancel the outer synthetic event
						event.stopImmediatePropagation();
						event.preventDefault();
						return result.value;
					}

				// If this is an inner synthetic event for an event with a bubbling surrogate
				// (focus or blur), assume that the surrogate already propagated from triggering the
				// native event and prevent that from happening again here.
				// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
				// bubbling surrogate propagates *after* the non-bubbling base), but that seems
				// less bad than duplication.
				} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
					event.stopPropagation();
				}

			// If this is a native event triggered above, everything is now in order
			// Fire an inner synthetic event with the original arguments
			} else if ( saved.length ) {

				// ...and capture the result
				dataPriv.set( this, type, {
					value: jQuery.event.trigger(

						// Support: IE <=9 - 11+
						// Extend with the prototype to reset the above stopImmediatePropagation()
						jQuery.extend( saved[ 0 ], jQuery.Event.prototype ),
						saved.slice( 1 ),
						this
					)
				} );

				// Abort handling of the native event
				event.stopImmediatePropagation();
			}
		}
	} );
}

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	code: true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

jQuery.each( { focus: "focusin", blur: "focusout" }, function( type, delegateType ) {
	jQuery.event.special[ type ] = {

		// Utilize native event if possible so blur/focus sequence is correct
		setup: function() {

			// Claim the first handler
			// dataPriv.set( this, "focus", ... )
			// dataPriv.set( this, "blur", ... )
			leverageNative( this, type, expectSync );

			// Return false to allow normal processing in the caller
			return false;
		},
		trigger: function() {

			// Force setup before trigger
			leverageNative( this, type );

			// Return non-false to allow normal event-path propagation
			return true;
		},

		delegateType: delegateType
	};
} );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( valueIsFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl && !node.noModule ) {
								jQuery._evalUrl( node.src, {
									nonce: node.nonce || node.getAttribute( "nonce" )
								} );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && isAttached( node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = isAttached( elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		// Support: Chrome <=64
		// Don't get tricked when zoom affects offsetWidth (gh-4029)
		div.style.position = "absolute";
		scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function() {
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function() {
			computeStyleTests();
			return scrollboxSizeVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !isAttached( elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style,
	vendorProps = {};

// Return a vendor-prefixed property or undefined
function vendorPropName( name ) {

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a potentially-mapped jQuery.cssProps or vendor prefixed property
function finalPropName( name ) {
	var final = jQuery.cssProps[ name ] || vendorProps[ name ];

	if ( final ) {
		return final;
	}
	if ( name in emptyStyle ) {
		return name;
	}
	return vendorProps[ name ] = vendorPropName( name ) || name;
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	};

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {
		return 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin
		if ( box === "margin" ) {
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {

			// For "content", subtract padding
			if ( box === "content" ) {
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5

		// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
		// Use an explicit zero to avoid NaN (gh-3964)
		) ) || 0;
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {

	// Start with computed style
	var styles = getStyles( elem ),

		// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
		// Fake content-box until we know it's needed to know the true value.
		boxSizingNeeded = !support.boxSizingReliable() || extra,
		isBorderBox = boxSizingNeeded &&
			jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox,

		val = curCSS( elem, dimension, styles ),
		offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {
		if ( !extra ) {
			return val;
		}
		val = "auto";
	}


	// Fall back to offsetWidth/offsetHeight when value is "auto"
	// This happens for inline elements with no explicit setting (gh-3571)
	// Support: Android <=4.1 - 4.3 only
	// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
	// Support: IE 9-11 only
	// Also use offsetWidth/offsetHeight for when box sizing is unreliable
	// We use getClientRects() to check for hidden/disconnected.
	// In those cases, the computed value can be trusted to be border-box
	if ( ( !support.boxSizingReliable() && isBorderBox ||
		val === "auto" ||
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&
		elem.getClientRects().length ) {

		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

		// Where available, offsetWidth/offsetHeight approximate border box dimensions.
		// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
		// retrieved value as a content box dimension.
		valueIsBorderBox = offsetProp in elem;
		if ( valueIsBorderBox ) {
			val = elem[ offsetProp ];
		}
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"gridArea": true,
		"gridColumn": true,
		"gridColumnEnd": true,
		"gridColumnStart": true,
		"gridRow": true,
		"gridRowEnd": true,
		"gridRowStart": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
			// "px" to a few hardcoded values.
			if ( type === "number" && !isCustomProp ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, dimension ) {
	jQuery.cssHooks[ dimension ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = getStyles( elem ),

				// Only read styles.position if the test has a chance to fail
				// to avoid forcing a reflow.
				scrollboxSizeBuggy = !support.scrollboxSize() &&
					styles.position === "absolute",

				// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
				boxSizingNeeded = scrollboxSizeBuggy || extra,
				isBorderBox = boxSizingNeeded &&
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra ?
					boxModelAdjustment(
						elem,
						dimension,
						extra,
						isBorderBox,
						styles
					) :
					0;

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && scrollboxSizeBuggy ) {
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 && (
					jQuery.cssHooks[ tween.prop ] ||
					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( isValidValue ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = Date.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	if ( a == null ) {
		return "";
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
									( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
										.concat( match[ 2 ] );
							}
						}
						match = responseHeaders[ key.toLowerCase() + " " ];
					}
					return match == null ? null : match.join( ", " );
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url, options ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,

		// Only evaluate the response if it is successful (gh-4126)
		// dataFilter is not invoked for failure responses, so using it instead
		// of the default converter is kludgy but it works.
		converters: {
			"text script": function() {}
		},
		dataFilter: function( response ) {
			jQuery.globalEval( response, options );
		}
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var htmlIsFunction = isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain or forced-by-attrs requests
	if ( s.crossDomain || s.scriptAttrs ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" )
					.attr( s.scriptAttrs || {} )
					.prop( { charset: s.scriptCharset, src: s.url } )
					.on( "load error", callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					} );

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function( obj ) {

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( true ) {
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function() {
		return jQuery;
	}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );


/***/ }),

/***/ "./node_modules/lodash.debounce/index.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash.debounce/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = debounce;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/mapbox-gl/dist/mapbox-gl.js":
/*!**************************************************!*\
  !*** ./node_modules/mapbox-gl/dist/mapbox-gl.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* Mapbox GL JS is licensed under the 3-Clause BSD License. Full text of license: https://github.com/mapbox/mapbox-gl-js/blob/v1.5.0/LICENSE.txt */
(function (global, factory) {
 true ? module.exports = factory() :
undefined;
}(this, function () { 'use strict';

/* eslint-disable */

var shared, worker, mapboxgl;
// define gets called three times: one for each chunk. we rely on the order
// they're imported to know which is which
function define(_, chunk) {
if (!shared) {
    shared = chunk;
} else if (!worker) {
    worker = chunk;
} else {
    var workerBundleString = 'var sharedChunk = {}; (' + shared + ')(sharedChunk); (' + worker + ')(sharedChunk);'

    var sharedChunk = {};
    shared(sharedChunk);
    mapboxgl = chunk(sharedChunk);
    mapboxgl.workerUrl = window.URL.createObjectURL(new Blob([workerBundleString], { type: 'text/javascript' }));
}
}


define(["exports"],(function(t){"use strict";function e(t,e){return t(e={exports:{}},e.exports),e.exports}var r=n;function n(t,e,r,n){this.cx=3*t,this.bx=3*(r-t)-this.cx,this.ax=1-this.cx-this.bx,this.cy=3*e,this.by=3*(n-e)-this.cy,this.ay=1-this.cy-this.by,this.p1x=t,this.p1y=n,this.p2x=r,this.p2y=n;}n.prototype.sampleCurveX=function(t){return ((this.ax*t+this.bx)*t+this.cx)*t},n.prototype.sampleCurveY=function(t){return ((this.ay*t+this.by)*t+this.cy)*t},n.prototype.sampleCurveDerivativeX=function(t){return (3*this.ax*t+2*this.bx)*t+this.cx},n.prototype.solveCurveX=function(t,e){var r,n,i,a,o;for(void 0===e&&(e=1e-6),i=t,o=0;o<8;o++){if(a=this.sampleCurveX(i)-t,Math.abs(a)<e)return i;var s=this.sampleCurveDerivativeX(i);if(Math.abs(s)<1e-6)break;i-=a/s;}if((i=t)<(r=0))return r;if(i>(n=1))return n;for(;r<n;){if(a=this.sampleCurveX(i),Math.abs(a-t)<e)return i;t>a?r=i:n=i,i=.5*(n-r)+r;}return i},n.prototype.solve=function(t,e){return this.sampleCurveY(this.solveCurveX(t,e))};var i=a;function a(t,e){this.x=t,this.y=e;}function o(t,e){if(Array.isArray(t)){if(!Array.isArray(e)||t.length!==e.length)return !1;for(var r=0;r<t.length;r++)if(!o(t[r],e[r]))return !1;return !0}if("object"==typeof t&&null!==t&&null!==e){if("object"!=typeof e)return !1;if(Object.keys(t).length!==Object.keys(e).length)return !1;for(var n in t)if(!o(t[n],e[n]))return !1;return !0}return t===e}function s(t,e,n,i){var a=new r(t,e,n,i);return function(t){return a.solve(t)}}a.prototype={clone:function(){return new a(this.x,this.y)},add:function(t){return this.clone()._add(t)},sub:function(t){return this.clone()._sub(t)},multByPoint:function(t){return this.clone()._multByPoint(t)},divByPoint:function(t){return this.clone()._divByPoint(t)},mult:function(t){return this.clone()._mult(t)},div:function(t){return this.clone()._div(t)},rotate:function(t){return this.clone()._rotate(t)},rotateAround:function(t,e){return this.clone()._rotateAround(t,e)},matMult:function(t){return this.clone()._matMult(t)},unit:function(){return this.clone()._unit()},perp:function(){return this.clone()._perp()},round:function(){return this.clone()._round()},mag:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},equals:function(t){return this.x===t.x&&this.y===t.y},dist:function(t){return Math.sqrt(this.distSqr(t))},distSqr:function(t){var e=t.x-this.x,r=t.y-this.y;return e*e+r*r},angle:function(){return Math.atan2(this.y,this.x)},angleTo:function(t){return Math.atan2(this.y-t.y,this.x-t.x)},angleWith:function(t){return this.angleWithSep(t.x,t.y)},angleWithSep:function(t,e){return Math.atan2(this.x*e-this.y*t,this.x*t+this.y*e)},_matMult:function(t){var e=t[0]*this.x+t[1]*this.y,r=t[2]*this.x+t[3]*this.y;return this.x=e,this.y=r,this},_add:function(t){return this.x+=t.x,this.y+=t.y,this},_sub:function(t){return this.x-=t.x,this.y-=t.y,this},_mult:function(t){return this.x*=t,this.y*=t,this},_div:function(t){return this.x/=t,this.y/=t,this},_multByPoint:function(t){return this.x*=t.x,this.y*=t.y,this},_divByPoint:function(t){return this.x/=t.x,this.y/=t.y,this},_unit:function(){return this._div(this.mag()),this},_perp:function(){var t=this.y;return this.y=this.x,this.x=-t,this},_rotate:function(t){var e=Math.cos(t),r=Math.sin(t),n=e*this.x-r*this.y,i=r*this.x+e*this.y;return this.x=n,this.y=i,this},_rotateAround:function(t,e){var r=Math.cos(t),n=Math.sin(t),i=e.x+r*(this.x-e.x)-n*(this.y-e.y),a=e.y+n*(this.x-e.x)+r*(this.y-e.y);return this.x=i,this.y=a,this},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}},a.convert=function(t){return t instanceof a?t:Array.isArray(t)?new a(t[0],t[1]):t};var u=s(.25,.1,.25,1);function l(t,e,r){return Math.min(r,Math.max(e,t))}function p(t,e,r){var n=r-e,i=((t-e)%n+n)%n+e;return i===e?r:i}function c(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var n=0,i=e;n<i.length;n+=1){var a=i[n];for(var o in a)t[o]=a[o];}return t}var h=1;function f(){return h++}function y(){return function t(e){return e?(e^16*Math.random()>>e/4).toString(16):([1e7]+-[1e3]+-4e3+-8e3+-1e11).replace(/[018]/g,t)}()}function d(t){return !!t&&/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)}function m(t,e){t.forEach((function(t){e[t]&&(e[t]=e[t].bind(e));}));}function v(t,e){return -1!==t.indexOf(e,t.length-e.length)}function g(t,e,r){var n={};for(var i in t)n[i]=e.call(r||this,t[i],i,t);return n}function x(t,e,r){var n={};for(var i in t)e.call(r||this,t[i],i,t)&&(n[i]=t[i]);return n}function b(t){return Array.isArray(t)?t.map(b):"object"==typeof t&&t?g(t,b):t}var _={};function w(t){_[t]||("undefined"!=typeof console&&console.warn(t),_[t]=!0);}function A(t,e,r){return (r.y-t.y)*(e.x-t.x)>(e.y-t.y)*(r.x-t.x)}function k(t){for(var e=0,r=0,n=t.length,i=n-1,a=void 0,o=void 0;r<n;i=r++)a=t[r],e+=((o=t[i]).x-a.x)*(a.y+o.y);return e}function S(t){var e={};if(t.replace(/(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g,(function(t,r,n,i){var a=n||i;return e[r]=!a||a.toLowerCase(),""})),e["max-age"]){var r=parseInt(e["max-age"],10);isNaN(r)?delete e["max-age"]:e["max-age"]=r;}return e}function I(t){try{var e=self[t];return e.setItem("_mapbox_test_",1),e.removeItem("_mapbox_test_"),!0}catch(t){return !1}}var z,C,B,P,E=self.performance&&self.performance.now?self.performance.now.bind(self.performance):Date.now.bind(Date),M=self.requestAnimationFrame||self.mozRequestAnimationFrame||self.webkitRequestAnimationFrame||self.msRequestAnimationFrame,T=self.cancelAnimationFrame||self.mozCancelAnimationFrame||self.webkitCancelAnimationFrame||self.msCancelAnimationFrame,V={now:E,frame:function(t){var e=M(t);return {cancel:function(){return T(e)}}},getImageData:function(t,e){void 0===e&&(e=0);var r=self.document.createElement("canvas"),n=r.getContext("2d");if(!n)throw new Error("failed to create canvas 2d context");return r.width=t.width,r.height=t.height,n.drawImage(t,0,0,t.width,t.height),n.getImageData(-e,-e,t.width+2*e,t.height+2*e)},resolveURL:function(t){return z||(z=self.document.createElement("a")),z.href=t,z.href},hardwareConcurrency:self.navigator.hardwareConcurrency||4,get devicePixelRatio(){return self.devicePixelRatio},get prefersReducedMotion(){return !!self.matchMedia&&(null==C&&(C=self.matchMedia("(prefers-reduced-motion: reduce)")),C.matches)}},F={API_URL:"https://api.mapbox.com",get EVENTS_URL(){return this.API_URL?0===this.API_URL.indexOf("https://api.mapbox.cn")?"https://events.mapbox.cn/events/v2":0===this.API_URL.indexOf("https://api.mapbox.com")?"https://events.mapbox.com/events/v2":null:null},FEEDBACK_URL:"https://apps.mapbox.com/feedback",REQUIRE_ACCESS_TOKEN:!0,ACCESS_TOKEN:null,MAX_PARALLEL_IMAGE_REQUESTS:16},O={supported:!1,testSupport:function(t){if(L||!P)return;D?U(t):B=t;}},L=!1,D=!1;function U(t){var e=t.createTexture();t.bindTexture(t.TEXTURE_2D,e);try{if(t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,P),t.isContextLost())return;O.supported=!0;}catch(t){}t.deleteTexture(e),L=!0;}self.document&&((P=self.document.createElement("img")).onload=function(){B&&U(B),B=null,D=!0;},P.onerror=function(){L=!0,B=null;},P.src="data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA=");var R="01";var j=function(t,e){this._transformRequestFn=t,this._customAccessToken=e,this._createSkuToken();};function q(t){return 0===t.indexOf("mapbox:")}j.prototype._createSkuToken=function(){var t=function(){for(var t="",e=0;e<10;e++)t+="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(62*Math.random())];return {token:["1",R,t].join(""),tokenExpiresAt:Date.now()+432e5}}();this._skuToken=t.token,this._skuTokenExpiresAt=t.tokenExpiresAt;},j.prototype._isSkuTokenExpired=function(){return Date.now()>this._skuTokenExpiresAt},j.prototype.transformRequest=function(t,e){return this._transformRequestFn&&this._transformRequestFn(t,e)||{url:t}},j.prototype.normalizeStyleURL=function(t,e){if(!q(t))return t;var r=Z(t);return r.path="/styles/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},j.prototype.normalizeGlyphsURL=function(t,e){if(!q(t))return t;var r=Z(t);return r.path="/fonts/v1"+r.path,this._makeAPIURL(r,this._customAccessToken||e)},j.prototype.normalizeSourceURL=function(t,e){if(!q(t))return t;var r=Z(t);return r.path="/v4/"+r.authority+".json",r.params.push("secure"),this._makeAPIURL(r,this._customAccessToken||e)},j.prototype.normalizeSpriteURL=function(t,e,r,n){var i=Z(t);return q(t)?(i.path="/styles/v1"+i.path+"/sprite"+e+r,this._makeAPIURL(i,this._customAccessToken||n)):(i.path+=""+e+r,G(i))},j.prototype.normalizeTileURL=function(t,e,r){if(this._isSkuTokenExpired()&&this._createSkuToken(),!e||!q(e))return t;var n=Z(t),i=V.devicePixelRatio>=2||512===r?"@2x":"",a=O.supported?".webp":"$1";return n.path=n.path.replace(/(\.(png|jpg)\d*)(?=$)/,""+i+a),n.path=n.path.replace(/^.+\/v4\//,"/"),n.path="/v4"+n.path,F.REQUIRE_ACCESS_TOKEN&&(F.ACCESS_TOKEN||this._customAccessToken)&&this._skuToken&&n.params.push("sku="+this._skuToken),this._makeAPIURL(n,this._customAccessToken)},j.prototype.canonicalizeTileURL=function(t){var e=Z(t);if(!e.path.match(/(^\/v4\/)/)||!e.path.match(/\.[\w]+$/))return t;var r="mapbox://tiles/";r+=e.path.replace("/v4/","");var n=e.params.filter((function(t){return !t.match(/^access_token=/)}));return n.length&&(r+="?"+n.join("&")),r},j.prototype.canonicalizeTileset=function(t,e){if(!q(e))return t.tiles||[];for(var r=[],n=0,i=t.tiles;n<i.length;n+=1){var a=i[n],o=this.canonicalizeTileURL(a);r.push(o);}return r},j.prototype._makeAPIURL=function(t,e){var r="See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes",n=Z(F.API_URL);if(t.protocol=n.protocol,t.authority=n.authority,"/"!==n.path&&(t.path=""+n.path+t.path),!F.REQUIRE_ACCESS_TOKEN)return G(t);if(!(e=e||F.ACCESS_TOKEN))throw new Error("An API access token is required to use Mapbox GL. "+r);if("s"===e[0])throw new Error("Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*). "+r);return t.params=t.params.filter((function(t){return -1===t.indexOf("access_token")})),t.params.push("access_token="+e),G(t)};var N=/^((https?:)?\/\/)?([^\/]+\.)?mapbox\.c(n|om)(\/|\?|$)/i;function K(t){return N.test(t)}var X=/^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;function Z(t){var e=t.match(X);if(!e)throw new Error("Unable to parse URL object");return {protocol:e[1],authority:e[2],path:e[3]||"/",params:e[4]?e[4].split("&"):[]}}function G(t){var e=t.params.length?"?"+t.params.join("&"):"";return t.protocol+"://"+t.authority+t.path+e}function J(t){if(!t)return null;var e,r=t.split(".");if(!r||3!==r.length)return null;try{return JSON.parse((e=r[1],decodeURIComponent(self.atob(e).split("").map((function(t){return "%"+("00"+t.charCodeAt(0).toString(16)).slice(-2)})).join(""))))}catch(t){return null}}var H=function(t){this.type=t,this.anonId=null,this.eventData={},this.queue=[],this.pendingRequest=null;};H.prototype.getStorageKey=function(t){var e,r=J(F.ACCESS_TOKEN),n="";return r&&r.u?(e=r.u,n=self.btoa(encodeURIComponent(e).replace(/%([0-9A-F]{2})/g,(function(t,e){return String.fromCharCode(Number("0x"+e))})))):n=F.ACCESS_TOKEN||"",t?"mapbox.eventData."+t+":"+n:"mapbox.eventData:"+n},H.prototype.fetchEventData=function(){var t=I("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{var n=self.localStorage.getItem(e);n&&(this.eventData=JSON.parse(n));var i=self.localStorage.getItem(r);i&&(this.anonId=i);}catch(t){w("Unable to read from LocalStorage");}},H.prototype.saveEventData=function(){var t=I("localStorage"),e=this.getStorageKey(),r=this.getStorageKey("uuid");if(t)try{self.localStorage.setItem(r,this.anonId),Object.keys(this.eventData).length>=1&&self.localStorage.setItem(e,JSON.stringify(this.eventData));}catch(t){w("Unable to write to LocalStorage");}},H.prototype.processRequests=function(t){},H.prototype.postEvent=function(t,e,r,n){var i=this;if(F.EVENTS_URL){var a=Z(F.EVENTS_URL);a.params.push("access_token="+(n||F.ACCESS_TOKEN||""));var o={event:this.type,created:new Date(t).toISOString(),sdkIdentifier:"mapbox-gl-js",sdkVersion:"1.5.0",skuId:R,userId:this.anonId},s=e?c(o,e):o,u={url:G(a),headers:{"Content-Type":"text/plain"},body:JSON.stringify([s])};this.pendingRequest=vt(u,(function(t){i.pendingRequest=null,r(t),i.saveEventData(),i.processRequests(n);}));}},H.prototype.queueRequest=function(t,e){this.queue.push(t),this.processRequests(e);};var Y,$=function(t){function e(){t.call(this,"map.load"),this.success={},this.skuToken="";}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.postMapLoadEvent=function(t,e,r,n){this.skuToken=r,(F.EVENTS_URL&&n||F.ACCESS_TOKEN&&Array.isArray(t)&&t.some((function(t){return q(t)||K(t)})))&&this.queueRequest({id:e,timestamp:Date.now()},n);},e.prototype.processRequests=function(t){var e=this;if(!this.pendingRequest&&0!==this.queue.length){var r=this.queue.shift(),n=r.id,i=r.timestamp;n&&this.success[n]||(this.anonId||this.fetchEventData(),d(this.anonId)||(this.anonId=y()),this.postEvent(i,{skuToken:this.skuToken},(function(t){t||n&&(e.success[n]=!0);}),t));}},e}(H),W=new(function(t){function e(e){t.call(this,"appUserTurnstile"),this._customAccessToken=e;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.postTurnstileEvent=function(t,e){F.EVENTS_URL&&F.ACCESS_TOKEN&&Array.isArray(t)&&t.some((function(t){return q(t)||K(t)}))&&this.queueRequest(Date.now(),e);},e.prototype.processRequests=function(t){var e=this;if(!this.pendingRequest&&0!==this.queue.length){this.anonId&&this.eventData.lastSuccess&&this.eventData.tokenU||this.fetchEventData();var r=J(F.ACCESS_TOKEN),n=r?r.u:F.ACCESS_TOKEN,i=n!==this.eventData.tokenU;d(this.anonId)||(this.anonId=y(),i=!0);var a=this.queue.shift();if(this.eventData.lastSuccess){var o=new Date(this.eventData.lastSuccess),s=new Date(a),u=(a-this.eventData.lastSuccess)/864e5;i=i||u>=1||u<-1||o.getDate()!==s.getDate();}else i=!0;if(!i)return this.processRequests();this.postEvent(a,{"enabled.telemetry":!1},(function(t){t||(e.eventData.lastSuccess=a,e.eventData.tokenU=n);}),t);}},e}(H)),Q=W.postTurnstileEvent.bind(W),tt=new $,et=tt.postMapLoadEvent.bind(tt),rt="mapbox-tiles",nt=500,it=50,at=42e4;function ot(t,e,r){if(self.caches){var n={status:e.status,statusText:e.statusText,headers:new self.Headers};e.headers.forEach((function(t,e){return n.headers.set(e,t)}));var i=S(e.headers.get("Cache-Control")||"");if(!i["no-store"])i["max-age"]&&n.headers.set("Expires",new Date(r+1e3*i["max-age"]).toUTCString()),new Date(n.headers.get("Expires")).getTime()-r<at||function(t,e){if(void 0===Y)try{new Response(new ReadableStream),Y=!0;}catch(t){Y=!1;}Y?e(t.body):t.blob().then(e);}(e,(function(e){var r=new self.Response(e,n);self.caches.open(rt).then((function(e){return e.put(st(t.url),r)})).catch((function(t){return w(t.message)}));}));}}function st(t){var e=t.indexOf("?");return e<0?t:t.slice(0,e)}function ut(t,e){if(!self.caches)return e(null);var r=st(t.url);self.caches.open(rt).then((function(t){t.match(r).then((function(n){var i=function(t){if(!t)return !1;var e=new Date(t.headers.get("Expires")),r=S(t.headers.get("Cache-Control")||"");return e>Date.now()&&!r["no-cache"]}(n);t.delete(r),i&&t.put(r,n.clone()),e(null,n,i);})).catch(e);})).catch(e);}var lt=1/0;var pt={Unknown:"Unknown",Style:"Style",Source:"Source",Tile:"Tile",Glyphs:"Glyphs",SpriteImage:"SpriteImage",SpriteJSON:"SpriteJSON",Image:"Image"};"function"==typeof Object.freeze&&Object.freeze(pt);var ct=function(t){function e(e,r,n){401===r&&K(n)&&(e+=": you may have provided an invalid Mapbox access token. See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes"),t.call(this,e),this.status=r,this.url=n,this.name=this.constructor.name,this.message=e;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.toString=function(){return this.name+": "+this.message+" ("+this.status+"): "+this.url},e}(Error);function ht(){return "undefined"!=typeof WorkerGlobalScope&&"undefined"!=typeof self&&self instanceof WorkerGlobalScope}var ft=ht()?function(){return self.worker&&self.worker.referrer}:function(){return ("blob:"===self.location.protocol?self.parent:self).location.href};function yt(t,e){var r,n=new self.AbortController,i=new self.Request(t.url,{method:t.method||"GET",body:t.body,credentials:t.credentials,headers:t.headers,referrer:ft(),signal:n.signal}),a=!1,o=!1,s=(r=i.url).indexOf("sku=")>0&&K(r);"json"===t.type&&i.headers.set("Accept","application/json");var u=function(r,n,a){if(!o){if(r&&"SecurityError"!==r.message&&w(r),n&&a)return l(n);var u=Date.now();self.fetch(i).then((function(r){if(r.ok){var n=s?r.clone():null;return l(r,n,u)}return e(new ct(r.statusText,r.status,t.url))})).catch((function(t){20!==t.code&&e(new Error(t.message));}));}},l=function(r,n,s){("arrayBuffer"===t.type?r.arrayBuffer():"json"===t.type?r.json():r.text()).then((function(t){o||(n&&s&&ot(i,n,s),a=!0,e(null,t,r.headers.get("Cache-Control"),r.headers.get("Expires")));})).catch((function(t){return e(new Error(t.message))}));};return s?ut(i,u):u(null,null),{cancel:function(){o=!0,a||n.abort();}}}var dt=function(t,e){if(r=t.url,!(/^file:/.test(r)||/^file:/.test(ft())&&!/^\w+:/.test(r))){if(self.fetch&&self.Request&&self.AbortController&&self.Request.prototype.hasOwnProperty("signal"))return yt(t,e);if(ht()&&self.worker&&self.worker.actor)return self.worker.actor.send("getResource",t,e)}var r;return function(t,e){var r=new self.XMLHttpRequest;for(var n in r.open(t.method||"GET",t.url,!0),"arrayBuffer"===t.type&&(r.responseType="arraybuffer"),t.headers)r.setRequestHeader(n,t.headers[n]);return "json"===t.type&&(r.responseType="text",r.setRequestHeader("Accept","application/json")),r.withCredentials="include"===t.credentials,r.onerror=function(){e(new Error(r.statusText));},r.onload=function(){if((r.status>=200&&r.status<300||0===r.status)&&null!==r.response){var n=r.response;if("json"===t.type)try{n=JSON.parse(r.response);}catch(t){return e(t)}e(null,n,r.getResponseHeader("Cache-Control"),r.getResponseHeader("Expires"));}else e(new ct(r.statusText,r.status,t.url));},r.send(t.body),{cancel:function(){return r.abort()}}}(t,e)},mt=function(t,e){return dt(c(t,{type:"arrayBuffer"}),e)},vt=function(t,e){return dt(c(t,{method:"POST"}),e)};var gt,xt;gt=[],xt=0;var bt=function(t,e){if(xt>=F.MAX_PARALLEL_IMAGE_REQUESTS){var r={requestParameters:t,callback:e,cancelled:!1,cancel:function(){this.cancelled=!0;}};return gt.push(r),r}xt++;var n=!1,i=function(){if(!n)for(n=!0,xt--;gt.length&&xt<F.MAX_PARALLEL_IMAGE_REQUESTS;){var t=gt.shift(),e=t.requestParameters,r=t.callback;t.cancelled||(t.cancel=bt(e,r).cancel);}},a=mt(t,(function(t,r,n,a){if(i(),t)e(t);else if(r){var o=new self.Image,s=self.URL||self.webkitURL;o.onload=function(){e(null,o),s.revokeObjectURL(o.src);},o.onerror=function(){return e(new Error("Could not load image. Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported."))};var u=new self.Blob([new Uint8Array(r)],{type:"image/png"});o.cacheControl=n,o.expires=a,o.src=r.byteLength?s.createObjectURL(u):"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=";}}));return {cancel:function(){a.cancel(),i();}}};function _t(t,e,r){r[t]&&-1!==r[t].indexOf(e)||(r[t]=r[t]||[],r[t].push(e));}function wt(t,e,r){if(r&&r[t]){var n=r[t].indexOf(e);-1!==n&&r[t].splice(n,1);}}var At=function(t,e){void 0===e&&(e={}),c(this,e),this.type=t;},kt=function(t){function e(e,r){void 0===r&&(r={}),t.call(this,"error",c({error:e},r));}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(At),St=function(){};St.prototype.on=function(t,e){return this._listeners=this._listeners||{},_t(t,e,this._listeners),this},St.prototype.off=function(t,e){return wt(t,e,this._listeners),wt(t,e,this._oneTimeListeners),this},St.prototype.once=function(t,e){return this._oneTimeListeners=this._oneTimeListeners||{},_t(t,e,this._oneTimeListeners),this},St.prototype.fire=function(t,e){"string"==typeof t&&(t=new At(t,e||{}));var r=t.type;if(this.listens(r)){t.target=this;for(var n=0,i=this._listeners&&this._listeners[r]?this._listeners[r].slice():[];n<i.length;n+=1){i[n].call(this,t);}for(var a=0,o=this._oneTimeListeners&&this._oneTimeListeners[r]?this._oneTimeListeners[r].slice():[];a<o.length;a+=1){var s=o[a];wt(r,s,this._oneTimeListeners),s.call(this,t);}var u=this._eventedParent;u&&(c(t,"function"==typeof this._eventedParentData?this._eventedParentData():this._eventedParentData),u.fire(t));}else t instanceof kt&&console.error(t.error);return this},St.prototype.listens=function(t){return this._listeners&&this._listeners[t]&&this._listeners[t].length>0||this._oneTimeListeners&&this._oneTimeListeners[t]&&this._oneTimeListeners[t].length>0||this._eventedParent&&this._eventedParent.listens(t)},St.prototype.setEventedParent=function(t,e){return this._eventedParent=t,this._eventedParentData=e,this};var It={$version:8,$root:{version:{required:!0,type:"enum",values:[8]},name:{type:"string"},metadata:{type:"*"},center:{type:"array",value:"number"},zoom:{type:"number"},bearing:{type:"number",default:0,period:360,units:"degrees"},pitch:{type:"number",default:0,units:"degrees"},light:{type:"light"},sources:{required:!0,type:"sources"},sprite:{type:"string"},glyphs:{type:"string"},transition:{type:"transition"},layers:{required:!0,type:"array",value:"layer"}},sources:{"*":{type:"source"}},source:["source_vector","source_raster","source_raster_dem","source_geojson","source_video","source_image"],source_vector:{type:{required:!0,type:"enum",values:{vector:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},attribution:{type:"string"},"*":{type:"*"}},source_raster:{type:{required:!0,type:"enum",values:{raster:{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},scheme:{type:"enum",values:{xyz:{},tms:{}},default:"xyz"},attribution:{type:"string"},"*":{type:"*"}},source_raster_dem:{type:{required:!0,type:"enum",values:{"raster-dem":{}}},url:{type:"string"},tiles:{type:"array",value:"string"},bounds:{type:"array",value:"number",length:4,default:[-180,-85.051129,180,85.051129]},minzoom:{type:"number",default:0},maxzoom:{type:"number",default:22},tileSize:{type:"number",default:512,units:"pixels"},attribution:{type:"string"},encoding:{type:"enum",values:{terrarium:{},mapbox:{}},default:"mapbox"},"*":{type:"*"}},source_geojson:{type:{required:!0,type:"enum",values:{geojson:{}}},data:{type:"*"},maxzoom:{type:"number",default:18},attribution:{type:"string"},buffer:{type:"number",default:128,maximum:512,minimum:0},tolerance:{type:"number",default:.375},cluster:{type:"boolean",default:!1},clusterRadius:{type:"number",default:50,minimum:0},clusterMaxZoom:{type:"number"},clusterProperties:{type:"*"},lineMetrics:{type:"boolean",default:!1},generateId:{type:"boolean",default:!1}},source_video:{type:{required:!0,type:"enum",values:{video:{}}},urls:{required:!0,type:"array",value:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},source_image:{type:{required:!0,type:"enum",values:{image:{}}},url:{required:!0,type:"string"},coordinates:{required:!0,type:"array",length:4,value:{type:"array",length:2,value:"number"}}},layer:{id:{type:"string",required:!0},type:{type:"enum",values:{fill:{},line:{},symbol:{},circle:{},heatmap:{},"fill-extrusion":{},raster:{},hillshade:{},background:{}},required:!0},metadata:{type:"*"},source:{type:"string"},"source-layer":{type:"string"},minzoom:{type:"number",minimum:0,maximum:24},maxzoom:{type:"number",minimum:0,maximum:24},filter:{type:"filter"},layout:{type:"layout"},paint:{type:"paint"}},layout:["layout_fill","layout_line","layout_circle","layout_heatmap","layout_fill-extrusion","layout_symbol","layout_raster","layout_hillshade","layout_background"],layout_background:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_fill:{"fill-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_circle:{"circle-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_heatmap:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},"layout_fill-extrusion":{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_line:{"line-cap":{type:"enum",values:{butt:{},round:{},square:{}},default:"butt",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-join":{type:"enum",values:{bevel:{},round:{},miter:{}},default:"miter",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"line-miter-limit":{type:"number",default:2,requires:[{"line-join":"miter"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-round-limit":{type:"number",default:1.05,requires:[{"line-join":"round"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_symbol:{"symbol-placement":{type:"enum",values:{point:{},line:{},"line-center":{}},default:"point",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-spacing":{type:"number",default:250,minimum:1,units:"pixels",requires:[{"symbol-placement":"line"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"symbol-avoid-edges":{type:"boolean",default:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"symbol-sort-key":{type:"number",expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"symbol-z-order":{type:"enum",values:{auto:{},"viewport-y":{},source:{}},default:"auto",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-allow-overlap":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-ignore-placement":{type:"boolean",default:!1,requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-optional":{type:"boolean",default:!1,requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-size":{type:"number",default:1,minimum:0,units:"factor of the original icon size",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-text-fit":{type:"enum",values:{none:{},width:{},height:{},both:{}},default:"none",requires:["icon-image","text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-text-fit-padding":{type:"array",value:"number",length:4,default:[0,0,0,0],units:"pixels",requires:["icon-image","text-field",{"icon-text-fit":["both","width","height"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-image":{type:"resolvedImage",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-keep-upright":{type:"boolean",default:!1,requires:["icon-image",{"icon-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"icon-offset":{type:"array",value:"number",length:2,default:[0,0],requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"icon-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-pitch-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotation-alignment":{type:"enum",values:{map:{},viewport:{},auto:{}},default:"auto",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-field":{type:"formatted",default:"",tokens:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-font":{type:"array",value:"string",default:["Open Sans Regular","Arial Unicode MS Regular"],requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-size":{type:"number",default:16,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-width":{type:"number",default:10,minimum:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-line-height":{type:"number",default:1.2,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-letter-spacing":{type:"number",default:0,units:"ems",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-justify":{type:"enum",values:{auto:{},left:{},center:{},right:{}},default:"center",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-radial-offset":{type:"number",units:"ems",default:0,requires:["text-field"],"property-type":"data-driven",expression:{interpolated:!0,parameters:["zoom","feature"]}},"text-variable-anchor":{type:"array",value:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-anchor":{type:"enum",values:{center:{},left:{},right:{},top:{},bottom:{},"top-left":{},"top-right":{},"bottom-left":{},"bottom-right":{}},default:"center",requires:["text-field",{"!":"text-variable-anchor"}],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-max-angle":{type:"number",default:45,units:"degrees",requires:["text-field",{"symbol-placement":["line","line-center"]}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-writing-mode":{type:"array",value:"enum",values:{horizontal:{},vertical:{}},requires:["text-field",{"symbol-placement":["point"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-rotate":{type:"number",default:0,period:360,units:"degrees",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-padding":{type:"number",default:2,minimum:0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-keep-upright":{type:"boolean",default:!0,requires:["text-field",{"text-rotation-alignment":"map"},{"symbol-placement":["line","line-center"]}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-transform":{type:"enum",values:{none:{},uppercase:{},lowercase:{}},default:"none",requires:["text-field"],expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-offset":{type:"array",value:"number",units:"ems",length:2,default:[0,0],requires:["text-field",{"!":"text-radial-offset"}],expression:{interpolated:!0,parameters:["zoom","feature"]},"property-type":"data-driven"},"text-allow-overlap":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-ignore-placement":{type:"boolean",default:!1,requires:["text-field"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-optional":{type:"boolean",default:!1,requires:["text-field","icon-image"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_raster:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},layout_hillshade:{visibility:{type:"enum",values:{visible:{},none:{}},default:"visible","property-type":"constant"}},filter:{type:"array",value:"*"},filter_operator:{type:"enum",values:{"==":{},"!=":{},">":{},">=":{},"<":{},"<=":{},in:{},"!in":{},all:{},any:{},none:{},has:{},"!has":{}}},geometry_type:{type:"enum",values:{Point:{},LineString:{},Polygon:{}}},function:{expression:{type:"expression"},stops:{type:"array",value:"function_stop"},base:{type:"number",default:1,minimum:0},property:{type:"string",default:"$zoom"},type:{type:"enum",values:{identity:{},exponential:{},interval:{},categorical:{}},default:"exponential"},colorSpace:{type:"enum",values:{rgb:{},lab:{},hcl:{}},default:"rgb"},default:{type:"*",required:!1}},function_stop:{type:"array",minimum:0,maximum:22,value:["number","color"],length:2},expression:{type:"array",value:"*",minimum:1},expression_name:{type:"enum",values:{let:{group:"Variable binding"},var:{group:"Variable binding"},literal:{group:"Types"},array:{group:"Types"},at:{group:"Lookup"},case:{group:"Decision"},match:{group:"Decision"},coalesce:{group:"Decision"},step:{group:"Ramps, scales, curves"},interpolate:{group:"Ramps, scales, curves"},"interpolate-hcl":{group:"Ramps, scales, curves"},"interpolate-lab":{group:"Ramps, scales, curves"},ln2:{group:"Math"},pi:{group:"Math"},e:{group:"Math"},typeof:{group:"Types"},string:{group:"Types"},number:{group:"Types"},boolean:{group:"Types"},object:{group:"Types"},collator:{group:"Types"},format:{group:"Types"},image:{group:"Types"},"number-format":{group:"Types"},"to-string":{group:"Types"},"to-number":{group:"Types"},"to-boolean":{group:"Types"},"to-rgba":{group:"Color"},"to-color":{group:"Types"},rgb:{group:"Color"},rgba:{group:"Color"},get:{group:"Lookup"},has:{group:"Lookup"},length:{group:"Lookup"},properties:{group:"Feature data"},"feature-state":{group:"Feature data"},"geometry-type":{group:"Feature data"},id:{group:"Feature data"},zoom:{group:"Zoom"},"heatmap-density":{group:"Heatmap"},"line-progress":{group:"Feature data"},accumulated:{group:"Feature data"},"+":{group:"Math"},"*":{group:"Math"},"-":{group:"Math"},"/":{group:"Math"},"%":{group:"Math"},"^":{group:"Math"},sqrt:{group:"Math"},log10:{group:"Math"},ln:{group:"Math"},log2:{group:"Math"},sin:{group:"Math"},cos:{group:"Math"},tan:{group:"Math"},asin:{group:"Math"},acos:{group:"Math"},atan:{group:"Math"},min:{group:"Math"},max:{group:"Math"},round:{group:"Math"},abs:{group:"Math"},ceil:{group:"Math"},floor:{group:"Math"},"==":{group:"Decision"},"!=":{group:"Decision"},">":{group:"Decision"},"<":{group:"Decision"},">=":{group:"Decision"},"<=":{group:"Decision"},all:{group:"Decision"},any:{group:"Decision"},"!":{group:"Decision"},"is-supported-script":{group:"String"},upcase:{group:"String"},downcase:{group:"String"},concat:{group:"String"},"resolved-locale":{group:"String"}}},light:{anchor:{type:"enum",default:"viewport",values:{map:{},viewport:{}},"property-type":"data-constant",transition:!1,expression:{interpolated:!1,parameters:["zoom"]}},position:{type:"array",default:[1.15,210,30],length:3,value:"number","property-type":"data-constant",transition:!0,expression:{interpolated:!0,parameters:["zoom"]}},color:{type:"color","property-type":"data-constant",default:"#ffffff",expression:{interpolated:!0,parameters:["zoom"]},transition:!0},intensity:{type:"number","property-type":"data-constant",default:.5,minimum:0,maximum:1,expression:{interpolated:!0,parameters:["zoom"]},transition:!0}},paint:["paint_fill","paint_line","paint_circle","paint_heatmap","paint_fill-extrusion","paint_symbol","paint_raster","paint_hillshade","paint_background"],paint_fill:{"fill-antialias":{type:"boolean",default:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-outline-color":{type:"color",transition:!0,requires:[{"!":"fill-pattern"},{"fill-antialias":!0}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"}},"paint_fill-extrusion":{"fill-extrusion-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"fill-extrusion-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["fill-extrusion-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"fill-extrusion-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"fill-extrusion-height":{type:"number",default:0,minimum:0,units:"meters",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-base":{type:"number",default:0,minimum:0,units:"meters",transition:!0,requires:["fill-extrusion-height"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"fill-extrusion-vertical-gradient":{type:"boolean",default:!0,transition:!1,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_line:{"line-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"line-pattern"}],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"line-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["line-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"line-width":{type:"number",default:1,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-gap-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-offset":{type:"number",default:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"line-dasharray":{type:"array",value:"number",minimum:0,transition:!0,units:"line widths",requires:[{"!":"line-pattern"}],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"line-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom","feature"]},"property-type":"cross-faded-data-driven"},"line-gradient":{type:"color",transition:!1,requires:[{"!":"line-dasharray"},{"!":"line-pattern"},{source:"geojson",has:{lineMetrics:!0}}],expression:{interpolated:!0,parameters:["line-progress"]},"property-type":"color-ramp"}},paint_circle:{"circle-radius":{type:"number",default:5,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-blur":{type:"number",default:0,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"circle-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["circle-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-scale":{type:"enum",values:{map:{},viewport:{}},default:"map",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-pitch-alignment":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"circle-stroke-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"circle-stroke-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"}},paint_heatmap:{"heatmap-radius":{type:"number",default:30,minimum:1,transition:!0,units:"pixels",expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-weight":{type:"number",default:1,minimum:0,transition:!1,expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"heatmap-intensity":{type:"number",default:1,minimum:0,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"heatmap-color":{type:"color",default:["interpolate",["linear"],["heatmap-density"],0,"rgba(0, 0, 255, 0)",.1,"royalblue",.3,"cyan",.5,"lime",.7,"yellow",1,"red"],transition:!1,expression:{interpolated:!0,parameters:["heatmap-density"]},"property-type":"color-ramp"},"heatmap-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_symbol:{"icon-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-color":{type:"color",default:"#000000",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"icon-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["icon-image"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"icon-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["icon-image","icon-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"text-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-color":{type:"color",default:"#000000",transition:!0,overridable:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-color":{type:"color",default:"rgba(0, 0, 0, 0)",transition:!0,requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-width":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-halo-blur":{type:"number",default:0,minimum:0,transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom","feature","feature-state"]},"property-type":"data-driven"},"text-translate":{type:"array",value:"number",length:2,default:[0,0],transition:!0,units:"pixels",requires:["text-field"],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"text-translate-anchor":{type:"enum",values:{map:{},viewport:{}},default:"map",requires:["text-field","text-translate"],expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"}},paint_raster:{"raster-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-hue-rotate":{type:"number",default:0,period:360,transition:!0,units:"degrees",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-min":{type:"number",default:0,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-brightness-max":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-saturation":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-contrast":{type:"number",default:0,minimum:-1,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"raster-resampling":{type:"enum",values:{linear:{},nearest:{}},default:"linear",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"raster-fade-duration":{type:"number",default:300,minimum:0,transition:!1,units:"milliseconds",expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_hillshade:{"hillshade-illumination-direction":{type:"number",default:335,minimum:0,maximum:359,transition:!1,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-illumination-anchor":{type:"enum",values:{map:{},viewport:{}},default:"viewport",expression:{interpolated:!1,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-exaggeration":{type:"number",default:.5,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-shadow-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-highlight-color":{type:"color",default:"#FFFFFF",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"hillshade-accent-color":{type:"color",default:"#000000",transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},paint_background:{"background-color":{type:"color",default:"#000000",transition:!0,requires:[{"!":"background-pattern"}],expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"},"background-pattern":{type:"resolvedImage",transition:!0,expression:{interpolated:!1,parameters:["zoom"]},"property-type":"cross-faded"},"background-opacity":{type:"number",default:1,minimum:0,maximum:1,transition:!0,expression:{interpolated:!0,parameters:["zoom"]},"property-type":"data-constant"}},transition:{duration:{type:"number",default:300,minimum:0,units:"milliseconds"},delay:{type:"number",default:0,minimum:0,units:"milliseconds"}},"property-type":{"data-driven":{type:"property-type"},"cross-faded":{type:"property-type"},"cross-faded-data-driven":{type:"property-type"},"color-ramp":{type:"property-type"},"data-constant":{type:"property-type"},constant:{type:"property-type"}}},zt=function(t,e,r,n){this.message=(t?t+": ":"")+r,n&&(this.identifier=n),null!=e&&e.__line__&&(this.line=e.__line__);};function Ct(t){var e=t.key,r=t.value;return r?[new zt(e,r,"constants have been deprecated as of v8")]:[]}function Bt(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];for(var n=0,i=e;n<i.length;n+=1){var a=i[n];for(var o in a)t[o]=a[o];}return t}function Pt(t){return t instanceof Number||t instanceof String||t instanceof Boolean}function Et(t){return Pt(t)?t.valueOf():t}function Mt(t){if(Array.isArray(t))return t.map(Mt);if(t instanceof Object&&!Pt(t)){var e={};for(var r in t)e[r]=Mt(t[r]);return e}return Et(t)}var Tt=function(t){function e(e,r){t.call(this,r),this.message=r,this.key=e;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(Error),Vt=function(t,e){void 0===e&&(e=[]),this.parent=t,this.bindings={};for(var r=0,n=e;r<n.length;r+=1){var i=n[r],a=i[0],o=i[1];this.bindings[a]=o;}};Vt.prototype.concat=function(t){return new Vt(this,t)},Vt.prototype.get=function(t){if(this.bindings[t])return this.bindings[t];if(this.parent)return this.parent.get(t);throw new Error(t+" not found in scope.")},Vt.prototype.has=function(t){return !!this.bindings[t]||!!this.parent&&this.parent.has(t)};var Ft={kind:"null"},Ot={kind:"number"},Lt={kind:"string"},Dt={kind:"boolean"},Ut={kind:"color"},Rt={kind:"object"},jt={kind:"value"},qt={kind:"collator"},Nt={kind:"formatted"},Kt={kind:"resolvedImage"};function Xt(t,e){return {kind:"array",itemType:t,N:e}}function Zt(t){if("array"===t.kind){var e=Zt(t.itemType);return "number"==typeof t.N?"array<"+e+", "+t.N+">":"value"===t.itemType.kind?"array":"array<"+e+">"}return t.kind}var Gt=[Ft,Ot,Lt,Dt,Ut,Nt,Rt,Xt(jt),Kt];function Jt(t,e){if("error"===e.kind)return null;if("array"===t.kind){if("array"===e.kind&&(0===e.N&&"value"===e.itemType.kind||!Jt(t.itemType,e.itemType))&&("number"!=typeof t.N||t.N===e.N))return null}else{if(t.kind===e.kind)return null;if("value"===t.kind)for(var r=0,n=Gt;r<n.length;r+=1){if(!Jt(n[r],e))return null}}return "Expected "+Zt(t)+" but found "+Zt(e)+" instead."}var Ht=e((function(t,e){var r={transparent:[0,0,0,0],aliceblue:[240,248,255,1],antiquewhite:[250,235,215,1],aqua:[0,255,255,1],aquamarine:[127,255,212,1],azure:[240,255,255,1],beige:[245,245,220,1],bisque:[255,228,196,1],black:[0,0,0,1],blanchedalmond:[255,235,205,1],blue:[0,0,255,1],blueviolet:[138,43,226,1],brown:[165,42,42,1],burlywood:[222,184,135,1],cadetblue:[95,158,160,1],chartreuse:[127,255,0,1],chocolate:[210,105,30,1],coral:[255,127,80,1],cornflowerblue:[100,149,237,1],cornsilk:[255,248,220,1],crimson:[220,20,60,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgoldenrod:[184,134,11,1],darkgray:[169,169,169,1],darkgreen:[0,100,0,1],darkgrey:[169,169,169,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkseagreen:[143,188,143,1],darkslateblue:[72,61,139,1],darkslategray:[47,79,79,1],darkslategrey:[47,79,79,1],darkturquoise:[0,206,209,1],darkviolet:[148,0,211,1],deeppink:[255,20,147,1],deepskyblue:[0,191,255,1],dimgray:[105,105,105,1],dimgrey:[105,105,105,1],dodgerblue:[30,144,255,1],firebrick:[178,34,34,1],floralwhite:[255,250,240,1],forestgreen:[34,139,34,1],fuchsia:[255,0,255,1],gainsboro:[220,220,220,1],ghostwhite:[248,248,255,1],gold:[255,215,0,1],goldenrod:[218,165,32,1],gray:[128,128,128,1],green:[0,128,0,1],greenyellow:[173,255,47,1],grey:[128,128,128,1],honeydew:[240,255,240,1],hotpink:[255,105,180,1],indianred:[205,92,92,1],indigo:[75,0,130,1],ivory:[255,255,240,1],khaki:[240,230,140,1],lavender:[230,230,250,1],lavenderblush:[255,240,245,1],lawngreen:[124,252,0,1],lemonchiffon:[255,250,205,1],lightblue:[173,216,230,1],lightcoral:[240,128,128,1],lightcyan:[224,255,255,1],lightgoldenrodyellow:[250,250,210,1],lightgray:[211,211,211,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightsalmon:[255,160,122,1],lightseagreen:[32,178,170,1],lightskyblue:[135,206,250,1],lightslategray:[119,136,153,1],lightslategrey:[119,136,153,1],lightsteelblue:[176,196,222,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],limegreen:[50,205,50,1],linen:[250,240,230,1],magenta:[255,0,255,1],maroon:[128,0,0,1],mediumaquamarine:[102,205,170,1],mediumblue:[0,0,205,1],mediumorchid:[186,85,211,1],mediumpurple:[147,112,219,1],mediumseagreen:[60,179,113,1],mediumslateblue:[123,104,238,1],mediumspringgreen:[0,250,154,1],mediumturquoise:[72,209,204,1],mediumvioletred:[199,21,133,1],midnightblue:[25,25,112,1],mintcream:[245,255,250,1],mistyrose:[255,228,225,1],moccasin:[255,228,181,1],navajowhite:[255,222,173,1],navy:[0,0,128,1],oldlace:[253,245,230,1],olive:[128,128,0,1],olivedrab:[107,142,35,1],orange:[255,165,0,1],orangered:[255,69,0,1],orchid:[218,112,214,1],palegoldenrod:[238,232,170,1],palegreen:[152,251,152,1],paleturquoise:[175,238,238,1],palevioletred:[219,112,147,1],papayawhip:[255,239,213,1],peachpuff:[255,218,185,1],peru:[205,133,63,1],pink:[255,192,203,1],plum:[221,160,221,1],powderblue:[176,224,230,1],purple:[128,0,128,1],rebeccapurple:[102,51,153,1],red:[255,0,0,1],rosybrown:[188,143,143,1],royalblue:[65,105,225,1],saddlebrown:[139,69,19,1],salmon:[250,128,114,1],sandybrown:[244,164,96,1],seagreen:[46,139,87,1],seashell:[255,245,238,1],sienna:[160,82,45,1],silver:[192,192,192,1],skyblue:[135,206,235,1],slateblue:[106,90,205,1],slategray:[112,128,144,1],slategrey:[112,128,144,1],snow:[255,250,250,1],springgreen:[0,255,127,1],steelblue:[70,130,180,1],tan:[210,180,140,1],teal:[0,128,128,1],thistle:[216,191,216,1],tomato:[255,99,71,1],turquoise:[64,224,208,1],violet:[238,130,238,1],wheat:[245,222,179,1],white:[255,255,255,1],whitesmoke:[245,245,245,1],yellow:[255,255,0,1],yellowgreen:[154,205,50,1]};function n(t){return (t=Math.round(t))<0?0:t>255?255:t}function i(t){return t<0?0:t>1?1:t}function a(t){return "%"===t[t.length-1]?n(parseFloat(t)/100*255):n(parseInt(t))}function o(t){return "%"===t[t.length-1]?i(parseFloat(t)/100):i(parseFloat(t))}function s(t,e,r){return r<0?r+=1:r>1&&(r-=1),6*r<1?t+(e-t)*r*6:2*r<1?e:3*r<2?t+(e-t)*(2/3-r)*6:t}try{e.parseCSSColor=function(t){var e,i=t.replace(/ /g,"").toLowerCase();if(i in r)return r[i].slice();if("#"===i[0])return 4===i.length?(e=parseInt(i.substr(1),16))>=0&&e<=4095?[(3840&e)>>4|(3840&e)>>8,240&e|(240&e)>>4,15&e|(15&e)<<4,1]:null:7===i.length&&(e=parseInt(i.substr(1),16))>=0&&e<=16777215?[(16711680&e)>>16,(65280&e)>>8,255&e,1]:null;var u=i.indexOf("("),l=i.indexOf(")");if(-1!==u&&l+1===i.length){var p=i.substr(0,u),c=i.substr(u+1,l-(u+1)).split(","),h=1;switch(p){case"rgba":if(4!==c.length)return null;h=o(c.pop());case"rgb":return 3!==c.length?null:[a(c[0]),a(c[1]),a(c[2]),h];case"hsla":if(4!==c.length)return null;h=o(c.pop());case"hsl":if(3!==c.length)return null;var f=(parseFloat(c[0])%360+360)%360/360,y=o(c[1]),d=o(c[2]),m=d<=.5?d*(y+1):d+y-d*y,v=2*d-m;return [n(255*s(v,m,f+1/3)),n(255*s(v,m,f)),n(255*s(v,m,f-1/3)),h];default:return null}}return null};}catch(t){}})).parseCSSColor,Yt=function(t,e,r,n){void 0===n&&(n=1),this.r=t,this.g=e,this.b=r,this.a=n;};Yt.parse=function(t){if(t){if(t instanceof Yt)return t;if("string"==typeof t){var e=Ht(t);if(e)return new Yt(e[0]/255*e[3],e[1]/255*e[3],e[2]/255*e[3],e[3])}}},Yt.prototype.toString=function(){var t=this.toArray(),e=t[0],r=t[1],n=t[2],i=t[3];return "rgba("+Math.round(e)+","+Math.round(r)+","+Math.round(n)+","+i+")"},Yt.prototype.toArray=function(){var t=this.r,e=this.g,r=this.b,n=this.a;return 0===n?[0,0,0,0]:[255*t/n,255*e/n,255*r/n,n]},Yt.black=new Yt(0,0,0,1),Yt.white=new Yt(1,1,1,1),Yt.transparent=new Yt(0,0,0,0),Yt.red=new Yt(1,0,0,1);var $t=function(t,e,r){this.sensitivity=t?e?"variant":"case":e?"accent":"base",this.locale=r,this.collator=new Intl.Collator(this.locale?this.locale:[],{sensitivity:this.sensitivity,usage:"search"});};$t.prototype.compare=function(t,e){return this.collator.compare(t,e)},$t.prototype.resolvedLocale=function(){return new Intl.Collator(this.locale?this.locale:[]).resolvedOptions().locale};var Wt=function(t,e,r,n){this.text=t,this.scale=e,this.fontStack=r,this.textColor=n;},Qt=function(t){this.sections=t;};Qt.fromString=function(t){return new Qt([new Wt(t,null,null,null)])},Qt.prototype.toString=function(){return this.sections.map((function(t){return t.text})).join("")},Qt.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var n=r[e];t.push(n.text);var i={};n.fontStack&&(i["text-font"]=["literal",n.fontStack.split(",")]),n.scale&&(i["font-scale"]=n.scale),n.textColor&&(i["text-color"]=["rgba"].concat(n.textColor.toArray())),t.push(i);}return t};var te=function(t){this.name=t.name,this.available=t.available;};function ee(t,e,r,n){return "number"==typeof t&&t>=0&&t<=255&&"number"==typeof e&&e>=0&&e<=255&&"number"==typeof r&&r>=0&&r<=255?void 0===n||"number"==typeof n&&n>=0&&n<=1?null:"Invalid rgba value ["+[t,e,r,n].join(", ")+"]: 'a' must be between 0 and 1.":"Invalid rgba value ["+("number"==typeof n?[t,e,r,n]:[t,e,r]).join(", ")+"]: 'r', 'g', and 'b' must be between 0 and 255."}function re(t){if(null===t)return Ft;if("string"==typeof t)return Lt;if("boolean"==typeof t)return Dt;if("number"==typeof t)return Ot;if(t instanceof Yt)return Ut;if(t instanceof $t)return qt;if(t instanceof Qt)return Nt;if(t instanceof te)return Kt;if(Array.isArray(t)){for(var e,r=t.length,n=0,i=t;n<i.length;n+=1){var a=re(i[n]);if(e){if(e===a)continue;e=jt;break}e=a;}return Xt(e||jt,r)}return Rt}function ne(t){var e=typeof t;return null===t?"":"string"===e||"number"===e||"boolean"===e?String(t):t instanceof Yt||t instanceof Qt||t instanceof te?t.toString():JSON.stringify(t)}te.prototype.toString=function(){return this.name},te.fromString=function(t){return new te({name:t,available:!1})},te.prototype.serialize=function(){return ["image",this.name]};var ie=function(t,e){this.type=t,this.value=e;};ie.parse=function(t,e){if(2!==t.length)return e.error("'literal' expression requires exactly one argument, but found "+(t.length-1)+" instead.");if(!function t(e){if(null===e)return !0;if("string"==typeof e)return !0;if("boolean"==typeof e)return !0;if("number"==typeof e)return !0;if(e instanceof Yt)return !0;if(e instanceof $t)return !0;if(e instanceof Qt)return !0;if(e instanceof te)return !0;if(Array.isArray(e)){for(var r=0,n=e;r<n.length;r+=1){if(!t(n[r]))return !1}return !0}if("object"==typeof e){for(var i in e)if(!t(e[i]))return !1;return !0}return !1}(t[1]))return e.error("invalid value");var r=t[1],n=re(r),i=e.expectedType;return "array"!==n.kind||0!==n.N||!i||"array"!==i.kind||"number"==typeof i.N&&0!==i.N||(n=i),new ie(n,r)},ie.prototype.evaluate=function(){return this.value},ie.prototype.eachChild=function(){},ie.prototype.possibleOutputs=function(){return [this.value]},ie.prototype.serialize=function(){return "array"===this.type.kind||"object"===this.type.kind?["literal",this.value]:this.value instanceof Yt?["rgba"].concat(this.value.toArray()):this.value instanceof Qt?this.value.serialize():this.value};var ae=function(t){this.name="ExpressionEvaluationError",this.message=t;};ae.prototype.toJSON=function(){return this.message};var oe={string:Lt,number:Ot,boolean:Dt,object:Rt},se=function(t,e){this.type=t,this.args=e;};se.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r,n=1,i=t[0];if("array"===i){var a,o;if(t.length>2){var s=t[1];if("string"!=typeof s||!(s in oe)||"object"===s)return e.error('The item type argument of "array" must be one of string, number, boolean',1);a=oe[s],n++;}else a=jt;if(t.length>3){if(null!==t[2]&&("number"!=typeof t[2]||t[2]<0||t[2]!==Math.floor(t[2])))return e.error('The length argument to "array" must be a positive integer literal',2);o=t[2],n++;}r=Xt(a,o);}else r=oe[i];for(var u=[];n<t.length;n++){var l=e.parse(t[n],n,jt);if(!l)return null;u.push(l);}return new se(r,u)},se.prototype.evaluate=function(t){for(var e=0;e<this.args.length;e++){var r=this.args[e].evaluate(t);if(!Jt(this.type,re(r)))return r;if(e===this.args.length-1)throw new ae("Expected value to be of type "+Zt(this.type)+", but found "+Zt(re(r))+" instead.")}return null},se.prototype.eachChild=function(t){this.args.forEach(t);},se.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.args.map((function(t){return t.possibleOutputs()})))},se.prototype.serialize=function(){var t=this.type,e=[t.kind];if("array"===t.kind){var r=t.itemType;if("string"===r.kind||"number"===r.kind||"boolean"===r.kind){e.push(r.kind);var n=t.N;("number"==typeof n||this.args.length>1)&&e.push(n);}}return e.concat(this.args.map((function(t){return t.serialize()})))};var ue=function(t){this.type=Nt,this.sections=t;};ue.parse=function(t,e){if(t.length<3)return e.error("Expected at least two arguments.");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");for(var r=[],n=1;n<t.length-1;n+=2){var i=e.parse(t[n],1,jt);if(!i)return null;var a=i.type.kind;if("string"!==a&&"value"!==a&&"null"!==a)return e.error("Formatted text type must be 'string', 'value', or 'null'.");var o=t[n+1];if("object"!=typeof o||Array.isArray(o))return e.error("Format options argument must be an object.");var s=null;if(o["font-scale"]&&!(s=e.parse(o["font-scale"],1,Ot)))return null;var u=null;if(o["text-font"]&&!(u=e.parse(o["text-font"],1,Xt(Lt))))return null;var l=null;if(o["text-color"]&&!(l=e.parse(o["text-color"],1,Ut)))return null;r.push({text:i,scale:s,font:u,textColor:l});}return new ue(r)},ue.prototype.evaluate=function(t){return new Qt(this.sections.map((function(e){return new Wt(ne(e.text.evaluate(t)),e.scale?e.scale.evaluate(t):null,e.font?e.font.evaluate(t).join(","):null,e.textColor?e.textColor.evaluate(t):null)})))},ue.prototype.eachChild=function(t){for(var e=0,r=this.sections;e<r.length;e+=1){var n=r[e];t(n.text),n.scale&&t(n.scale),n.font&&t(n.font),n.textColor&&t(n.textColor);}},ue.prototype.possibleOutputs=function(){return [void 0]},ue.prototype.serialize=function(){for(var t=["format"],e=0,r=this.sections;e<r.length;e+=1){var n=r[e];t.push(n.text.serialize());var i={};n.scale&&(i["font-scale"]=n.scale.serialize()),n.font&&(i["text-font"]=n.font.serialize()),n.textColor&&(i["text-color"]=n.textColor.serialize()),t.push(i);}return t};var le=function(t){this.type=Kt,this.input=t;};le.parse=function(t,e){if(2!==t.length)return e.error("Expected two arguments.");var r=e.parse(t[1],1,Lt);return r?new le(r):e.error("No image name provided.")},le.prototype.evaluate=function(t){var e=this.input.evaluate(t),r=!1;return t.availableImages&&t.availableImages.indexOf(e)>-1&&(r=!0),new te({name:e,available:r})},le.prototype.eachChild=function(t){t(this.input);},le.prototype.possibleOutputs=function(){return [void 0]},le.prototype.serialize=function(){return ["image",this.input.serialize()]};var pe={"to-boolean":Dt,"to-color":Ut,"to-number":Ot,"to-string":Lt},ce=function(t,e){this.type=t,this.args=e;};ce.parse=function(t,e){if(t.length<2)return e.error("Expected at least one argument.");var r=t[0];if(("to-boolean"===r||"to-string"===r)&&2!==t.length)return e.error("Expected one argument.");for(var n=pe[r],i=[],a=1;a<t.length;a++){var o=e.parse(t[a],a,jt);if(!o)return null;i.push(o);}return new ce(n,i)},ce.prototype.evaluate=function(t){if("boolean"===this.type.kind)return Boolean(this.args[0].evaluate(t));if("color"===this.type.kind){for(var e,r,n=0,i=this.args;n<i.length;n+=1){if(r=null,(e=i[n].evaluate(t))instanceof Yt)return e;if("string"==typeof e){var a=t.parseColor(e);if(a)return a}else if(Array.isArray(e)&&!(r=e.length<3||e.length>4?"Invalid rbga value "+JSON.stringify(e)+": expected an array containing either three or four numeric values.":ee(e[0],e[1],e[2],e[3])))return new Yt(e[0]/255,e[1]/255,e[2]/255,e[3])}throw new ae(r||"Could not parse color from value '"+("string"==typeof e?e:String(JSON.stringify(e)))+"'")}if("number"===this.type.kind){for(var o=null,s=0,u=this.args;s<u.length;s+=1){if(null===(o=u[s].evaluate(t)))return 0;var l=Number(o);if(!isNaN(l))return l}throw new ae("Could not convert "+JSON.stringify(o)+" to number.")}return "formatted"===this.type.kind?Qt.fromString(ne(this.args[0].evaluate(t))):"resolvedImage"===this.type.kind?te.fromString(ne(this.args[0].evaluate(t))):ne(this.args[0].evaluate(t))},ce.prototype.eachChild=function(t){this.args.forEach(t);},ce.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.args.map((function(t){return t.possibleOutputs()})))},ce.prototype.serialize=function(){if("formatted"===this.type.kind)return new ue([{text:this.args[0],scale:null,font:null,textColor:null}]).serialize();if("resolvedImage"===this.type.kind)return new le(this.args[0]).serialize();var t=["to-"+this.type.kind];return this.eachChild((function(e){t.push(e.serialize());})),t};var he=["Unknown","Point","LineString","Polygon"],fe=function(){this.globals=null,this.feature=null,this.featureState=null,this.formattedSection=null,this._parseColorCache={},this.availableImages=null;};fe.prototype.id=function(){return this.feature&&"id"in this.feature?this.feature.id:null},fe.prototype.geometryType=function(){return this.feature?"number"==typeof this.feature.type?he[this.feature.type]:this.feature.type:null},fe.prototype.properties=function(){return this.feature&&this.feature.properties||{}},fe.prototype.parseColor=function(t){var e=this._parseColorCache[t];return e||(e=this._parseColorCache[t]=Yt.parse(t)),e};var ye=function(t,e,r,n){this.name=t,this.type=e,this._evaluate=r,this.args=n;};ye.prototype.evaluate=function(t){return this._evaluate(t,this.args)},ye.prototype.eachChild=function(t){this.args.forEach(t);},ye.prototype.possibleOutputs=function(){return [void 0]},ye.prototype.serialize=function(){return [this.name].concat(this.args.map((function(t){return t.serialize()})))},ye.parse=function(t,e){var r,n=t[0],i=ye.definitions[n];if(!i)return e.error('Unknown expression "'+n+'". If you wanted a literal array, use ["literal", [...]].',0);for(var a=Array.isArray(i)?i[0]:i.type,o=Array.isArray(i)?[[i[1],i[2]]]:i.overloads,s=o.filter((function(e){var r=e[0];return !Array.isArray(r)||r.length===t.length-1})),u=null,l=0,p=s;l<p.length;l+=1){var c=p[l],h=c[0],f=c[1];u=new be(e.registry,e.path,null,e.scope);for(var y=[],d=!1,m=1;m<t.length;m++){var v=t[m],g=Array.isArray(h)?h[m-1]:h.type,x=u.parse(v,1+y.length,g);if(!x){d=!0;break}y.push(x);}if(!d)if(Array.isArray(h)&&h.length!==y.length)u.error("Expected "+h.length+" arguments, but found "+y.length+" instead.");else{for(var b=0;b<y.length;b++){var _=Array.isArray(h)?h[b]:h.type,w=y[b];u.concat(b+1).checkSubtype(_,w.type);}if(0===u.errors.length)return new ye(n,a,f,y)}}if(1===s.length)(r=e.errors).push.apply(r,u.errors);else{for(var A=(s.length?s:o).map((function(t){var e,r=t[0];return e=r,Array.isArray(e)?"("+e.map(Zt).join(", ")+")":"("+Zt(e.type)+"...)"})).join(" | "),k=[],S=1;S<t.length;S++){var I=e.parse(t[S],1+k.length);if(!I)return null;k.push(Zt(I.type));}e.error("Expected arguments of type "+A+", but found ("+k.join(", ")+") instead.");}return null},ye.register=function(t,e){for(var r in ye.definitions=e,e)t[r]=ye;};var de=function(t,e,r){this.type=qt,this.locale=r,this.caseSensitive=t,this.diacriticSensitive=e;};function me(t){if(t instanceof ye){if("get"===t.name&&1===t.args.length)return !1;if("feature-state"===t.name)return !1;if("has"===t.name&&1===t.args.length)return !1;if("properties"===t.name||"geometry-type"===t.name||"id"===t.name)return !1;if(/^filter-/.test(t.name))return !1}var e=!0;return t.eachChild((function(t){e&&!me(t)&&(e=!1);})),e}function ve(t){if(t instanceof ye&&"feature-state"===t.name)return !1;var e=!0;return t.eachChild((function(t){e&&!ve(t)&&(e=!1);})),e}function ge(t,e){if(t instanceof ye&&e.indexOf(t.name)>=0)return !1;var r=!0;return t.eachChild((function(t){r&&!ge(t,e)&&(r=!1);})),r}de.parse=function(t,e){if(2!==t.length)return e.error("Expected one argument.");var r=t[1];if("object"!=typeof r||Array.isArray(r))return e.error("Collator options argument must be an object.");var n=e.parse(void 0!==r["case-sensitive"]&&r["case-sensitive"],1,Dt);if(!n)return null;var i=e.parse(void 0!==r["diacritic-sensitive"]&&r["diacritic-sensitive"],1,Dt);if(!i)return null;var a=null;return r.locale&&!(a=e.parse(r.locale,1,Lt))?null:new de(n,i,a)},de.prototype.evaluate=function(t){return new $t(this.caseSensitive.evaluate(t),this.diacriticSensitive.evaluate(t),this.locale?this.locale.evaluate(t):null)},de.prototype.eachChild=function(t){t(this.caseSensitive),t(this.diacriticSensitive),this.locale&&t(this.locale);},de.prototype.possibleOutputs=function(){return [void 0]},de.prototype.serialize=function(){var t={};return t["case-sensitive"]=this.caseSensitive.serialize(),t["diacritic-sensitive"]=this.diacriticSensitive.serialize(),this.locale&&(t.locale=this.locale.serialize()),["collator",t]};var xe=function(t,e){this.type=e.type,this.name=t,this.boundExpression=e;};xe.parse=function(t,e){if(2!==t.length||"string"!=typeof t[1])return e.error("'var' expression requires exactly one string literal argument.");var r=t[1];return e.scope.has(r)?new xe(r,e.scope.get(r)):e.error('Unknown variable "'+r+'". Make sure "'+r+'" has been bound in an enclosing "let" expression before using it.',1)},xe.prototype.evaluate=function(t){return this.boundExpression.evaluate(t)},xe.prototype.eachChild=function(){},xe.prototype.possibleOutputs=function(){return [void 0]},xe.prototype.serialize=function(){return ["var",this.name]};var be=function(t,e,r,n,i){void 0===e&&(e=[]),void 0===n&&(n=new Vt),void 0===i&&(i=[]),this.registry=t,this.path=e,this.key=e.map((function(t){return "["+t+"]"})).join(""),this.scope=n,this.errors=i,this.expectedType=r;};function _e(t,e){for(var r,n,i=t.length-1,a=0,o=i,s=0;a<=o;)if(r=t[s=Math.floor((a+o)/2)],n=t[s+1],r<=e){if(s===i||e<n)return s;a=s+1;}else{if(!(r>e))throw new ae("Input is not a number.");o=s-1;}return 0}be.prototype.parse=function(t,e,r,n,i){return void 0===i&&(i={}),e?this.concat(e,r,n)._parse(t,i):this._parse(t,i)},be.prototype._parse=function(t,e){function r(t,e,r){return "assert"===r?new se(e,[t]):"coerce"===r?new ce(e,[t]):t}if(null!==t&&"string"!=typeof t&&"boolean"!=typeof t&&"number"!=typeof t||(t=["literal",t]),Array.isArray(t)){if(0===t.length)return this.error('Expected an array with at least one element. If you wanted a literal array, use ["literal", []].');var n=t[0];if("string"!=typeof n)return this.error("Expression name must be a string, but found "+typeof n+' instead. If you wanted a literal array, use ["literal", [...]].',0),null;var i=this.registry[n];if(i){var a=i.parse(t,this);if(!a)return null;if(this.expectedType){var o=this.expectedType,s=a.type;if("string"!==o.kind&&"number"!==o.kind&&"boolean"!==o.kind&&"object"!==o.kind&&"array"!==o.kind||"value"!==s.kind)if("color"!==o.kind&&"formatted"!==o.kind&&"resolvedImage"!==o.kind||"value"!==s.kind&&"string"!==s.kind){if(this.checkSubtype(o,s))return null}else a=r(a,o,e.typeAnnotation||"coerce");else a=r(a,o,e.typeAnnotation||"assert");}if(!(a instanceof ie)&&"resolvedImage"!==a.type.kind&&function t(e){if(e instanceof xe)return t(e.boundExpression);if(e instanceof ye&&"error"===e.name)return !1;if(e instanceof de)return !1;var r=e instanceof ce||e instanceof se;var n=!0;e.eachChild((function(e){n=r?n&&t(e):n&&e instanceof ie;}));if(!n)return !1;return me(e)&&ge(e,["zoom","heatmap-density","line-progress","accumulated","is-supported-script"])}(a)){var u=new fe;try{a=new ie(a.type,a.evaluate(u));}catch(t){return this.error(t.message),null}}return a}return this.error('Unknown expression "'+n+'". If you wanted a literal array, use ["literal", [...]].',0)}return void 0===t?this.error("'undefined' value invalid. Use null instead."):"object"==typeof t?this.error('Bare objects invalid. Use ["literal", {...}] instead.'):this.error("Expected an array, but found "+typeof t+" instead.")},be.prototype.concat=function(t,e,r){var n="number"==typeof t?this.path.concat(t):this.path,i=r?this.scope.concat(r):this.scope;return new be(this.registry,n,e||null,i,this.errors)},be.prototype.error=function(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];var n=""+this.key+e.map((function(t){return "["+t+"]"})).join("");this.errors.push(new Tt(n,t));},be.prototype.checkSubtype=function(t,e){var r=Jt(t,e);return r&&this.error(r),r};var we=function(t,e,r){this.type=t,this.input=e,this.labels=[],this.outputs=[];for(var n=0,i=r;n<i.length;n+=1){var a=i[n],o=a[0],s=a[1];this.labels.push(o),this.outputs.push(s);}};we.parse=function(t,e){if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");var r=e.parse(t[1],1,Ot);if(!r)return null;var n=[],i=null;e.expectedType&&"value"!==e.expectedType.kind&&(i=e.expectedType);for(var a=1;a<t.length;a+=2){var o=1===a?-1/0:t[a],s=t[a+1],u=a,l=a+1;if("number"!=typeof o)return e.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.',u);if(n.length&&n[n.length-1][0]>=o)return e.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.',u);var p=e.parse(s,l,i);if(!p)return null;i=i||p.type,n.push([o,p]);}return new we(i,r,n)},we.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(1===e.length)return r[0].evaluate(t);var n=this.input.evaluate(t);if(n<=e[0])return r[0].evaluate(t);var i=e.length;return n>=e[i-1]?r[i-1].evaluate(t):r[_e(e,n)].evaluate(t)},we.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1){t(r[e]);}},we.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.outputs.map((function(t){return t.possibleOutputs()})))},we.prototype.serialize=function(){for(var t=["step",this.input.serialize()],e=0;e<this.labels.length;e++)e>0&&t.push(this.labels[e]),t.push(this.outputs[e].serialize());return t};var Ae=ke;function ke(t,e,r,n){this.cx=3*t,this.bx=3*(r-t)-this.cx,this.ax=1-this.cx-this.bx,this.cy=3*e,this.by=3*(n-e)-this.cy,this.ay=1-this.cy-this.by,this.p1x=t,this.p1y=n,this.p2x=r,this.p2y=n;}function Se(t,e,r){return t*(1-r)+e*r}ke.prototype.sampleCurveX=function(t){return ((this.ax*t+this.bx)*t+this.cx)*t},ke.prototype.sampleCurveY=function(t){return ((this.ay*t+this.by)*t+this.cy)*t},ke.prototype.sampleCurveDerivativeX=function(t){return (3*this.ax*t+2*this.bx)*t+this.cx},ke.prototype.solveCurveX=function(t,e){var r,n,i,a,o;for(void 0===e&&(e=1e-6),i=t,o=0;o<8;o++){if(a=this.sampleCurveX(i)-t,Math.abs(a)<e)return i;var s=this.sampleCurveDerivativeX(i);if(Math.abs(s)<1e-6)break;i-=a/s;}if((i=t)<(r=0))return r;if(i>(n=1))return n;for(;r<n;){if(a=this.sampleCurveX(i),Math.abs(a-t)<e)return i;t>a?r=i:n=i,i=.5*(n-r)+r;}return i},ke.prototype.solve=function(t,e){return this.sampleCurveY(this.solveCurveX(t,e))};var Ie=Object.freeze({__proto__:null,number:Se,color:function(t,e,r){return new Yt(Se(t.r,e.r,r),Se(t.g,e.g,r),Se(t.b,e.b,r),Se(t.a,e.a,r))},array:function(t,e,r){return t.map((function(t,n){return Se(t,e[n],r)}))}}),ze=.95047,Ce=1,Be=1.08883,Pe=4/29,Ee=6/29,Me=3*Ee*Ee,Te=Ee*Ee*Ee,Ve=Math.PI/180,Fe=180/Math.PI;function Oe(t){return t>Te?Math.pow(t,1/3):t/Me+Pe}function Le(t){return t>Ee?t*t*t:Me*(t-Pe)}function De(t){return 255*(t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055)}function Ue(t){return (t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function Re(t){var e=Ue(t.r),r=Ue(t.g),n=Ue(t.b),i=Oe((.4124564*e+.3575761*r+.1804375*n)/ze),a=Oe((.2126729*e+.7151522*r+.072175*n)/Ce);return {l:116*a-16,a:500*(i-a),b:200*(a-Oe((.0193339*e+.119192*r+.9503041*n)/Be)),alpha:t.a}}function je(t){var e=(t.l+16)/116,r=isNaN(t.a)?e:e+t.a/500,n=isNaN(t.b)?e:e-t.b/200;return e=Ce*Le(e),r=ze*Le(r),n=Be*Le(n),new Yt(De(3.2404542*r-1.5371385*e-.4985314*n),De(-.969266*r+1.8760108*e+.041556*n),De(.0556434*r-.2040259*e+1.0572252*n),t.alpha)}function qe(t,e,r){var n=e-t;return t+r*(n>180||n<-180?n-360*Math.round(n/360):n)}var Ne={forward:Re,reverse:je,interpolate:function(t,e,r){return {l:Se(t.l,e.l,r),a:Se(t.a,e.a,r),b:Se(t.b,e.b,r),alpha:Se(t.alpha,e.alpha,r)}}},Ke={forward:function(t){var e=Re(t),r=e.l,n=e.a,i=e.b,a=Math.atan2(i,n)*Fe;return {h:a<0?a+360:a,c:Math.sqrt(n*n+i*i),l:r,alpha:t.a}},reverse:function(t){var e=t.h*Ve,r=t.c;return je({l:t.l,a:Math.cos(e)*r,b:Math.sin(e)*r,alpha:t.alpha})},interpolate:function(t,e,r){return {h:qe(t.h,e.h,r),c:Se(t.c,e.c,r),l:Se(t.l,e.l,r),alpha:Se(t.alpha,e.alpha,r)}}},Xe=Object.freeze({__proto__:null,lab:Ne,hcl:Ke}),Ze=function(t,e,r,n,i){this.type=t,this.operator=e,this.interpolation=r,this.input=n,this.labels=[],this.outputs=[];for(var a=0,o=i;a<o.length;a+=1){var s=o[a],u=s[0],l=s[1];this.labels.push(u),this.outputs.push(l);}};function Ge(t,e,r,n){var i=n-r,a=t-r;return 0===i?0:1===e?a/i:(Math.pow(e,a)-1)/(Math.pow(e,i)-1)}Ze.interpolationFactor=function(t,e,r,n){var i=0;if("exponential"===t.name)i=Ge(e,t.base,r,n);else if("linear"===t.name)i=Ge(e,1,r,n);else if("cubic-bezier"===t.name){var a=t.controlPoints;i=new Ae(a[0],a[1],a[2],a[3]).solve(Ge(e,1,r,n));}return i},Ze.parse=function(t,e){var r=t[0],n=t[1],i=t[2],a=t.slice(3);if(!Array.isArray(n)||0===n.length)return e.error("Expected an interpolation type expression.",1);if("linear"===n[0])n={name:"linear"};else if("exponential"===n[0]){var o=n[1];if("number"!=typeof o)return e.error("Exponential interpolation requires a numeric base.",1,1);n={name:"exponential",base:o};}else{if("cubic-bezier"!==n[0])return e.error("Unknown interpolation type "+String(n[0]),1,0);var s=n.slice(1);if(4!==s.length||s.some((function(t){return "number"!=typeof t||t<0||t>1})))return e.error("Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.",1);n={name:"cubic-bezier",controlPoints:s};}if(t.length-1<4)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if((t.length-1)%2!=0)return e.error("Expected an even number of arguments.");if(!(i=e.parse(i,2,Ot)))return null;var u=[],l=null;"interpolate-hcl"===r||"interpolate-lab"===r?l=Ut:e.expectedType&&"value"!==e.expectedType.kind&&(l=e.expectedType);for(var p=0;p<a.length;p+=2){var c=a[p],h=a[p+1],f=p+3,y=p+4;if("number"!=typeof c)return e.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.',f);if(u.length&&u[u.length-1][0]>=c)return e.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.',f);var d=e.parse(h,y,l);if(!d)return null;l=l||d.type,u.push([c,d]);}return "number"===l.kind||"color"===l.kind||"array"===l.kind&&"number"===l.itemType.kind&&"number"==typeof l.N?new Ze(l,r,n,i,u):e.error("Type "+Zt(l)+" is not interpolatable.")},Ze.prototype.evaluate=function(t){var e=this.labels,r=this.outputs;if(1===e.length)return r[0].evaluate(t);var n=this.input.evaluate(t);if(n<=e[0])return r[0].evaluate(t);var i=e.length;if(n>=e[i-1])return r[i-1].evaluate(t);var a=_e(e,n),o=e[a],s=e[a+1],u=Ze.interpolationFactor(this.interpolation,n,o,s),l=r[a].evaluate(t),p=r[a+1].evaluate(t);return "interpolate"===this.operator?Ie[this.type.kind.toLowerCase()](l,p,u):"interpolate-hcl"===this.operator?Ke.reverse(Ke.interpolate(Ke.forward(l),Ke.forward(p),u)):Ne.reverse(Ne.interpolate(Ne.forward(l),Ne.forward(p),u))},Ze.prototype.eachChild=function(t){t(this.input);for(var e=0,r=this.outputs;e<r.length;e+=1){t(r[e]);}},Ze.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.outputs.map((function(t){return t.possibleOutputs()})))},Ze.prototype.serialize=function(){var t;t="linear"===this.interpolation.name?["linear"]:"exponential"===this.interpolation.name?1===this.interpolation.base?["linear"]:["exponential",this.interpolation.base]:["cubic-bezier"].concat(this.interpolation.controlPoints);for(var e=[this.operator,t,this.input.serialize()],r=0;r<this.labels.length;r++)e.push(this.labels[r],this.outputs[r].serialize());return e};var Je=function(t,e){this.type=t,this.args=e;};Je.parse=function(t,e){if(t.length<2)return e.error("Expectected at least one argument.");var r=null,n=e.expectedType;n&&"value"!==n.kind&&(r=n);for(var i=[],a=0,o=t.slice(1);a<o.length;a+=1){var s=o[a],u=e.parse(s,1+i.length,r,void 0,{typeAnnotation:"omit"});if(!u)return null;r=r||u.type,i.push(u);}var l=n&&i.some((function(t){return Jt(n,t.type)}));return new Je(l?jt:r,i)},Je.prototype.evaluate=function(t){for(var e,r=null,n=0,i=0,a=this.args;i<a.length;i+=1){var o=a[i];if(n++,r=o.evaluate(t),"resolvedImage"!==o.type.kind||r.available||(e||(e=o.evaluate(t).name),r=null,n===this.args.length&&(r=e)),null!==r)break}return r},Je.prototype.eachChild=function(t){this.args.forEach(t);},Je.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.args.map((function(t){return t.possibleOutputs()})))},Je.prototype.serialize=function(){var t=["coalesce"];return this.eachChild((function(e){t.push(e.serialize());})),t};var He=function(t,e){this.type=e.type,this.bindings=[].concat(t),this.result=e;};He.prototype.evaluate=function(t){return this.result.evaluate(t)},He.prototype.eachChild=function(t){for(var e=0,r=this.bindings;e<r.length;e+=1){t(r[e][1]);}t(this.result);},He.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found "+(t.length-1)+" instead.");for(var r=[],n=1;n<t.length-1;n+=2){var i=t[n];if("string"!=typeof i)return e.error("Expected string, but found "+typeof i+" instead.",n);if(/[^a-zA-Z0-9_]/.test(i))return e.error("Variable names must contain only alphanumeric characters or '_'.",n);var a=e.parse(t[n+1],n+1);if(!a)return null;r.push([i,a]);}var o=e.parse(t[t.length-1],t.length-1,e.expectedType,r);return o?new He(r,o):null},He.prototype.possibleOutputs=function(){return this.result.possibleOutputs()},He.prototype.serialize=function(){for(var t=["let"],e=0,r=this.bindings;e<r.length;e+=1){var n=r[e],i=n[0],a=n[1];t.push(i,a.serialize());}return t.push(this.result.serialize()),t};var Ye=function(t,e,r){this.type=t,this.index=e,this.input=r;};Ye.parse=function(t,e){if(3!==t.length)return e.error("Expected 2 arguments, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1,Ot),n=e.parse(t[2],2,Xt(e.expectedType||jt));if(!r||!n)return null;var i=n.type;return new Ye(i.itemType,r,n)},Ye.prototype.evaluate=function(t){var e=this.index.evaluate(t),r=this.input.evaluate(t);if(e<0)throw new ae("Array index out of bounds: "+e+" < 0.");if(e>=r.length)throw new ae("Array index out of bounds: "+e+" > "+(r.length-1)+".");if(e!==Math.floor(e))throw new ae("Array index must be an integer, but found "+e+" instead.");return r[e]},Ye.prototype.eachChild=function(t){t(this.index),t(this.input);},Ye.prototype.possibleOutputs=function(){return [void 0]},Ye.prototype.serialize=function(){return ["at",this.index.serialize(),this.input.serialize()]};var $e=function(t,e,r,n,i,a){this.inputType=t,this.type=e,this.input=r,this.cases=n,this.outputs=i,this.otherwise=a;};$e.parse=function(t,e){if(t.length<5)return e.error("Expected at least 4 arguments, but found only "+(t.length-1)+".");if(t.length%2!=1)return e.error("Expected an even number of arguments.");var r,n;e.expectedType&&"value"!==e.expectedType.kind&&(n=e.expectedType);for(var i={},a=[],o=2;o<t.length-1;o+=2){var s=t[o],u=t[o+1];Array.isArray(s)||(s=[s]);var l=e.concat(o);if(0===s.length)return l.error("Expected at least one branch label.");for(var p=0,c=s;p<c.length;p+=1){var h=c[p];if("number"!=typeof h&&"string"!=typeof h)return l.error("Branch labels must be numbers or strings.");if("number"==typeof h&&Math.abs(h)>Number.MAX_SAFE_INTEGER)return l.error("Branch labels must be integers no larger than "+Number.MAX_SAFE_INTEGER+".");if("number"==typeof h&&Math.floor(h)!==h)return l.error("Numeric branch labels must be integer values.");if(r){if(l.checkSubtype(r,re(h)))return null}else r=re(h);if(void 0!==i[String(h)])return l.error("Branch labels must be unique.");i[String(h)]=a.length;}var f=e.parse(u,o,n);if(!f)return null;n=n||f.type,a.push(f);}var y=e.parse(t[1],1,jt);if(!y)return null;var d=e.parse(t[t.length-1],t.length-1,n);return d?"value"!==y.type.kind&&e.concat(1).checkSubtype(r,y.type)?null:new $e(r,n,y,i,a,d):null},$e.prototype.evaluate=function(t){var e=this.input.evaluate(t);return (re(e)===this.inputType&&this.outputs[this.cases[e]]||this.otherwise).evaluate(t)},$e.prototype.eachChild=function(t){t(this.input),this.outputs.forEach(t),t(this.otherwise);},$e.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.outputs.map((function(t){return t.possibleOutputs()}))).concat(this.otherwise.possibleOutputs())},$e.prototype.serialize=function(){for(var t=this,e=["match",this.input.serialize()],r=[],n={},i=0,a=Object.keys(this.cases).sort();i<a.length;i+=1){var o=a[i];void 0===(c=n[this.cases[o]])?(n[this.cases[o]]=r.length,r.push([this.cases[o],[o]])):r[c][1].push(o);}for(var s=function(e){return "number"===t.inputType.kind?Number(e):e},u=0,l=r;u<l.length;u+=1){var p=l[u],c=p[0],h=p[1];1===h.length?e.push(s(h[0])):e.push(h.map(s)),e.push(this.outputs[outputIndex$1].serialize());}return e.push(this.otherwise.serialize()),e};var We=function(t,e,r){this.type=t,this.branches=e,this.otherwise=r;};function Qe(t,e){return "=="===t||"!="===t?"boolean"===e.kind||"string"===e.kind||"number"===e.kind||"null"===e.kind||"value"===e.kind:"string"===e.kind||"number"===e.kind||"value"===e.kind}function tr(t,e,r,n){return 0===n.compare(e,r)}function er(t,e,r){var n="=="!==t&&"!="!==t;return function(){function i(t,e,r){this.type=Dt,this.lhs=t,this.rhs=e,this.collator=r,this.hasUntypedArgument="value"===t.type.kind||"value"===e.type.kind;}return i.parse=function(t,e){if(3!==t.length&&4!==t.length)return e.error("Expected two or three arguments.");var r=t[0],a=e.parse(t[1],1,jt);if(!a)return null;if(!Qe(r,a.type))return e.concat(1).error('"'+r+"\" comparisons are not supported for type '"+Zt(a.type)+"'.");var o=e.parse(t[2],2,jt);if(!o)return null;if(!Qe(r,o.type))return e.concat(2).error('"'+r+"\" comparisons are not supported for type '"+Zt(o.type)+"'.");if(a.type.kind!==o.type.kind&&"value"!==a.type.kind&&"value"!==o.type.kind)return e.error("Cannot compare types '"+Zt(a.type)+"' and '"+Zt(o.type)+"'.");n&&("value"===a.type.kind&&"value"!==o.type.kind?a=new se(o.type,[a]):"value"!==a.type.kind&&"value"===o.type.kind&&(o=new se(a.type,[o])));var s=null;if(4===t.length){if("string"!==a.type.kind&&"string"!==o.type.kind&&"value"!==a.type.kind&&"value"!==o.type.kind)return e.error("Cannot use collator to compare non-string types.");if(!(s=e.parse(t[3],3,qt)))return null}return new i(a,o,s)},i.prototype.evaluate=function(i){var a=this.lhs.evaluate(i),o=this.rhs.evaluate(i);if(n&&this.hasUntypedArgument){var s=re(a),u=re(o);if(s.kind!==u.kind||"string"!==s.kind&&"number"!==s.kind)throw new ae('Expected arguments for "'+t+'" to be (string, string) or (number, number), but found ('+s.kind+", "+u.kind+") instead.")}if(this.collator&&!n&&this.hasUntypedArgument){var l=re(a),p=re(o);if("string"!==l.kind||"string"!==p.kind)return e(i,a,o)}return this.collator?r(i,a,o,this.collator.evaluate(i)):e(i,a,o)},i.prototype.eachChild=function(t){t(this.lhs),t(this.rhs),this.collator&&t(this.collator);},i.prototype.possibleOutputs=function(){return [!0,!1]},i.prototype.serialize=function(){var e=[t];return this.eachChild((function(t){e.push(t.serialize());})),e},i}()}We.parse=function(t,e){if(t.length<4)return e.error("Expected at least 3 arguments, but found only "+(t.length-1)+".");if(t.length%2!=0)return e.error("Expected an odd number of arguments.");var r;e.expectedType&&"value"!==e.expectedType.kind&&(r=e.expectedType);for(var n=[],i=1;i<t.length-1;i+=2){var a=e.parse(t[i],i,Dt);if(!a)return null;var o=e.parse(t[i+1],i+1,r);if(!o)return null;n.push([a,o]),r=r||o.type;}var s=e.parse(t[t.length-1],t.length-1,r);return s?new We(r,n,s):null},We.prototype.evaluate=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var n=r[e],i=n[0],a=n[1];if(i.evaluate(t))return a.evaluate(t)}return this.otherwise.evaluate(t)},We.prototype.eachChild=function(t){for(var e=0,r=this.branches;e<r.length;e+=1){var n=r[e],i=n[0],a=n[1];t(i),t(a);}t(this.otherwise);},We.prototype.possibleOutputs=function(){var t;return (t=[]).concat.apply(t,this.branches.map((function(t){t[0];return t[1].possibleOutputs()}))).concat(this.otherwise.possibleOutputs())},We.prototype.serialize=function(){var t=["case"];return this.eachChild((function(e){t.push(e.serialize());})),t};var rr=er("==",(function(t,e,r){return e===r}),tr),nr=er("!=",(function(t,e,r){return e!==r}),(function(t,e,r,n){return !tr(0,e,r,n)})),ir=er("<",(function(t,e,r){return e<r}),(function(t,e,r,n){return n.compare(e,r)<0})),ar=er(">",(function(t,e,r){return e>r}),(function(t,e,r,n){return n.compare(e,r)>0})),or=er("<=",(function(t,e,r){return e<=r}),(function(t,e,r,n){return n.compare(e,r)<=0})),sr=er(">=",(function(t,e,r){return e>=r}),(function(t,e,r,n){return n.compare(e,r)>=0})),ur=function(t,e,r,n,i){this.type=Lt,this.number=t,this.locale=e,this.currency=r,this.minFractionDigits=n,this.maxFractionDigits=i;};ur.parse=function(t,e){if(3!==t.length)return e.error("Expected two arguments.");var r=e.parse(t[1],1,Ot);if(!r)return null;var n=t[2];if("object"!=typeof n||Array.isArray(n))return e.error("NumberFormat options argument must be an object.");var i=null;if(n.locale&&!(i=e.parse(n.locale,1,Lt)))return null;var a=null;if(n.currency&&!(a=e.parse(n.currency,1,Lt)))return null;var o=null;if(n["min-fraction-digits"]&&!(o=e.parse(n["min-fraction-digits"],1,Ot)))return null;var s=null;return n["max-fraction-digits"]&&!(s=e.parse(n["max-fraction-digits"],1,Ot))?null:new ur(r,i,a,o,s)},ur.prototype.evaluate=function(t){return new Intl.NumberFormat(this.locale?this.locale.evaluate(t):[],{style:this.currency?"currency":"decimal",currency:this.currency?this.currency.evaluate(t):void 0,minimumFractionDigits:this.minFractionDigits?this.minFractionDigits.evaluate(t):void 0,maximumFractionDigits:this.maxFractionDigits?this.maxFractionDigits.evaluate(t):void 0}).format(this.number.evaluate(t))},ur.prototype.eachChild=function(t){t(this.number),this.locale&&t(this.locale),this.currency&&t(this.currency),this.minFractionDigits&&t(this.minFractionDigits),this.maxFractionDigits&&t(this.maxFractionDigits);},ur.prototype.possibleOutputs=function(){return [void 0]},ur.prototype.serialize=function(){var t={};return this.locale&&(t.locale=this.locale.serialize()),this.currency&&(t.currency=this.currency.serialize()),this.minFractionDigits&&(t["min-fraction-digits"]=this.minFractionDigits.serialize()),this.maxFractionDigits&&(t["max-fraction-digits"]=this.maxFractionDigits.serialize()),["number-format",this.number.serialize(),t]};var lr=function(t){this.type=Ot,this.input=t;};lr.parse=function(t,e){if(2!==t.length)return e.error("Expected 1 argument, but found "+(t.length-1)+" instead.");var r=e.parse(t[1],1);return r?"array"!==r.type.kind&&"string"!==r.type.kind&&"value"!==r.type.kind?e.error("Expected argument of type string or array, but found "+Zt(r.type)+" instead."):new lr(r):null},lr.prototype.evaluate=function(t){var e=this.input.evaluate(t);if("string"==typeof e)return e.length;if(Array.isArray(e))return e.length;throw new ae("Expected value to be of type string or array, but found "+Zt(re(e))+" instead.")},lr.prototype.eachChild=function(t){t(this.input);},lr.prototype.possibleOutputs=function(){return [void 0]},lr.prototype.serialize=function(){var t=["length"];return this.eachChild((function(e){t.push(e.serialize());})),t};var pr={"==":rr,"!=":nr,">":ar,"<":ir,">=":sr,"<=":or,array:se,at:Ye,boolean:se,case:We,coalesce:Je,collator:de,format:ue,image:le,interpolate:Ze,"interpolate-hcl":Ze,"interpolate-lab":Ze,length:lr,let:He,literal:ie,match:$e,number:se,"number-format":ur,object:se,step:we,string:se,"to-boolean":ce,"to-color":ce,"to-number":ce,"to-string":ce,var:xe};function cr(t,e){var r=e[0],n=e[1],i=e[2],a=e[3];r=r.evaluate(t),n=n.evaluate(t),i=i.evaluate(t);var o=a?a.evaluate(t):1,s=ee(r,n,i,o);if(s)throw new ae(s);return new Yt(r/255*o,n/255*o,i/255*o,o)}function hr(t,e){return t in e}function fr(t,e){var r=e[t];return void 0===r?null:r}function yr(t){return {type:t}}function dr(t){return {result:"success",value:t}}function mr(t){return {result:"error",value:t}}function vr(t){return "data-driven"===t["property-type"]||"cross-faded-data-driven"===t["property-type"]}function gr(t){return !!t.expression&&t.expression.parameters.indexOf("zoom")>-1}function xr(t){return !!t.expression&&t.expression.interpolated}function br(t){return t instanceof Number?"number":t instanceof String?"string":t instanceof Boolean?"boolean":Array.isArray(t)?"array":null===t?"null":typeof t}function _r(t){return "object"==typeof t&&null!==t&&!Array.isArray(t)}function wr(t){return t}function Ar(t,e,r){return void 0!==t?t:void 0!==e?e:void 0!==r?r:void 0}function kr(t,e,r,n,i){return Ar(typeof r===i?n[r]:void 0,t.default,e.default)}function Sr(t,e,r){if("number"!==br(r))return Ar(t.default,e.default);var n=t.stops.length;if(1===n)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[n-1][0])return t.stops[n-1][1];var i=_e(t.stops.map((function(t){return t[0]})),r);return t.stops[i][1]}function Ir(t,e,r){var n=void 0!==t.base?t.base:1;if("number"!==br(r))return Ar(t.default,e.default);var i=t.stops.length;if(1===i)return t.stops[0][1];if(r<=t.stops[0][0])return t.stops[0][1];if(r>=t.stops[i-1][0])return t.stops[i-1][1];var a=_e(t.stops.map((function(t){return t[0]})),r),o=function(t,e,r,n){var i=n-r,a=t-r;return 0===i?0:1===e?a/i:(Math.pow(e,a)-1)/(Math.pow(e,i)-1)}(r,n,t.stops[a][0],t.stops[a+1][0]),s=t.stops[a][1],u=t.stops[a+1][1],l=Ie[e.type]||wr;if(t.colorSpace&&"rgb"!==t.colorSpace){var p=Xe[t.colorSpace];l=function(t,e){return p.reverse(p.interpolate(p.forward(t),p.forward(e),o))};}return "function"==typeof s.evaluate?{evaluate:function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];var r=s.evaluate.apply(void 0,t),n=u.evaluate.apply(void 0,t);if(void 0!==r&&void 0!==n)return l(r,n,o)}}:l(s,u,o)}function zr(t,e,r){return "color"===e.type?r=Yt.parse(r):"formatted"===e.type?r=Qt.fromString(r.toString()):"resolvedImage"===e.type?r=te.fromString(r.toString()):br(r)===e.type||"enum"===e.type&&e.values[r]||(r=void 0),Ar(r,t.default,e.default)}ye.register(pr,{error:[{kind:"error"},[Lt],function(t,e){var r=e[0];throw new ae(r.evaluate(t))}],typeof:[Lt,[jt],function(t,e){return Zt(re(e[0].evaluate(t)))}],"to-rgba":[Xt(Ot,4),[Ut],function(t,e){return e[0].evaluate(t).toArray()}],rgb:[Ut,[Ot,Ot,Ot],cr],rgba:[Ut,[Ot,Ot,Ot,Ot],cr],has:{type:Dt,overloads:[[[Lt],function(t,e){return hr(e[0].evaluate(t),t.properties())}],[[Lt,Rt],function(t,e){var r=e[0],n=e[1];return hr(r.evaluate(t),n.evaluate(t))}]]},get:{type:jt,overloads:[[[Lt],function(t,e){return fr(e[0].evaluate(t),t.properties())}],[[Lt,Rt],function(t,e){var r=e[0],n=e[1];return fr(r.evaluate(t),n.evaluate(t))}]]},"feature-state":[jt,[Lt],function(t,e){return fr(e[0].evaluate(t),t.featureState||{})}],properties:[Rt,[],function(t){return t.properties()}],"geometry-type":[Lt,[],function(t){return t.geometryType()}],id:[jt,[],function(t){return t.id()}],zoom:[Ot,[],function(t){return t.globals.zoom}],"heatmap-density":[Ot,[],function(t){return t.globals.heatmapDensity||0}],"line-progress":[Ot,[],function(t){return t.globals.lineProgress||0}],accumulated:[jt,[],function(t){return void 0===t.globals.accumulated?null:t.globals.accumulated}],"+":[Ot,yr(Ot),function(t,e){for(var r=0,n=0,i=e;n<i.length;n+=1){r+=i[n].evaluate(t);}return r}],"*":[Ot,yr(Ot),function(t,e){for(var r=1,n=0,i=e;n<i.length;n+=1){r*=i[n].evaluate(t);}return r}],"-":{type:Ot,overloads:[[[Ot,Ot],function(t,e){var r=e[0],n=e[1];return r.evaluate(t)-n.evaluate(t)}],[[Ot],function(t,e){return -e[0].evaluate(t)}]]},"/":[Ot,[Ot,Ot],function(t,e){var r=e[0],n=e[1];return r.evaluate(t)/n.evaluate(t)}],"%":[Ot,[Ot,Ot],function(t,e){var r=e[0],n=e[1];return r.evaluate(t)%n.evaluate(t)}],ln2:[Ot,[],function(){return Math.LN2}],pi:[Ot,[],function(){return Math.PI}],e:[Ot,[],function(){return Math.E}],"^":[Ot,[Ot,Ot],function(t,e){var r=e[0],n=e[1];return Math.pow(r.evaluate(t),n.evaluate(t))}],sqrt:[Ot,[Ot],function(t,e){var r=e[0];return Math.sqrt(r.evaluate(t))}],log10:[Ot,[Ot],function(t,e){var r=e[0];return Math.log(r.evaluate(t))/Math.LN10}],ln:[Ot,[Ot],function(t,e){var r=e[0];return Math.log(r.evaluate(t))}],log2:[Ot,[Ot],function(t,e){var r=e[0];return Math.log(r.evaluate(t))/Math.LN2}],sin:[Ot,[Ot],function(t,e){var r=e[0];return Math.sin(r.evaluate(t))}],cos:[Ot,[Ot],function(t,e){var r=e[0];return Math.cos(r.evaluate(t))}],tan:[Ot,[Ot],function(t,e){var r=e[0];return Math.tan(r.evaluate(t))}],asin:[Ot,[Ot],function(t,e){var r=e[0];return Math.asin(r.evaluate(t))}],acos:[Ot,[Ot],function(t,e){var r=e[0];return Math.acos(r.evaluate(t))}],atan:[Ot,[Ot],function(t,e){var r=e[0];return Math.atan(r.evaluate(t))}],min:[Ot,yr(Ot),function(t,e){return Math.min.apply(Math,e.map((function(e){return e.evaluate(t)})))}],max:[Ot,yr(Ot),function(t,e){return Math.max.apply(Math,e.map((function(e){return e.evaluate(t)})))}],abs:[Ot,[Ot],function(t,e){var r=e[0];return Math.abs(r.evaluate(t))}],round:[Ot,[Ot],function(t,e){var r=e[0].evaluate(t);return r<0?-Math.round(-r):Math.round(r)}],floor:[Ot,[Ot],function(t,e){var r=e[0];return Math.floor(r.evaluate(t))}],ceil:[Ot,[Ot],function(t,e){var r=e[0];return Math.ceil(r.evaluate(t))}],"filter-==":[Dt,[Lt,jt],function(t,e){var r=e[0],n=e[1];return t.properties()[r.value]===n.value}],"filter-id-==":[Dt,[jt],function(t,e){var r=e[0];return t.id()===r.value}],"filter-type-==":[Dt,[Lt],function(t,e){var r=e[0];return t.geometryType()===r.value}],"filter-<":[Dt,[Lt,jt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i<a}],"filter-id-<":[Dt,[jt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n<i}],"filter->":[Dt,[Lt,jt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i>a}],"filter-id->":[Dt,[jt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n>i}],"filter-<=":[Dt,[Lt,jt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i<=a}],"filter-id-<=":[Dt,[jt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n<=i}],"filter->=":[Dt,[Lt,jt],function(t,e){var r=e[0],n=e[1],i=t.properties()[r.value],a=n.value;return typeof i==typeof a&&i>=a}],"filter-id->=":[Dt,[jt],function(t,e){var r=e[0],n=t.id(),i=r.value;return typeof n==typeof i&&n>=i}],"filter-has":[Dt,[jt],function(t,e){return e[0].value in t.properties()}],"filter-has-id":[Dt,[],function(t){return null!==t.id()}],"filter-type-in":[Dt,[Xt(Lt)],function(t,e){return e[0].value.indexOf(t.geometryType())>=0}],"filter-id-in":[Dt,[Xt(jt)],function(t,e){return e[0].value.indexOf(t.id())>=0}],"filter-in-small":[Dt,[Lt,Xt(jt)],function(t,e){var r=e[0];return e[1].value.indexOf(t.properties()[r.value])>=0}],"filter-in-large":[Dt,[Lt,Xt(jt)],function(t,e){var r=e[0],n=e[1];return function(t,e,r,n){for(;r<=n;){var i=r+n>>1;if(e[i]===t)return !0;e[i]>t?n=i-1:r=i+1;}return !1}(t.properties()[r.value],n.value,0,n.value.length-1)}],all:{type:Dt,overloads:[[[Dt,Dt],function(t,e){var r=e[0],n=e[1];return r.evaluate(t)&&n.evaluate(t)}],[yr(Dt),function(t,e){for(var r=0,n=e;r<n.length;r+=1){if(!n[r].evaluate(t))return !1}return !0}]]},any:{type:Dt,overloads:[[[Dt,Dt],function(t,e){var r=e[0],n=e[1];return r.evaluate(t)||n.evaluate(t)}],[yr(Dt),function(t,e){for(var r=0,n=e;r<n.length;r+=1){if(n[r].evaluate(t))return !0}return !1}]]},"!":[Dt,[Dt],function(t,e){return !e[0].evaluate(t)}],"is-supported-script":[Dt,[Lt],function(t,e){var r=e[0],n=t.globals&&t.globals.isSupportedScript;return !n||n(r.evaluate(t))}],upcase:[Lt,[Lt],function(t,e){return e[0].evaluate(t).toUpperCase()}],downcase:[Lt,[Lt],function(t,e){return e[0].evaluate(t).toLowerCase()}],concat:[Lt,yr(jt),function(t,e){return e.map((function(e){return ne(e.evaluate(t))})).join("")}],"resolved-locale":[Lt,[qt],function(t,e){return e[0].evaluate(t).resolvedLocale()}]});var Cr=function(t,e){this.expression=t,this._warningHistory={},this._evaluator=new fe,this._defaultValue=e?function(t){return "color"===t.type&&_r(t.default)?new Yt(0,0,0,0):"color"===t.type?Yt.parse(t.default)||null:void 0===t.default?null:t.default}(e):null,this._enumValues=e&&"enum"===e.type?e.values:null;};function Br(t){return Array.isArray(t)&&t.length>0&&"string"==typeof t[0]&&t[0]in pr}function Pr(t,e){var r=new be(pr,[],e?function(t){var e={color:Ut,string:Lt,number:Ot,enum:Lt,boolean:Dt,formatted:Nt,resolvedImage:Kt};if("array"===t.type)return Xt(e[t.value]||jt,t.length);return e[t.type]}(e):void 0),n=r.parse(t,void 0,void 0,void 0,e&&"string"===e.type?{typeAnnotation:"coerce"}:void 0);return n?dr(new Cr(n,e)):mr(r.errors)}Cr.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i){return this._evaluator.globals=t,this._evaluator.feature=e,this._evaluator.featureState=r,this._evaluator.availableImages=n||null,this._evaluator.formattedSection=i,this.expression.evaluate(this._evaluator)},Cr.prototype.evaluate=function(t,e,r,n,i){this._evaluator.globals=t,this._evaluator.feature=e||null,this._evaluator.featureState=r||null,this._evaluator.availableImages=n||null,this._evaluator.formattedSection=i||null;try{var a=this.expression.evaluate(this._evaluator);if(null==a)return this._defaultValue;if(this._enumValues&&!(a in this._enumValues))throw new ae("Expected value to be one of "+Object.keys(this._enumValues).map((function(t){return JSON.stringify(t)})).join(", ")+", but found "+JSON.stringify(a)+" instead.");return a}catch(t){return this._warningHistory[t.message]||(this._warningHistory[t.message]=!0,"undefined"!=typeof console&&console.warn(t.message)),this._defaultValue}};var Er=function(t,e){this.kind=t,this._styleExpression=e,this.isStateDependent="constant"!==t&&!ve(e.expression);};Er.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,n,i)},Er.prototype.evaluate=function(t,e,r,n,i){return this._styleExpression.evaluate(t,e,r,n,i)};var Mr=function(t,e,r,n){this.kind=t,this.zoomStops=r,this._styleExpression=e,this.isStateDependent="camera"!==t&&!ve(e.expression),this.interpolationType=n;};function Tr(t,e){if("error"===(t=Pr(t,e)).result)return t;var r=t.value.expression,n=me(r);if(!n&&!vr(e))return mr([new Tt("","data expressions not supported")]);var i=ge(r,["zoom"]);if(!i&&!gr(e))return mr([new Tt("","zoom expressions not supported")]);var a=function t(e){var r=null;if(e instanceof He)r=t(e.result);else if(e instanceof Je)for(var n=0,i=e.args;n<i.length;n+=1){var a=i[n];if(r=t(a))break}else(e instanceof we||e instanceof Ze)&&e.input instanceof ye&&"zoom"===e.input.name&&(r=e);if(r instanceof Tt)return r;e.eachChild((function(e){var n=t(e);n instanceof Tt?r=n:!r&&n?r=new Tt("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.'):r&&n&&r!==n&&(r=new Tt("",'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.'));}));return r}(r);if(!a&&!i)return mr([new Tt("",'"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')]);if(a instanceof Tt)return mr([a]);if(a instanceof Ze&&!xr(e))return mr([new Tt("",'"interpolate" expressions cannot be used with this property')]);if(!a)return dr(new Er(n?"constant":"source",t.value));var o=a instanceof Ze?a.interpolation:void 0;return dr(new Mr(n?"camera":"composite",t.value,a.labels,o))}Mr.prototype.evaluateWithoutErrorHandling=function(t,e,r,n,i){return this._styleExpression.evaluateWithoutErrorHandling(t,e,r,n,i)},Mr.prototype.evaluate=function(t,e,r,n,i){return this._styleExpression.evaluate(t,e,r,n,i)},Mr.prototype.interpolationFactor=function(t,e,r){return this.interpolationType?Ze.interpolationFactor(this.interpolationType,t,e,r):0};var Vr=function(t,e){this._parameters=t,this._specification=e,Bt(this,function t(e,r){var n,i,a,o="color"===r.type,s=e.stops&&"object"==typeof e.stops[0][0],u=s||void 0!==e.property,l=s||!u,p=e.type||(xr(r)?"exponential":"interval");if(o&&((e=Bt({},e)).stops&&(e.stops=e.stops.map((function(t){return [t[0],Yt.parse(t[1])]}))),e.default?e.default=Yt.parse(e.default):e.default=Yt.parse(r.default)),e.colorSpace&&"rgb"!==e.colorSpace&&!Xe[e.colorSpace])throw new Error("Unknown color space: "+e.colorSpace);if("exponential"===p)n=Ir;else if("interval"===p)n=Sr;else if("categorical"===p){n=kr,i=Object.create(null);for(var c=0,h=e.stops;c<h.length;c+=1){var f=h[c];i[f[0]]=f[1];}a=typeof e.stops[0][0];}else{if("identity"!==p)throw new Error('Unknown function type "'+p+'"');n=zr;}if(s){for(var y={},d=[],m=0;m<e.stops.length;m++){var v=e.stops[m],g=v[0].zoom;void 0===y[g]&&(y[g]={zoom:g,type:e.type,property:e.property,default:e.default,stops:[]},d.push(g)),y[g].stops.push([v[0].value,v[1]]);}for(var x=[],b=0,_=d;b<_.length;b+=1){var w=_[b];x.push([y[w].zoom,t(y[w],r)]);}var A={name:"linear"};return {kind:"composite",interpolationType:A,interpolationFactor:Ze.interpolationFactor.bind(void 0,A),zoomStops:x.map((function(t){return t[0]})),evaluate:function(t,n){var i=t.zoom;return Ir({stops:x,base:e.base},r,i).evaluate(i,n)}}}if(l){var k="exponential"===p?{name:"exponential",base:void 0!==e.base?e.base:1}:null;return {kind:"camera",interpolationType:k,interpolationFactor:Ze.interpolationFactor.bind(void 0,k),zoomStops:e.stops.map((function(t){return t[0]})),evaluate:function(t){var o=t.zoom;return n(e,r,o,i,a)}}}return {kind:"source",evaluate:function(t,o){var s=o&&o.properties?o.properties[e.property]:void 0;return void 0===s?Ar(e.default,r.default):n(e,r,s,i,a)}}}(this._parameters,this._specification));};function Fr(t){var e=t.key,r=t.value,n=t.valueSpec||{},i=t.objectElementValidators||{},a=t.style,o=t.styleSpec,s=[],u=br(r);if("object"!==u)return [new zt(e,r,"object expected, "+u+" found")];for(var l in r){var p=l.split(".")[0],c=n[p]||n["*"],h=void 0;if(i[p])h=i[p];else if(n[p])h=on;else if(i["*"])h=i["*"];else{if(!n["*"]){s.push(new zt(e,r[l],'unknown property "'+l+'"'));continue}h=on;}s=s.concat(h({key:(e?e+".":e)+l,value:r[l],valueSpec:c,style:a,styleSpec:o,object:r,objectKey:l},r));}for(var f in n)i[f]||n[f].required&&void 0===n[f].default&&void 0===r[f]&&s.push(new zt(e,r,'missing required property "'+f+'"'));return s}function Or(t){var e=t.value,r=t.valueSpec,n=t.style,i=t.styleSpec,a=t.key,o=t.arrayElementValidator||on;if("array"!==br(e))return [new zt(a,e,"array expected, "+br(e)+" found")];if(r.length&&e.length!==r.length)return [new zt(a,e,"array length "+r.length+" expected, length "+e.length+" found")];if(r["min-length"]&&e.length<r["min-length"])return [new zt(a,e,"array length at least "+r["min-length"]+" expected, length "+e.length+" found")];var s={type:r.value,values:r.values};i.$version<7&&(s.function=r.function),"object"===br(r.value)&&(s=r.value);for(var u=[],l=0;l<e.length;l++)u=u.concat(o({array:e,arrayIndex:l,value:e[l],valueSpec:s,style:n,styleSpec:i,key:a+"["+l+"]"}));return u}function Lr(t){var e=t.key,r=t.value,n=t.valueSpec,i=br(r);return "number"!==i?[new zt(e,r,"number expected, "+i+" found")]:"minimum"in n&&r<n.minimum?[new zt(e,r,r+" is less than the minimum value "+n.minimum)]:"maximum"in n&&r>n.maximum?[new zt(e,r,r+" is greater than the maximum value "+n.maximum)]:[]}function Dr(t){var e,r,n,i=t.valueSpec,a=Et(t.value.type),o={},s="categorical"!==a&&void 0===t.value.property,u=!s,l="array"===br(t.value.stops)&&"array"===br(t.value.stops[0])&&"object"===br(t.value.stops[0][0]),p=Fr({key:t.key,value:t.value,valueSpec:t.styleSpec.function,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{stops:function(t){if("identity"===a)return [new zt(t.key,t.value,'identity function may not have a "stops" property')];var e=[],r=t.value;e=e.concat(Or({key:t.key,value:r,valueSpec:t.valueSpec,style:t.style,styleSpec:t.styleSpec,arrayElementValidator:c})),"array"===br(r)&&0===r.length&&e.push(new zt(t.key,r,"array must have at least one stop"));return e},default:function(t){return on({key:t.key,value:t.value,valueSpec:i,style:t.style,styleSpec:t.styleSpec})}}});return "identity"===a&&s&&p.push(new zt(t.key,t.value,'missing required property "property"')),"identity"===a||t.value.stops||p.push(new zt(t.key,t.value,'missing required property "stops"')),"exponential"===a&&t.valueSpec.expression&&!xr(t.valueSpec)&&p.push(new zt(t.key,t.value,"exponential functions not supported")),t.styleSpec.$version>=8&&(u&&!vr(t.valueSpec)?p.push(new zt(t.key,t.value,"property functions not supported")):s&&!gr(t.valueSpec)&&p.push(new zt(t.key,t.value,"zoom functions not supported"))),"categorical"!==a&&!l||void 0!==t.value.property||p.push(new zt(t.key,t.value,'"property" property is required')),p;function c(t){var e=[],a=t.value,s=t.key;if("array"!==br(a))return [new zt(s,a,"array expected, "+br(a)+" found")];if(2!==a.length)return [new zt(s,a,"array length 2 expected, length "+a.length+" found")];if(l){if("object"!==br(a[0]))return [new zt(s,a,"object expected, "+br(a[0])+" found")];if(void 0===a[0].zoom)return [new zt(s,a,"object stop key must have zoom")];if(void 0===a[0].value)return [new zt(s,a,"object stop key must have value")];if(n&&n>Et(a[0].zoom))return [new zt(s,a[0].zoom,"stop zoom values must appear in ascending order")];Et(a[0].zoom)!==n&&(n=Et(a[0].zoom),r=void 0,o={}),e=e.concat(Fr({key:s+"[0]",value:a[0],valueSpec:{zoom:{}},style:t.style,styleSpec:t.styleSpec,objectElementValidators:{zoom:Lr,value:h}}));}else e=e.concat(h({key:s+"[0]",value:a[0],valueSpec:{},style:t.style,styleSpec:t.styleSpec},a));return Br(Mt(a[1]))?e.concat([new zt(s+"[1]",a[1],"expressions are not allowed in function stops.")]):e.concat(on({key:s+"[1]",value:a[1],valueSpec:i,style:t.style,styleSpec:t.styleSpec}))}function h(t,n){var s=br(t.value),u=Et(t.value),l=null!==t.value?t.value:n;if(e){if(s!==e)return [new zt(t.key,l,s+" stop domain type must match previous stop domain type "+e)]}else e=s;if("number"!==s&&"string"!==s&&"boolean"!==s)return [new zt(t.key,l,"stop domain value must be a number, string, or boolean")];if("number"!==s&&"categorical"!==a){var p="number expected, "+s+" found";return vr(i)&&void 0===a&&(p+='\nIf you intended to use a categorical function, specify `"type": "categorical"`.'),[new zt(t.key,l,p)]}return "categorical"!==a||"number"!==s||isFinite(u)&&Math.floor(u)===u?"categorical"!==a&&"number"===s&&void 0!==r&&u<r?[new zt(t.key,l,"stop domain values must appear in ascending order")]:(r=u,"categorical"===a&&u in o?[new zt(t.key,l,"stop domain values must be unique")]:(o[u]=!0,[])):[new zt(t.key,l,"integer expected, found "+u)]}}function Ur(t){var e=("property"===t.expressionContext?Tr:Pr)(Mt(t.value),t.valueSpec);if("error"===e.result)return e.value.map((function(e){return new zt(""+t.key+e.key,t.value,e.message)}));var r=e.value.expression||e.value._styleExpression.expression;if("property"===t.expressionContext&&"text-font"===t.propertyKey&&-1!==r.possibleOutputs().indexOf(void 0))return [new zt(t.key,t.value,'Invalid data expression for "'+t.propertyKey+'". Output values must be contained as literals within the expression.')];if("property"===t.expressionContext&&"layout"===t.propertyType&&!ve(r))return [new zt(t.key,t.value,'"feature-state" data expressions are not supported with layout properties.')];if("filter"===t.expressionContext&&!ve(r))return [new zt(t.key,t.value,'"feature-state" data expressions are not supported with filters.')];if(t.expressionContext&&0===t.expressionContext.indexOf("cluster")){if(!ge(r,["zoom","feature-state"]))return [new zt(t.key,t.value,'"zoom" and "feature-state" expressions are not supported with cluster properties.')];if("cluster-initial"===t.expressionContext&&!me(r))return [new zt(t.key,t.value,"Feature data expressions are not supported with initial expression part of cluster properties.")]}return []}function Rr(t){var e=t.key,r=t.value,n=t.valueSpec,i=[];return Array.isArray(n.values)?-1===n.values.indexOf(Et(r))&&i.push(new zt(e,r,"expected one of ["+n.values.join(", ")+"], "+JSON.stringify(r)+" found")):-1===Object.keys(n.values).indexOf(Et(r))&&i.push(new zt(e,r,"expected one of ["+Object.keys(n.values).join(", ")+"], "+JSON.stringify(r)+" found")),i}function jr(t){if(!0===t||!1===t)return !0;if(!Array.isArray(t)||0===t.length)return !1;switch(t[0]){case"has":return t.length>=2&&"$id"!==t[1]&&"$type"!==t[1];case"in":case"!in":case"!has":case"none":return !1;case"==":case"!=":case">":case">=":case"<":case"<=":return 3!==t.length||Array.isArray(t[1])||Array.isArray(t[2]);case"any":case"all":for(var e=0,r=t.slice(1);e<r.length;e+=1){var n=r[e];if(!jr(n)&&"boolean"!=typeof n)return !1}return !0;default:return !0}}Vr.deserialize=function(t){return new Vr(t._parameters,t._specification)},Vr.serialize=function(t){return {_parameters:t._parameters,_specification:t._specification}};var qr={type:"boolean",default:!1,transition:!1,"property-type":"data-driven",expression:{interpolated:!1,parameters:["zoom","feature"]}};function Nr(t){if(null==t)return function(){return !0};jr(t)||(t=Xr(t));var e=Pr(t,qr);if("error"===e.result)throw new Error(e.value.map((function(t){return t.key+": "+t.message})).join(", "));return function(t,r){return e.value.evaluate(t,r)}}function Kr(t,e){return t<e?-1:t>e?1:0}function Xr(t){if(!t)return !0;var e,r=t[0];return t.length<=1?"any"!==r:"=="===r?Zr(t[1],t[2],"=="):"!="===r?Hr(Zr(t[1],t[2],"==")):"<"===r||">"===r||"<="===r||">="===r?Zr(t[1],t[2],r):"any"===r?(e=t.slice(1),["any"].concat(e.map(Xr))):"all"===r?["all"].concat(t.slice(1).map(Xr)):"none"===r?["all"].concat(t.slice(1).map(Xr).map(Hr)):"in"===r?Gr(t[1],t.slice(2)):"!in"===r?Hr(Gr(t[1],t.slice(2))):"has"===r?Jr(t[1]):"!has"!==r||Hr(Jr(t[1]))}function Zr(t,e,r){switch(t){case"$type":return ["filter-type-"+r,e];case"$id":return ["filter-id-"+r,e];default:return ["filter-"+r,t,e]}}function Gr(t,e){if(0===e.length)return !1;switch(t){case"$type":return ["filter-type-in",["literal",e]];case"$id":return ["filter-id-in",["literal",e]];default:return e.length>200&&!e.some((function(t){return typeof t!=typeof e[0]}))?["filter-in-large",t,["literal",e.sort(Kr)]]:["filter-in-small",t,["literal",e]]}}function Jr(t){switch(t){case"$type":return !0;case"$id":return ["filter-has-id"];default:return ["filter-has",t]}}function Hr(t){return ["!",t]}function Yr(t){return jr(Mt(t.value))?Ur(Bt({},t,{expressionContext:"filter",valueSpec:{value:"boolean"}})):function t(e){var r=e.value;var n=e.key;if("array"!==br(r))return [new zt(n,r,"array expected, "+br(r)+" found")];var i=e.styleSpec;var a;var o=[];if(r.length<1)return [new zt(n,r,"filter array must have at least 1 element")];o=o.concat(Rr({key:n+"[0]",value:r[0],valueSpec:i.filter_operator,style:e.style,styleSpec:e.styleSpec}));switch(Et(r[0])){case"<":case"<=":case">":case">=":r.length>=2&&"$type"===Et(r[1])&&o.push(new zt(n,r,'"$type" cannot be use with operator "'+r[0]+'"'));case"==":case"!=":3!==r.length&&o.push(new zt(n,r,'filter array for operator "'+r[0]+'" must have 3 elements'));case"in":case"!in":r.length>=2&&"string"!==(a=br(r[1]))&&o.push(new zt(n+"[1]",r[1],"string expected, "+a+" found"));for(var s=2;s<r.length;s++)a=br(r[s]),"$type"===Et(r[1])?o=o.concat(Rr({key:n+"["+s+"]",value:r[s],valueSpec:i.geometry_type,style:e.style,styleSpec:e.styleSpec})):"string"!==a&&"number"!==a&&"boolean"!==a&&o.push(new zt(n+"["+s+"]",r[s],"string, number, or boolean expected, "+a+" found"));break;case"any":case"all":case"none":for(var u=1;u<r.length;u++)o=o.concat(t({key:n+"["+u+"]",value:r[u],style:e.style,styleSpec:e.styleSpec}));break;case"has":case"!has":a=br(r[1]),2!==r.length?o.push(new zt(n,r,'filter array for "'+r[0]+'" operator must have 2 elements')):"string"!==a&&o.push(new zt(n+"[1]",r[1],"string expected, "+a+" found"));}return o}(t)}function $r(t,e){var r=t.key,n=t.style,i=t.styleSpec,a=t.value,o=t.objectKey,s=i[e+"_"+t.layerType];if(!s)return [];var u=o.match(/^(.*)-transition$/);if("paint"===e&&u&&s[u[1]]&&s[u[1]].transition)return on({key:r,value:a,valueSpec:i.transition,style:n,styleSpec:i});var l,p=t.valueSpec||s[o];if(!p)return [new zt(r,a,'unknown property "'+o+'"')];if("string"===br(a)&&vr(p)&&!p.tokens&&(l=/^{([^}]+)}$/.exec(a)))return [new zt(r,a,'"'+o+'" does not support interpolation syntax\nUse an identity property function instead: `{ "type": "identity", "property": '+JSON.stringify(l[1])+" }`.")];var c=[];return "symbol"===t.layerType&&("text-field"===o&&n&&!n.glyphs&&c.push(new zt(r,a,'use of "text-field" requires a style "glyphs" property')),"text-font"===o&&_r(Mt(a))&&"identity"===Et(a.type)&&c.push(new zt(r,a,'"text-font" does not support identity functions'))),c.concat(on({key:t.key,value:a,valueSpec:p,style:n,styleSpec:i,expressionContext:"property",propertyType:e,propertyKey:o}))}function Wr(t){return $r(t,"paint")}function Qr(t){return $r(t,"layout")}function tn(t){var e=[],r=t.value,n=t.key,i=t.style,a=t.styleSpec;r.type||r.ref||e.push(new zt(n,r,'either "type" or "ref" is required'));var o,s=Et(r.type),u=Et(r.ref);if(r.id)for(var l=Et(r.id),p=0;p<t.arrayIndex;p++){var c=i.layers[p];Et(c.id)===l&&e.push(new zt(n,r.id,'duplicate layer id "'+r.id+'", previously used at line '+c.id.__line__));}if("ref"in r)["type","source","source-layer","filter","layout"].forEach((function(t){t in r&&e.push(new zt(n,r[t],'"'+t+'" is prohibited for ref layers'));})),i.layers.forEach((function(t){Et(t.id)===u&&(o=t);})),o?o.ref?e.push(new zt(n,r.ref,"ref cannot reference another ref layer")):s=Et(o.type):e.push(new zt(n,r.ref,'ref layer "'+u+'" not found'));else if("background"!==s)if(r.source){var h=i.sources&&i.sources[r.source],f=h&&Et(h.type);h?"vector"===f&&"raster"===s?e.push(new zt(n,r.source,'layer "'+r.id+'" requires a raster source')):"raster"===f&&"raster"!==s?e.push(new zt(n,r.source,'layer "'+r.id+'" requires a vector source')):"vector"!==f||r["source-layer"]?"raster-dem"===f&&"hillshade"!==s?e.push(new zt(n,r.source,"raster-dem source can only be used with layer type 'hillshade'.")):"line"!==s||!r.paint||!r.paint["line-gradient"]||"geojson"===f&&h.lineMetrics||e.push(new zt(n,r,'layer "'+r.id+'" specifies a line-gradient, which requires a GeoJSON source with `lineMetrics` enabled.')):e.push(new zt(n,r,'layer "'+r.id+'" must specify a "source-layer"')):e.push(new zt(n,r.source,'source "'+r.source+'" not found'));}else e.push(new zt(n,r,'missing required property "source"'));return e=e.concat(Fr({key:n,value:r,valueSpec:a.layer,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(){return []},type:function(){return on({key:n+".type",value:r.type,valueSpec:a.layer.type,style:t.style,styleSpec:t.styleSpec,object:r,objectKey:"type"})},filter:Yr,layout:function(t){return Fr({layer:r,key:t.key,value:t.value,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(t){return Qr(Bt({layerType:s},t))}}})},paint:function(t){return Fr({layer:r,key:t.key,value:t.value,style:t.style,styleSpec:t.styleSpec,objectElementValidators:{"*":function(t){return Wr(Bt({layerType:s},t))}}})}}}))}function en(t){var e=t.value,r=t.key,n=t.styleSpec,i=t.style;if(!e.type)return [new zt(r,e,'"type" is required')];var a,o=Et(e.type);switch(o){case"vector":case"raster":case"raster-dem":return a=Fr({key:r,value:e,valueSpec:n["source_"+o.replace("-","_")],style:t.style,styleSpec:n});case"geojson":if(a=Fr({key:r,value:e,valueSpec:n.source_geojson,style:i,styleSpec:n}),e.cluster)for(var s in e.clusterProperties){var u=e.clusterProperties[s],l=u[0],p=u[1],c="string"==typeof l?[l,["accumulated"],["get",s]]:l;a.push.apply(a,Ur({key:r+"."+s+".map",value:p,expressionContext:"cluster-map"})),a.push.apply(a,Ur({key:r+"."+s+".reduce",value:c,expressionContext:"cluster-reduce"}));}return a;case"video":return Fr({key:r,value:e,valueSpec:n.source_video,style:i,styleSpec:n});case"image":return Fr({key:r,value:e,valueSpec:n.source_image,style:i,styleSpec:n});case"canvas":return [new zt(r,null,"Please use runtime APIs to add canvas sources, rather than including them in stylesheets.","source.canvas")];default:return Rr({key:r+".type",value:e.type,valueSpec:{values:["vector","raster","raster-dem","geojson","video","image"]},style:i,styleSpec:n})}}function rn(t){var e=t.value,r=t.styleSpec,n=r.light,i=t.style,a=[],o=br(e);if(void 0===e)return a;if("object"!==o)return a=a.concat([new zt("light",e,"object expected, "+o+" found")]);for(var s in e){var u=s.match(/^(.*)-transition$/);a=u&&n[u[1]]&&n[u[1]].transition?a.concat(on({key:s,value:e[s],valueSpec:r.transition,style:i,styleSpec:r})):n[s]?a.concat(on({key:s,value:e[s],valueSpec:n[s],style:i,styleSpec:r})):a.concat([new zt(s,e[s],'unknown property "'+s+'"')]);}return a}function nn(t){var e=t.value,r=t.key,n=br(e);return "string"!==n?[new zt(r,e,"string expected, "+n+" found")]:[]}var an={"*":function(){return []},array:Or,boolean:function(t){var e=t.value,r=t.key,n=br(e);return "boolean"!==n?[new zt(r,e,"boolean expected, "+n+" found")]:[]},number:Lr,color:function(t){var e=t.key,r=t.value,n=br(r);return "string"!==n?[new zt(e,r,"color expected, "+n+" found")]:null===Ht(r)?[new zt(e,r,'color expected, "'+r+'" found')]:[]},constants:Ct,enum:Rr,filter:Yr,function:Dr,layer:tn,object:Fr,source:en,light:rn,string:nn,formatted:function(t){return 0===nn(t).length?[]:Ur(t)},resolvedImage:function(t){return 0===nn(t).length?[]:Ur(t)}};function on(t){var e=t.value,r=t.valueSpec,n=t.styleSpec;return r.expression&&_r(Et(e))?Dr(t):r.expression&&Br(Mt(e))?Ur(t):r.type&&an[r.type]?an[r.type](t):Fr(Bt({},t,{valueSpec:r.type?n[r.type]:r}))}function sn(t){var e=t.value,r=t.key,n=nn(t);return n.length?n:(-1===e.indexOf("{fontstack}")&&n.push(new zt(r,e,'"glyphs" url must include a "{fontstack}" token')),-1===e.indexOf("{range}")&&n.push(new zt(r,e,'"glyphs" url must include a "{range}" token')),n)}function un(t,e){void 0===e&&(e=It);var r=[];return r=r.concat(on({key:"",value:t,valueSpec:e.$root,styleSpec:e,style:t,objectElementValidators:{glyphs:sn,"*":function(){return []}}})),t.constants&&(r=r.concat(Ct({key:"constants",value:t.constants,style:t,styleSpec:e}))),ln(r)}function ln(t){return [].concat(t).sort((function(t,e){return t.line-e.line}))}function pn(t){return function(){for(var e=[],r=arguments.length;r--;)e[r]=arguments[r];return ln(t.apply(this,e))}}un.source=pn(en),un.light=pn(rn),un.layer=pn(tn),un.filter=pn(Yr),un.paintProperty=pn(Wr),un.layoutProperty=pn(Qr);var cn=un,hn=cn.light,fn=cn.paintProperty,yn=cn.layoutProperty;function dn(t,e){var r=!1;if(e&&e.length)for(var n=0,i=e;n<i.length;n+=1){var a=i[n];t.fire(new kt(new Error(a.message))),r=!0;}return r}var mn=gn,vn=3;function gn(t,e,r){var n=this.cells=[];if(t instanceof ArrayBuffer){this.arrayBuffer=t;var i=new Int32Array(this.arrayBuffer);t=i[0],e=i[1],r=i[2],this.d=e+2*r;for(var a=0;a<this.d*this.d;a++){var o=i[vn+a],s=i[vn+a+1];n.push(o===s?null:i.subarray(o,s));}var u=i[vn+n.length],l=i[vn+n.length+1];this.keys=i.subarray(u,l),this.bboxes=i.subarray(l),this.insert=this._insertReadonly;}else{this.d=e+2*r;for(var p=0;p<this.d*this.d;p++)n.push([]);this.keys=[],this.bboxes=[];}this.n=e,this.extent=t,this.padding=r,this.scale=e/t,this.uid=0;var c=r/e*t;this.min=-c,this.max=t+c;}gn.prototype.insert=function(t,e,r,n,i){this._forEachCell(e,r,n,i,this._insertCell,this.uid++),this.keys.push(t),this.bboxes.push(e),this.bboxes.push(r),this.bboxes.push(n),this.bboxes.push(i);},gn.prototype._insertReadonly=function(){throw"Cannot insert into a GridIndex created from an ArrayBuffer."},gn.prototype._insertCell=function(t,e,r,n,i,a){this.cells[i].push(a);},gn.prototype.query=function(t,e,r,n,i){var a=this.min,o=this.max;if(t<=a&&e<=a&&o<=r&&o<=n&&!i)return Array.prototype.slice.call(this.keys);var s=[];return this._forEachCell(t,e,r,n,this._queryCell,s,{},i),s},gn.prototype._queryCell=function(t,e,r,n,i,a,o,s){var u=this.cells[i];if(null!==u)for(var l=this.keys,p=this.bboxes,c=0;c<u.length;c++){var h=u[c];if(void 0===o[h]){var f=4*h;(s?s(p[f+0],p[f+1],p[f+2],p[f+3]):t<=p[f+2]&&e<=p[f+3]&&r>=p[f+0]&&n>=p[f+1])?(o[h]=!0,a.push(l[h])):o[h]=!1;}}},gn.prototype._forEachCell=function(t,e,r,n,i,a,o,s){for(var u=this._convertToCellCoord(t),l=this._convertToCellCoord(e),p=this._convertToCellCoord(r),c=this._convertToCellCoord(n),h=u;h<=p;h++)for(var f=l;f<=c;f++){var y=this.d*f+h;if((!s||s(this._convertFromCellCoord(h),this._convertFromCellCoord(f),this._convertFromCellCoord(h+1),this._convertFromCellCoord(f+1)))&&i.call(this,t,e,r,n,y,a,o,s))return}},gn.prototype._convertFromCellCoord=function(t){return (t-this.padding)/this.scale},gn.prototype._convertToCellCoord=function(t){return Math.max(0,Math.min(this.d-1,Math.floor(t*this.scale)+this.padding))},gn.prototype.toArrayBuffer=function(){if(this.arrayBuffer)return this.arrayBuffer;for(var t=this.cells,e=vn+this.cells.length+1+1,r=0,n=0;n<this.cells.length;n++)r+=this.cells[n].length;var i=new Int32Array(e+r+this.keys.length+this.bboxes.length);i[0]=this.extent,i[1]=this.n,i[2]=this.padding;for(var a=e,o=0;o<t.length;o++){var s=t[o];i[vn+o]=a,i.set(s,a),a+=s.length;}return i[vn+t.length]=a,i.set(this.keys,a),a+=this.keys.length,i[vn+t.length+1]=a,i.set(this.bboxes,a),a+=this.bboxes.length,i.buffer};var xn=self.ImageData,bn={};function _n(t,e,r){void 0===r&&(r={}),Object.defineProperty(e,"_classRegistryKey",{value:t,writeable:!1}),bn[t]={klass:e,omit:r.omit||[],shallow:r.shallow||[]};}for(var wn in _n("Object",Object),mn.serialize=function(t,e){var r=t.toArrayBuffer();return e&&e.push(r),{buffer:r}},mn.deserialize=function(t){return new mn(t.buffer)},_n("Grid",mn),_n("Color",Yt),_n("Error",Error),_n("ResolvedImage",te),_n("StylePropertyFunction",Vr),_n("StyleExpression",Cr,{omit:["_evaluator"]}),_n("ZoomDependentExpression",Mr),_n("ZoomConstantExpression",Er),_n("CompoundExpression",ye,{omit:["_evaluate"]}),pr)pr[wn]._classRegistryKey||_n("Expression_"+wn,pr[wn]);function An(t){return t&&"undefined"!=typeof ArrayBuffer&&(t instanceof ArrayBuffer||t.constructor&&"ArrayBuffer"===t.constructor.name)}function kn(t,e){if(null==t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp)return t;if(An(t))return e&&e.push(t),t;if(ArrayBuffer.isView(t)){var r=t;return e&&e.push(r.buffer),r}if(t instanceof xn)return e&&e.push(t.data.buffer),t;if(Array.isArray(t)){for(var n=[],i=0,a=t;i<a.length;i+=1){var o=a[i];n.push(kn(o,e));}return n}if("object"==typeof t){var s=t.constructor,u=s._classRegistryKey;if(!u)throw new Error("can't serialize object of unregistered class");var l=s.serialize?s.serialize(t,e):{};if(!s.serialize){for(var p in t)if(t.hasOwnProperty(p)&&!(bn[u].omit.indexOf(p)>=0)){var c=t[p];l[p]=bn[u].shallow.indexOf(p)>=0?c:kn(c,e);}t instanceof Error&&(l.message=t.message);}if(l.$name)throw new Error("$name property is reserved for worker serialization logic.");return "Object"!==u&&(l.$name=u),l}throw new Error("can't serialize object of type "+typeof t)}function Sn(t){if(null==t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||t instanceof Boolean||t instanceof Number||t instanceof String||t instanceof Date||t instanceof RegExp||An(t)||ArrayBuffer.isView(t)||t instanceof xn)return t;if(Array.isArray(t))return t.map(Sn);if("object"==typeof t){var e=t.$name||"Object",r=bn[e].klass;if(!r)throw new Error("can't deserialize unregistered class "+e);if(r.deserialize)return r.deserialize(t);for(var n=Object.create(r.prototype),i=0,a=Object.keys(t);i<a.length;i+=1){var o=a[i];if("$name"!==o){var s=t[o];n[o]=bn[e].shallow.indexOf(o)>=0?s:Sn(s);}}return n}throw new Error("can't deserialize object of type "+typeof t)}var In=function(){this.first=!0;};In.prototype.update=function(t,e){var r=Math.floor(t);return this.first?(this.first=!1,this.lastIntegerZoom=r,this.lastIntegerZoomTime=0,this.lastZoom=t,this.lastFloorZoom=r,!0):(this.lastFloorZoom>r?(this.lastIntegerZoom=r+1,this.lastIntegerZoomTime=e):this.lastFloorZoom<r&&(this.lastIntegerZoom=r,this.lastIntegerZoomTime=e),t!==this.lastZoom&&(this.lastZoom=t,this.lastFloorZoom=r,!0))};var zn={"Latin-1 Supplement":function(t){return t>=128&&t<=255},Arabic:function(t){return t>=1536&&t<=1791},"Arabic Supplement":function(t){return t>=1872&&t<=1919},"Arabic Extended-A":function(t){return t>=2208&&t<=2303},"Hangul Jamo":function(t){return t>=4352&&t<=4607},"Unified Canadian Aboriginal Syllabics":function(t){return t>=5120&&t<=5759},Khmer:function(t){return t>=6016&&t<=6143},"Unified Canadian Aboriginal Syllabics Extended":function(t){return t>=6320&&t<=6399},"General Punctuation":function(t){return t>=8192&&t<=8303},"Letterlike Symbols":function(t){return t>=8448&&t<=8527},"Number Forms":function(t){return t>=8528&&t<=8591},"Miscellaneous Technical":function(t){return t>=8960&&t<=9215},"Control Pictures":function(t){return t>=9216&&t<=9279},"Optical Character Recognition":function(t){return t>=9280&&t<=9311},"Enclosed Alphanumerics":function(t){return t>=9312&&t<=9471},"Geometric Shapes":function(t){return t>=9632&&t<=9727},"Miscellaneous Symbols":function(t){return t>=9728&&t<=9983},"Miscellaneous Symbols and Arrows":function(t){return t>=11008&&t<=11263},"CJK Radicals Supplement":function(t){return t>=11904&&t<=12031},"Kangxi Radicals":function(t){return t>=12032&&t<=12255},"Ideographic Description Characters":function(t){return t>=12272&&t<=12287},"CJK Symbols and Punctuation":function(t){return t>=12288&&t<=12351},Hiragana:function(t){return t>=12352&&t<=12447},Katakana:function(t){return t>=12448&&t<=12543},Bopomofo:function(t){return t>=12544&&t<=12591},"Hangul Compatibility Jamo":function(t){return t>=12592&&t<=12687},Kanbun:function(t){return t>=12688&&t<=12703},"Bopomofo Extended":function(t){return t>=12704&&t<=12735},"CJK Strokes":function(t){return t>=12736&&t<=12783},"Katakana Phonetic Extensions":function(t){return t>=12784&&t<=12799},"Enclosed CJK Letters and Months":function(t){return t>=12800&&t<=13055},"CJK Compatibility":function(t){return t>=13056&&t<=13311},"CJK Unified Ideographs Extension A":function(t){return t>=13312&&t<=19903},"Yijing Hexagram Symbols":function(t){return t>=19904&&t<=19967},"CJK Unified Ideographs":function(t){return t>=19968&&t<=40959},"Yi Syllables":function(t){return t>=40960&&t<=42127},"Yi Radicals":function(t){return t>=42128&&t<=42191},"Hangul Jamo Extended-A":function(t){return t>=43360&&t<=43391},"Hangul Syllables":function(t){return t>=44032&&t<=55215},"Hangul Jamo Extended-B":function(t){return t>=55216&&t<=55295},"Private Use Area":function(t){return t>=57344&&t<=63743},"CJK Compatibility Ideographs":function(t){return t>=63744&&t<=64255},"Arabic Presentation Forms-A":function(t){return t>=64336&&t<=65023},"Vertical Forms":function(t){return t>=65040&&t<=65055},"CJK Compatibility Forms":function(t){return t>=65072&&t<=65103},"Small Form Variants":function(t){return t>=65104&&t<=65135},"Arabic Presentation Forms-B":function(t){return t>=65136&&t<=65279},"Halfwidth and Fullwidth Forms":function(t){return t>=65280&&t<=65519}};function Cn(t){for(var e=0,r=t;e<r.length;e+=1){if(Pn(r[e].charCodeAt(0)))return !0}return !1}function Bn(t){return !zn.Arabic(t)&&(!zn["Arabic Supplement"](t)&&(!zn["Arabic Extended-A"](t)&&(!zn["Arabic Presentation Forms-A"](t)&&!zn["Arabic Presentation Forms-B"](t))))}function Pn(t){return 746===t||747===t||!(t<4352)&&(!!zn["Bopomofo Extended"](t)||(!!zn.Bopomofo(t)||(!(!zn["CJK Compatibility Forms"](t)||t>=65097&&t<=65103)||(!!zn["CJK Compatibility Ideographs"](t)||(!!zn["CJK Compatibility"](t)||(!!zn["CJK Radicals Supplement"](t)||(!!zn["CJK Strokes"](t)||(!(!zn["CJK Symbols and Punctuation"](t)||t>=12296&&t<=12305||t>=12308&&t<=12319||12336===t)||(!!zn["CJK Unified Ideographs Extension A"](t)||(!!zn["CJK Unified Ideographs"](t)||(!!zn["Enclosed CJK Letters and Months"](t)||(!!zn["Hangul Compatibility Jamo"](t)||(!!zn["Hangul Jamo Extended-A"](t)||(!!zn["Hangul Jamo Extended-B"](t)||(!!zn["Hangul Jamo"](t)||(!!zn["Hangul Syllables"](t)||(!!zn.Hiragana(t)||(!!zn["Ideographic Description Characters"](t)||(!!zn.Kanbun(t)||(!!zn["Kangxi Radicals"](t)||(!!zn["Katakana Phonetic Extensions"](t)||(!(!zn.Katakana(t)||12540===t)||(!(!zn["Halfwidth and Fullwidth Forms"](t)||65288===t||65289===t||65293===t||t>=65306&&t<=65310||65339===t||65341===t||65343===t||t>=65371&&t<=65503||65507===t||t>=65512&&t<=65519)||(!(!zn["Small Form Variants"](t)||t>=65112&&t<=65118||t>=65123&&t<=65126)||(!!zn["Unified Canadian Aboriginal Syllabics"](t)||(!!zn["Unified Canadian Aboriginal Syllabics Extended"](t)||(!!zn["Vertical Forms"](t)||(!!zn["Yijing Hexagram Symbols"](t)||(!!zn["Yi Syllables"](t)||!!zn["Yi Radicals"](t))))))))))))))))))))))))))))))}function En(t){return !(Pn(t)||function(t){return !(!zn["Latin-1 Supplement"](t)||167!==t&&169!==t&&174!==t&&177!==t&&188!==t&&189!==t&&190!==t&&215!==t&&247!==t)||(!(!zn["General Punctuation"](t)||8214!==t&&8224!==t&&8225!==t&&8240!==t&&8241!==t&&8251!==t&&8252!==t&&8258!==t&&8263!==t&&8264!==t&&8265!==t&&8273!==t)||(!!zn["Letterlike Symbols"](t)||(!!zn["Number Forms"](t)||(!(!zn["Miscellaneous Technical"](t)||!(t>=8960&&t<=8967||t>=8972&&t<=8991||t>=8996&&t<=9e3||9003===t||t>=9085&&t<=9114||t>=9150&&t<=9165||9167===t||t>=9169&&t<=9179||t>=9186&&t<=9215))||(!(!zn["Control Pictures"](t)||9251===t)||(!!zn["Optical Character Recognition"](t)||(!!zn["Enclosed Alphanumerics"](t)||(!!zn["Geometric Shapes"](t)||(!(!zn["Miscellaneous Symbols"](t)||t>=9754&&t<=9759)||(!(!zn["Miscellaneous Symbols and Arrows"](t)||!(t>=11026&&t<=11055||t>=11088&&t<=11097||t>=11192&&t<=11243))||(!!zn["CJK Symbols and Punctuation"](t)||(!!zn.Katakana(t)||(!!zn["Private Use Area"](t)||(!!zn["CJK Compatibility Forms"](t)||(!!zn["Small Form Variants"](t)||(!!zn["Halfwidth and Fullwidth Forms"](t)||(8734===t||8756===t||8757===t||t>=9984&&t<=10087||t>=10102&&t<=10131||65532===t||65533===t)))))))))))))))))}(t))}function Mn(t,e){return !(!e&&(t>=1424&&t<=2303||zn["Arabic Presentation Forms-A"](t)||zn["Arabic Presentation Forms-B"](t)))&&!(t>=2304&&t<=3583||t>=3840&&t<=4255||zn.Khmer(t))}var Tn,Vn="unavailable",Fn="loading",On="loaded",Ln="error",Dn=Vn,Un=null,Rn=new St,jn={applyArabicShaping:null,processBidirectionalText:null,processStyledBidirectionalText:null,isLoaded:function(){return Dn===On||null!=jn.applyArabicShaping}},qn=function(t,e){this.zoom=t,e?(this.now=e.now,this.fadeDuration=e.fadeDuration,this.zoomHistory=e.zoomHistory,this.transition=e.transition):(this.now=0,this.fadeDuration=0,this.zoomHistory=new In,this.transition={});};qn.prototype.isSupportedScript=function(t){return function(t,e){for(var r=0,n=t;r<n.length;r+=1){if(!Mn(n[r].charCodeAt(0),e))return !1}return !0}(t,jn.isLoaded())},qn.prototype.crossFadingFactor=function(){return 0===this.fadeDuration?1:Math.min((this.now-this.zoomHistory.lastIntegerZoomTime)/this.fadeDuration,1)},qn.prototype.getCrossfadeParameters=function(){var t=this.zoom,e=t-Math.floor(t),r=this.crossFadingFactor();return t>this.zoomHistory.lastIntegerZoom?{fromScale:2,toScale:1,t:e+(1-e)*r}:{fromScale:.5,toScale:1,t:1-(1-r)*e}};var Nn=function(t,e){this.property=t,this.value=e,this.expression=function(t,e){if(_r(t))return new Vr(t,e);if(Br(t)){var r=Tr(t,e);if("error"===r.result)throw new Error(r.value.map((function(t){return t.key+": "+t.message})).join(", "));return r.value}var n=t;return "string"==typeof t&&"color"===e.type&&(n=Yt.parse(t)),{kind:"constant",evaluate:function(){return n}}}(void 0===e?t.specification.default:e,t.specification);};Nn.prototype.isDataDriven=function(){return "source"===this.expression.kind||"composite"===this.expression.kind},Nn.prototype.possiblyEvaluate=function(t,e){return this.property.possiblyEvaluate(this,t,e)};var Kn=function(t){this.property=t,this.value=new Nn(t,void 0);};Kn.prototype.transitioned=function(t,e){return new Zn(this.property,this.value,e,c({},t.transition,this.transition),t.now)},Kn.prototype.untransitioned=function(){return new Zn(this.property,this.value,null,{},0)};var Xn=function(t){this._properties=t,this._values=Object.create(t.defaultTransitionablePropertyValues);};Xn.prototype.getValue=function(t){return b(this._values[t].value.value)},Xn.prototype.setValue=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new Kn(this._values[t].property)),this._values[t].value=new Nn(this._values[t].property,null===e?void 0:b(e));},Xn.prototype.getTransition=function(t){return b(this._values[t].transition)},Xn.prototype.setTransition=function(t,e){this._values.hasOwnProperty(t)||(this._values[t]=new Kn(this._values[t].property)),this._values[t].transition=b(e)||void 0;},Xn.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e],i=this.getValue(n);void 0!==i&&(t[n]=i);var a=this.getTransition(n);void 0!==a&&(t[n+"-transition"]=a);}return t},Xn.prototype.transitioned=function(t,e){for(var r=new Gn(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].transitioned(t,e._values[a]);}return r},Xn.prototype.untransitioned=function(){for(var t=new Gn(this._properties),e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e];t._values[n]=this._values[n].untransitioned();}return t};var Zn=function(t,e,r,n,i){this.property=t,this.value=e,this.begin=i+n.delay||0,this.end=this.begin+n.duration||0,t.specification.transition&&(n.delay||n.duration)&&(this.prior=r);};Zn.prototype.possiblyEvaluate=function(t,e){var r=t.now||0,n=this.value.possiblyEvaluate(t,e),i=this.prior;if(i){if(r>this.end)return this.prior=null,n;if(this.value.isDataDriven())return this.prior=null,n;if(r<this.begin)return i.possiblyEvaluate(t,e);var a=(r-this.begin)/(this.end-this.begin);return this.property.interpolate(i.possiblyEvaluate(t,e),n,function(t){if(t<=0)return 0;if(t>=1)return 1;var e=t*t,r=e*t;return 4*(t<.5?r:3*(t-e)+r-.75)}(a))}return n};var Gn=function(t){this._properties=t,this._values=Object.create(t.defaultTransitioningPropertyValues);};Gn.prototype.possiblyEvaluate=function(t,e){for(var r=new Yn(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].possiblyEvaluate(t,e);}return r},Gn.prototype.hasTransition=function(){for(var t=0,e=Object.keys(this._values);t<e.length;t+=1){var r=e[t];if(this._values[r].prior)return !0}return !1};var Jn=function(t){this._properties=t,this._values=Object.create(t.defaultPropertyValues);};Jn.prototype.getValue=function(t){return b(this._values[t].value)},Jn.prototype.setValue=function(t,e){this._values[t]=new Nn(this._values[t].property,null===e?void 0:b(e));},Jn.prototype.serialize=function(){for(var t={},e=0,r=Object.keys(this._values);e<r.length;e+=1){var n=r[e],i=this.getValue(n);void 0!==i&&(t[n]=i);}return t},Jn.prototype.possiblyEvaluate=function(t,e){for(var r=new Yn(this._properties),n=0,i=Object.keys(this._values);n<i.length;n+=1){var a=i[n];r._values[a]=this._values[a].possiblyEvaluate(t,e);}return r};var Hn=function(t,e,r){this.property=t,this.value=e,this.parameters=r;};Hn.prototype.isConstant=function(){return "constant"===this.value.kind},Hn.prototype.constantOr=function(t){return "constant"===this.value.kind?this.value.value:t},Hn.prototype.evaluate=function(t,e,r){return this.property.evaluate(this.value,this.parameters,t,e,r)};var Yn=function(t){this._properties=t,this._values=Object.create(t.defaultPossiblyEvaluatedValues);};Yn.prototype.get=function(t){return this._values[t]};var $n=function(t){this.specification=t;};$n.prototype.possiblyEvaluate=function(t,e){return t.expression.evaluate(e)},$n.prototype.interpolate=function(t,e,r){var n=Ie[this.specification.type];return n?n(t,e,r):t};var Wn=function(t,e){this.specification=t,this.overrides=e;};Wn.prototype.possiblyEvaluate=function(t,e,r){return "constant"===t.expression.kind||"camera"===t.expression.kind?new Hn(this,{kind:"constant",value:t.expression.evaluate(e,null,{},r)},e):new Hn(this,t.expression,e)},Wn.prototype.interpolate=function(t,e,r){if("constant"!==t.value.kind||"constant"!==e.value.kind)return t;if(void 0===t.value.value||void 0===e.value.value)return new Hn(this,{kind:"constant",value:void 0},t.parameters);var n=Ie[this.specification.type];return n?new Hn(this,{kind:"constant",value:n(t.value.value,e.value.value,r)},t.parameters):t},Wn.prototype.evaluate=function(t,e,r,n,i){return "constant"===t.kind?t.value:t.evaluate(e,r,n,i)};var Qn=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.possiblyEvaluate=function(t,e,r){if(void 0===t.value)return new Hn(this,{kind:"constant",value:void 0},e);if("constant"===t.expression.kind){var n=t.expression.evaluate(e,null,{},r),i="resolvedImage"===t.property.specification.type&&"string"!=typeof n?n.name:n,a=this._calculate(i,i,i,e);return new Hn(this,{kind:"constant",value:a},e)}if("camera"===t.expression.kind){var o=this._calculate(t.expression.evaluate({zoom:e.zoom-1}),t.expression.evaluate({zoom:e.zoom}),t.expression.evaluate({zoom:e.zoom+1}),e);return new Hn(this,{kind:"constant",value:o},e)}return new Hn(this,t.expression,e)},e.prototype.evaluate=function(t,e,r,n,i){if("source"===t.kind){var a=t.evaluate(e,r,n,i);return this._calculate(a,a,a,e)}return "composite"===t.kind?this._calculate(t.evaluate({zoom:Math.floor(e.zoom)-1},r,n),t.evaluate({zoom:Math.floor(e.zoom)},r,n),t.evaluate({zoom:Math.floor(e.zoom)+1},r,n),e):t.value},e.prototype._calculate=function(t,e,r,n){return n.zoom>n.zoomHistory.lastIntegerZoom?{from:t,to:e}:{from:r,to:e}},e.prototype.interpolate=function(t){return t},e}(Wn),ti=function(t){this.specification=t;};ti.prototype.possiblyEvaluate=function(t,e,r){if(void 0!==t.value){if("constant"===t.expression.kind){var n=t.expression.evaluate(e,null,{},r);return this._calculate(n,n,n,e)}return this._calculate(t.expression.evaluate(new qn(Math.floor(e.zoom-1),e)),t.expression.evaluate(new qn(Math.floor(e.zoom),e)),t.expression.evaluate(new qn(Math.floor(e.zoom+1),e)),e)}},ti.prototype._calculate=function(t,e,r,n){return n.zoom>n.zoomHistory.lastIntegerZoom?{from:t,to:e}:{from:r,to:e}},ti.prototype.interpolate=function(t){return t};var ei=function(t){this.specification=t;};ei.prototype.possiblyEvaluate=function(t,e,r){return !!t.expression.evaluate(e,null,{},r)},ei.prototype.interpolate=function(){return !1};var ri=function(t){for(var e in this.properties=t,this.defaultPropertyValues={},this.defaultTransitionablePropertyValues={},this.defaultTransitioningPropertyValues={},this.defaultPossiblyEvaluatedValues={},this.overridableProperties=[],t){var r=t[e];r.specification.overridable&&this.overridableProperties.push(e);var n=this.defaultPropertyValues[e]=new Nn(r,void 0),i=this.defaultTransitionablePropertyValues[e]=new Kn(r);this.defaultTransitioningPropertyValues[e]=i.untransitioned(),this.defaultPossiblyEvaluatedValues[e]=n.possiblyEvaluate({});}};_n("DataDrivenProperty",Wn),_n("DataConstantProperty",$n),_n("CrossFadedDataDrivenProperty",Qn),_n("CrossFadedProperty",ti),_n("ColorRampProperty",ei);var ni=function(t){function e(e,r){if(t.call(this),this.id=e.id,this.type=e.type,this._featureFilter=function(){return !0},"custom"!==e.type&&(e=e,this.metadata=e.metadata,this.minzoom=e.minzoom,this.maxzoom=e.maxzoom,"background"!==e.type&&(this.source=e.source,this.sourceLayer=e["source-layer"],this.filter=e.filter),r.layout&&(this._unevaluatedLayout=new Jn(r.layout)),r.paint)){for(var n in this._transitionablePaint=new Xn(r.paint),e.paint)this.setPaintProperty(n,e.paint[n],{validate:!1});for(var i in e.layout)this.setLayoutProperty(i,e.layout[i],{validate:!1});this._transitioningPaint=this._transitionablePaint.untransitioned();}}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.getCrossfadeParameters=function(){return this._crossfadeParameters},e.prototype.getLayoutProperty=function(t){return "visibility"===t?this.visibility:this._unevaluatedLayout.getValue(t)},e.prototype.setLayoutProperty=function(t,e,r){if(void 0===r&&(r={}),null!=e){var n="layers."+this.id+".layout."+t;if(this._validate(yn,n,t,e,r))return}"visibility"!==t?this._unevaluatedLayout.setValue(t,e):this.visibility=e;},e.prototype.getPaintProperty=function(t){return v(t,"-transition")?this._transitionablePaint.getTransition(t.slice(0,-"-transition".length)):this._transitionablePaint.getValue(t)},e.prototype.setPaintProperty=function(t,e,r){if(void 0===r&&(r={}),null!=e){var n="layers."+this.id+".paint."+t;if(this._validate(fn,n,t,e,r))return !1}if(v(t,"-transition"))return this._transitionablePaint.setTransition(t.slice(0,-"-transition".length),e||void 0),!1;var i=this._transitionablePaint._values[t],a="cross-faded-data-driven"===i.property.specification["property-type"],o=i.value.isDataDriven(),s=i.value;this._transitionablePaint.setValue(t,e),this._handleSpecialPaintPropertyUpdate(t);var u=this._transitionablePaint._values[t].value;return u.isDataDriven()||o||a||this._handleOverridablePaintPropertyUpdate(t,s,u)},e.prototype._handleSpecialPaintPropertyUpdate=function(t){},e.prototype._handleOverridablePaintPropertyUpdate=function(t,e,r){return !1},e.prototype.isHidden=function(t){return !!(this.minzoom&&t<this.minzoom)||(!!(this.maxzoom&&t>=this.maxzoom)||"none"===this.visibility)},e.prototype.updateTransitions=function(t){this._transitioningPaint=this._transitionablePaint.transitioned(t,this._transitioningPaint);},e.prototype.hasTransition=function(){return this._transitioningPaint.hasTransition()},e.prototype.recalculate=function(t,e){t.getCrossfadeParameters&&(this._crossfadeParameters=t.getCrossfadeParameters()),this._unevaluatedLayout&&(this.layout=this._unevaluatedLayout.possiblyEvaluate(t,e)),this.paint=this._transitioningPaint.possiblyEvaluate(t,e);},e.prototype.serialize=function(){var t={id:this.id,type:this.type,source:this.source,"source-layer":this.sourceLayer,metadata:this.metadata,minzoom:this.minzoom,maxzoom:this.maxzoom,filter:this.filter,layout:this._unevaluatedLayout&&this._unevaluatedLayout.serialize(),paint:this._transitionablePaint&&this._transitionablePaint.serialize()};return this.visibility&&(t.layout=t.layout||{},t.layout.visibility=this.visibility),x(t,(function(t,e){return !(void 0===t||"layout"===e&&!Object.keys(t).length||"paint"===e&&!Object.keys(t).length)}))},e.prototype._validate=function(t,e,r,n,i){return void 0===i&&(i={}),(!i||!1!==i.validate)&&dn(this,t.call(cn,{key:e,layerType:this.type,objectKey:r,value:n,styleSpec:It,style:{glyphs:!0,sprite:!0}}))},e.prototype.is3D=function(){return !1},e.prototype.isTileClipped=function(){return !1},e.prototype.hasOffscreenPass=function(){return !1},e.prototype.resize=function(){},e.prototype.isStateDependent=function(){for(var t in this.paint._values){var e=this.paint.get(t);if(e instanceof Hn&&vr(e.property.specification)&&(("source"===e.value.kind||"composite"===e.value.kind)&&e.value.isStateDependent))return !0}return !1},e}(St),ii={Int8:Int8Array,Uint8:Uint8Array,Int16:Int16Array,Uint16:Uint16Array,Int32:Int32Array,Uint32:Uint32Array,Float32:Float32Array},ai=function(t,e){this._structArray=t,this._pos1=e*this.size,this._pos2=this._pos1/2,this._pos4=this._pos1/4,this._pos8=this._pos1/8;},oi=function(){this.isTransferred=!1,this.capacity=-1,this.resize(0);};function si(t,e){void 0===e&&(e=1);var r=0,n=0;return {members:t.map((function(t){var i,a=(i=t.type,ii[i].BYTES_PER_ELEMENT),o=r=ui(r,Math.max(e,a)),s=t.components||1;return n=Math.max(n,a),r+=a*s,{name:t.name,type:t.type,components:s,offset:o}})),size:ui(r,Math.max(n,e)),alignment:e}}function ui(t,e){return Math.ceil(t/e)*e}oi.serialize=function(t,e){return t._trim(),e&&(t.isTransferred=!0,e.push(t.arrayBuffer)),{length:t.length,arrayBuffer:t.arrayBuffer}},oi.deserialize=function(t){var e=Object.create(this.prototype);return e.arrayBuffer=t.arrayBuffer,e.length=t.length,e.capacity=t.arrayBuffer.byteLength/e.bytesPerElement,e._refreshViews(),e},oi.prototype._trim=function(){this.length!==this.capacity&&(this.capacity=this.length,this.arrayBuffer=this.arrayBuffer.slice(0,this.length*this.bytesPerElement),this._refreshViews());},oi.prototype.clear=function(){this.length=0;},oi.prototype.resize=function(t){this.reserve(t),this.length=t;},oi.prototype.reserve=function(t){if(t>this.capacity){this.capacity=Math.max(t,Math.floor(5*this.capacity),128),this.arrayBuffer=new ArrayBuffer(this.capacity*this.bytesPerElement);var e=this.uint8;this._refreshViews(),e&&this.uint8.set(e);}},oi.prototype._refreshViews=function(){throw new Error("_refreshViews() must be implemented by each concrete StructArray layout")};var li=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.int16[n+0]=e,this.int16[n+1]=r,t},e}(oi);li.prototype.bytesPerElement=4,_n("StructArrayLayout2i4",li);var pi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=4*t;return this.int16[a+0]=e,this.int16[a+1]=r,this.int16[a+2]=n,this.int16[a+3]=i,t},e}(oi);pi.prototype.bytesPerElement=8,_n("StructArrayLayout4i8",pi);var ci=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=6*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.int16[s+2]=n,this.int16[s+3]=i,this.int16[s+4]=a,this.int16[s+5]=o,t},e}(oi);ci.prototype.bytesPerElement=12,_n("StructArrayLayout2i4i12",ci);var hi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=4*t,u=8*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.uint8[u+4]=n,this.uint8[u+5]=i,this.uint8[u+6]=a,this.uint8[u+7]=o,t},e}(oi);hi.prototype.bytesPerElement=8,_n("StructArrayLayout2i4ub8",hi);var fi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s){var u=this.length;return this.resize(u+1),this.emplace(u,t,e,r,n,i,a,o,s)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u){var l=8*t;return this.uint16[l+0]=e,this.uint16[l+1]=r,this.uint16[l+2]=n,this.uint16[l+3]=i,this.uint16[l+4]=a,this.uint16[l+5]=o,this.uint16[l+6]=s,this.uint16[l+7]=u,t},e}(oi);fi.prototype.bytesPerElement=16,_n("StructArrayLayout8ui16",fi);var yi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s){var u=this.length;return this.resize(u+1),this.emplace(u,t,e,r,n,i,a,o,s)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u){var l=8*t;return this.int16[l+0]=e,this.int16[l+1]=r,this.int16[l+2]=n,this.int16[l+3]=i,this.uint16[l+4]=a,this.uint16[l+5]=o,this.uint16[l+6]=s,this.uint16[l+7]=u,t},e}(oi);yi.prototype.bytesPerElement=16,_n("StructArrayLayout4i4ui16",yi);var di=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.float32[i+0]=e,this.float32[i+1]=r,this.float32[i+2]=n,t},e}(oi);di.prototype.bytesPerElement=12,_n("StructArrayLayout3f12",di);var mi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){var r=1*t;return this.uint32[r+0]=e,t},e}(oi);mi.prototype.bytesPerElement=4,_n("StructArrayLayout1ul4",mi);var vi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p){var c=this.length;return this.resize(c+1),this.emplace(c,t,e,r,n,i,a,o,s,u,l,p)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c){var h=12*t,f=6*t;return this.int16[h+0]=e,this.int16[h+1]=r,this.int16[h+2]=n,this.int16[h+3]=i,this.int16[h+4]=a,this.int16[h+5]=o,this.uint32[f+3]=s,this.uint16[h+8]=u,this.uint16[h+9]=l,this.int16[h+10]=p,this.int16[h+11]=c,t},e}(oi);vi.prototype.bytesPerElement=24,_n("StructArrayLayout6i1ul2ui2i24",vi);var gi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a){var o=this.length;return this.resize(o+1),this.emplace(o,t,e,r,n,i,a)},e.prototype.emplace=function(t,e,r,n,i,a,o){var s=6*t;return this.int16[s+0]=e,this.int16[s+1]=r,this.int16[s+2]=n,this.int16[s+3]=i,this.int16[s+4]=a,this.int16[s+5]=o,t},e}(oi);gi.prototype.bytesPerElement=12,_n("StructArrayLayout2i2i2i12",gi);var xi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=12*t,o=3*t;return this.uint8[a+0]=e,this.uint8[a+1]=r,this.float32[o+1]=n,this.float32[o+2]=i,t},e}(oi);xi.prototype.bytesPerElement=12,_n("StructArrayLayout2ub2f12",xi);var bi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m){var v=this.length;return this.resize(v+1),this.emplace(v,t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v){var g=24*t,x=12*t,b=48*t;return this.int16[g+0]=e,this.int16[g+1]=r,this.uint16[g+2]=n,this.uint16[g+3]=i,this.uint32[x+2]=a,this.uint32[x+3]=o,this.uint32[x+4]=s,this.uint16[g+10]=u,this.uint16[g+11]=l,this.uint16[g+12]=p,this.float32[x+7]=c,this.float32[x+8]=h,this.uint8[b+36]=f,this.uint8[b+37]=y,this.uint8[b+38]=d,this.uint32[x+10]=m,this.int16[g+22]=v,t},e}(oi);bi.prototype.bytesPerElement=48,_n("StructArrayLayout2i2ui3ul3ui2f3ub1ul1i48",bi);var _i=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,_,w,A,k,S){var I=this.length;return this.resize(I+1),this.emplace(I,t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,_,w,A,k,S)},e.prototype.emplace=function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,_,w,A,k,S,I){var z=30*t,C=15*t;return this.int16[z+0]=e,this.int16[z+1]=r,this.int16[z+2]=n,this.int16[z+3]=i,this.int16[z+4]=a,this.int16[z+5]=o,this.int16[z+6]=s,this.int16[z+7]=u,this.uint16[z+8]=l,this.uint16[z+9]=p,this.uint16[z+10]=c,this.uint16[z+11]=h,this.uint16[z+12]=f,this.uint16[z+13]=y,this.uint16[z+14]=d,this.uint16[z+15]=m,this.uint16[z+16]=v,this.uint16[z+17]=g,this.uint16[z+18]=x,this.uint16[z+19]=b,this.uint16[z+20]=_,this.uint16[z+21]=w,this.uint32[C+11]=A,this.float32[C+12]=k,this.float32[C+13]=S,this.float32[C+14]=I,t},e}(oi);_i.prototype.bytesPerElement=60,_n("StructArrayLayout8i14ui1ul3f60",_i);var wi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){var r=1*t;return this.float32[r+0]=e,t},e}(oi);wi.prototype.bytesPerElement=4,_n("StructArrayLayout1f4",wi);var Ai=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.int16=new Int16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.int16[i+0]=e,this.int16[i+1]=r,this.int16[i+2]=n,t},e}(oi);Ai.prototype.bytesPerElement=6,_n("StructArrayLayout3i6",Ai);var ki=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint32=new Uint32Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=2*t,a=4*t;return this.uint32[i+0]=e,this.uint16[a+2]=r,this.uint16[a+3]=n,t},e}(oi);ki.prototype.bytesPerElement=8,_n("StructArrayLayout1ul2ui8",ki);var Si=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r){var n=this.length;return this.resize(n+1),this.emplace(n,t,e,r)},e.prototype.emplace=function(t,e,r,n){var i=3*t;return this.uint16[i+0]=e,this.uint16[i+1]=r,this.uint16[i+2]=n,t},e}(oi);Si.prototype.bytesPerElement=6,_n("StructArrayLayout3ui6",Si);var Ii=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.uint16[n+0]=e,this.uint16[n+1]=r,t},e}(oi);Ii.prototype.bytesPerElement=4,_n("StructArrayLayout2ui4",Ii);var zi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.uint16=new Uint16Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t){var e=this.length;return this.resize(e+1),this.emplace(e,t)},e.prototype.emplace=function(t,e){var r=1*t;return this.uint16[r+0]=e,t},e}(oi);zi.prototype.bytesPerElement=2,_n("StructArrayLayout1ui2",zi);var Ci=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e){var r=this.length;return this.resize(r+1),this.emplace(r,t,e)},e.prototype.emplace=function(t,e,r){var n=2*t;return this.float32[n+0]=e,this.float32[n+1]=r,t},e}(oi);Ci.prototype.bytesPerElement=8,_n("StructArrayLayout2f8",Ci);var Bi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._refreshViews=function(){this.uint8=new Uint8Array(this.arrayBuffer),this.float32=new Float32Array(this.arrayBuffer);},e.prototype.emplaceBack=function(t,e,r,n){var i=this.length;return this.resize(i+1),this.emplace(i,t,e,r,n)},e.prototype.emplace=function(t,e,r,n,i){var a=4*t;return this.float32[a+0]=e,this.float32[a+1]=r,this.float32[a+2]=n,this.float32[a+3]=i,t},e}(oi);Bi.prototype.bytesPerElement=16,_n("StructArrayLayout4f16",Bi);var Pi=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={anchorPointX:{configurable:!0},anchorPointY:{configurable:!0},x1:{configurable:!0},y1:{configurable:!0},x2:{configurable:!0},y2:{configurable:!0},featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0},radius:{configurable:!0},signedDistanceFromAnchor:{configurable:!0},anchorPoint:{configurable:!0}};return r.anchorPointX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorPointX.set=function(t){this._structArray.int16[this._pos2+0]=t;},r.anchorPointY.get=function(){return this._structArray.int16[this._pos2+1]},r.anchorPointY.set=function(t){this._structArray.int16[this._pos2+1]=t;},r.x1.get=function(){return this._structArray.int16[this._pos2+2]},r.x1.set=function(t){this._structArray.int16[this._pos2+2]=t;},r.y1.get=function(){return this._structArray.int16[this._pos2+3]},r.y1.set=function(t){this._structArray.int16[this._pos2+3]=t;},r.x2.get=function(){return this._structArray.int16[this._pos2+4]},r.x2.set=function(t){this._structArray.int16[this._pos2+4]=t;},r.y2.get=function(){return this._structArray.int16[this._pos2+5]},r.y2.set=function(t){this._structArray.int16[this._pos2+5]=t;},r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.featureIndex.set=function(t){this._structArray.uint32[this._pos4+3]=t;},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+8]},r.sourceLayerIndex.set=function(t){this._structArray.uint16[this._pos2+8]=t;},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.bucketIndex.set=function(t){this._structArray.uint16[this._pos2+9]=t;},r.radius.get=function(){return this._structArray.int16[this._pos2+10]},r.radius.set=function(t){this._structArray.int16[this._pos2+10]=t;},r.signedDistanceFromAnchor.get=function(){return this._structArray.int16[this._pos2+11]},r.signedDistanceFromAnchor.set=function(t){this._structArray.int16[this._pos2+11]=t;},r.anchorPoint.get=function(){return new i(this.anchorPointX,this.anchorPointY)},Object.defineProperties(e.prototype,r),e}(ai);Pi.prototype.size=24;var Ei=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.get=function(t){return new Pi(this,t)},e}(vi);_n("CollisionBoxArray",Ei);var Mi=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},glyphStartIndex:{configurable:!0},numGlyphs:{configurable:!0},vertexStartIndex:{configurable:!0},lineStartIndex:{configurable:!0},lineLength:{configurable:!0},segment:{configurable:!0},lowerSize:{configurable:!0},upperSize:{configurable:!0},lineOffsetX:{configurable:!0},lineOffsetY:{configurable:!0},writingMode:{configurable:!0},placedOrientation:{configurable:!0},hidden:{configurable:!0},crossTileID:{configurable:!0},associatedIconIndex:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorX.set=function(t){this._structArray.int16[this._pos2+0]=t;},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.anchorY.set=function(t){this._structArray.int16[this._pos2+1]=t;},r.glyphStartIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.glyphStartIndex.set=function(t){this._structArray.uint16[this._pos2+2]=t;},r.numGlyphs.get=function(){return this._structArray.uint16[this._pos2+3]},r.numGlyphs.set=function(t){this._structArray.uint16[this._pos2+3]=t;},r.vertexStartIndex.get=function(){return this._structArray.uint32[this._pos4+2]},r.vertexStartIndex.set=function(t){this._structArray.uint32[this._pos4+2]=t;},r.lineStartIndex.get=function(){return this._structArray.uint32[this._pos4+3]},r.lineStartIndex.set=function(t){this._structArray.uint32[this._pos4+3]=t;},r.lineLength.get=function(){return this._structArray.uint32[this._pos4+4]},r.lineLength.set=function(t){this._structArray.uint32[this._pos4+4]=t;},r.segment.get=function(){return this._structArray.uint16[this._pos2+10]},r.segment.set=function(t){this._structArray.uint16[this._pos2+10]=t;},r.lowerSize.get=function(){return this._structArray.uint16[this._pos2+11]},r.lowerSize.set=function(t){this._structArray.uint16[this._pos2+11]=t;},r.upperSize.get=function(){return this._structArray.uint16[this._pos2+12]},r.upperSize.set=function(t){this._structArray.uint16[this._pos2+12]=t;},r.lineOffsetX.get=function(){return this._structArray.float32[this._pos4+7]},r.lineOffsetX.set=function(t){this._structArray.float32[this._pos4+7]=t;},r.lineOffsetY.get=function(){return this._structArray.float32[this._pos4+8]},r.lineOffsetY.set=function(t){this._structArray.float32[this._pos4+8]=t;},r.writingMode.get=function(){return this._structArray.uint8[this._pos1+36]},r.writingMode.set=function(t){this._structArray.uint8[this._pos1+36]=t;},r.placedOrientation.get=function(){return this._structArray.uint8[this._pos1+37]},r.placedOrientation.set=function(t){this._structArray.uint8[this._pos1+37]=t;},r.hidden.get=function(){return this._structArray.uint8[this._pos1+38]},r.hidden.set=function(t){this._structArray.uint8[this._pos1+38]=t;},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+10]},r.crossTileID.set=function(t){this._structArray.uint32[this._pos4+10]=t;},r.associatedIconIndex.get=function(){return this._structArray.int16[this._pos2+22]},r.associatedIconIndex.set=function(t){this._structArray.int16[this._pos2+22]=t;},Object.defineProperties(e.prototype,r),e}(ai);Mi.prototype.size=48;var Ti=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.get=function(t){return new Mi(this,t)},e}(bi);_n("PlacedSymbolArray",Ti);var Vi=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={anchorX:{configurable:!0},anchorY:{configurable:!0},rightJustifiedTextSymbolIndex:{configurable:!0},centerJustifiedTextSymbolIndex:{configurable:!0},leftJustifiedTextSymbolIndex:{configurable:!0},verticalPlacedTextSymbolIndex:{configurable:!0},placedIconSymbolIndex:{configurable:!0},verticalPlacedIconSymbolIndex:{configurable:!0},key:{configurable:!0},textBoxStartIndex:{configurable:!0},textBoxEndIndex:{configurable:!0},verticalTextBoxStartIndex:{configurable:!0},verticalTextBoxEndIndex:{configurable:!0},iconBoxStartIndex:{configurable:!0},iconBoxEndIndex:{configurable:!0},verticalIconBoxStartIndex:{configurable:!0},verticalIconBoxEndIndex:{configurable:!0},featureIndex:{configurable:!0},numHorizontalGlyphVertices:{configurable:!0},numVerticalGlyphVertices:{configurable:!0},numIconVertices:{configurable:!0},numVerticalIconVertices:{configurable:!0},crossTileID:{configurable:!0},textBoxScale:{configurable:!0},textOffset0:{configurable:!0},textOffset1:{configurable:!0}};return r.anchorX.get=function(){return this._structArray.int16[this._pos2+0]},r.anchorX.set=function(t){this._structArray.int16[this._pos2+0]=t;},r.anchorY.get=function(){return this._structArray.int16[this._pos2+1]},r.anchorY.set=function(t){this._structArray.int16[this._pos2+1]=t;},r.rightJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+2]},r.rightJustifiedTextSymbolIndex.set=function(t){this._structArray.int16[this._pos2+2]=t;},r.centerJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+3]},r.centerJustifiedTextSymbolIndex.set=function(t){this._structArray.int16[this._pos2+3]=t;},r.leftJustifiedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+4]},r.leftJustifiedTextSymbolIndex.set=function(t){this._structArray.int16[this._pos2+4]=t;},r.verticalPlacedTextSymbolIndex.get=function(){return this._structArray.int16[this._pos2+5]},r.verticalPlacedTextSymbolIndex.set=function(t){this._structArray.int16[this._pos2+5]=t;},r.placedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+6]},r.placedIconSymbolIndex.set=function(t){this._structArray.int16[this._pos2+6]=t;},r.verticalPlacedIconSymbolIndex.get=function(){return this._structArray.int16[this._pos2+7]},r.verticalPlacedIconSymbolIndex.set=function(t){this._structArray.int16[this._pos2+7]=t;},r.key.get=function(){return this._structArray.uint16[this._pos2+8]},r.key.set=function(t){this._structArray.uint16[this._pos2+8]=t;},r.textBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+9]},r.textBoxStartIndex.set=function(t){this._structArray.uint16[this._pos2+9]=t;},r.textBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+10]},r.textBoxEndIndex.set=function(t){this._structArray.uint16[this._pos2+10]=t;},r.verticalTextBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+11]},r.verticalTextBoxStartIndex.set=function(t){this._structArray.uint16[this._pos2+11]=t;},r.verticalTextBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+12]},r.verticalTextBoxEndIndex.set=function(t){this._structArray.uint16[this._pos2+12]=t;},r.iconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+13]},r.iconBoxStartIndex.set=function(t){this._structArray.uint16[this._pos2+13]=t;},r.iconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+14]},r.iconBoxEndIndex.set=function(t){this._structArray.uint16[this._pos2+14]=t;},r.verticalIconBoxStartIndex.get=function(){return this._structArray.uint16[this._pos2+15]},r.verticalIconBoxStartIndex.set=function(t){this._structArray.uint16[this._pos2+15]=t;},r.verticalIconBoxEndIndex.get=function(){return this._structArray.uint16[this._pos2+16]},r.verticalIconBoxEndIndex.set=function(t){this._structArray.uint16[this._pos2+16]=t;},r.featureIndex.get=function(){return this._structArray.uint16[this._pos2+17]},r.featureIndex.set=function(t){this._structArray.uint16[this._pos2+17]=t;},r.numHorizontalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+18]},r.numHorizontalGlyphVertices.set=function(t){this._structArray.uint16[this._pos2+18]=t;},r.numVerticalGlyphVertices.get=function(){return this._structArray.uint16[this._pos2+19]},r.numVerticalGlyphVertices.set=function(t){this._structArray.uint16[this._pos2+19]=t;},r.numIconVertices.get=function(){return this._structArray.uint16[this._pos2+20]},r.numIconVertices.set=function(t){this._structArray.uint16[this._pos2+20]=t;},r.numVerticalIconVertices.get=function(){return this._structArray.uint16[this._pos2+21]},r.numVerticalIconVertices.set=function(t){this._structArray.uint16[this._pos2+21]=t;},r.crossTileID.get=function(){return this._structArray.uint32[this._pos4+11]},r.crossTileID.set=function(t){this._structArray.uint32[this._pos4+11]=t;},r.textBoxScale.get=function(){return this._structArray.float32[this._pos4+12]},r.textBoxScale.set=function(t){this._structArray.float32[this._pos4+12]=t;},r.textOffset0.get=function(){return this._structArray.float32[this._pos4+13]},r.textOffset0.set=function(t){this._structArray.float32[this._pos4+13]=t;},r.textOffset1.get=function(){return this._structArray.float32[this._pos4+14]},r.textOffset1.set=function(t){this._structArray.float32[this._pos4+14]=t;},Object.defineProperties(e.prototype,r),e}(ai);Vi.prototype.size=60;var Fi=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.get=function(t){return new Vi(this,t)},e}(_i);_n("SymbolInstanceArray",Fi);var Oi=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={offsetX:{configurable:!0}};return r.offsetX.get=function(){return this._structArray.float32[this._pos4+0]},r.offsetX.set=function(t){this._structArray.float32[this._pos4+0]=t;},Object.defineProperties(e.prototype,r),e}(ai);Oi.prototype.size=4;var Li=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.getoffsetX=function(t){return this.float32[1*t+0]},e.prototype.get=function(t){return new Oi(this,t)},e}(wi);_n("GlyphOffsetArray",Li);var Di=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={x:{configurable:!0},y:{configurable:!0},tileUnitDistanceFromAnchor:{configurable:!0}};return r.x.get=function(){return this._structArray.int16[this._pos2+0]},r.x.set=function(t){this._structArray.int16[this._pos2+0]=t;},r.y.get=function(){return this._structArray.int16[this._pos2+1]},r.y.set=function(t){this._structArray.int16[this._pos2+1]=t;},r.tileUnitDistanceFromAnchor.get=function(){return this._structArray.int16[this._pos2+2]},r.tileUnitDistanceFromAnchor.set=function(t){this._structArray.int16[this._pos2+2]=t;},Object.defineProperties(e.prototype,r),e}(ai);Di.prototype.size=6;var Ui=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.getx=function(t){return this.int16[3*t+0]},e.prototype.gety=function(t){return this.int16[3*t+1]},e.prototype.gettileUnitDistanceFromAnchor=function(t){return this.int16[3*t+2]},e.prototype.get=function(t){return new Di(this,t)},e}(Ai);_n("SymbolLineVertexArray",Ui);var Ri=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={featureIndex:{configurable:!0},sourceLayerIndex:{configurable:!0},bucketIndex:{configurable:!0}};return r.featureIndex.get=function(){return this._structArray.uint32[this._pos4+0]},r.featureIndex.set=function(t){this._structArray.uint32[this._pos4+0]=t;},r.sourceLayerIndex.get=function(){return this._structArray.uint16[this._pos2+2]},r.sourceLayerIndex.set=function(t){this._structArray.uint16[this._pos2+2]=t;},r.bucketIndex.get=function(){return this._structArray.uint16[this._pos2+3]},r.bucketIndex.set=function(t){this._structArray.uint16[this._pos2+3]=t;},Object.defineProperties(e.prototype,r),e}(ai);Ri.prototype.size=8;var ji=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.get=function(t){return new Ri(this,t)},e}(ki);_n("FeatureIndexArray",ji);var qi=si([{name:"a_pos",components:2,type:"Int16"}],4).members,Ni=function(t){void 0===t&&(t=[]),this.segments=t;};function Ki(t,e){return 256*(t=l(Math.floor(t),0,255))+(e=l(Math.floor(e),0,255))}Ni.prototype.prepareSegment=function(t,e,r,n){var i=this.segments[this.segments.length-1];return t>Ni.MAX_VERTEX_ARRAY_LENGTH&&w("Max vertices per segment is "+Ni.MAX_VERTEX_ARRAY_LENGTH+": bucket requested "+t),(!i||i.vertexLength+t>Ni.MAX_VERTEX_ARRAY_LENGTH||i.sortKey!==n)&&(i={vertexOffset:e.length,primitiveOffset:r.length,vertexLength:0,primitiveLength:0},void 0!==n&&(i.sortKey=n),this.segments.push(i)),i},Ni.prototype.get=function(){return this.segments},Ni.prototype.destroy=function(){for(var t=0,e=this.segments;t<e.length;t+=1){var r=e[t];for(var n in r.vaos)r.vaos[n].destroy();}},Ni.simpleSegment=function(t,e,r,n){return new Ni([{vertexOffset:t,primitiveOffset:e,vertexLength:r,primitiveLength:n,vaos:{},sortKey:0}])},Ni.MAX_VERTEX_ARRAY_LENGTH=Math.pow(2,16)-1,_n("SegmentVector",Ni);var Xi=function(){this.ids=[],this.positions=[],this.indexed=!1;};function Zi(t,e,r){var n=t[e];t[e]=t[r],t[r]=n;}Xi.prototype.add=function(t,e,r,n){this.ids.push(t),this.positions.push(e,r,n);},Xi.prototype.getPositions=function(t){for(var e=0,r=this.ids.length-1;e<r;){var n=e+r>>1;this.ids[n]>=t?r=n:e=n+1;}for(var i=[];this.ids[e]===t;){var a=this.positions[3*e],o=this.positions[3*e+1],s=this.positions[3*e+2];i.push({index:a,start:o,end:s}),e++;}return i},Xi.serialize=function(t,e){var r=new Float64Array(t.ids),n=new Uint32Array(t.positions);return function t(e,r,n,i){if(n>=i)return;var a=e[n+i>>1];var o=n-1;var s=i+1;for(;;){do{o++;}while(e[o]<a);do{s--;}while(e[s]>a);if(o>=s)break;Zi(e,o,s),Zi(r,3*o,3*s),Zi(r,3*o+1,3*s+1),Zi(r,3*o+2,3*s+2);}t(e,r,n,s);t(e,r,s+1,i);}(r,n,0,r.length-1),e.push(r.buffer,n.buffer),{ids:r,positions:n}},Xi.deserialize=function(t){var e=new Xi;return e.ids=t.ids,e.positions=t.positions,e.indexed=!0,e},_n("FeaturePositionMap",Xi);var Gi=function(t,e){this.gl=t.gl,this.location=e;},Ji=function(t){function e(e,r){t.call(this,e,r),this.current=0;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){this.current!==t&&(this.current=t,this.gl.uniform1i(this.location,t));},e}(Gi),Hi=function(t){function e(e,r){t.call(this,e,r),this.current=0;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){this.current!==t&&(this.current=t,this.gl.uniform1f(this.location,t));},e}(Gi),Yi=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0];}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]||(this.current=t,this.gl.uniform2f(this.location,t[0],t[1]));},e}(Gi),$i=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0,0];}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]&&t[2]===this.current[2]||(this.current=t,this.gl.uniform3f(this.location,t[0],t[1],t[2]));},e}(Gi),Wi=function(t){function e(e,r){t.call(this,e,r),this.current=[0,0,0,0];}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){t[0]===this.current[0]&&t[1]===this.current[1]&&t[2]===this.current[2]&&t[3]===this.current[3]||(this.current=t,this.gl.uniform4f(this.location,t[0],t[1],t[2],t[3]));},e}(Gi),Qi=function(t){function e(e,r){t.call(this,e,r),this.current=Yt.transparent;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){t.r===this.current.r&&t.g===this.current.g&&t.b===this.current.b&&t.a===this.current.a||(this.current=t,this.gl.uniform4f(this.location,t.r,t.g,t.b,t.a));},e}(Gi),ta=new Float32Array(16),ea=function(t){function e(e,r){t.call(this,e,r),this.current=ta;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.set=function(t){if(t[12]!==this.current[12]||t[0]!==this.current[0])return this.current=t,void this.gl.uniformMatrix4fv(this.location,!1,t);for(var e=1;e<16;e++)if(t[e]!==this.current[e]){this.current=t,this.gl.uniformMatrix4fv(this.location,!1,t);break}},e}(Gi);function ra(t){return [Ki(255*t.r,255*t.g),Ki(255*t.b,255*t.a)]}var na=function(t,e,r){this.value=t,this.names=e,this.uniformNames=this.names.map((function(t){return "u_"+t})),this.type=r,this.maxValue=-1/0;};na.prototype.defines=function(){return this.names.map((function(t){return "#define HAS_UNIFORM_u_"+t}))},na.prototype.setConstantPatternPositions=function(){},na.prototype.populatePaintArray=function(){},na.prototype.updatePaintArray=function(){},na.prototype.upload=function(){},na.prototype.destroy=function(){},na.prototype.setUniforms=function(t,e,r,n){e.set(n.constantOr(this.value));},na.prototype.getBinding=function(t,e){return "color"===this.type?new Qi(t,e):new Hi(t,e)},na.serialize=function(t){var e=t.value,r=t.names,n=t.type;return {value:kn(e),names:r,type:n}},na.deserialize=function(t){var e=t.value,r=t.names,n=t.type;return new na(Sn(e),r,n)};var ia=function(t,e,r){this.value=t,this.names=e,this.uniformNames=this.names.map((function(t){return "u_"+t})),this.type=r,this.maxValue=-1/0,this.patternPositions={patternTo:null,patternFrom:null};};ia.prototype.defines=function(){return this.names.map((function(t){return "#define HAS_UNIFORM_u_"+t}))},ia.prototype.populatePaintArray=function(){},ia.prototype.updatePaintArray=function(){},ia.prototype.upload=function(){},ia.prototype.destroy=function(){},ia.prototype.setConstantPatternPositions=function(t,e){this.patternPositions.patternTo=t.tlbr,this.patternPositions.patternFrom=e.tlbr;},ia.prototype.setUniforms=function(t,e,r,n,i){var a=this.patternPositions;"u_pattern_to"===i&&a.patternTo&&e.set(a.patternTo),"u_pattern_from"===i&&a.patternFrom&&e.set(a.patternFrom);},ia.prototype.getBinding=function(t,e){return new Wi(t,e)};var aa=function(t,e,r,n){this.expression=t,this.names=e,this.type=r,this.uniformNames=this.names.map((function(t){return "a_"+t})),this.maxValue=-1/0,this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Float32",components:"color"===r?2:1,offset:0}})),this.paintVertexArray=new n;};aa.prototype.defines=function(){return []},aa.prototype.setConstantPatternPositions=function(){},aa.prototype.populatePaintArray=function(t,e,r,n){var i=this.paintVertexArray,a=i.length;i.reserve(t);var o=this.expression.evaluate(new qn(0),e,{},[],n);if("color"===this.type)for(var s=ra(o),u=a;u<t;u++)i.emplaceBack(s[0],s[1]);else{for(var l=a;l<t;l++)i.emplaceBack(o);this.maxValue=Math.max(this.maxValue,o);}},aa.prototype.updatePaintArray=function(t,e,r,n){var i=this.paintVertexArray,a=this.expression.evaluate({zoom:0},r,n);if("color"===this.type)for(var o=ra(a),s=t;s<e;s++)i.emplace(s,o[0],o[1]);else{for(var u=t;u<e;u++)i.emplace(u,a);this.maxValue=Math.max(this.maxValue,a);}},aa.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},aa.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();},aa.prototype.setUniforms=function(t,e){e.set(0);},aa.prototype.getBinding=function(t,e){return new Hi(t,e)};var oa=function(t,e,r,n,i,a){this.expression=t,this.names=e,this.uniformNames=this.names.map((function(t){return "u_"+t+"_t"})),this.type=r,this.useIntegerZoom=n,this.zoom=i,this.maxValue=-1/0;var o=a;this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Float32",components:"color"===r?4:2,offset:0}})),this.paintVertexArray=new o;};oa.prototype.defines=function(){return []},oa.prototype.setConstantPatternPositions=function(){},oa.prototype.populatePaintArray=function(t,e,r,n){var i=this.paintVertexArray,a=i.length;i.reserve(t);var o=this.expression.evaluate(new qn(this.zoom),e,{},[],n),s=this.expression.evaluate(new qn(this.zoom+1),e,{},[],n);if("color"===this.type)for(var u=ra(o),l=ra(s),p=a;p<t;p++)i.emplaceBack(u[0],u[1],l[0],l[1]);else{for(var c=a;c<t;c++)i.emplaceBack(o,s);this.maxValue=Math.max(this.maxValue,o,s);}},oa.prototype.updatePaintArray=function(t,e,r,n){var i=this.paintVertexArray,a=this.expression.evaluate({zoom:this.zoom},r,n),o=this.expression.evaluate({zoom:this.zoom+1},r,n);if("color"===this.type)for(var s=ra(a),u=ra(o),l=t;l<e;l++)i.emplace(l,s[0],s[1],u[0],u[1]);else{for(var p=t;p<e;p++)i.emplace(p,a,o);this.maxValue=Math.max(this.maxValue,a,o);}},oa.prototype.upload=function(t){this.paintVertexArray&&this.paintVertexArray.arrayBuffer&&(this.paintVertexBuffer&&this.paintVertexBuffer.buffer?this.paintVertexBuffer.updateData(this.paintVertexArray):this.paintVertexBuffer=t.createVertexBuffer(this.paintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},oa.prototype.destroy=function(){this.paintVertexBuffer&&this.paintVertexBuffer.destroy();},oa.prototype.interpolationFactor=function(t){return this.useIntegerZoom&&(t=Math.floor(t)),l(this.expression.interpolationFactor(t,this.zoom,this.zoom+1),0,1)},oa.prototype.setUniforms=function(t,e,r){e.set(this.interpolationFactor(r.zoom));},oa.prototype.getBinding=function(t,e){return new Hi(t,e)};var sa=function(t,e,r,n,i,a,o){this.expression=t,this.names=e,this.type=r,this.uniformNames=this.names.map((function(t){return "u_"+t+"_t"})),this.useIntegerZoom=n,this.zoom=i,this.maxValue=-1/0,this.layerId=o,this.paintVertexAttributes=e.map((function(t){return {name:"a_"+t,type:"Uint16",components:4,offset:0}})),this.zoomInPaintVertexArray=new a,this.zoomOutPaintVertexArray=new a;};sa.prototype.defines=function(){return []},sa.prototype.setConstantPatternPositions=function(){},sa.prototype.populatePaintArray=function(t,e,r){var n=this.zoomInPaintVertexArray,i=this.zoomOutPaintVertexArray,a=this.layerId,o=n.length;if(n.reserve(t),i.reserve(t),r&&e.patterns&&e.patterns[a]){var s=e.patterns[a],u=s.min,l=s.mid,p=s.max,c=r[u],h=r[l],f=r[p];if(!c||!h||!f)return;for(var y=o;y<t;y++)n.emplaceBack(h.tl[0],h.tl[1],h.br[0],h.br[1],c.tl[0],c.tl[1],c.br[0],c.br[1]),i.emplaceBack(h.tl[0],h.tl[1],h.br[0],h.br[1],f.tl[0],f.tl[1],f.br[0],f.br[1]);}},sa.prototype.updatePaintArray=function(t,e,r,n,i){var a=this.zoomInPaintVertexArray,o=this.zoomOutPaintVertexArray,s=this.layerId;if(i&&r.patterns&&r.patterns[s]){var u=r.patterns[s],l=u.min,p=u.mid,c=u.max,h=i[l],f=i[p],y=i[c];if(!h||!f||!y)return;for(var d=t;d<e;d++)a.emplace(d,f.tl[0],f.tl[1],f.br[0],f.br[1],h.tl[0],h.tl[1],h.br[0],h.br[1]),o.emplace(d,f.tl[0],f.tl[1],f.br[0],f.br[1],y.tl[0],y.tl[1],y.br[0],y.br[1]);}},sa.prototype.upload=function(t){this.zoomInPaintVertexArray&&this.zoomInPaintVertexArray.arrayBuffer&&this.zoomOutPaintVertexArray&&this.zoomOutPaintVertexArray.arrayBuffer&&(this.zoomInPaintVertexBuffer=t.createVertexBuffer(this.zoomInPaintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent),this.zoomOutPaintVertexBuffer=t.createVertexBuffer(this.zoomOutPaintVertexArray,this.paintVertexAttributes,this.expression.isStateDependent));},sa.prototype.destroy=function(){this.zoomOutPaintVertexBuffer&&this.zoomOutPaintVertexBuffer.destroy(),this.zoomInPaintVertexBuffer&&this.zoomInPaintVertexBuffer.destroy();},sa.prototype.setUniforms=function(t,e){e.set(0);},sa.prototype.getBinding=function(t,e){return new Hi(t,e)};var ua=function(){this.binders={},this.cacheKey="",this._buffers=[],this._featureMap=new Xi,this._bufferOffset=0;};ua.createDynamic=function(t,e,r){var n=new ua,i=[];for(var a in t.paint._values)if(r(a)){var o=t.paint.get(a);if(o instanceof Hn&&vr(o.property.specification)){var s=pa(a,t.type),u=o.property.specification.type,l=o.property.useIntegerZoom;if("cross-faded"===o.property.specification["property-type"]||"cross-faded-data-driven"===o.property.specification["property-type"])if("constant"===o.value.kind)n.binders[a]=new ia(o.value.value,s,u),i.push("/u_"+a);else{var p=ca(a,u,"source");n.binders[a]=new sa(o.value,s,u,l,e,p,t.id),i.push("/a_"+a);}else if("constant"===o.value.kind)n.binders[a]=new na(o.value.value,s,u),i.push("/u_"+a);else if("source"===o.value.kind){var c=ca(a,u,"source");n.binders[a]=new aa(o.value,s,u,c),i.push("/a_"+a);}else{var h=ca(a,u,"composite");n.binders[a]=new oa(o.value,s,u,l,e,h),i.push("/z_"+a);}}}return n.cacheKey=i.sort().join(""),n},ua.prototype.populatePaintArrays=function(t,e,r,n,i){for(var a in this.binders){this.binders[a].populatePaintArray(t,e,n,i);}void 0!==e.id&&this._featureMap.add(+e.id,r,this._bufferOffset,t),this._bufferOffset=t;},ua.prototype.setConstantPatternPositions=function(t,e){for(var r in this.binders){this.binders[r].setConstantPatternPositions(t,e);}},ua.prototype.updatePaintArrays=function(t,e,r,n){var i=!1;for(var a in t)for(var o=0,s=this._featureMap.getPositions(+a);o<s.length;o+=1){var u=s[o],l=e.feature(u.index);for(var p in this.binders){var c=this.binders[p];if(!(c instanceof na||c instanceof ia)&&!0===c.expression.isStateDependent){var h=r.paint.get(p);c.expression=h.value,c.updatePaintArray(u.start,u.end,l,t[a],n),i=!0;}}}return i},ua.prototype.defines=function(){var t=[];for(var e in this.binders)t.push.apply(t,this.binders[e].defines());return t},ua.prototype.getPaintVertexBuffers=function(){return this._buffers},ua.prototype.getUniforms=function(t,e){var r=[];for(var n in this.binders)for(var i=this.binders[n],a=0,o=i.uniformNames;a<o.length;a+=1){var s=o[a];if(e[s]){var u=i.getBinding(t,e[s]);r.push({name:s,property:n,binding:u});}}return r},ua.prototype.setUniforms=function(t,e,r,n){for(var i=0,a=e;i<a.length;i+=1){var o=a[i],s=o.name,u=o.property,l=o.binding;this.binders[u].setUniforms(t,l,n,r.get(u),s);}},ua.prototype.updatePatternPaintBuffers=function(t){var e=[];for(var r in this.binders){var n=this.binders[r];if(n instanceof sa){var i=2===t.fromScale?n.zoomInPaintVertexBuffer:n.zoomOutPaintVertexBuffer;i&&e.push(i);}else(n instanceof aa||n instanceof oa)&&n.paintVertexBuffer&&e.push(n.paintVertexBuffer);}this._buffers=e;},ua.prototype.upload=function(t){for(var e in this.binders)this.binders[e].upload(t);var r=[];for(var n in this.binders){var i=this.binders[n];(i instanceof aa||i instanceof oa)&&i.paintVertexBuffer&&r.push(i.paintVertexBuffer);}this._buffers=r;},ua.prototype.destroy=function(){for(var t in this.binders)this.binders[t].destroy();};var la=function(t,e,r,n){void 0===n&&(n=function(){return !0}),this.programConfigurations={};for(var i=0,a=e;i<a.length;i+=1){var o=a[i];this.programConfigurations[o.id]=ua.createDynamic(o,r,n),this.programConfigurations[o.id].layoutAttributes=t;}this.needsUpload=!1;};function pa(t,e){return {"text-opacity":["opacity"],"icon-opacity":["opacity"],"text-color":["fill_color"],"icon-color":["fill_color"],"text-halo-color":["halo_color"],"icon-halo-color":["halo_color"],"text-halo-blur":["halo_blur"],"icon-halo-blur":["halo_blur"],"text-halo-width":["halo_width"],"icon-halo-width":["halo_width"],"line-gap-width":["gapwidth"],"line-pattern":["pattern_to","pattern_from"],"fill-pattern":["pattern_to","pattern_from"],"fill-extrusion-pattern":["pattern_to","pattern_from"]}[t]||[t.replace(e+"-","").replace(/-/g,"_")]}function ca(t,e,r){var n={color:{source:Ci,composite:Bi},number:{source:wi,composite:Ci}},i=function(t){return {"line-pattern":{source:fi,composite:fi},"fill-pattern":{source:fi,composite:fi},"fill-extrusion-pattern":{source:fi,composite:fi}}[t]}(t);return i&&i[r]||n[e][r]}la.prototype.populatePaintArrays=function(t,e,r,n,i){for(var a in this.programConfigurations)this.programConfigurations[a].populatePaintArrays(t,e,r,n,i);this.needsUpload=!0;},la.prototype.updatePaintArrays=function(t,e,r,n){for(var i=0,a=r;i<a.length;i+=1){var o=a[i];this.needsUpload=this.programConfigurations[o.id].updatePaintArrays(t,e,o,n)||this.needsUpload;}},la.prototype.get=function(t){return this.programConfigurations[t]},la.prototype.upload=function(t){if(this.needsUpload){for(var e in this.programConfigurations)this.programConfigurations[e].upload(t);this.needsUpload=!1;}},la.prototype.destroy=function(){for(var t in this.programConfigurations)this.programConfigurations[t].destroy();},_n("ConstantBinder",na),_n("CrossFadedConstantBinder",ia),_n("SourceExpressionBinder",aa),_n("CrossFadedCompositeBinder",sa),_n("CompositeExpressionBinder",oa),_n("ProgramConfiguration",ua,{omit:["_buffers"]}),_n("ProgramConfigurationSet",la);var ha=8192;var fa,ya=(fa=15,{min:-1*Math.pow(2,fa-1),max:Math.pow(2,fa-1)-1});function da(t){for(var e=ha/t.extent,r=t.loadGeometry(),n=0;n<r.length;n++)for(var i=r[n],a=0;a<i.length;a++){var o=i[a];o.x=Math.round(o.x*e),o.y=Math.round(o.y*e),(o.x<ya.min||o.x>ya.max||o.y<ya.min||o.y>ya.max)&&(w("Geometry exceeds allowed extent, reduce your vector tile buffer size"),o.x=l(o.x,ya.min,ya.max),o.y=l(o.y,ya.min,ya.max));}return r}function ma(t,e,r,n,i){t.emplaceBack(2*e+(n+1)/2,2*r+(i+1)/2);}var va=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new li,this.indexArray=new Si,this.segments=new Ni,this.programConfigurations=new la(qi,t.layers,t.zoom),this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};function ga(t,e){for(var r=0;r<t.length;r++)if(za(e,t[r]))return !0;for(var n=0;n<e.length;n++)if(za(t,e[n]))return !0;return !!wa(t,e)}function xa(t,e,r){return !!za(t,e)||!!ka(e,t,r)}function ba(t,e){if(1===t.length)return Ia(e,t[0]);for(var r=0;r<e.length;r++)for(var n=e[r],i=0;i<n.length;i++)if(za(t,n[i]))return !0;for(var a=0;a<t.length;a++)if(Ia(e,t[a]))return !0;for(var o=0;o<e.length;o++)if(wa(t,e[o]))return !0;return !1}function _a(t,e,r){if(t.length>1){if(wa(t,e))return !0;for(var n=0;n<e.length;n++)if(ka(e[n],t,r))return !0}for(var i=0;i<t.length;i++)if(ka(t[i],e,r))return !0;return !1}function wa(t,e){if(0===t.length||0===e.length)return !1;for(var r=0;r<t.length-1;r++)for(var n=t[r],i=t[r+1],a=0;a<e.length-1;a++){if(Aa(n,i,e[a],e[a+1]))return !0}return !1}function Aa(t,e,r,n){return A(t,r,n)!==A(e,r,n)&&A(t,e,r)!==A(t,e,n)}function ka(t,e,r){var n=r*r;if(1===e.length)return t.distSqr(e[0])<n;for(var i=1;i<e.length;i++){if(Sa(t,e[i-1],e[i])<n)return !0}return !1}function Sa(t,e,r){var n=e.distSqr(r);if(0===n)return t.distSqr(e);var i=((t.x-e.x)*(r.x-e.x)+(t.y-e.y)*(r.y-e.y))/n;return i<0?t.distSqr(e):i>1?t.distSqr(r):t.distSqr(r.sub(e)._mult(i)._add(e))}function Ia(t,e){for(var r,n,i,a=!1,o=0;o<t.length;o++)for(var s=0,u=(r=t[o]).length-1;s<r.length;u=s++)n=r[s],i=r[u],n.y>e.y!=i.y>e.y&&e.x<(i.x-n.x)*(e.y-n.y)/(i.y-n.y)+n.x&&(a=!a);return a}function za(t,e){for(var r=!1,n=0,i=t.length-1;n<t.length;i=n++){var a=t[n],o=t[i];a.y>e.y!=o.y>e.y&&e.x<(o.x-a.x)*(e.y-a.y)/(o.y-a.y)+a.x&&(r=!r);}return r}function Ca(t,e,r){var n=r[0],i=r[2];if(t.x<n.x&&e.x<n.x||t.x>i.x&&e.x>i.x||t.y<n.y&&e.y<n.y||t.y>i.y&&e.y>i.y)return !1;var a=A(t,e,r[0]);return a!==A(t,e,r[1])||a!==A(t,e,r[2])||a!==A(t,e,r[3])}function Ba(t,e,r){var n=e.paint.get(t).value;return "constant"===n.kind?n.value:r.programConfigurations.get(e.id).binders[t].maxValue}function Pa(t){return Math.sqrt(t[0]*t[0]+t[1]*t[1])}function Ea(t,e,r,n,a){if(!e[0]&&!e[1])return t;var o=i.convert(e)._mult(a);"viewport"===r&&o._rotate(-n);for(var s=[],u=0;u<t.length;u++){var l=t[u];s.push(l.sub(o));}return s}va.prototype.populate=function(t,e){var r=this.layers[0],n=[],i=null;"circle"===r.type&&(i=r.layout.get("circle-sort-key"));for(var a=0,o=t;a<o.length;a+=1){var s=o[a],u=s.feature,l=s.index,p=s.sourceLayerIndex;if(this.layers[0]._featureFilter(new qn(this.zoom),u)){var c=da(u),h=i?i.evaluate(u,{}):void 0,f={id:u.id,properties:u.properties,type:u.type,sourceLayerIndex:p,index:l,geometry:c,patterns:{},sortKey:h};n.push(f);}}i&&n.sort((function(t,e){return t.sortKey-e.sortKey}));for(var y=0,d=n;y<d.length;y+=1){var m=d[y],v=m,g=v.geometry,x=v.index,b=v.sourceLayerIndex,_=t[x].feature;this.addFeature(m,g,x),e.featureIndex.insert(_,g,x,b,this.index);}},va.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},va.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},va.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},va.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,qi),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},va.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},va.prototype.addFeature=function(t,e,r){for(var n=0,i=e;n<i.length;n+=1)for(var a=0,o=i[n];a<o.length;a+=1){var s=o[a],u=s.x,l=s.y;if(!(u<0||u>=ha||l<0||l>=ha)){var p=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray,t.sortKey),c=p.vertexLength;ma(this.layoutVertexArray,u,l,-1,-1),ma(this.layoutVertexArray,u,l,1,-1),ma(this.layoutVertexArray,u,l,1,1),ma(this.layoutVertexArray,u,l,-1,1),this.indexArray.emplaceBack(c,c+1,c+2),this.indexArray.emplaceBack(c,c+3,c+2),p.vertexLength+=4,p.primitiveLength+=2;}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,{});},_n("CircleBucket",va,{omit:["layers"]});var Ma=new ri({"circle-sort-key":new Wn(It.layout_circle["circle-sort-key"])}),Ta={paint:new ri({"circle-radius":new Wn(It.paint_circle["circle-radius"]),"circle-color":new Wn(It.paint_circle["circle-color"]),"circle-blur":new Wn(It.paint_circle["circle-blur"]),"circle-opacity":new Wn(It.paint_circle["circle-opacity"]),"circle-translate":new $n(It.paint_circle["circle-translate"]),"circle-translate-anchor":new $n(It.paint_circle["circle-translate-anchor"]),"circle-pitch-scale":new $n(It.paint_circle["circle-pitch-scale"]),"circle-pitch-alignment":new $n(It.paint_circle["circle-pitch-alignment"]),"circle-stroke-width":new Wn(It.paint_circle["circle-stroke-width"]),"circle-stroke-color":new Wn(It.paint_circle["circle-stroke-color"]),"circle-stroke-opacity":new Wn(It.paint_circle["circle-stroke-opacity"])}),layout:Ma},Va="undefined"!=typeof Float32Array?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var t=arguments,e=0,r=arguments.length;r--;)e+=t[r]*t[r];return Math.sqrt(e)});var Fa,Oa;Fa=new Va(3),Va!=Float32Array&&(Fa[0]=0,Fa[1]=0,Fa[2]=0),Oa=Fa;function La(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3];return t[0]=r[0]*n+r[4]*i+r[8]*a+r[12]*o,t[1]=r[1]*n+r[5]*i+r[9]*a+r[13]*o,t[2]=r[2]*n+r[6]*i+r[10]*a+r[14]*o,t[3]=r[3]*n+r[7]*i+r[11]*a+r[15]*o,t}!function(){var t=function(){var t=new Va(4);return Va!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0),t}();}();var Da=function(t){function e(e){t.call(this,e,Ta);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.createBucket=function(t){return new va(t)},e.prototype.queryRadius=function(t){var e=t;return Ba("circle-radius",this,e)+Ba("circle-stroke-width",this,e)+Pa(this.paint.get("circle-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,i,a,o,s){for(var u=Ea(t,this.paint.get("circle-translate"),this.paint.get("circle-translate-anchor"),a.angle,o),l=this.paint.get("circle-radius").evaluate(e,r)+this.paint.get("circle-stroke-width").evaluate(e,r),p="map"===this.paint.get("circle-pitch-alignment"),c=p?u:function(t,e){return t.map((function(t){return Ua(t,e)}))}(u,s),h=p?l*o:l,f=0,y=n;f<y.length;f+=1)for(var d=0,m=y[f];d<m.length;d+=1){var v=m[d],g=p?v:Ua(v,s),x=h,b=La([],[v.x,v.y,0,1],s);if("viewport"===this.paint.get("circle-pitch-scale")&&"map"===this.paint.get("circle-pitch-alignment")?x*=b[3]/a.cameraToCenterDistance:"map"===this.paint.get("circle-pitch-scale")&&"viewport"===this.paint.get("circle-pitch-alignment")&&(x*=a.cameraToCenterDistance/b[3]),xa(c,g,x))return !0}return !1},e}(ni);function Ua(t,e){var r=La([],[t.x,t.y,0,1],e);return new i(r[0]/r[3],r[1]/r[3])}var Ra=function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(va);function ja(t,e,r,n){var i=e.width,a=e.height;if(n){if(n instanceof Uint8ClampedArray)n=new Uint8Array(n.buffer);else if(n.length!==i*a*r)throw new RangeError("mismatched image size")}else n=new Uint8Array(i*a*r);return t.width=i,t.height=a,t.data=n,t}function qa(t,e,r){var n=e.width,i=e.height;if(n!==t.width||i!==t.height){var a=ja({},{width:n,height:i},r);Na(t,a,{x:0,y:0},{x:0,y:0},{width:Math.min(t.width,n),height:Math.min(t.height,i)},r),t.width=n,t.height=i,t.data=a.data;}}function Na(t,e,r,n,i,a){if(0===i.width||0===i.height)return e;if(i.width>t.width||i.height>t.height||r.x>t.width-i.width||r.y>t.height-i.height)throw new RangeError("out of range source coordinates for image copy");if(i.width>e.width||i.height>e.height||n.x>e.width-i.width||n.y>e.height-i.height)throw new RangeError("out of range destination coordinates for image copy");for(var o=t.data,s=e.data,u=0;u<i.height;u++)for(var l=((r.y+u)*t.width+r.x)*a,p=((n.y+u)*e.width+n.x)*a,c=0;c<i.width*a;c++)s[p+c]=o[l+c];return e}_n("HeatmapBucket",Ra,{omit:["layers"]});var Ka=function(t,e){ja(this,t,1,e);};Ka.prototype.resize=function(t){qa(this,t,1);},Ka.prototype.clone=function(){return new Ka({width:this.width,height:this.height},new Uint8Array(this.data))},Ka.copy=function(t,e,r,n,i){Na(t,e,r,n,i,1);};var Xa=function(t,e){ja(this,t,4,e);};Xa.prototype.resize=function(t){qa(this,t,4);},Xa.prototype.replace=function(t,e){e?this.data.set(t):t instanceof Uint8ClampedArray?this.data=new Uint8Array(t.buffer):this.data=t;},Xa.prototype.clone=function(){return new Xa({width:this.width,height:this.height},new Uint8Array(this.data))},Xa.copy=function(t,e,r,n,i){Na(t,e,r,n,i,4);},_n("AlphaImage",Ka),_n("RGBAImage",Xa);var Za={paint:new ri({"heatmap-radius":new Wn(It.paint_heatmap["heatmap-radius"]),"heatmap-weight":new Wn(It.paint_heatmap["heatmap-weight"]),"heatmap-intensity":new $n(It.paint_heatmap["heatmap-intensity"]),"heatmap-color":new ei(It.paint_heatmap["heatmap-color"]),"heatmap-opacity":new $n(It.paint_heatmap["heatmap-opacity"])})};function Ga(t,e){for(var r=new Uint8Array(1024),n={},i=0,a=0;i<256;i++,a+=4){n[e]=i/255;var o=t.evaluate(n);r[a+0]=Math.floor(255*o.r/o.a),r[a+1]=Math.floor(255*o.g/o.a),r[a+2]=Math.floor(255*o.b/o.a),r[a+3]=Math.floor(255*o.a);}return new Xa({width:256,height:1},r)}var Ja=function(t){function e(e){t.call(this,e,Za),this._updateColorRamp();}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.createBucket=function(t){return new Ra(t)},e.prototype._handleSpecialPaintPropertyUpdate=function(t){"heatmap-color"===t&&this._updateColorRamp();},e.prototype._updateColorRamp=function(){var t=this._transitionablePaint._values["heatmap-color"].value.expression;this.colorRamp=Ga(t,"heatmapDensity"),this.colorRampTexture=null;},e.prototype.resize=function(){this.heatmapFbo&&(this.heatmapFbo.destroy(),this.heatmapFbo=null);},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype.hasOffscreenPass=function(){return 0!==this.paint.get("heatmap-opacity")&&"none"!==this.visibility},e}(ni),Ha={paint:new ri({"hillshade-illumination-direction":new $n(It.paint_hillshade["hillshade-illumination-direction"]),"hillshade-illumination-anchor":new $n(It.paint_hillshade["hillshade-illumination-anchor"]),"hillshade-exaggeration":new $n(It.paint_hillshade["hillshade-exaggeration"]),"hillshade-shadow-color":new $n(It.paint_hillshade["hillshade-shadow-color"]),"hillshade-highlight-color":new $n(It.paint_hillshade["hillshade-highlight-color"]),"hillshade-accent-color":new $n(It.paint_hillshade["hillshade-accent-color"])})},Ya=function(t){function e(e){t.call(this,e,Ha);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.hasOffscreenPass=function(){return 0!==this.paint.get("hillshade-exaggeration")&&"none"!==this.visibility},e}(ni),$a=si([{name:"a_pos",components:2,type:"Int16"}],4).members,Wa=to,Qa=to;function to(t,e,r){r=r||2;var n,i,a,o,s,u,l,p=e&&e.length,c=p?e[0]*r:t.length,h=eo(t,0,c,r,!0),f=[];if(!h||h.next===h.prev)return f;if(p&&(h=function(t,e,r,n){var i,a,o,s,u,l=[];for(i=0,a=e.length;i<a;i++)o=e[i]*n,s=i<a-1?e[i+1]*n:t.length,(u=eo(t,o,s,n,!1))===u.next&&(u.steiner=!0),l.push(ho(u));for(l.sort(uo),i=0;i<l.length;i++)lo(l[i],r),r=ro(r,r.next);return r}(t,e,h,r)),t.length>80*r){n=a=t[0],i=o=t[1];for(var y=r;y<c;y+=r)(s=t[y])<n&&(n=s),(u=t[y+1])<i&&(i=u),s>a&&(a=s),u>o&&(o=u);l=0!==(l=Math.max(a-n,o-i))?1/l:0;}return no(h,f,r,n,i,l),f}function eo(t,e,r,n,i){var a,o;if(i===Io(t,e,r,n)>0)for(a=e;a<r;a+=n)o=Ao(a,t[a],t[a+1],o);else for(a=r-n;a>=e;a-=n)o=Ao(a,t[a],t[a+1],o);return o&&vo(o,o.next)&&(ko(o),o=o.next),o}function ro(t,e){if(!t)return t;e||(e=t);var r,n=t;do{if(r=!1,n.steiner||!vo(n,n.next)&&0!==mo(n.prev,n,n.next))n=n.next;else{if(ko(n),(n=e=n.prev)===n.next)break;r=!0;}}while(r||n!==e);return e}function no(t,e,r,n,i,a,o){if(t){!o&&a&&function(t,e,r,n){var i=t;do{null===i.z&&(i.z=co(i.x,i.y,e,r,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;}while(i!==t);i.prevZ.nextZ=null,i.prevZ=null,function(t){var e,r,n,i,a,o,s,u,l=1;do{for(r=t,t=null,a=null,o=0;r;){for(o++,n=r,s=0,e=0;e<l&&(s++,n=n.nextZ);e++);for(u=l;s>0||u>0&&n;)0!==s&&(0===u||!n||r.z<=n.z)?(i=r,r=r.nextZ,s--):(i=n,n=n.nextZ,u--),a?a.nextZ=i:t=i,i.prevZ=a,a=i;r=n;}a.nextZ=null,l*=2;}while(o>1)}(i);}(t,n,i,a);for(var s,u,l=t;t.prev!==t.next;)if(s=t.prev,u=t.next,a?ao(t,n,i,a):io(t))e.push(s.i/r),e.push(t.i/r),e.push(u.i/r),ko(t),t=u.next,l=u.next;else if((t=u)===l){o?1===o?no(t=oo(ro(t),e,r),e,r,n,i,a,2):2===o&&so(t,e,r,n,i,a):no(ro(t),e,r,n,i,a,1);break}}}function io(t){var e=t.prev,r=t,n=t.next;if(mo(e,r,n)>=0)return !1;for(var i=t.next.next;i!==t.prev;){if(fo(e.x,e.y,r.x,r.y,n.x,n.y,i.x,i.y)&&mo(i.prev,i,i.next)>=0)return !1;i=i.next;}return !0}function ao(t,e,r,n){var i=t.prev,a=t,o=t.next;if(mo(i,a,o)>=0)return !1;for(var s=i.x<a.x?i.x<o.x?i.x:o.x:a.x<o.x?a.x:o.x,u=i.y<a.y?i.y<o.y?i.y:o.y:a.y<o.y?a.y:o.y,l=i.x>a.x?i.x>o.x?i.x:o.x:a.x>o.x?a.x:o.x,p=i.y>a.y?i.y>o.y?i.y:o.y:a.y>o.y?a.y:o.y,c=co(s,u,e,r,n),h=co(l,p,e,r,n),f=t.prevZ,y=t.nextZ;f&&f.z>=c&&y&&y.z<=h;){if(f!==t.prev&&f!==t.next&&fo(i.x,i.y,a.x,a.y,o.x,o.y,f.x,f.y)&&mo(f.prev,f,f.next)>=0)return !1;if(f=f.prevZ,y!==t.prev&&y!==t.next&&fo(i.x,i.y,a.x,a.y,o.x,o.y,y.x,y.y)&&mo(y.prev,y,y.next)>=0)return !1;y=y.nextZ;}for(;f&&f.z>=c;){if(f!==t.prev&&f!==t.next&&fo(i.x,i.y,a.x,a.y,o.x,o.y,f.x,f.y)&&mo(f.prev,f,f.next)>=0)return !1;f=f.prevZ;}for(;y&&y.z<=h;){if(y!==t.prev&&y!==t.next&&fo(i.x,i.y,a.x,a.y,o.x,o.y,y.x,y.y)&&mo(y.prev,y,y.next)>=0)return !1;y=y.nextZ;}return !0}function oo(t,e,r){var n=t;do{var i=n.prev,a=n.next.next;!vo(i,a)&&go(i,n,n.next,a)&&_o(i,a)&&_o(a,i)&&(e.push(i.i/r),e.push(n.i/r),e.push(a.i/r),ko(n),ko(n.next),n=t=a),n=n.next;}while(n!==t);return ro(n)}function so(t,e,r,n,i,a){var o=t;do{for(var s=o.next.next;s!==o.prev;){if(o.i!==s.i&&yo(o,s)){var u=wo(o,s);return o=ro(o,o.next),u=ro(u,u.next),no(o,e,r,n,i,a),void no(u,e,r,n,i,a)}s=s.next;}o=o.next;}while(o!==t)}function uo(t,e){return t.x-e.x}function lo(t,e){if(e=function(t,e){var r,n=e,i=t.x,a=t.y,o=-1/0;do{if(a<=n.y&&a>=n.next.y&&n.next.y!==n.y){var s=n.x+(a-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(s<=i&&s>o){if(o=s,s===i){if(a===n.y)return n;if(a===n.next.y)return n.next}r=n.x<n.next.x?n:n.next;}}n=n.next;}while(n!==e);if(!r)return null;if(i===o)return r;var u,l=r,p=r.x,c=r.y,h=1/0;n=r;do{i>=n.x&&n.x>=p&&i!==n.x&&fo(a<c?i:o,a,p,c,a<c?o:i,a,n.x,n.y)&&(u=Math.abs(a-n.y)/(i-n.x),_o(n,t)&&(u<h||u===h&&(n.x>r.x||n.x===r.x&&po(r,n)))&&(r=n,h=u)),n=n.next;}while(n!==l);return r}(t,e)){var r=wo(e,t);ro(r,r.next);}}function po(t,e){return mo(t.prev,t,e.prev)<0&&mo(e.next,t,t.next)<0}function co(t,e,r,n,i){return (t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=32767*(t-r)*i)|t<<8))|t<<4))|t<<2))|t<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=32767*(e-n)*i)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function ho(t){var e=t,r=t;do{(e.x<r.x||e.x===r.x&&e.y<r.y)&&(r=e),e=e.next;}while(e!==t);return r}function fo(t,e,r,n,i,a,o,s){return (i-o)*(e-s)-(t-o)*(a-s)>=0&&(t-o)*(n-s)-(r-o)*(e-s)>=0&&(r-o)*(a-s)-(i-o)*(n-s)>=0}function yo(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!function(t,e){var r=t;do{if(r.i!==t.i&&r.next.i!==t.i&&r.i!==e.i&&r.next.i!==e.i&&go(r,r.next,t,e))return !0;r=r.next;}while(r!==t);return !1}(t,e)&&(_o(t,e)&&_o(e,t)&&function(t,e){var r=t,n=!1,i=(t.x+e.x)/2,a=(t.y+e.y)/2;do{r.y>a!=r.next.y>a&&r.next.y!==r.y&&i<(r.next.x-r.x)*(a-r.y)/(r.next.y-r.y)+r.x&&(n=!n),r=r.next;}while(r!==t);return n}(t,e)&&(mo(t.prev,t,e.prev)||mo(t,e.prev,e))||vo(t,e)&&mo(t.prev,t,t.next)>0&&mo(e.prev,e,e.next)>0)}function mo(t,e,r){return (e.y-t.y)*(r.x-e.x)-(e.x-t.x)*(r.y-e.y)}function vo(t,e){return t.x===e.x&&t.y===e.y}function go(t,e,r,n){var i=bo(mo(t,e,r)),a=bo(mo(t,e,n)),o=bo(mo(r,n,t)),s=bo(mo(r,n,e));return i!==a&&o!==s||(!(0!==i||!xo(t,r,e))||(!(0!==a||!xo(t,n,e))||(!(0!==o||!xo(r,t,n))||!(0!==s||!xo(r,e,n)))))}function xo(t,e,r){return e.x<=Math.max(t.x,r.x)&&e.x>=Math.min(t.x,r.x)&&e.y<=Math.max(t.y,r.y)&&e.y>=Math.min(t.y,r.y)}function bo(t){return t>0?1:t<0?-1:0}function _o(t,e){return mo(t.prev,t,t.next)<0?mo(t,e,t.next)>=0&&mo(t,t.prev,e)>=0:mo(t,e,t.prev)<0||mo(t,t.next,e)<0}function wo(t,e){var r=new So(t.i,t.x,t.y),n=new So(e.i,e.x,e.y),i=t.next,a=e.prev;return t.next=e,e.prev=t,r.next=i,i.prev=r,n.next=r,r.prev=n,a.next=n,n.prev=a,n}function Ao(t,e,r,n){var i=new So(t,e,r);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function ko(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ);}function So(t,e,r){this.i=t,this.x=e,this.y=r,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1;}function Io(t,e,r,n){for(var i=0,a=e,o=r-n;a<r;a+=n)i+=(t[o]-t[a])*(t[a+1]+t[o+1]),o=a;return i}function zo(t,e,r,n,i){!function t(e,r,n,i,a){for(;i>n;){if(i-n>600){var o=i-n+1,s=r-n+1,u=Math.log(o),l=.5*Math.exp(2*u/3),p=.5*Math.sqrt(u*l*(o-l)/o)*(s-o/2<0?-1:1),c=Math.max(n,Math.floor(r-s*l/o+p)),h=Math.min(i,Math.floor(r+(o-s)*l/o+p));t(e,r,c,h,a);}var f=e[r],y=n,d=i;for(Co(e,n,r),a(e[i],f)>0&&Co(e,n,i);y<d;){for(Co(e,y,d),y++,d--;a(e[y],f)<0;)y++;for(;a(e[d],f)>0;)d--;}0===a(e[n],f)?Co(e,n,d):Co(e,++d,i),d<=r&&(n=d+1),r<=d&&(i=d-1);}}(t,e,r||0,n||t.length-1,i||Bo);}function Co(t,e,r){var n=t[e];t[e]=t[r],t[r]=n;}function Bo(t,e){return t<e?-1:t>e?1:0}function Po(t,e){var r=t.length;if(r<=1)return [t];for(var n,i,a=[],o=0;o<r;o++){var s=k(t[o]);0!==s&&(t[o].area=Math.abs(s),void 0===i&&(i=s<0),i===s<0?(n&&a.push(n),n=[t[o]]):n.push(t[o]));}if(n&&a.push(n),e>1)for(var u=0;u<a.length;u++)a[u].length<=e||(zo(a[u],e,1,a[u].length-1,Eo),a[u]=a[u].slice(0,e));return a}function Eo(t,e){return e.area-t.area}function Mo(t,e,r){for(var n=r.patternDependencies,i=!1,a=0,o=e;a<o.length;a+=1){var s=o[a].paint.get(t+"-pattern");s.isConstant()||(i=!0);var u=s.constantOr(null);u&&(i=!0,n[u.to]=!0,n[u.from]=!0);}return i}function To(t,e,r,n,i){for(var a=i.patternDependencies,o=0,s=e;o<s.length;o+=1){var u=s[o],l=u.paint.get(t+"-pattern").value;if("constant"!==l.kind){var p=l.evaluate({zoom:n-1},r,{},i.availableImages),c=l.evaluate({zoom:n},r,{},i.availableImages),h=l.evaluate({zoom:n+1},r,{},i.availableImages);p=p&&p.name?p.name:p,c=c&&c.name?c.name:c,h=h&&h.name?h.name:h,a[p]=!0,a[c]=!0,a[h]=!0,r.patterns[u.id]={min:p,mid:c,max:h};}}return r}to.deviation=function(t,e,r,n){var i=e&&e.length,a=i?e[0]*r:t.length,o=Math.abs(Io(t,0,a,r));if(i)for(var s=0,u=e.length;s<u;s++){var l=e[s]*r,p=s<u-1?e[s+1]*r:t.length;o-=Math.abs(Io(t,l,p,r));}var c=0;for(s=0;s<n.length;s+=3){var h=n[s]*r,f=n[s+1]*r,y=n[s+2]*r;c+=Math.abs((t[h]-t[y])*(t[f+1]-t[h+1])-(t[h]-t[f])*(t[y+1]-t[h+1]));}return 0===o&&0===c?0:Math.abs((c-o)/o)},to.flatten=function(t){for(var e=t[0][0].length,r={vertices:[],holes:[],dimensions:e},n=0,i=0;i<t.length;i++){for(var a=0;a<t[i].length;a++)for(var o=0;o<e;o++)r.vertices.push(t[i][a][o]);i>0&&(n+=t[i-1].length,r.holes.push(n));}return r},Wa.default=Qa;var Vo=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.layoutVertexArray=new li,this.indexArray=new Si,this.indexArray2=new Ii,this.programConfigurations=new la($a,t.layers,t.zoom),this.segments=new Ni,this.segments2=new Ni,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};Vo.prototype.populate=function(t,e){this.hasPattern=Mo("fill",this.layers,e);for(var r=this.layers[0].layout.get("fill-sort-key"),n=[],i=0,a=t;i<a.length;i+=1){var o=a[i],s=o.feature,u=o.index,l=o.sourceLayerIndex;if(this.layers[0]._featureFilter(new qn(this.zoom),s)){var p=da(s),c=r?r.evaluate(s,{},e.availableImages):void 0,h={id:s.id,properties:s.properties,type:s.type,sourceLayerIndex:l,index:u,geometry:p,patterns:{},sortKey:c};n.push(h);}}r&&n.sort((function(t,e){return t.sortKey-e.sortKey}));for(var f=0,y=n;f<y.length;f+=1){var d=y[f],m=d,v=m.geometry,g=m.index,x=m.sourceLayerIndex;if(this.hasPattern){var b=To("fill",this.layers,d,this.zoom,e);this.patternFeatures.push(b);}else this.addFeature(d,v,g,{});var _=t[g].feature;e.featureIndex.insert(_,v,g,x,this.index);}},Vo.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},Vo.prototype.addFeatures=function(t,e){for(var r=0,n=this.patternFeatures;r<n.length;r+=1){var i=n[r];this.addFeature(i,i.geometry,i.index,e);}},Vo.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},Vo.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},Vo.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,$a),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.indexBuffer2=t.createIndexBuffer(this.indexArray2)),this.programConfigurations.upload(t),this.uploaded=!0;},Vo.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.indexBuffer2.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.segments2.destroy());},Vo.prototype.addFeature=function(t,e,r,n){for(var i=0,a=Po(e,500);i<a.length;i+=1){for(var o=a[i],s=0,u=0,l=o;u<l.length;u+=1){s+=l[u].length;}for(var p=this.segments.prepareSegment(s,this.layoutVertexArray,this.indexArray),c=p.vertexLength,h=[],f=[],y=0,d=o;y<d.length;y+=1){var m=d[y];if(0!==m.length){m!==o[0]&&f.push(h.length/2);var v=this.segments2.prepareSegment(m.length,this.layoutVertexArray,this.indexArray2),g=v.vertexLength;this.layoutVertexArray.emplaceBack(m[0].x,m[0].y),this.indexArray2.emplaceBack(g+m.length-1,g),h.push(m[0].x),h.push(m[0].y);for(var x=1;x<m.length;x++)this.layoutVertexArray.emplaceBack(m[x].x,m[x].y),this.indexArray2.emplaceBack(g+x-1,g+x),h.push(m[x].x),h.push(m[x].y);v.vertexLength+=m.length,v.primitiveLength+=m.length;}}for(var b=Wa(h,f),_=0;_<b.length;_+=3)this.indexArray.emplaceBack(c+b[_],c+b[_+1],c+b[_+2]);p.vertexLength+=s,p.primitiveLength+=b.length/3;}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,n);},_n("FillBucket",Vo,{omit:["layers","patternFeatures"]});var Fo=new ri({"fill-sort-key":new Wn(It.layout_fill["fill-sort-key"])}),Oo={paint:new ri({"fill-antialias":new $n(It.paint_fill["fill-antialias"]),"fill-opacity":new Wn(It.paint_fill["fill-opacity"]),"fill-color":new Wn(It.paint_fill["fill-color"]),"fill-outline-color":new Wn(It.paint_fill["fill-outline-color"]),"fill-translate":new $n(It.paint_fill["fill-translate"]),"fill-translate-anchor":new $n(It.paint_fill["fill-translate-anchor"]),"fill-pattern":new Qn(It.paint_fill["fill-pattern"])}),layout:Fo},Lo=function(t){function e(e){t.call(this,e,Oo);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.recalculate=function(e,r){t.prototype.recalculate.call(this,e,r);var n=this.paint._values["fill-outline-color"];"constant"===n.value.kind&&void 0===n.value.value&&(this.paint._values["fill-outline-color"]=this.paint._values["fill-color"]);},e.prototype.createBucket=function(t){return new Vo(t)},e.prototype.queryRadius=function(){return Pa(this.paint.get("fill-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,i,a,o){return ba(Ea(t,this.paint.get("fill-translate"),this.paint.get("fill-translate-anchor"),a.angle,o),n)},e.prototype.isTileClipped=function(){return !0},e}(ni),Do=si([{name:"a_pos",components:2,type:"Int16"},{name:"a_normal_ed",components:4,type:"Int16"}],4).members,Uo=Ro;function Ro(t,e,r,n,i){this.properties={},this.extent=r,this.type=0,this._pbf=t,this._geometry=-1,this._keys=n,this._values=i,t.readFields(jo,this,e);}function jo(t,e,r){1==t?e.id=r.readVarint():2==t?function(t,e){var r=t.readVarint()+t.pos;for(;t.pos<r;){var n=e._keys[t.readVarint()],i=e._values[t.readVarint()];e.properties[n]=i;}}(r,e):3==t?e.type=r.readVarint():4==t&&(e._geometry=r.pos);}function qo(t){for(var e,r,n=0,i=0,a=t.length,o=a-1;i<a;o=i++)e=t[i],n+=((r=t[o]).x-e.x)*(e.y+r.y);return n}Ro.types=["Unknown","Point","LineString","Polygon"],Ro.prototype.loadGeometry=function(){var t=this._pbf;t.pos=this._geometry;for(var e,r=t.readVarint()+t.pos,n=1,a=0,o=0,s=0,u=[];t.pos<r;){if(a<=0){var l=t.readVarint();n=7&l,a=l>>3;}if(a--,1===n||2===n)o+=t.readSVarint(),s+=t.readSVarint(),1===n&&(e&&u.push(e),e=[]),e.push(new i(o,s));else{if(7!==n)throw new Error("unknown command "+n);e&&e.push(e[0].clone());}}return e&&u.push(e),u},Ro.prototype.bbox=function(){var t=this._pbf;t.pos=this._geometry;for(var e=t.readVarint()+t.pos,r=1,n=0,i=0,a=0,o=1/0,s=-1/0,u=1/0,l=-1/0;t.pos<e;){if(n<=0){var p=t.readVarint();r=7&p,n=p>>3;}if(n--,1===r||2===r)(i+=t.readSVarint())<o&&(o=i),i>s&&(s=i),(a+=t.readSVarint())<u&&(u=a),a>l&&(l=a);else if(7!==r)throw new Error("unknown command "+r)}return [o,u,s,l]},Ro.prototype.toGeoJSON=function(t,e,r){var n,i,a=this.extent*Math.pow(2,r),o=this.extent*t,s=this.extent*e,u=this.loadGeometry(),l=Ro.types[this.type];function p(t){for(var e=0;e<t.length;e++){var r=t[e],n=180-360*(r.y+s)/a;t[e]=[360*(r.x+o)/a-180,360/Math.PI*Math.atan(Math.exp(n*Math.PI/180))-90];}}switch(this.type){case 1:var c=[];for(n=0;n<u.length;n++)c[n]=u[n][0];p(u=c);break;case 2:for(n=0;n<u.length;n++)p(u[n]);break;case 3:for(u=function(t){var e=t.length;if(e<=1)return [t];for(var r,n,i=[],a=0;a<e;a++){var o=qo(t[a]);0!==o&&(void 0===n&&(n=o<0),n===o<0?(r&&i.push(r),r=[t[a]]):r.push(t[a]));}r&&i.push(r);return i}(u),n=0;n<u.length;n++)for(i=0;i<u[n].length;i++)p(u[n][i]);}1===u.length?u=u[0]:l="Multi"+l;var h={type:"Feature",geometry:{type:l,coordinates:u},properties:this.properties};return "id"in this&&(h.id=this.id),h};var No=Ko;function Ko(t,e){this.version=1,this.name=null,this.extent=4096,this.length=0,this._pbf=t,this._keys=[],this._values=[],this._features=[],t.readFields(Xo,this,e),this.length=this._features.length;}function Xo(t,e,r){15===t?e.version=r.readVarint():1===t?e.name=r.readString():5===t?e.extent=r.readVarint():2===t?e._features.push(r.pos):3===t?e._keys.push(r.readString()):4===t&&e._values.push(function(t){var e=null,r=t.readVarint()+t.pos;for(;t.pos<r;){var n=t.readVarint()>>3;e=1===n?t.readString():2===n?t.readFloat():3===n?t.readDouble():4===n?t.readVarint64():5===n?t.readVarint():6===n?t.readSVarint():7===n?t.readBoolean():null;}return e}(r));}function Zo(t,e,r){if(3===t){var n=new No(r,r.readVarint()+r.pos);n.length&&(e[n.name]=n);}}Ko.prototype.feature=function(t){if(t<0||t>=this._features.length)throw new Error("feature index out of bounds");this._pbf.pos=this._features[t];var e=this._pbf.readVarint()+this._pbf.pos;return new Uo(this._pbf,e,this.extent,this._keys,this._values)};var Go={VectorTile:function(t,e){this.layers=t.readFields(Zo,{},e);},VectorTileFeature:Uo,VectorTileLayer:No},Jo=Go.VectorTileFeature.types,Ho=Math.pow(2,13);function Yo(t,e,r,n,i,a,o,s){t.emplaceBack(e,r,2*Math.floor(n*Ho)+o,i*Ho*2,a*Ho*2,Math.round(s));}var $o=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.layoutVertexArray=new ci,this.indexArray=new Si,this.programConfigurations=new la(Do,t.layers,t.zoom),this.segments=new Ni,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};function Wo(t,e){return t.x===e.x&&(t.x<0||t.x>ha)||t.y===e.y&&(t.y<0||t.y>ha)}function Qo(t){return t.every((function(t){return t.x<0}))||t.every((function(t){return t.x>ha}))||t.every((function(t){return t.y<0}))||t.every((function(t){return t.y>ha}))}$o.prototype.populate=function(t,e){this.features=[],this.hasPattern=Mo("fill-extrusion",this.layers,e);for(var r=0,n=t;r<n.length;r+=1){var i=n[r],a=i.feature,o=i.index,s=i.sourceLayerIndex;if(this.layers[0]._featureFilter(new qn(this.zoom),a)){var u=da(a),l={sourceLayerIndex:s,index:o,geometry:u,properties:a.properties,type:a.type,patterns:{}};void 0!==a.id&&(l.id=a.id),this.hasPattern?this.features.push(To("fill-extrusion",this.layers,l,this.zoom,e)):this.addFeature(l,u,o,{}),e.featureIndex.insert(a,u,o,s,this.index,!0);}}},$o.prototype.addFeatures=function(t,e){for(var r=0,n=this.features;r<n.length;r+=1){var i=n[r],a=i.geometry;this.addFeature(i,a,i.index,e);}},$o.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},$o.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},$o.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},$o.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,Do),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},$o.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},$o.prototype.addFeature=function(t,e,r,n){for(var i=0,a=Po(e,500);i<a.length;i+=1){for(var o=a[i],s=0,u=0,l=o;u<l.length;u+=1){s+=l[u].length;}for(var p=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray),c=0,h=o;c<h.length;c+=1){var f=h[c];if(0!==f.length&&!Qo(f))for(var y=0,d=0;d<f.length;d++){var m=f[d];if(d>=1){var v=f[d-1];if(!Wo(m,v)){p.vertexLength+4>Ni.MAX_VERTEX_ARRAY_LENGTH&&(p=this.segments.prepareSegment(4,this.layoutVertexArray,this.indexArray));var g=m.sub(v)._perp()._unit(),x=v.dist(m);y+x>32768&&(y=0),Yo(this.layoutVertexArray,m.x,m.y,g.x,g.y,0,0,y),Yo(this.layoutVertexArray,m.x,m.y,g.x,g.y,0,1,y),y+=x,Yo(this.layoutVertexArray,v.x,v.y,g.x,g.y,0,0,y),Yo(this.layoutVertexArray,v.x,v.y,g.x,g.y,0,1,y);var b=p.vertexLength;this.indexArray.emplaceBack(b,b+2,b+1),this.indexArray.emplaceBack(b+1,b+2,b+3),p.vertexLength+=4,p.primitiveLength+=2;}}}}if(p.vertexLength+s>Ni.MAX_VERTEX_ARRAY_LENGTH&&(p=this.segments.prepareSegment(s,this.layoutVertexArray,this.indexArray)),"Polygon"===Jo[t.type]){for(var _=[],w=[],A=p.vertexLength,k=0,S=o;k<S.length;k+=1){var I=S[k];if(0!==I.length){I!==o[0]&&w.push(_.length/2);for(var z=0;z<I.length;z++){var C=I[z];Yo(this.layoutVertexArray,C.x,C.y,0,0,1,1,0),_.push(C.x),_.push(C.y);}}}for(var B=Wa(_,w),P=0;P<B.length;P+=3)this.indexArray.emplaceBack(A+B[P],A+B[P+2],A+B[P+1]);p.primitiveLength+=B.length/3,p.vertexLength+=s;}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,t,r,n);},_n("FillExtrusionBucket",$o,{omit:["layers","features"]});var ts={paint:new ri({"fill-extrusion-opacity":new $n(It["paint_fill-extrusion"]["fill-extrusion-opacity"]),"fill-extrusion-color":new Wn(It["paint_fill-extrusion"]["fill-extrusion-color"]),"fill-extrusion-translate":new $n(It["paint_fill-extrusion"]["fill-extrusion-translate"]),"fill-extrusion-translate-anchor":new $n(It["paint_fill-extrusion"]["fill-extrusion-translate-anchor"]),"fill-extrusion-pattern":new Qn(It["paint_fill-extrusion"]["fill-extrusion-pattern"]),"fill-extrusion-height":new Wn(It["paint_fill-extrusion"]["fill-extrusion-height"]),"fill-extrusion-base":new Wn(It["paint_fill-extrusion"]["fill-extrusion-base"]),"fill-extrusion-vertical-gradient":new $n(It["paint_fill-extrusion"]["fill-extrusion-vertical-gradient"])})},es=function(t){function e(e){t.call(this,e,ts);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.createBucket=function(t){return new $o(t)},e.prototype.queryRadius=function(){return Pa(this.paint.get("fill-extrusion-translate"))},e.prototype.is3D=function(){return !0},e.prototype.queryIntersectsFeature=function(t,e,r,n,a,o,s,u){var l=Ea(t,this.paint.get("fill-extrusion-translate"),this.paint.get("fill-extrusion-translate-anchor"),o.angle,s),p=this.paint.get("fill-extrusion-height").evaluate(e,r),c=this.paint.get("fill-extrusion-base").evaluate(e,r),h=function(t,e,r,n){for(var a=[],o=0,s=t;o<s.length;o+=1){var u=s[o],l=[u.x,u.y,n,1];La(l,l,e),a.push(new i(l[0]/l[3],l[1]/l[3]));}return a}(l,u,0,0),f=function(t,e,r,n){for(var a=[],o=[],s=n[8]*e,u=n[9]*e,l=n[10]*e,p=n[11]*e,c=n[8]*r,h=n[9]*r,f=n[10]*r,y=n[11]*r,d=0,m=t;d<m.length;d+=1){for(var v=m[d],g=[],x=[],b=0,_=v;b<_.length;b+=1){var w=_[b],A=w.x,k=w.y,S=n[0]*A+n[4]*k+n[12],I=n[1]*A+n[5]*k+n[13],z=n[2]*A+n[6]*k+n[14],C=n[3]*A+n[7]*k+n[15],B=z+l,P=C+p,E=S+c,M=I+h,T=z+f,V=C+y,F=new i((S+s)/P,(I+u)/P);F.z=B/P,g.push(F);var O=new i(E/V,M/V);O.z=T/V,x.push(O);}a.push(g),o.push(x);}return [a,o]}(n,c,p,u);return function(t,e,r){var n=1/0;ba(r,e)&&(n=ns(r,e[0]));for(var i=0;i<e.length;i++)for(var a=e[i],o=t[i],s=0;s<a.length-1;s++){var u=a[s],l=a[s+1],p=o[s],c=o[s+1],h=[u,l,c,p,u];ga(r,h)&&(n=Math.min(n,ns(r,h)));}return n!==1/0&&n}(f[0],f[1],h)},e}(ni);function rs(t,e){return t.x*e.x+t.y*e.y}function ns(t,e){if(1===t.length){var r=e[0],n=e[1],i=e[3],a=t[0],o=n.sub(r),s=i.sub(r),u=a.sub(r),l=rs(o,o),p=rs(o,s),c=rs(s,s),h=rs(u,o),f=rs(u,s),y=l*c-p*p,d=(c*h-p*f)/y,m=(l*f-p*h)/y,v=1-d-m;return r.z*v+n.z*d+i.z*m}for(var g=1/0,x=0,b=e;x<b.length;x+=1){var _=b[x];g=Math.min(g,_.z);}return g}var is=si([{name:"a_pos_normal",components:2,type:"Int16"},{name:"a_data",components:4,type:"Uint8"}],4).members,as=Go.VectorTileFeature.types,os=Math.cos(Math.PI/180*37.5),ss=Math.pow(2,14)/.5,us=function(t){this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.hasPattern=!1,this.patternFeatures=[],this.layoutVertexArray=new hi,this.indexArray=new Si,this.programConfigurations=new la(is,t.layers,t.zoom),this.segments=new Ni,this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id}));};us.prototype.populate=function(t,e){this.hasPattern=Mo("line",this.layers,e);for(var r=this.layers[0].layout.get("line-sort-key"),n=[],i=0,a=t;i<a.length;i+=1){var o=a[i],s=o.feature,u=o.index,l=o.sourceLayerIndex;if(this.layers[0]._featureFilter(new qn(this.zoom),s)){var p=da(s),c=r?r.evaluate(s,{}):void 0,h={id:s.id,properties:s.properties,type:s.type,sourceLayerIndex:l,index:u,geometry:p,patterns:{},sortKey:c};n.push(h);}}r&&n.sort((function(t,e){return t.sortKey-e.sortKey}));for(var f=0,y=n;f<y.length;f+=1){var d=y[f],m=d,v=m.geometry,g=m.index,x=m.sourceLayerIndex;if(this.hasPattern){var b=To("line",this.layers,d,this.zoom,e);this.patternFeatures.push(b);}else this.addFeature(d,v,g,{});var _=t[g].feature;e.featureIndex.insert(_,v,g,x,this.index);}},us.prototype.update=function(t,e,r){this.stateDependentLayers.length&&this.programConfigurations.updatePaintArrays(t,e,this.stateDependentLayers,r);},us.prototype.addFeatures=function(t,e){for(var r=0,n=this.patternFeatures;r<n.length;r+=1){var i=n[r];this.addFeature(i,i.geometry,i.index,e);}},us.prototype.isEmpty=function(){return 0===this.layoutVertexArray.length},us.prototype.uploadPending=function(){return !this.uploaded||this.programConfigurations.needsUpload},us.prototype.upload=function(t){this.uploaded||(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,is),this.indexBuffer=t.createIndexBuffer(this.indexArray)),this.programConfigurations.upload(t),this.uploaded=!0;},us.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy());},us.prototype.addFeature=function(t,e,r,n){for(var i=this.layers[0].layout,a=i.get("line-join").evaluate(t,{}),o=i.get("line-cap"),s=i.get("line-miter-limit"),u=i.get("line-round-limit"),l=0,p=e;l<p.length;l+=1){var c=p[l];this.addLine(c,t,a,o,s,u,r,n);}},us.prototype.addLine=function(t,e,r,n,i,a,o,s){if(this.distance=0,this.scaledDistance=0,this.totalDistance=0,e.properties&&e.properties.hasOwnProperty("mapbox_clip_start")&&e.properties.hasOwnProperty("mapbox_clip_end")){this.clipStart=+e.properties.mapbox_clip_start,this.clipEnd=+e.properties.mapbox_clip_end;for(var u=0;u<t.length-1;u++)this.totalDistance+=t[u].dist(t[u+1]);}for(var l="Polygon"===as[e.type],p=t.length;p>=2&&t[p-1].equals(t[p-2]);)p--;for(var c=0;c<p-1&&t[c].equals(t[c+1]);)c++;if(!(p<(l?3:2))){"bevel"===r&&(i=1.05);var h,f=ha/(512*this.overscaling)*15,y=this.segments.prepareSegment(10*p,this.layoutVertexArray,this.indexArray),d=void 0,m=void 0,v=void 0,g=void 0;this.e1=this.e2=-1,l&&(h=t[p-2],g=t[c].sub(h)._unit()._perp());for(var x=c;x<p;x++)if(!(m=l&&x===p-1?t[c+1]:t[x+1])||!t[x].equals(m)){g&&(v=g),h&&(d=h),h=t[x],g=m?m.sub(h)._unit()._perp():v;var b=(v=v||g).add(g);0===b.x&&0===b.y||b._unit();var _=v.x*g.x+v.y*g.y,w=b.x*g.x+b.y*g.y,A=0!==w?1/w:1/0,k=2*Math.sqrt(2-2*w),S=w<os&&d&&m,I=v.x*g.y-v.y*g.x>0;if(S&&x>c){var z=h.dist(d);if(z>2*f){var C=h.sub(h.sub(d)._mult(f/z)._round());this.updateDistance(d,C),this.addCurrentVertex(C,v,0,0,y),d=C;}}var B=d&&m,P=B?r:l?"butt":n;if(B&&"round"===P&&(A<a?P="miter":A<=2&&(P="fakeround")),"miter"===P&&A>i&&(P="bevel"),"bevel"===P&&(A>2&&(P="flipbevel"),A<i&&(P="miter")),d&&this.updateDistance(d,h),"miter"===P)b._mult(A),this.addCurrentVertex(h,b,0,0,y);else if("flipbevel"===P){if(A>100)b=g.mult(-1);else{var E=A*v.add(g).mag()/v.sub(g).mag();b._perp()._mult(E*(I?-1:1));}this.addCurrentVertex(h,b,0,0,y),this.addCurrentVertex(h,b.mult(-1),0,0,y);}else if("bevel"===P||"fakeround"===P){var M=-Math.sqrt(A*A-1),T=I?M:0,V=I?0:M;if(d&&this.addCurrentVertex(h,v,T,V,y),"fakeround"===P)for(var F=Math.round(180*k/Math.PI/20),O=1;O<F;O++){var L=O/F;if(.5!==L){var D=L-.5;L+=L*D*(L-1)*((1.0904+_*(_*(3.55645-1.43519*_)-3.2452))*D*D+(.848013+_*(.215638*_-1.06021)));}var U=g.sub(v)._mult(L)._add(v)._unit()._mult(I?-1:1);this.addHalfVertex(h,U.x,U.y,!1,I,0,y);}m&&this.addCurrentVertex(h,g,-T,-V,y);}else if("butt"===P)this.addCurrentVertex(h,b,0,0,y);else if("square"===P){var R=d?1:-1;this.addCurrentVertex(h,b,R,R,y);}else"round"===P&&(d&&(this.addCurrentVertex(h,v,0,0,y),this.addCurrentVertex(h,v,1,1,y,!0)),m&&(this.addCurrentVertex(h,g,-1,-1,y,!0),this.addCurrentVertex(h,g,0,0,y)));if(S&&x<p-1){var j=h.dist(m);if(j>2*f){var q=h.add(m.sub(h)._mult(f/j)._round());this.updateDistance(h,q),this.addCurrentVertex(q,g,0,0,y),h=q;}}}this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length,e,o,s);}},us.prototype.addCurrentVertex=function(t,e,r,n,i,a){void 0===a&&(a=!1);var o=e.x+e.y*r,s=e.y-e.x*r,u=-e.x+e.y*n,l=-e.y-e.x*n;this.addHalfVertex(t,o,s,a,!1,r,i),this.addHalfVertex(t,u,l,a,!0,-n,i),this.distance>ss/2&&0===this.totalDistance&&(this.distance=0,this.addCurrentVertex(t,e,r,n,i,a));},us.prototype.addHalfVertex=function(t,e,r,n,i,a,o){var s=t.x,u=t.y,l=.5*this.scaledDistance;this.layoutVertexArray.emplaceBack((s<<1)+(n?1:0),(u<<1)+(i?1:0),Math.round(63*e)+128,Math.round(63*r)+128,1+(0===a?0:a<0?-1:1)|(63&l)<<2,l>>6);var p=o.vertexLength++;this.e1>=0&&this.e2>=0&&(this.indexArray.emplaceBack(this.e1,this.e2,p),o.primitiveLength++),i?this.e2=p:this.e1=p;},us.prototype.updateDistance=function(t,e){this.distance+=t.dist(e),this.scaledDistance=this.totalDistance>0?(this.clipStart+(this.clipEnd-this.clipStart)*this.distance/this.totalDistance)*(ss-1):this.distance;},_n("LineBucket",us,{omit:["layers","patternFeatures"]});var ls=new ri({"line-cap":new $n(It.layout_line["line-cap"]),"line-join":new Wn(It.layout_line["line-join"]),"line-miter-limit":new $n(It.layout_line["line-miter-limit"]),"line-round-limit":new $n(It.layout_line["line-round-limit"]),"line-sort-key":new Wn(It.layout_line["line-sort-key"])}),ps={paint:new ri({"line-opacity":new Wn(It.paint_line["line-opacity"]),"line-color":new Wn(It.paint_line["line-color"]),"line-translate":new $n(It.paint_line["line-translate"]),"line-translate-anchor":new $n(It.paint_line["line-translate-anchor"]),"line-width":new Wn(It.paint_line["line-width"]),"line-gap-width":new Wn(It.paint_line["line-gap-width"]),"line-offset":new Wn(It.paint_line["line-offset"]),"line-blur":new Wn(It.paint_line["line-blur"]),"line-dasharray":new ti(It.paint_line["line-dasharray"]),"line-pattern":new Qn(It.paint_line["line-pattern"]),"line-gradient":new ei(It.paint_line["line-gradient"])}),layout:ls},cs=new(function(t){function e(){t.apply(this,arguments);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.possiblyEvaluate=function(e,r){return r=new qn(Math.floor(r.zoom),{now:r.now,fadeDuration:r.fadeDuration,zoomHistory:r.zoomHistory,transition:r.transition}),t.prototype.possiblyEvaluate.call(this,e,r)},e.prototype.evaluate=function(e,r,n,i){return r=c({},r,{zoom:Math.floor(r.zoom)}),t.prototype.evaluate.call(this,e,r,n,i)},e}(Wn))(ps.paint.properties["line-width"].specification);cs.useIntegerZoom=!0;var hs=function(t){function e(e){t.call(this,e,ps);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype._handleSpecialPaintPropertyUpdate=function(t){"line-gradient"===t&&this._updateGradient();},e.prototype._updateGradient=function(){var t=this._transitionablePaint._values["line-gradient"].value.expression;this.gradient=Ga(t,"lineProgress"),this.gradientTexture=null;},e.prototype.recalculate=function(e,r){t.prototype.recalculate.call(this,e,r),this.paint._values["line-floorwidth"]=cs.possiblyEvaluate(this._transitioningPaint._values["line-width"].value,e);},e.prototype.createBucket=function(t){return new us(t)},e.prototype.queryRadius=function(t){var e=t,r=fs(Ba("line-width",this,e),Ba("line-gap-width",this,e)),n=Ba("line-offset",this,e);return r/2+Math.abs(n)+Pa(this.paint.get("line-translate"))},e.prototype.queryIntersectsFeature=function(t,e,r,n,a,o,s){var u=Ea(t,this.paint.get("line-translate"),this.paint.get("line-translate-anchor"),o.angle,s),l=s/2*fs(this.paint.get("line-width").evaluate(e,r),this.paint.get("line-gap-width").evaluate(e,r)),p=this.paint.get("line-offset").evaluate(e,r);return p&&(n=function(t,e){for(var r=[],n=new i(0,0),a=0;a<t.length;a++){for(var o=t[a],s=[],u=0;u<o.length;u++){var l=o[u-1],p=o[u],c=o[u+1],h=0===u?n:p.sub(l)._unit()._perp(),f=u===o.length-1?n:c.sub(p)._unit()._perp(),y=h._add(f)._unit(),d=y.x*f.x+y.y*f.y;y._mult(1/d),s.push(y._mult(e)._add(p));}r.push(s);}return r}(n,p*s)),function(t,e,r){for(var n=0;n<e.length;n++){var i=e[n];if(t.length>=3)for(var a=0;a<i.length;a++)if(za(t,i[a]))return !0;if(_a(t,i,r))return !0}return !1}(u,n,l)},e.prototype.isTileClipped=function(){return !0},e}(ni);function fs(t,e){return e>0?e+2*t:t}var ys=si([{name:"a_pos_offset",components:4,type:"Int16"},{name:"a_data",components:4,type:"Uint16"}]),ds=si([{name:"a_projected_pos",components:3,type:"Float32"}],4),ms=(si([{name:"a_fade_opacity",components:1,type:"Uint32"}],4),si([{name:"a_placed",components:2,type:"Uint8"},{name:"a_shift",components:2,type:"Float32"}])),vs=(si([{type:"Int16",name:"anchorPointX"},{type:"Int16",name:"anchorPointY"},{type:"Int16",name:"x1"},{type:"Int16",name:"y1"},{type:"Int16",name:"x2"},{type:"Int16",name:"y2"},{type:"Uint32",name:"featureIndex"},{type:"Uint16",name:"sourceLayerIndex"},{type:"Uint16",name:"bucketIndex"},{type:"Int16",name:"radius"},{type:"Int16",name:"signedDistanceFromAnchor"}]),si([{name:"a_pos",components:2,type:"Int16"},{name:"a_anchor_pos",components:2,type:"Int16"},{name:"a_extrude",components:2,type:"Int16"}],4)),gs=si([{name:"a_pos",components:2,type:"Int16"},{name:"a_anchor_pos",components:2,type:"Int16"},{name:"a_extrude",components:2,type:"Int16"}],4);si([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Uint16",name:"glyphStartIndex"},{type:"Uint16",name:"numGlyphs"},{type:"Uint32",name:"vertexStartIndex"},{type:"Uint32",name:"lineStartIndex"},{type:"Uint32",name:"lineLength"},{type:"Uint16",name:"segment"},{type:"Uint16",name:"lowerSize"},{type:"Uint16",name:"upperSize"},{type:"Float32",name:"lineOffsetX"},{type:"Float32",name:"lineOffsetY"},{type:"Uint8",name:"writingMode"},{type:"Uint8",name:"placedOrientation"},{type:"Uint8",name:"hidden"},{type:"Uint32",name:"crossTileID"},{type:"Int16",name:"associatedIconIndex"}]),si([{type:"Int16",name:"anchorX"},{type:"Int16",name:"anchorY"},{type:"Int16",name:"rightJustifiedTextSymbolIndex"},{type:"Int16",name:"centerJustifiedTextSymbolIndex"},{type:"Int16",name:"leftJustifiedTextSymbolIndex"},{type:"Int16",name:"verticalPlacedTextSymbolIndex"},{type:"Int16",name:"placedIconSymbolIndex"},{type:"Int16",name:"verticalPlacedIconSymbolIndex"},{type:"Uint16",name:"key"},{type:"Uint16",name:"textBoxStartIndex"},{type:"Uint16",name:"textBoxEndIndex"},{type:"Uint16",name:"verticalTextBoxStartIndex"},{type:"Uint16",name:"verticalTextBoxEndIndex"},{type:"Uint16",name:"iconBoxStartIndex"},{type:"Uint16",name:"iconBoxEndIndex"},{type:"Uint16",name:"verticalIconBoxStartIndex"},{type:"Uint16",name:"verticalIconBoxEndIndex"},{type:"Uint16",name:"featureIndex"},{type:"Uint16",name:"numHorizontalGlyphVertices"},{type:"Uint16",name:"numVerticalGlyphVertices"},{type:"Uint16",name:"numIconVertices"},{type:"Uint16",name:"numVerticalIconVertices"},{type:"Uint32",name:"crossTileID"},{type:"Float32",name:"textBoxScale"},{type:"Float32",components:2,name:"textOffset"}]),si([{type:"Float32",name:"offsetX"}]),si([{type:"Int16",name:"x"},{type:"Int16",name:"y"},{type:"Int16",name:"tileUnitDistanceFromAnchor"}]);function xs(t,e,r){return t.sections.forEach((function(t){t.text=function(t,e,r){var n=e.layout.get("text-transform").evaluate(r,{});return "uppercase"===n?t=t.toLocaleUpperCase():"lowercase"===n&&(t=t.toLocaleLowerCase()),jn.applyArabicShaping&&(t=jn.applyArabicShaping(t)),t}(t.text,e,r);})),t}var bs={"!":"︕","#":"＃",$:"＄","%":"％","&":"＆","(":"︵",")":"︶","*":"＊","+":"＋",",":"︐","-":"︲",".":"・","/":"／",":":"︓",";":"︔","<":"︿","=":"＝",">":"﹀","?":"︖","@":"＠","[":"﹇","\\":"＼","]":"﹈","^":"＾",_:"︳","`":"｀","{":"︷","|":"―","}":"︸","~":"～","¢":"￠","£":"￡","¥":"￥","¦":"￤","¬":"￢","¯":"￣","–":"︲","—":"︱","‘":"﹃","’":"﹄","“":"﹁","”":"﹂","…":"︙","‧":"・","₩":"￦","、":"︑","。":"︒","〈":"︿","〉":"﹀","《":"︽","》":"︾","「":"﹁","」":"﹂","『":"﹃","』":"﹄","【":"︻","】":"︼","〔":"︹","〕":"︺","〖":"︗","〗":"︘","！":"︕","（":"︵","）":"︶","，":"︐","－":"︲","．":"・","：":"︓","；":"︔","＜":"︿","＞":"﹀","？":"︖","［":"﹇","］":"﹈","＿":"︳","｛":"︷","｜":"―","｝":"︸","｟":"︵","｠":"︶","｡":"︒","｢":"﹁","｣":"﹂"};var _s=24,ws={horizontal:1,vertical:2,horizontalOnly:3},As=function(){this.text="",this.sectionIndex=[],this.sections=[];};function ks(t,e,r,n,i,a,o,s,u,l,p,c){var h,f=As.fromFeature(t,r);l===ws.vertical&&f.verticalizePunctuation();var y=jn.processBidirectionalText,d=jn.processStyledBidirectionalText;if(y&&1===f.sections.length){h=[];for(var m=0,v=y(f.toString(),Ps(f,s,n,e,c));m<v.length;m+=1){var g=v[m],x=new As;x.text=g,x.sections=f.sections;for(var b=0;b<g.length;b++)x.sectionIndex.push(0);h.push(x);}}else if(d){h=[];for(var _=0,w=d(f.text,f.sectionIndex,Ps(f,s,n,e,c));_<w.length;_+=1){var A=w[_],k=new As;k.text=A[0],k.sectionIndex=A[1],k.sections=f.sections,h.push(k);}}else h=function(t,e){for(var r=[],n=t.text,i=0,a=0,o=e;a<o.length;a+=1){var s=o[a];r.push(t.substring(i,s)),i=s;}return i<n.length&&r.push(t.substring(i,n.length)),r}(f,Ps(f,s,n,e,c));var S=[],I={positionedGlyphs:S,text:f.toString(),top:u[1],bottom:u[1],left:u[0],right:u[0],writingMode:l,lineCount:h.length,yOffset:-17};return function(t,e,r,n,i,a,o,s,u){for(var l=0,p=t.yOffset,c=0,h=t.positionedGlyphs,f="right"===a?1:"left"===a?0:.5,y=0,d=r;y<d.length;y+=1){var m=d[y];m.trim();var v=m.getMaxScale();if(m.length()){for(var g=h.length,x=0;x<m.length();x++){var b=m.getSection(x),_=m.getSectionIndex(x),w=m.getCharCode(x),A=24*(v-b.scale),k=e[b.fontStack],S=k&&k[w];S&&(o===ws.horizontal||!u&&!Pn(w)||u&&(Ss[w]||(z=w,zn.Arabic(z)||zn["Arabic Supplement"](z)||zn["Arabic Extended-A"](z)||zn["Arabic Presentation Forms-A"](z)||zn["Arabic Presentation Forms-B"](z)))?(h.push({glyph:w,x:l,y:p+A,vertical:!1,scale:b.scale,fontStack:b.fontStack,sectionIndex:_}),l+=S.metrics.advance*b.scale+s):(h.push({glyph:w,x:l,y:p+A,vertical:!0,scale:b.scale,fontStack:b.fontStack,sectionIndex:_}),l+=_s*b.scale+s));}if(h.length!==g){var I=l-s;c=Math.max(I,c),Ms(h,e,g,h.length-1,f);}l=0,p+=n*v;}else p+=n;}var z;var C=Es(i),B=C.horizontalAlign,P=C.verticalAlign;!function(t,e,r,n,i,a,o){for(var s=(e-r)*i,u=(-n*o+.5)*a,l=0;l<t.length;l++)t[l].x+=s,t[l].y+=u;}(h,f,B,P,c,n,r.length);var E=p-t.yOffset;t.top+=-P*E,t.bottom=t.top+E,t.left+=-B*c,t.right=t.left+c;}(I,e,h,i,a,o,l,s,p),!!S.length&&I}As.fromFeature=function(t,e){for(var r=new As,n=0;n<t.sections.length;n++){var i=t.sections[n];r.sections.push({scale:i.scale||1,fontStack:i.fontStack||e}),r.text+=i.text;for(var a=0;a<i.text.length;a++)r.sectionIndex.push(n);}return r},As.prototype.length=function(){return this.text.length},As.prototype.getSection=function(t){return this.sections[this.sectionIndex[t]]},As.prototype.getSectionIndex=function(t){return this.sectionIndex[t]},As.prototype.getCharCode=function(t){return this.text.charCodeAt(t)},As.prototype.verticalizePunctuation=function(){this.text=function(t){for(var e="",r=0;r<t.length;r++){var n=t.charCodeAt(r+1)||null,i=t.charCodeAt(r-1)||null;(!n||!En(n)||bs[t[r+1]])&&(!i||!En(i)||bs[t[r-1]])&&bs[t[r]]?e+=bs[t[r]]:e+=t[r];}return e}(this.text);},As.prototype.trim=function(){for(var t=0,e=0;e<this.text.length&&Ss[this.text.charCodeAt(e)];e++)t++;for(var r=this.text.length,n=this.text.length-1;n>=0&&n>=t&&Ss[this.text.charCodeAt(n)];n--)r--;this.text=this.text.substring(t,r),this.sectionIndex=this.sectionIndex.slice(t,r);},As.prototype.substring=function(t,e){var r=new As;return r.text=this.text.substring(t,e),r.sectionIndex=this.sectionIndex.slice(t,e),r.sections=this.sections,r},As.prototype.toString=function(){return this.text},As.prototype.getMaxScale=function(){var t=this;return this.sectionIndex.reduce((function(e,r){return Math.max(e,t.sections[r].scale)}),0)};var Ss={9:!0,10:!0,11:!0,12:!0,13:!0,32:!0},Is={};function zs(t,e,r,n){var i=Math.pow(t-e,2);return n?t<e?i/2:2*i:i+Math.abs(r)*r}function Cs(t,e,r){var n=0;return 10===t&&(n-=1e4),r&&(n+=150),40!==t&&65288!==t||(n+=50),41!==e&&65289!==e||(n+=50),n}function Bs(t,e,r,n,i,a){for(var o=null,s=zs(e,r,i,a),u=0,l=n;u<l.length;u+=1){var p=l[u],c=zs(e-p.x,r,i,a)+p.badness;c<=s&&(o=p,s=c);}return {index:t,x:e,priorBreak:o,badness:s}}function Ps(t,e,r,n,i){if("point"!==i)return [];if(!t)return [];for(var a,o=[],s=function(t,e,r,n){for(var i=0,a=0;a<t.length();a++){var o=t.getSection(a),s=n[o.fontStack],u=s&&s[t.getCharCode(a)];u&&(i+=u.metrics.advance*o.scale+e);}return i/Math.max(1,Math.ceil(i/r))}(t,e,r,n),u=t.text.indexOf("​")>=0,l=0,p=0;p<t.length();p++){var c=t.getSection(p),h=t.getCharCode(p),f=n[c.fontStack],y=f&&f[h];if(y&&!Ss[h]&&(l+=y.metrics.advance*c.scale+e),p<t.length()-1){var d=!!(!((a=h)<11904)&&(zn["Bopomofo Extended"](a)||zn.Bopomofo(a)||zn["CJK Compatibility Forms"](a)||zn["CJK Compatibility Ideographs"](a)||zn["CJK Compatibility"](a)||zn["CJK Radicals Supplement"](a)||zn["CJK Strokes"](a)||zn["CJK Symbols and Punctuation"](a)||zn["CJK Unified Ideographs Extension A"](a)||zn["CJK Unified Ideographs"](a)||zn["Enclosed CJK Letters and Months"](a)||zn["Halfwidth and Fullwidth Forms"](a)||zn.Hiragana(a)||zn["Ideographic Description Characters"](a)||zn["Kangxi Radicals"](a)||zn["Katakana Phonetic Extensions"](a)||zn.Katakana(a)||zn["Vertical Forms"](a)||zn["Yi Radicals"](a)||zn["Yi Syllables"](a)));(Is[h]||d)&&o.push(Bs(p+1,l,s,o,Cs(h,t.getCharCode(p+1),d&&u),!1));}}return function t(e){return e?t(e.priorBreak).concat(e.index):[]}(Bs(t.length(),l,s,o,0,!0))}function Es(t){var e=.5,r=.5;switch(t){case"right":case"top-right":case"bottom-right":e=1;break;case"left":case"top-left":case"bottom-left":e=0;}switch(t){case"bottom":case"bottom-right":case"bottom-left":r=1;break;case"top":case"top-right":case"top-left":r=0;}return {horizontalAlign:e,verticalAlign:r}}function Ms(t,e,r,n,i){if(i){var a=t[n],o=e[a.fontStack],s=o&&o[a.glyph];if(s)for(var u=s.metrics.advance*a.scale,l=(t[n].x+u)*i,p=r;p<=n;p++)t[p].x-=l;}}function Ts(t,e,r,n,i,a){var o,s,u,l,p=t.image,c=e.left*a,h=e.right*a;"width"===r||"both"===r?(l=i[0]+c-n[3],s=i[0]+h+n[1]):s=(l=i[0]+(c+h-p.displaySize[0])/2)+p.displaySize[0];var f=e.top*a,y=e.bottom*a;return "height"===r||"both"===r?(o=i[1]+f-n[0],u=i[1]+y+n[2]):u=(o=i[1]+(f+y-p.displaySize[1])/2)+p.displaySize[1],{image:p,top:o,right:s,bottom:u,left:l}}Is[10]=!0,Is[32]=!0,Is[38]=!0,Is[40]=!0,Is[41]=!0,Is[43]=!0,Is[45]=!0,Is[47]=!0,Is[173]=!0,Is[183]=!0,Is[8203]=!0,Is[8208]=!0,Is[8211]=!0,Is[8231]=!0;var Vs=function(t){function e(e,r,n,i){t.call(this,e,r),this.angle=n,void 0!==i&&(this.segment=i);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.clone=function(){return new e(this.x,this.y,this.angle,this.segment)},e}(i);_n("Anchor",Vs);var Fs=256;function Os(t,e){var r=e.expression;if("constant"===r.kind)return {kind:"constant",layoutSize:r.evaluate(new qn(t+1))};if("source"===r.kind)return {kind:"source"};for(var n=r.zoomStops,i=r.interpolationType,a=0;a<n.length&&n[a]<=t;)a++;for(var o=a=Math.max(0,a-1);o<n.length&&n[o]<t+1;)o++;o=Math.min(n.length-1,o);var s=n[a],u=n[o];return "composite"===r.kind?{kind:"composite",minZoom:s,maxZoom:u,interpolationType:i}:{kind:"camera",minZoom:s,maxZoom:u,minSize:r.evaluate(new qn(s)),maxSize:r.evaluate(new qn(u)),interpolationType:i}}function Ls(t,e,r){var n=e.uSize,i=e.uSizeT,a=r.lowerSize,o=r.upperSize;return "source"===t.kind?a/Fs:"composite"===t.kind?Se(a/Fs,o/Fs,i):n}function Ds(t,e){var r=0,n=0;if("constant"===t.kind)n=t.layoutSize;else if("source"!==t.kind){var i=t.interpolationType,a=t.minZoom,o=t.maxZoom,s=i?l(Ze.interpolationFactor(i,e,a,o),0,1):0;"camera"===t.kind?n=Se(t.minSize,t.maxSize,s):r=s;}return {uSizeT:r,uSize:n}}var Us=Object.freeze({__proto__:null,getSizeData:Os,evaluateSizeForFeature:Ls,evaluateSizeForZoom:Ds,SIZE_PACK_FACTOR:Fs}),Rs=Go.VectorTileFeature.types,js=[{name:"a_fade_opacity",components:1,type:"Uint8",offset:0}];function qs(t,e,r,n,i,a,o,s){t.emplaceBack(e,r,Math.round(32*n),Math.round(32*i),a,o,s?s[0]:0,s?s[1]:0);}function Ns(t,e,r){t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r),t.emplaceBack(e.x,e.y,r);}var Ks=function(t){this.layoutVertexArray=new yi,this.indexArray=new Si,this.programConfigurations=t,this.segments=new Ni,this.dynamicLayoutVertexArray=new di,this.opacityVertexArray=new mi,this.placedSymbolArray=new Ti;};Ks.prototype.upload=function(t,e,r,n){r&&(this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,ys.members),this.indexBuffer=t.createIndexBuffer(this.indexArray,e),this.dynamicLayoutVertexBuffer=t.createVertexBuffer(this.dynamicLayoutVertexArray,ds.members,!0),this.opacityVertexBuffer=t.createVertexBuffer(this.opacityVertexArray,js,!0),this.opacityVertexBuffer.itemSize=1),(r||n)&&this.programConfigurations.upload(t);},Ks.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.programConfigurations.destroy(),this.segments.destroy(),this.dynamicLayoutVertexBuffer.destroy(),this.opacityVertexBuffer.destroy());},_n("SymbolBuffers",Ks);var Xs=function(t,e,r){this.layoutVertexArray=new t,this.layoutAttributes=e,this.indexArray=new r,this.segments=new Ni,this.collisionVertexArray=new xi;};Xs.prototype.upload=function(t){this.layoutVertexBuffer=t.createVertexBuffer(this.layoutVertexArray,this.layoutAttributes),this.indexBuffer=t.createIndexBuffer(this.indexArray),this.collisionVertexBuffer=t.createVertexBuffer(this.collisionVertexArray,ms.members,!0);},Xs.prototype.destroy=function(){this.layoutVertexBuffer&&(this.layoutVertexBuffer.destroy(),this.indexBuffer.destroy(),this.segments.destroy(),this.collisionVertexBuffer.destroy());},_n("CollisionBuffers",Xs);var Zs=function(t){this.collisionBoxArray=t.collisionBoxArray,this.zoom=t.zoom,this.overscaling=t.overscaling,this.layers=t.layers,this.layerIds=this.layers.map((function(t){return t.id})),this.index=t.index,this.pixelRatio=t.pixelRatio,this.sourceLayerIndex=t.sourceLayerIndex,this.hasPattern=!1,this.hasPaintOverrides=!1;var e=this.layers[0]._unevaluatedLayout._values;this.textSizeData=Os(this.zoom,e["text-size"]),this.iconSizeData=Os(this.zoom,e["icon-size"]);var r=this.layers[0].layout,n=r.get("symbol-sort-key"),i=r.get("symbol-z-order");this.sortFeaturesByKey="viewport-y"!==i&&void 0!==n.constantOr(1);var a="viewport-y"===i||"auto"===i&&!this.sortFeaturesByKey;this.sortFeaturesByY=a&&(r.get("text-allow-overlap")||r.get("icon-allow-overlap")||r.get("text-ignore-placement")||r.get("icon-ignore-placement")),"point"===r.get("symbol-placement")&&(this.writingModes=r.get("text-writing-mode").map((function(t){return ws[t]}))),this.stateDependentLayerIds=this.layers.filter((function(t){return t.isStateDependent()})).map((function(t){return t.id})),this.sourceID=t.sourceID;};Zs.prototype.createArrays=function(){var t=this.layers[0].layout;this.hasPaintOverrides=Ys.hasPaintOverrides(t),this.text=new Ks(new la(ys.members,this.layers,this.zoom,(function(t){return /^text/.test(t)}))),this.icon=new Ks(new la(ys.members,this.layers,this.zoom,(function(t){return /^icon/.test(t)}))),this.textCollisionBox=new Xs(gi,vs.members,Ii),this.iconCollisionBox=new Xs(gi,vs.members,Ii),this.textCollisionCircle=new Xs(gi,gs.members,Si),this.iconCollisionCircle=new Xs(gi,gs.members,Si),this.glyphOffsetArray=new Li,this.lineVertexArray=new Ui,this.symbolInstances=new Fi;},Zs.prototype.calculateGlyphDependencies=function(t,e,r,n,i){for(var a=0;a<t.length;a++)if(e[t.charCodeAt(a)]=!0,(r||n)&&i){var o=bs[t.charAt(a)];o&&(e[o.charCodeAt(0)]=!0);}},Zs.prototype.populate=function(t,e){var r=this.layers[0],n=r.layout,i=n.get("text-font"),a=n.get("text-field"),o=n.get("icon-image"),s=("constant"!==a.value.kind||a.value.value.toString().length>0)&&("constant"!==i.value.kind||i.value.value.length>0),u=("constant"!==o.value.kind||!!o.value.value)&&Object.keys(o.parameters).length>0,l=n.get("symbol-sort-key");if(this.features=[],s||u){for(var p=e.iconDependencies,c=e.glyphDependencies,h=e.availableImages,f=new qn(this.zoom),y=0,d=t;y<d.length;y+=1){var m=d[y],v=m.feature,g=m.index,x=m.sourceLayerIndex;if(r._featureFilter(f,v)){var b=void 0;if(s){var _=r.getValueAndResolveTokens("text-field",v,h);b=xs(_ instanceof Qt?_:Qt.fromString(_),r,v);}var w=void 0;if(u){var A=r.getValueAndResolveTokens("icon-image",v,h);w=A instanceof te?A:te.fromString(A);}if(b||w){var k=this.sortFeaturesByKey?l.evaluate(v,{}):void 0,S={text:b,icon:w,index:g,sourceLayerIndex:x,geometry:da(v),properties:v.properties,type:Rs[v.type],sortKey:k};if(void 0!==v.id&&(S.id=v.id),this.features.push(S),w&&(p[w.name]=!0),b){var I=i.evaluate(v,{}).join(","),z="map"===n.get("text-rotation-alignment")&&"point"!==n.get("symbol-placement");this.allowVerticalPlacement=this.writingModes&&this.writingModes.indexOf(ws.vertical)>=0;for(var C=0,B=b.sections;C<B.length;C+=1){var P=B[C],E=Cn(b.toString()),M=P.fontStack||I,T=c[M]=c[M]||{};this.calculateGlyphDependencies(P.text,T,z,this.allowVerticalPlacement,E);}}}}}"line"===n.get("symbol-placement")&&(this.features=function(t){var e={},r={},n=[],i=0;function a(e){n.push(t[e]),i++;}function o(t,e,i){var a=r[t];return delete r[t],r[e]=a,n[a].geometry[0].pop(),n[a].geometry[0]=n[a].geometry[0].concat(i[0]),a}function s(t,r,i){var a=e[r];return delete e[r],e[t]=a,n[a].geometry[0].shift(),n[a].geometry[0]=i[0].concat(n[a].geometry[0]),a}function u(t,e,r){var n=r?e[0][e[0].length-1]:e[0][0];return t+":"+n.x+":"+n.y}for(var l=0;l<t.length;l++){var p=t[l],c=p.geometry,h=p.text?p.text.toString():null;if(h){var f=u(h,c),y=u(h,c,!0);if(f in r&&y in e&&r[f]!==e[y]){var d=s(f,y,c),m=o(f,y,n[d].geometry);delete e[f],delete r[y],r[u(h,n[m].geometry,!0)]=m,n[d].geometry=null;}else f in r?o(f,y,c):y in e?s(f,y,c):(a(l),e[f]=i-1,r[y]=i-1);}else a(l);}return n.filter((function(t){return t.geometry}))}(this.features)),this.sortFeaturesByKey&&this.features.sort((function(t,e){return t.sortKey-e.sortKey}));}},Zs.prototype.update=function(t,e,r){this.stateDependentLayers.length&&(this.text.programConfigurations.updatePaintArrays(t,e,this.layers,r),this.icon.programConfigurations.updatePaintArrays(t,e,this.layers,r));},Zs.prototype.isEmpty=function(){return 0===this.symbolInstances.length},Zs.prototype.uploadPending=function(){return !this.uploaded||this.text.programConfigurations.needsUpload||this.icon.programConfigurations.needsUpload},Zs.prototype.upload=function(t){this.uploaded||(this.textCollisionBox.upload(t),this.iconCollisionBox.upload(t),this.textCollisionCircle.upload(t),this.iconCollisionCircle.upload(t)),this.text.upload(t,this.sortFeaturesByY,!this.uploaded,this.text.programConfigurations.needsUpload),this.icon.upload(t,this.sortFeaturesByY,!this.uploaded,this.icon.programConfigurations.needsUpload),this.uploaded=!0;},Zs.prototype.destroy=function(){this.text.destroy(),this.icon.destroy(),this.textCollisionBox.destroy(),this.iconCollisionBox.destroy(),this.textCollisionCircle.destroy(),this.iconCollisionCircle.destroy();},Zs.prototype.addToLineVertexArray=function(t,e){var r=this.lineVertexArray.length;if(void 0!==t.segment){for(var n=t.dist(e[t.segment+1]),i=t.dist(e[t.segment]),a={},o=t.segment+1;o<e.length;o++)a[o]={x:e[o].x,y:e[o].y,tileUnitDistanceFromAnchor:n},o<e.length-1&&(n+=e[o+1].dist(e[o]));for(var s=t.segment||0;s>=0;s--)a[s]={x:e[s].x,y:e[s].y,tileUnitDistanceFromAnchor:i},s>0&&(i+=e[s-1].dist(e[s]));for(var u=0;u<e.length;u++){var l=a[u];this.lineVertexArray.emplaceBack(l.x,l.y,l.tileUnitDistanceFromAnchor);}}return {lineStartIndex:r,lineLength:this.lineVertexArray.length-r}},Zs.prototype.addSymbols=function(t,e,r,n,i,a,o,s,u,l,p){var c=this,h=t.indexArray,f=t.layoutVertexArray,y=t.dynamicLayoutVertexArray,d=t.segments.prepareSegment(4*e.length,t.layoutVertexArray,t.indexArray,a.sortKey),m=this.glyphOffsetArray.length,v=d.vertexLength,g=this.allowVerticalPlacement&&o===ws.vertical?Math.PI/2:0,x=function(t){var e=t.tl,n=t.tr,i=t.bl,a=t.br,o=t.tex,u=d.vertexLength,l=t.glyphOffset[1];qs(f,s.x,s.y,e.x,l+e.y,o.x,o.y,r),qs(f,s.x,s.y,n.x,l+n.y,o.x+o.w,o.y,r),qs(f,s.x,s.y,i.x,l+i.y,o.x,o.y+o.h,r),qs(f,s.x,s.y,a.x,l+a.y,o.x+o.w,o.y+o.h,r),Ns(y,s,g),h.emplaceBack(u,u+1,u+2),h.emplaceBack(u+1,u+2,u+3),d.vertexLength+=4,d.primitiveLength+=2,c.glyphOffsetArray.emplaceBack(t.glyphOffset[0]);};if(a.text&&a.text.sections){var b=a.text.sections;if(this.hasPaintOverrides){for(var _,w=function(e,r){void 0===_||_===e&&!r||t.programConfigurations.populatePaintArrays(t.layoutVertexArray.length,a,a.index,{},b[_]),_=e;},A=0,k=e;A<k.length;A+=1){var S=k[A];w(S.sectionIndex,!1),x(S);}w(_,!0);}else{for(var I=0,z=e;I<z.length;I+=1){x(z[I]);}t.programConfigurations.populatePaintArrays(t.layoutVertexArray.length,a,a.index,{},b[0]);}}else{for(var C=0,B=e;C<B.length;C+=1){x(B[C]);}t.programConfigurations.populatePaintArrays(t.layoutVertexArray.length,a,a.index,{});}t.placedSymbolArray.emplaceBack(s.x,s.y,m,this.glyphOffsetArray.length-m,v,u,l,s.segment,r?r[0]:0,r?r[1]:0,n[0],n[1],o,0,!1,0,p);},Zs.prototype._addCollisionDebugVertex=function(t,e,r,n,i,a){return e.emplaceBack(0,0),t.emplaceBack(r.x,r.y,n,i,Math.round(a.x),Math.round(a.y))},Zs.prototype.addCollisionDebugVertices=function(t,e,r,n,a,o,s,u){var l=a.segments.prepareSegment(4,a.layoutVertexArray,a.indexArray),p=l.vertexLength,c=a.layoutVertexArray,h=a.collisionVertexArray,f=s.anchorX,y=s.anchorY;if(this._addCollisionDebugVertex(c,h,o,f,y,new i(t,e)),this._addCollisionDebugVertex(c,h,o,f,y,new i(r,e)),this._addCollisionDebugVertex(c,h,o,f,y,new i(r,n)),this._addCollisionDebugVertex(c,h,o,f,y,new i(t,n)),l.vertexLength+=4,u){var d=a.indexArray;d.emplaceBack(p,p+1,p+2),d.emplaceBack(p,p+2,p+3),l.primitiveLength+=2;}else{var m=a.indexArray;m.emplaceBack(p,p+1),m.emplaceBack(p+1,p+2),m.emplaceBack(p+2,p+3),m.emplaceBack(p+3,p),l.primitiveLength+=4;}},Zs.prototype.addDebugCollisionBoxes=function(t,e,r,n){for(var i=t;i<e;i++){var a=this.collisionBoxArray.get(i),o=a.x1,s=a.y1,u=a.x2,l=a.y2,p=a.radius>0;this.addCollisionDebugVertices(o,s,u,l,p?n?this.textCollisionCircle:this.iconCollisionCircle:n?this.textCollisionBox:this.iconCollisionBox,a.anchorPoint,r,p);}},Zs.prototype.generateCollisionDebugBuffers=function(){for(var t=0;t<this.symbolInstances.length;t++){var e=this.symbolInstances.get(t);this.addDebugCollisionBoxes(e.textBoxStartIndex,e.textBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.verticalTextBoxStartIndex,e.verticalTextBoxEndIndex,e,!0),this.addDebugCollisionBoxes(e.iconBoxStartIndex,e.iconBoxEndIndex,e,!1),this.addDebugCollisionBoxes(e.verticalIconBoxStartIndex,e.verticalIconBoxEndIndex,e,!1);}},Zs.prototype._deserializeCollisionBoxesForSymbol=function(t,e,r,n,i,a,o,s,u){for(var l={},p=e;p<r;p++){var c=t.get(p);if(0===c.radius){l.textBox={x1:c.x1,y1:c.y1,x2:c.x2,y2:c.y2,anchorPointX:c.anchorPointX,anchorPointY:c.anchorPointY},l.textFeatureIndex=c.featureIndex;break}l.textCircles||(l.textCircles=[],l.textFeatureIndex=c.featureIndex);l.textCircles.push(c.anchorPointX,c.anchorPointY,c.radius,c.signedDistanceFromAnchor,1);}for(var h=n;h<i;h++){var f=t.get(h);if(0===f.radius){l.verticalTextBox={x1:f.x1,y1:f.y1,x2:f.x2,y2:f.y2,anchorPointX:f.anchorPointX,anchorPointY:f.anchorPointY},l.verticalTextFeatureIndex=f.featureIndex;break}}for(var y=a;y<o;y++){var d=t.get(y);if(0===d.radius){l.iconBox={x1:d.x1,y1:d.y1,x2:d.x2,y2:d.y2,anchorPointX:d.anchorPointX,anchorPointY:d.anchorPointY},l.iconFeatureIndex=d.featureIndex;break}}for(var m=s;m<u;m++){var v=t.get(m);if(0===v.radius){l.verticalIconBox={x1:v.x1,y1:v.y1,x2:v.x2,y2:v.y2,anchorPointX:v.anchorPointX,anchorPointY:v.anchorPointY},l.verticalIconFeatureIndex=v.featureIndex;break}}return l},Zs.prototype.deserializeCollisionBoxes=function(t){this.collisionArrays=[];for(var e=0;e<this.symbolInstances.length;e++){var r=this.symbolInstances.get(e);this.collisionArrays.push(this._deserializeCollisionBoxesForSymbol(t,r.textBoxStartIndex,r.textBoxEndIndex,r.verticalTextBoxStartIndex,r.verticalTextBoxEndIndex,r.iconBoxStartIndex,r.iconBoxEndIndex,r.verticalIconBoxStartIndex,r.verticalIconBoxEndIndex));}},Zs.prototype.hasTextData=function(){return this.text.segments.get().length>0},Zs.prototype.hasIconData=function(){return this.icon.segments.get().length>0},Zs.prototype.hasTextCollisionBoxData=function(){return this.textCollisionBox.segments.get().length>0},Zs.prototype.hasIconCollisionBoxData=function(){return this.iconCollisionBox.segments.get().length>0},Zs.prototype.hasTextCollisionCircleData=function(){return this.textCollisionCircle.segments.get().length>0},Zs.prototype.hasIconCollisionCircleData=function(){return this.iconCollisionCircle.segments.get().length>0},Zs.prototype.addIndicesForPlacedTextSymbol=function(t){for(var e=this.text.placedSymbolArray.get(t),r=e.vertexStartIndex+4*e.numGlyphs,n=e.vertexStartIndex;n<r;n+=4)this.text.indexArray.emplaceBack(n,n+1,n+2),this.text.indexArray.emplaceBack(n+1,n+2,n+3);},Zs.prototype.addIndicesForPlacedIconSymbol=function(t){var e=this.icon.placedSymbolArray.get(t);if(e.numGlyphs){var r=e.vertexStartIndex;this.icon.indexArray.emplaceBack(r,r+1,r+2),this.icon.indexArray.emplaceBack(r+1,r+2,r+3);}},Zs.prototype.getSortedSymbolIndexes=function(t){if(this.sortedAngle===t&&void 0!==this.symbolInstanceIndexes)return this.symbolInstanceIndexes;for(var e=Math.sin(t),r=Math.cos(t),n=[],i=[],a=[],o=0;o<this.symbolInstances.length;++o){a.push(o);var s=this.symbolInstances.get(o);n.push(0|Math.round(e*s.anchorX+r*s.anchorY)),i.push(s.featureIndex);}return a.sort((function(t,e){return n[t]-n[e]||i[e]-i[t]})),a},Zs.prototype.sortFeatures=function(t){var e=this;if(this.sortFeaturesByY&&this.sortedAngle!==t&&!(this.text.segments.get().length>1||this.icon.segments.get().length>1)){this.symbolInstanceIndexes=this.getSortedSymbolIndexes(t),this.sortedAngle=t,this.text.indexArray.clear(),this.icon.indexArray.clear(),this.featureSortOrder=[];for(var r=0,n=this.symbolInstanceIndexes;r<n.length;r+=1){var i=n[r],a=this.symbolInstances.get(i);this.featureSortOrder.push(a.featureIndex),[a.rightJustifiedTextSymbolIndex,a.centerJustifiedTextSymbolIndex,a.leftJustifiedTextSymbolIndex].forEach((function(t,r,n){t>=0&&n.indexOf(t)===r&&e.addIndicesForPlacedTextSymbol(t);})),a.verticalPlacedTextSymbolIndex>=0&&this.addIndicesForPlacedTextSymbol(a.verticalPlacedTextSymbolIndex),a.placedIconSymbolIndex>=0&&this.addIndicesForPlacedIconSymbol(a.placedIconSymbolIndex),a.verticalPlacedIconSymbolIndex>=0&&this.addIndicesForPlacedIconSymbol(a.verticalPlacedIconSymbolIndex);}this.text.indexBuffer&&this.text.indexBuffer.updateData(this.text.indexArray),this.icon.indexBuffer&&this.icon.indexBuffer.updateData(this.icon.indexArray);}},_n("SymbolBucket",Zs,{omit:["layers","collisionBoxArray","features","compareText"]}),Zs.MAX_GLYPHS=65535,Zs.addDynamicAttributes=Ns;var Gs=new ri({"symbol-placement":new $n(It.layout_symbol["symbol-placement"]),"symbol-spacing":new $n(It.layout_symbol["symbol-spacing"]),"symbol-avoid-edges":new $n(It.layout_symbol["symbol-avoid-edges"]),"symbol-sort-key":new Wn(It.layout_symbol["symbol-sort-key"]),"symbol-z-order":new $n(It.layout_symbol["symbol-z-order"]),"icon-allow-overlap":new $n(It.layout_symbol["icon-allow-overlap"]),"icon-ignore-placement":new $n(It.layout_symbol["icon-ignore-placement"]),"icon-optional":new $n(It.layout_symbol["icon-optional"]),"icon-rotation-alignment":new $n(It.layout_symbol["icon-rotation-alignment"]),"icon-size":new Wn(It.layout_symbol["icon-size"]),"icon-text-fit":new $n(It.layout_symbol["icon-text-fit"]),"icon-text-fit-padding":new $n(It.layout_symbol["icon-text-fit-padding"]),"icon-image":new Wn(It.layout_symbol["icon-image"]),"icon-rotate":new Wn(It.layout_symbol["icon-rotate"]),"icon-padding":new $n(It.layout_symbol["icon-padding"]),"icon-keep-upright":new $n(It.layout_symbol["icon-keep-upright"]),"icon-offset":new Wn(It.layout_symbol["icon-offset"]),"icon-anchor":new Wn(It.layout_symbol["icon-anchor"]),"icon-pitch-alignment":new $n(It.layout_symbol["icon-pitch-alignment"]),"text-pitch-alignment":new $n(It.layout_symbol["text-pitch-alignment"]),"text-rotation-alignment":new $n(It.layout_symbol["text-rotation-alignment"]),"text-field":new Wn(It.layout_symbol["text-field"]),"text-font":new Wn(It.layout_symbol["text-font"]),"text-size":new Wn(It.layout_symbol["text-size"]),"text-max-width":new Wn(It.layout_symbol["text-max-width"]),"text-line-height":new $n(It.layout_symbol["text-line-height"]),"text-letter-spacing":new Wn(It.layout_symbol["text-letter-spacing"]),"text-justify":new Wn(It.layout_symbol["text-justify"]),"text-radial-offset":new Wn(It.layout_symbol["text-radial-offset"]),"text-variable-anchor":new $n(It.layout_symbol["text-variable-anchor"]),"text-anchor":new Wn(It.layout_symbol["text-anchor"]),"text-max-angle":new $n(It.layout_symbol["text-max-angle"]),"text-writing-mode":new $n(It.layout_symbol["text-writing-mode"]),"text-rotate":new Wn(It.layout_symbol["text-rotate"]),"text-padding":new $n(It.layout_symbol["text-padding"]),"text-keep-upright":new $n(It.layout_symbol["text-keep-upright"]),"text-transform":new Wn(It.layout_symbol["text-transform"]),"text-offset":new Wn(It.layout_symbol["text-offset"]),"text-allow-overlap":new $n(It.layout_symbol["text-allow-overlap"]),"text-ignore-placement":new $n(It.layout_symbol["text-ignore-placement"]),"text-optional":new $n(It.layout_symbol["text-optional"])}),Js={paint:new ri({"icon-opacity":new Wn(It.paint_symbol["icon-opacity"]),"icon-color":new Wn(It.paint_symbol["icon-color"]),"icon-halo-color":new Wn(It.paint_symbol["icon-halo-color"]),"icon-halo-width":new Wn(It.paint_symbol["icon-halo-width"]),"icon-halo-blur":new Wn(It.paint_symbol["icon-halo-blur"]),"icon-translate":new $n(It.paint_symbol["icon-translate"]),"icon-translate-anchor":new $n(It.paint_symbol["icon-translate-anchor"]),"text-opacity":new Wn(It.paint_symbol["text-opacity"]),"text-color":new Wn(It.paint_symbol["text-color"],{runtimeType:Ut,getOverride:function(t){return t.textColor},hasOverride:function(t){return !!t.textColor}}),"text-halo-color":new Wn(It.paint_symbol["text-halo-color"]),"text-halo-width":new Wn(It.paint_symbol["text-halo-width"]),"text-halo-blur":new Wn(It.paint_symbol["text-halo-blur"]),"text-translate":new $n(It.paint_symbol["text-translate"]),"text-translate-anchor":new $n(It.paint_symbol["text-translate-anchor"])}),layout:Gs},Hs=function(t){this.type=t.property.overrides?t.property.overrides.runtimeType:Ft,this.defaultValue=t;};Hs.prototype.evaluate=function(t){if(t.formattedSection){var e=this.defaultValue.property.overrides;if(e&&e.hasOverride(t.formattedSection))return e.getOverride(t.formattedSection)}return t.feature&&t.featureState?this.defaultValue.evaluate(t.feature,t.featureState):this.defaultValue.property.specification.default},Hs.prototype.eachChild=function(t){this.defaultValue.isConstant()||t(this.defaultValue.value._styleExpression.expression);},Hs.prototype.possibleOutputs=function(){return [void 0]},Hs.prototype.serialize=function(){return null},_n("FormatSectionOverride",Hs,{omit:["defaultValue"]});var Ys=function(t){function e(e){t.call(this,e,Js);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.recalculate=function(e,r){if(t.prototype.recalculate.call(this,e,r),"auto"===this.layout.get("icon-rotation-alignment")&&("point"!==this.layout.get("symbol-placement")?this.layout._values["icon-rotation-alignment"]="map":this.layout._values["icon-rotation-alignment"]="viewport"),"auto"===this.layout.get("text-rotation-alignment")&&("point"!==this.layout.get("symbol-placement")?this.layout._values["text-rotation-alignment"]="map":this.layout._values["text-rotation-alignment"]="viewport"),"auto"===this.layout.get("text-pitch-alignment")&&(this.layout._values["text-pitch-alignment"]=this.layout.get("text-rotation-alignment")),"auto"===this.layout.get("icon-pitch-alignment")&&(this.layout._values["icon-pitch-alignment"]=this.layout.get("icon-rotation-alignment")),"point"===this.layout.get("symbol-placement")){var n=this.layout.get("text-writing-mode");if(n){for(var i=[],a=0,o=n;a<o.length;a+=1){var s=o[a];i.indexOf(s)<0&&i.push(s);}this.layout._values["text-writing-mode"]=i;}else this.layout._values["text-writing-mode"]=["horizontal"];}this._setPaintOverrides();},e.prototype.getValueAndResolveTokens=function(t,e,r){var n=this.layout.get(t).evaluate(e,{},r),i=this._unevaluatedLayout._values[t];return i.isDataDriven()||Br(i.value)||!n?n:function(t,e){return e.replace(/{([^{}]+)}/g,(function(e,r){return r in t?String(t[r]):""}))}(e.properties,n)},e.prototype.createBucket=function(t){return new Zs(t)},e.prototype.queryRadius=function(){return 0},e.prototype.queryIntersectsFeature=function(){return !1},e.prototype._setPaintOverrides=function(){for(var t=0,r=Js.paint.overridableProperties;t<r.length;t+=1){var n=r[t];if(e.hasPaintOverride(this.layout,n)){var i=this.paint.get(n),a=new Hs(i),o=new Cr(a,i.property.specification),s=null;s="constant"===i.value.kind||"source"===i.value.kind?new Er("source",o):new Mr("composite",o,i.value.zoomStops,i.value._interpolationType),this.paint._values[n]=new Hn(i.property,s,i.parameters);}}},e.prototype._handleOverridablePaintPropertyUpdate=function(t,r,n){return !(!this.layout||r.isDataDriven()||n.isDataDriven())&&e.hasPaintOverride(this.layout,t)},e.hasPaintOverride=function(t,e){var r=t.get("text-field"),n=Js.paint.properties[e],i=!1,a=function(t){for(var e=0,r=t;e<r.length;e+=1){var a=r[e];if(n.overrides&&n.overrides.hasOverride(a))return void(i=!0)}};if("constant"===r.value.kind&&r.value.value instanceof Qt)a(r.value.value.sections);else if("source"===r.value.kind){var o=function(t){if(!i)if(t instanceof ie&&re(t.value)===Nt){var e=t.value;a(e.sections);}else t instanceof ue?a(t.sections):t.eachChild(o);},s=r.value;s._styleExpression&&o(s._styleExpression.expression);}return i},e.hasPaintOverrides=function(t){for(var r=0,n=Js.paint.overridableProperties;r<n.length;r+=1){var i=n[r];if(e.hasPaintOverride(t,i))return !0}return !1},e}(ni),$s={paint:new ri({"background-color":new $n(It.paint_background["background-color"]),"background-pattern":new ti(It.paint_background["background-pattern"]),"background-opacity":new $n(It.paint_background["background-opacity"])})},Ws=function(t){function e(e){t.call(this,e,$s);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(ni),Qs={paint:new ri({"raster-opacity":new $n(It.paint_raster["raster-opacity"]),"raster-hue-rotate":new $n(It.paint_raster["raster-hue-rotate"]),"raster-brightness-min":new $n(It.paint_raster["raster-brightness-min"]),"raster-brightness-max":new $n(It.paint_raster["raster-brightness-max"]),"raster-saturation":new $n(It.paint_raster["raster-saturation"]),"raster-contrast":new $n(It.paint_raster["raster-contrast"]),"raster-resampling":new $n(It.paint_raster["raster-resampling"]),"raster-fade-duration":new $n(It.paint_raster["raster-fade-duration"])})},tu=function(t){function e(e){t.call(this,e,Qs);}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(ni);var eu=function(t){function e(e){t.call(this,e,{}),this.implementation=e;}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.is3D=function(){return "3d"===this.implementation.renderingMode},e.prototype.hasOffscreenPass=function(){return void 0!==this.implementation.prerender},e.prototype.recalculate=function(){},e.prototype.updateTransitions=function(){},e.prototype.hasTransition=function(){},e.prototype.serialize=function(){},e.prototype.onAdd=function(t){this.implementation.onAdd&&this.implementation.onAdd(t,t.painter.context.gl);},e.prototype.onRemove=function(t){this.implementation.onRemove&&this.implementation.onRemove(t,t.painter.context.gl);},e}(ni),ru={circle:Da,heatmap:Ja,hillshade:Ya,fill:Lo,"fill-extrusion":es,line:hs,symbol:Ys,background:Ws,raster:tu};function nu(t){for(var e=0,r=0,n=0,i=t;n<i.length;n+=1){var a=i[n];e+=a.w*a.h,r=Math.max(r,a.w);}t.sort((function(t,e){return e.h-t.h}));for(var o=[{x:0,y:0,w:Math.max(Math.ceil(Math.sqrt(e/.95)),r),h:1/0}],s=0,u=0,l=0,p=t;l<p.length;l+=1)for(var c=p[l],h=o.length-1;h>=0;h--){var f=o[h];if(!(c.w>f.w||c.h>f.h)){if(c.x=f.x,c.y=f.y,u=Math.max(u,c.y+c.h),s=Math.max(s,c.x+c.w),c.w===f.w&&c.h===f.h){var y=o.pop();h<o.length&&(o[h]=y);}else c.h===f.h?(f.x+=c.w,f.w-=c.w):c.w===f.w?(f.y+=c.h,f.h-=c.h):(o.push({x:f.x+c.w,y:f.y,w:f.w-c.w,h:c.h}),f.y+=c.h,f.h-=c.h);break}}return {w:s,h:u,fill:e/(s*u)||0}}var iu=function(t,e){var r=e.pixelRatio,n=e.version;this.paddedRect=t,this.pixelRatio=r,this.version=n;},au={tl:{configurable:!0},br:{configurable:!0},tlbr:{configurable:!0},displaySize:{configurable:!0}};au.tl.get=function(){return [this.paddedRect.x+1,this.paddedRect.y+1]},au.br.get=function(){return [this.paddedRect.x+this.paddedRect.w-1,this.paddedRect.y+this.paddedRect.h-1]},au.tlbr.get=function(){return this.tl.concat(this.br)},au.displaySize.get=function(){return [(this.paddedRect.w-2)/this.pixelRatio,(this.paddedRect.h-2)/this.pixelRatio]},Object.defineProperties(iu.prototype,au);var ou=function(t,e){var r={},n={};this.haveRenderCallbacks=[];var i=[];this.addImages(t,r,i),this.addImages(e,n,i);var a=nu(i),o=a.w,s=a.h,u=new Xa({width:o||1,height:s||1});for(var l in t){var p=t[l],c=r[l].paddedRect;Xa.copy(p.data,u,{x:0,y:0},{x:c.x+1,y:c.y+1},p.data);}for(var h in e){var f=e[h],y=n[h].paddedRect,d=y.x+1,m=y.y+1,v=f.data.width,g=f.data.height;Xa.copy(f.data,u,{x:0,y:0},{x:d,y:m},f.data),Xa.copy(f.data,u,{x:0,y:g-1},{x:d,y:m-1},{width:v,height:1}),Xa.copy(f.data,u,{x:0,y:0},{x:d,y:m+g},{width:v,height:1}),Xa.copy(f.data,u,{x:v-1,y:0},{x:d-1,y:m},{width:1,height:g}),Xa.copy(f.data,u,{x:0,y:0},{x:d+v,y:m},{width:1,height:g});}this.image=u,this.iconPositions=r,this.patternPositions=n;};ou.prototype.addImages=function(t,e,r){for(var n in t){var i=t[n],a={x:0,y:0,w:i.data.width+2,h:i.data.height+2};r.push(a),e[n]=new iu(a,i),i.hasRenderCallback&&this.haveRenderCallbacks.push(n);}},ou.prototype.patchUpdatedImages=function(t,e){for(var r in t.dispatchRenderCallbacks(this.haveRenderCallbacks),t.updatedImages)this.patchUpdatedImage(this.iconPositions[r],t.getImage(r),e),this.patchUpdatedImage(this.patternPositions[r],t.getImage(r),e);},ou.prototype.patchUpdatedImage=function(t,e,r){if(t&&e&&t.version!==e.version){t.version=e.version;var n=t.tl,i=n[0],a=n[1];r.update(e.data,void 0,{x:i,y:a});}},_n("ImagePosition",iu),_n("ImageAtlas",ou);var su=self.HTMLImageElement,uu=self.HTMLCanvasElement,lu=self.HTMLVideoElement,pu=self.ImageData,cu=function(t,e,r,n){this.context=t,this.format=r,this.texture=t.gl.createTexture(),this.update(e,n);};cu.prototype.update=function(t,e,r){var n=t.width,i=t.height,a=!(this.size&&this.size[0]===n&&this.size[1]===i||r),o=this.context,s=o.gl;if(this.useMipmap=Boolean(e&&e.useMipmap),s.bindTexture(s.TEXTURE_2D,this.texture),o.pixelStoreUnpackFlipY.set(!1),o.pixelStoreUnpack.set(1),o.pixelStoreUnpackPremultiplyAlpha.set(this.format===s.RGBA&&(!e||!1!==e.premultiply)),a)this.size=[n,i],t instanceof su||t instanceof uu||t instanceof lu||t instanceof pu?s.texImage2D(s.TEXTURE_2D,0,this.format,this.format,s.UNSIGNED_BYTE,t):s.texImage2D(s.TEXTURE_2D,0,this.format,n,i,0,this.format,s.UNSIGNED_BYTE,t.data);else{var u=r||{x:0,y:0},l=u.x,p=u.y;t instanceof su||t instanceof uu||t instanceof lu||t instanceof pu?s.texSubImage2D(s.TEXTURE_2D,0,l,p,s.RGBA,s.UNSIGNED_BYTE,t):s.texSubImage2D(s.TEXTURE_2D,0,l,p,n,i,s.RGBA,s.UNSIGNED_BYTE,t.data);}this.useMipmap&&this.isSizePowerOfTwo()&&s.generateMipmap(s.TEXTURE_2D);},cu.prototype.bind=function(t,e,r){var n=this.context.gl;n.bindTexture(n.TEXTURE_2D,this.texture),r!==n.LINEAR_MIPMAP_NEAREST||this.isSizePowerOfTwo()||(r=n.LINEAR),t!==this.filter&&(n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,t),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,r||t),this.filter=t),e!==this.wrap&&(n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,e),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,e),this.wrap=e);},cu.prototype.isSizePowerOfTwo=function(){return this.size[0]===this.size[1]&&Math.log(this.size[0])/Math.LN2%1==0},cu.prototype.destroy=function(){this.context.gl.deleteTexture(this.texture),this.texture=null;};var hu={read:function(t,e,r,n,i){var a,o,s=8*i-n-1,u=(1<<s)-1,l=u>>1,p=-7,c=r?i-1:0,h=r?-1:1,f=t[e+c];for(c+=h,a=f&(1<<-p)-1,f>>=-p,p+=s;p>0;a=256*a+t[e+c],c+=h,p-=8);for(o=a&(1<<-p)-1,a>>=-p,p+=n;p>0;o=256*o+t[e+c],c+=h,p-=8);if(0===a)a=1-l;else{if(a===u)return o?NaN:1/0*(f?-1:1);o+=Math.pow(2,n),a-=l;}return (f?-1:1)*o*Math.pow(2,a-n)},write:function(t,e,r,n,i,a){var o,s,u,l=8*a-i-1,p=(1<<l)-1,c=p>>1,h=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,f=n?0:a-1,y=n?1:-1,d=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(s=isNaN(e)?1:0,o=p):(o=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-o))<1&&(o--,u*=2),(e+=o+c>=1?h/u:h*Math.pow(2,1-c))*u>=2&&(o++,u/=2),o+c>=p?(s=0,o=p):o+c>=1?(s=(e*u-1)*Math.pow(2,i),o+=c):(s=e*Math.pow(2,c-1)*Math.pow(2,i),o=0));i>=8;t[r+f]=255&s,f+=y,s/=256,i-=8);for(o=o<<i|s,l+=i;l>0;t[r+f]=255&o,f+=y,o/=256,l-=8);t[r+f-y]|=128*d;}},fu=yu;function yu(t){this.buf=ArrayBuffer.isView&&ArrayBuffer.isView(t)?t:new Uint8Array(t||0),this.pos=0,this.type=0,this.length=this.buf.length;}yu.Varint=0,yu.Fixed64=1,yu.Bytes=2,yu.Fixed32=5;var du="undefined"==typeof TextDecoder?null:new TextDecoder("utf8");function mu(t){return t.type===yu.Bytes?t.readVarint()+t.pos:t.pos+1}function vu(t,e,r){return r?4294967296*e+(t>>>0):4294967296*(e>>>0)+(t>>>0)}function gu(t,e,r){var n=e<=16383?1:e<=2097151?2:e<=268435455?3:Math.floor(Math.log(e)/(7*Math.LN2));r.realloc(n);for(var i=r.pos-1;i>=t;i--)r.buf[i+n]=r.buf[i];}function xu(t,e){for(var r=0;r<t.length;r++)e.writeVarint(t[r]);}function bu(t,e){for(var r=0;r<t.length;r++)e.writeSVarint(t[r]);}function _u(t,e){for(var r=0;r<t.length;r++)e.writeFloat(t[r]);}function wu(t,e){for(var r=0;r<t.length;r++)e.writeDouble(t[r]);}function Au(t,e){for(var r=0;r<t.length;r++)e.writeBoolean(t[r]);}function ku(t,e){for(var r=0;r<t.length;r++)e.writeFixed32(t[r]);}function Su(t,e){for(var r=0;r<t.length;r++)e.writeSFixed32(t[r]);}function Iu(t,e){for(var r=0;r<t.length;r++)e.writeFixed64(t[r]);}function zu(t,e){for(var r=0;r<t.length;r++)e.writeSFixed64(t[r]);}function Cu(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+16777216*t[e+3]}function Bu(t,e,r){t[r]=e,t[r+1]=e>>>8,t[r+2]=e>>>16,t[r+3]=e>>>24;}function Pu(t,e){return (t[e]|t[e+1]<<8|t[e+2]<<16)+(t[e+3]<<24)}yu.prototype={destroy:function(){this.buf=null;},readFields:function(t,e,r){for(r=r||this.length;this.pos<r;){var n=this.readVarint(),i=n>>3,a=this.pos;this.type=7&n,t(i,e,this),this.pos===a&&this.skip(n);}return e},readMessage:function(t,e){return this.readFields(t,e,this.readVarint()+this.pos)},readFixed32:function(){var t=Cu(this.buf,this.pos);return this.pos+=4,t},readSFixed32:function(){var t=Pu(this.buf,this.pos);return this.pos+=4,t},readFixed64:function(){var t=Cu(this.buf,this.pos)+4294967296*Cu(this.buf,this.pos+4);return this.pos+=8,t},readSFixed64:function(){var t=Cu(this.buf,this.pos)+4294967296*Pu(this.buf,this.pos+4);return this.pos+=8,t},readFloat:function(){var t=hu.read(this.buf,this.pos,!0,23,4);return this.pos+=4,t},readDouble:function(){var t=hu.read(this.buf,this.pos,!0,52,8);return this.pos+=8,t},readVarint:function(t){var e,r,n=this.buf;return e=127&(r=n[this.pos++]),r<128?e:(e|=(127&(r=n[this.pos++]))<<7,r<128?e:(e|=(127&(r=n[this.pos++]))<<14,r<128?e:(e|=(127&(r=n[this.pos++]))<<21,r<128?e:function(t,e,r){var n,i,a=r.buf;if(i=a[r.pos++],n=(112&i)>>4,i<128)return vu(t,n,e);if(i=a[r.pos++],n|=(127&i)<<3,i<128)return vu(t,n,e);if(i=a[r.pos++],n|=(127&i)<<10,i<128)return vu(t,n,e);if(i=a[r.pos++],n|=(127&i)<<17,i<128)return vu(t,n,e);if(i=a[r.pos++],n|=(127&i)<<24,i<128)return vu(t,n,e);if(i=a[r.pos++],n|=(1&i)<<31,i<128)return vu(t,n,e);throw new Error("Expected varint not more than 10 bytes")}(e|=(15&(r=n[this.pos]))<<28,t,this))))},readVarint64:function(){return this.readVarint(!0)},readSVarint:function(){var t=this.readVarint();return t%2==1?(t+1)/-2:t/2},readBoolean:function(){return Boolean(this.readVarint())},readString:function(){var t=this.readVarint()+this.pos,e=this.pos;return this.pos=t,t-e>=12&&du?function(t,e,r){return du.decode(t.subarray(e,r))}(this.buf,e,t):function(t,e,r){var n="",i=e;for(;i<r;){var a,o,s,u=t[i],l=null,p=u>239?4:u>223?3:u>191?2:1;if(i+p>r)break;1===p?u<128&&(l=u):2===p?128==(192&(a=t[i+1]))&&(l=(31&u)<<6|63&a)<=127&&(l=null):3===p?(a=t[i+1],o=t[i+2],128==(192&a)&&128==(192&o)&&((l=(15&u)<<12|(63&a)<<6|63&o)<=2047||l>=55296&&l<=57343)&&(l=null)):4===p&&(a=t[i+1],o=t[i+2],s=t[i+3],128==(192&a)&&128==(192&o)&&128==(192&s)&&((l=(15&u)<<18|(63&a)<<12|(63&o)<<6|63&s)<=65535||l>=1114112)&&(l=null)),null===l?(l=65533,p=1):l>65535&&(l-=65536,n+=String.fromCharCode(l>>>10&1023|55296),l=56320|1023&l),n+=String.fromCharCode(l),i+=p;}return n}(this.buf,e,t)},readBytes:function(){var t=this.readVarint()+this.pos,e=this.buf.subarray(this.pos,t);return this.pos=t,e},readPackedVarint:function(t,e){if(this.type!==yu.Bytes)return t.push(this.readVarint(e));var r=mu(this);for(t=t||[];this.pos<r;)t.push(this.readVarint(e));return t},readPackedSVarint:function(t){if(this.type!==yu.Bytes)return t.push(this.readSVarint());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readSVarint());return t},readPackedBoolean:function(t){if(this.type!==yu.Bytes)return t.push(this.readBoolean());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readBoolean());return t},readPackedFloat:function(t){if(this.type!==yu.Bytes)return t.push(this.readFloat());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readFloat());return t},readPackedDouble:function(t){if(this.type!==yu.Bytes)return t.push(this.readDouble());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readDouble());return t},readPackedFixed32:function(t){if(this.type!==yu.Bytes)return t.push(this.readFixed32());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readFixed32());return t},readPackedSFixed32:function(t){if(this.type!==yu.Bytes)return t.push(this.readSFixed32());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed32());return t},readPackedFixed64:function(t){if(this.type!==yu.Bytes)return t.push(this.readFixed64());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readFixed64());return t},readPackedSFixed64:function(t){if(this.type!==yu.Bytes)return t.push(this.readSFixed64());var e=mu(this);for(t=t||[];this.pos<e;)t.push(this.readSFixed64());return t},skip:function(t){var e=7&t;if(e===yu.Varint)for(;this.buf[this.pos++]>127;);else if(e===yu.Bytes)this.pos=this.readVarint()+this.pos;else if(e===yu.Fixed32)this.pos+=4;else{if(e!==yu.Fixed64)throw new Error("Unimplemented type: "+e);this.pos+=8;}},writeTag:function(t,e){this.writeVarint(t<<3|e);},realloc:function(t){for(var e=this.length||16;e<this.pos+t;)e*=2;if(e!==this.length){var r=new Uint8Array(e);r.set(this.buf),this.buf=r,this.length=e;}},finish:function(){return this.length=this.pos,this.pos=0,this.buf.subarray(0,this.length)},writeFixed32:function(t){this.realloc(4),Bu(this.buf,t,this.pos),this.pos+=4;},writeSFixed32:function(t){this.realloc(4),Bu(this.buf,t,this.pos),this.pos+=4;},writeFixed64:function(t){this.realloc(8),Bu(this.buf,-1&t,this.pos),Bu(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeSFixed64:function(t){this.realloc(8),Bu(this.buf,-1&t,this.pos),Bu(this.buf,Math.floor(t*(1/4294967296)),this.pos+4),this.pos+=8;},writeVarint:function(t){(t=+t||0)>268435455||t<0?function(t,e){var r,n;t>=0?(r=t%4294967296|0,n=t/4294967296|0):(n=~(-t/4294967296),4294967295^(r=~(-t%4294967296))?r=r+1|0:(r=0,n=n+1|0));if(t>=0x10000000000000000||t<-0x10000000000000000)throw new Error("Given varint doesn't fit into 10 bytes");e.realloc(10),function(t,e,r){r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos++]=127&t|128,t>>>=7,r.buf[r.pos]=127&t;}(r,0,e),function(t,e){var r=(7&t)<<4;if(e.buf[e.pos++]|=r|((t>>>=3)?128:0),!t)return;if(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),!t)return;if(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),!t)return;if(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),!t)return;if(e.buf[e.pos++]=127&t|((t>>>=7)?128:0),!t)return;e.buf[e.pos++]=127&t;}(n,e);}(t,this):(this.realloc(4),this.buf[this.pos++]=127&t|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=127&(t>>>=7)|(t>127?128:0),t<=127||(this.buf[this.pos++]=t>>>7&127))));},writeSVarint:function(t){this.writeVarint(t<0?2*-t-1:2*t);},writeBoolean:function(t){this.writeVarint(Boolean(t));},writeString:function(t){t=String(t),this.realloc(4*t.length),this.pos++;var e=this.pos;this.pos=function(t,e,r){for(var n,i,a=0;a<e.length;a++){if((n=e.charCodeAt(a))>55295&&n<57344){if(!i){n>56319||a+1===e.length?(t[r++]=239,t[r++]=191,t[r++]=189):i=n;continue}if(n<56320){t[r++]=239,t[r++]=191,t[r++]=189,i=n;continue}n=i-55296<<10|n-56320|65536,i=null;}else i&&(t[r++]=239,t[r++]=191,t[r++]=189,i=null);n<128?t[r++]=n:(n<2048?t[r++]=n>>6|192:(n<65536?t[r++]=n>>12|224:(t[r++]=n>>18|240,t[r++]=n>>12&63|128),t[r++]=n>>6&63|128),t[r++]=63&n|128);}return r}(this.buf,t,this.pos);var r=this.pos-e;r>=128&&gu(e,r,this),this.pos=e-1,this.writeVarint(r),this.pos+=r;},writeFloat:function(t){this.realloc(4),hu.write(this.buf,t,this.pos,!0,23,4),this.pos+=4;},writeDouble:function(t){this.realloc(8),hu.write(this.buf,t,this.pos,!0,52,8),this.pos+=8;},writeBytes:function(t){var e=t.length;this.writeVarint(e),this.realloc(e);for(var r=0;r<e;r++)this.buf[this.pos++]=t[r];},writeRawMessage:function(t,e){this.pos++;var r=this.pos;t(e,this);var n=this.pos-r;n>=128&&gu(r,n,this),this.pos=r-1,this.writeVarint(n),this.pos+=n;},writeMessage:function(t,e,r){this.writeTag(t,yu.Bytes),this.writeRawMessage(e,r);},writePackedVarint:function(t,e){e.length&&this.writeMessage(t,xu,e);},writePackedSVarint:function(t,e){e.length&&this.writeMessage(t,bu,e);},writePackedBoolean:function(t,e){e.length&&this.writeMessage(t,Au,e);},writePackedFloat:function(t,e){e.length&&this.writeMessage(t,_u,e);},writePackedDouble:function(t,e){e.length&&this.writeMessage(t,wu,e);},writePackedFixed32:function(t,e){e.length&&this.writeMessage(t,ku,e);},writePackedSFixed32:function(t,e){e.length&&this.writeMessage(t,Su,e);},writePackedFixed64:function(t,e){e.length&&this.writeMessage(t,Iu,e);},writePackedSFixed64:function(t,e){e.length&&this.writeMessage(t,zu,e);},writeBytesField:function(t,e){this.writeTag(t,yu.Bytes),this.writeBytes(e);},writeFixed32Field:function(t,e){this.writeTag(t,yu.Fixed32),this.writeFixed32(e);},writeSFixed32Field:function(t,e){this.writeTag(t,yu.Fixed32),this.writeSFixed32(e);},writeFixed64Field:function(t,e){this.writeTag(t,yu.Fixed64),this.writeFixed64(e);},writeSFixed64Field:function(t,e){this.writeTag(t,yu.Fixed64),this.writeSFixed64(e);},writeVarintField:function(t,e){this.writeTag(t,yu.Varint),this.writeVarint(e);},writeSVarintField:function(t,e){this.writeTag(t,yu.Varint),this.writeSVarint(e);},writeStringField:function(t,e){this.writeTag(t,yu.Bytes),this.writeString(e);},writeFloatField:function(t,e){this.writeTag(t,yu.Fixed32),this.writeFloat(e);},writeDoubleField:function(t,e){this.writeTag(t,yu.Fixed64),this.writeDouble(e);},writeBooleanField:function(t,e){this.writeVarintField(t,Boolean(e));}};var Eu=3;function Mu(t,e,r){1===t&&r.readMessage(Tu,e);}function Tu(t,e,r){if(3===t){var n=r.readMessage(Vu,{}),i=n.id,a=n.bitmap,o=n.width,s=n.height,u=n.left,l=n.top,p=n.advance;e.push({id:i,bitmap:new Ka({width:o+2*Eu,height:s+2*Eu},a),metrics:{width:o,height:s,left:u,top:l,advance:p}});}}function Vu(t,e,r){1===t?e.id=r.readVarint():2===t?e.bitmap=r.readBytes():3===t?e.width=r.readVarint():4===t?e.height=r.readVarint():5===t?e.left=r.readSVarint():6===t?e.top=r.readSVarint():7===t&&(e.advance=r.readVarint());}var Fu=Eu,Ou=function(t){var e=this;this._callback=t,this._triggered=!1,"undefined"!=typeof MessageChannel&&(this._channel=new MessageChannel,this._channel.port2.onmessage=function(){e._triggered=!1,e._callback();});};Ou.prototype.trigger=function(){var t=this;this._triggered||(this._triggered=!0,this._channel?this._channel.port1.postMessage(!0):setTimeout((function(){t._triggered=!1,t._callback();}),0));},Ou.prototype.remove=function(){delete this._channel,this._callback=function(){};};var Lu=function(t,e,r){this.target=t,this.parent=e,this.mapId=r,this.callbacks={},this.tasks={},this.taskQueue=[],this.cancelCallbacks={},m(["receive","process"],this),this.invoker=new Ou(this.process),this.target.addEventListener("message",this.receive,!1);};function Du(t,e,r){var n=2*Math.PI*6378137/256/Math.pow(2,r);return [t*n-2*Math.PI*6378137/2,e*n-2*Math.PI*6378137/2]}Lu.prototype.send=function(t,e,r,n){var i=this,a=Math.round(1e18*Math.random()).toString(36).substring(0,10);r&&(this.callbacks[a]=r);var o=[];return this.target.postMessage({id:a,type:t,hasCallback:!!r,targetMapId:n,sourceMapId:this.mapId,data:kn(e,o)},o),{cancel:function(){r&&delete i.callbacks[a],i.target.postMessage({id:a,type:"<cancel>",targetMapId:n,sourceMapId:i.mapId});}}},Lu.prototype.receive=function(t){var e=t.data,r=e.id;if(r&&(!e.targetMapId||this.mapId===e.targetMapId))if("<cancel>"===e.type){delete this.tasks[r];var n=this.cancelCallbacks[r];delete this.cancelCallbacks[r],n&&n();}else this.tasks[r]=e,this.taskQueue.push(r),this.invoker.trigger();},Lu.prototype.process=function(){var t=this;if(this.taskQueue.length){var e=this.taskQueue.shift(),r=this.tasks[e];if(delete this.tasks[e],this.taskQueue.length&&this.invoker.trigger(),r)if("<response>"===r.type){var n=this.callbacks[e];delete this.callbacks[e],n&&(r.error?n(Sn(r.error)):n(null,Sn(r.data)));}else{var i=!1,a=r.hasCallback?function(r,n){i=!0,delete t.cancelCallbacks[e];var a=[];t.target.postMessage({id:e,type:"<response>",sourceMapId:t.mapId,error:r?kn(r):null,data:kn(n,a)},a);}:function(t){i=!0;},o=null,s=Sn(r.data);if(this.parent[r.type])o=this.parent[r.type](r.sourceMapId,s,a);else if(this.parent.getWorkerSource){var u=r.type.split(".");o=this.parent.getWorkerSource(r.sourceMapId,u[0],s.source)[u[1]](s,a);}else a(new Error("Could not find function "+r.type));!i&&o&&o.cancel&&(this.cancelCallbacks[e]=o.cancel);}}},Lu.prototype.remove=function(){this.invoker.remove(),this.target.removeEventListener("message",this.receive,!1);};var Uu=function(t,e){t&&(e?this.setSouthWest(t).setNorthEast(e):4===t.length?this.setSouthWest([t[0],t[1]]).setNorthEast([t[2],t[3]]):this.setSouthWest(t[0]).setNorthEast(t[1]));};Uu.prototype.setNorthEast=function(t){return this._ne=t instanceof Ru?new Ru(t.lng,t.lat):Ru.convert(t),this},Uu.prototype.setSouthWest=function(t){return this._sw=t instanceof Ru?new Ru(t.lng,t.lat):Ru.convert(t),this},Uu.prototype.extend=function(t){var e,r,n=this._sw,i=this._ne;if(t instanceof Ru)e=t,r=t;else{if(!(t instanceof Uu))return Array.isArray(t)?t.every(Array.isArray)?this.extend(Uu.convert(t)):this.extend(Ru.convert(t)):this;if(e=t._sw,r=t._ne,!e||!r)return this}return n||i?(n.lng=Math.min(e.lng,n.lng),n.lat=Math.min(e.lat,n.lat),i.lng=Math.max(r.lng,i.lng),i.lat=Math.max(r.lat,i.lat)):(this._sw=new Ru(e.lng,e.lat),this._ne=new Ru(r.lng,r.lat)),this},Uu.prototype.getCenter=function(){return new Ru((this._sw.lng+this._ne.lng)/2,(this._sw.lat+this._ne.lat)/2)},Uu.prototype.getSouthWest=function(){return this._sw},Uu.prototype.getNorthEast=function(){return this._ne},Uu.prototype.getNorthWest=function(){return new Ru(this.getWest(),this.getNorth())},Uu.prototype.getSouthEast=function(){return new Ru(this.getEast(),this.getSouth())},Uu.prototype.getWest=function(){return this._sw.lng},Uu.prototype.getSouth=function(){return this._sw.lat},Uu.prototype.getEast=function(){return this._ne.lng},Uu.prototype.getNorth=function(){return this._ne.lat},Uu.prototype.toArray=function(){return [this._sw.toArray(),this._ne.toArray()]},Uu.prototype.toString=function(){return "LngLatBounds("+this._sw.toString()+", "+this._ne.toString()+")"},Uu.prototype.isEmpty=function(){return !(this._sw&&this._ne)},Uu.convert=function(t){return !t||t instanceof Uu?t:new Uu(t)};var Ru=function(t,e){if(isNaN(t)||isNaN(e))throw new Error("Invalid LngLat object: ("+t+", "+e+")");if(this.lng=+t,this.lat=+e,this.lat>90||this.lat<-90)throw new Error("Invalid LngLat latitude value: must be between -90 and 90")};Ru.prototype.wrap=function(){return new Ru(p(this.lng,-180,180),this.lat)},Ru.prototype.toArray=function(){return [this.lng,this.lat]},Ru.prototype.toString=function(){return "LngLat("+this.lng+", "+this.lat+")"},Ru.prototype.toBounds=function(t){void 0===t&&(t=0);var e=360*t/40075017,r=e/Math.cos(Math.PI/180*this.lat);return new Uu(new Ru(this.lng-r,this.lat-e),new Ru(this.lng+r,this.lat+e))},Ru.convert=function(t){if(t instanceof Ru)return t;if(Array.isArray(t)&&(2===t.length||3===t.length))return new Ru(Number(t[0]),Number(t[1]));if(!Array.isArray(t)&&"object"==typeof t&&null!==t)return new Ru(Number("lng"in t?t.lng:t.lon),Number(t.lat));throw new Error("`LngLatLike` argument must be specified as a LngLat instance, an object {lng: <lng>, lat: <lat>}, an object {lon: <lng>, lat: <lat>}, or an array of [<lng>, <lat>]")};var ju=2*Math.PI*6378137;function qu(t){return ju*Math.cos(t*Math.PI/180)}function Nu(t){return (180+t)/360}function Ku(t){return (180-180/Math.PI*Math.log(Math.tan(Math.PI/4+t*Math.PI/360)))/360}function Xu(t,e){return t/qu(e)}function Zu(t){var e=180-360*t;return 360/Math.PI*Math.atan(Math.exp(e*Math.PI/180))-90}var Gu=function(t,e,r){void 0===r&&(r=0),this.x=+t,this.y=+e,this.z=+r;};Gu.fromLngLat=function(t,e){void 0===e&&(e=0);var r=Ru.convert(t);return new Gu(Nu(r.lng),Ku(r.lat),Xu(e,r.lat))},Gu.prototype.toLngLat=function(){return new Ru(360*this.x-180,Zu(this.y))},Gu.prototype.toAltitude=function(){return t=this.z,e=this.y,t*qu(Zu(e));var t,e;},Gu.prototype.meterInMercatorCoordinateUnits=function(){return 1/ju*(t=Zu(this.y),1/Math.cos(t*Math.PI/180));var t;};var Ju=function(t,e,r){this.z=t,this.x=e,this.y=r,this.key=$u(0,t,e,r);};Ju.prototype.equals=function(t){return this.z===t.z&&this.x===t.x&&this.y===t.y},Ju.prototype.url=function(t,e){var r,n,i,a,o,s=(r=this.x,n=this.y,i=this.z,a=Du(256*r,256*(n=Math.pow(2,i)-n-1),i),o=Du(256*(r+1),256*(n+1),i),a[0]+","+a[1]+","+o[0]+","+o[1]),u=function(t,e,r){for(var n,i="",a=t;a>0;a--)i+=(e&(n=1<<a-1)?1:0)+(r&n?2:0);return i}(this.z,this.x,this.y);return t[(this.x+this.y)%t.length].replace("{prefix}",(this.x%16).toString(16)+(this.y%16).toString(16)).replace("{z}",String(this.z)).replace("{x}",String(this.x)).replace("{y}",String("tms"===e?Math.pow(2,this.z)-this.y-1:this.y)).replace("{quadkey}",u).replace("{bbox-epsg-3857}",s)},Ju.prototype.getTilePoint=function(t){var e=Math.pow(2,this.z);return new i((t.x*e-this.x)*ha,(t.y*e-this.y)*ha)};var Hu=function(t,e){this.wrap=t,this.canonical=e,this.key=$u(t,e.z,e.x,e.y);},Yu=function(t,e,r,n,i){this.overscaledZ=t,this.wrap=e,this.canonical=new Ju(r,+n,+i),this.key=$u(e,t,n,i);};function $u(t,e,r,n){(t*=2)<0&&(t=-1*t-1);var i=1<<e;return 32*(i*i*t+i*n+r)+e}Yu.prototype.equals=function(t){return this.overscaledZ===t.overscaledZ&&this.wrap===t.wrap&&this.canonical.equals(t.canonical)},Yu.prototype.scaledTo=function(t){var e=this.canonical.z-t;return t>this.canonical.z?new Yu(t,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y):new Yu(t,this.wrap,t,this.canonical.x>>e,this.canonical.y>>e)},Yu.prototype.isChildOf=function(t){if(t.wrap!==this.wrap)return !1;var e=this.canonical.z-t.canonical.z;return 0===t.overscaledZ||t.overscaledZ<this.overscaledZ&&t.canonical.x===this.canonical.x>>e&&t.canonical.y===this.canonical.y>>e},Yu.prototype.children=function(t){if(this.overscaledZ>=t)return [new Yu(this.overscaledZ+1,this.wrap,this.canonical.z,this.canonical.x,this.canonical.y)];var e=this.canonical.z+1,r=2*this.canonical.x,n=2*this.canonical.y;return [new Yu(e,this.wrap,e,r,n),new Yu(e,this.wrap,e,r+1,n),new Yu(e,this.wrap,e,r,n+1),new Yu(e,this.wrap,e,r+1,n+1)]},Yu.prototype.isLessThan=function(t){return this.wrap<t.wrap||!(this.wrap>t.wrap)&&(this.overscaledZ<t.overscaledZ||!(this.overscaledZ>t.overscaledZ)&&(this.canonical.x<t.canonical.x||!(this.canonical.x>t.canonical.x)&&this.canonical.y<t.canonical.y))},Yu.prototype.wrapped=function(){return new Yu(this.overscaledZ,0,this.canonical.z,this.canonical.x,this.canonical.y)},Yu.prototype.unwrapTo=function(t){return new Yu(this.overscaledZ,t,this.canonical.z,this.canonical.x,this.canonical.y)},Yu.prototype.overscaleFactor=function(){return Math.pow(2,this.overscaledZ-this.canonical.z)},Yu.prototype.toUnwrapped=function(){return new Hu(this.wrap,this.canonical)},Yu.prototype.toString=function(){return this.overscaledZ+"/"+this.canonical.x+"/"+this.canonical.y},Yu.prototype.getTilePoint=function(t){return this.canonical.getTilePoint(new Gu(t.x-this.wrap,t.y))},_n("CanonicalTileID",Ju),_n("OverscaledTileID",Yu,{omit:["posMatrix"]});var Wu=function(t,e,r){if(this.uid=t,e.height!==e.width)throw new RangeError("DEM tiles must be square");if(r&&"mapbox"!==r&&"terrarium"!==r)return w('"'+r+'" is not a valid encoding type. Valid types include "mapbox" and "terrarium".');this.stride=e.height;var n=this.dim=e.height-2;this.data=new Uint32Array(e.data.buffer),this.encoding=r||"mapbox";for(var i=0;i<n;i++)this.data[this._idx(-1,i)]=this.data[this._idx(0,i)],this.data[this._idx(n,i)]=this.data[this._idx(n-1,i)],this.data[this._idx(i,-1)]=this.data[this._idx(i,0)],this.data[this._idx(i,n)]=this.data[this._idx(i,n-1)];this.data[this._idx(-1,-1)]=this.data[this._idx(0,0)],this.data[this._idx(n,-1)]=this.data[this._idx(n-1,0)],this.data[this._idx(-1,n)]=this.data[this._idx(0,n-1)],this.data[this._idx(n,n)]=this.data[this._idx(n-1,n-1)];};Wu.prototype.get=function(t,e){var r=new Uint8Array(this.data.buffer),n=4*this._idx(t,e);return ("terrarium"===this.encoding?this._unpackTerrarium:this._unpackMapbox)(r[n],r[n+1],r[n+2])},Wu.prototype.getUnpackVector=function(){return "terrarium"===this.encoding?[256,1,1/256,32768]:[6553.6,25.6,.1,1e4]},Wu.prototype._idx=function(t,e){if(t<-1||t>=this.dim+1||e<-1||e>=this.dim+1)throw new RangeError("out of range source coordinates for DEM data");return (e+1)*this.stride+(t+1)},Wu.prototype._unpackMapbox=function(t,e,r){return (256*t*256+256*e+r)/10-1e4},Wu.prototype._unpackTerrarium=function(t,e,r){return 256*t+e+r/256-32768},Wu.prototype.getPixels=function(){return new Xa({width:this.stride,height:this.stride},new Uint8Array(this.data.buffer))},Wu.prototype.backfillBorder=function(t,e,r){if(this.dim!==t.dim)throw new Error("dem dimension mismatch");var n=e*this.dim,i=e*this.dim+this.dim,a=r*this.dim,o=r*this.dim+this.dim;switch(e){case-1:n=i-1;break;case 1:i=n+1;}switch(r){case-1:a=o-1;break;case 1:o=a+1;}for(var s=-e*this.dim,u=-r*this.dim,l=a;l<o;l++)for(var p=n;p<i;p++)this.data[this._idx(p,l)]=t.data[this._idx(p+s,l+u)];},_n("DEMData",Wu);var Qu=si([{name:"a_pos",type:"Int16",components:2},{name:"a_texture_pos",type:"Int16",components:2}]);var tl=function(t){this._stringToNumber={},this._numberToString=[];for(var e=0;e<t.length;e++){var r=t[e];this._stringToNumber[r]=e,this._numberToString[e]=r;}};tl.prototype.encode=function(t){return this._stringToNumber[t]},tl.prototype.decode=function(t){return this._numberToString[t]};var el=function(t,e,r,n){this.type="Feature",this._vectorTileFeature=t,t._z=e,t._x=r,t._y=n,this.properties=t.properties,null!=t.id&&(this.id=t.id);},rl={geometry:{configurable:!0}};rl.geometry.get=function(){return void 0===this._geometry&&(this._geometry=this._vectorTileFeature.toGeoJSON(this._vectorTileFeature._x,this._vectorTileFeature._y,this._vectorTileFeature._z).geometry),this._geometry},rl.geometry.set=function(t){this._geometry=t;},el.prototype.toJSON=function(){var t={geometry:this.geometry};for(var e in this)"_geometry"!==e&&"_vectorTileFeature"!==e&&(t[e]=this[e]);return t},Object.defineProperties(el.prototype,rl);var nl=function(){this.state={},this.stateChanges={},this.deletedStates={};};nl.prototype.updateState=function(t,e,r){var n=String(e);if(this.stateChanges[t]=this.stateChanges[t]||{},this.stateChanges[t][n]=this.stateChanges[t][n]||{},c(this.stateChanges[t][n],r),null===this.deletedStates[t])for(var i in this.deletedStates[t]={},this.state[t])i!==n&&(this.deletedStates[t][i]=null);else if(this.deletedStates[t]&&null===this.deletedStates[t][n])for(var a in this.deletedStates[t][n]={},this.state[t][n])r[a]||(this.deletedStates[t][n][a]=null);else for(var o in r){this.deletedStates[t]&&this.deletedStates[t][n]&&null===this.deletedStates[t][n][o]&&delete this.deletedStates[t][n][o];}},nl.prototype.removeFeatureState=function(t,e,r){if(!(null===this.deletedStates[t])){var n=String(e);if(this.deletedStates[t]=this.deletedStates[t]||{},r&&void 0!==e&&e>=0)null!==this.deletedStates[t][n]&&(this.deletedStates[t][n]=this.deletedStates[t][n]||{},this.deletedStates[t][n][r]=null);else if(void 0!==e&&e>=0){if(this.stateChanges[t]&&this.stateChanges[t][n])for(r in this.deletedStates[t][n]={},this.stateChanges[t][n])this.deletedStates[t][n][r]=null;else this.deletedStates[t][n]=null;}else this.deletedStates[t]=null;}},nl.prototype.getState=function(t,e){var r=String(e),n=this.state[t]||{},i=this.stateChanges[t]||{},a=c({},n[r],i[r]);if(null===this.deletedStates[t])return {};if(this.deletedStates[t]){var o=this.deletedStates[t][e];if(null===o)return {};for(var s in o)delete a[s];}return a},nl.prototype.initializeTileState=function(t,e){t.setFeatureState(this.state,e);},nl.prototype.coalesceChanges=function(t,e){var r={};for(var n in this.stateChanges){this.state[n]=this.state[n]||{};var i={};for(var a in this.stateChanges[n])this.state[n][a]||(this.state[n][a]={}),c(this.state[n][a],this.stateChanges[n][a]),i[a]=this.state[n][a];r[n]=i;}for(var o in this.deletedStates){this.state[o]=this.state[o]||{};var s={};if(null===this.deletedStates[o])for(var u in this.state[o])s[u]={},this.state[o][u]={};else for(var l in this.deletedStates[o]){if(null===this.deletedStates[o][l])this.state[o][l]={};else for(var p=0,h=Object.keys(this.deletedStates[o][l]);p<h.length;p+=1){var f=h[p];delete this.state[o][l][f];}s[l]=this.state[o][l];}r[o]=r[o]||{},c(r[o],s);}if(this.stateChanges={},this.deletedStates={},0!==Object.keys(r).length)for(var y in t){t[y].setFeatureState(r,e);}};var il=function(t,e,r){this.tileID=t,this.x=t.canonical.x,this.y=t.canonical.y,this.z=t.canonical.z,this.grid=e||new mn(ha,16,0),this.grid3D=new mn(ha,16,0),this.featureIndexArray=r||new ji;};function al(t){for(var e=1/0,r=1/0,n=-1/0,i=-1/0,a=0,o=t;a<o.length;a+=1){var s=o[a];e=Math.min(e,s.x),r=Math.min(r,s.y),n=Math.max(n,s.x),i=Math.max(i,s.y);}return {minX:e,minY:r,maxX:n,maxY:i}}function ol(t,e){return e-t}il.prototype.insert=function(t,e,r,n,i,a){var o=this.featureIndexArray.length;this.featureIndexArray.emplaceBack(r,n,i);for(var s=a?this.grid3D:this.grid,u=0;u<e.length;u++){for(var l=e[u],p=[1/0,1/0,-1/0,-1/0],c=0;c<l.length;c++){var h=l[c];p[0]=Math.min(p[0],h.x),p[1]=Math.min(p[1],h.y),p[2]=Math.max(p[2],h.x),p[3]=Math.max(p[3],h.y);}p[0]<ha&&p[1]<ha&&p[2]>=0&&p[3]>=0&&s.insert(o,p[0],p[1],p[2],p[3]);}},il.prototype.loadVTLayers=function(){return this.vtLayers||(this.vtLayers=new Go.VectorTile(new fu(this.rawTileData)).layers,this.sourceLayerCoder=new tl(this.vtLayers?Object.keys(this.vtLayers).sort():["_geojsonTileLayer"])),this.vtLayers},il.prototype.query=function(t,e,r){var n=this;this.loadVTLayers();for(var a=t.params||{},o=ha/t.tileSize/t.scale,s=Nr(a.filter),u=t.queryGeometry,l=t.queryPadding*o,p=al(u),c=this.grid.query(p.minX-l,p.minY-l,p.maxX+l,p.maxY+l),h=al(t.cameraQueryGeometry),f=this.grid3D.query(h.minX-l,h.minY-l,h.maxX+l,h.maxY+l,(function(e,r,n,a){return function(t,e,r,n,a){for(var o=0,s=t;o<s.length;o+=1){var u=s[o];if(e<=u.x&&r<=u.y&&n>=u.x&&a>=u.y)return !0}var l=[new i(e,r),new i(e,a),new i(n,a),new i(n,r)];if(t.length>2)for(var p=0,c=l;p<c.length;p+=1){if(za(t,c[p]))return !0}for(var h=0;h<t.length-1;h++){if(Ca(t[h],t[h+1],l))return !0}return !1}(t.cameraQueryGeometry,e-l,r-l,n+l,a+l)})),y=0,d=f;y<d.length;y+=1){var m=d[y];c.push(m);}c.sort(ol);for(var v,g={},x=function(i){var l=c[i];if(l!==v){v=l;var p=n.featureIndexArray.get(l),h=null;n.loadMatchingFeature(g,p.bucketIndex,p.sourceLayerIndex,p.featureIndex,s,a.layers,e,(function(e,i){h||(h=da(e));var a={};return e.id&&(a=r.getState(i.sourceLayer||"_geojsonTileLayer",e.id)),i.queryIntersectsFeature(u,e,a,h,n.z,t.transform,o,t.pixelPosMatrix)}));}},b=0;b<c.length;b++)x(b);return g},il.prototype.loadMatchingFeature=function(t,e,r,n,i,a,o,s){var u=this.bucketLayerIDs[e];if(!a||function(t,e){for(var r=0;r<t.length;r++)if(e.indexOf(t[r])>=0)return !0;return !1}(a,u)){var l=this.sourceLayerCoder.decode(r),p=this.vtLayers[l].feature(n);if(i(new qn(this.tileID.overscaledZ),p))for(var c=0;c<u.length;c++){var h=u[c];if(!(a&&a.indexOf(h)<0)){var f=o[h];if(f){var y=!s||s(p,f);if(y){var d=new el(p,this.z,this.x,this.y);d.layer=f.serialize();var m=t[h];void 0===m&&(m=t[h]=[]),m.push({featureIndex:n,feature:d,intersectionZ:y});}}}}}},il.prototype.lookupSymbolFeatures=function(t,e,r,n,i,a){var o={};this.loadVTLayers();for(var s=Nr(n),u=0,l=t;u<l.length;u+=1){var p=l[u];this.loadMatchingFeature(o,e,r,p,s,i,a);}return o},il.prototype.hasLayer=function(t){for(var e=0,r=this.bucketLayerIDs;e<r.length;e+=1)for(var n=0,i=r[e];n<i.length;n+=1){if(t===i[n])return !0}return !1},_n("FeatureIndex",il,{omit:["rawTileData","sourceLayerCoder"]});var sl=function(t,e){this.tileID=t,this.uid=f(),this.uses=0,this.tileSize=e,this.buckets={},this.expirationTime=null,this.queryPadding=0,this.hasSymbolBuckets=!1,this.expiredRequestCount=0,this.state="loading";};sl.prototype.registerFadeDuration=function(t){var e=t+this.timeAdded;e<V.now()||this.fadeEndTime&&e<this.fadeEndTime||(this.fadeEndTime=e);},sl.prototype.wasRequested=function(){return "errored"===this.state||"loaded"===this.state||"reloading"===this.state},sl.prototype.loadVectorData=function(t,e,r){if(this.hasData()&&this.unloadVectorData(),this.state="loaded",t){for(var n in t.featureIndex&&(this.latestFeatureIndex=t.featureIndex,t.rawTileData?(this.latestRawTileData=t.rawTileData,this.latestFeatureIndex.rawTileData=t.rawTileData):this.latestRawTileData&&(this.latestFeatureIndex.rawTileData=this.latestRawTileData)),this.collisionBoxArray=t.collisionBoxArray,this.buckets=function(t,e){var r={};if(!e)return r;for(var n=function(){var t=a[i],n=t.layerIds.map((function(t){return e.getLayer(t)})).filter(Boolean);if(0!==n.length){t.layers=n,t.stateDependentLayerIds&&(t.stateDependentLayers=t.stateDependentLayerIds.map((function(t){return n.filter((function(e){return e.id===t}))[0]})));for(var o=0,s=n;o<s.length;o+=1){var u=s[o];r[u.id]=t;}}},i=0,a=t;i<a.length;i+=1)n();return r}(t.buckets,e.style),this.hasSymbolBuckets=!1,this.buckets){var i=this.buckets[n];if(i instanceof Zs){if(this.hasSymbolBuckets=!0,!r)break;i.justReloaded=!0;}}for(var a in this.queryPadding=0,this.buckets){var o=this.buckets[a];this.queryPadding=Math.max(this.queryPadding,e.style.getLayer(a).queryRadius(o));}t.imageAtlas&&(this.imageAtlas=t.imageAtlas),t.glyphAtlasImage&&(this.glyphAtlasImage=t.glyphAtlasImage);}else this.collisionBoxArray=new Ei;},sl.prototype.unloadVectorData=function(){for(var t in this.buckets)this.buckets[t].destroy();this.buckets={},this.imageAtlasTexture&&this.imageAtlasTexture.destroy(),this.imageAtlas&&(this.imageAtlas=null),this.glyphAtlasTexture&&this.glyphAtlasTexture.destroy(),this.latestFeatureIndex=null,this.state="unloaded";},sl.prototype.getBucket=function(t){return this.buckets[t.id]},sl.prototype.upload=function(t){for(var e in this.buckets){var r=this.buckets[e];r.uploadPending()&&r.upload(t);}var n=t.gl;this.imageAtlas&&!this.imageAtlas.uploaded&&(this.imageAtlasTexture=new cu(t,this.imageAtlas.image,n.RGBA),this.imageAtlas.uploaded=!0),this.glyphAtlasImage&&(this.glyphAtlasTexture=new cu(t,this.glyphAtlasImage,n.ALPHA),this.glyphAtlasImage=null);},sl.prototype.prepare=function(t){this.imageAtlas&&this.imageAtlas.patchUpdatedImages(t,this.imageAtlasTexture);},sl.prototype.queryRenderedFeatures=function(t,e,r,n,i,a,o,s,u){return this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData?this.latestFeatureIndex.query({queryGeometry:r,cameraQueryGeometry:n,scale:i,tileSize:this.tileSize,pixelPosMatrix:u,transform:o,params:a,queryPadding:this.queryPadding*s},t,e):{}},sl.prototype.querySourceFeatures=function(t,e){if(this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData){var r=this.latestFeatureIndex.loadVTLayers(),n=e?e.sourceLayer:"",i=r._geojsonTileLayer||r[n];if(i)for(var a=Nr(e&&e.filter),o=this.tileID.canonical,s=o.z,u=o.x,l=o.y,p={z:s,x:u,y:l},c=0;c<i.length;c++){var h=i.feature(c);if(a(new qn(this.tileID.overscaledZ),h)){var f=new el(h,s,u,l);f.tile=p,t.push(f);}}}},sl.prototype.clearMask=function(){this.segments&&(this.segments.destroy(),delete this.segments),this.maskedBoundsBuffer&&(this.maskedBoundsBuffer.destroy(),delete this.maskedBoundsBuffer),this.maskedIndexBuffer&&(this.maskedIndexBuffer.destroy(),delete this.maskedIndexBuffer),delete this.mask;},sl.prototype.setMask=function(t,e){if(!o(this.mask,t)&&(this.clearMask(),this.mask=t,!o(t,{0:!0}))){var r=new pi,n=new Si;this.segments=new Ni,this.segments.prepareSegment(0,r,n);for(var a=Object.keys(t),s=0;s<a.length;s++){var u=t[+a[s]],l=ha>>u.z,p=new i(u.x*l,u.y*l),c=new i(p.x+l,p.y+l),h=this.segments.prepareSegment(4,r,n);r.emplaceBack(p.x,p.y,p.x,p.y),r.emplaceBack(c.x,p.y,c.x,p.y),r.emplaceBack(p.x,c.y,p.x,c.y),r.emplaceBack(c.x,c.y,c.x,c.y);var f=h.vertexLength;n.emplaceBack(f,f+1,f+2),n.emplaceBack(f+1,f+2,f+3),h.vertexLength+=4,h.primitiveLength+=2;}this.maskedBoundsBuffer=e.createVertexBuffer(r,Qu.members),this.maskedIndexBuffer=e.createIndexBuffer(n);}},sl.prototype.hasData=function(){return "loaded"===this.state||"reloading"===this.state||"expired"===this.state},sl.prototype.patternsLoaded=function(){return this.imageAtlas&&!!Object.keys(this.imageAtlas.patternPositions).length},sl.prototype.setExpiryData=function(t){var e=this.expirationTime;if(t.cacheControl){var r=S(t.cacheControl);r["max-age"]&&(this.expirationTime=Date.now()+1e3*r["max-age"]);}else t.expires&&(this.expirationTime=new Date(t.expires).getTime());if(this.expirationTime){var n=Date.now(),i=!1;if(this.expirationTime>n)i=!1;else if(e)if(this.expirationTime<e)i=!0;else{var a=this.expirationTime-e;a?this.expirationTime=n+Math.max(a,3e4):i=!0;}else i=!0;i?(this.expiredRequestCount++,this.state="expired"):this.expiredRequestCount=0;}},sl.prototype.getExpiryTimeout=function(){if(this.expirationTime)return this.expiredRequestCount?1e3*(1<<Math.min(this.expiredRequestCount-1,31)):Math.min(this.expirationTime-(new Date).getTime(),Math.pow(2,31)-1)},sl.prototype.setFeatureState=function(t,e){if(this.latestFeatureIndex&&this.latestFeatureIndex.rawTileData&&0!==Object.keys(t).length){var r=this.latestFeatureIndex.loadVTLayers();for(var n in this.buckets){var i=this.buckets[n],a=i.layers[0].sourceLayer||"_geojsonTileLayer",o=r[a],s=t[a];o&&s&&0!==Object.keys(s).length&&(i.update(s,o,this.imageAtlas&&this.imageAtlas.patternPositions||{}),e&&e.style&&(this.queryPadding=Math.max(this.queryPadding,e.style.getLayer(n).queryRadius(i))));}}},sl.prototype.holdingForFade=function(){return void 0!==this.symbolFadeHoldUntil},sl.prototype.symbolFadeFinished=function(){return !this.symbolFadeHoldUntil||this.symbolFadeHoldUntil<V.now()},sl.prototype.clearFadeHold=function(){this.symbolFadeHoldUntil=void 0;},sl.prototype.setHoldDuration=function(t){this.symbolFadeHoldUntil=V.now()+t;};function ul(t,e,r,n,i){if(void 0===e.segment)return !0;for(var a=e,o=e.segment+1,s=0;s>-r/2;){if(--o<0)return !1;s-=t[o].dist(a),a=t[o];}s+=t[o].dist(t[o+1]),o++;for(var u=[],l=0;s<r/2;){var p=t[o-1],c=t[o],h=t[o+1];if(!h)return !1;var f=p.angleTo(c)-c.angleTo(h);for(f=Math.abs((f+3*Math.PI)%(2*Math.PI)-Math.PI),u.push({distance:s,angleDelta:f}),l+=f;s-u[0].distance>n;)l-=u.shift().angleDelta;if(l>i)return !1;o++,s+=c.dist(h);}return !0}function ll(t){for(var e=0,r=0;r<t.length-1;r++)e+=t[r].dist(t[r+1]);return e}function pl(t,e,r){return t?.6*e*r:0}function cl(t,e){return Math.max(t?t.right-t.left:0,e?e.right-e.left:0)}function hl(t,e,r,n,i,a){for(var o=pl(r,i,a),s=cl(r,n)*a,u=0,l=ll(t)/2,p=0;p<t.length-1;p++){var c=t[p],h=t[p+1],f=c.dist(h);if(u+f>l){var y=(l-u)/f,d=Se(c.x,h.x,y),m=Se(c.y,h.y,y),v=new Vs(d,m,h.angleTo(c),p);return v._round(),!o||ul(t,v,s,o,e)?v:void 0}u+=f;}}function fl(t,e,r,n,i,a,o,s,u){var l=pl(n,a,o),p=cl(n,i),c=p*o,h=0===t[0].x||t[0].x===u||0===t[0].y||t[0].y===u;return e-c<e/4&&(e=c+e/4),function t(e,r,n,i,a,o,s,u,l){var p=o/2;var c=ll(e);var h=0,f=r-n;var y=[];for(var d=0;d<e.length-1;d++){for(var m=e[d],v=e[d+1],g=m.dist(v),x=v.angleTo(m);f+n<h+g;){var b=((f+=n)-h)/g,_=Se(m.x,v.x,b),w=Se(m.y,v.y,b);if(_>=0&&_<l&&w>=0&&w<l&&f-p>=0&&f+p<=c){var A=new Vs(_,w,x,d);A._round(),i&&!ul(e,A,o,i,a)||y.push(A);}}h+=g;}u||y.length||s||(y=t(e,h/2,n,i,a,o,s,!0,l));return y}(t,h?e/2*s%e:(p/2+2*a)*o*s%e,e,l,r,c,h,!1,u)}function yl(t,e){var r=t.image,n=t.right-t.left,a=(n*r.paddedRect.w/(r.paddedRect.w-2)-n)/2,o=t.left-a,s=t.right+a,u=t.bottom-t.top,l=(u*r.paddedRect.h/(r.paddedRect.h-2)-u)/2,p=t.top-l,c=t.bottom+l,h=new i(o,p),f=new i(s,p),y=new i(s,c),d=new i(o,c),m=e*Math.PI/180;if(m){var v=Math.sin(m),g=Math.cos(m),x=[g,-v,v,g];h._matMult(x),f._matMult(x),d._matMult(x),y._matMult(x);}return [{tl:h,tr:f,bl:d,br:y,tex:r.paddedRect,writingMode:void 0,glyphOffset:[0,0],sectionIndex:0}]}var dl=function(t,e,r,n,a,o,s,u,l,p,c,h){var f=s.top*u-l,y=s.bottom*u+l,d=s.left*u-l,m=s.right*u+l;if(this.boxStartIndex=t.length,p){var v=y-f,g=m-d;v>0&&(v=Math.max(10*u,v),this._addLineCollisionCircles(t,e,r,r.segment,g,v,n,a,o,c));}else{if(h){var x=new i(d,f),b=new i(m,f),_=new i(d,y),w=new i(m,y),A=h*Math.PI/180;x._rotate(A),b._rotate(A),_._rotate(A),w._rotate(A),d=Math.min(x.x,b.x,_.x,w.x),m=Math.max(x.x,b.x,_.x,w.x),f=Math.min(x.y,b.y,_.y,w.y),y=Math.max(x.y,b.y,_.y,w.y);}t.emplaceBack(r.x,r.y,d,f,m,y,n,a,o,0,0);}this.boxEndIndex=t.length;};dl.prototype._addLineCollisionCircles=function(t,e,r,n,i,a,o,s,u,l){var p=a/2,c=Math.floor(i/p)||1,h=1+.4*Math.log(l)/Math.LN2,f=Math.floor(c*h/2),y=-a/2,d=r,m=n+1,v=y,g=-i/2,x=g-i/4;do{if(--m<0){if(v>g)return;m=0;break}v-=e[m].dist(d),d=e[m];}while(v>x);for(var b=e[m].dist(e[m+1]),_=-f;_<c+f;_++){var w=_*p,A=g+w;if(w<0&&(A+=w),w>i&&(A+=w-i),!(A<v)){for(;v+b<A;){if(v+=b,++m+1>=e.length)return;b=e[m].dist(e[m+1]);}var k=A-v,S=e[m],I=e[m+1].sub(S)._unit()._mult(k)._add(S)._round(),z=Math.abs(A-y)<p?0:.8*(A-y);t.emplaceBack(I.x,I.y,-a/2,-a/2,a/2,a/2,o,s,u,a/2,z);}}};var ml=function(t,e){if(void 0===t&&(t=[]),void 0===e&&(e=vl),this.data=t,this.length=this.data.length,this.compare=e,this.length>0)for(var r=(this.length>>1)-1;r>=0;r--)this._down(r);};function vl(t,e){return t<e?-1:t>e?1:0}function gl(t,e,r){void 0===e&&(e=1),void 0===r&&(r=!1);for(var n=1/0,a=1/0,o=-1/0,s=-1/0,u=t[0],l=0;l<u.length;l++){var p=u[l];(!l||p.x<n)&&(n=p.x),(!l||p.y<a)&&(a=p.y),(!l||p.x>o)&&(o=p.x),(!l||p.y>s)&&(s=p.y);}var c=o-n,h=s-a,f=Math.min(c,h),y=f/2,d=new ml([],xl);if(0===f)return new i(n,a);for(var m=n;m<o;m+=f)for(var v=a;v<s;v+=f)d.push(new bl(m+y,v+y,y,t));for(var g=function(t){for(var e=0,r=0,n=0,i=t[0],a=0,o=i.length,s=o-1;a<o;s=a++){var u=i[a],l=i[s],p=u.x*l.y-l.x*u.y;r+=(u.x+l.x)*p,n+=(u.y+l.y)*p,e+=3*p;}return new bl(r/e,n/e,0,t)}(t),x=d.length;d.length;){var b=d.pop();(b.d>g.d||!g.d)&&(g=b,r&&console.log("found best %d after %d probes",Math.round(1e4*b.d)/1e4,x)),b.max-g.d<=e||(y=b.h/2,d.push(new bl(b.p.x-y,b.p.y-y,y,t)),d.push(new bl(b.p.x+y,b.p.y-y,y,t)),d.push(new bl(b.p.x-y,b.p.y+y,y,t)),d.push(new bl(b.p.x+y,b.p.y+y,y,t)),x+=4);}return r&&(console.log("num probes: "+x),console.log("best distance: "+g.d)),g.p}function xl(t,e){return e.max-t.max}function bl(t,e,r,n){this.p=new i(t,e),this.h=r,this.d=function(t,e){for(var r=!1,n=1/0,i=0;i<e.length;i++)for(var a=e[i],o=0,s=a.length,u=s-1;o<s;u=o++){var l=a[o],p=a[u];l.y>t.y!=p.y>t.y&&t.x<(p.x-l.x)*(t.y-l.y)/(p.y-l.y)+l.x&&(r=!r),n=Math.min(n,Sa(t,l,p));}return (r?1:-1)*Math.sqrt(n)}(this.p,n),this.max=this.d+this.h*Math.SQRT2;}ml.prototype.push=function(t){this.data.push(t),this.length++,this._up(this.length-1);},ml.prototype.pop=function(){if(0!==this.length){var t=this.data[0],e=this.data.pop();return this.length--,this.length>0&&(this.data[0]=e,this._down(0)),t}},ml.prototype.peek=function(){return this.data[0]},ml.prototype._up=function(t){for(var e=this.data,r=this.compare,n=e[t];t>0;){var i=t-1>>1,a=e[i];if(r(n,a)>=0)break;e[t]=a,t=i;}e[t]=n;},ml.prototype._down=function(t){for(var e=this.data,r=this.compare,n=this.length>>1,i=e[t];t<n;){var a=1+(t<<1),o=e[a],s=a+1;if(s<this.length&&r(e[s],o)<0&&(a=s,o=e[s]),r(o,i)>=0)break;e[t]=o,t=a;}e[t]=i;};var _l=e((function(t){t.exports=function(t,e){var r,n,i,a,o,s,u,l;for(r=3&t.length,n=t.length-r,i=e,o=3432918353,s=461845907,l=0;l<n;)u=255&t.charCodeAt(l)|(255&t.charCodeAt(++l))<<8|(255&t.charCodeAt(++l))<<16|(255&t.charCodeAt(++l))<<24,++l,i=27492+(65535&(a=5*(65535&(i=(i^=u=(65535&(u=(u=(65535&u)*o+(((u>>>16)*o&65535)<<16)&4294967295)<<15|u>>>17))*s+(((u>>>16)*s&65535)<<16)&4294967295)<<13|i>>>19))+((5*(i>>>16)&65535)<<16)&4294967295))+((58964+(a>>>16)&65535)<<16);switch(u=0,r){case 3:u^=(255&t.charCodeAt(l+2))<<16;case 2:u^=(255&t.charCodeAt(l+1))<<8;case 1:i^=u=(65535&(u=(u=(65535&(u^=255&t.charCodeAt(l)))*o+(((u>>>16)*o&65535)<<16)&4294967295)<<15|u>>>17))*s+(((u>>>16)*s&65535)<<16)&4294967295;}return i^=t.length,i=2246822507*(65535&(i^=i>>>16))+((2246822507*(i>>>16)&65535)<<16)&4294967295,i=3266489909*(65535&(i^=i>>>13))+((3266489909*(i>>>16)&65535)<<16)&4294967295,(i^=i>>>16)>>>0};})),wl=e((function(t){t.exports=function(t,e){for(var r,n=t.length,i=e^n,a=0;n>=4;)r=1540483477*(65535&(r=255&t.charCodeAt(a)|(255&t.charCodeAt(++a))<<8|(255&t.charCodeAt(++a))<<16|(255&t.charCodeAt(++a))<<24))+((1540483477*(r>>>16)&65535)<<16),i=1540483477*(65535&i)+((1540483477*(i>>>16)&65535)<<16)^(r=1540483477*(65535&(r^=r>>>24))+((1540483477*(r>>>16)&65535)<<16)),n-=4,++a;switch(n){case 3:i^=(255&t.charCodeAt(a+2))<<16;case 2:i^=(255&t.charCodeAt(a+1))<<8;case 1:i=1540483477*(65535&(i^=255&t.charCodeAt(a)))+((1540483477*(i>>>16)&65535)<<16);}return i=1540483477*(65535&(i^=i>>>13))+((1540483477*(i>>>16)&65535)<<16),(i^=i>>>15)>>>0};})),Al=_l,kl=_l,Sl=wl;Al.murmur3=kl,Al.murmur2=Sl;var Il=7,zl=Number.POSITIVE_INFINITY;function Cl(t,e){return e[1]!==zl?function(t,e,r){var n=0,i=0;switch(e=Math.abs(e),r=Math.abs(r),t){case"top-right":case"top-left":case"top":i=r-Il;break;case"bottom-right":case"bottom-left":case"bottom":i=-r+Il;}switch(t){case"top-right":case"bottom-right":case"right":n=-e;break;case"top-left":case"bottom-left":case"left":n=e;}return [n,i]}(t,e[0],e[1]):function(t,e){var r=0,n=0;e<0&&(e=0);var i=e/Math.sqrt(2);switch(t){case"top-right":case"top-left":n=i-Il;break;case"bottom-right":case"bottom-left":n=-i+Il;break;case"bottom":n=-e+Il;break;case"top":n=e-Il;}switch(t){case"top-right":case"bottom-right":r=-i;break;case"top-left":case"bottom-left":r=i;break;case"left":r=e;break;case"right":r=-e;}return [r,n]}(t,e[0])}function Bl(t){switch(t){case"right":case"top-right":case"bottom-right":return "right";case"left":case"top-left":case"bottom-left":return "left"}return "center"}var Pl=65535;function El(t,e,r,n,a,o,s,u,l,p,c,h,f,y){var d=function(t,e,r,n,a,o,s,u){for(var l=n.layout.get("text-rotate").evaluate(o,{})*Math.PI/180,p=e.positionedGlyphs,c=[],h=0;h<p.length;h++){var f=p[h],y=s[f.fontStack],d=y&&y[f.glyph];if(d){var m=d.rect;if(m){var v=Fu+1,g=d.metrics.advance*f.scale/2,x=a?[f.x+g,f.y]:[0,0],b=a?[0,0]:[f.x+g+r[0],f.y+r[1]],_=(a||u)&&f.vertical,w=[0,0];_&&(w=b,b=[0,0]);var A=(d.metrics.left-v)*f.scale-g+b[0],k=(-d.metrics.top-v)*f.scale+b[1],S=A+m.w*f.scale,I=k+m.h*f.scale,z=new i(A,k),C=new i(S,k),B=new i(A,I),P=new i(S,I);if(_){var E=new i(-g,g-e.yOffset),M=-Math.PI/2,T=_s/2-g,V=new i(5-e.yOffset-T,0),F=new(Function.prototype.bind.apply(i,[null].concat(w)));z._rotateAround(M,E)._add(V)._add(F),C._rotateAround(M,E)._add(V)._add(F),B._rotateAround(M,E)._add(V)._add(F),P._rotateAround(M,E)._add(V)._add(F);}if(l){var O=Math.sin(l),L=Math.cos(l),D=[L,-O,O,L];z._matMult(D),C._matMult(D),B._matMult(D),P._matMult(D);}c.push({tl:z,tr:C,bl:B,br:P,tex:m,writingMode:e.writingMode,glyphOffset:x,sectionIndex:f.sectionIndex});}}}return c}(0,r,s,n,a,o,h,t.allowVerticalPlacement),m=t.textSizeData,v=null;"source"===m.kind?(v=[Fs*n.layout.get("text-size").evaluate(o,{})])[0]>Pl&&w(t.layerIds[0]+': Value for "text-size" is >= 256. Reduce your "text-size".'):"composite"===m.kind&&((v=[Fs*y.compositeTextSizes[0].evaluate(o,{}),Fs*y.compositeTextSizes[1].evaluate(o,{})])[0]>Pl||v[1]>Pl)&&w(t.layerIds[0]+': Value for "text-size" is >= 256. Reduce your "text-size".'),t.addSymbols(t.text,d,v,s,a,o,l,e,u.lineStartIndex,u.lineLength,f);for(var g=0,x=p;g<x.length;g+=1){c[x[g]]=t.text.placedSymbolArray.length-1;}return 4*d.length}function Ml(t,e,r,n){var i=t.compareText;if(e in i){for(var a=i[e],o=a.length-1;o>=0;o--)if(n.dist(a[o])<r)return !0}else i[e]=[];return i[e].push(n),!1}t.Actor=Lu,t.AlphaImage=Ka,t.CanonicalTileID=Ju,t.CollisionBoxArray=Ei,t.Color=Yt,t.DEMData=Wu,t.DataConstantProperty=$n,t.DictionaryCoder=tl,t.EXTENT=ha,t.ErrorEvent=kt,t.EvaluationParameters=qn,t.Event=At,t.Evented=St,t.FeatureIndex=il,t.FillBucket=Vo,t.FillExtrusionBucket=$o,t.ImageAtlas=ou,t.ImagePosition=iu,t.LineBucket=us,t.LngLat=Ru,t.LngLatBounds=Uu,t.MercatorCoordinate=Gu,t.ONE_EM=_s,t.OverscaledTileID=Yu,t.Point=i,t.Point$1=i,t.ProgramConfiguration=ua,t.Properties=ri,t.Protobuf=fu,t.RGBAImage=Xa,t.RequestManager=j,t.ResourceType=pt,t.SegmentVector=Ni,t.SourceFeatureState=nl,t.StructArrayLayout1ui2=zi,t.StructArrayLayout2i4=li,t.StructArrayLayout2ui4=Ii,t.StructArrayLayout3ui6=Si,t.StructArrayLayout4i8=pi,t.SymbolBucket=Zs,t.Texture=cu,t.Tile=sl,t.Transitionable=Xn,t.Uniform1f=Hi,t.Uniform1i=Ji,t.Uniform2f=Yi,t.Uniform3f=$i,t.Uniform4f=Wi,t.UniformColor=Qi,t.UniformMatrix4f=ea,t.UnwrappedTileID=Hu,t.ValidationError=zt,t.WritingMode=ws,t.ZoomHistory=In,t.addDynamicAttributes=Ns,t.asyncAll=function(t,e,r){if(!t.length)return r(null,[]);var n=t.length,i=new Array(t.length),a=null;t.forEach((function(t,o){e(t,(function(t,e){t&&(a=t),i[o]=e,0==--n&&r(a,i);}));}));},t.bezier=s,t.bindAll=m,t.browser=V,t.cacheEntryPossiblyAdded=function(t){++lt>it&&(t.getActor().send("enforceCacheSizeLimit",nt),lt=0);},t.clamp=l,t.clearTileCache=function(t){var e=self.caches.delete(rt);t&&e.catch(t).then((function(){return t()}));},t.clone=function(t){var e=new Va(16);return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},t.clone$1=b,t.config=F,t.create=function(){var t=new Va(16);return Va!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t},t.create$1=function(){var t=new Va(9);return Va!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[5]=0,t[6]=0,t[7]=0),t[0]=1,t[4]=1,t[8]=1,t},t.create$2=function(){var t=new Va(4);return Va!=Float32Array&&(t[1]=0,t[2]=0),t[0]=1,t[3]=1,t},t.createCommonjsModule=e,t.createExpression=Pr,t.createLayout=si,t.createStyleLayer=function(t){return "custom"===t.type?new eu(t):new ru[t.type](t)},t.deepEqual=o,t.ease=u,t.emitValidationErrors=dn,t.endsWith=v,t.enforceCacheSizeLimit=function(t){self.caches&&self.caches.open(rt).then((function(e){e.keys().then((function(r){for(var n=0;n<r.length-t;n++)e.delete(r[n]);}));}));},t.evaluateSizeForFeature=Ls,t.evaluateSizeForZoom=Ds,t.evaluateVariableOffset=Cl,t.evented=Rn,t.extend=c,t.featureFilter=Nr,t.filterObject=x,t.fromRotation=function(t,e){var r=Math.sin(e),n=Math.cos(e);return t[0]=n,t[1]=r,t[2]=0,t[3]=-r,t[4]=n,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},t.getAnchorAlignment=Es,t.getAnchorJustification=Bl,t.getArrayBuffer=mt,t.getImage=bt,t.getJSON=function(t,e){return dt(c(t,{type:"json"}),e)},t.getRTLTextPluginStatus=function(){return Dn},t.getReferrer=ft,t.getVideo=function(t,e){var r,n,i=self.document.createElement("video");i.muted=!0,i.onloadstart=function(){e(null,i);};for(var a=0;a<t.length;a++){var o=self.document.createElement("source");r=t[a],n=void 0,(n=self.document.createElement("a")).href=r,(n.protocol!==self.document.location.protocol||n.host!==self.document.location.host)&&(i.crossOrigin="Anonymous"),o.src=t[a],i.appendChild(o);}return {cancel:function(){}}},t.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},t.ieee754=hu,t.invert=function(t,e){var r=e[0],n=e[1],i=e[2],a=e[3],o=e[4],s=e[5],u=e[6],l=e[7],p=e[8],c=e[9],h=e[10],f=e[11],y=e[12],d=e[13],m=e[14],v=e[15],g=r*s-n*o,x=r*u-i*o,b=r*l-a*o,_=n*u-i*s,w=n*l-a*s,A=i*l-a*u,k=p*d-c*y,S=p*m-h*y,I=p*v-f*y,z=c*m-h*d,C=c*v-f*d,B=h*v-f*m,P=g*B-x*C+b*z+_*I-w*S+A*k;return P?(P=1/P,t[0]=(s*B-u*C+l*z)*P,t[1]=(i*C-n*B-a*z)*P,t[2]=(d*A-m*w+v*_)*P,t[3]=(h*w-c*A-f*_)*P,t[4]=(u*I-o*B-l*S)*P,t[5]=(r*B-i*I+a*S)*P,t[6]=(m*b-y*A-v*x)*P,t[7]=(p*A-h*b+f*x)*P,t[8]=(o*C-s*I+l*k)*P,t[9]=(n*I-r*C-a*k)*P,t[10]=(y*w-d*b+v*g)*P,t[11]=(c*b-p*w-f*g)*P,t[12]=(s*S-o*z-u*k)*P,t[13]=(r*z-n*S+i*k)*P,t[14]=(d*x-y*_-m*g)*P,t[15]=(p*_-c*x+h*g)*P,t):null},t.isChar=zn,t.isMapboxURL=q,t.keysDifference=function(t,e){var r=[];for(var n in t)n in e||r.push(n);return r},t.makeRequest=dt,t.mapObject=g,t.mercatorXfromLng=Nu,t.mercatorYfromLat=Ku,t.mercatorZfromAltitude=Xu,t.multiply=function(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3],s=e[4],u=e[5],l=e[6],p=e[7],c=e[8],h=e[9],f=e[10],y=e[11],d=e[12],m=e[13],v=e[14],g=e[15],x=r[0],b=r[1],_=r[2],w=r[3];return t[0]=x*n+b*s+_*c+w*d,t[1]=x*i+b*u+_*h+w*m,t[2]=x*a+b*l+_*f+w*v,t[3]=x*o+b*p+_*y+w*g,x=r[4],b=r[5],_=r[6],w=r[7],t[4]=x*n+b*s+_*c+w*d,t[5]=x*i+b*u+_*h+w*m,t[6]=x*a+b*l+_*f+w*v,t[7]=x*o+b*p+_*y+w*g,x=r[8],b=r[9],_=r[10],w=r[11],t[8]=x*n+b*s+_*c+w*d,t[9]=x*i+b*u+_*h+w*m,t[10]=x*a+b*l+_*f+w*v,t[11]=x*o+b*p+_*y+w*g,x=r[12],b=r[13],_=r[14],w=r[15],t[12]=x*n+b*s+_*c+w*d,t[13]=x*i+b*u+_*h+w*m,t[14]=x*a+b*l+_*f+w*v,t[15]=x*o+b*p+_*y+w*g,t},t.mvt=Go,t.number=Se,t.ortho=function(t,e,r,n,i,a,o){var s=1/(e-r),u=1/(n-i),l=1/(a-o);return t[0]=-2*s,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*u,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*l,t[11]=0,t[12]=(e+r)*s,t[13]=(i+n)*u,t[14]=(o+a)*l,t[15]=1,t},t.parseGlyphPBF=function(t){return new fu(t).readFields(Mu,[])},t.performSymbolLayout=function(t,e,r,n,a,o){t.createArrays();var s=512*t.overscaling;t.tilePixelRatio=ha/s,t.compareText={},t.iconsNeedLinear=!1;var u=t.layers[0].layout,l=t.layers[0]._unevaluatedLayout._values,p={};if("composite"===t.textSizeData.kind){var c=t.textSizeData,h=c.minZoom,f=c.maxZoom;p.compositeTextSizes=[l["text-size"].possiblyEvaluate(new qn(h)),l["text-size"].possiblyEvaluate(new qn(f))];}if("composite"===t.iconSizeData.kind){var y=t.iconSizeData,d=y.minZoom,m=y.maxZoom;p.compositeIconSizes=[l["icon-size"].possiblyEvaluate(new qn(d)),l["icon-size"].possiblyEvaluate(new qn(m))];}p.layoutTextSize=l["text-size"].possiblyEvaluate(new qn(t.zoom+1)),p.layoutIconSize=l["icon-size"].possiblyEvaluate(new qn(t.zoom+1)),p.textMaxSize=l["text-size"].possiblyEvaluate(new qn(18));for(var v=u.get("text-line-height")*_s,g="map"===u.get("text-rotation-alignment")&&"point"!==u.get("symbol-placement"),x=u.get("text-keep-upright"),b=function(){var o=A[_],s=u.get("text-font").evaluate(o,{}).join(","),l=r,c={horizontal:{},vertical:void 0},h=o.text,f=[0,0];if(h){var y=h.toString(),d=u.get("text-letter-spacing").evaluate(o,{})*_s,m=function(t){for(var e=0,r=t;e<r.length;e+=1){if(!Bn(r[e].charCodeAt(0)))return !1}return !0}(y)?d:0,b=u.get("text-anchor").evaluate(o,{}),k=u.get("text-variable-anchor");if(!k){var S=u.get("text-radial-offset").evaluate(o,{});f=S?Cl(b,[S*_s,zl]):u.get("text-offset").evaluate(o,{}).map((function(t){return t*_s}));}var I=g?"center":u.get("text-justify").evaluate(o,{}),z=u.get("symbol-placement"),C="point"===z?u.get("text-max-width").evaluate(o,{})*_s:0,B=function(){t.allowVerticalPlacement&&Cn(y)&&(c.vertical=ks(h,e,s,C,v,b,"left",m,f,ws.vertical,!0,z));};if(!g&&k){for(var P="auto"===I?k.map((function(t){return Bl(t)})):[I],E=!1,M=0;M<P.length;M++){var T=P[M];if(!c.horizontal[T])if(E)c.horizontal[T]=c.horizontal[0];else{var V=ks(h,e,s,C,v,"center",T,m,f,ws.horizontal,!1,z);V&&(c.horizontal[T]=V,E=1===V.lineCount);}}B();}else{"auto"===I&&(I=Bl(b));var F=ks(h,e,s,C,v,b,I,m,f,ws.horizontal,!1,z);F&&(c.horizontal[I]=F),B(),Cn(y)&&g&&x&&(c.vertical=ks(h,e,s,C,v,b,I,m,f,ws.vertical,!1,z));}}var O=void 0;if(o.icon&&o.icon.name){var L=n[o.icon.name];L&&(O=function(t,e,r){var n=Es(r),i=n.horizontalAlign,a=n.verticalAlign,o=e[0],s=e[1],u=o-t.displaySize[0]*i,l=u+t.displaySize[0],p=s-t.displaySize[1]*a;return {image:t,top:p,bottom:p+t.displaySize[1],left:u,right:l}}(a[o.icon.name],u.get("icon-offset").evaluate(o,{}),u.get("icon-anchor").evaluate(o,{})),void 0===t.sdfIcons?t.sdfIcons=L.sdf:t.sdfIcons!==L.sdf&&w("Style sheet warning: Cannot mix SDF and non-SDF icons in one buffer"),L.pixelRatio!==t.pixelRatio?t.iconsNeedLinear=!0:0!==u.get("icon-rotate").constantOr(1)&&(t.iconsNeedLinear=!0));}(Object.keys(c.horizontal).length||O)&&function(t,e,r,n,a,o,s){var u=o.layoutTextSize.evaluate(e,{}),l=o.layoutIconSize.evaluate(e,{}),p=o.textMaxSize.evaluate(e,{});void 0===p&&(p=u);var c,h=t.layers[0].layout,f=h.get("icon-offset").evaluate(e,{}),y=function(t){for(var e in t)return t[e];return null}(r.horizontal),d=u/24,m=t.tilePixelRatio*d,v=t.tilePixelRatio*p/24,g=t.tilePixelRatio*l,x=t.tilePixelRatio*h.get("symbol-spacing"),b=h.get("text-padding")*t.tilePixelRatio,_=h.get("icon-padding")*t.tilePixelRatio,A=h.get("text-max-angle")/180*Math.PI,k="map"===h.get("text-rotation-alignment")&&"point"!==h.get("symbol-placement"),S="map"===h.get("icon-rotation-alignment")&&"point"!==h.get("symbol-placement"),I=h.get("symbol-placement"),z=x/2,C=h.get("icon-text-fit");n&&"none"!==C&&(t.allowVerticalPlacement&&r.vertical&&(c=Ts(n,r.vertical,C,h.get("icon-text-fit-padding"),f,d)),y&&(n=Ts(n,y,C,h.get("icon-text-fit-padding"),f,d)));var B=function(i,u){u.x<0||u.x>=ha||u.y<0||u.y>=ha||function(t,e,r,n,i,a,o,s,u,l,p,c,h,f,y,d,m,v,g,x,b,_){var A,k,S,I,z,C=t.addToLineVertexArray(e,r),B=0,P=0,E=0,M=0,T=-1,V=-1,F={},O=Al(""),L=0,D=0;void 0===o._unevaluatedLayout.getValue("text-radial-offset")?(A=o.layout.get("text-offset").evaluate(x,{}).map((function(t){return t*_s})),L=A[0],D=A[1]):(L=o.layout.get("text-radial-offset").evaluate(x,{})*_s,D=zl);if(t.allowVerticalPlacement&&n.vertical){var U=o.layout.get("text-rotate").evaluate(x,{})+90,R=n.vertical;I=new dl(s,r,e,u,l,p,R,c,h,f,t.overscaling,U),a&&(z=new dl(s,r,e,u,l,p,a,d,m,f,t.overscaling,U));}if(i){var j=o.layout.get("icon-rotate").evaluate(x,{}),q=yl(i,j),N=a?yl(a,j):void 0;S=new dl(s,r,e,u,l,p,i,d,m,!1,t.overscaling,j),B=4*q.length;var K=t.iconSizeData,X=null;"source"===K.kind?(X=[Fs*o.layout.get("icon-size").evaluate(x,{})])[0]>Pl&&w(t.layerIds[0]+': Value for "icon-size" is >= 256. Reduce your "icon-size".'):"composite"===K.kind&&((X=[Fs*_.compositeIconSizes[0].evaluate(x,{}),Fs*_.compositeIconSizes[1].evaluate(x,{})])[0]>Pl||X[1]>Pl)&&w(t.layerIds[0]+': Value for "icon-size" is >= 256. Reduce your "icon-size".'),t.addSymbols(t.icon,q,X,g,v,x,!1,e,C.lineStartIndex,C.lineLength,-1),T=t.icon.placedSymbolArray.length-1,N&&(P=4*N.length,t.addSymbols(t.icon,N,X,g,v,x,ws.vertical,e,C.lineStartIndex,C.lineLength,-1),V=t.icon.placedSymbolArray.length-1);}for(var Z in n.horizontal){var G=n.horizontal[Z];if(!k){O=Al(G.text);var J=o.layout.get("text-rotate").evaluate(x,{});k=new dl(s,r,e,u,l,p,G,c,h,f,t.overscaling,J);}var H=1===G.lineCount;if(E+=El(t,e,G,o,f,x,y,C,n.vertical?ws.horizontal:ws.horizontalOnly,H?Object.keys(n.horizontal):[Z],F,b,T,_),H)break}n.vertical&&(M+=El(t,e,n.vertical,o,f,x,y,C,ws.vertical,["vertical"],F,b,V,_));var Y=k?k.boxStartIndex:t.collisionBoxArray.length,$=k?k.boxEndIndex:t.collisionBoxArray.length,W=I?I.boxStartIndex:t.collisionBoxArray.length,Q=I?I.boxEndIndex:t.collisionBoxArray.length,tt=S?S.boxStartIndex:t.collisionBoxArray.length,et=S?S.boxEndIndex:t.collisionBoxArray.length,rt=z?z.boxStartIndex:t.collisionBoxArray.length,nt=z?z.boxEndIndex:t.collisionBoxArray.length;t.glyphOffsetArray.length>=Zs.MAX_GLYPHS&&w("Too many glyphs being rendered in a tile. See https://github.com/mapbox/mapbox-gl-js/issues/2907");t.symbolInstances.emplaceBack(e.x,e.y,F.right>=0?F.right:-1,F.center>=0?F.center:-1,F.left>=0?F.left:-1,F.vertical||-1,T,V,O,Y,$,W,Q,tt,et,rt,nt,u,E,M,B,P,0,c,L,D);}(t,u,i,r,n,c,t.layers[0],t.collisionBoxArray,e.index,e.sourceLayerIndex,t.index,m,b,k,s,g,_,S,f,e,a,o);};if("line"===I)for(var P=0,E=function(t,e,r,n,a){for(var o=[],s=0;s<t.length;s++)for(var u=t[s],l=void 0,p=0;p<u.length-1;p++){var c=u[p],h=u[p+1];c.x<e&&h.x<e||(c.x<e?c=new i(e,c.y+(h.y-c.y)*((e-c.x)/(h.x-c.x)))._round():h.x<e&&(h=new i(e,c.y+(h.y-c.y)*((e-c.x)/(h.x-c.x)))._round()),c.y<r&&h.y<r||(c.y<r?c=new i(c.x+(h.x-c.x)*((r-c.y)/(h.y-c.y)),r)._round():h.y<r&&(h=new i(c.x+(h.x-c.x)*((r-c.y)/(h.y-c.y)),r)._round()),c.x>=n&&h.x>=n||(c.x>=n?c=new i(n,c.y+(h.y-c.y)*((n-c.x)/(h.x-c.x)))._round():h.x>=n&&(h=new i(n,c.y+(h.y-c.y)*((n-c.x)/(h.x-c.x)))._round()),c.y>=a&&h.y>=a||(c.y>=a?c=new i(c.x+(h.x-c.x)*((a-c.y)/(h.y-c.y)),a)._round():h.y>=a&&(h=new i(c.x+(h.x-c.x)*((a-c.y)/(h.y-c.y)),a)._round()),l&&c.equals(l[l.length-1])||(l=[c],o.push(l)),l.push(h)))));}return o}(e.geometry,0,0,ha,ha);P<E.length;P+=1)for(var M=E[P],T=fl(M,x,A,r.vertical||y,n,24,v,t.overscaling,ha),V=0,F=T;V<F.length;V+=1){var O=F[V],L=y;L&&Ml(t,L.text,z,O)||B(M,O);}else if("line-center"===I)for(var D=0,U=e.geometry;D<U.length;D+=1){var R=U[D];if(R.length>1){var j=hl(R,A,r.vertical||y,n,24,v);j&&B(R,j);}}else if("Polygon"===e.type)for(var q=0,N=Po(e.geometry,0);q<N.length;q+=1){var K=N[q],X=gl(K,16);B(K[0],new Vs(X.x,X.y,0));}else if("LineString"===e.type)for(var Z=0,G=e.geometry;Z<G.length;Z+=1){var J=G[Z];B(J,new Vs(J[0].x,J[0].y,0));}else if("Point"===e.type)for(var H=0,Y=e.geometry;H<Y.length;H+=1)for(var $=Y[H],W=0,Q=$;W<Q.length;W+=1){var tt=Q[W];B([tt],new Vs(tt.x,tt.y,0));}}(t,o,c,O,l,p,f);},_=0,A=t.features;_<A.length;_+=1)b();o&&t.generateCollisionDebugBuffers();},t.perspective=function(t,e,r,n,i){var a,o=1/Math.tan(e/2);return t[0]=o/r,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=i&&i!==1/0?(a=1/(n-i),t[10]=(i+n)*a,t[14]=2*i*n*a):(t[10]=-1,t[14]=-2*n),t},t.pick=function(t,e){for(var r={},n=0;n<e.length;n++){var i=e[n];i in t&&(r[i]=t[i]);}return r},t.plugin=jn,t.polygonIntersectsPolygon=ga,t.postMapLoadEvent=et,t.postTurnstileEvent=Q,t.potpack=nu,t.rasterBoundsAttributes=Qu,t.refProperties=["type","source","source-layer","minzoom","maxzoom","filter","layout"],t.register=_n,t.registerForPluginAvailability=function(t){return Un?t({pluginURL:Un,completionCallback:Tn}):Rn.once("pluginAvailable",t),t},t.rotate=function(t,e,r){var n=e[0],i=e[1],a=e[2],o=e[3],s=Math.sin(r),u=Math.cos(r);return t[0]=n*u+a*s,t[1]=i*u+o*s,t[2]=n*-s+a*u,t[3]=i*-s+o*u,t},t.rotateX=function(t,e,r){var n=Math.sin(r),i=Math.cos(r),a=e[4],o=e[5],s=e[6],u=e[7],l=e[8],p=e[9],c=e[10],h=e[11];return e!==t&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[4]=a*i+l*n,t[5]=o*i+p*n,t[6]=s*i+c*n,t[7]=u*i+h*n,t[8]=l*i-a*n,t[9]=p*i-o*n,t[10]=c*i-s*n,t[11]=h*i-u*n,t},t.rotateZ=function(t,e,r){var n=Math.sin(r),i=Math.cos(r),a=e[0],o=e[1],s=e[2],u=e[3],l=e[4],p=e[5],c=e[6],h=e[7];return e!==t&&(t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t[0]=a*i+l*n,t[1]=o*i+p*n,t[2]=s*i+c*n,t[3]=u*i+h*n,t[4]=l*i-a*n,t[5]=p*i-o*n,t[6]=c*i-s*n,t[7]=h*i-u*n,t},t.scale=function(t,e,r){var n=r[0],i=r[1],a=r[2];return t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t[3]=e[3]*n,t[4]=e[4]*i,t[5]=e[5]*i,t[6]=e[6]*i,t[7]=e[7]*i,t[8]=e[8]*a,t[9]=e[9]*a,t[10]=e[10]*a,t[11]=e[11]*a,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},t.setCacheLimits=function(t,e){nt=t,it=e;},t.setRTLTextPlugin=function(t,e){if(Dn===Fn||Dn===On)throw new Error("setRTLTextPlugin cannot be called multiple times.");Dn=Fn,Un=V.resolveURL(t),Tn=function(t){t?(Dn=Vn,Un=null,Dn=Ln,e&&e(t)):Dn=On;},Rn.fire(new At("pluginAvailable",{pluginURL:Un,completionCallback:Tn}));},t.sphericalToCartesian=function(t){var e=t[0],r=t[1],n=t[2];return r+=90,r*=Math.PI/180,n*=Math.PI/180,{x:e*Math.cos(r)*Math.sin(n),y:e*Math.sin(r)*Math.sin(n),z:e*Math.cos(n)}},t.styleSpec=It,t.symbolSize=Us,t.transformMat3=function(t,e,r){var n=e[0],i=e[1],a=e[2];return t[0]=n*r[0]+i*r[3]+a*r[6],t[1]=n*r[1]+i*r[4]+a*r[7],t[2]=n*r[2]+i*r[5]+a*r[8],t},t.transformMat4=La,t.translate=function(t,e,r){var n,i,a,o,s,u,l,p,c,h,f,y,d=r[0],m=r[1],v=r[2];return e===t?(t[12]=e[0]*d+e[4]*m+e[8]*v+e[12],t[13]=e[1]*d+e[5]*m+e[9]*v+e[13],t[14]=e[2]*d+e[6]*m+e[10]*v+e[14],t[15]=e[3]*d+e[7]*m+e[11]*v+e[15]):(n=e[0],i=e[1],a=e[2],o=e[3],s=e[4],u=e[5],l=e[6],p=e[7],c=e[8],h=e[9],f=e[10],y=e[11],t[0]=n,t[1]=i,t[2]=a,t[3]=o,t[4]=s,t[5]=u,t[6]=l,t[7]=p,t[8]=c,t[9]=h,t[10]=f,t[11]=y,t[12]=n*d+s*m+c*v+e[12],t[13]=i*d+u*m+h*v+e[13],t[14]=a*d+l*m+f*v+e[14],t[15]=o*d+p*m+y*v+e[15]),t},t.uniqueId=f,t.validateCustomStyleLayer=function(t){var e=[],r=t.id;return void 0===r&&e.push({message:"layers."+r+': missing required property "id"'}),void 0===t.render&&e.push({message:"layers."+r+': missing required method "render"'}),t.renderingMode&&"2d"!==t.renderingMode&&"3d"!==t.renderingMode&&e.push({message:"layers."+r+': property "renderingMode" must be either "2d" or "3d"'}),e},t.validateLight=hn,t.validateStyle=cn,t.values=function(t){var e=[];for(var r in t)e.push(t[r]);return e},t.vectorTile=Go,t.version="1.5.0",t.warnOnce=w,t.webpSupported=O,t.window=self,t.wrap=p;}));

define(["./shared"],(function(e){"use strict";function t(e){var r=typeof e;if("number"===r||"boolean"===r||"string"===r||null==e)return JSON.stringify(e);if(Array.isArray(e)){for(var i="[",n=0,o=e;n<o.length;n+=1){i+=t(o[n])+",";}return i+"]"}for(var s=Object.keys(e).sort(),a="{",u=0;u<s.length;u++)a+=JSON.stringify(s[u])+":"+t(e[s[u]])+",";return a+"}"}function r(r){for(var i="",n=0,o=e.refProperties;n<o.length;n+=1){i+="/"+t(r[o[n]]);}return i}var i=function(e){this.keyCache={},e&&this.replace(e);};i.prototype.replace=function(e){this._layerConfigs={},this._layers={},this.update(e,[]);},i.prototype.update=function(t,i){for(var n=this,o=0,s=t;o<s.length;o+=1){var a=s[o];this._layerConfigs[a.id]=a;var u=this._layers[a.id]=e.createStyleLayer(a);u._featureFilter=e.featureFilter(u.filter),this.keyCache[a.id]&&delete this.keyCache[a.id];}for(var l=0,h=i;l<h.length;l+=1){var c=h[l];delete this.keyCache[c],delete this._layerConfigs[c],delete this._layers[c];}this.familiesBySource={};for(var f=0,p=function(e,t){for(var i={},n=0;n<e.length;n++){var o=t&&t[e[n].id]||r(e[n]);t&&(t[e[n].id]=o);var s=i[o];s||(s=i[o]=[]),s.push(e[n]);}var a=[];for(var u in i)a.push(i[u]);return a}(e.values(this._layerConfigs),this.keyCache);f<p.length;f+=1){var d=p[f].map((function(e){return n._layers[e.id]})),g=d[0];if("none"!==g.visibility){var m=g.source||"",v=this.familiesBySource[m];v||(v=this.familiesBySource[m]={});var y=g.sourceLayer||"_geojsonTileLayer",w=v[y];w||(w=v[y]=[]),w.push(d);}}};var n=function(t){var r={},i=[];for(var n in t){var o=t[n],s=r[n]={};for(var a in o){var u=o[+a];if(u&&0!==u.bitmap.width&&0!==u.bitmap.height){var l={x:0,y:0,w:u.bitmap.width+2,h:u.bitmap.height+2};i.push(l),s[a]={rect:l,metrics:u.metrics};}}}var h=e.potpack(i),c=h.w,f=h.h,p=new e.AlphaImage({width:c||1,height:f||1});for(var d in t){var g=t[d];for(var m in g){var v=g[+m];if(v&&0!==v.bitmap.width&&0!==v.bitmap.height){var y=r[d][m].rect;e.AlphaImage.copy(v.bitmap,p,{x:0,y:0},{x:y.x+1,y:y.y+1},v.bitmap);}}}this.image=p,this.positions=r;};e.register("GlyphAtlas",n);var o=function(t){this.tileID=new e.OverscaledTileID(t.tileID.overscaledZ,t.tileID.wrap,t.tileID.canonical.z,t.tileID.canonical.x,t.tileID.canonical.y),this.uid=t.uid,this.zoom=t.zoom,this.pixelRatio=t.pixelRatio,this.tileSize=t.tileSize,this.source=t.source,this.overscaling=this.tileID.overscaleFactor(),this.showCollisionBoxes=t.showCollisionBoxes,this.collectResourceTiming=!!t.collectResourceTiming,this.returnDependencies=!!t.returnDependencies;};function s(t,r,i){for(var n=new e.EvaluationParameters(r),o=0,s=t;o<s.length;o+=1){s[o].recalculate(n,i);}}o.prototype.parse=function(t,r,i,o,a){var u=this;this.status="parsing",this.data=t,this.collisionBoxArray=new e.CollisionBoxArray;var l=new e.DictionaryCoder(Object.keys(t.layers).sort()),h=new e.FeatureIndex(this.tileID);h.bucketLayerIDs=[];var c,f,p,d,g={},m={featureIndex:h,iconDependencies:{},patternDependencies:{},glyphDependencies:{},availableImages:i},v=r.familiesBySource[this.source];for(var y in v){var w=t.layers[y];if(w){1===w.version&&e.warnOnce('Vector tile source "'+this.source+'" layer "'+y+'" does not use vector tile spec v2 and therefore may have some rendering errors.');for(var x=l.encode(y),b=[],S=0;S<w.length;S++){var M=w.feature(S);b.push({feature:M,index:S,sourceLayerIndex:x});}for(var k=0,F=v[y];k<F.length;k+=1){var P=F[k],I=P[0];if(!(I.minzoom&&this.zoom<Math.floor(I.minzoom)))if(!(I.maxzoom&&this.zoom>=I.maxzoom))if("none"!==I.visibility)s(P,this.zoom,i),(g[I.id]=I.createBucket({index:h.bucketLayerIDs.length,layers:P,zoom:this.zoom,pixelRatio:this.pixelRatio,overscaling:this.overscaling,collisionBoxArray:this.collisionBoxArray,sourceLayerIndex:x,sourceID:this.source})).populate(b,m),h.bucketLayerIDs.push(P.map((function(e){return e.id})));}}}var T=e.mapObject(m.glyphDependencies,(function(e){return Object.keys(e).map(Number)}));Object.keys(T).length?o.send("getGlyphs",{uid:this.uid,stacks:T},(function(e,t){c||(c=e,f=t,L.call(u));})):f={};var _=Object.keys(m.iconDependencies);_.length?o.send("getImages",{icons:_},(function(e,t){c||(c=e,p=t,L.call(u));})):p={};var D=Object.keys(m.patternDependencies);function L(){if(c)return a(c);if(f&&p&&d){var t=new n(f),r=new e.ImageAtlas(p,d);for(var o in g){var u=g[o];u instanceof e.SymbolBucket?(s(u.layers,this.zoom,i),e.performSymbolLayout(u,f,t.positions,p,r.iconPositions,this.showCollisionBoxes)):u.hasPattern&&(u instanceof e.LineBucket||u instanceof e.FillBucket||u instanceof e.FillExtrusionBucket)&&(s(u.layers,this.zoom,i),u.addFeatures(m,r.patternPositions));}this.status="done",a(null,{buckets:e.values(g).filter((function(e){return !e.isEmpty()})),featureIndex:h,collisionBoxArray:this.collisionBoxArray,glyphAtlasImage:t.image,imageAtlas:r,glyphMap:this.returnDependencies?f:null,iconMap:this.returnDependencies?p:null,glyphPositions:this.returnDependencies?t.positions:null});}}D.length?o.send("getImages",{icons:D},(function(e,t){c||(c=e,d=t,L.call(u));})):d={},L.call(this);};var a="undefined"!=typeof performance,u={getEntriesByName:function(e){return !!(a&&performance&&performance.getEntriesByName)&&performance.getEntriesByName(e)},mark:function(e){return !!(a&&performance&&performance.mark)&&performance.mark(e)},measure:function(e,t,r){return !!(a&&performance&&performance.measure)&&performance.measure(e,t,r)},clearMarks:function(e){return !!(a&&performance&&performance.clearMarks)&&performance.clearMarks(e)},clearMeasures:function(e){return !!(a&&performance&&performance.clearMeasures)&&performance.clearMeasures(e)}},l=function(e){this._marks={start:[e.url,"start"].join("#"),end:[e.url,"end"].join("#"),measure:e.url.toString()},u.mark(this._marks.start);};function h(t,r){var i=e.getArrayBuffer(t.request,(function(t,i,n,o){t?r(t):i&&r(null,{vectorTile:new e.vectorTile.VectorTile(new e.Protobuf(i)),rawData:i,cacheControl:n,expires:o});}));return function(){i.cancel(),r();}}l.prototype.finish=function(){u.mark(this._marks.end);var e=u.getEntriesByName(this._marks.measure);return 0===e.length&&(u.measure(this._marks.measure,this._marks.start,this._marks.end),e=u.getEntriesByName(this._marks.measure),u.clearMarks(this._marks.start),u.clearMarks(this._marks.end),u.clearMeasures(this._marks.measure)),e},u.Performance=l;var c=function(e,t,r,i){this.actor=e,this.layerIndex=t,this.availableImages=r,this.loadVectorData=i||h,this.loading={},this.loaded={};};c.prototype.loadTile=function(t,r){var i=this,n=t.uid;this.loading||(this.loading={});var s=!!(t&&t.request&&t.request.collectResourceTiming)&&new u.Performance(t.request),a=this.loading[n]=new o(t);a.abort=this.loadVectorData(t,(function(t,o){if(delete i.loading[n],t||!o)return a.status="done",i.loaded[n]=a,r(t);var u=o.rawData,l={};o.expires&&(l.expires=o.expires),o.cacheControl&&(l.cacheControl=o.cacheControl);var h={};if(s){var c=s.finish();c&&(h.resourceTiming=JSON.parse(JSON.stringify(c)));}a.vectorTile=o.vectorTile,a.parse(o.vectorTile,i.layerIndex,i.availableImages,i.actor,(function(t,i){if(t||!i)return r(t);r(null,e.extend({rawTileData:u.slice(0)},i,l,h));})),i.loaded=i.loaded||{},i.loaded[n]=a;}));},c.prototype.reloadTile=function(e,t){var r=this,i=this.loaded,n=e.uid,o=this;if(i&&i[n]){var s=i[n];s.showCollisionBoxes=e.showCollisionBoxes;var a=function(e,i){var n=s.reloadCallback;n&&(delete s.reloadCallback,s.parse(s.vectorTile,o.layerIndex,r.availableImages,o.actor,n)),t(e,i);};"parsing"===s.status?s.reloadCallback=a:"done"===s.status&&(s.vectorTile?s.parse(s.vectorTile,this.layerIndex,this.availableImages,this.actor,a):a());}},c.prototype.abortTile=function(e,t){var r=this.loading,i=e.uid;r&&r[i]&&r[i].abort&&(r[i].abort(),delete r[i]),t();},c.prototype.removeTile=function(e,t){var r=this.loaded,i=e.uid;r&&r[i]&&delete r[i],t();};var f=function(){this.loaded={};};f.prototype.loadTile=function(t,r){var i=t.uid,n=t.encoding,o=t.rawImageData,s=new e.DEMData(i,o,n);this.loaded=this.loaded||{},this.loaded[i]=s,r(null,s);},f.prototype.removeTile=function(e){var t=this.loaded,r=e.uid;t&&t[r]&&delete t[r];};var p={RADIUS:6378137,FLATTENING:1/298.257223563,POLAR_RADIUS:6356752.3142};function d(e){var t=0;if(e&&e.length>0){t+=Math.abs(g(e[0]));for(var r=1;r<e.length;r++)t-=Math.abs(g(e[r]));}return t}function g(e){var t,r,i,n,o,s,a=0,u=e.length;if(u>2){for(s=0;s<u;s++)s===u-2?(i=u-2,n=u-1,o=0):s===u-1?(i=u-1,n=0,o=1):(i=s,n=s+1,o=s+2),t=e[i],r=e[n],a+=(m(e[o][0])-m(t[0]))*Math.sin(m(r[1]));a=a*p.RADIUS*p.RADIUS/2;}return a}function m(e){return e*Math.PI/180}var v={geometry:function e(t){var r,i=0;switch(t.type){case"Polygon":return d(t.coordinates);case"MultiPolygon":for(r=0;r<t.coordinates.length;r++)i+=d(t.coordinates[r]);return i;case"Point":case"MultiPoint":case"LineString":case"MultiLineString":return 0;case"GeometryCollection":for(r=0;r<t.geometries.length;r++)i+=e(t.geometries[r]);return i}},ring:g},y=function e(t,r){switch(t&&t.type||null){case"FeatureCollection":return t.features=t.features.map(w(e,r)),t;case"GeometryCollection":return t.geometries=t.geometries.map(w(e,r)),t;case"Feature":return t.geometry=e(t.geometry,r),t;case"Polygon":case"MultiPolygon":return function(e,t){"Polygon"===e.type?e.coordinates=x(e.coordinates,t):"MultiPolygon"===e.type&&(e.coordinates=e.coordinates.map(w(x,t)));return e}(t,r);default:return t}};function w(e,t){return function(r){return e(r,t)}}function x(e,t){t=!!t,e[0]=b(e[0],t);for(var r=1;r<e.length;r++)e[r]=b(e[r],!t);return e}function b(e,t){return function(e){return v.ring(e)>=0}(e)===t?e:e.reverse()}var S=e.vectorTile.VectorTileFeature.prototype.toGeoJSON,M=function(t){this._feature=t,this.extent=e.EXTENT,this.type=t.type,this.properties=t.tags,"id"in t&&!isNaN(t.id)&&(this.id=parseInt(t.id,10));};M.prototype.loadGeometry=function(){if(1===this._feature.type){for(var t=[],r=0,i=this._feature.geometry;r<i.length;r+=1){var n=i[r];t.push([new e.Point$1(n[0],n[1])]);}return t}for(var o=[],s=0,a=this._feature.geometry;s<a.length;s+=1){for(var u=[],l=0,h=a[s];l<h.length;l+=1){var c=h[l];u.push(new e.Point$1(c[0],c[1]));}o.push(u);}return o},M.prototype.toGeoJSON=function(e,t,r){return S.call(this,e,t,r)};var k=function(t){this.layers={_geojsonTileLayer:this},this.name="_geojsonTileLayer",this.extent=e.EXTENT,this.length=t.length,this._features=t;};k.prototype.feature=function(e){return new M(this._features[e])};var F=P;function P(e){this.buf=ArrayBuffer.isView&&ArrayBuffer.isView(e)?e:new Uint8Array(e||0),this.pos=0,this.type=0,this.length=this.buf.length;}P.Varint=0,P.Fixed64=1,P.Bytes=2,P.Fixed32=5;function I(e){return e.type===P.Bytes?e.readVarint()+e.pos:e.pos+1}function T(e,t,r){return r?4294967296*t+(e>>>0):4294967296*(t>>>0)+(e>>>0)}function _(e,t,r){var i=t<=16383?1:t<=2097151?2:t<=268435455?3:Math.floor(Math.log(t)/(7*Math.LN2));r.realloc(i);for(var n=r.pos-1;n>=e;n--)r.buf[n+i]=r.buf[n];}function D(e,t){for(var r=0;r<e.length;r++)t.writeVarint(e[r]);}function L(e,t){for(var r=0;r<e.length;r++)t.writeSVarint(e[r]);}function B(e,t){for(var r=0;r<e.length;r++)t.writeFloat(e[r]);}function V(e,t){for(var r=0;r<e.length;r++)t.writeDouble(e[r]);}function C(e,t){for(var r=0;r<e.length;r++)t.writeBoolean(e[r]);}function z(e,t){for(var r=0;r<e.length;r++)t.writeFixed32(e[r]);}function E(e,t){for(var r=0;r<e.length;r++)t.writeSFixed32(e[r]);}function O(e,t){for(var r=0;r<e.length;r++)t.writeFixed64(e[r]);}function N(e,t){for(var r=0;r<e.length;r++)t.writeSFixed64(e[r]);}function A(e,t){return (e[t]|e[t+1]<<8|e[t+2]<<16)+16777216*e[t+3]}function J(e,t,r){e[r]=t,e[r+1]=t>>>8,e[r+2]=t>>>16,e[r+3]=t>>>24;}function G(e,t){return (e[t]|e[t+1]<<8|e[t+2]<<16)+(e[t+3]<<24)}P.prototype={destroy:function(){this.buf=null;},readFields:function(e,t,r){for(r=r||this.length;this.pos<r;){var i=this.readVarint(),n=i>>3,o=this.pos;this.type=7&i,e(n,t,this),this.pos===o&&this.skip(i);}return t},readMessage:function(e,t){return this.readFields(e,t,this.readVarint()+this.pos)},readFixed32:function(){var e=A(this.buf,this.pos);return this.pos+=4,e},readSFixed32:function(){var e=G(this.buf,this.pos);return this.pos+=4,e},readFixed64:function(){var e=A(this.buf,this.pos)+4294967296*A(this.buf,this.pos+4);return this.pos+=8,e},readSFixed64:function(){var e=A(this.buf,this.pos)+4294967296*G(this.buf,this.pos+4);return this.pos+=8,e},readFloat:function(){var t=e.ieee754.read(this.buf,this.pos,!0,23,4);return this.pos+=4,t},readDouble:function(){var t=e.ieee754.read(this.buf,this.pos,!0,52,8);return this.pos+=8,t},readVarint:function(e){var t,r,i=this.buf;return t=127&(r=i[this.pos++]),r<128?t:(t|=(127&(r=i[this.pos++]))<<7,r<128?t:(t|=(127&(r=i[this.pos++]))<<14,r<128?t:(t|=(127&(r=i[this.pos++]))<<21,r<128?t:function(e,t,r){var i,n,o=r.buf;if(n=o[r.pos++],i=(112&n)>>4,n<128)return T(e,i,t);if(n=o[r.pos++],i|=(127&n)<<3,n<128)return T(e,i,t);if(n=o[r.pos++],i|=(127&n)<<10,n<128)return T(e,i,t);if(n=o[r.pos++],i|=(127&n)<<17,n<128)return T(e,i,t);if(n=o[r.pos++],i|=(127&n)<<24,n<128)return T(e,i,t);if(n=o[r.pos++],i|=(1&n)<<31,n<128)return T(e,i,t);throw new Error("Expected varint not more than 10 bytes")}(t|=(15&(r=i[this.pos]))<<28,e,this))))},readVarint64:function(){return this.readVarint(!0)},readSVarint:function(){var e=this.readVarint();return e%2==1?(e+1)/-2:e/2},readBoolean:function(){return Boolean(this.readVarint())},readString:function(){var e=this.readVarint()+this.pos,t=function(e,t,r){var i="",n=t;for(;n<r;){var o,s,a,u=e[n],l=null,h=u>239?4:u>223?3:u>191?2:1;if(n+h>r)break;1===h?u<128&&(l=u):2===h?128==(192&(o=e[n+1]))&&(l=(31&u)<<6|63&o)<=127&&(l=null):3===h?(o=e[n+1],s=e[n+2],128==(192&o)&&128==(192&s)&&((l=(15&u)<<12|(63&o)<<6|63&s)<=2047||l>=55296&&l<=57343)&&(l=null)):4===h&&(o=e[n+1],s=e[n+2],a=e[n+3],128==(192&o)&&128==(192&s)&&128==(192&a)&&((l=(15&u)<<18|(63&o)<<12|(63&s)<<6|63&a)<=65535||l>=1114112)&&(l=null)),null===l?(l=65533,h=1):l>65535&&(l-=65536,i+=String.fromCharCode(l>>>10&1023|55296),l=56320|1023&l),i+=String.fromCharCode(l),n+=h;}return i}(this.buf,this.pos,e);return this.pos=e,t},readBytes:function(){var e=this.readVarint()+this.pos,t=this.buf.subarray(this.pos,e);return this.pos=e,t},readPackedVarint:function(e,t){if(this.type!==P.Bytes)return e.push(this.readVarint(t));var r=I(this);for(e=e||[];this.pos<r;)e.push(this.readVarint(t));return e},readPackedSVarint:function(e){if(this.type!==P.Bytes)return e.push(this.readSVarint());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readSVarint());return e},readPackedBoolean:function(e){if(this.type!==P.Bytes)return e.push(this.readBoolean());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readBoolean());return e},readPackedFloat:function(e){if(this.type!==P.Bytes)return e.push(this.readFloat());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readFloat());return e},readPackedDouble:function(e){if(this.type!==P.Bytes)return e.push(this.readDouble());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readDouble());return e},readPackedFixed32:function(e){if(this.type!==P.Bytes)return e.push(this.readFixed32());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readFixed32());return e},readPackedSFixed32:function(e){if(this.type!==P.Bytes)return e.push(this.readSFixed32());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readSFixed32());return e},readPackedFixed64:function(e){if(this.type!==P.Bytes)return e.push(this.readFixed64());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readFixed64());return e},readPackedSFixed64:function(e){if(this.type!==P.Bytes)return e.push(this.readSFixed64());var t=I(this);for(e=e||[];this.pos<t;)e.push(this.readSFixed64());return e},skip:function(e){var t=7&e;if(t===P.Varint)for(;this.buf[this.pos++]>127;);else if(t===P.Bytes)this.pos=this.readVarint()+this.pos;else if(t===P.Fixed32)this.pos+=4;else{if(t!==P.Fixed64)throw new Error("Unimplemented type: "+t);this.pos+=8;}},writeTag:function(e,t){this.writeVarint(e<<3|t);},realloc:function(e){for(var t=this.length||16;t<this.pos+e;)t*=2;if(t!==this.length){var r=new Uint8Array(t);r.set(this.buf),this.buf=r,this.length=t;}},finish:function(){return this.length=this.pos,this.pos=0,this.buf.subarray(0,this.length)},writeFixed32:function(e){this.realloc(4),J(this.buf,e,this.pos),this.pos+=4;},writeSFixed32:function(e){this.realloc(4),J(this.buf,e,this.pos),this.pos+=4;},writeFixed64:function(e){this.realloc(8),J(this.buf,-1&e,this.pos),J(this.buf,Math.floor(e*(1/4294967296)),this.pos+4),this.pos+=8;},writeSFixed64:function(e){this.realloc(8),J(this.buf,-1&e,this.pos),J(this.buf,Math.floor(e*(1/4294967296)),this.pos+4),this.pos+=8;},writeVarint:function(e){(e=+e||0)>268435455||e<0?function(e,t){var r,i;e>=0?(r=e%4294967296|0,i=e/4294967296|0):(i=~(-e/4294967296),4294967295^(r=~(-e%4294967296))?r=r+1|0:(r=0,i=i+1|0));if(e>=0x10000000000000000||e<-0x10000000000000000)throw new Error("Given varint doesn't fit into 10 bytes");t.realloc(10),function(e,t,r){r.buf[r.pos++]=127&e|128,e>>>=7,r.buf[r.pos++]=127&e|128,e>>>=7,r.buf[r.pos++]=127&e|128,e>>>=7,r.buf[r.pos++]=127&e|128,e>>>=7,r.buf[r.pos]=127&e;}(r,0,t),function(e,t){var r=(7&e)<<4;if(t.buf[t.pos++]|=r|((e>>>=3)?128:0),!e)return;if(t.buf[t.pos++]=127&e|((e>>>=7)?128:0),!e)return;if(t.buf[t.pos++]=127&e|((e>>>=7)?128:0),!e)return;if(t.buf[t.pos++]=127&e|((e>>>=7)?128:0),!e)return;if(t.buf[t.pos++]=127&e|((e>>>=7)?128:0),!e)return;t.buf[t.pos++]=127&e;}(i,t);}(e,this):(this.realloc(4),this.buf[this.pos++]=127&e|(e>127?128:0),e<=127||(this.buf[this.pos++]=127&(e>>>=7)|(e>127?128:0),e<=127||(this.buf[this.pos++]=127&(e>>>=7)|(e>127?128:0),e<=127||(this.buf[this.pos++]=e>>>7&127))));},writeSVarint:function(e){this.writeVarint(e<0?2*-e-1:2*e);},writeBoolean:function(e){this.writeVarint(Boolean(e));},writeString:function(e){e=String(e),this.realloc(4*e.length),this.pos++;var t=this.pos;this.pos=function(e,t,r){for(var i,n,o=0;o<t.length;o++){if((i=t.charCodeAt(o))>55295&&i<57344){if(!n){i>56319||o+1===t.length?(e[r++]=239,e[r++]=191,e[r++]=189):n=i;continue}if(i<56320){e[r++]=239,e[r++]=191,e[r++]=189,n=i;continue}i=n-55296<<10|i-56320|65536,n=null;}else n&&(e[r++]=239,e[r++]=191,e[r++]=189,n=null);i<128?e[r++]=i:(i<2048?e[r++]=i>>6|192:(i<65536?e[r++]=i>>12|224:(e[r++]=i>>18|240,e[r++]=i>>12&63|128),e[r++]=i>>6&63|128),e[r++]=63&i|128);}return r}(this.buf,e,this.pos);var r=this.pos-t;r>=128&&_(t,r,this),this.pos=t-1,this.writeVarint(r),this.pos+=r;},writeFloat:function(t){this.realloc(4),e.ieee754.write(this.buf,t,this.pos,!0,23,4),this.pos+=4;},writeDouble:function(t){this.realloc(8),e.ieee754.write(this.buf,t,this.pos,!0,52,8),this.pos+=8;},writeBytes:function(e){var t=e.length;this.writeVarint(t),this.realloc(t);for(var r=0;r<t;r++)this.buf[this.pos++]=e[r];},writeRawMessage:function(e,t){this.pos++;var r=this.pos;e(t,this);var i=this.pos-r;i>=128&&_(r,i,this),this.pos=r-1,this.writeVarint(i),this.pos+=i;},writeMessage:function(e,t,r){this.writeTag(e,P.Bytes),this.writeRawMessage(t,r);},writePackedVarint:function(e,t){t.length&&this.writeMessage(e,D,t);},writePackedSVarint:function(e,t){t.length&&this.writeMessage(e,L,t);},writePackedBoolean:function(e,t){t.length&&this.writeMessage(e,C,t);},writePackedFloat:function(e,t){t.length&&this.writeMessage(e,B,t);},writePackedDouble:function(e,t){t.length&&this.writeMessage(e,V,t);},writePackedFixed32:function(e,t){t.length&&this.writeMessage(e,z,t);},writePackedSFixed32:function(e,t){t.length&&this.writeMessage(e,E,t);},writePackedFixed64:function(e,t){t.length&&this.writeMessage(e,O,t);},writePackedSFixed64:function(e,t){t.length&&this.writeMessage(e,N,t);},writeBytesField:function(e,t){this.writeTag(e,P.Bytes),this.writeBytes(t);},writeFixed32Field:function(e,t){this.writeTag(e,P.Fixed32),this.writeFixed32(t);},writeSFixed32Field:function(e,t){this.writeTag(e,P.Fixed32),this.writeSFixed32(t);},writeFixed64Field:function(e,t){this.writeTag(e,P.Fixed64),this.writeFixed64(t);},writeSFixed64Field:function(e,t){this.writeTag(e,P.Fixed64),this.writeSFixed64(t);},writeVarintField:function(e,t){this.writeTag(e,P.Varint),this.writeVarint(t);},writeSVarintField:function(e,t){this.writeTag(e,P.Varint),this.writeSVarint(t);},writeStringField:function(e,t){this.writeTag(e,P.Bytes),this.writeString(t);},writeFloatField:function(e,t){this.writeTag(e,P.Fixed32),this.writeFloat(t);},writeDoubleField:function(e,t){this.writeTag(e,P.Fixed64),this.writeDouble(t);},writeBooleanField:function(e,t){this.writeVarintField(e,Boolean(t));}};var Z=e.vectorTile.VectorTileFeature,j=Y;function Y(e,t){this.options=t||{},this.features=e,this.length=e.length;}function X(e,t){this.id="number"==typeof e.id?e.id:void 0,this.type=e.type,this.rawGeometry=1===e.type?[e.geometry]:e.geometry,this.properties=e.tags,this.extent=t||4096;}Y.prototype.feature=function(e){return new X(this.features[e],this.options.extent)},X.prototype.loadGeometry=function(){var t=this.rawGeometry;this.geometry=[];for(var r=0;r<t.length;r++){for(var i=t[r],n=[],o=0;o<i.length;o++)n.push(new e.Point$1(i[o][0],i[o][1]));this.geometry.push(n);}return this.geometry},X.prototype.bbox=function(){this.geometry||this.loadGeometry();for(var e=this.geometry,t=1/0,r=-1/0,i=1/0,n=-1/0,o=0;o<e.length;o++)for(var s=e[o],a=0;a<s.length;a++){var u=s[a];t=Math.min(t,u.x),r=Math.max(r,u.x),i=Math.min(i,u.y),n=Math.max(n,u.y);}return [t,i,r,n]},X.prototype.toGeoJSON=Z.prototype.toGeoJSON;var R=$,W=$,q=function(e,t){t=t||{};var r={};for(var i in e)r[i]=new j(e[i].features,t),r[i].name=i,r[i].version=t.version,r[i].extent=t.extent;return $({layers:r})},U=j;function $(e){var t=new F;return function(e,t){for(var r in e.layers)t.writeMessage(3,H,e.layers[r]);}(e,t),t.finish()}function H(e,t){var r;t.writeVarintField(15,e.version||1),t.writeStringField(1,e.name||""),t.writeVarintField(5,e.extent||4096);var i={keys:[],values:[],keycache:{},valuecache:{}};for(r=0;r<e.length;r++)i.feature=e.feature(r),t.writeMessage(2,K,i);var n=i.keys;for(r=0;r<n.length;r++)t.writeStringField(3,n[r]);var o=i.values;for(r=0;r<o.length;r++)t.writeMessage(4,ie,o[r]);}function K(e,t){var r=e.feature;void 0!==r.id&&t.writeVarintField(1,r.id),t.writeMessage(2,Q,e),t.writeVarintField(3,r.type),t.writeMessage(4,re,r);}function Q(e,t){var r=e.feature,i=e.keys,n=e.values,o=e.keycache,s=e.valuecache;for(var a in r.properties){var u=o[a];void 0===u&&(i.push(a),u=i.length-1,o[a]=u),t.writeVarint(u);var l=r.properties[a],h=typeof l;"string"!==h&&"boolean"!==h&&"number"!==h&&(l=JSON.stringify(l));var c=h+":"+l,f=s[c];void 0===f&&(n.push(l),f=n.length-1,s[c]=f),t.writeVarint(f);}}function ee(e,t){return (t<<3)+(7&e)}function te(e){return e<<1^e>>31}function re(e,t){for(var r=e.loadGeometry(),i=e.type,n=0,o=0,s=r.length,a=0;a<s;a++){var u=r[a],l=1;1===i&&(l=u.length),t.writeVarint(ee(1,l));for(var h=3===i?u.length-1:u.length,c=0;c<h;c++){1===c&&1!==i&&t.writeVarint(ee(2,h-1));var f=u[c].x-n,p=u[c].y-o;t.writeVarint(te(f)),t.writeVarint(te(p)),n+=f,o+=p;}3===i&&t.writeVarint(ee(7,1));}}function ie(e,t){var r=typeof e;"string"===r?t.writeStringField(1,e):"boolean"===r?t.writeBooleanField(7,e):"number"===r&&(e%1!=0?t.writeDoubleField(3,e):e<0?t.writeSVarintField(6,e):t.writeVarintField(5,e));}function ne(e,t,r,i,n,o){if(!(n-i<=r)){var s=i+n>>1;!function e(t,r,i,n,o,s){for(;o>n;){if(o-n>600){var a=o-n+1,u=i-n+1,l=Math.log(a),h=.5*Math.exp(2*l/3),c=.5*Math.sqrt(l*h*(a-h)/a)*(u-a/2<0?-1:1),f=Math.max(n,Math.floor(i-u*h/a+c)),p=Math.min(o,Math.floor(i+(a-u)*h/a+c));e(t,r,i,f,p,s);}var d=r[2*i+s],g=n,m=o;for(oe(t,r,n,i),r[2*o+s]>d&&oe(t,r,n,o);g<m;){for(oe(t,r,g,m),g++,m--;r[2*g+s]<d;)g++;for(;r[2*m+s]>d;)m--;}r[2*n+s]===d?oe(t,r,n,m):oe(t,r,++m,o),m<=i&&(n=m+1),i<=m&&(o=m-1);}}(e,t,s,i,n,o%2),ne(e,t,r,i,s-1,o+1),ne(e,t,r,s+1,n,o+1);}}function oe(e,t,r,i){se(e,r,i),se(t,2*r,2*i),se(t,2*r+1,2*i+1);}function se(e,t,r){var i=e[t];e[t]=e[r],e[r]=i;}function ae(e,t,r,i){var n=e-r,o=t-i;return n*n+o*o}R.fromVectorTileJs=W,R.fromGeojsonVt=q,R.GeoJSONWrapper=U;var ue=function(e){return e[0]},le=function(e){return e[1]},he=function(e,t,r,i,n){void 0===t&&(t=ue),void 0===r&&(r=le),void 0===i&&(i=64),void 0===n&&(n=Float64Array),this.nodeSize=i,this.points=e;for(var o=e.length<65536?Uint16Array:Uint32Array,s=this.ids=new o(e.length),a=this.coords=new n(2*e.length),u=0;u<e.length;u++)s[u]=u,a[2*u]=t(e[u]),a[2*u+1]=r(e[u]);ne(s,a,i,0,s.length-1,0);};he.prototype.range=function(e,t,r,i){return function(e,t,r,i,n,o,s){for(var a,u,l=[0,e.length-1,0],h=[];l.length;){var c=l.pop(),f=l.pop(),p=l.pop();if(f-p<=s)for(var d=p;d<=f;d++)a=t[2*d],u=t[2*d+1],a>=r&&a<=n&&u>=i&&u<=o&&h.push(e[d]);else{var g=Math.floor((p+f)/2);a=t[2*g],u=t[2*g+1],a>=r&&a<=n&&u>=i&&u<=o&&h.push(e[g]);var m=(c+1)%2;(0===c?r<=a:i<=u)&&(l.push(p),l.push(g-1),l.push(m)),(0===c?n>=a:o>=u)&&(l.push(g+1),l.push(f),l.push(m));}}return h}(this.ids,this.coords,e,t,r,i,this.nodeSize)},he.prototype.within=function(e,t,r){return function(e,t,r,i,n,o){for(var s=[0,e.length-1,0],a=[],u=n*n;s.length;){var l=s.pop(),h=s.pop(),c=s.pop();if(h-c<=o)for(var f=c;f<=h;f++)ae(t[2*f],t[2*f+1],r,i)<=u&&a.push(e[f]);else{var p=Math.floor((c+h)/2),d=t[2*p],g=t[2*p+1];ae(d,g,r,i)<=u&&a.push(e[p]);var m=(l+1)%2;(0===l?r-n<=d:i-n<=g)&&(s.push(c),s.push(p-1),s.push(m)),(0===l?r+n>=d:i+n>=g)&&(s.push(p+1),s.push(h),s.push(m));}}return a}(this.ids,this.coords,e,t,r,this.nodeSize)};var ce={minZoom:0,maxZoom:16,radius:40,extent:512,nodeSize:64,log:!1,reduce:null,map:function(e){return e}},fe=function(e){this.options=we(Object.create(ce),e),this.trees=new Array(this.options.maxZoom+1);};function pe(e,t,r,i,n){return {x:e,y:t,zoom:1/0,id:r,parentId:-1,numPoints:i,properties:n}}function de(e,t){var r=e.geometry.coordinates,i=r[0],n=r[1];return {x:ve(i),y:ye(n),zoom:1/0,index:t,parentId:-1}}function ge(e){return {type:"Feature",id:e.id,properties:me(e),geometry:{type:"Point",coordinates:[(i=e.x,360*(i-.5)),(t=e.y,r=(180-360*t)*Math.PI/180,360*Math.atan(Math.exp(r))/Math.PI-90)]}};var t,r,i;}function me(e){var t=e.numPoints,r=t>=1e4?Math.round(t/1e3)+"k":t>=1e3?Math.round(t/100)/10+"k":t;return we(we({},e.properties),{cluster:!0,cluster_id:e.id,point_count:t,point_count_abbreviated:r})}function ve(e){return e/360+.5}function ye(e){var t=Math.sin(e*Math.PI/180),r=.5-.25*Math.log((1+t)/(1-t))/Math.PI;return r<0?0:r>1?1:r}function we(e,t){for(var r in t)e[r]=t[r];return e}function xe(e){return e.x}function be(e){return e.y}function Se(e,t,r,i,n,o){var s=n-r,a=o-i;if(0!==s||0!==a){var u=((e-r)*s+(t-i)*a)/(s*s+a*a);u>1?(r=n,i=o):u>0&&(r+=s*u,i+=a*u);}return (s=e-r)*s+(a=t-i)*a}function Me(e,t,r,i){var n={id:void 0===e?null:e,type:t,geometry:r,tags:i,minX:1/0,minY:1/0,maxX:-1/0,maxY:-1/0};return function(e){var t=e.geometry,r=e.type;if("Point"===r||"MultiPoint"===r||"LineString"===r)ke(e,t);else if("Polygon"===r||"MultiLineString"===r)for(var i=0;i<t.length;i++)ke(e,t[i]);else if("MultiPolygon"===r)for(i=0;i<t.length;i++)for(var n=0;n<t[i].length;n++)ke(e,t[i][n]);}(n),n}function ke(e,t){for(var r=0;r<t.length;r+=3)e.minX=Math.min(e.minX,t[r]),e.minY=Math.min(e.minY,t[r+1]),e.maxX=Math.max(e.maxX,t[r]),e.maxY=Math.max(e.maxY,t[r+1]);}function Fe(e,t,r,i){if(t.geometry){var n=t.geometry.coordinates,o=t.geometry.type,s=Math.pow(r.tolerance/((1<<r.maxZoom)*r.extent),2),a=[],u=t.id;if(r.promoteId?u=t.properties[r.promoteId]:r.generateId&&(u=i||0),"Point"===o)Pe(n,a);else if("MultiPoint"===o)for(var l=0;l<n.length;l++)Pe(n[l],a);else if("LineString"===o)Ie(n,a,s,!1);else if("MultiLineString"===o){if(r.lineMetrics){for(l=0;l<n.length;l++)a=[],Ie(n[l],a,s,!1),e.push(Me(u,"LineString",a,t.properties));return}Te(n,a,s,!1);}else if("Polygon"===o)Te(n,a,s,!0);else{if("MultiPolygon"!==o){if("GeometryCollection"===o){for(l=0;l<t.geometry.geometries.length;l++)Fe(e,{id:u,geometry:t.geometry.geometries[l],properties:t.properties},r,i);return}throw new Error("Input data is not a valid GeoJSON object.")}for(l=0;l<n.length;l++){var h=[];Te(n[l],h,s,!0),a.push(h);}}e.push(Me(u,o,a,t.properties));}}function Pe(e,t){t.push(_e(e[0])),t.push(De(e[1])),t.push(0);}function Ie(e,t,r,i){for(var n,o,s=0,a=0;a<e.length;a++){var u=_e(e[a][0]),l=De(e[a][1]);t.push(u),t.push(l),t.push(0),a>0&&(s+=i?(n*l-u*o)/2:Math.sqrt(Math.pow(u-n,2)+Math.pow(l-o,2))),n=u,o=l;}var h=t.length-3;t[2]=1,function e(t,r,i,n){for(var o,s=n,a=i-r>>1,u=i-r,l=t[r],h=t[r+1],c=t[i],f=t[i+1],p=r+3;p<i;p+=3){var d=Se(t[p],t[p+1],l,h,c,f);if(d>s)o=p,s=d;else if(d===s){var g=Math.abs(p-a);g<u&&(o=p,u=g);}}s>n&&(o-r>3&&e(t,r,o,n),t[o+2]=s,i-o>3&&e(t,o,i,n));}(t,0,h,r),t[h+2]=1,t.size=Math.abs(s),t.start=0,t.end=t.size;}function Te(e,t,r,i){for(var n=0;n<e.length;n++){var o=[];Ie(e[n],o,r,i),t.push(o);}}function _e(e){return e/360+.5}function De(e){var t=Math.sin(e*Math.PI/180),r=.5-.25*Math.log((1+t)/(1-t))/Math.PI;return r<0?0:r>1?1:r}function Le(e,t,r,i,n,o,s,a){if(i/=t,o>=(r/=t)&&s<i)return e;if(s<r||o>=i)return null;for(var u=[],l=0;l<e.length;l++){var h=e[l],c=h.geometry,f=h.type,p=0===n?h.minX:h.minY,d=0===n?h.maxX:h.maxY;if(p>=r&&d<i)u.push(h);else if(!(d<r||p>=i)){var g=[];if("Point"===f||"MultiPoint"===f)Be(c,g,r,i,n);else if("LineString"===f)Ve(c,g,r,i,n,!1,a.lineMetrics);else if("MultiLineString"===f)ze(c,g,r,i,n,!1);else if("Polygon"===f)ze(c,g,r,i,n,!0);else if("MultiPolygon"===f)for(var m=0;m<c.length;m++){var v=[];ze(c[m],v,r,i,n,!0),v.length&&g.push(v);}if(g.length){if(a.lineMetrics&&"LineString"===f){for(m=0;m<g.length;m++)u.push(Me(h.id,f,g[m],h.tags));continue}"LineString"!==f&&"MultiLineString"!==f||(1===g.length?(f="LineString",g=g[0]):f="MultiLineString"),"Point"!==f&&"MultiPoint"!==f||(f=3===g.length?"Point":"MultiPoint"),u.push(Me(h.id,f,g,h.tags));}}}return u.length?u:null}function Be(e,t,r,i,n){for(var o=0;o<e.length;o+=3){var s=e[o+n];s>=r&&s<=i&&(t.push(e[o]),t.push(e[o+1]),t.push(e[o+2]));}}function Ve(e,t,r,i,n,o,s){for(var a,u,l=Ce(e),h=0===n?Oe:Ne,c=e.start,f=0;f<e.length-3;f+=3){var p=e[f],d=e[f+1],g=e[f+2],m=e[f+3],v=e[f+4],y=0===n?p:d,w=0===n?m:v,x=!1;s&&(a=Math.sqrt(Math.pow(p-m,2)+Math.pow(d-v,2))),y<r?w>r&&(u=h(l,p,d,m,v,r),s&&(l.start=c+a*u)):y>i?w<i&&(u=h(l,p,d,m,v,i),s&&(l.start=c+a*u)):Ee(l,p,d,g),w<r&&y>=r&&(u=h(l,p,d,m,v,r),x=!0),w>i&&y<=i&&(u=h(l,p,d,m,v,i),x=!0),!o&&x&&(s&&(l.end=c+a*u),t.push(l),l=Ce(e)),s&&(c+=a);}var b=e.length-3;p=e[b],d=e[b+1],g=e[b+2],(y=0===n?p:d)>=r&&y<=i&&Ee(l,p,d,g),b=l.length-3,o&&b>=3&&(l[b]!==l[0]||l[b+1]!==l[1])&&Ee(l,l[0],l[1],l[2]),l.length&&t.push(l);}function Ce(e){var t=[];return t.size=e.size,t.start=e.start,t.end=e.end,t}function ze(e,t,r,i,n,o){for(var s=0;s<e.length;s++)Ve(e[s],t,r,i,n,o,!1);}function Ee(e,t,r,i){e.push(t),e.push(r),e.push(i);}function Oe(e,t,r,i,n,o){var s=(o-t)/(i-t);return e.push(o),e.push(r+(n-r)*s),e.push(1),s}function Ne(e,t,r,i,n,o){var s=(o-r)/(n-r);return e.push(t+(i-t)*s),e.push(o),e.push(1),s}function Ae(e,t){for(var r=[],i=0;i<e.length;i++){var n,o=e[i],s=o.type;if("Point"===s||"MultiPoint"===s||"LineString"===s)n=Je(o.geometry,t);else if("MultiLineString"===s||"Polygon"===s){n=[];for(var a=0;a<o.geometry.length;a++)n.push(Je(o.geometry[a],t));}else if("MultiPolygon"===s)for(n=[],a=0;a<o.geometry.length;a++){for(var u=[],l=0;l<o.geometry[a].length;l++)u.push(Je(o.geometry[a][l],t));n.push(u);}r.push(Me(o.id,s,n,o.tags));}return r}function Je(e,t){var r=[];r.size=e.size,void 0!==e.start&&(r.start=e.start,r.end=e.end);for(var i=0;i<e.length;i+=3)r.push(e[i]+t,e[i+1],e[i+2]);return r}function Ge(e,t){if(e.transformed)return e;var r,i,n,o=1<<e.z,s=e.x,a=e.y;for(r=0;r<e.features.length;r++){var u=e.features[r],l=u.geometry,h=u.type;if(u.geometry=[],1===h)for(i=0;i<l.length;i+=2)u.geometry.push(Ze(l[i],l[i+1],t,o,s,a));else for(i=0;i<l.length;i++){var c=[];for(n=0;n<l[i].length;n+=2)c.push(Ze(l[i][n],l[i][n+1],t,o,s,a));u.geometry.push(c);}}return e.transformed=!0,e}function Ze(e,t,r,i,n,o){return [Math.round(r*(e*i-n)),Math.round(r*(t*i-o))]}function je(e,t,r,i,n){for(var o=t===n.maxZoom?0:n.tolerance/((1<<t)*n.extent),s={features:[],numPoints:0,numSimplified:0,numFeatures:0,source:null,x:r,y:i,z:t,transformed:!1,minX:2,minY:1,maxX:-1,maxY:0},a=0;a<e.length;a++){s.numFeatures++,Ye(s,e[a],o,n);var u=e[a].minX,l=e[a].minY,h=e[a].maxX,c=e[a].maxY;u<s.minX&&(s.minX=u),l<s.minY&&(s.minY=l),h>s.maxX&&(s.maxX=h),c>s.maxY&&(s.maxY=c);}return s}function Ye(e,t,r,i){var n=t.geometry,o=t.type,s=[];if("Point"===o||"MultiPoint"===o)for(var a=0;a<n.length;a+=3)s.push(n[a]),s.push(n[a+1]),e.numPoints++,e.numSimplified++;else if("LineString"===o)Xe(s,n,e,r,!1,!1);else if("MultiLineString"===o||"Polygon"===o)for(a=0;a<n.length;a++)Xe(s,n[a],e,r,"Polygon"===o,0===a);else if("MultiPolygon"===o)for(var u=0;u<n.length;u++){var l=n[u];for(a=0;a<l.length;a++)Xe(s,l[a],e,r,!0,0===a);}if(s.length){var h=t.tags||null;if("LineString"===o&&i.lineMetrics){for(var c in h={},t.tags)h[c]=t.tags[c];h.mapbox_clip_start=n.start/n.size,h.mapbox_clip_end=n.end/n.size;}var f={geometry:s,type:"Polygon"===o||"MultiPolygon"===o?3:"LineString"===o||"MultiLineString"===o?2:1,tags:h};null!==t.id&&(f.id=t.id),e.features.push(f);}}function Xe(e,t,r,i,n,o){var s=i*i;if(i>0&&t.size<(n?s:i))r.numPoints+=t.length/3;else{for(var a=[],u=0;u<t.length;u+=3)(0===i||t[u+2]>s)&&(r.numSimplified++,a.push(t[u]),a.push(t[u+1])),r.numPoints++;n&&function(e,t){for(var r=0,i=0,n=e.length,o=n-2;i<n;o=i,i+=2)r+=(e[i]-e[o])*(e[i+1]+e[o+1]);if(r>0===t)for(i=0,n=e.length;i<n/2;i+=2){var s=e[i],a=e[i+1];e[i]=e[n-2-i],e[i+1]=e[n-1-i],e[n-2-i]=s,e[n-1-i]=a;}}(a,o),e.push(a);}}function Re(e,t){var r=(t=this.options=function(e,t){for(var r in t)e[r]=t[r];return e}(Object.create(this.options),t)).debug;if(r&&console.time("preprocess data"),t.maxZoom<0||t.maxZoom>24)throw new Error("maxZoom should be in the 0-24 range");if(t.promoteId&&t.generateId)throw new Error("promoteId and generateId cannot be used together.");var i=function(e,t){var r=[];if("FeatureCollection"===e.type)for(var i=0;i<e.features.length;i++)Fe(r,e.features[i],t,i);else"Feature"===e.type?Fe(r,e,t):Fe(r,{geometry:e},t);return r}(e,t);this.tiles={},this.tileCoords=[],r&&(console.timeEnd("preprocess data"),console.log("index: maxZoom: %d, maxPoints: %d",t.indexMaxZoom,t.indexMaxPoints),console.time("generate tiles"),this.stats={},this.total=0),(i=function(e,t){var r=t.buffer/t.extent,i=e,n=Le(e,1,-1-r,r,0,-1,2,t),o=Le(e,1,1-r,2+r,0,-1,2,t);return (n||o)&&(i=Le(e,1,-r,1+r,0,-1,2,t)||[],n&&(i=Ae(n,1).concat(i)),o&&(i=i.concat(Ae(o,-1)))),i}(i,t)).length&&this.splitTile(i,0,0,0),r&&(i.length&&console.log("features: %d, points: %d",this.tiles[0].numFeatures,this.tiles[0].numPoints),console.timeEnd("generate tiles"),console.log("tiles generated:",this.total,JSON.stringify(this.stats)));}function We(e,t,r){return 32*((1<<e)*r+t)+e}function qe(e,t){var r=e.tileID.canonical;if(!this._geoJSONIndex)return t(null,null);var i=this._geoJSONIndex.getTile(r.z,r.x,r.y);if(!i)return t(null,null);var n=new k(i.features),o=R(n);0===o.byteOffset&&o.byteLength===o.buffer.byteLength||(o=new Uint8Array(o)),t(null,{vectorTile:n,rawData:o.buffer});}fe.prototype.load=function(e){var t=this.options,r=t.log,i=t.minZoom,n=t.maxZoom,o=t.nodeSize;r&&console.time("total time");var s="prepare "+e.length+" points";r&&console.time(s),this.points=e;for(var a=[],u=0;u<e.length;u++)e[u].geometry&&a.push(de(e[u],u));this.trees[n+1]=new he(a,xe,be,o,Float32Array),r&&console.timeEnd(s);for(var l=n;l>=i;l--){var h=+Date.now();a=this._cluster(a,l),this.trees[l]=new he(a,xe,be,o,Float32Array),r&&console.log("z%d: %d clusters in %dms",l,a.length,+Date.now()-h);}return r&&console.timeEnd("total time"),this},fe.prototype.getClusters=function(e,t){var r=((e[0]+180)%360+360)%360-180,i=Math.max(-90,Math.min(90,e[1])),n=180===e[2]?180:((e[2]+180)%360+360)%360-180,o=Math.max(-90,Math.min(90,e[3]));if(e[2]-e[0]>=360)r=-180,n=180;else if(r>n){var s=this.getClusters([r,i,180,o],t),a=this.getClusters([-180,i,n,o],t);return s.concat(a)}for(var u=this.trees[this._limitZoom(t)],l=[],h=0,c=u.range(ve(r),ye(o),ve(n),ye(i));h<c.length;h+=1){var f=c[h],p=u.points[f];l.push(p.numPoints?ge(p):this.points[p.index]);}return l},fe.prototype.getChildren=function(e){var t=e>>5,r=e%32,i="No cluster with the specified id.",n=this.trees[r];if(!n)throw new Error(i);var o=n.points[t];if(!o)throw new Error(i);for(var s=this.options.radius/(this.options.extent*Math.pow(2,r-1)),a=[],u=0,l=n.within(o.x,o.y,s);u<l.length;u+=1){var h=l[u],c=n.points[h];c.parentId===e&&a.push(c.numPoints?ge(c):this.points[c.index]);}if(0===a.length)throw new Error(i);return a},fe.prototype.getLeaves=function(e,t,r){t=t||10,r=r||0;var i=[];return this._appendLeaves(i,e,t,r,0),i},fe.prototype.getTile=function(e,t,r){var i=this.trees[this._limitZoom(e)],n=Math.pow(2,e),o=this.options,s=o.extent,a=o.radius/s,u=(r-a)/n,l=(r+1+a)/n,h={features:[]};return this._addTileFeatures(i.range((t-a)/n,u,(t+1+a)/n,l),i.points,t,r,n,h),0===t&&this._addTileFeatures(i.range(1-a/n,u,1,l),i.points,n,r,n,h),t===n-1&&this._addTileFeatures(i.range(0,u,a/n,l),i.points,-1,r,n,h),h.features.length?h:null},fe.prototype.getClusterExpansionZoom=function(e){for(var t=e%32-1;t<=this.options.maxZoom;){var r=this.getChildren(e);if(t++,1!==r.length)break;e=r[0].properties.cluster_id;}return t},fe.prototype._appendLeaves=function(e,t,r,i,n){for(var o=0,s=this.getChildren(t);o<s.length;o+=1){var a=s[o],u=a.properties;if(u&&u.cluster?n+u.point_count<=i?n+=u.point_count:n=this._appendLeaves(e,u.cluster_id,r,i,n):n<i?n++:e.push(a),e.length===r)break}return n},fe.prototype._addTileFeatures=function(e,t,r,i,n,o){for(var s=0,a=e;s<a.length;s+=1){var u=t[a[s]],l={type:1,geometry:[[Math.round(this.options.extent*(u.x*n-r)),Math.round(this.options.extent*(u.y*n-i))]],tags:u.numPoints?me(u):this.points[u.index].properties},h=u.numPoints?u.id:this.points[u.index].id;void 0!==h&&(l.id=h),o.features.push(l);}},fe.prototype._limitZoom=function(e){return Math.max(this.options.minZoom,Math.min(e,this.options.maxZoom+1))},fe.prototype._cluster=function(e,t){for(var r=[],i=this.options,n=i.radius,o=i.extent,s=i.reduce,a=n/(o*Math.pow(2,t)),u=0;u<e.length;u++){var l=e[u];if(!(l.zoom<=t)){l.zoom=t;for(var h=this.trees[t+1],c=h.within(l.x,l.y,a),f=l.numPoints||1,p=l.x*f,d=l.y*f,g=s&&f>1?this._map(l,!0):null,m=(u<<5)+(t+1),v=0,y=c;v<y.length;v+=1){var w=y[v],x=h.points[w];if(!(x.zoom<=t)){x.zoom=t;var b=x.numPoints||1;p+=x.x*b,d+=x.y*b,f+=b,x.parentId=m,s&&(g||(g=this._map(l,!0)),s(g,this._map(x)));}}1===f?r.push(l):(l.parentId=m,r.push(pe(p/f,d/f,m,f,g)));}}return r},fe.prototype._map=function(e,t){if(e.numPoints)return t?we({},e.properties):e.properties;var r=this.points[e.index].properties,i=this.options.map(r);return t&&i===r?we({},i):i},Re.prototype.options={maxZoom:14,indexMaxZoom:5,indexMaxPoints:1e5,tolerance:3,extent:4096,buffer:64,lineMetrics:!1,promoteId:null,generateId:!1,debug:0},Re.prototype.splitTile=function(e,t,r,i,n,o,s){for(var a=[e,t,r,i],u=this.options,l=u.debug;a.length;){i=a.pop(),r=a.pop(),t=a.pop(),e=a.pop();var h=1<<t,c=We(t,r,i),f=this.tiles[c];if(!f&&(l>1&&console.time("creation"),f=this.tiles[c]=je(e,t,r,i,u),this.tileCoords.push({z:t,x:r,y:i}),l)){l>1&&(console.log("tile z%d-%d-%d (features: %d, points: %d, simplified: %d)",t,r,i,f.numFeatures,f.numPoints,f.numSimplified),console.timeEnd("creation"));var p="z"+t;this.stats[p]=(this.stats[p]||0)+1,this.total++;}if(f.source=e,n){if(t===u.maxZoom||t===n)continue;var d=1<<n-t;if(r!==Math.floor(o/d)||i!==Math.floor(s/d))continue}else if(t===u.indexMaxZoom||f.numPoints<=u.indexMaxPoints)continue;if(f.source=null,0!==e.length){l>1&&console.time("clipping");var g,m,v,y,w,x,b=.5*u.buffer/u.extent,S=.5-b,M=.5+b,k=1+b;g=m=v=y=null,w=Le(e,h,r-b,r+M,0,f.minX,f.maxX,u),x=Le(e,h,r+S,r+k,0,f.minX,f.maxX,u),e=null,w&&(g=Le(w,h,i-b,i+M,1,f.minY,f.maxY,u),m=Le(w,h,i+S,i+k,1,f.minY,f.maxY,u),w=null),x&&(v=Le(x,h,i-b,i+M,1,f.minY,f.maxY,u),y=Le(x,h,i+S,i+k,1,f.minY,f.maxY,u),x=null),l>1&&console.timeEnd("clipping"),a.push(g||[],t+1,2*r,2*i),a.push(m||[],t+1,2*r,2*i+1),a.push(v||[],t+1,2*r+1,2*i),a.push(y||[],t+1,2*r+1,2*i+1);}}},Re.prototype.getTile=function(e,t,r){var i=this.options,n=i.extent,o=i.debug;if(e<0||e>24)return null;var s=1<<e,a=We(e,t=(t%s+s)%s,r);if(this.tiles[a])return Ge(this.tiles[a],n);o>1&&console.log("drilling down to z%d-%d-%d",e,t,r);for(var u,l=e,h=t,c=r;!u&&l>0;)l--,h=Math.floor(h/2),c=Math.floor(c/2),u=this.tiles[We(l,h,c)];return u&&u.source?(o>1&&console.log("found parent tile z%d-%d-%d",l,h,c),o>1&&console.time("drilling down"),this.splitTile(u.source,l,h,c,e,t,r),o>1&&console.timeEnd("drilling down"),this.tiles[a]?Ge(this.tiles[a],n):null):null};var Ue=function(t){function r(e,r,i,n){t.call(this,e,r,i,qe),n&&(this.loadGeoJSON=n);}return t&&(r.__proto__=t),r.prototype=Object.create(t&&t.prototype),r.prototype.constructor=r,r.prototype.loadData=function(e,t){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),this._pendingCallback=t,this._pendingLoadDataParams=e,this._state&&"Idle"!==this._state?this._state="NeedsLoadData":(this._state="Coalescing",this._loadData());},r.prototype._loadData=function(){var t=this;if(this._pendingCallback&&this._pendingLoadDataParams){var r=this._pendingCallback,i=this._pendingLoadDataParams;delete this._pendingCallback,delete this._pendingLoadDataParams;var n=!!(i&&i.request&&i.request.collectResourceTiming)&&new u.Performance(i.request);this.loadGeoJSON(i,(function(o,s){if(o||!s)return r(o);if("object"!=typeof s)return r(new Error("Input data given to '"+i.source+"' is not a valid GeoJSON object."));y(s,!0);try{t._geoJSONIndex=i.cluster?new fe(function(t){var r=t.superclusterOptions,i=t.clusterProperties;if(!i||!r)return r;for(var n={},o={},s={accumulated:null,zoom:0},a={properties:null},u=Object.keys(i),l=0,h=u;l<h.length;l+=1){var c=h[l],f=i[c],p=f[0],d=f[1],g=e.createExpression(d),m=e.createExpression("string"==typeof p?[p,["accumulated"],["get",c]]:p);n[c]=g.value,o[c]=m.value;}return r.map=function(e){a.properties=e;for(var t={},r=0,i=u;r<i.length;r+=1){var o=i[r];t[o]=n[o].evaluate(s,a);}return t},r.reduce=function(e,t){a.properties=t;for(var r=0,i=u;r<i.length;r+=1){var n=i[r];s.accumulated=e[n],e[n]=o[n].evaluate(s,a);}},r}(i)).load(s.features):function(e,t){return new Re(e,t)}(s,i.geojsonVtOptions);}catch(o){return r(o)}t.loaded={};var a={};if(n){var u=n.finish();u&&(a.resourceTiming={},a.resourceTiming[i.source]=JSON.parse(JSON.stringify(u)));}r(null,a);}));}},r.prototype.coalesce=function(){"Coalescing"===this._state?this._state="Idle":"NeedsLoadData"===this._state&&(this._state="Coalescing",this._loadData());},r.prototype.reloadTile=function(e,r){var i=this.loaded,n=e.uid;return i&&i[n]?t.prototype.reloadTile.call(this,e,r):this.loadTile(e,r)},r.prototype.loadGeoJSON=function(t,r){if(t.request)e.getJSON(t.request,r);else{if("string"!=typeof t.data)return r(new Error("Input data given to '"+t.source+"' is not a valid GeoJSON object."));try{return r(null,JSON.parse(t.data))}catch(e){return r(new Error("Input data given to '"+t.source+"' is not a valid GeoJSON object."))}}},r.prototype.removeSource=function(e,t){this._pendingCallback&&this._pendingCallback(null,{abandoned:!0}),t();},r.prototype.getClusterExpansionZoom=function(e,t){t(null,this._geoJSONIndex.getClusterExpansionZoom(e.clusterId));},r.prototype.getClusterChildren=function(e,t){t(null,this._geoJSONIndex.getChildren(e.clusterId));},r.prototype.getClusterLeaves=function(e,t){t(null,this._geoJSONIndex.getLeaves(e.clusterId,e.limit,e.offset));},r}(c);var $e=function(t){var r=this;this.self=t,this.actor=new e.Actor(t,this),this.layerIndexes={},this.availableImages={},this.workerSourceTypes={vector:c,geojson:Ue},this.workerSources={},this.demWorkerSources={},this.self.registerWorkerSource=function(e,t){if(r.workerSourceTypes[e])throw new Error('Worker source with name "'+e+'" already registered.');r.workerSourceTypes[e]=t;},this.self.registerRTLTextPlugin=function(t){if(e.plugin.isLoaded())throw new Error("RTL text plugin already registered.");e.plugin.applyArabicShaping=t.applyArabicShaping,e.plugin.processBidirectionalText=t.processBidirectionalText,e.plugin.processStyledBidirectionalText=t.processStyledBidirectionalText;};};return $e.prototype.setReferrer=function(e,t){this.referrer=t;},$e.prototype.setImages=function(e,t,r){this.availableImages[e]=t,r();},$e.prototype.setLayers=function(e,t,r){this.getLayerIndex(e).replace(t),r();},$e.prototype.updateLayers=function(e,t,r){this.getLayerIndex(e).update(t.layers,t.removedIds),r();},$e.prototype.loadTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).loadTile(t,r);},$e.prototype.loadDEMTile=function(e,t,r){this.getDEMWorkerSource(e,t.source).loadTile(t,r);},$e.prototype.reloadTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).reloadTile(t,r);},$e.prototype.abortTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).abortTile(t,r);},$e.prototype.removeTile=function(e,t,r){this.getWorkerSource(e,t.type,t.source).removeTile(t,r);},$e.prototype.removeDEMTile=function(e,t){this.getDEMWorkerSource(e,t.source).removeTile(t);},$e.prototype.removeSource=function(e,t,r){if(this.workerSources[e]&&this.workerSources[e][t.type]&&this.workerSources[e][t.type][t.source]){var i=this.workerSources[e][t.type][t.source];delete this.workerSources[e][t.type][t.source],void 0!==i.removeSource?i.removeSource(t,r):r();}},$e.prototype.loadWorkerSource=function(e,t,r){try{this.self.importScripts(t.url),r();}catch(e){r(e.toString());}},$e.prototype.loadRTLTextPlugin=function(t,r,i){try{e.plugin.isLoaded()||(this.self.importScripts(r),i(e.plugin.isLoaded()?null:new Error("RTL Text Plugin failed to import scripts from "+r)));}catch(e){i(e.toString());}},$e.prototype.getAvailableImages=function(e){var t=this.availableImages[e];return t||(t=[]),t},$e.prototype.getLayerIndex=function(e){var t=this.layerIndexes[e];return t||(t=this.layerIndexes[e]=new i),t},$e.prototype.getWorkerSource=function(e,t,r){var i=this;if(this.workerSources[e]||(this.workerSources[e]={}),this.workerSources[e][t]||(this.workerSources[e][t]={}),!this.workerSources[e][t][r]){var n={send:function(t,r,n){i.actor.send(t,r,n,e);}};this.workerSources[e][t][r]=new this.workerSourceTypes[t](n,this.getLayerIndex(e),this.getAvailableImages(e));}return this.workerSources[e][t][r]},$e.prototype.getDEMWorkerSource=function(e,t){return this.demWorkerSources[e]||(this.demWorkerSources[e]={}),this.demWorkerSources[e][t]||(this.demWorkerSources[e][t]=new f),this.demWorkerSources[e][t]},$e.prototype.enforceCacheSizeLimit=function(t,r){e.enforceCacheSizeLimit(r);},"undefined"!=typeof WorkerGlobalScope&&void 0!==e.window&&e.window instanceof WorkerGlobalScope&&(e.window.worker=new $e(e.window)),$e}));


//

return mapboxgl;

}));
//# sourceMappingURL=mapbox-gl.js.map


/***/ }),

/***/ "./node_modules/nanoid/index.browser.js":
/*!**********************************************!*\
  !*** ./node_modules/nanoid/index.browser.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

if (true) {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    throw new Error(
      'React Native does not have a built-in secure random generator. ' +
      'If you don’t need unpredictable IDs, you can use `nanoid/non-secure`. ' +
      'For secure ID install `expo-random` locally and use `nanoid/async`.'
    )
  }
  if (typeof self === 'undefined' || (!self.crypto && !self.msCrypto)) {
    throw new Error(
      'Your browser does not have secure random generator. ' +
      'If you don’t need unpredictable IDs, you can use nanoid/non-secure.'
    )
  }
}

var crypto = self.crypto || self.msCrypto

/*
 * This alphabet uses a-z A-Z 0-9 _- symbols.
 * Symbols order was changed for better gzip compression.
 */
var url = 'Uint8ArdomValuesObj012345679BCDEFGHIJKLMNPQRSTWXYZ_cfghkpqvwxyz-'

module.exports = function (size) {
  size = size || 21
  var id = ''
  var bytes = crypto.getRandomValues(new Uint8Array(size))
  while (size--) {
    id += url[bytes[size] & 63]
  }
  return id
}


/***/ }),

/***/ "./node_modules/subtag/subtag.js":
/*!***************************************!*\
  !*** ./node_modules/subtag/subtag.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

!function(root, name, make) {
  if ( true && module.exports) module.exports = make()
  else root[name] = make()
}(this, 'subtag', function() {

  var empty = ''
  var pattern = /^([a-zA-Z]{2,3})(?:[_-]+([a-zA-Z]{3})(?=$|[_-]+))?(?:[_-]+([a-zA-Z]{4})(?=$|[_-]+))?(?:[_-]+([a-zA-Z]{2}|[0-9]{3})(?=$|[_-]+))?/

  function match(tag) {
    return tag.match(pattern) || []
  }

  function split(tag) {
    return match(tag).filter(function(v, i) { return v && i })
  }

  function api(tag) {
    tag = match(tag)
    return {
      language: tag[1] || empty,
      extlang: tag[2] || empty,
      script: tag[3] || empty,
      region: tag[4] || empty
    }
  }

  function expose(target, key, value) {
    Object.defineProperty(target, key, {
      value: value,
      enumerable: true
    })
  }

  function part(position, pattern, type) {
    function method(tag) {
      return match(tag)[position] || empty
    }
    expose(method, 'pattern', pattern)
    expose(api, type, method)
  }

  part(1, /^[a-zA-Z]{2,3}$/, 'language')
  part(2, /^[a-zA-Z]{3}$/, 'extlang')
  part(3, /^[a-zA-Z]{4}$/, 'script')
  part(4, /^[a-zA-Z]{2}$|^[0-9]{3}$/, 'region')

  expose(api, 'split', split)

  return api
});


/***/ }),

/***/ "./node_modules/suggestions/index.js":
/*!*******************************************!*\
  !*** ./node_modules/suggestions/index.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * A typeahead component for inputs
 * @class Suggestions
 *
 * @param {HTMLInputElement} el A valid HTML input element
 * @param {Array} data An array of data used for results
 * @param {Object} options
 * @param {Number} [options.limit=5] Max number of results to display in the auto suggest list.
 * @param {Number} [options.minLength=2] Number of characters typed into an input to trigger suggestions.
 * @param {Boolean} [options.hideOnBlur=true] If `true`, hides the suggestions when focus is lost.
 * @return {Suggestions} `this`
 * @example
 * // in the browser
 * var input = document.querySelector('input');
 * var data = [
 *   'Roy Eldridge',
 *   'Roy Hargrove',
 *   'Rex Stewart'
 * ];
 *
 * new Suggestions(input, data);
 *
 * // with options
 * var input = document.querySelector('input');
 * var data = [{
 *   name: 'Roy Eldridge',
 *   year: 1911
 * }, {
 *   name: 'Roy Hargrove',
 *   year: 1969
 * }, {
 *   name: 'Rex Stewart',
 *   year: 1907
 * }];
 *
 * var typeahead = new Suggestions(input, data, {
 *   filter: false, // Disable filtering
 *   minLength: 3, // Number of characters typed into an input to trigger suggestions.
 *   limit: 3, //  Max number of results to display.
 *   hideOnBlur: false // Don't hide results when input loses focus
 * });
 *
 * // As we're passing an object of an arrays as data, override
 * // `getItemValue` by specifying the specific property to search on.
 * typeahead.getItemValue = function(item) { return item.name };
 *
 * input.addEventListener('change', function() {
 *   console.log(typeahead.selected); // Current selected item.
 * });
 *
 * // With browserify
 * var Suggestions = require('suggestions');
 *
 * new Suggestions(input, data);
 */
var Suggestions = __webpack_require__(/*! ./src/suggestions */ "./node_modules/suggestions/src/suggestions.js");
window.Suggestions = module.exports = Suggestions;


/***/ }),

/***/ "./node_modules/suggestions/src/list.js":
/*!**********************************************!*\
  !*** ./node_modules/suggestions/src/list.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var List = function(component) {
  this.component = component;
  this.items = [];
  this.active = 0;
  this.wrapper = document.createElement('div');
  this.wrapper.className = 'suggestions-wrapper';
  this.element = document.createElement('ul');
  this.element.className = 'suggestions';
  this.wrapper.appendChild(this.element);

  // selectingListItem is set to true in the time between the mousedown and mouseup when clicking an item in the list
  // mousedown on a list item will cause the input to blur which normally hides the list, so this flag is used to keep
  // the list open until the mouseup
  this.selectingListItem = false;

  component.el.parentNode.insertBefore(this.wrapper, component.el.nextSibling);
  return this;
};

List.prototype.show = function() {
  this.element.style.display = 'block';
};

List.prototype.hide = function() {
  this.element.style.display = 'none';
};

List.prototype.add = function(item) {
  this.items.push(item);
};

List.prototype.clear = function() {
  this.items = [];
  this.active = 0;
};

List.prototype.isEmpty = function() {
  return !this.items.length;
};

List.prototype.isVisible = function() {
  return this.element.style.display === 'block';
};

List.prototype.draw = function() {
  this.element.innerHTML = '';

  if (this.items.length === 0) {
    this.hide();
    return;
  }

  for (var i = 0; i < this.items.length; i++) {
    this.drawItem(this.items[i], this.active === i);
  }

  this.show();
};

List.prototype.drawItem = function(item, active) {
  var li = document.createElement('li'),
    a = document.createElement('a');

  if (active) li.className += ' active';

  a.innerHTML = item.string;

  li.appendChild(a);
  this.element.appendChild(li);

  li.addEventListener('mousedown', function() {
    this.selectingListItem = true;
  }.bind(this));

  li.addEventListener('mouseup', function() {
    this.handleMouseUp.call(this, item);
  }.bind(this));
};

List.prototype.handleMouseUp = function(item) {
  this.selectingListItem = false;
  this.component.value(item.original);
  this.clear();
  this.draw();
};

List.prototype.move = function(index) {
  this.active = index;
  this.draw();
};

List.prototype.previous = function() {
  this.move(this.active === 0 ? this.items.length - 1 : this.active - 1);
};

List.prototype.next = function() {
  this.move(this.active === this.items.length - 1 ? 0 : this.active + 1);
};

List.prototype.drawError = function(msg){
  var li = document.createElement('li');

  li.innerHTML = msg;

  this.element.appendChild(li);
  this.show();
}

module.exports = List;


/***/ }),

/***/ "./node_modules/suggestions/src/suggestions.js":
/*!*****************************************************!*\
  !*** ./node_modules/suggestions/src/suggestions.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var extend = __webpack_require__(/*! xtend */ "./node_modules/xtend/immutable.js");
var fuzzy = __webpack_require__(/*! fuzzy */ "./node_modules/fuzzy/lib/fuzzy.js");
var List = __webpack_require__(/*! ./list */ "./node_modules/suggestions/src/list.js");

var Suggestions = function(el, data, options) {
  options = options || {};

  this.options = extend({
    minLength: 2,
    limit: 5,
    filter: true,
    hideOnBlur: true
  }, options);

  this.el = el;
  this.data = data || [];
  this.list = new List(this);

  this.query = '';
  this.selected = null;

  this.list.draw();

  this.el.addEventListener('keyup', function(e) {
    this.handleKeyUp(e.keyCode);
  }.bind(this), false);

  this.el.addEventListener('keydown', function(e) {
    this.handleKeyDown(e);
  }.bind(this));

  this.el.addEventListener('focus', function() {
    this.handleFocus();
  }.bind(this));

  this.el.addEventListener('blur', function() {
    this.handleBlur();
  }.bind(this));

  this.el.addEventListener('paste', function(e) {
    this.handlePaste(e);
  }.bind(this));

  // use user-provided render function if given, otherwise just use the default
  this.render = (this.options.render) ? this.options.render.bind(this) : this.render.bind(this)

  this.getItemValue = (this.options.getItemValue) ? this.options.getItemValue.bind(this) : this.getItemValue.bind(this);

  return this;
};

Suggestions.prototype.handleKeyUp = function(keyCode) {
  // 40 - DOWN
  // 38 - UP
  // 27 - ESC
  // 13 - ENTER
  // 9 - TAB

  if (keyCode === 40 ||
      keyCode === 38 ||
      keyCode === 27 ||
      keyCode === 13 ||
      keyCode === 9) return;

  this.handleInputChange(this.el.value);
};

Suggestions.prototype.handleKeyDown = function(e) {
  switch (e.keyCode) {
    case 13: // ENTER
    case 9: // TAB
      if (!this.list.isEmpty()) {
        if (this.list.isVisible()) {
          e.preventDefault();
        }
        this.value(this.list.items[this.list.active].original);
        this.list.hide();
      }
    break;
    case 27: // ESC
      if (!this.list.isEmpty()) this.list.hide();
    break;
    case 38: // UP
      this.list.previous();
    break;
    case 40: // DOWN
      this.list.next();
    break;
  }
};

Suggestions.prototype.handleBlur = function() {
  if (!this.list.selectingListItem && this.options.hideOnBlur) {
    this.list.hide();
  }
};

Suggestions.prototype.handlePaste = function(e) {
  if (e.clipboardData) {
    this.handleInputChange(e.clipboardData.getData('Text'));
  } else {
    var self = this;
    setTimeout(function () {
      self.handleInputChange(e.target.value);
    }, 100);
  }
};

Suggestions.prototype.handleInputChange = function(query) {
  this.query = this.normalize(query);

  this.list.clear();

  if (this.query.length < this.options.minLength) {
    this.list.draw();
    return;
  }

  this.getCandidates(function(data) {
    for (var i = 0; i < data.length; i++) {
      this.list.add(data[i]);
      if (i === (this.options.limit - 1)) break;
    }
    this.list.draw();
  }.bind(this));
};

Suggestions.prototype.handleFocus = function() {
  if (!this.list.isEmpty()) this.list.show();
  this.list.selectingListItem = false;
};

/**
 * Update data previously passed
 *
 * @param {Array} revisedData
 */
Suggestions.prototype.update = function(revisedData) {
  this.data = revisedData;
  this.handleKeyUp();
};

/**
 * Clears data
 */
Suggestions.prototype.clear = function() {
  this.data = [];
  this.list.clear();
};

/**
 * Normalize the results list and input value for matching
 *
 * @param {String} value
 * @return {String}
 */
Suggestions.prototype.normalize = function(value) {
  value = value.toLowerCase();
  return value;
};

/**
 * Evaluates whether an array item qualifies as a match with the current query
 *
 * @param {String} candidate a possible item from the array passed
 * @param {String} query the current query
 * @return {Boolean}
 */
Suggestions.prototype.match = function(candidate, query) {
  return candidate.indexOf(query) > -1;
};

Suggestions.prototype.value = function(value) {
  this.selected = value;
  this.el.value = this.getItemValue(value);

  if (document.createEvent) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent('change', true, false);
    this.el.dispatchEvent(e);
  } else {
    this.el.fireEvent('onchange');
  }
};

Suggestions.prototype.getCandidates = function(callback) {
  var options = {
    pre: '<strong>',
    post: '</strong>',
    extract: function(d) { return this.getItemValue(d); }.bind(this)
  };
  var results;
  if(this.options.filter){
    results = fuzzy.filter(this.query, this.data, options);

    results = results.map(function(item){
      return {
        original: item.original,
        string: this.render(item.original, item.string)
      };
    }.bind(this))
  }else{
    results = this.data.map(function(d) {
      var renderedString = this.render(d);
      return {
        original: d,
        string: renderedString
      };
    }.bind(this));
  }
  callback(results);
};

/**
 * For a given item in the data array, return what should be used as the candidate string
 *
 * @param {Object|String} item an item from the data array
 * @return {String} item
 */
Suggestions.prototype.getItemValue = function(item) {
  return item;
};

/**
 * For a given item in the data array, return a string of html that should be rendered in the dropdown
 * @param {Object|String} item an item from the data array
 * @param {String} sourceFormatting a string that has pre-formatted html that should be passed directly through the render function 
 * @return {String} html
 */
Suggestions.prototype.render = function(item, sourceFormatting) {
  if (sourceFormatting){
    // use existing formatting on the source string
    return sourceFormatting;
  }
  var boldString = (item.original) ? this.getItemValue(item.original) : this.getItemValue(item);
  var indexString = this.normalize(boldString);
  var indexOfQuery = indexString.lastIndexOf(this.query);
  while (indexOfQuery > -1) {
    var endIndexOfQuery = indexOfQuery + this.query.length;
    boldString = boldString.slice(0, indexOfQuery) + '<strong>' + boldString.slice(indexOfQuery, endIndexOfQuery) + '</strong>' + boldString.slice(endIndexOfQuery);
    indexOfQuery = indexString.slice(0, indexOfQuery).lastIndexOf(this.query);
  }
  return boldString
}

/**
 * Render an custom error message in the suggestions list
 * @param {String} msg An html string to render as an error message
 */
Suggestions.prototype.renderError = function(msg){
  this.list.drawError(msg);
}

module.exports = Suggestions;


/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./node_modules/xtend/immutable.js":
/*!*****************************************!*\
  !*** ./node_modules/xtend/immutable.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}


/***/ }),

/***/ "./src/trip.js":
/*!*********************!*\
  !*** ./src/trip.js ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mapbox-gl */ "./node_modules/mapbox-gl/dist/mapbox-gl.js");
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mapbox_gl__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mapbox_mapbox_gl_geocoder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @mapbox/mapbox-gl-geocoder */ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/index.js");
/* harmony import */ var _mapbox_mapbox_gl_geocoder__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mapbox_mapbox_gl_geocoder__WEBPACK_IMPORTED_MODULE_1__);
/*
 * @author Florian Herborn
 * @copyright 2019 Herborn Software
 * @license GPL-2.0-or-later
 *
 * @package kar
 */
var $ = __webpack_require__(/*! jquery */ "./node_modules/jquery/dist/jquery.js");

__webpack_require__(/*! mapbox-gl */ "./node_modules/mapbox-gl/dist/mapbox-gl.js");

__webpack_require__(/*! @mapbox/mapbox-gl-geocoder */ "./node_modules/@mapbox/mapbox-gl-geocoder/lib/index.js");




function registerTripDetail() {
  if (!$('#milestone_map').length) return;

  function update_url_milestone(milestone_id) {
    var url = new URL(window.location.href);
    var search_params = new URLSearchParams(url.search);
    search_params.set('milestone', milestone_id);
    url.search = search_params.toString();
    history.pushState(null, document.title, url.toString());
  }

  function getQueryMilestoneId() {
    var url = new URL(window.location.href);
    var search_params = new URLSearchParams(url.search);
    return search_params.get('milestone');
  }

  function getGeojson(container) {
    return {
      "type": "FeatureCollection",
      "features": $(container).find('.milestone-meta').toArray().map(function (milestoneMeta) {
        var meta = $(milestoneMeta);
        return {
          "type": "Feature",
          "properties": {
            "id": meta.data('id'),
            "elementId": meta.attr('id'),
            "img": meta.data('img'),
            "date": meta.data('date'),
            'locationName': meta.data('location-name')
          },
          "geometry": {
            "type": "Point",
            "coordinates": [meta.data('location-lat'), meta.data('location-lon')]
          }
        };
      })
    };
  }

  function initializeMap(initCoords) {
    return new mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.Map({
      container: 'milestone_map',
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: initCoords,
      zoom: 12,
      minZoom: 1,
      maxZoom: 20,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });
  }

  function isMilestoneVisible(elem, container) {
    var containerLeft = container.offset().left;
    var containerRight = containerLeft + container.width();
    var elementLeft = $(elem).offset().left;
    var elementRight = elementLeft + $(elem).width();
    var buffer = 20;
    return elementRight - buffer <= containerRight && elementLeft + buffer >= containerLeft;
  } // function scrollToMilestone(id) {
  //     const container = $('#milestone_container');
  //     const target = $('#milestone-meta-' + id);
  //     const offset = container.scrollLeft() + (target.offset().left - container.offset().left);
  //     container.stop().animate({'scrollLeft': offset}, 900, 'swing');
  // }


  function scrollToMilestone(id) {
    var mapHeight = $('#milestone_map').height();
    var padding = 40;
    console.log(padding);
    var target = $('#milestone-meta-' + id);
    $('html, body').animate({
      scrollTop: $(target).offset().top - mapHeight - padding
    }, 900, 'swing');
  }

  function featureToMarker(feature) {
    var el = document.createElement('div');
    el.className = 'marker';
    el.id = 'marker-' + feature.properties.id;
    el.style.backgroundImage = 'url("' + feature.properties.img + '")';
    el.addEventListener('click', function (e) {
      e.preventDefault();
      scrollToMilestone(feature.properties.id);
    }.bind(feature));
    return el;
  }

  function setActiveMarker(milestone_id, lat, lon, map) {
    $('.marker').each(function () {
      $(this).removeClass('active');
    });
    $('#marker-' + milestone_id).addClass('active');
    map.flyTo({
      center: [lat, lon],
      zoom: 12,
      bearing: 0,
      speed: 1.5,
      // make the flying slow
      curve: 2,
      // change the speed at which it zooms out
      easing: function easing(t) {
        return t;
      }
    });
  }

  function addRouteLayer(map, lineCoords, markerColor) {
    map.addLayer({
      "id": "route",
      "type": "line",
      "source": {
        "type": "geojson",
        "data": {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "LineString",
            "coordinates": lineCoords
          }
        }
      },
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": markerColor,
        "line-width": 2
      }
    });
  }

  function addBuildingLayer(map) {
    var layers = map.getStyle().layers;
    var labelLayerId;

    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
        labelLayerId = layers[i].id;
        break;
      }
    }

    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
        'fill-extrusion-base': ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
        'fill-extrusion-opacity': .6
      }
    }, labelLayerId);
  }

  $.fn.isInViewport = function () {
    var mapHeight = $('#milestone_map').height();
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();
    var viewportTop = $(window).scrollTop() + mapHeight;
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  $('#milestones', function () {
    var milestonesWrapper = $(this);
    var milestoneContainer = $('#milestone_container');
    var geojson = getGeojson(milestoneContainer);
    var initCoords = geojson.features.length ? geojson.features[0].geometry.coordinates : [-63.29223632812499, -18.28151823530889];
    mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.accessToken = framework.mapbox_api_key;
    var map = initializeMap(initCoords);
    var bounds = new mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.LngLatBounds();
    var lineCoords = [];
    geojson.features.forEach(function (feature) {
      bounds.extend(feature.geometry.coordinates);
      lineCoords.push(feature.geometry.coordinates);
      new mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.Marker(featureToMarker(feature)).setLngLat(feature.geometry.coordinates).addTo(map);
    });
    var markerColor = $('.marker').css('border-color');
    map.fitBounds(bounds, {
      padding: 50
    });
    map.on('load', function () {
      addRouteLayer(map, lineCoords, markerColor);
      addBuildingLayer(map);
    });
    var adminHeight = $('#wpadminbar').length ? $('#wpadminbar').height() : 0;
    var last = null;
    $(window).on('scroll', function () {
      var scrollTop = $(document).scrollTop();
      $('.milestone-map-container').each(function () {
        var container = $(this);

        if (container.offset().top < scrollTop + adminHeight) {
          var _map = $(container.find('#milestone_map'));

          _map.addClass('map-fixed');

          _map.width(container.width()); //map.height(container.height());

        } else {
          container.find('#milestone_map').removeClass('map-fixed');
        }
      });
    });
    $(window).on('scroll', function () {
      var metas = $('.milestone-meta').toArray();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = metas[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var meta = _step.value;

          if ($(meta).isInViewport()) {
            if (last === meta) return;
            last = meta;
            var metaEl = $(meta);
            var milestoneId = metaEl.data('id');
            var lat = metaEl.data('locationLat');
            var lon = metaEl.data('locationLon');
            setActiveMarker(milestoneId, lat, lon, map);
            update_url_milestone(milestoneId);
            return;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }); // milestoneContainer.on('scroll', function () {
    //     const metas = $(this).find('.milestone-meta').toArray();
    //     for (let meta of metas) {
    //         if (isMilestoneVisible(meta, milestoneContainer)) {
    //             if (last === meta) return;
    //             last = meta;
    //             const metaEl = $(meta);
    //             const milestoneId = metaEl.data('id');
    //             const lat = metaEl.data('locationLat');
    //             const lon = metaEl.data('locationLon');
    //             setActiveMarker(milestoneId, lat, lon, map);
    //             update_url_milestone(milestoneId);
    //             return;
    //         }
    //     }
    // });

    milestonesWrapper.find('#show_all_btn').on('click', function (e) {
      e.preventDefault();
      last = null;
      map.fitBounds(bounds, {
        padding: 50
      });
    });
    var query_milestone = getQueryMilestoneId();

    if (query_milestone) {
      scrollToMilestone(query_milestone);
    }
  });
}

function registerAdminMilestone() {
  if (!$('#milestone_settings').length) return;
  $('#milestone_settings', function () {
    var form = $(this);
    var location_name_field = form.find('#kar_travel_milestone_location_name');
    var location_lat_field = form.find('#kar_travel_milestone_location_lat');
    var location_lon_field = form.find('#kar_travel_milestone_location_lon');
    var search_input = form.find('.mapboxgl-ctrl-geocoder--input');
    var inital_lat = location_lat_field.val();
    var inital_lon = location_lon_field.val();
    var inital_name = location_name_field.val();

    if (!inital_lat) {
      inital_lat = 52.520008;
    }

    if (!inital_lon) {
      inital_lon = 13.404954;
    }

    mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.accessToken = framework.mapbox_api_key;
    var map = new mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [inital_lat, inital_lon],
      zoom: 12,
      minZoom: 1,
      maxZoom: 15,
      interactive: false,
      attributionControl: false
    });
    var geocoder = new _mapbox_mapbox_gl_geocoder__WEBPACK_IMPORTED_MODULE_1___default.a({
      accessToken: mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.accessToken,
      language: 'de-DE',
      mapboxgl: mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a
    });
    var initalMarker = new mapbox_gl__WEBPACK_IMPORTED_MODULE_0___default.a.Marker().setLngLat([inital_lat, inital_lon]).addTo(map);
    form.find('#geocoder').append(geocoder.onAdd(map));
    geocoder.on('result', function (e) {
      initalMarker.remove();
      var result = e.result;
      var coords = result.center;
      var name = result.place_name;
      location_lat_field.val(coords[0]);
      location_lon_field.val(coords[1]);
      location_name_field.val(name);
    });
  });
}

$(document).ready(function ($) {
  'use strict';

  registerTripDetail();
  registerAdminMilestone();
});

/***/ }),

/***/ 2:
/*!***************************!*\
  !*** multi ./src/trip.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/florianherborn/docker/wordpress/wp/wp-content/themes/kar-theme/src/trip.js */"./src/trip.js");


/***/ })

/******/ });