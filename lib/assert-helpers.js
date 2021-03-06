'use strict';

// Import

function _typeof(obj) {
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}

var util = require('util');
var assert = require('assert');
var colors = require('ansicolors');
var diffUtil = require('diff');

/**
Alias for setTimeout with paramaters reversed
@private
@static
@method wait
@param {Number} delay Delay to send to setTimeout
@param {Function} fn Function to send to setTimeout
@return {Object} result of the setTimeout call
*/
function wait(delay, fn) {
    return setTimeout(fn, delay);
}

/**
Whether or not stdout and stderr are interactive
@private
@static
@method isTTY
@return {Boolean} Yes they are, or no they aren't.
*/
function isTTY() {
    return process.stdout && process.stdout.isTTY === true && process.stderr && process.stderr.isTTY === true;
}

/**
Return a stringified version of the value with indentation and colors where applicable
@static
@method inspect
@param {Mixed} value The value to inspect
@param {Object} [opts={}] The options to pass to util.inspect
@return {String} The inspected string of the value
*/
function inspect(value) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    // If the terminal supports colours, and the user hasn't set anything, then default to a sensible default
    if (isTTY() && opts.colors == null) {
        opts.colors = process.argv.indexOf('--no-colors') === -1;
    }

    // If the terminal doesn't support colours, then over-write whatever the user set
    else {
        opts.colors = false;
    }

    // Inspect and return
    return util.inspect(value, opts);
}

/**
Return a highlighted string of a diff object
@static
@private
@method inspectDiff
@param {Object} diff The diff data to highlight
@return {String} The highlighted comparison
*/
function inspectDiff(diff) {
    var result = '';
    diff.forEach(function (part) {
        var value = part.value;
        if (part.added) {
            value = colors.open.black + colors.bgGreen(value) + colors.open.green;
        } else if (part.removed) {
            value = colors.open.black + colors.bgBrightRed(value) + colors.open.green;
        }
        result += value;
    });
    return colors.green(result);
}

/**
Return a highlighted comparison between the new data and the old data
@static
@method diffStrings
@param {Object} newData The new data
@param {Object} oldData The old data
@return {String} The highlighted comparison
*/
function diffStrings(newData, oldData) {
    var diff = diffUtil.diffChars(inspect(oldData, {
        colors: false
    }), inspect(newData, {
        colors: false
    }));
    return inspectDiff(diff);
}

/**
Return a highlighted comparison between the new data and the old data
@static
@method diffObjects
@param {Object} newData The new data
@param {Object} oldData The old data
@return {String} The highlighted comparison
*/
function diffObjects(newData, oldData) {
    var diff = diffUtil.diffJson(inspect(oldData, {
        colors: false
    }), inspect(newData, {
        colors: false
    }));
    return inspectDiff(diff);
}

/**
Log the inspected values of each of the arguments to stdout
@static
@method log
@param {Mixed} ...args The arguments to inspect and log
*/
function log() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var arg = _step.value;

            /* eslint no-console:0 */
            console.log(inspect(arg));
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}

var disableLogComparison = true;

/**
Output a comparison of the failed result to stderr
@private
@static
@method logComparison
@param {Mixed} actual The result data
@param {Mixed} expected The anticipated data
@param {Error|String} error The error instance or error message string to report
*/
function logComparison(actual, expected, error) {
    if (!disableLogComparison) {
        var lines = ['------------------------------------', 'Comparison Error:', colors.green(error.stack || error.message || error), ''];

        if (typeof actual === 'string' && typeof expected === 'string') {
            lines.push('Comparison Diff:', diffStrings(actual, expected), '');
        } else if ((typeof actual === 'undefined' ? 'undefined' : _typeof(actual)) === 'object' && (typeof expected === 'undefined' ? 'undefined' : _typeof(expected)) === 'object') {
            lines.push('Comparison Diff:', diffObjects(actual, expected), '');
        }

        lines.push('Comparison Actual:', inspect(actual), '', 'Comparison Expected:', inspect(expected), '------------------------------------');

        // Work for node
        if (process.stderr) {
            process.stderr.write(lines.join('\n') + '\n');
        }
        // Work for browsers
        else {
            console.log(lines.join('\n'));
        }
    }
}

/**
Same as assert.equal in that it performs a strict equals check, but if a failure occurs it will output detailed information
@static
@method equal
@param {Mixed} actual The result data
@param {Mixed} expected The anticipated data
@param {String} [testName] The name of the test
@throws {Error} If the comparison failed, the failure will be thrown
*/
function equal(actual, expected, testName) {
    try {
        assert.equal(actual, expected, testName);
    } catch (checkError) {
        logComparison(actual, expected, checkError);
        throw checkError;
    }
}

/**
Same as assert.deepEQual in that it performs a deep equals check, but if a failure occurs it will output detailed information
@static
@method deepEqual
@param {Mixed} actual The result data
@param {Mixed} expected The anticipated data
@param {String} [testName] The name of the test
@throws {Error} If the comparison failed, the failure will be thrown
*/
function deepEqual(actual, expected, testName) {
    try {
        assert.deepEqual(actual, expected, testName);
    } catch (checkError) {
        logComparison(actual, expected, checkError);
        throw checkError;
    }
}

/**
Checks to see if the actual result contains the expected result
@static
@method contains
@param {Mixed} actual The result data
@param {Mixed} expected The anticipated data
@param {String} [testName] The name of the test
@throws {Error} If the comparison failed, the failure will be thrown
*/
function contains(actual, expected, testName) {
    if (testName == null) testName = 'Expected `' + actual + '` to contain `' + expected + '`';
    assert.ok(actual.indexOf(expected) !== -1, testName);
}

