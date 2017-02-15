'use strict';

import Base from './base.js';
import Sammam_Client from '../../common/service/samman_client';
export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
      //auto render template file index_index.html
    return this.display();
  }

  * listAction(){
      let sammanService = think.service("samman_auth");
      let instance = new sammanService('http://samman.adsame.com/index.php/api','6c4f1a3dc2c6d4e97f69','yidongnew.adsame.com');
    const list = yield instance.get_user_list();
    return this.json(list.text);
  }
  *loginAction(){
      let sammanService = think.service("samman_auth");
      let instance = new sammanService();
      const result = yield instance.login('shaddock_hu','sdg789037748');
      return this.json(result.text);
  }

    *login1Action(){
        let instance = new Sammam_Client('http://samman.adsame.com/index.php/api','6c4f1a3dc2c6d4e97f69','yidongnew.adsame.com');
        const result = yield instance.login('shaddock_hu','sdg789037748');
        return this.json(result.text);
    }
}