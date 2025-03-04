'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

exports.EnumKinds = void 0;

(function (EnumKinds) {
  EnumKinds["DiffEdit"] = "E";
  EnumKinds["DiffNew"] = "N";
  EnumKinds["DiffDeleted"] = "D";
  EnumKinds["DiffArray"] = "A";
})(exports.EnumKinds || (exports.EnumKinds = {}));

const validKinds = ["N", "E", "A", "D"];
class Diff {
  constructor(kind, path) {
    this.kind = kind;

    if (path !== null && path !== void 0 && path.length) {
      this.path = path;
    }
  }

}
class DiffEdit extends Diff {
  constructor(path, lhs, rhs) {
    super("E", path);
    this.lhs = lhs;
    this.rhs = rhs;
  }

}
class DiffNew extends Diff {
  constructor(path, rhs) {
    super("N", path);
    this.rhs = rhs;
  }

}
class DiffDeleted extends Diff {
  constructor(path, lhs) {
    super("D", path);
    this.lhs = lhs;
  }

}
class DiffArray extends Diff {
  constructor(path, index, item) {
    super("A", path);
    this.index = index;
    this.item = item;
  }

}

function arrayRemove(arr, from) {
  return arr.splice(from, 1);
}

function realTypeOf(subject) {
  const type = typeof subject;

  if (type !== 'object') {
    return type;
  }

  if (subject === Math) {
    return 'math';
  } else if (subject === null) {
    return 'null';
  } else if (Array.isArray(subject)) {
    return 'array';
  } else if (Object.prototype.toString.call(subject) === '[object Date]') {
    return 'date';
  } else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
    return 'regexp';
  }

  return 'object';
}

function hashThisString(string) {
  let hash = 0;

  if (string.length === 0) {
    return hash;
  }

  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash;
}

function getOrderIndependentHash(object) {
  let accum = 0;
  const type = realTypeOf(object);

  if (type === 'array') {
    object.forEach(function (item) {
      accum += getOrderIndependentHash(item);
    });
    const arrayString = normalizeHashDesc(type, {
      hash: accum
    });
    return accum + hashThisString(arrayString);
  } else if (type === 'object') {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        const keyValueString = normalizeHashDesc(type, {
          key,
          hash: getOrderIndependentHash(object[key])
        });
        accum += hashThisString(keyValueString);
      }
    }

    return accum;
  }

  const stringToHash = normalizeHashDesc(type, {
    value: object
  });
  return accum + hashThisString(stringToHash);
}

function normalizeHashDesc(type, options) {
  switch (type) {
    case 'array':
      return `[ type: ${type} , hash: ${options.hash}]`;

    case 'object':
      return `[ type: ${type}, key: ${options.key} , hash: ${options.hash}]`;

    default:
      return `[ type: ${type} , value: ${options.value}]`;
  }
}

