"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
Devebot.require("logolite"); // load the Devebot's logolite first
const assert = require("liberica").assert;
const mockit = require("liberica").mockit;
const sinon = require("liberica").sinon;
const path = require("path");

describe("tdd:lib:core:mapping-loader", function() {
  let loggingFactory = lab.createLoggingFactoryMock();
  let CTX = {
    L: loggingFactory.getLogger(),
    T: loggingFactory.getTracer(),
  };

  describe("traverseDir()", function() {
    let MappingLoader, traverseDir, traverseDirRecursively;

    beforeEach(function() {
      MappingLoader = mockit.acquire("mapping-loader", {
        moduleHome: path.join(__dirname, "../../lib/backbone")
      });
      traverseDir = mockit.get(MappingLoader, "traverseDir");
      traverseDirRecursively = mockit.spy(MappingLoader, "traverseDirRecursively");

      assert.isFunction(traverseDir);
      assert.isFunction(traverseDirRecursively);
    });

    const MAPPING_DIR = ["", "home", "devebot", "example"].join(path.sep);
    const RELATIVE_DIR = ["", "mappings"].join(path.sep);

    it("should standardize the directory path", function() {
      let args;

      traverseDir("", [".js"]);
      args = traverseDirRecursively.getCall(0).args;
      assert.equal(args[0], ".");
      assert.equal(args[1], ".");
      traverseDirRecursively.resetHistory();

      traverseDir(path.sep, [".js"]);
      args = traverseDirRecursively.getCall(0).args;
      assert.equal(args[0], path.sep);
      assert.equal(args[1], path.sep);
      traverseDirRecursively.resetHistory();

      traverseDir(MAPPING_DIR, [".js"]);
      args = traverseDirRecursively.getCall(0).args;
      assert.equal(args[0], MAPPING_DIR);
      assert.equal(args[1], MAPPING_DIR);
      traverseDirRecursively.resetHistory();

      traverseDir(MAPPING_DIR + path.sep, [".js"]);
      args = traverseDirRecursively.getCall(0).args;
      assert.equal(args[0], MAPPING_DIR);
      assert.equal(args[1], MAPPING_DIR);
      traverseDirRecursively.resetHistory();
    });

    it("should match filenames with a RegExp", function() {
      let args;

      traverseDir(MAPPING_DIR, /\.js$/);
      args = traverseDirRecursively.getCall(0).args;
      const filter = args[2];
      // make sure the "filter" is a function
      assert.isFunction(filter);
      // assert that "filter" satisfied the provided regular expression
      // case 1: { path: "/mappings", base: "github-api.js" }
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github-api.js" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api.md" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github.jsi.md" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api.jsx" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api_js" }));
      assert.isFalse(filter({ path: ["", ".jszz.js"].join(path.sep), base: "github-api.md" }));
      traverseDirRecursively.resetHistory();
    });

    it("should match filenames with an array of extensions", function() {
      let args;

      traverseDir(MAPPING_DIR, ["jsi", "jsx", "zz", "JAR", "json", "html"]);
      args = traverseDirRecursively.getCall(0).args;
      const filter = args[2];

      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api.js" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api.md" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github.jsi.md" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github-api.jsx" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api_js" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github-api.json" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github-api.JAR" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github-api.exe" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github.json.exe" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github.png.exe" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "github.txt.exe" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github.html.jsx" }));

      // { path: "/.jszz.js", base: "github-api.md" } => relative-path: /.jszz.js/github-api.md
      assert.isTrue(filter({ path: ["", ".txtmd.html"].join(path.sep), base: "github-api.png" }));
      assert.isFalse(filter({ path: ["", ".png.exe"].join(path.sep), base: "github-api.js" }));
      assert.isTrue(filter({ path: ["", ".txtzz.js"].join(path.sep), base: "github-api.jsx" }));
      assert.isTrue(filter({ path: ["", ".JARpng.js"].join(path.sep), base: "github-api.txt" }));
      assert.isFalse(filter({ path: ["", ".exemd.js"].join(path.sep), base: "github-api.md" }));
      traverseDirRecursively.resetHistory();
    });

    it("should match filenames with a string", function() {
      let args;

      traverseDir(MAPPING_DIR, "mappings" + path.sep +"github");
      args = traverseDirRecursively.getCall(0).args;
      const filter = args[2];

      assert.isFalse(filter({ path: RELATIVE_DIR, base: "gitlab-api.js" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github-api.md" }));
      assert.isTrue(filter({ path: RELATIVE_DIR, base: "github.jsi.md" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "gitlab.jsi.zz" }));
      assert.isFalse(filter({ path: RELATIVE_DIR, base: "gitbranch-api.txt" }));
      assert.isFalse(filter({ path: ["", ".pngexe.js"].join(path.sep), base: "gitlab-api.txt" }));
      assert.isFalse(filter({ path: ["", ".jsxzz.js"].join(path.sep), base: "gitbranch-api.zz" }));
      traverseDirRecursively.resetHistory();
    });
  });

  describe("traverseDirRecursively()", function() {
    let loggingFactory = lab.createLoggingFactoryMock({ captureMethodCall: false });
    let ctx = {
      L: loggingFactory.getLogger(),
      T: loggingFactory.getTracer(),
      blockRef: "app-restfetch",
    };

    const MAPPING_HOME_DIR = ["", "home", "devebot", "example", "mappings"].join(path.sep);
    const statOfDirectory = {
      isDirectory: function() { return true; },
      isFile: function() { return false; },
    };
    const statOfFile = {
      isDirectory: function() { return false; },
      isFile: function() { return true; },
    };

    function mappingFileFilter (fileinfo) {
      return [".js"].indexOf(fileinfo.ext) >= 0;
    }

    let MappingLoader, traverseDirRecursively, fs;

    beforeEach(function() {
      MappingLoader = mockit.acquire("mapping-loader", {
        moduleHome: path.join(__dirname, "../../lib/backbone")
      });
      traverseDirRecursively = mockit.get(MappingLoader, "traverseDirRecursively");
      fs = mockit.stubObject(MappingLoader, "fs", ["readdirSync", "statSync"]);
    });

    it("get all of names of filtered files in a directory", function() {
      fs.readdirSync.withArgs(MAPPING_HOME_DIR)
        .returns([
          "github-api.js",
          "gitlab-api.js",
          "readme.md"
        ]);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "github-api.js")).returns(statOfFile);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "gitlab-api.js")).returns(statOfFile);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "readme.md")).returns(statOfFile);
      assert.deepEqual(traverseDirRecursively(MAPPING_HOME_DIR, MAPPING_HOME_DIR, mappingFileFilter), [
        {
          "home": MAPPING_HOME_DIR,
          "path": "",
          "dir": MAPPING_HOME_DIR,
          "base": "github-api.js",
          "name": "github-api",
          "ext": ".js"
        },
        {
          "home": MAPPING_HOME_DIR,
          "path": "",
          "dir": MAPPING_HOME_DIR,
          "base": "gitlab-api.js",
          "name": "gitlab-api",
          "ext": ".js"
        }
      ]);
    });

    it("get all of names of recursive filtered files in a directory", function() {
      fs.readdirSync.withArgs(MAPPING_HOME_DIR).returns([
        "api",
        "vcs",
        "doc",
        "index.js",
        "readme.md"
      ]);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "api")).returns(statOfDirectory);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs")).returns(statOfDirectory);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "doc")).returns(statOfDirectory);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "index.js")).returns(statOfFile);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "readme.md")).returns(statOfFile);

      fs.readdirSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs")).returns([
        "git"
      ]);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs", "git")).returns(statOfDirectory);

      fs.readdirSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs", "git")).returns([
        "github-api.js",
        "gitlab-api.js",
        "readme.md"
      ]);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs", "git", "github-api.js")).returns(statOfFile);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs", "git", "gitlab-api.js")).returns(statOfFile);
      fs.statSync.withArgs(path.join(MAPPING_HOME_DIR, "vcs", "git", "readme.md")).returns(statOfFile);

      assert.deepEqual(traverseDirRecursively(MAPPING_HOME_DIR, MAPPING_HOME_DIR, mappingFileFilter), [
        {
          "home": MAPPING_HOME_DIR,
          "path": path.join(path.sep, "vcs", "git"),
          "dir": path.join(MAPPING_HOME_DIR, "vcs", "git"),
          "base": "github-api.js",
          "name": "github-api",
          "ext": ".js"
        },
        {
          "home": MAPPING_HOME_DIR,
          "path": path.join(path.sep, "vcs", "git"),
          "dir": path.join(MAPPING_HOME_DIR, "vcs", "git"),
          "base": "gitlab-api.js",
          "name": "gitlab-api",
          "ext": ".js"
        },
        {
          "home": MAPPING_HOME_DIR,
          "path": "",
          "dir": MAPPING_HOME_DIR,
          "base": "index.js",
          "name": "index",
          "ext": ".js"
        }
      ]);
    });
  });

  describe("loadMappingStore()", function() {
    let loggingFactory = lab.createLoggingFactoryMock({ captureMethodCall: false });
    let ctx = {
      L: loggingFactory.getLogger(),
      T: loggingFactory.getTracer(),
      blockRef: "app-restfetch",
    };

    let MappingLoader, loadMappingStore, evaluateMappingFile, fs;

    beforeEach(function() {
      MappingLoader = lab.acquireFrameworkModule("backbone/mapping-loader");
      loadMappingStore = MappingLoader.__get__("loadMappingStore");
      fs = {
        statSync: sinon.stub()
      };
      MappingLoader.__set__("fs", fs);
    });
  });
});
