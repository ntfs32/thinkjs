'use strict'
const urlencode = require('urlencode')
const Promise = require('promise')
const superagent = require('superagent')
const crypto = require('crypto')
const agent = require('superagent-promise')(superagent, Promise)

function md5 (str) {
  return crypto.createHash('md5').update(str + '').digest('hex')
}

function time () {
  return parseInt(new Date().getTime() / 1000)
}

function microtime (timefloat) {
  const unixtimems = new Date().getTime()
  const sec = parseInt(unixtimems / 1000)
  return timefloat ? (unixtimems / 1000) : (unixtimems - (sec * 1000)) / 1000 + ' ' + sec
}

export default class extends think.service.base {
  /**
   * init
   * @return {}         []
   */
  init (...args) {
    super.init(...args)
    /**
     * API地址
     */
    this._apiUrl = args[0] ? args[0] : think.config('samman_auth.api')
    /**
     * API token
     */
    this._apiKey = args[1] ? args[1] : think.config('samman_auth.token')

    /**
     * 本地服务器域名
     */
    this._localUrl = args[3] ? args[3] : think.config('samman_auth.url') ? think.config('samman_auth.url') : think.host

    /**
     * 用户列表常量.
     *
     * @type int
     */
    this.USER_LIST = 1
    /**
     * 用户添加常量.
     *
     * @type int
     */
    this.USER_ADD = 2
    /**
     * 用户删除常量.
     *
     * @type int
     */
    this.USER_REMOVE = 3
    /**
     * 用户登陆常量.
     *
     * @type int
     */
    this.USER_LOGIN = 4
  }

  /**
   * 登录请求方法
   * @param {number} request_type - 请求类型
   * @param {object} args - 请求参数
   * @param {string} service_url - 服务器端记录的client 域名
   * @param {string} method - POST|GET
   */
  send (requesttype, args, serviceurl, method) {
    const requestparams = {'samman_action': requesttype, 'samman_args': args}
    const requestJSON = JSON.stringify(requestparams)
    const params =
    'samman_self=' +
    urlencode.encode(this._localUrl) +
    '&samman_request=' +
    urlencode.encode(this.generate(requestJSON, this._apiKey, 30, true))
    if (method === 'POST') {
      return agent(method, serviceurl)
        .send(params)
        .set('content-type', 'application/json')
        .set('cache-control', 'no-cache')
        .set('Content-Length', params.length).end().then(function (data) {
        return data.text
      })
    } if (method === 'GET') {
      return agent(method, serviceurl).end().then(function (data) {
        return data.text
      })
    }
  }

  /**
   * 解析SAMMAN请求来的数据
   * @param {string} message - 消息内容
   * @return {Object} 消息内容JSON
   */
  decryptRequest (message) {
    message = urlencode.decode(message)
    // 解析请求数据
    var result = {
      action: null,
      params: {}
    }
    var requestJSON = generate(message, this._apiKey)
    if (!requestJSON) {
      return result
    }
    var request = JSON.parse(requestJSON)
    switch (request['samman_action']) {
      case 2:
        // 处理添加用户
        result.action = 'add_user'
        result.params.pandaID = request['samman_args']['pandaID']
        result.params.user_name = request['samman_args']['username']
        // result.params.real_name = request ['samman_args'] ['chn_name']
        result.params.email = request['samman_args']['email']
        break
      case 3:
        // 处理删除用户
        result.action = 'del_user'
        result.params.clientUserID = request['samman_args']['clientUserID']
        break
      case 4:
        // 添加管理员
        result.action = 'add_admin'
        result.params.clientUserID = request['samman_args']['clientUserID']
        break
      case 5:
        // 删除管理员
        result.action = 'del_admin'
        result.params.clientUserID = request['samman_args']['clientUserID']
        break
    }
    return result
  }

  /**
   * 登录请求方法
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @return {promise} 查询结果 boolean
   */
  login (username, password) {
    const params = {'username': username, 'password': password}
    return this.send(this.USER_LOGIN, params, this._apiUrl + '/response', 'POST').then(function (data) {
      return data === 'true' ? true : false
    })
  }

  /**
   * 获取用户列表
   * @return {promise} 查询结果
   */
  getlist () {
    return this.send(this.USER_LIST, null, this._apiUrl + '/core', 'GET')
  }

  /**
   * ADSAME SAMMAN认证加密解密函数js实现
   * @param {string} str - 加密内容
   * @param {string} key - 密钥
   * @param {number} expiry - 有效期（秒） 默认值：0
   * @param {boolean} operation  加密动作：true ，解密动作：false 默认值：false
   * @returns {string}  返回内容
   */
  generate (str, key, expiry, operation) {
    operation = expiry || 'DECODE' // 存在有效期则为加密
    operation = operation || 'DECODE'
    key = key || ''
    expiry = expiry || 60
    const keyLength = 4
    key = md5(key)
    // 密匙a会参与加解密
    const keya = md5(key.substr(0, 16))
    // 密匙b会用来做数据完整性验证
    const keyb = md5(key.substr(16, 16))
    // 密匙c用于变化生成的密文
    const keyc = keyLength ? (operation === 'DECODE' ? str.substr(0, keyLength) : md5(microtime()).substr(-keyLength)) : ''
    // 参与运算的密匙
    const cryptkey = keya + md5(keya + keyc)

    var strbuf
    if (operation === 'DECODE') {
      str = str.substr(keyLength)
      strbuf = new Buffer(str, 'base64')
    } else {
      expiry = expiry ? expiry + time() : 0
      var tmpstr = expiry.toString()
      if (tmpstr.length >= 10) { str = tmpstr.substr(0, 10) + md5(str + keyb).substr(0, 16) + str } else {
        var count = 10 - tmpstr.length
        for (var i = 0; i < count; i++) {
          tmpstr = '0' + tmpstr
        }
        str = tmpstr + md5(str + keyb).substr(0, 16) + str
      }
      strbuf = new Buffer(str)
    }
    var box = new Array(256)
    for (let i = 0; i < 256; i++) {
      box[i] = i
    }
    var rndkey = []
    // 产生密匙簿
    for (let i = 0; i < 256; i++) {
      rndkey[i] = cryptkey.charCodeAt(i % cryptkey.length)
    }
    for (let j = i = 0; i < 256; i++) {
      j = (j + box[i] + rndkey[i]) % 256
      const tmp = box[i]
      box[i] = box[j]
      box[j] = tmp
    }
    var s = ''
    for (let a = 0, j = 0, i = 0; i < strbuf.length; i++) {
      a = (a + 1) % 256
      j = (j + box[a]) % 256
      const tmp = box[a]
      box[a] = box[j]
      box[j] = tmp
      // 从密匙簿得出密匙进行异或，再转成字符
      strbuf[i] = strbuf[i] ^ (box[(box[a] + box[j]) % 256])
    }

    if (operation === 'DECODE') {
      s = strbuf.toString()
      if ((s.substr(0, 10) === 0 || s.substr(0, 10) - time() > 0) && s.substr(10, 16) === md5(s.substr(26) + keyb).substr(0, 16)) {
        s = s.substr(26)
      } else {
        s = ''
      }
      return s
    } else {
      s = strbuf.toString('base64')
      const regex = new RegExp('=', 'g')
      s = s.replace(regex, '')
      s = keyc + s
      return s
    }
  }
}
