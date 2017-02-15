'use strict';
const urlencode = require('urlencode'),
    Promise = require('promise'),
    super_agent = require('superagent'),
    crypto = require('crypto'),
    agent = require('superagent-promise')(super_agent, Promise);

function md5(str) {
    return crypto.createHash('md5').update(str + "").digest('hex');
}

function time() {
    return parseInt(new Date().getTime() / 1000);
}

function microtime(get_as_float) {
    const unixtime_ms = new Date().getTime();
    const sec = parseInt(unixtime_ms / 1000);
    return get_as_float ? (unixtime_ms / 1000) : (unixtime_ms - (sec * 1000)) / 1000 + ' ' + sec;
}

export default class extends think.service.base {
  /**
   * init
   * @return {}         []
   */
  init(...args){
      super.init(...args);
      /**
       * API地址
       */
      this._apiUrl = args[0]?args[0]:think.config('samman_auth.api');

      /**
       * API token
       */
      this._apiKey = args[1]?args[1]:think.config('samman_auth.token');


      /**
       * 本地服务器域名
       */
      this._localUrl = args[3]?args[3]:think.config('samman_auth.url')?think.config('samman_auth.url'):think.host;

      this.encrypt = 'ENCODE';

      this.decrypt = 'DECODE';

      /**
       * 用户列表常量.
       *
       * @type int
       */
      this.USER_LIST = 1;
      /**
       * 用户添加常量.
       *
       * @type int
       */
      this.USER_ADD = 2;
      /**
       * 用户删除常量.
       *
       * @type int
       */
      this.USER_REMOVE = 3;
      /**
       * 用户登陆常量.
       *
       * @type int
       */
      this.USER_LOGIN = 4;
  }

    /**
     * 登录请求方法
     * @param {number} request_type - 请求类型
     * @param {object} args - 请求参数
     * @param {string} service_url - 服务器端记录的client 域名
     * @param {string} method - POST|GET
     */
    handler(request_type, args, service_url, method) {
        const request_params = {'samman_action': request_type, 'samman_args': args};
        const requestJSON = JSON.stringify(request_params);
        const params =
            'samman_self='
            + urlencode.encode(this._localUrl)
            + '&samman_request='
            + urlencode.encode(this.generate(requestJSON, this.encrypt, this._apiKey));
        if (method == 'POST') {
            return agent(method, service_url)
                .send(params)
                .set('content-type', 'application/x-www-form-urlencoded')
                .set('cache-control', 'no-cache')
                .set('Content-Length', params.length).end();
        } if (method == 'GET'){
            return agent(method, service_url).end();
        }
    };



    login(username,password){
        const params = {"username": username, "password": password};
        return this.handler(this.USER_LOGIN,params,this._apiUrl+'/response','POST');
    };

    get_user_list () {
        return this.handler(this.USER_LIST, null, this._apiUrl+'/core', "GET");
    };


    /**
     * ADSAME SAMMAN认证js实现
     * @param str  加密内容
     * @param operation  加密动作 ENCODE/DECODE
     * @param key  密钥
     * @param expiry  有效期
     * @returns {string}  返回加密内容
     */
     generate(str, operation, key, expiry) {
        operation = operation ? operation : 'DECODE';
        key = key ? key : '';
        expiry = expiry ? expiry : 0;

        const key_length = 4;
        key = md5(key);

        // 密匙a会参与加解密
        const keya = md5(key.substr(0, 16));
        // 密匙b会用来做数据完整性验证
        const keyb = md5(key.substr(16, 16));
        // 密匙c用于变化生成的密文
        const keyc = key_length ? (operation == 'DECODE' ? str.substr(0, key_length) : md5(microtime()).substr(-key_length)) : '';
        // 参与运算的密匙
        const cryptkey = keya + md5(keya + keyc);

        var strbuf;
        if (operation == 'DECODE') {
            str = str.substr(key_length);
            strbuf = new Buffer(str, 'base64');
        }
        else {
            expiry = expiry ? expiry + time() : 0;
            var tmpstr = expiry.toString();
            if (tmpstr.length >= 10)
                str = tmpstr.substr(0, 10) + md5(str + keyb).substr(0, 16) + str;
            else {
                var count = 10 - tmpstr.length;
                for (var i = 0; i < count; i++) {
                    tmpstr = '0' + tmpstr;
                }
                str = tmpstr + md5(str + keyb).substr(0, 16) + str;
            }
            strbuf = new Buffer(str);
        }


        var box = new Array(256);
        for (var i = 0; i < 256; i++) {
            box[i] = i;
        }
        var rndkey = new Array();
        // 产生密匙簿
        for (var i = 0; i < 256; i++) {
            rndkey[i] = cryptkey.charCodeAt(i % cryptkey.length);
        }
        // 用固定的算法，打乱密匙簿，增加随机性，好像很复杂，实际上对并不会增加密文的强度
        for (var j = i = 0; i < 256; i++) {
            j = (j + box[i] + rndkey[i]) % 256;
            const tmp = box[i];
            box[i] = box[j];
            box[j] = tmp;
        }


        // 核心加解密部分
        var s = '';
        for (var a = j = i = 0; i < strbuf.length; i++) {
            a = (a + 1) % 256;
            j = (j + box[a]) % 256;
            const tmp = box[a];
            box[a] = box[j];
            box[j] = tmp;
            // 从密匙簿得出密匙进行异或，再转成字符
            strbuf[i] = strbuf[i] ^ (box[(box[a] + box[j]) % 256])
        }

        if (operation == 'DECODE') {
            var s = strbuf.toString();
            if ((s.substr(0, 10) == 0 || s.substr(0, 10) - time() > 0) && s.substr(10, 16) == md5(s.substr(26) + keyb).substr(0, 16)) {
                s = s.substr(26);
            } else {
                s = '';
            }
        }
        else {
            var s = strbuf.toString('base64');

            const regex = new RegExp('=', "g");
            s = s.replace(regex, '');
            s = keyc + s;
        }
        return s;
    }

}

