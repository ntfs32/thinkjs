'use strict';
/**
 * rest controller
 * @type {Class}
 */
export default class extends think.controller.rest {
  /**
   * init
   * @param  {Object} http []
   * @return {}      []
   */
  init(http){
    super.init(http);
  }
  /**
   * before magic method
   * @return {Promise} []
   */
  __before(){
    
  }

   * getAction(){
      this.cache('art',{id:12},1000);
      return this.success({res: yield this.cache('art')});
    }
}