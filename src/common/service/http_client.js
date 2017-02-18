'use strict';

/**
 * @class Http请求类封装
 */

import urlencode from 'urlencode'
import Promise from 'promise'
import superagent from 'superagent'
import crypto from 'crypto'
import superagentPromise from 'superagent-promise'

export default class extends think.service.base {
  /**
   * init
   * @return {}         []
   */
  init(...args){
    super.init(...args);
    this.agent = superagentPromise(superagent, Promise);
  }

/**
 * @param {string} url
 * @param {string} param
 * @param {Object} header
 */
 postAsync(url,params,header){
    header = header?header:{'content-type': 'application/x-www-form-urlencoded','cache-control':'no-cache'};
    return this.agent('post', url)
        .send(params)
        .set(header)
        .set('Content-Length', params.length).end()
        .then(function (data) {
        return data.text
      });
  }


/**
 * @param {string} url
 * @param {string} params
 * @param {Object} header
 */
  getAsync(url,params,header){
    return this.agent.get(url).query(params).end().then(function (data) {
        return data.text
      })
  }
}