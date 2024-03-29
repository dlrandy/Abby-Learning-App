"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  setup: true,
  server: true
};
exports.setup = setup;
exports.server = void 0;

var _msw = require("msw");

Object.keys(_msw).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _msw[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _msw[key];
    }
  });
});

var _node = require("msw/node");

var _nodeMatchPath = require("node-match-path");

const getKey = name => `__react_workshop_app_${name}__`;

function getDefaultDelay() {
  const variableTime = ls(getKey('variable_request_time'), 400);
  const minTime = ls(getKey('min_request_time'), 400);
  return Math.random() * variableTime + minTime;
}

function sleep(t = getDefaultDelay()) {
  return new Promise(resolve => {
    if (process.env.NODE_ENV === 'test') {
      resolve();
    } else {
      setTimeout(resolve, t);
    }
  });
}

function ls(key, defaultVal) {
  const lsVal = window.localStorage.getItem(key);
  let val;

  if (lsVal) {
    val = Number(lsVal);
  }

  return Number.isFinite(val) ? val : defaultVal;
}

const server = {};
exports.server = server;

function setup({
  handlers
}) {
  const enhancedHandlers = handlers.map(handler => {
    return { ...handler,

      async resolver(req, res, ctx) {
        try {
          if (shouldFail(req)) {
            throw new Error('Request failure (for testing purposes).');
          }

          const result = await handler.resolver(req, res, ctx);
          return result;
        } catch (error) {
          const status = error.status || 500;
          return res(ctx.status(status), ctx.json({
            status,
            message: error.message || 'Unknown Error'
          }));
        } finally {
          let delay;

          if (req.headers.has('delay')) {
            delay = Number(req.headers.get('delay'));
          }

          await sleep(delay);
        }
      }

    };
  });

  if (process.env.NODE_ENV === 'test') {
    Object.assign(server, (0, _node.setupServer)(...enhancedHandlers));
    return server;
  } else {
    Object.assign(server, (0, _msw.setupWorker)(...enhancedHandlers));
    return server;
  }
}

function shouldFail(req) {
  var _JSON$stringify, _req$url$searchParams;

  if ((_JSON$stringify = JSON.stringify(req.body)) == null ? void 0 : _JSON$stringify.includes('FAIL')) return true;
  if ((_req$url$searchParams = req.url.searchParams.toString()) == null ? void 0 : _req$url$searchParams.includes('FAIL')) return true;
  const failureRate = Number(window.localStorage.getItem(getKey('failure_rate')) || 0);
  if (Math.random() < failureRate) return true;
  if (requestMatchesFailConfig(req)) return true;
  return false;
}

function requestMatchesFailConfig(req) {
  function configMatches({
    requestMethod,
    urlMatch
  }) {
    return (requestMethod === 'ALL' || req.method === requestMethod) && (0, _nodeMatchPath.match)(urlMatch, req.url.pathname).matches;
  }

  try {
    const failConfig = JSON.parse(window.localStorage.getItem(getKey('request_fail_config')) || '[]');
    return failConfig.some(configMatches);
  } catch (error) {
    window.localStorage.removeItem(getKey('request_fail_config'));
  }

  return false;
}