function _deepDiff(lhs, rhs, changes, prefilter, path, key, stack, orderIndependent) {
  changes = changes || [];
  path = path || [];
  stack = stack || [];
  const currentPath = path.slice(0);

  if (typeof key !== 'undefined' && key !== null) {
    if (prefilter) {
      if (typeof prefilter === 'function' && prefilter(currentPath, key)) {
        return;
      } else if (typeof prefilter === 'object') {
        if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
          return;
        }

        if (prefilter.normalize) {
          const alt = prefilter.normalize(currentPath, key, lhs, rhs);

          if (alt) {
            lhs = alt[0];
            rhs = alt[1];
          }
        }
      }
    }

    currentPath.push(key);
  }

  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString();
    rhs = rhs.toString();
  }

  const ltype = typeof lhs;
  const rtype = typeof rhs;
  let i, j, k, other;
  const ldefined = ltype !== 'undefined' || stack && stack.length > 0 && stack[stack.length - 1].lhs && Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key);
  const rdefined = rtype !== 'undefined' || stack && stack.length > 0 && stack[stack.length - 1].rhs && Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key);

  if (!ldefined && rdefined) {
    changes.push(new DiffNew(currentPath, rhs));
  } else if (!rdefined && ldefined) {
    changes.push(new DiffDeleted(currentPath, lhs));
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (ltype === 'object' && lhs !== null && rhs !== null) {
    for (i = stack.length - 1; i > -1; --i) {
      if (stack[i].lhs === lhs) {
        other = true;
        break;
      }
    }

    if (!other) {
      stack.push({
        lhs: lhs,
        rhs: rhs
      });

      if (Array.isArray(lhs)) {
        if (orderIndependent) {
          lhs.sort(function (a, b) {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b);
          });
          rhs.sort(function (a, b) {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b);
          });
        }

        i = rhs.length - 1;
        j = lhs.length - 1;

        while (i > j) {
          changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
        }

        while (j > i) {
          changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
        }

        for (; i >= 0; --i) {
          _deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack, orderIndependent);
        }
      } else {
        const akeys = Object.keys(lhs).concat(Object.getOwnPropertySymbols(lhs));
        const pkeys = Object.keys(rhs).concat(Object.getOwnPropertySymbols(rhs));

        for (i = 0; i < akeys.length; ++i) {
          k = akeys[i];
          other = pkeys.indexOf(k);

          if (other >= 0) {
            _deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);

            pkeys[other] = null;
          } else {
            _deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack, orderIndependent);
          }
        }

        for (i = 0; i < pkeys.length; ++i) {
          k = pkeys[i];

          if (k) {
            _deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
          }
        }
      }

      stack.length = stack.length - 1;
    } else if (lhs !== rhs) {
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  } else if (lhs !== rhs) {
    if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  }
}

function observableDiff(lhs, rhs, observer, prefilter, orderIndependent) {
  const changes = [];

  _deepDiff(lhs, rhs, changes, prefilter, null, null, null, orderIndependent);

  if (observer) {
    for (let i = 0; i < changes.length; ++i) {
      observer(changes[i]);
    }
  }

  return changes;
}
function orderIndependentObservableDiff(lhs, rhs, changes, prefilter, path, key, stack) {
  return _deepDiff(lhs, rhs, changes, prefilter, path, key, stack, true);
}
function deepDiff(lhs, rhs, prefilter, accum) {
  const observer = accum ? function (difference) {
    if (difference) {
      accum.push(difference);
    }
  } : undefined;
  const changes = observableDiff(lhs, rhs, observer, prefilter);
  return accum ? accum : changes.length ? changes : undefined;
}
function orderIndependentDiff(lhs, rhs, prefilter, accum) {
  const observer = accum ? function (difference) {
    if (difference) {
      accum.push(difference);
    }
  } : undefined;
  const changes = observableDiff(lhs, rhs, observer, prefilter, true);
  return accum ? accum : changes.length ? changes : undefined;
}

function _traversalObject(target, path) {
  path = path.slice();
  const key = path.pop();
  let it = target;
  path.reduce((target, key) => {
    return it = target[key];
  }, it);
  return [it, key];
}

function _applyArrayChange(arr, index, change) {
  var _change$path;

  if ((_change$path = change.path) !== null && _change$path !== void 0 && _change$path.length) {
    let [it, key] = _traversalObject(arr[index], change.path);

    switch (change.kind) {
      case 'A':
        _applyArrayChange(it[key], change.index, change.item);

        break;

      case 'D':
        delete it[key];
        break;

      case 'E':
      case 'N':
        it[key] = change.rhs;
        break;
    }
  } else {
    switch (change.kind) {
      case 'A':
        _applyArrayChange(arr[index], change.index, change.item);

        break;

      case 'D':
        arr = arrayRemove(arr, index);
        break;

      case 'E':
      case 'N':
        arr[index] = change.rhs;
        break;
    }
  }

  return arr;
}

