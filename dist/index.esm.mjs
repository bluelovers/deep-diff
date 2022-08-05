var e;

!function(e) {
  e.DiffEdit = "E", e.DiffNew = "N", e.DiffDeleted = "D", e.DiffArray = "A";
}(e || (e = {}));

const t = [ "N", "E", "A", "D" ];

class Diff {
  constructor(e, t) {
    this.kind = e, null != t && t.length && (this.path = t);
  }
}

class DiffEdit extends Diff {
  constructor(e, t, n) {
    super("E", e), this.lhs = t, this.rhs = n;
  }
}

class DiffNew extends Diff {
  constructor(e, t) {
    super("N", e), this.rhs = t;
  }
}

class DiffDeleted extends Diff {
  constructor(e, t) {
    super("D", e), this.lhs = t;
  }
}

class DiffArray extends Diff {
  constructor(e, t, n) {
    super("A", e), this.index = t, this.item = n;
  }
}

function arrayRemove(e, t) {
  return e.splice(t, 1);
}

function realTypeOf(e) {
  const t = typeof e;
  return "object" !== t ? t : e === Math ? "math" : null === e ? "null" : Array.isArray(e) ? "array" : "[object Date]" === Object.prototype.toString.call(e) ? "date" : "function" == typeof e.toString && /^\/.*\//.test(e.toString()) ? "regexp" : "object";
}

function hashThisString(e) {
  let t = 0;
  if (0 === e.length) return t;
  for (let n = 0; n < e.length; n++) t = (t << 5) - t + e.charCodeAt(n), t &= t;
  return t;
}

function getOrderIndependentHash(e) {
  let t = 0;
  const n = realTypeOf(e);
  if ("array" === n) {
    e.forEach((function(e) {
      t += getOrderIndependentHash(e);
    }));
    const r = normalizeHashDesc(n, {
      hash: t
    });
    return t + hashThisString(r);
  }
  if ("object" === n) {
    for (const r in e) if (e.hasOwnProperty(r)) {
      const i = normalizeHashDesc(n, {
        key: r,
        hash: getOrderIndependentHash(e[r])
      });
      t += hashThisString(i);
    }
    return t;
  }
  const r = normalizeHashDesc(n, {
    value: e
  });
  return t + hashThisString(r);
}

function normalizeHashDesc(e, t) {
  switch (e) {
   case "array":
    return `[ type: ${e} , hash: ${t.hash}]`;

   case "object":
    return `[ type: ${e}, key: ${t.key} , hash: ${t.hash}]`;

   default:
    return `[ type: ${e} , value: ${t.value}]`;
  }
}

function _deepDiff(e, t, n, r, i, f, a, s) {
  n = n || [], a = a || [];
  const h = (i = i || []).slice(0);
  if (null != f) {
    if (r) {
      if ("function" == typeof r && r(h, f)) return;
      if ("object" == typeof r) {
        if (r.prefilter && r.prefilter(h, f)) return;
        if (r.normalize) {
          const n = r.normalize(h, f, e, t);
          n && (e = n[0], t = n[1]);
        }
      }
    }
    h.push(f);
  }
  "regexp" === realTypeOf(e) && "regexp" === realTypeOf(t) && (e = e.toString(), t = t.toString());
  const o = typeof e, l = typeof t;
  let p, c, d, u;
  const D = "undefined" !== o || a && a.length > 0 && a[a.length - 1].lhs && Object.getOwnPropertyDescriptor(a[a.length - 1].lhs, f), g = "undefined" !== l || a && a.length > 0 && a[a.length - 1].rhs && Object.getOwnPropertyDescriptor(a[a.length - 1].rhs, f);
  if (!D && g) n.push(new DiffNew(h, t)); else if (!g && D) n.push(new DiffDeleted(h, e)); else if (realTypeOf(e) !== realTypeOf(t)) n.push(new DiffEdit(h, e, t)); else if ("date" === realTypeOf(e) && e - t != 0) n.push(new DiffEdit(h, e, t)); else if ("object" === o && null !== e && null !== t) {
    for (p = a.length - 1; p > -1; --p) if (a[p].lhs === e) {
      u = !0;
      break;
    }
    if (u) e !== t && n.push(new DiffEdit(h, e, t)); else {
      if (a.push({
        lhs: e,
        rhs: t
      }), Array.isArray(e)) {
        for (s && (e.sort((function(e, t) {
          return getOrderIndependentHash(e) - getOrderIndependentHash(t);
        })), t.sort((function(e, t) {
          return getOrderIndependentHash(e) - getOrderIndependentHash(t);
        }))), p = t.length - 1, c = e.length - 1; p > c; ) n.push(new DiffArray(h, p, new DiffNew(void 0, t[p--])));
        for (;c > p; ) n.push(new DiffArray(h, c, new DiffDeleted(void 0, e[c--])));
        for (;p >= 0; --p) _deepDiff(e[p], t[p], n, r, h, p, a, s);
      } else {
        const i = Object.keys(e).concat(Object.getOwnPropertySymbols(e)), f = Object.keys(t).concat(Object.getOwnPropertySymbols(t));
        for (p = 0; p < i.length; ++p) d = i[p], u = f.indexOf(d), u >= 0 ? (_deepDiff(e[d], t[d], n, r, h, d, a, s), 
        f[u] = null) : _deepDiff(e[d], void 0, n, r, h, d, a, s);
        for (p = 0; p < f.length; ++p) d = f[p], d && _deepDiff(void 0, t[d], n, r, h, d, a, s);
      }
      a.length = a.length - 1;
    }
  } else e !== t && ("number" === o && isNaN(e) && isNaN(t) || n.push(new DiffEdit(h, e, t)));
}

