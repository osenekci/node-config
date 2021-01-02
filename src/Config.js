const fs = require('fs');
const EnvUtils = require('./EnvUtils');
const {promisify} = require('util');
const path = require('path');

/**
 * Config lib
 *
 * - Creating an instance
 * Config.create(CONFIG_DIR, ENV_TYPES).then((config) => {
 *   // Do something
 * });
 */
class Config {
  /**
   * @param {string} confDir
   */
  constructor(confDir) {
    this._configurations = {};
    this._confDir = confDir;
    this._envTypes = {};
    // Optimize types
    EnvUtils.ENV_TYPES.forEach((type) => {
      this._envTypes[type] = 1;
    });
  }

  /**
   * Create new config instance
   * @param {string} confDir
   * @return {Promise<Config>}
   */
  static async create(confDir) {
    const config = new Config(confDir);
    await config.load();
    return config;
  }

  /**
   * @return {Promise<void>}
   */
  async load() {
    const env = EnvUtils.getEnv();
    const files = await promisify(fs.readdir)(this._confDir);
    for (let i = 0; i < files.length; i++) {
      const confParts = this._parseFileName(files[i], env);
      if (confParts.env !== false && confParts.env !== env) {
        continue;
      }
      const file = path.join(this._confDir, files[i]);
      if (confParts.ext === 'json') {
        const conf = await promisify(fs.readFile)(file, 'utf8') + '';
        try {
          this._configurations[confParts.name] = JSON.parse(conf);
        } catch (e) {
          throw new Error(`Invalid JSON format for ${file}`);
        }
      } else if (confParts.ext === 'js') {
        this._configurations[confParts.name] = require(file);
      }
    }
  }

  /**
   * @param {string} fileName
   * @param {string} currentEnv
   * @return {{
   *  name:string,
   *  env:string
   * }}
   * @private
   */
  _parseFileName(fileName, currentEnv) {
    const parts = fileName.split('.');
    let env;
    let ext;
    if (parts.length === 3) {
      env = parts[1];
      ext = parts[2];
    } else {
      // No env
      env = false;
      ext = parts[1];
    }
    if (env !== false && typeof this._envTypes[env] === 'undefined') {
      // Fallback to current env
      env = currentEnv;
    }
    return {
      name: parts[0],
      env: env,
      ext: ext,
    };
  }

  /**
   * @param {string} path
   * @param {*} [defValue]
   * @return {*}
   */
  get(path, defValue) {
    const params = path.split('.');
    const fileName = params.shift();
    if (typeof this._configurations[fileName] === 'undefined') {
      return defValue;
    }
    try {
      return this._resolveRecursive(
        params, this._configurations[fileName]);
    } catch (e) {
      return defValue;
    }
  }

  /**
   * @param {Array.<string>} path
   * @param {Object.<string, *>} conf
   * @return {*}
   * @private
   */
  _resolveRecursive(path, conf) {
    if (path.length === 0) {
      return conf;
    }
    const current = path.shift();
    if (typeof conf[current] === 'undefined') {
      throw new Error('Invalid conf path');
    }
    if (path.length > 0) {
      return this._resolveRecursive(path, conf[current]);
    } else {
      return conf[current];
    }
  }
}

module.exports = Config;
