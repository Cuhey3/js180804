function format() {
  var args = Array.from(arguments);
  if (args.length === 0) {
    return "";
  } else if (args.length === 1) {
    return args[0];
  } else {
    var str = args.shift(0).split("%s");
    var result = [str.shift()];
    while (str.length > 0) {
      result.push(args.shift() || "");
      result.push(str.shift());
    }
    return result.join("");
  }
}

// all user-defined filters that run on nunjucks
const customFilters = {
  format,
  funcApply: function() {
    const [func, ...args] = Array.from(arguments);
    return func.apply(this, args);
  },
  demo: {
    doFunc: function(func) {
      return func();
    },
    returnFunc: function(str) {
      return function() {
        return str;
      };
    },
    mapFunc: function(func) {
      return function() {
        return func() + func();
      };
    },
    helloWorld: function() {
      return 'Hello World!';
    },
    createGreeting: function(greetingWord) {
      return function(name) {
        return format(greetingWord, name);
      };
    }
  }
};

customFilters.user = {
  'helloWorld': function() {
    return 'Hello World!';
  }
};

customFilters.funcImport = function(path, ...keys) {
  // this.ctx is local variable reference on view
  const viewContext = this.ctx;
  let importTarget;
  if (typeof path !== 'string') {
    return;
  } else if (path === "" || path === "*") {
    importTarget = customFilters;
  } else if (path.indexOf(".") === -1) {
    importTarget = customFilters[path];
  } else {
    importTarget = getNestedValue(customFilters, path.split("."));
  }
  if (!importTarget) {
    throw new Error('import error. path:' + path + ", keys: " + keys);
  }
  if (typeof importTarget === 'function') {
    if (!keys || keys.length === 0) {
      viewContext[path] = importTarget;
    } else {
      return;
    }
  } else if (importTarget && typeof importTarget === "object" && !Array.isArray(importTarget)) {
    const importAllFlag = false;
    if (!keys || keys.length === 0 || keys.some(function(key) {
        return key === '*';
      })) {
      importAllFlag = true;
    }
    if (importAllFlag) {
      Object.assign(viewContext, importTarget);
    } else {
      keys.filter(function(key) {
        return key in importTarget;
      }).forEach(function(key) {
        viewContext[key] = importTarget[key];
      });
    }
  }
};

// object nested access using key array e.g. ["foo","bar","wao"]
function getNestedValue(obj, keyArray) {
  if (!Array.isArray(keyArray) || keyArray.length === 0) {
    return undefined;
  } else {
    const key = keyArray.shift();
    if (obj && typeof obj === 'object' && key in obj) {
      if (keyArray.length === 0) {
        return obj[key];
      } else {
        return getNestedValue(obj[key], keyArray);
      }
    }
  }
  return undefined;
}

customFilters.filterImport = function(packageName, ...filterNames) {
  var ctx = this.ctx;
  filterNames.forEach(function(filterName) {
    ctx[filterName] = customFilters[packageName][filterName];
  });
};

function setNestedFunc(env, anyType, parents = []) {
  if (typeof anyType === 'function') {
    env.addFilter(parents.join("."), anyType);
  } else if (anyType && typeof anyType === 'object' && !Array.isArray(anyType)) {
    Object.keys(anyType).forEach(function(key) {
      setNestedFunc(env, anyType[key], parents.concat(key));
    });
  }
}

module.exports = {
  addAllFilters: function(nunjucksEnvironment) {
    setNestedFunc(nunjucksEnvironment, customFilters);
  }
};