function observableDiff(e, t, n, r, i) {
  const f = [];
  if (_deepDiff(e, t, f, r, null, null, null, i), n) for (let e = 0; e < f.length; ++e) n(f[e]);
  return f;
}

function orderIndependentObservableDiff(e, t, n, r, i, f, a) {
  return _deepDiff(e, t, n, r, i, f, a, !0);
}

function deepDiff(e, t, n, r) {
  const i = observableDiff(e, t, r ? function(e) {
    e && r.push(e);
  } : void 0, n);
  return r || (i.length ? i : void 0);
}

function orderIndependentDiff(e, t, n, r) {
  const i = observableDiff(e, t, r ? function(e) {
    e && r.push(e);
  } : void 0, n, !0);
  return r || (i.length ? i : void 0);
}

function _applyArrayChange(e, t, n) {
  var r;
  if (null !== (r = n.path) && void 0 !== r && r.length) {
    let [r, i] = function _traversalObject(e, t) {
      const n = (t = t.slice()).pop();
      let r = e;
      return t.reduce(((e, t) => r = e[t]), r), [ r, n ];
    }(e[t], n.path);
    switch (n.kind) {
     case "A":
      _applyArrayChange(r[i], n.index, n.item);
      break;

     case "D":
      delete r[i];
      break;

     case "E":
     case "N":
      r[i] = n.rhs;
    }
  } else switch (n.kind) {
   case "A":
    _applyArrayChange(e[t], n.index, n.item);
    break;

   case "D":
    e = arrayRemove(e, t);
    break;

   case "E":
   case "N":
    e[t] = n.rhs;
  }
  return e;
}

function isIDiffNode(e) {
  return null != e && e && t.includes(e.kind);
}

function applyChange(e, t, n) {
  if (void 0 === n && isIDiffNode(t) && (n = t), e && n && n.kind) {
    let t = e, r = -1, i = n.path ? n.path.length - 1 : 0;
    for (;++r < i; ) void 0 === t[n.path[r]] && (t[n.path[r]] = void 0 !== n.path[r + 1] && "number" == typeof n.path[r + 1] ? [] : {}), 
    t = t[n.path[r]];
    switch (n.kind) {
     case "A":
      n.path && void 0 === t[n.path[r]] && (t[n.path[r]] = []), _applyArrayChange(n.path ? t[n.path[r]] : t, n.index, n.item);
      break;

     case "D":
      delete t[n.path[r]];
      break;

     case "E":
     case "N":
      t[n.path[r]] = n.rhs;
    }
  }
}

function revertArrayChange(e, t, n) {
  if (n.path && n.path.length) {
    let r, i = e[t], f = n.path.length - 1;
    for (r = 0; r < f; r++) i = i[n.path[r]];
    switch (n.kind) {
     case "A":
      revertArrayChange(i[n.path[r]], n.index, n.item);
      break;

     case "D":
     case "E":
      i[n.path[r]] = n.lhs;
      break;

     case "N":
      delete i[n.path[r]];
    }
  } else switch (n.kind) {
   case "A":
    revertArrayChange(e[t], n.index, n.item);
    break;

   case "D":
   case "E":
    e[t] = n.lhs;
    break;

   case "N":
    e = arrayRemove(e, t);
  }
  return e;
}

function revertChange(e, t, n) {
  if (e && t && null != n && n.kind) {
    let t, r, i = e;
    for (r = n.path.length - 1, t = 0; t < r; t++) void 0 === i[n.path[t]] && (i[n.path[t]] = {}), 
    i = i[n.path[t]];
    switch (n.kind) {
     case "A":
      revertArrayChange(i[n.path[t]], n.index, n.item);
      break;

     case "D":
     case "E":
      i[n.path[t]] = n.lhs;
      break;

     case "N":
      delete i[n.path[t]];
    }
  }
}

function applyDiff(e, t, n) {
  return e && t && observableDiff(e, t, (function(r) {
    n && !n(e, t, r) || applyChange(e, t, r);
  })), e;
}

function _applyDiffChangeCore(e, t, n) {
  return t.forEach((t => {
    n(e, !0, t);
  })), !0;
}

function applyDiffChange(e, t) {
  if (_applyDiffChangeCore(e, t, applyChange)) return e;
}

function revertDiffChange(e, t) {
  if (_applyDiffChangeCore(e, t, revertChange)) return e;
}

export { Diff, DiffArray, DiffDeleted, DiffEdit, DiffNew, e as EnumKinds, applyChange, applyDiff, applyDiffChange, deepDiff, deepDiff as default, deepDiff as diff, getOrderIndependentHash, isIDiffNode, observableDiff, orderIndependentDiff, orderIndependentObservableDiff, revertChange, revertDiffChange };
//# sourceMappingURL=index.esm.mjs.map