/**
Checks to see if an error was as expected, if a failure occurs it will output detailed information
@static
@method errorEqual
@param {Error} actual The result error
@param {Error|String|Null} expected The anticipated error instance or message, can be null if you expect there to be no error
@param {String} [testName] The name of the test
@throws {Error} If the comparison failed, the failure will be thrown
*/
function errorEqual(actualError, expectedError, testName) {
    var expectedErrorMessage = undefined,
        actualErrorMessage = undefined;

    if (expectedError) {
        if (expectedError instanceof Error) {
            expectedErrorMessage = expectedError.message;
        } else {
            expectedErrorMessage = expectedError;
            expectedError = new Error(expectedErrorMessage);
        }
    }

    if (actualError) {
        if (actualError instanceof Error) {
            actualErrorMessage = actualError.message;
        } else {
            actualErrorMessage = actualError;
            actualError = new Error(actualErrorMessage);
        }
    }

    try {
        if (actualErrorMessage && expectedErrorMessage) {
            contains(actualErrorMessage, expectedErrorMessage, testName);
        } else {
            equal(actualError, expectedError || null, testName);
        }
    } catch (checkError) {
        logComparison(actualError && (actualError.stack || actualError.message || actualError), expectedErrorMessage, checkError);
        throw checkError;
    }
}

/**
Generate a callback that will return the specified result
@static
@method returnViaCallback
@param {Mixed} result The result that the callback should return
@return {Function} The callback that will return the specified result
*/
function returnViaCallback(result) {
    return function () {
        return result;
    };
}

/**
Generate a callback that will receive a completion callback and call it with the specified result after the specified delay
@static
@method completeViaCallback
@param {Mixed} result The result that the callback should pass to the completion callback
@param {Number} [delay=100] The delay in milliseconds that we should wait before calling the completion callback
@return {Function} The callback that will provide the specified result
*/
/* eslint no-magic-numbers:0 */
function completeViaCallback(result) {
    var delay = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];

    return function (complete) {
        wait(delay, function () {
            complete(null, result);
        });
    };
}

/**
Generate a callback that return an error instance with the specified message/error
@static
@method returnErrorViaCallback
@param {Error|String} [error='an error occured'] The error instance or message string that the callback will return
@return {Function} The callback that will return the specified result
*/
function returnErrorViaCallback() {
    var error = arguments.length <= 0 || arguments[0] === undefined ? 'an error occured' : arguments[0];

    return function () {
        if (error instanceof Error) {
            return error;
        } else {
            return new Error(error);
        }
    };
}

/**
Generate a callback that throw an error instance with the specified message/error
@static
@method throwErrorViaCallback
@param {Error|String} [error='an error occured']  The error instance or message string that the callback will throw
@return {Function} The callback that will throw the specified error
*/
function throwErrorViaCallback() {
    var error = arguments.length <= 0 || arguments[0] === undefined ? 'an error occured' : arguments[0];

    return function () {
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(error);
        }
    };
}

/**
Generate a callback that will check the arguments it received with the arguments specified, if a failure occurs it will output detailed information
@static
@method expectViaCallback
@param {Mixed} ...argsExpected The arguments that we expect the callback to receive when it is called
@return {Function} The callback that will check the arguments it receives for the expected arguments
*/
function expectViaCallback() {
    for (var _len2 = arguments.length, argsExpected = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        argsExpected[_key2] = arguments[_key2];
    }

    return function () {
        for (var _len3 = arguments.length, argsActual = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            argsActual[_key3] = arguments[_key3];
        }

        deepEqual(argsActual, argsExpected);
    };
}

/**
Generate a callback that will check the error (if any) it receives for the expected error (if any), if a failure occurs it will output detailed information
@static
@method expectErrorViaCallback
@param {Mixed} error The error instance or message string that we expected, passed as the second argument to errorEqual
@param {Function} [next] An optional completion callback to call with the result of the compairson, if not specified and a failure occurs, the error will be thrown
@return {Function} The callback that will check the error (if any) it receives for the expected error (if any)
*/
function expectErrorViaCallback(error, testName, next) {
    return function (inputError) {
        try {
            errorEqual(inputError, error);
        } catch (checkError) {
            if (next) {
                next(checkError);
                return;
            } else {
                throw checkError;
            }
        }
        if (next) next();
    };
}

/**
Expect the passed function to throw the passed error (if any)
@static
@method expectFunctionToThrow
@param {Function} fn The function that we will call and expect to throw the passed error
@param {Mixed} error The error instance or message string that we expected, passed as the second argument to errorEqual
@param {String} [testName] The name of the test
*/
function expectFunctionToThrow(fn, error, testName) {
    try {
        fn();
    } catch (checkError) {
        errorEqual(checkError, error, testName);
    }
}

// Export
module.exports = {
    isTTY: isTTY,
    inspect: inspect,
    log: log,
    logComparison: logComparison,
    diffStrings: diffStrings,
    diffObjects: diffObjects,
    equal: equal,
    deepEqual: deepEqual,
    contains: contains,
    errorEqual: errorEqual,
    returnViaCallback: returnViaCallback,
    completeViaCallback: completeViaCallback,
    returnErrorViaCallback: returnErrorViaCallback,
    throwErrorViaCallback: throwErrorViaCallback,
    expectViaCallback: expectViaCallback,
    expectErrorViaCallback: expectErrorViaCallback,
    expectFunctionToThrow: expectFunctionToThrow
};