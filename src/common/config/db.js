'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mysql',
  adapter: {
    mysql: {
      host: '127.0.0.1',
      port: '',
      database: 'thinkjs',
      user: 'root',
      password: 'point9*',
      prefix: 'thinkjs_',
      encoding: 'utf8'
    },
    mongo: {

    }
  }
};