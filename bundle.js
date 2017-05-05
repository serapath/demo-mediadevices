(function () {
  var socket = document.createElement('script')
  var script = document.createElement('script')
  socket.setAttribute('src', 'http://localhost:3001/socket.io/socket.io.js')
  script.type = 'text/javascript'

  socket.onload = function () {
    document.head.appendChild(script)
  }
  script.text = ['window.socket = io("http://localhost:3001");',
  'socket.on("bundle", function() {',
  'console.log("livereaload triggered")',
  'window.location.reload();});'].join('\n')
  document.head.appendChild(socket)
}());
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"csjs":6,"insert-css":20}],2:[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":5}],3:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":1,"./get-css":2}],4:[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":10}],5:[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":14}],6:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":4,"./get-css":5}],7:[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],8:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":9}],9:[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],10:[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":8,"./composition":9,"./css-extract-extends":11,"./css-key":12,"./extract-exports":13,"./scopeify":19}],11:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":9}],12:[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],13:[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":16}],14:[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":12}],15:[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],16:[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],17:[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":16}],18:[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":7,"./hash-string":15}],19:[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":16,"./replace-animations":17,"./scoped-name":18}],20:[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],21:[function(require,module,exports){
module.exports = function yoyoifyAppendChild (el, childs) {
  for (var i = 0; i < childs.length; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      yoyoifyAppendChild(el, node)
      continue
    }
    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }
    if (typeof node === 'string') {
      if (el.lastChild && el.lastChild.nodeName === '#text') {
        el.lastChild.nodeValue += node
        continue
      }
      node = document.createTextNode(node)
    }
    if (node && node.nodeType) {
      el.appendChild(node)
    }
  }
}

},{}],22:[function(require,module,exports){
var _select,
    _,
    _select2,
    _video,
    _canvas,
    _img,
    _canvas2,
    _code,
    _code2,
    _h,
    _appendChild = require('yo-yoify/lib/appendChild'),
    _h2,
    _2,
    _camera,
    _h3,
    _button,
    _canvas3,
    _h4,
    _button2,
    _div,
    _3;

var _templateObject = _taggedTemplateLiteral(['\n  html { box-sizing: border-box; }\n  *, *:before, *:after { box-sizing: inherit; }\n  body { margin: 0; }\n  .mediabox {\n    display: flex;\n    flex-direction: column;\n    width: 100vw;\n    height: 100vh;\n    padding: 50px;\n    align-items: center;\n  }\n  .selector {\n    display: block;\n  }\n  .processing {\n    position: absolute;\n    visibility: hidden;\n  }\n  .button {\n    width: 100px;\n  }\n'], ['\n  html { box-sizing: border-box; }\n  *, *:before, *:after { box-sizing: inherit; }\n  body { margin: 0; }\n  .mediabox {\n    display: flex;\n    flex-direction: column;\n    width: 100vw;\n    height: 100vh;\n    padding: 50px;\n    align-items: center;\n  }\n  .selector {\n    display: block;\n  }\n  .processing {\n    position: absolute;\n    visibility: hidden;\n  }\n  .button {\n    width: 100px;\n  }\n']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var csjs = require('csjs-inject');

var css = csjs(_templateObject);

var width = 240; // width of incoming video
var height = 0; // will be computed from width and aspect ratio of stream
var streaming = false;

var localMediaStream = null;

var action = {
  play: playVideo,
  snap: takePicture,
  save: savePicture,
  start: start
};

var videoSelect = (_select = document.createElement('select'), _select.setAttribute('class', '' + String(css.selector) + ''), _select);
var audioInputSelect = (_ = document.createElement('select'), _.setAttribute('class', '' + String(css.selector) + ''), _);
var audioOutputSelect = (_select2 = document.createElement('select'), _select2.setAttribute('class', '' + String(css.selector) + ''), _select2);
var video = (_video = document.createElement('video'), _video.oncanplay = action.play, _video.setAttribute('class', 'video'), _video.textContent = 'Video stream not available.', _video);
// var audio = element.querySelector('audio') // <audio>
var canvas = (_canvas = document.createElement('canvas'), _canvas);
var photo = (_img = document.createElement('img'), _img.setAttribute('alt', 'The screen capture will appear in this box.'), _img);
var processing = (_canvas2 = document.createElement('canvas'), _canvas2.setAttribute('class', '' + String(css.processing) + ''), _canvas2);

var element = (_3 = document.createElement('div'), _3.setAttribute('class', '' + String(css.mediabox) + ''), _appendChild(_3, ['\n    ', (_h = document.createElement('h1'), _appendChild(_h, [' works only on ', (_code = document.createElement('code'), _code.textContent = 'https', _code), ' or ', (_code2 = document.createElement('code'), _code2.textContent = ' localhost ', _code2), ' ']), _h), '\n    ', videoSelect, '\n    ', audioInputSelect, '\n    ', audioOutputSelect, '\n    ', (_camera = document.createElement('div'), _camera.setAttribute('class', 'camera'), _appendChild(_camera, ['\n      ', (_h2 = document.createElement('h1'), _h2.textContent = ' Camera ', _h2), '\n      ', video, '\n      ', (_2 = document.createElement('button'), _2.onclick = action.start, _2.setAttribute('class', '' + String(css.button) + ''), _2.textContent = '\n        Start Camera\n      ', _2), '\n    ']), _camera), '\n    ', (_canvas3 = document.createElement('div'), _canvas3.setAttribute('class', 'canvas'), _appendChild(_canvas3, ['\n      ', (_h3 = document.createElement('h1'), _h3.textContent = ' Canvas ', _h3), '\n      ', canvas, '\n      ', processing, '\n      ', (_button = document.createElement('button'), _button.onclick = action.snap, _button.setAttribute('class', '' + String(css.button) + ''), _button.textContent = '\n        Snap photo\n      ', _button), '\n    ']), _canvas3), '\n    ', (_div = document.createElement('div'), _appendChild(_div, ['\n      ', (_h4 = document.createElement('h1'), _h4.textContent = ' Image ', _h4), '\n      ', photo, '\n      ', (_button2 = document.createElement('button'), _button2.onclick = action.save, _button2.setAttribute('class', '' + String(css.button) + ''), _button2.textContent = '\n        Save photo\n      ', _button2), '\n    ']), _div), '\n  ']), _3);

document.body.appendChild(element);

function playVideo(event) {
  if (!streaming) {
    height = video.videoHeight / (video.videoWidth / width);
    video.setAttribute('width', width);
    video.setAttribute('height', height);
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    streaming = true;
  }
}

function takePicture(event) {
  event.preventDefault();
  snapshot(localMediaStream);
}

var filter = {
  crazy: function filter(ctx, photo) {
    ctx.filter = 'grayscale(0%) blur(3px) brightness(170%) contrast(128%) hue-rotate(230deg) opacity(100%) invert(30%) saturate(500%) sepia(24%)';
  },
  crazyAlternative: function alternativeFilter(ctx, /* ctx.getImageData */data) {
    data = data || ctx.getImageData(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    for (var n = 0; n < data.width * data.height; n++) {
      // make all pixels grey
      // take the red, green and blue channels and reduce the data value by 255
      var index = n * 4;
      data.data[index + 0] = 255 - data.data[index + 0];
      data.data[index + 1] = 255 - data.data[index + 1];
      data.data[index + 2] = 255 - data.data[index + 2];
    }
    return data;
  },
  greyscale: function greyscaleFilter(ctx, /* rgba value array */data) {
    data = data || ctx.getImageData(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    var r, g, b, brightness;
    for (var i = 0, len = data.length; i < len; i += 4) {
      r = data[i];
      b = data[i + 1];
      g = data[i + 2];
      // alpha = data[i+3]
      brightness = (r + b + g) / 3;
      data[i] = data[i + 1] = data[i + 2] = brightness;
    }
    return data;
  }
};

refreshDevices();

function refreshDevices() {
  if (!(navigator.mediaDevices || navigator.mediaDevices.enumerateDevices)) return;

  while (videoSelect.firstChild) {
    videoSelect.removeChild(videoSelect.firstChild);
  }while (audioInputSelect.firstChild) {
    audioInputSelect.removeChild(audioInputSelect.firstChild);
  }while (audioOutputSelect.firstChild) {
    audioOutputSelect.removeChild(audioOutputSelect.firstChild);
  } // List cameras and microphones
  navigator.mediaDevices.enumerateDevices().then(function (devices) {
    devices.forEach(function (device) {
      console.log(device.kind + ': ' + device.label + ' (id = ' + device.deviceId + ')');
      // e.g.
      // videoinput: id = csO9c0YpAf274OuCPUA53CNE0YHlIr2yXCi+SqfBZZ8=
      // audioinput: id = RKxXByjnabbADGQNNZqLVLdmXlS0YkETYCIbg+XxnvM=
      // audioinput: id = r2/xw1xUPIyZunfV1lGrKOma5wTOvCkWfZ368XCndm0=
      // or if active or persistent permissions are granted:
      // videoinput: FaceTime HD Camera (Built-in) id=csO9c0YpAf274OuCPUA53CNE0YHlIr2yXCi+SqfBZZ8=
      // audioinput: default (Built-in Microphone) id=RKxXByjnabbADGQNNZqLVLdmXlS0YkETYCIbg+XxnvM=
      // audioinput: Built-in Microphone id=r2/xw1xUPIyZunfV1lGrKOma5wTOvCkWfZ368XCndm0=
      var option = document.createElement('option');
      option.value = device.deviceId;
      if (device.kind === 'audioinput') {
        option.text = device.label || 'Microphone ' + (audioInputSelect.length + 1);
        audioInputSelect.appendChild(option);
      } else if (device.kind === 'audiooutput') {
        option.text = device.label || 'Speaker ' + (audioOutputSelect.length + 1);
        audioOutputSelect.appendChild(option);
      } else if (device.kind === 'videoinput') {
        option.text = device.label || 'Camera ' + (videoSelect.length + 1);
        videoSelect.appendChild(option);
      }
    });
  }).catch(handleError);
}

function snapshot(localMediaStream) {
  var ctx = processing.getContext('2d'); // context
  if (width && height) {
    processing.width = width;
    processing.height = height;
    // canvas.width = video.clientWidth
    // canvas.height = video.clientHeight

    // The <canvas> API's ctx.drawImage(video, 0, 0) method
    // makes it trivial to draw <video> frames to <canvas>.
    ctx.drawImage(video, 0, 0, width, height);

    // var data = filter.crazy(ctx)
    var data = filter.crazyAlternative(ctx);
    ctx.putImageData(data, 0, 0);

    // "image/webp" works in Chrome.
    // Other browsers will fall back to image/png.
    var dataURL = processing.toDataURL('image/webp', 0.95);
    if (dataURL && dataURL !== 'data:,') photo.setAttribute('src', dataURL);else console.error('Image not available');
  } else clearphoto();
}

function clearphoto() {
  var ctx = canvas.getContext('2d'); // context
  ctx.fillStyle = '#AAA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var data = canvas.toDataURL('image/png');
  photo.setAttribute('src', data);
}

function savePicture(event) {
  var fileName = generateImageName();
  fileName = fileName + '.txt';
  var dataURL = photo.getAttribute('src');
  console.log('DOWNLOAD', fileName, dataURL);
  // ... save/upload logic here ...
}

function generateImageName() {
  // ... generate image name logic here ...
  return 'imageName' + Math.floor(Math.random());
}

function start() {
  stopVideo();
  clearphoto();
  // var audioSource = audioInputSelect.value
  var videoSource = videoSelect.value;
  // var constraints = { video: true, audio: false }
  // var constraints = { video: { facingMode: 'user' } }
  //   var constraints = {
  //     audio: { optional: [{sourceId: device.deviceId}] },
  //     video: { optional: [{sourceId: device.deviceId}] }
  //   }
  // var constraints = { audio: true, video: { width: 1280, height: 720 } }
  // var constraints = { video: { frameRate: { ideal: 10, max: 15 } } }
  // var constraints = { video: { facingMode: (front? "user" : "environment") } }
  // var constraints = {
  //   video: {
  //     // constraints: https://w3c.github.io/mediacapture-main/getusermedia.html#idl-def-MediaTrackConstraints
  //     mandatory: { // hdConstraints
  //       minWidth: 1280,
  //       minHeight: 720
  //     }
  //     // mandatory: { // vgaConstraints
  //     //   maxWidth: 640,
  //     //   maxHeight: 360
  //     // }
  //   },
  //   audio: true
  //   /*...*/
  // }
  var constraints = {
    // audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  };
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
  } else {
    video.src = 'fallback.webm';
  }
}

function stopVideo() {
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(function (track) {
      track.stop();
    });
    localMediaStream = null;
  }
}

function gotStream(stream) {
  // Instead of feeding the video a URL to a media file, we're feeding it a
  // Blob URL obtained from a LocalMediaStream object representing the webcam
  // https://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers-bloburis
  // video.src = window.URL.createObjectURL(localMediaStream)
  localMediaStream = stream;
  video.srcObject = stream;

  // Adding controls also works as you'd expected
  // video.play()
  // vs.
  video.onloadedmetadata = function (e) {
    // to unfreeze
    video.play(); // or <video autoplay></video>
  };

  video.onplay = function () {
    var context = canvas.getContext('2d');
    draw(video, context, 400, 300);
  };
}

function draw(video, context) {
  context.drawImage(video, 0, 0, width, height);
  var image = context.getImageData(0, 0, width, height);
  // image.data = filter.crazy(image.data)
  // image.data = filter.crazyAlternative(image.data)
  image.data = filter.greyscale(null, image.data);
  context.putImageData(image, 0, 0);
  setTimeout(function () {
    draw(video, context);
  }, 16); // for 60 fps
}

// function video2canvas (video, canvas) {
//   var vid = video || document.createElement('video')
//   return image2canvas(vid, canvas)
// }
// function image2canvas (image, canvas) {
//   var can = canvas || document.createElement('canvas')
//   can.width = image.width
//   can.height = image.height
//   var context = can.getContext('2d')
//   context.drawImage(image, 0, 0/*, image.width, image.height */)
//   return can
// }
//
// function canvas2image (canvas, image, format) {
//   var img = image || new Image() // a little bit faster than document.createElement
//   img.src = canvas.toDataURL(format || 'image/png')
//   return img
// }

function handleError(error) {
  if (error) console.error(error.name + ': ' + error.message);
  console.error('navigator.getUserMedia error: ', error);
}
// /////////////////////////
// RECORD
// ////////////////////////
// var media = {
//   video: {
//     tag: 'video',
//     type: 'video/webm',
//     ext: '.mp4'
//   },
//   audio: {
//     tag: 'audio',
//     type: 'audio/ogg',
//     ext: '.ogg'
//   }
// }
// var recorder = new MediaRecorder(stream)
// recorder.ondataavailable = function (event) {
//   chunks.push(event.data)
//   if(recorder.state == 'inactive')  makeLink()
// }
// recorder.start()
// // https://github.com/Mido22/MediaRecorder-sample/blob/master/script.js
// setTimeout(function () {
//   recorder.stop()
// }, 5000)
// function makeLink(){
//   var blob = new Blob(chunks, {type: media.type })
//   var url = URL.createObjectURL(blob)
//   var li = document.createElement('li')
//   var mt = document.createElement(media.tag)
//   var hf = document.createElement('a')
//   mt.controls = true
//   mt.src = url
//   hf.href = url
//   hf.download = `${counter++}${media.ext}`
//   hf.innerHTML = `donwload ${hf.download}`
//   li.appendChild(mt)
//   li.appendChild(hf)
//   ul.appendChild(li)
// }
// function makeLink() {
// chunks = [];
// recorder = new MediaRecorder(stream);
// recorder.ondataavailable = e => {
//   chunks.push(e.data);
//   if (recorder.state == 'inactive') makeLink();
// };
// recorder.stop();
//
//   let blob = new Blob(chunks, {
//       type: media.type
//     }),
//     url = URL.createObjectURL(blob),
//
//     mt = document.createElement(media.tag),
//     hf = document.createElement('a');
//
//   mt.controls = true;
//   mt.src = url;
//
//   hf.href = url;
//   hf.download = `${counter++}${media.ext}`;
//   hf.innerHTML = `donwload ${hf.download}`;
// }

},{"csjs-inject":3,"yo-yoify/lib/appendChild":21}]},{},[22])


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY3Nqcy1pbmplY3QvY3Nqcy5qcyIsIm5vZGVfbW9kdWxlcy9jc2pzLWluamVjdC9nZXQtY3NzLmpzIiwibm9kZV9tb2R1bGVzL2NzanMtaW5qZWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NzanMvY3Nqcy5qcyIsIm5vZGVfbW9kdWxlcy9jc2pzL2dldC1jc3MuanMiLCJub2RlX21vZHVsZXMvY3Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jc2pzL2xpYi9iYXNlNjItZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL2NzanMvbGliL2J1aWxkLWV4cG9ydHMuanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvY29tcG9zaXRpb24uanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvY3Nqcy5qcyIsIm5vZGVfbW9kdWxlcy9jc2pzL2xpYi9jc3MtZXh0cmFjdC1leHRlbmRzLmpzIiwibm9kZV9tb2R1bGVzL2NzanMvbGliL2Nzcy1rZXkuanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvZXh0cmFjdC1leHBvcnRzLmpzIiwibm9kZV9tb2R1bGVzL2NzanMvbGliL2dldC1jc3MuanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvaGFzaC1zdHJpbmcuanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvcmVnZXguanMiLCJub2RlX21vZHVsZXMvY3Nqcy9saWIvcmVwbGFjZS1hbmltYXRpb25zLmpzIiwibm9kZV9tb2R1bGVzL2NzanMvbGliL3Njb3BlZC1uYW1lLmpzIiwibm9kZV9tb2R1bGVzL2NzanMvbGliL3Njb3BlaWZ5LmpzIiwibm9kZV9tb2R1bGVzL2luc2VydC1jc3MvaW5kZXguanMiLCJub2RlX21vZHVsZXMveW8teW9pZnkvbGliL2FwcGVuZENoaWxkLmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hCQSxJQUFJLE9BQU8s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QUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzanMgPSByZXF1aXJlKCdjc2pzJyk7XG52YXIgaW5zZXJ0Q3NzID0gcmVxdWlyZSgnaW5zZXJ0LWNzcycpO1xuXG5mdW5jdGlvbiBjc2pzSW5zZXJ0ZXIoKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgdmFyIHJlc3VsdCA9IGNzanMuYXBwbHkobnVsbCwgYXJncyk7XG4gIGlmIChnbG9iYWwuZG9jdW1lbnQpIHtcbiAgICBpbnNlcnRDc3MoY3Nqcy5nZXRDc3MocmVzdWx0KSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjc2pzSW5zZXJ0ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnY3Nqcy9nZXQtY3NzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjc2pzID0gcmVxdWlyZSgnLi9jc2pzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY3Nqcztcbm1vZHVsZS5leHBvcnRzLmNzanMgPSBjc2pzO1xubW9kdWxlLmV4cG9ydHMuZ2V0Q3NzID0gcmVxdWlyZSgnLi9nZXQtY3NzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvY3NqcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2dldC1jc3MnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzanMgPSByZXF1aXJlKCcuL2NzanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjc2pzKCk7XG5tb2R1bGUuZXhwb3J0cy5jc2pzID0gY3Nqcztcbm1vZHVsZS5leHBvcnRzLm5vU2NvcGUgPSBjc2pzKHsgbm9zY29wZTogdHJ1ZSB9KTtcbm1vZHVsZS5leHBvcnRzLmdldENzcyA9IHJlcXVpcmUoJy4vZ2V0LWNzcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIGJhc2U2MiBlbmNvZGUgaW1wbGVtZW50YXRpb24gYmFzZWQgb24gYmFzZTYyIG1vZHVsZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmRyZXcvYmFzZTYyLmpzXG4gKi9cblxudmFyIENIQVJTID0gJzAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlbmNvZGUoaW50ZWdlcikge1xuICBpZiAoaW50ZWdlciA9PT0gMCkge1xuICAgIHJldHVybiAnMCc7XG4gIH1cbiAgdmFyIHN0ciA9ICcnO1xuICB3aGlsZSAoaW50ZWdlciA+IDApIHtcbiAgICBzdHIgPSBDSEFSU1tpbnRlZ2VyICUgNjJdICsgc3RyO1xuICAgIGludGVnZXIgPSBNYXRoLmZsb29yKGludGVnZXIgLyA2Mik7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYWtlQ29tcG9zaXRpb24gPSByZXF1aXJlKCcuL2NvbXBvc2l0aW9uJykubWFrZUNvbXBvc2l0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUV4cG9ydHMoY2xhc3Nlcywga2V5ZnJhbWVzLCBjb21wb3NpdGlvbnMpIHtcbiAgdmFyIGtleWZyYW1lc09iaiA9IE9iamVjdC5rZXlzKGtleWZyYW1lcykucmVkdWNlKGZ1bmN0aW9uKGFjYywga2V5KSB7XG4gICAgdmFyIHZhbCA9IGtleWZyYW1lc1trZXldO1xuICAgIGFjY1t2YWxdID0gbWFrZUNvbXBvc2l0aW9uKFtrZXldLCBbdmFsXSwgdHJ1ZSk7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xuXG4gIHZhciBleHBvcnRzID0gT2JqZWN0LmtleXMoY2xhc3NlcykucmVkdWNlKGZ1bmN0aW9uKGFjYywga2V5KSB7XG4gICAgdmFyIHZhbCA9IGNsYXNzZXNba2V5XTtcbiAgICB2YXIgY29tcG9zaXRpb24gPSBjb21wb3NpdGlvbnNba2V5XTtcbiAgICB2YXIgZXh0ZW5kZWQgPSBjb21wb3NpdGlvbiA/IGdldENsYXNzQ2hhaW4oY29tcG9zaXRpb24pIDogW107XG4gICAgdmFyIGFsbENsYXNzZXMgPSBba2V5XS5jb25jYXQoZXh0ZW5kZWQpO1xuICAgIHZhciB1bnNjb3BlZCA9IGFsbENsYXNzZXMubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHJldHVybiBjbGFzc2VzW25hbWVdID8gY2xhc3Nlc1tuYW1lXSA6IG5hbWU7XG4gICAgfSk7XG4gICAgYWNjW3ZhbF0gPSBtYWtlQ29tcG9zaXRpb24oYWxsQ2xhc3NlcywgdW5zY29wZWQpO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIGtleWZyYW1lc09iaik7XG5cbiAgcmV0dXJuIGV4cG9ydHM7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzQ2hhaW4ob2JqKSB7XG4gIHZhciB2aXNpdGVkID0ge30sIGFjYyA9IFtdO1xuXG4gIGZ1bmN0aW9uIHRyYXZlcnNlKG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoIXZpc2l0ZWRba2V5XSkge1xuICAgICAgICB2aXNpdGVkW2tleV0gPSB0cnVlO1xuICAgICAgICBhY2MucHVzaChrZXkpO1xuICAgICAgICB0cmF2ZXJzZShvYmpba2V5XSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB0cmF2ZXJzZShvYmopO1xuICByZXR1cm4gYWNjO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWFrZUNvbXBvc2l0aW9uOiBtYWtlQ29tcG9zaXRpb24sXG4gIGlzQ29tcG9zaXRpb246IGlzQ29tcG9zaXRpb24sXG4gIGlnbm9yZUNvbXBvc2l0aW9uOiBpZ25vcmVDb21wb3NpdGlvblxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGFuIGltbXV0YWJsZSBjb21wb3NpdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgZ2l2ZW4gY2xhc3MgbmFtZXNcbiAqIEBwYXJhbSAge2FycmF5fSBjbGFzc05hbWVzIC0gVGhlIGlucHV0IGFycmF5IG9mIGNsYXNzIG5hbWVzXG4gKiBAcmV0dXJuIHtDb21wb3NpdGlvbn0gICAgICAtIEFuIGltbXV0YWJsZSBvYmplY3QgdGhhdCBob2xkcyBtdWx0aXBsZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXByZXNlbnRhdGlvbnMgb2YgdGhlIGNsYXNzIGNvbXBvc2l0aW9uXG4gKi9cbmZ1bmN0aW9uIG1ha2VDb21wb3NpdGlvbihjbGFzc05hbWVzLCB1bnNjb3BlZCwgaXNBbmltYXRpb24pIHtcbiAgdmFyIGNsYXNzU3RyaW5nID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gIHJldHVybiBPYmplY3QuY3JlYXRlKENvbXBvc2l0aW9uLnByb3RvdHlwZSwge1xuICAgIGNsYXNzTmFtZXM6IHsgLy8gdGhlIG9yaWdpbmFsIGFycmF5IG9mIGNsYXNzIG5hbWVzXG4gICAgICB2YWx1ZTogT2JqZWN0LmZyZWV6ZShjbGFzc05hbWVzKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSxcbiAgICB1bnNjb3BlZDogeyAvLyB0aGUgb3JpZ2luYWwgYXJyYXkgb2YgY2xhc3MgbmFtZXNcbiAgICAgIHZhbHVlOiBPYmplY3QuZnJlZXplKHVuc2NvcGVkKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSxcbiAgICBjbGFzc05hbWU6IHsgLy8gc3BhY2Utc2VwYXJhdGVkIGNsYXNzIHN0cmluZyBmb3IgdXNlIGluIEhUTUxcbiAgICAgIHZhbHVlOiBjbGFzc1N0cmluZyxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSxcbiAgICBzZWxlY3RvcjogeyAvLyBjb21tYS1zZXBhcmF0ZWQsIHBlcmlvZC1wcmVmaXhlZCBzdHJpbmcgZm9yIHVzZSBpbiBDU1NcbiAgICAgIHZhbHVlOiBjbGFzc05hbWVzLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBpc0FuaW1hdGlvbiA/IG5hbWUgOiAnLicgKyBuYW1lO1xuICAgICAgfSkuam9pbignLCAnKSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSxcbiAgICB0b1N0cmluZzogeyAvLyB0b1N0cmluZygpIG1ldGhvZCwgcmV0dXJucyBjbGFzcyBzdHJpbmcgZm9yIHVzZSBpbiBIVE1MXG4gICAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjbGFzc1N0cmluZztcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGVhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGlucHV0IHZhbHVlIGlzIGEgQ29tcG9zaXRpb25cbiAqIEBwYXJhbSB2YWx1ZSAgICAgIC0gdmFsdWUgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB2YWx1ZSBpcyBhIENvbXBvc2l0aW9uIG9yIG5vdFxuICovXG5mdW5jdGlvbiBpc0NvbXBvc2l0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIENvbXBvc2l0aW9uO1xufVxuXG5mdW5jdGlvbiBpZ25vcmVDb21wb3NpdGlvbih2YWx1ZXMpIHtcbiAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCB2YWwpIHtcbiAgICBpZiAoaXNDb21wb3NpdGlvbih2YWwpKSB7XG4gICAgICB2YWwuY2xhc3NOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgYWNjW25hbWVdID0gdmFsLnVuc2NvcGVkW2ldO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBQcml2YXRlIGNvbnN0cnVjdG9yIGZvciB1c2UgaW4gYGluc3RhbmNlb2ZgIGNoZWNrc1xuICovXG5mdW5jdGlvbiBDb21wb3NpdGlvbigpIHt9XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHRyYWN0RXh0ZW5kcyA9IHJlcXVpcmUoJy4vY3NzLWV4dHJhY3QtZXh0ZW5kcycpO1xudmFyIGNvbXBvc2l0aW9uID0gcmVxdWlyZSgnLi9jb21wb3NpdGlvbicpO1xudmFyIGlzQ29tcG9zaXRpb24gPSBjb21wb3NpdGlvbi5pc0NvbXBvc2l0aW9uO1xudmFyIGlnbm9yZUNvbXBvc2l0aW9uID0gY29tcG9zaXRpb24uaWdub3JlQ29tcG9zaXRpb247XG52YXIgYnVpbGRFeHBvcnRzID0gcmVxdWlyZSgnLi9idWlsZC1leHBvcnRzJyk7XG52YXIgc2NvcGlmeSA9IHJlcXVpcmUoJy4vc2NvcGVpZnknKTtcbnZhciBjc3NLZXkgPSByZXF1aXJlKCcuL2Nzcy1rZXknKTtcbnZhciBleHRyYWN0RXhwb3J0cyA9IHJlcXVpcmUoJy4vZXh0cmFjdC1leHBvcnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3Nqc1RlbXBsYXRlKG9wdHMpIHtcbiAgb3B0cyA9ICh0eXBlb2Ygb3B0cyA9PT0gJ3VuZGVmaW5lZCcpID8ge30gOiBvcHRzO1xuICB2YXIgbm9zY29wZSA9ICh0eXBlb2Ygb3B0cy5ub3Njb3BlID09PSAndW5kZWZpbmVkJykgPyBmYWxzZSA6IG9wdHMubm9zY29wZTtcblxuICByZXR1cm4gZnVuY3Rpb24gY3Nqc0hhbmRsZXIoc3RyaW5ncywgdmFsdWVzKSB7XG4gICAgLy8gRmFzdCBwYXRoIHRvIHByZXZlbnQgYXJndW1lbnRzIGRlb3B0XG4gICAgdmFyIHZhbHVlcyA9IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG4gICAgdmFyIGNzcyA9IGpvaW5lcihzdHJpbmdzLCB2YWx1ZXMubWFwKHNlbGVjdG9yaXplKSk7XG4gICAgdmFyIGlnbm9yZXMgPSBpZ25vcmVDb21wb3NpdGlvbih2YWx1ZXMpO1xuXG4gICAgdmFyIHNjb3BlID0gbm9zY29wZSA/IGV4dHJhY3RFeHBvcnRzKGNzcykgOiBzY29waWZ5KGNzcywgaWdub3Jlcyk7XG4gICAgdmFyIGV4dHJhY3RlZCA9IGV4dHJhY3RFeHRlbmRzKHNjb3BlLmNzcyk7XG4gICAgdmFyIGxvY2FsQ2xhc3NlcyA9IHdpdGhvdXQoc2NvcGUuY2xhc3NlcywgaWdub3Jlcyk7XG4gICAgdmFyIGxvY2FsS2V5ZnJhbWVzID0gd2l0aG91dChzY29wZS5rZXlmcmFtZXMsIGlnbm9yZXMpO1xuICAgIHZhciBjb21wb3NpdGlvbnMgPSBleHRyYWN0ZWQuY29tcG9zaXRpb25zO1xuXG4gICAgdmFyIGV4cG9ydHMgPSBidWlsZEV4cG9ydHMobG9jYWxDbGFzc2VzLCBsb2NhbEtleWZyYW1lcywgY29tcG9zaXRpb25zKTtcblxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgY3NzS2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB3cml0ZWFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6IGV4dHJhY3RlZC5jc3NcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFJlcGxhY2VzIGNsYXNzIGNvbXBvc2l0aW9ucyB3aXRoIGNvbW1hIHNlcGVyYXRlZCBjbGFzcyBzZWxlY3RvcnNcbiAqIEBwYXJhbSAgdmFsdWUgLSB0aGUgcG90ZW50aWFsIGNsYXNzIGNvbXBvc2l0aW9uXG4gKiBAcmV0dXJuICAgICAgIC0gdGhlIG9yaWdpbmFsIHZhbHVlIG9yIHRoZSBzZWxlY3Rvcml6ZWQgY2xhc3MgY29tcG9zaXRpb25cbiAqL1xuZnVuY3Rpb24gc2VsZWN0b3JpemUodmFsdWUpIHtcbiAgcmV0dXJuIGlzQ29tcG9zaXRpb24odmFsdWUpID8gdmFsdWUuc2VsZWN0b3IgOiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBKb2lucyB0ZW1wbGF0ZSBzdHJpbmcgbGl0ZXJhbHMgYW5kIHZhbHVlc1xuICogQHBhcmFtICB7YXJyYXl9IHN0cmluZ3MgLSBhcnJheSBvZiBzdHJpbmdzXG4gKiBAcGFyYW0gIHthcnJheX0gdmFsdWVzICAtIGFycmF5IG9mIHZhbHVlc1xuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgLSBzdHJpbmdzIGFuZCB2YWx1ZXMgam9pbmVkXG4gKi9cbmZ1bmN0aW9uIGpvaW5lcihzdHJpbmdzLCB2YWx1ZXMpIHtcbiAgcmV0dXJuIHN0cmluZ3MubWFwKGZ1bmN0aW9uKHN0ciwgaSkge1xuICAgIHJldHVybiAoaSAhPT0gdmFsdWVzLmxlbmd0aCkgPyBzdHIgKyB2YWx1ZXNbaV0gOiBzdHI7XG4gIH0pLmpvaW4oJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgZmlyc3Qgb2JqZWN0IHdpdGhvdXQga2V5cyBvZiBzZWNvbmRcbiAqIEBwYXJhbSAge29iamVjdH0gb2JqICAgICAgLSBzb3VyY2Ugb2JqZWN0XG4gKiBAcGFyYW0gIHtvYmplY3R9IHVud2FudGVkIC0gb2JqZWN0IHdpdGggdW53YW50ZWQga2V5c1xuICogQHJldHVybiB7b2JqZWN0fSAgICAgICAgICAtIGZpcnN0IG9iamVjdCB3aXRob3V0IHVud2FudGVkIGtleXNcbiAqL1xuZnVuY3Rpb24gd2l0aG91dChvYmosIHVud2FudGVkKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLnJlZHVjZShmdW5jdGlvbihhY2MsIGtleSkge1xuICAgIGlmICghdW53YW50ZWRba2V5XSkge1xuICAgICAgYWNjW2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWFrZUNvbXBvc2l0aW9uID0gcmVxdWlyZSgnLi9jb21wb3NpdGlvbicpLm1ha2VDb21wb3NpdGlvbjtcblxudmFyIHJlZ2V4ID0gL1xcLihbXlxcc10rKShcXHMrKShleHRlbmRzXFxzKykoXFwuW157XSspL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0cmFjdEV4dGVuZHMoY3NzKSB7XG4gIHZhciBmb3VuZCwgbWF0Y2hlcyA9IFtdO1xuICB3aGlsZSAoZm91bmQgPSByZWdleC5leGVjKGNzcykpIHtcbiAgICBtYXRjaGVzLnVuc2hpZnQoZm91bmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdENvbXBvc2l0aW9ucyhhY2MsIG1hdGNoKSB7XG4gICAgdmFyIGV4dGVuZGVlID0gZ2V0Q2xhc3NOYW1lKG1hdGNoWzFdKTtcbiAgICB2YXIga2V5d29yZCA9IG1hdGNoWzNdO1xuICAgIHZhciBleHRlbmRlZCA9IG1hdGNoWzRdO1xuXG4gICAgLy8gcmVtb3ZlIGZyb20gb3V0cHV0IGNzc1xuICAgIHZhciBpbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoICsgbWF0Y2hbMl0ubGVuZ3RoO1xuICAgIHZhciBsZW4gPSBrZXl3b3JkLmxlbmd0aCArIGV4dGVuZGVkLmxlbmd0aDtcbiAgICBhY2MuY3NzID0gYWNjLmNzcy5zbGljZSgwLCBpbmRleCkgKyBcIiBcIiArIGFjYy5jc3Muc2xpY2UoaW5kZXggKyBsZW4gKyAxKTtcblxuICAgIHZhciBleHRlbmRlZENsYXNzZXMgPSBzcGxpdHRlcihleHRlbmRlZCk7XG5cbiAgICBleHRlbmRlZENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgIGlmICghYWNjLmNvbXBvc2l0aW9uc1tleHRlbmRlZV0pIHtcbiAgICAgICAgYWNjLmNvbXBvc2l0aW9uc1tleHRlbmRlZV0gPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghYWNjLmNvbXBvc2l0aW9uc1tjbGFzc05hbWVdKSB7XG4gICAgICAgIGFjYy5jb21wb3NpdGlvbnNbY2xhc3NOYW1lXSA9IHt9O1xuICAgICAgfVxuICAgICAgYWNjLmNvbXBvc2l0aW9uc1tleHRlbmRlZV1bY2xhc3NOYW1lXSA9IGFjYy5jb21wb3NpdGlvbnNbY2xhc3NOYW1lXTtcbiAgICB9KTtcbiAgICByZXR1cm4gYWNjO1xuICB9XG5cbiAgcmV0dXJuIG1hdGNoZXMucmVkdWNlKGV4dHJhY3RDb21wb3NpdGlvbnMsIHtcbiAgICBjc3M6IGNzcyxcbiAgICBjb21wb3NpdGlvbnM6IHt9XG4gIH0pO1xuXG59O1xuXG5mdW5jdGlvbiBzcGxpdHRlcihtYXRjaCkge1xuICByZXR1cm4gbWF0Y2guc3BsaXQoJywnKS5tYXAoZ2V0Q2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKHN0cikge1xuICB2YXIgdHJpbW1lZCA9IHN0ci50cmltKCk7XG4gIHJldHVybiB0cmltbWVkWzBdID09PSAnLicgPyB0cmltbWVkLnN1YnN0cigxKSA6IHRyaW1tZWQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQ1NTIGlkZW50aWZpZXJzIHdpdGggd2hpdGVzcGFjZSBhcmUgaW52YWxpZFxuICogSGVuY2UgdGhpcyBrZXkgd2lsbCBub3QgY2F1c2UgYSBjb2xsaXNpb25cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9ICcgY3NzICc7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZWdleCA9IHJlcXVpcmUoJy4vcmVnZXgnKTtcbnZhciBjbGFzc1JlZ2V4ID0gcmVnZXguY2xhc3NSZWdleDtcbnZhciBrZXlmcmFtZXNSZWdleCA9IHJlZ2V4LmtleWZyYW1lc1JlZ2V4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4dHJhY3RFeHBvcnRzO1xuXG5mdW5jdGlvbiBleHRyYWN0RXhwb3J0cyhjc3MpIHtcbiAgcmV0dXJuIHtcbiAgICBjc3M6IGNzcyxcbiAgICBrZXlmcmFtZXM6IGdldEV4cG9ydChjc3MsIGtleWZyYW1lc1JlZ2V4KSxcbiAgICBjbGFzc2VzOiBnZXRFeHBvcnQoY3NzLCBjbGFzc1JlZ2V4KVxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRFeHBvcnQoY3NzLCByZWdleCkge1xuICB2YXIgcHJvcCA9IHt9O1xuICB2YXIgbWF0Y2g7XG4gIHdoaWxlKChtYXRjaCA9IHJlZ2V4LmV4ZWMoY3NzKSkgIT09IG51bGwpIHtcbiAgICB2YXIgbmFtZSA9IG1hdGNoWzJdO1xuICAgIHByb3BbbmFtZV0gPSBuYW1lO1xuICB9XG4gIHJldHVybiBwcm9wO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3NzS2V5ID0gcmVxdWlyZSgnLi9jc3Mta2V5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0Q3NzKGNzanMpIHtcbiAgcmV0dXJuIGNzanNbY3NzS2V5XTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogZGpiMiBzdHJpbmcgaGFzaCBpbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiBzdHJpbmctaGFzaCBtb2R1bGU6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGFzaFN0cihzdHIpIHtcbiAgdmFyIGhhc2ggPSA1MzgxO1xuICB2YXIgaSA9IHN0ci5sZW5ndGg7XG5cbiAgd2hpbGUgKGkpIHtcbiAgICBoYXNoID0gKGhhc2ggKiAzMykgXiBzdHIuY2hhckNvZGVBdCgtLWkpXG4gIH1cbiAgcmV0dXJuIGhhc2ggPj4+IDA7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZmluZENsYXNzZXMgPSAvKFxcLikoPyFcXGQpKFteXFxzXFwuLHtcXFs+K34jOildKikoPyFbXntdKn0pLy5zb3VyY2U7XG52YXIgZmluZEtleWZyYW1lcyA9IC8oQFxcUyprZXlmcmFtZXNcXHMqKShbXntcXHNdKikvLnNvdXJjZTtcbnZhciBpZ25vcmVDb21tZW50cyA9IC8oPyEoPzpbXiovXXxcXCpbXi9dfFxcL1teKl0pKlxcKitcXC8pLy5zb3VyY2U7XG5cbnZhciBjbGFzc1JlZ2V4ID0gbmV3IFJlZ0V4cChmaW5kQ2xhc3NlcyArIGlnbm9yZUNvbW1lbnRzLCAnZycpO1xudmFyIGtleWZyYW1lc1JlZ2V4ID0gbmV3IFJlZ0V4cChmaW5kS2V5ZnJhbWVzICsgaWdub3JlQ29tbWVudHMsICdnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGFzc1JlZ2V4OiBjbGFzc1JlZ2V4LFxuICBrZXlmcmFtZXNSZWdleDoga2V5ZnJhbWVzUmVnZXgsXG4gIGlnbm9yZUNvbW1lbnRzOiBpZ25vcmVDb21tZW50cyxcbn07XG4iLCJ2YXIgaWdub3JlQ29tbWVudHMgPSByZXF1aXJlKCcuL3JlZ2V4JykuaWdub3JlQ29tbWVudHM7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVwbGFjZUFuaW1hdGlvbnM7XG5cbmZ1bmN0aW9uIHJlcGxhY2VBbmltYXRpb25zKHJlc3VsdCkge1xuICB2YXIgYW5pbWF0aW9ucyA9IE9iamVjdC5rZXlzKHJlc3VsdC5rZXlmcmFtZXMpLnJlZHVjZShmdW5jdGlvbihhY2MsIGtleSkge1xuICAgIGFjY1tyZXN1bHQua2V5ZnJhbWVzW2tleV1dID0ga2V5O1xuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcbiAgdmFyIHVuc2NvcGVkID0gT2JqZWN0LmtleXMoYW5pbWF0aW9ucyk7XG5cbiAgaWYgKHVuc2NvcGVkLmxlbmd0aCkge1xuICAgIHZhciByZWdleFN0ciA9ICcoKD86YW5pbWF0aW9ufGFuaW1hdGlvbi1uYW1lKVxcXFxzKjpbXn07XSopKCdcbiAgICAgICsgdW5zY29wZWQuam9pbignfCcpICsgJykoWztcXFxcc10pJyArIGlnbm9yZUNvbW1lbnRzO1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHIsICdnJyk7XG5cbiAgICB2YXIgcmVwbGFjZWQgPSByZXN1bHQuY3NzLnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBwcmVhbWJsZSwgbmFtZSwgZW5kaW5nKSB7XG4gICAgICByZXR1cm4gcHJlYW1ibGUgKyBhbmltYXRpb25zW25hbWVdICsgZW5kaW5nO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNzczogcmVwbGFjZWQsXG4gICAgICBrZXlmcmFtZXM6IHJlc3VsdC5rZXlmcmFtZXMsXG4gICAgICBjbGFzc2VzOiByZXN1bHQuY2xhc3Nlc1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBlbmNvZGUgPSByZXF1aXJlKCcuL2Jhc2U2Mi1lbmNvZGUnKTtcbnZhciBoYXNoID0gcmVxdWlyZSgnLi9oYXNoLXN0cmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbGVTY29wZXIoZmlsZVNyYykge1xuICB2YXIgc3VmZml4ID0gZW5jb2RlKGhhc2goZmlsZVNyYykpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBzY29wZWROYW1lKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZSArICdfJyArIHN1ZmZpeDtcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGZpbGVTY29wZXIgPSByZXF1aXJlKCcuL3Njb3BlZC1uYW1lJyk7XG52YXIgcmVwbGFjZUFuaW1hdGlvbnMgPSByZXF1aXJlKCcuL3JlcGxhY2UtYW5pbWF0aW9ucycpO1xudmFyIHJlZ2V4ID0gcmVxdWlyZSgnLi9yZWdleCcpO1xudmFyIGNsYXNzUmVnZXggPSByZWdleC5jbGFzc1JlZ2V4O1xudmFyIGtleWZyYW1lc1JlZ2V4ID0gcmVnZXgua2V5ZnJhbWVzUmVnZXg7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NvcGlmeTtcblxuZnVuY3Rpb24gc2NvcGlmeShjc3MsIGlnbm9yZXMpIHtcbiAgdmFyIG1ha2VTY29wZWROYW1lID0gZmlsZVNjb3Blcihjc3MpO1xuICB2YXIgcmVwbGFjZXJzID0ge1xuICAgIGNsYXNzZXM6IGNsYXNzUmVnZXgsXG4gICAga2V5ZnJhbWVzOiBrZXlmcmFtZXNSZWdleFxuICB9O1xuXG4gIGZ1bmN0aW9uIHNjb3BlQ3NzKHJlc3VsdCwga2V5KSB7XG4gICAgdmFyIHJlcGxhY2VyID0gcmVwbGFjZXJzW2tleV07XG4gICAgZnVuY3Rpb24gcmVwbGFjZUZuKGZ1bGxNYXRjaCwgcHJlZml4LCBuYW1lKSB7XG4gICAgICB2YXIgc2NvcGVkTmFtZSA9IGlnbm9yZXNbbmFtZV0gPyBuYW1lIDogbWFrZVNjb3BlZE5hbWUobmFtZSk7XG4gICAgICByZXN1bHRba2V5XVtzY29wZWROYW1lXSA9IG5hbWU7XG4gICAgICByZXR1cm4gcHJlZml4ICsgc2NvcGVkTmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGNzczogcmVzdWx0LmNzcy5yZXBsYWNlKHJlcGxhY2VyLCByZXBsYWNlRm4pLFxuICAgICAga2V5ZnJhbWVzOiByZXN1bHQua2V5ZnJhbWVzLFxuICAgICAgY2xhc3NlczogcmVzdWx0LmNsYXNzZXNcbiAgICB9O1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IE9iamVjdC5rZXlzKHJlcGxhY2VycykucmVkdWNlKHNjb3BlQ3NzLCB7XG4gICAgY3NzOiBjc3MsXG4gICAga2V5ZnJhbWVzOiB7fSxcbiAgICBjbGFzc2VzOiB7fVxuICB9KTtcblxuICByZXR1cm4gcmVwbGFjZUFuaW1hdGlvbnMocmVzdWx0KTtcbn1cbiIsInZhciBpbnNlcnRlZCA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MsIG9wdGlvbnMpIHtcbiAgICBpZiAoaW5zZXJ0ZWRbY3NzXSkgcmV0dXJuO1xuICAgIGluc2VydGVkW2Nzc10gPSB0cnVlO1xuICAgIFxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuXG4gICAgaWYgKCd0ZXh0Q29udGVudCcgaW4gZWxlbSkge1xuICAgICAgZWxlbS50ZXh0Q29udGVudCA9IGNzcztcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XG4gICAgfVxuICAgIFxuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnByZXBlbmQpIHtcbiAgICAgICAgaGVhZC5pbnNlcnRCZWZvcmUoZWxlbSwgaGVhZC5jaGlsZE5vZGVzWzBdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHlveW9pZnlBcHBlbmRDaGlsZCAoZWwsIGNoaWxkcykge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBub2RlID0gY2hpbGRzW2ldXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHtcbiAgICAgIHlveW9pZnlBcHBlbmRDaGlsZChlbCwgbm9kZSlcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ251bWJlcicgfHxcbiAgICAgIHR5cGVvZiBub2RlID09PSAnYm9vbGVhbicgfHxcbiAgICAgIG5vZGUgaW5zdGFuY2VvZiBEYXRlIHx8XG4gICAgICBub2RlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICBub2RlID0gbm9kZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChlbC5sYXN0Q2hpbGQgJiYgZWwubGFzdENoaWxkLm5vZGVOYW1lID09PSAnI3RleHQnKSB7XG4gICAgICAgIGVsLmxhc3RDaGlsZC5ub2RlVmFsdWUgKz0gbm9kZVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUpXG4gICAgfVxuICAgIGlmIChub2RlICYmIG5vZGUubm9kZVR5cGUpIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKG5vZGUpXG4gICAgfVxuICB9XG59XG4iLCJ2YXIgYmVsID0gcmVxdWlyZSgnYmVsJylcbnZhciBjc2pzID0gcmVxdWlyZSgnY3Nqcy1pbmplY3QnKVxuXG52YXIgY3NzID0gY3Nqc2BcbiAgaHRtbCB7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cbiAgKiwgKjpiZWZvcmUsICo6YWZ0ZXIgeyBib3gtc2l6aW5nOiBpbmhlcml0OyB9XG4gIGJvZHkgeyBtYXJnaW46IDA7IH1cbiAgLm1lZGlhYm94IHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgd2lkdGg6IDEwMHZ3O1xuICAgIGhlaWdodDogMTAwdmg7XG4gICAgcGFkZGluZzogNTBweDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG4gIC5zZWxlY3RvciB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gIH1cbiAgLnByb2Nlc3Npbmcge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB2aXNpYmlsaXR5OiBoaWRkZW47XG4gIH1cbiAgLmJ1dHRvbiB7XG4gICAgd2lkdGg6IDEwMHB4O1xuICB9XG5gXG5cbnZhciB3aWR0aCA9IDI0MCAvLyB3aWR0aCBvZiBpbmNvbWluZyB2aWRlb1xudmFyIGhlaWdodCA9IDAgLy8gd2lsbCBiZSBjb21wdXRlZCBmcm9tIHdpZHRoIGFuZCBhc3BlY3QgcmF0aW8gb2Ygc3RyZWFtXG52YXIgc3RyZWFtaW5nID0gZmFsc2VcblxudmFyIGxvY2FsTWVkaWFTdHJlYW0gPSBudWxsXG5cbnZhciBhY3Rpb24gPSB7XG4gIHBsYXk6IHBsYXlWaWRlbyxcbiAgc25hcDogdGFrZVBpY3R1cmUsXG4gIHNhdmU6IHNhdmVQaWN0dXJlLFxuICBzdGFydDogc3RhcnRcbn1cblxudmFyIHZpZGVvU2VsZWN0ID0gYmVsYDxzZWxlY3QgY2xhc3M9XCIke2Nzcy5zZWxlY3Rvcn1cIj48L3NlbGVjdD5gXG52YXIgYXVkaW9JbnB1dFNlbGVjdCA9IGJlbGA8c2VsZWN0IGNsYXNzPVwiJHtjc3Muc2VsZWN0b3J9XCI+PC9zZWxlY3Q+YFxudmFyIGF1ZGlvT3V0cHV0U2VsZWN0ID0gYmVsYDxzZWxlY3QgY2xhc3M9XCIke2Nzcy5zZWxlY3Rvcn1cIj48L3NlbGVjdD5gXG52YXIgdmlkZW8gPSBiZWxgPHZpZGVvIGNsYXNzPVwidmlkZW9cIiBvbmNhbnBsYXk9JHthY3Rpb24ucGxheX0+VmlkZW8gc3RyZWFtIG5vdCBhdmFpbGFibGUuPC92aWRlbz5gXG4vLyB2YXIgYXVkaW8gPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2F1ZGlvJykgLy8gPGF1ZGlvPlxudmFyIGNhbnZhcyA9IGJlbGA8Y2FudmFzPjwvY2FudmFzPmBcbnZhciBwaG90byA9IGJlbGA8aW1nIGFsdD1cIlRoZSBzY3JlZW4gY2FwdHVyZSB3aWxsIGFwcGVhciBpbiB0aGlzIGJveC5cIj5gXG52YXIgcHJvY2Vzc2luZyA9IGJlbGA8Y2FudmFzIGNsYXNzPVwiJHtjc3MucHJvY2Vzc2luZ31cIj48L2NhbnZhcz5gXG5cbnZhciBlbGVtZW50ID0gYmVsYFxuICA8ZGl2IGNsYXNzPVwiJHtjc3MubWVkaWFib3h9XCI+XG4gICAgPGgxPiB3b3JrcyBvbmx5IG9uIDxjb2RlPmh0dHBzPC9jb2RlPiBvciA8Y29kZT4gbG9jYWxob3N0IDwvY29kZT4gPC9oMT5cbiAgICAke3ZpZGVvU2VsZWN0fVxuICAgICR7YXVkaW9JbnB1dFNlbGVjdH1cbiAgICAke2F1ZGlvT3V0cHV0U2VsZWN0fVxuICAgIDxkaXYgY2xhc3M9XCJjYW1lcmFcIj5cbiAgICAgIDxoMT4gQ2FtZXJhIDwvaDE+XG4gICAgICAke3ZpZGVvfVxuICAgICAgPGJ1dHRvbiBjbGFzcz1cIiR7Y3NzLmJ1dHRvbn1cIiBvbmNsaWNrPSR7YWN0aW9uLnN0YXJ0fT5cbiAgICAgICAgU3RhcnQgQ2FtZXJhXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiY2FudmFzXCI+XG4gICAgICA8aDE+IENhbnZhcyA8L2gxPlxuICAgICAgJHtjYW52YXN9XG4gICAgICAke3Byb2Nlc3Npbmd9XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiJHtjc3MuYnV0dG9ufVwiIG9uY2xpY2s9JHthY3Rpb24uc25hcH0+XG4gICAgICAgIFNuYXAgcGhvdG9cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXY+XG4gICAgICA8aDE+IEltYWdlIDwvaDE+XG4gICAgICAke3Bob3RvfVxuICAgICAgPGJ1dHRvbiBjbGFzcz1cIiR7Y3NzLmJ1dHRvbn1cIiBvbmNsaWNrPSR7YWN0aW9uLnNhdmV9PlxuICAgICAgICBTYXZlIHBob3RvXG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG5gXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbWVudClcblxuZnVuY3Rpb24gcGxheVZpZGVvIChldmVudCkge1xuICBpZiAoIXN0cmVhbWluZykge1xuICAgIGhlaWdodCA9IHZpZGVvLnZpZGVvSGVpZ2h0IC8gKHZpZGVvLnZpZGVvV2lkdGggLyB3aWR0aClcbiAgICB2aWRlby5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgd2lkdGgpXG4gICAgdmlkZW8uc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgY2FudmFzLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCB3aWR0aClcbiAgICBjYW52YXMuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgc3RyZWFtaW5nID0gdHJ1ZVxuICB9XG59XG5cbmZ1bmN0aW9uIHRha2VQaWN0dXJlIChldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gIHNuYXBzaG90KGxvY2FsTWVkaWFTdHJlYW0pXG59XG5cbnZhciBmaWx0ZXIgPSB7XG4gIGNyYXp5OiBmdW5jdGlvbiBmaWx0ZXIgKGN0eCwgcGhvdG8pIHtcbiAgICBjdHguZmlsdGVyID0gJ2dyYXlzY2FsZSgwJSkgYmx1cigzcHgpIGJyaWdodG5lc3MoMTcwJSkgY29udHJhc3QoMTI4JSkgaHVlLXJvdGF0ZSgyMzBkZWcpIG9wYWNpdHkoMTAwJSkgaW52ZXJ0KDMwJSkgc2F0dXJhdGUoNTAwJSkgc2VwaWEoMjQlKSdcbiAgfSxcbiAgY3JhenlBbHRlcm5hdGl2ZTogZnVuY3Rpb24gYWx0ZXJuYXRpdmVGaWx0ZXIgKGN0eCwgLyogY3R4LmdldEltYWdlRGF0YSAqL2RhdGEpIHtcbiAgICBkYXRhID0gZGF0YSB8fCBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGN0eC5jYW52YXMuY2xpZW50V2lkdGgsIGN0eC5jYW52YXMuY2xpZW50SGVpZ2h0KVxuICAgIGZvciAodmFyIG4gPSAwOyBuIDwgZGF0YS53aWR0aCAqIGRhdGEuaGVpZ2h0OyBuKyspIHsgLy8gbWFrZSBhbGwgcGl4ZWxzIGdyZXlcbiAgICAgIC8vIHRha2UgdGhlIHJlZCwgZ3JlZW4gYW5kIGJsdWUgY2hhbm5lbHMgYW5kIHJlZHVjZSB0aGUgZGF0YSB2YWx1ZSBieSAyNTVcbiAgICAgIHZhciBpbmRleCA9IG4gKiA0XG4gICAgICBkYXRhLmRhdGFbaW5kZXggKyAwXSA9IDI1NSAtIGRhdGEuZGF0YVtpbmRleCArIDBdXG4gICAgICBkYXRhLmRhdGFbaW5kZXggKyAxXSA9IDI1NSAtIGRhdGEuZGF0YVtpbmRleCArIDFdXG4gICAgICBkYXRhLmRhdGFbaW5kZXggKyAyXSA9IDI1NSAtIGRhdGEuZGF0YVtpbmRleCArIDJdXG4gICAgfVxuICAgIHJldHVybiBkYXRhXG4gIH0sXG4gIGdyZXlzY2FsZTogZnVuY3Rpb24gZ3JleXNjYWxlRmlsdGVyIChjdHgsIC8qIHJnYmEgdmFsdWUgYXJyYXkgKi9kYXRhKSB7XG4gICAgZGF0YSA9IGRhdGEgfHwgY3R4LmdldEltYWdlRGF0YSgwLCAwLCBjdHguY2FudmFzLmNsaWVudFdpZHRoLCBjdHguY2FudmFzLmNsaWVudEhlaWdodClcbiAgICB2YXIgciwgZywgYiwgYnJpZ2h0bmVzc1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgICByID0gZGF0YVtpXVxuICAgICAgYiA9IGRhdGFbaSArIDFdXG4gICAgICBnID0gZGF0YVtpICsgMl1cbiAgICAgIC8vIGFscGhhID0gZGF0YVtpKzNdXG4gICAgICBicmlnaHRuZXNzID0gKHIgKyBiICsgZykgLyAzXG4gICAgICBkYXRhW2ldID0gZGF0YVtpICsgMV0gPSBkYXRhW2kgKyAyXSA9IGJyaWdodG5lc3NcbiAgICB9XG4gICAgcmV0dXJuIGRhdGFcbiAgfVxufVxuXG5yZWZyZXNoRGV2aWNlcygpXG5cbmZ1bmN0aW9uIHJlZnJlc2hEZXZpY2VzICgpIHtcbiAgaWYgKCEobmF2aWdhdG9yLm1lZGlhRGV2aWNlcyB8fCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmVudW1lcmF0ZURldmljZXMpKSByZXR1cm5cblxuICB3aGlsZSAodmlkZW9TZWxlY3QuZmlyc3RDaGlsZCkgdmlkZW9TZWxlY3QucmVtb3ZlQ2hpbGQodmlkZW9TZWxlY3QuZmlyc3RDaGlsZClcbiAgd2hpbGUgKGF1ZGlvSW5wdXRTZWxlY3QuZmlyc3RDaGlsZCkgYXVkaW9JbnB1dFNlbGVjdC5yZW1vdmVDaGlsZChhdWRpb0lucHV0U2VsZWN0LmZpcnN0Q2hpbGQpXG4gIHdoaWxlIChhdWRpb091dHB1dFNlbGVjdC5maXJzdENoaWxkKSBhdWRpb091dHB1dFNlbGVjdC5yZW1vdmVDaGlsZChhdWRpb091dHB1dFNlbGVjdC5maXJzdENoaWxkKVxuXG4gIC8vIExpc3QgY2FtZXJhcyBhbmQgbWljcm9waG9uZXNcbiAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5lbnVtZXJhdGVEZXZpY2VzKCkudGhlbihmdW5jdGlvbiAoZGV2aWNlcykge1xuICAgIGRldmljZXMuZm9yRWFjaChmdW5jdGlvbiAoZGV2aWNlKSB7XG4gICAgICBjb25zb2xlLmxvZyhkZXZpY2Uua2luZCArICc6ICcgKyBkZXZpY2UubGFiZWwgKyAnIChpZCA9ICcgKyBkZXZpY2UuZGV2aWNlSWQgKyAnKScpXG4gICAgICAvLyBlLmcuXG4gICAgICAvLyB2aWRlb2lucHV0OiBpZCA9IGNzTzljMFlwQWYyNzRPdUNQVUE1M0NORTBZSGxJcjJ5WENpK1NxZkJaWjg9XG4gICAgICAvLyBhdWRpb2lucHV0OiBpZCA9IFJLeFhCeWpuYWJiQURHUU5OWnFMVkxkbVhsUzBZa0VUWUNJYmcrWHhudk09XG4gICAgICAvLyBhdWRpb2lucHV0OiBpZCA9IHIyL3h3MXhVUEl5WnVuZlYxbEdyS09tYTV3VE92Q2tXZlozNjhYQ25kbTA9XG4gICAgICAvLyBvciBpZiBhY3RpdmUgb3IgcGVyc2lzdGVudCBwZXJtaXNzaW9ucyBhcmUgZ3JhbnRlZDpcbiAgICAgIC8vIHZpZGVvaW5wdXQ6IEZhY2VUaW1lIEhEIENhbWVyYSAoQnVpbHQtaW4pIGlkPWNzTzljMFlwQWYyNzRPdUNQVUE1M0NORTBZSGxJcjJ5WENpK1NxZkJaWjg9XG4gICAgICAvLyBhdWRpb2lucHV0OiBkZWZhdWx0IChCdWlsdC1pbiBNaWNyb3Bob25lKSBpZD1SS3hYQnlqbmFiYkFER1FOTlpxTFZMZG1YbFMwWWtFVFlDSWJnK1h4bnZNPVxuICAgICAgLy8gYXVkaW9pbnB1dDogQnVpbHQtaW4gTWljcm9waG9uZSBpZD1yMi94dzF4VVBJeVp1bmZWMWxHcktPbWE1d1RPdkNrV2ZaMzY4WENuZG0wPVxuICAgICAgdmFyIG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpXG4gICAgICBvcHRpb24udmFsdWUgPSBkZXZpY2UuZGV2aWNlSWRcbiAgICAgIGlmIChkZXZpY2Uua2luZCA9PT0gJ2F1ZGlvaW5wdXQnKSB7XG4gICAgICAgIG9wdGlvbi50ZXh0ID0gZGV2aWNlLmxhYmVsIHx8ICdNaWNyb3Bob25lICcgKyAoYXVkaW9JbnB1dFNlbGVjdC5sZW5ndGggKyAxKVxuICAgICAgICBhdWRpb0lucHV0U2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbilcbiAgICAgIH0gZWxzZSBpZiAoZGV2aWNlLmtpbmQgPT09ICdhdWRpb291dHB1dCcpIHtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBkZXZpY2UubGFiZWwgfHwgJ1NwZWFrZXIgJyArIChhdWRpb091dHB1dFNlbGVjdC5sZW5ndGggKyAxKVxuICAgICAgICBhdWRpb091dHB1dFNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24pXG4gICAgICB9IGVsc2UgaWYgKGRldmljZS5raW5kID09PSAndmlkZW9pbnB1dCcpIHtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBkZXZpY2UubGFiZWwgfHwgJ0NhbWVyYSAnICsgKHZpZGVvU2VsZWN0Lmxlbmd0aCArIDEpXG4gICAgICAgIHZpZGVvU2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbilcbiAgICAgIH1cbiAgICB9KVxuICB9KS5jYXRjaChoYW5kbGVFcnJvcilcbn1cblxuZnVuY3Rpb24gc25hcHNob3QgKGxvY2FsTWVkaWFTdHJlYW0pIHtcbiAgdmFyIGN0eCA9IHByb2Nlc3NpbmcuZ2V0Q29udGV4dCgnMmQnKSAvLyBjb250ZXh0XG4gIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICBwcm9jZXNzaW5nLndpZHRoID0gd2lkdGhcbiAgICBwcm9jZXNzaW5nLmhlaWdodCA9IGhlaWdodFxuICAgIC8vIGNhbnZhcy53aWR0aCA9IHZpZGVvLmNsaWVudFdpZHRoXG4gICAgLy8gY2FudmFzLmhlaWdodCA9IHZpZGVvLmNsaWVudEhlaWdodFxuXG4gICAgLy8gVGhlIDxjYW52YXM+IEFQSSdzIGN0eC5kcmF3SW1hZ2UodmlkZW8sIDAsIDApIG1ldGhvZFxuICAgIC8vIG1ha2VzIGl0IHRyaXZpYWwgdG8gZHJhdyA8dmlkZW8+IGZyYW1lcyB0byA8Y2FudmFzPi5cbiAgICBjdHguZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KVxuXG4gICAgLy8gdmFyIGRhdGEgPSBmaWx0ZXIuY3JhenkoY3R4KVxuICAgIHZhciBkYXRhID0gZmlsdGVyLmNyYXp5QWx0ZXJuYXRpdmUoY3R4KVxuICAgIGN0eC5wdXRJbWFnZURhdGEoZGF0YSwgMCwgMClcblxuICAgIC8vIFwiaW1hZ2Uvd2VicFwiIHdvcmtzIGluIENocm9tZS5cbiAgICAvLyBPdGhlciBicm93c2VycyB3aWxsIGZhbGwgYmFjayB0byBpbWFnZS9wbmcuXG4gICAgdmFyIGRhdGFVUkwgPSBwcm9jZXNzaW5nLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIDAuOTUpXG4gICAgaWYgKGRhdGFVUkwgJiYgZGF0YVVSTCAhPT0gJ2RhdGE6LCcpIHBob3RvLnNldEF0dHJpYnV0ZSgnc3JjJywgZGF0YVVSTClcbiAgICBlbHNlIGNvbnNvbGUuZXJyb3IoJ0ltYWdlIG5vdCBhdmFpbGFibGUnKVxuICB9IGVsc2UgY2xlYXJwaG90bygpXG59XG5cbmZ1bmN0aW9uIGNsZWFycGhvdG8gKCkge1xuICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykgLy8gY29udGV4dFxuICBjdHguZmlsbFN0eWxlID0gJyNBQUEnXG4gIGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpXG4gIHZhciBkYXRhID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJylcbiAgcGhvdG8uc2V0QXR0cmlidXRlKCdzcmMnLCBkYXRhKVxufVxuXG5mdW5jdGlvbiBzYXZlUGljdHVyZSAoZXZlbnQpIHtcbiAgdmFyIGZpbGVOYW1lID0gZ2VuZXJhdGVJbWFnZU5hbWUoKVxuICBmaWxlTmFtZSA9IGZpbGVOYW1lICsgJy50eHQnXG4gIHZhciBkYXRhVVJMID0gcGhvdG8uZ2V0QXR0cmlidXRlKCdzcmMnKVxuICBjb25zb2xlLmxvZygnRE9XTkxPQUQnLCBmaWxlTmFtZSwgZGF0YVVSTClcbiAgLy8gLi4uIHNhdmUvdXBsb2FkIGxvZ2ljIGhlcmUgLi4uXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW1hZ2VOYW1lICgpIHtcbiAgLy8gLi4uIGdlbmVyYXRlIGltYWdlIG5hbWUgbG9naWMgaGVyZSAuLi5cbiAgcmV0dXJuICdpbWFnZU5hbWUnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKVxufVxuXG5mdW5jdGlvbiBzdGFydCAoKSB7XG4gIHN0b3BWaWRlbygpXG4gIGNsZWFycGhvdG8oKVxuICAvLyB2YXIgYXVkaW9Tb3VyY2UgPSBhdWRpb0lucHV0U2VsZWN0LnZhbHVlXG4gIHZhciB2aWRlb1NvdXJjZSA9IHZpZGVvU2VsZWN0LnZhbHVlXG4gIC8vIHZhciBjb25zdHJhaW50cyA9IHsgdmlkZW86IHRydWUsIGF1ZGlvOiBmYWxzZSB9XG4gIC8vIHZhciBjb25zdHJhaW50cyA9IHsgdmlkZW86IHsgZmFjaW5nTW9kZTogJ3VzZXInIH0gfVxuICAvLyAgIHZhciBjb25zdHJhaW50cyA9IHtcbiAgLy8gICAgIGF1ZGlvOiB7IG9wdGlvbmFsOiBbe3NvdXJjZUlkOiBkZXZpY2UuZGV2aWNlSWR9XSB9LFxuICAvLyAgICAgdmlkZW86IHsgb3B0aW9uYWw6IFt7c291cmNlSWQ6IGRldmljZS5kZXZpY2VJZH1dIH1cbiAgLy8gICB9XG4gIC8vIHZhciBjb25zdHJhaW50cyA9IHsgYXVkaW86IHRydWUsIHZpZGVvOiB7IHdpZHRoOiAxMjgwLCBoZWlnaHQ6IDcyMCB9IH1cbiAgLy8gdmFyIGNvbnN0cmFpbnRzID0geyB2aWRlbzogeyBmcmFtZVJhdGU6IHsgaWRlYWw6IDEwLCBtYXg6IDE1IH0gfSB9XG4gIC8vIHZhciBjb25zdHJhaW50cyA9IHsgdmlkZW86IHsgZmFjaW5nTW9kZTogKGZyb250PyBcInVzZXJcIiA6IFwiZW52aXJvbm1lbnRcIikgfSB9XG4gIC8vIHZhciBjb25zdHJhaW50cyA9IHtcbiAgLy8gICB2aWRlbzoge1xuICAvLyAgICAgLy8gY29uc3RyYWludHM6IGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9tZWRpYWNhcHR1cmUtbWFpbi9nZXR1c2VybWVkaWEuaHRtbCNpZGwtZGVmLU1lZGlhVHJhY2tDb25zdHJhaW50c1xuICAvLyAgICAgbWFuZGF0b3J5OiB7IC8vIGhkQ29uc3RyYWludHNcbiAgLy8gICAgICAgbWluV2lkdGg6IDEyODAsXG4gIC8vICAgICAgIG1pbkhlaWdodDogNzIwXG4gIC8vICAgICB9XG4gIC8vICAgICAvLyBtYW5kYXRvcnk6IHsgLy8gdmdhQ29uc3RyYWludHNcbiAgLy8gICAgIC8vICAgbWF4V2lkdGg6IDY0MCxcbiAgLy8gICAgIC8vICAgbWF4SGVpZ2h0OiAzNjBcbiAgLy8gICAgIC8vIH1cbiAgLy8gICB9LFxuICAvLyAgIGF1ZGlvOiB0cnVlXG4gIC8vICAgLyouLi4qL1xuICAvLyB9XG4gIHZhciBjb25zdHJhaW50cyA9IHtcbiAgICAvLyBhdWRpbzogeyBkZXZpY2VJZDogYXVkaW9Tb3VyY2UgPyB7IGV4YWN0OiBhdWRpb1NvdXJjZSB9IDogdW5kZWZpbmVkIH0sXG4gICAgdmlkZW86IHsgZGV2aWNlSWQ6IHZpZGVvU291cmNlID8geyBleGFjdDogdmlkZW9Tb3VyY2UgfSA6IHVuZGVmaW5lZCB9XG4gIH1cbiAgaWYgKG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKSB7XG4gICAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpXG4gICAgICAudGhlbihnb3RTdHJlYW0pXG4gICAgICAuY2F0Y2goaGFuZGxlRXJyb3IpXG4gIH0gZWxzZSB7XG4gICAgdmlkZW8uc3JjID0gJ2ZhbGxiYWNrLndlYm0nXG4gIH1cbn1cblxuZnVuY3Rpb24gc3RvcFZpZGVvICgpIHtcbiAgaWYgKGxvY2FsTWVkaWFTdHJlYW0pIHtcbiAgICBsb2NhbE1lZGlhU3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2goZnVuY3Rpb24gKHRyYWNrKSB7IHRyYWNrLnN0b3AoKSB9KVxuICAgIGxvY2FsTWVkaWFTdHJlYW0gPSBudWxsXG4gIH1cbn1cblxuZnVuY3Rpb24gZ290U3RyZWFtIChzdHJlYW0pIHtcbiAgLy8gSW5zdGVhZCBvZiBmZWVkaW5nIHRoZSB2aWRlbyBhIFVSTCB0byBhIG1lZGlhIGZpbGUsIHdlJ3JlIGZlZWRpbmcgaXQgYVxuICAvLyBCbG9iIFVSTCBvYnRhaW5lZCBmcm9tIGEgTG9jYWxNZWRpYVN0cmVhbSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSB3ZWJjYW1cbiAgLy8gaHR0cHM6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL3dvcmtlcnMvYmFzaWNzLyN0b2MtaW5saW5ld29ya2Vycy1ibG9idXJpc1xuICAvLyB2aWRlby5zcmMgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChsb2NhbE1lZGlhU3RyZWFtKVxuICBsb2NhbE1lZGlhU3RyZWFtID0gc3RyZWFtXG4gIHZpZGVvLnNyY09iamVjdCA9IHN0cmVhbVxuXG4gIC8vIEFkZGluZyBjb250cm9scyBhbHNvIHdvcmtzIGFzIHlvdSdkIGV4cGVjdGVkXG4gIC8vIHZpZGVvLnBsYXkoKVxuICAvLyB2cy5cbiAgdmlkZW8ub25sb2FkZWRtZXRhZGF0YSA9IGZ1bmN0aW9uIChlKSB7IC8vIHRvIHVuZnJlZXplXG4gICAgdmlkZW8ucGxheSgpIC8vIG9yIDx2aWRlbyBhdXRvcGxheT48L3ZpZGVvPlxuICB9XG5cbiAgdmlkZW8ub25wbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICBkcmF3KHZpZGVvLCBjb250ZXh0LCA0MDAsIDMwMClcbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3ICh2aWRlbywgY29udGV4dCkge1xuICBjb250ZXh0LmRyYXdJbWFnZSh2aWRlbywgMCwgMCwgd2lkdGgsIGhlaWdodClcbiAgdmFyIGltYWdlID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodClcbiAgLy8gaW1hZ2UuZGF0YSA9IGZpbHRlci5jcmF6eShpbWFnZS5kYXRhKVxuICAvLyBpbWFnZS5kYXRhID0gZmlsdGVyLmNyYXp5QWx0ZXJuYXRpdmUoaW1hZ2UuZGF0YSlcbiAgaW1hZ2UuZGF0YSA9IGZpbHRlci5ncmV5c2NhbGUobnVsbCwgaW1hZ2UuZGF0YSlcbiAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2UsIDAsIDApXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBkcmF3KHZpZGVvLCBjb250ZXh0KSB9LCAxNikgLy8gZm9yIDYwIGZwc1xufVxuXG4vLyBmdW5jdGlvbiB2aWRlbzJjYW52YXMgKHZpZGVvLCBjYW52YXMpIHtcbi8vICAgdmFyIHZpZCA9IHZpZGVvIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJylcbi8vICAgcmV0dXJuIGltYWdlMmNhbnZhcyh2aWQsIGNhbnZhcylcbi8vIH1cbi8vIGZ1bmN0aW9uIGltYWdlMmNhbnZhcyAoaW1hZ2UsIGNhbnZhcykge1xuLy8gICB2YXIgY2FuID0gY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXG4vLyAgIGNhbi53aWR0aCA9IGltYWdlLndpZHRoXG4vLyAgIGNhbi5oZWlnaHQgPSBpbWFnZS5oZWlnaHRcbi8vICAgdmFyIGNvbnRleHQgPSBjYW4uZ2V0Q29udGV4dCgnMmQnKVxuLy8gICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMC8qLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0ICovKVxuLy8gICByZXR1cm4gY2FuXG4vLyB9XG4vL1xuLy8gZnVuY3Rpb24gY2FudmFzMmltYWdlIChjYW52YXMsIGltYWdlLCBmb3JtYXQpIHtcbi8vICAgdmFyIGltZyA9IGltYWdlIHx8IG5ldyBJbWFnZSgpIC8vIGEgbGl0dGxlIGJpdCBmYXN0ZXIgdGhhbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50XG4vLyAgIGltZy5zcmMgPSBjYW52YXMudG9EYXRhVVJMKGZvcm1hdCB8fCAnaW1hZ2UvcG5nJylcbi8vICAgcmV0dXJuIGltZ1xuLy8gfVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvciAoZXJyb3IpIHtcbiAgaWYgKGVycm9yKSBjb25zb2xlLmVycm9yKGVycm9yLm5hbWUgKyAnOiAnICsgZXJyb3IubWVzc2FnZSlcbiAgY29uc29sZS5lcnJvcignbmF2aWdhdG9yLmdldFVzZXJNZWRpYSBlcnJvcjogJywgZXJyb3IpXG59XG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBSRUNPUkRcbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gdmFyIG1lZGlhID0ge1xuLy8gICB2aWRlbzoge1xuLy8gICAgIHRhZzogJ3ZpZGVvJyxcbi8vICAgICB0eXBlOiAndmlkZW8vd2VibScsXG4vLyAgICAgZXh0OiAnLm1wNCdcbi8vICAgfSxcbi8vICAgYXVkaW86IHtcbi8vICAgICB0YWc6ICdhdWRpbycsXG4vLyAgICAgdHlwZTogJ2F1ZGlvL29nZycsXG4vLyAgICAgZXh0OiAnLm9nZydcbi8vICAgfVxuLy8gfVxuLy8gdmFyIHJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIoc3RyZWFtKVxuLy8gcmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4vLyAgIGNodW5rcy5wdXNoKGV2ZW50LmRhdGEpXG4vLyAgIGlmKHJlY29yZGVyLnN0YXRlID09ICdpbmFjdGl2ZScpICBtYWtlTGluaygpXG4vLyB9XG4vLyByZWNvcmRlci5zdGFydCgpXG4vLyAvLyBodHRwczovL2dpdGh1Yi5jb20vTWlkbzIyL01lZGlhUmVjb3JkZXItc2FtcGxlL2Jsb2IvbWFzdGVyL3NjcmlwdC5qc1xuLy8gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4vLyAgIHJlY29yZGVyLnN0b3AoKVxuLy8gfSwgNTAwMClcbi8vIGZ1bmN0aW9uIG1ha2VMaW5rKCl7XG4vLyAgIHZhciBibG9iID0gbmV3IEJsb2IoY2h1bmtzLCB7dHlwZTogbWVkaWEudHlwZSB9KVxuLy8gICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxuLy8gICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4vLyAgIHZhciBtdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobWVkaWEudGFnKVxuLy8gICB2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbi8vICAgbXQuY29udHJvbHMgPSB0cnVlXG4vLyAgIG10LnNyYyA9IHVybFxuLy8gICBoZi5ocmVmID0gdXJsXG4vLyAgIGhmLmRvd25sb2FkID0gYCR7Y291bnRlcisrfSR7bWVkaWEuZXh0fWBcbi8vICAgaGYuaW5uZXJIVE1MID0gYGRvbndsb2FkICR7aGYuZG93bmxvYWR9YFxuLy8gICBsaS5hcHBlbmRDaGlsZChtdClcbi8vICAgbGkuYXBwZW5kQ2hpbGQoaGYpXG4vLyAgIHVsLmFwcGVuZENoaWxkKGxpKVxuLy8gfVxuLy8gZnVuY3Rpb24gbWFrZUxpbmsoKSB7XG4vLyBjaHVua3MgPSBbXTtcbi8vIHJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIoc3RyZWFtKTtcbi8vIHJlY29yZGVyLm9uZGF0YWF2YWlsYWJsZSA9IGUgPT4ge1xuLy8gICBjaHVua3MucHVzaChlLmRhdGEpO1xuLy8gICBpZiAocmVjb3JkZXIuc3RhdGUgPT0gJ2luYWN0aXZlJykgbWFrZUxpbmsoKTtcbi8vIH07XG4vLyByZWNvcmRlci5zdG9wKCk7XG4vL1xuLy8gICBsZXQgYmxvYiA9IG5ldyBCbG9iKGNodW5rcywge1xuLy8gICAgICAgdHlwZTogbWVkaWEudHlwZVxuLy8gICAgIH0pLFxuLy8gICAgIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYiksXG4vL1xuLy8gICAgIG10ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChtZWRpYS50YWcpLFxuLy8gICAgIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuLy9cbi8vICAgbXQuY29udHJvbHMgPSB0cnVlO1xuLy8gICBtdC5zcmMgPSB1cmw7XG4vL1xuLy8gICBoZi5ocmVmID0gdXJsO1xuLy8gICBoZi5kb3dubG9hZCA9IGAke2NvdW50ZXIrK30ke21lZGlhLmV4dH1gO1xuLy8gICBoZi5pbm5lckhUTUwgPSBgZG9ud2xvYWQgJHtoZi5kb3dubG9hZH1gO1xuLy8gfVxuIl19