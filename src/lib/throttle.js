/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var timerCache = {};

/**
 * Throttle a callback. `callback` executes synchronously only if
 * more than `minInterval` milliseconds have already elapsed since the latest
 * call (if any). Otherwise we wait until `minInterval` is over and execute the
 * last callback received while waiting.
 * So the first and last events in a train are always executed (eventually)
 * but some of the events in the middle can be dropped.
 *
 * @param {function} callback: the function to throttle
 * @param {string} id: an identifier to mark events to throttle together
 * @param {number} minInterval: minimum time, in milliseconds, between
 *   invocations of `callback`
 */
exports.throttle = function throttle(callback, minInterval, id) {
    var cache = timerCache[id];
    var now = Date.now();

    if(!cache) {
        /*
         * Throw out old items before making a new one, to prevent the cache
         * getting overgrown, for example from old plots that have been replaced.
         * 1 minute age is arbitrary.
         */
        for(var idi in timerCache) {
            if(timerCache[idi].ts < now - 60000) {
                delete timerCache[idi];
            }
        }
        cache = timerCache[id] = {ts: 0, timer: null};
    }

    _clearTimeout(cache);

    if(now > cache.ts + minInterval) {
        callback();
        cache.ts = now;
        return;
    }

    cache.timer = setTimeout(function() {
        callback();
        cache.ts = Date.now();
        cache.timer = null;
    }, minInterval);
};

/**
 * Clear the throttle cache for one or all timers
 * @param {optional string} id:
 *   if provided, clear just this timer
 *   if omitted, clear all timers (mainly useful for testing)
 */
exports.clear = function(id) {
    if(id) {
        _clearTimeout(timerCache[id]);
        delete timerCache[id];
    }
    else {
        for(var idi in timerCache) exports.clear(idi);
    }
};

function _clearTimeout(cache) {
    if(cache && cache.timer !== null) {
        clearTimeout(cache.timer);
        cache.timer = null;
    }
}
