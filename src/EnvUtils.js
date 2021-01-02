/**
 * Env variables
 */
class EnvUtils {
  /**
   * Return current environment (prod|dev)
   * @return {string}
   */
  static getEnv() {
    return process.env.NODE_ENV || EnvUtils.getDefaultEnv();
  }

  /**
   * @return {string}
   */
  static getDefaultEnv() {
    return EnvUtils.DEFAULT_ENV;
  }
}

EnvUtils.ENV_TYPES = ['dev', 'stage', 'acc', 'prod'];
EnvUtils.DEFAULT_ENV = EnvUtils.ENV_TYPES[0];

module.exports = EnvUtils;
