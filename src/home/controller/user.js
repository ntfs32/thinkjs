'use strict'

import Base from './base.js'
import SammanClient from 'samman_auth' // 私有认证库
export default class extends Base {
  init(http){
    super.init(http)
    let SammanService = think.service('samman_auth') // thinkjs 服务类
     this.instance = new SammanClient('http://samman.adsame.com/index.php/api', '6c4f1a3dc2c6d4e97f69', 'yidongnew.adsame.com')
    // this.instance = new SammanService();
  }
  async listAction () {
    const list = await this.instance.getlist()
    return this.json(list)
  }

  async loginAction () {
    const result = await this.instance.login('shaddock_hu', 'sdg789037748')
    return result.login ? this.success(result.message):this.error(result.message)
  }

  testAction(){
    let en =  this.instance.generate('hushuang','key',100);
    en =  this.instance.generate('72e9Cxb6o3H/yicrN6A24MKSATn2JOeh/UzvlRnQIddJVPEN/g','key');
    this.success(en)
  }

  __call(){
    this.error('not found')
  }
}
