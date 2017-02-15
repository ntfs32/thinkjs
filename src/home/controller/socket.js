'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
    //auto render template file index_index.html
    return this.display();
  }

  openAction(self){
    var socket = self.http.socket;
      this.broadcast("new message", {
          username: socket.id,
          message: self.http.data
      },true);
  }

  closeAction(self){
      var socket = self.http.socket;
      this.broadcast(socket.id,'closed',true);
  }

  adduserAction(self) {
      console.log(this.get('sid'));
      var socket = self.http.socket;
      this.broadcast('adduser', socket.id + "说：" + this.http.data,true);
  }
}