function isIDiffNode(source) {
  return (source !== null && source !== void 0 ? source : false) && validKinds.includes(source.kind);
}
function applyChange(target, source, change) {
  if (typeof change === 'undefined' && isIDiffNode(source)) {
    change = source;
  }

  if (target && change && change.kind) {
    let it = target,
        i = -1,
        last = change.path ? change.path.length - 1 : 0;

    while (++i < last) {
      if (typeof it[change.path[i]] === 'undefined') {
        it[change.path[i]] = typeof change.path[i + 1] !== 'undefined' && typeof change.path[i + 1] === 'number' ? [] : {};
      }

      it = it[change.path[i]];
    }

    switch (change.kind) {
      case 'A':
        if (change.path && typeof it[change.path[i]] === 'undefined') {
          it[change.path[i]] = [];
        }

        _applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item);

        break;

      case 'D':
        delete it[change.path[i]];
        break;

      case 'E':
      case 'N':
        it[change.path[i]] = change.rhs;
        break;
    }
  }
}

function revertArrayChange(arr, index, change) {
  if (change.path && change.path.length) {
    let it = arr[index],
        i,
        u = change.path.length - 1;

    for (i = 0; i < u; i++) {
      it = it[change.path[i]];
    }

    switch (change.kind) {
      case "A":
        revertArrayChange(it[change.path[i]], change.index, change.item);
        break;

      case "D":
        it[change.path[i]] = change.lhs;
        break;

      case "E":
        it[change.path[i]] = change.lhs;
        break;

      case "N":
        delete it[change.path[i]];
        break;
    }
  } else {
    switch (change.kind) {
      case "A":
        revertArrayChange(arr[index], change.index, change.item);
        break;

      case "D":
        arr[index] = change.lhs;
        break;

      case "E":
        arr[index] = change.lhs;
        break;

      case "N":
        arr = arrayRemove(arr, index);
        break;
    }
  }

  return arr;
}

function revertChange(target, source, change) {
  if (target && source && change !== null && change !== void 0 && change.kind) {
    let it = target,
        i,
        u;
    u = change.path.length - 1;

    for (i = 0; i < u; i++) {
      if (typeof it[change.path[i]] === 'undefined') {
        it[change.path[i]] = {};
      }

      it = it[change.path[i]];
    }

    switch (change.kind) {
      case "A":
        revertArrayChange(it[change.path[i]], change.index, change.item);
        break;

      case "D":
        it[change.path[i]] = change.lhs;
        break;

      case "E":
        it[change.path[i]] = change.lhs;
        break;

      case "N":
        delete it[change.path[i]];
        break;
    }
  }
}
function applyDiff(target, source, filter) {
  if (target && source) {
    const onChange = function (change) {
      if (!filter || filter(target, source, change)) {
        applyChange(target, source, change);
      }
    };

    observableDiff(target, source, onChange);
  }

  return target;
}

function _applyDiffChangeCore(lhs, differences, fn) {
  differences.forEach(it => {
    fn(lhs, true, it);
  });
  return true;
}

function applyDiffChange(lhs, differences) {
  if (_applyDiffChangeCore(lhs, differences, applyChange)) {
    return lhs;
  }
}
function revertDiffChange(lhs, differences) {
  if (_applyDiffChangeCore(lhs, differences, revertChange)) {
    return lhs;
  }
}

exports.Diff = Diff;
exports.DiffArray = DiffArray;
exports.DiffDeleted = DiffDeleted;
exports.DiffEdit = DiffEdit;
exports.DiffNew = DiffNew;
exports.applyChange = applyChange;
exports.applyDiff = applyDiff;
exports.applyDiffChange = applyDiffChange;
exports.deepDiff = deepDiff;
exports["default"] = deepDiff;
exports.diff = deepDiff;
exports.getOrderIndependentHash = getOrderIndependentHash;
exports.isIDiffNode = isIDiffNode;
exports.observableDiff = observableDiff;
exports.orderIndependentDiff = orderIndependentDiff;
exports.orderIndependentObservableDiff = orderIndependentObservableDiff;
exports.revertChange = revertChange;
exports.revertDiffChange = revertDiffChange;
//# sourceMappingURL=index.cjs.development.cjs.map
