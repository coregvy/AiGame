/*************************************
 * このスクリプトはゲーム毎に変更しない
 *************************************/

class SocketManage {
  constructor(room, wsurl) {
    this.retryInterval = 1000;
    this.onStep = [];
    this.onReload = [];
    this.roomPath = room;
    this.wsURL = wsurl || `wss://www.tomiko.cf/red/api/con4/${this.roomPath}`;
    this.initConnection();
  }
  initConnection() {
    const self = this;
    this.socket = new WebSocket(self.wsURL);
    this.socket.onopen = function (event) {
      console.log(`${new Date().toLocaleTimeString()} ws con ok.`, event);
      self.send({ call: 'reload' });
    };
    this.socket.onclose = function (event) {
      console.log(`${new Date().toLocaleTimeString()} ws con close`, event);
      // reconnection
      self.initConnection();
    };
    this.socket.onerror = function (event) {
      console.error(`${new Date().toLocaleTimeString()} ws con error`, event);
    };
    this.initMessageProc();
  }
  dispose() {
    this.socket.onclose = _ => null;
    this.socket.onerror = _ => null;
  }
  send(data) {
    console.log(`${new Date().toLocaleTimeString()} ws send`, data);
    this.socket.send(JSON.stringify(data));
  }
  initMessageProc() {
    const self = this;
    self.socket.onmessage = function (event) {
      const data = JSON.parse(event.data);
      console.log(`${new Date().toLocaleTimeString()} ws message ${data.call}: `, data);
      if (data.message) DebugCtrl.addWsMessage(`${data.call}: ${data.message}`);
      switch(data.call) {
        // case 'login':     // {user0: 'name or null', user1: 'name or null', ready: true}
        //   self.onLogin.forEach(f => f(data));
        //   break;
        case 'step':      // {player: 0 or 1, stdout: '5', stdin: 'x x x\n.....\n'}
          self.onStep.forEach(function(f) { f(data); });
          break;
        case 'reload':
          self.onReload.forEach(function(f) { f(data); });
          break;
        case 'end':
          self.onStep.forEach(function(f) { f(data); });
          break;
        default:
          console.error('unknown message: ' + data.call, data);
          break;
      }
    }
  }
}


