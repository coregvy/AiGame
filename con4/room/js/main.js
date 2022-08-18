

const Config = {
  MaxRow: 6,
  MaxCol: 7,
  Goal: 4,      // 並べれば勝てる数
  CoinColor: [  // cssに合わせること
    'red',
    'yellow'
  ],
  NoLoginUserName: '参加待ち',
  ManualUserName: '手動操作: ',
  DemoUserName: 'AI: ',
  ApiBaseUrl: 'localhost:8001/red/api/con4/'
};

class Param {
  static manualSelectTop(row) {
    return 125 + row * 75;
  }
}

class DebugCtrl {
  /**
   * constructor
   * @param {PlayerCtrl} pc player controller
   */
  constructor(pc) {
    this.playerCtrl = pc;
    this.showonly = false;
    this.loginDlg = null;
    this.openDlgUser = -1;  // 0 or 1
  }

  static confDlg = null;
  static confirmMessage = '';
  /**
   * called only once after open the page.
   * @param {boolean} showonly if true, play client AI only.
   */
  init(showonly) {
    const self = this;
    self.showonly = showonly;
    // $('#ctrl>button').attr('disabled', true);
    $('#game-end').click(function() {
      self.playerCtrl.resetGame();
    });
    if (showonly) {
      $('#user0_login').css('display', 'none');
      $('#user1_login').css('display', 'none');
    } else {
      $('#ctrl-type-select>input').checkboxradio();
      $('[name=ctrl-type]').on('change', function(e) {
        $('.ctrl-sub-select').css('display', 'none');
        const openSel = e.target.attributes['data-open'].value;
        if (openSel === 'ctrl-sel-ai-demo') {
          $('#ctrl-sel-ai-demo>input').remove();
          $('#ctrl-sel-ai-demo>label').remove();
          AiManager.NAMES.forEach(function(n, i) {
            $('#ctrl-sel-ai-demo').append(
              `<label for="demo-type-${i+1}">Lv. ${i+1}　${n}</label>
              <input type="radio" name="demo-type" id="demo-type-${i+1}" />`)
          });
          $('#ctrl-sel-ai-demo>input').checkboxradio();
        }
        $(`#${openSel}`).css('display', 'block');
      })
      self.initLoginDialog();
      DebugCtrl.initConfirmDlg();
    }
  }
  initLoginDialog() {
    const self = this;
    const newDlg = function() {
      const dlg = $('#dialog-form').dialog({
        autoOpen: false,
        height: 400,
        width: 500,
        modal: true,
        title: `Login User`,
        buttons: {
          OK: function() {
            self.setUserDlgLogin(self.openDlgUser);
            $(`#user${self.openDlgUser}_login`).css('display', 'none'); // hidden button
            self.loginDlg.dialog('close');
          },
          Cancel: function() {
            self.loginDlg.dialog('close');
          }
        },
        close: function() {
          // console.log('dlg close', self.openDlgUser);
          self.openDlgUser = -1;
        }
      });
      return dlg;
    };
    self.loginDlg = newDlg(0);
    // self.loginDlg[1] = newDlg(1);
    $('#user0_login').click(function() {
      self.openDlgUser = 0;
      self.loginDlg.dialog('open');
    });
    $('#user1_login').click(function() {
      self.openDlgUser = 1;
      self.loginDlg.dialog('open');
    });
    $('#player-name').on('keydown', function(event) {
      if (event.key === 'Enter' && $(`#player-name`).val()) {
        const n = self.openDlgUser;
        self.setUserDlgLogin(n);
        $(`#user${n}_login`).css('display', 'none'); // hidden button
        self.loginDlg.dialog('close');
      }
    });
  }

  static initConfirmDlg() {
    const self = this;
    self.confDlg = $('#dialog-confirm').dialog({
      autoOpen: false,
      modal: true,
      width: 450,
      open: function(event, ui) {
        // console.log('conf dlg open', self.confirmMessage);
        this.children[0].innerText = self.confirmMessage;
      },
      buttons: {
        CLOSE: function() {
          self.confDlg.dialog('close');
        }
      }
    });
  }

  static openConfirm(body) {
    this.confirmMessage = body;
    this.confDlg.dialog('open');
  }
  // setUserLogin(user) {
  //   $(`#user${user}_login`).css('display', 'none');
  //   $(`#user${user}>.name`).css('display', 'none');
  //   $(`#user${user}>.name-edit`).css('display', 'inline').focus().val('');
  // }

  /**
   * login dialog ok event.
   * @param {number} user 0 or 1
   */
  setUserDlgLogin(user) {
    const self = this;
    const type = $('[name=ctrl-type]:checked')[0].id.split('-').pop();
    let name = '';
    if (type == 'client') {
      // nop
      return;
    } else if (type == 'demo') {
      // demo ai set
      const demoNames = AiManager.NAMES;
      const demoNo = $('[name=demo-type]:checked')[0].id.split('-').pop() - 1;
      name = Config.DemoUserName + demoNames[demoNo];
      self.playerCtrl.setManualUser(user, name, demoNo);
    } else if (type == 'player') {
      name = Config.ManualUserName + $('#player-name').val();
      self.playerCtrl.setManualUser(user, name);
      $(`#player-name`).val('');
    }
    // $(`#user${user}_login`).css('display', 'none'); // hidden button
    // $(`#user${user}>.name`).css('display', 'none'); // hidden name label
    // $(`#user${user}>.name-edit`).css('display', 'inline').focus().val('');  // open name input
    console.log(`set name${user}:`, name);
    (user===0 ? DebugCtrl.setUser0 : DebugCtrl.setUser1)(name);
  }
  /**
   * 
   * @param {any[]} status board status
   * @param {number} user current number
   */
  static stdin(status, user) {
    $('#stdin').text(`${Config.MaxCol} ${Config.MaxRow} ${user}\n` + status.map(function(row) {
      return row.join('');
    }).join('\n') + '\n');
  }
  static stdout(col) {
    $('#stdout').text(col);
  }
  static addWsMessage(text) {
    if (!text) {
      $('#wsmessage').text('');
      return;
    }
    const old = $('#wsmessage').text();
    if (old) {
      $('#wsmessage').text(old + '\n' + text);
    } else {
      $('#wsmessage').text(text);
    }
  }
  /**
   * set user1 name.
   * @param {string} name user name
   */
  static setUser0(name) {
    if (!name) {
      $('#user0>.name').text(Config.NoLoginUserName);
      $('#user0_login').css('display', 'inline');
    } else {
      $('#user0>.name').text(name);
      $('#user0_login').css('display', 'none');
    }
    $('#user0>.name').css('display', 'inline');
    $('#user0>.name-edit').css('display', 'none');
  }
  /**
   * set user1
   * @param {string} name 
   */
  static setUser1(name) {
    if (!name) {
      $('#user1>.name').text(Config.NoLoginUserName);
      $('#user1_login').css('display', 'inline');
    } else {
      $('#user1>.name').text(name);
      $('#user1_login').css('display', 'none');
    }
    $('#user1>.name').css('display', 'inline');
    $('#user1>.name-edit').css('display', 'none');
  }
  static setRoomLabel(label) {
    if (!label) return;
    $('#room-label').text(`Room: ${label}`);
  }
  static releaseAllUser() {
    $('#user0>.name').text(Config.NoLoginUserName);
    // $('#user0_login').css('display', 'block');
    $('#user1>.name').text(Config.NoLoginUserName);
    // $('#user1_login').css('display', 'block');
  }
  static stdinCopy() {
    $('#stdin')[0].select();
    document.execCommand('copy');
  }
};

class GameManage {
  /**
   * constructor
   * @param {SocketManage} socket socket manage
   */
  constructor(socket) {
    const self = this;
    self.socket = socket;
    self.selectBase = $('.manual-select');
    self.currentUser = -1;
    self.initGame();
  }
  /**
   * set stdout string.
   * @param {string} s stdin(meta+bord info)
   */
  setState(s) {
    const state = s.split(/\n|\\n/g);
    const meta = state.shift().split(' ');
    // this.currentUser = Number(meta[2]);
    this.state = state.map(function(row) {
      return row.split('');
    });
    DebugCtrl.stdin(this.state, meta[2]);
    this.reflect();
  }
  /**
   * reflect status to game board.
   */
  reflect() {
    for (let row = 0; row < this.state.length; ++row) {
      for (let col = 0; col < this.state[row].length; ++col) {
        const pos = $(`.rail.c${col}>.coinpos.r${row}`);
        pos.removeClass('coin0 coin1');
        if (this.state[row][col] !== '.') {
          pos.addClass(`coin${this.state[row][col]}`);
        }
      }
    }
  }

  onStep(data, pm) {
    const self = this;
    if (isNaN(data.stdout)) return;
    self.addCoin(Number(data.stdout), pm, function() {
      console.log(`current user ${self.currentUser} = > ${data.player}`);
      self.currentUser = data.player;
      self.setState(data.stdin);
    });
  }
  /**
   * add coin
   * @param {number} col column number
   */
  addCoin(col, pm, cb) {
    if (this.isEnd) return;
    if (this.currentUser < 0) {
      console.log(`failed add coin. current:`, this.currentUser);
      return;
    }
    if (!cb) cb = function() { return null; };
    if (isNaN(col) || col < 0 || Config.MaxCol < col) {
      console.error('failed stdout', col);
      DebugCtrl.addWsMessage(`存在しない行が指定されました。: ${col}`);
      return;
    }
    const nowUser = this.currentUser;
    console.log('add coin begin', nowUser, col);
    DebugCtrl.stdout(col);
    const self = this;
    const coin = $(`.coinpos.c${col}`);
    const oldHtml = coin.html();
    coin.html('');
    let row = Config.MaxRow - 1;
    for (;row >= 0 && this.state[row][col] !== '.'; --row) {}
    console.log('row: col, ', row, col);
    if (row < 0) {
      console.error('invalid row', row);
      return;
    }
    // self.socket.send({call: 'step', stdout: col, stdin: $('#stdin').text()})
    // coin落下までの時差があるので、先にstateを更新する
    // self.state[row][col] = self.currentUser;
    // self.nextTurn();    
    coin.css('background-color', Config.CoinColor[nowUser]).animate({
      top: Param.manualSelectTop(row)
    }, 1000, 'swing', function (e) {
      $(`.rail.c${col}>.coinpos.r${row}`).addClass(`coin${nowUser}`);
      coin.html(oldHtml);
      cb(row);
      // after callback(set state)
      const result = self.check();
      if (result >= 0) {
        // alert(`${result == 0 ? '先攻' : '後攻'}: ${pm.user[result].name} の勝ち`);
        // self.confirmMessage = `${result == 0 ? '先攻' : '後攻'}: ${pm.user[result].name} の勝ち\nゲーム終了ボタンを押して、次のゲームを始めます。`;
        // self.confDlg.dialog('open');
        DebugCtrl.openConfirm(`${result == 0 ? '先攻' : '後攻'}: ${pm.user[result].name} の勝ち\nゲーム終了ボタンを押して、次のゲームを始めます。`)
        self.isEnd = true;
      } else {
        // self.nextTurn();
      }
      self.selectBase.children().css({
        top: 0,
        backgroundColor: ''
      });
    });
  }

  // nextTurn() {
  //   this.currentUser = this.currentUser == 0 ? 1 : 0;
  //   DebugCtrl.stdin(this.state, this.currentUser);
  // }
  check() {
    const res = checkGameState(this.state, Config.Goal);
    if (res >= 0) this.isEnd = true;
    return res;
  }
  manualLogin(user, name) {
    this.socket.send({
      call: 'login',
      user0: user==0 ? name : undefined,
      user1: user==1 ? name : undefined
    });
  }
  gameStart() {
    this.isEnd = false;
    this.currentUser = 0;
    this.selectBase.css({display: 'flex'});
  }
  gameStop() {
    this.isEnd = true;
    this.selectBase.css({display: 'none'});
  }
  initGame() {
    this.isEnd = false;
    this.currentUser = -1;
    this.state = Array(Config.MaxRow).fill().map(function() {
      return Array(Config.MaxCol).fill('.');
    });
    $('.coinpos').removeClass('coin0 coin1');
    DebugCtrl.stdin(this.state, 0);
  }
};

/**
 * todo このクラスからゲーム固有の処理を削除する(gmに移動)
 */
class PlayerCtrl {
  /**
   * constructor.
   * @param {GameManage} gm game manager
   */
  constructor(gm) {
    this.gameManage = gm;
    this.user = [{
      name: null,
      isRemote: true  // if isRemote is false, manual control is enabled.
    }, {
      name: null,
      isRemote: true
    }];
    this.initEvent();
  }
  // setAi(ai) {
  //   this.ai = ai;
  //   this.user[ai.mine].isRemote = true;
  // }
  /**
   * set manual control user.
   * @param {number} user 0 or 1
   * @param {string} name user name
   * @param {number} aiNo ai number
   */
  setManualUser(user, name, aiNo) {
    this.user[user].isRemote = aiNo ? true : false;
    this.user[user].name = name;
    this.gameManage.manualLogin(user, name);
    if (typeof aiNo === 'number') {
      AiManager.setLogin(this.gameManage.socket, user, aiNo);
      this.user[user].isAi = true;
    }
  }

  /**
   * call from socketManager:onStep
   * @param {{playre: number, stdin: string, stdout: string}} data 
   */
  wsOnStep(data) {
    const self = this;
    if (data.ready) self.gameManage.gameStart();
    if (data.before) self.gameManage.setState(data.before);
    self.gameManage.onStep(data, self);
  }

  /**
   * call from socketManager:onReload
   * @param {{user0: string, user1: string, ready: boolean}} data 
   */
  wsOnReload(data) {
    DebugCtrl.releaseAllUser();
    DebugCtrl.setRoomLabel(data.label);
    DebugCtrl.setUser0(data.user0);
    DebugCtrl.setUser1(data.user1);
    if (data.user0) {
      this.user[0].name = data.user0;//, isRemote: true
    }
    if (data.user1) {
      this.user[1].name = data.user1;//, isRemote: true
    }
    if (data.stdin) this.gameManage.setState(data.stdin);
    else this.gameManage.initGame();
    if (data.user0 && data.user1) this.gameManage.gameStart();
    else this.gameManage.gameStop();
    this.gameManage.currentUser = data.player;
  }

  // todo move gm
  initEvent() {
    const self = this;
    self.gameManage.selectBase.children().on('click', function (e) {
      if (self.gameManage.isEnd) return;
      if (!self.user[self.gameManage.currentUser] || self.user[self.gameManage.currentUser].isRemote) return;
      const col = self.gameManage.selectBase.children().index(this);
      self.gameManage.socket.send({call: 'step', stdout: col, stdin: $('#stdin').text(), player: self.gameManage.currentUser});
      // self.gameManage.addCoin(col);
    });
    self.gameManage.selectBase.children().hover(function (e) {
      if (self.gameManage.isEnd) return;
      if (!self.user[self.gameManage.currentUser] || self.user[self.gameManage.currentUser].isRemote) return;
      $(this).css('background-color', Config.CoinColor[self.gameManage.currentUser]);
    }, function() {
      if (self.gameManage.isEnd) return;
      if ($(this).position().top == 0) $(this).css('background-color', '');
    });
  }
  resetGame() {
    $.ajax({
      type: 'DELETE',
      url: '/red/api/con4/' + this.gameManage.socket.roomPath
    }).then(function(data) {
      console.log('delete end', data);
    }).catch(function(err) {
      console.error('delete failure', err);
    });
  }
}

/**
 * check game winner.
 * @param {string[][]} state game status
 * @returns {Number} winner
 */
function checkGameState(state) {
  // check row(-)
  for (let row = 0; row < Config.MaxRow; ++row) {
    for (let col = 0; col < Config.MaxCol - Config.Goal + 1; ++col) {
      if (state[row][col] === '.') continue;
      const res = state[row].slice(col + 1, col + Config.Goal).findIndex(function(val) {
        return val != state[row][col];
      });
      if (res < 0) {
        // this.isEnd = true;
        return state[row][col];
      }
    }
  }
  // check col(|)
  for (let col = 0; col < Config.MaxCol; ++col) {
    for (let row = 0; row < Config.MaxRow - Config.Goal + 1; ++row) {
      if (state[row][col] === '.') continue;
      let res = state[row][col];
      for (let r = 1; r < Config.Goal; ++r) {
        if (state[row + r][col] == res) continue;
        res = -1;
        break;
      }
      if (res >= 0){
        // this.isEnd = true;
        return res;
      }
    }
  }
  // check /
  for (let row = Config.Goal - 1; row < Config.MaxRow; ++row) {
    for (let col = 0; col < Config.MaxCol - Config.Goal + 1; ++col) {
      if (state[row][col] === '.') continue;
      let res = state[row][col];
      for (let r = 1; r < Config.Goal; ++r) {
        if (state[row - r][col + r] == res) continue;
        res = -1;
        break;
      }
      if (res >= 0){
        // isEnd = true;
        return res;
      }
    }
  }
  // check \
  for (let row = 0; row < Config.MaxRow - Config.Goal + 1; ++row) {
    for (let col = 0; col < Config.MaxCol - Config.Goal + 1; ++col) {
      if (state[row][col] === '.') continue;
      let res = state[row][col];
      for (let r = 1; r < Config.Goal; ++r) {
        if (state[row + r][col + r] == res) continue;
        res = -1;
        break;
      }
      if (res >= 0){
        // this.isEnd = true;
        return res;
      }
    }
  }  
}

// memo

function nextStdin(stdin, stdout) {
  const col = Number(stdout);
  if (isNaN(col)) throw {error: '不正な標準出力です.', stdout: stdout};
  if (0 > col || col > 7) throw {error: '範囲外の標準出力です.', stdout: stdout};
  let state = stdin.split('\n');
  const meta = state.shift().split(' ');
  state = state.map(function(row) {
    return row.split('');
  });
  for (let y = 5; y >= 0; --y) {
    if (state[y][col] == '.') {
      state[y][col] = meta[2];
      break;
    }
  }
  meta[2] = meta[2] == '0' ? '1' : '2';
  return meta.join(' ') + '\n' + state.map(function(r) { return r.join(''); }).join('\n');
}


/*****************************************
 * 
 */

function initEffect() {
  var canvas = document.querySelector('canvas');
  this.c = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  c.globalCompositeOperation = 'xor';
  var mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  this.isMouseDown = false;

  window.addEventListener("mousemove", function(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  window.addEventListener("resize", function() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    initializeVariables();
  });


  // window.addEventListener("mousedown", function() {
  //   isMouseDown = true;
  // });

  // window.addEventListener("mouseup", function() {
  //   isMouseDown = false;
  // });

  // canvas.addEventListener("touchstart", function() {
  //   isMouseDown = true;
  // });

  canvas.addEventListener("touchmove", function(event) {
    event.preventDefault();
    mouse.x = event.touches[0].pageX;
    mouse.y = event.touches[0].pageY;
  });

  // canvas.addEventListener("touchend", function() {
  //   isMouseDown = false;
  // });


  function Cannon(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = 0;
    this.color = color;

    this.update = function() {
      desiredAngle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
      this.angle = desiredAngle;
      this.draw();	
    };

    this.draw = function() {
      c.save();
      c.translate(this.x, this.y);
      c.rotate(this.angle);
      c.beginPath();
      c.fillStyle = this.color;
      c.shadowColor = this.color;
      c.shadowBlur = 3;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.fillRect(0, -this.height / 2, this.width, height);
      c.closePath();
      c.restore();
    };
  }

  function Cannonball(x, y, dx, dy, radius, color, cannon, particleColors) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = -dy;
    this.radius = radius;
    this.color = color;
    this.particleColors = particleColors;
    this.source = cannon;
    this.timeToLive = canvas.height / (canvas.height + 800);

    this.init = function() {
      // Initialize the cannonballs start coordinates (from muzzle of cannon)
      this.x = Math.cos(this.source.angle) * this.source.width;
      this.y = Math.sin(this.source.angle) * this.source.width;

      // Translate relative to canvas positioning
      this.x = this.x + (canvas.width / 2);
      this.y = this.y + (canvas.height);	

      // Determine whether the cannonball should be 
      // fired to the left or right of the cannon
      if (mouse.x - canvas.width / 2 < 0) {
        this.dx = -this.dx;
      }

      this.dy = Math.sin(this.source.angle) * 8;
      this.dx = Math.cos(this.source.angle) * 8;
    };

    this.update = function() {
      if (this.y + this.radius + this.dy > canvas.height) {
        this.dy = -this.dy;
      } else {
        this.dy += gravity;
      }

      this.x += this.dx;
      this.y += this.dy;
      this.draw();	

      this.timeToLive -= 0.01;
    };

    this.draw = function() {
      c.save();
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.shadowColor = this.color;
      c.shadowBlur = 5;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.fillStyle = this.color;
      c.fill();
      c.closePath();
      c.restore();
    };

    this.init();
  }

  function Particle(x, y, dx, dy, radius, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = -dy;
    this.radius = 5;
    this.color = color;
    this.timeToLive = 1;
    // this.mass = 0.2;

    this.update = function() {
      if (this.y + this.radius + this.dy > canvas.height) {
        this.dy = -this.dy;
      }

      if (this.x + this.radius + this.dx > canvas.width || this.x - this.radius + this.dx < 0) {
        this.dx = -this.dx;
      }
      // this.dy += gravity * this.mass;
      this.x += this.dx;
      this.y += this.dy;
      this.draw();

      this.timeToLive -= 0.01;
    };

    this.draw = function() {
      c.save();
      c.beginPath();
      c.arc(this.x, this.y, 2, 0, Math.PI * 2, false);
      c.shadowColor = this.color;
      c.shadowBlur = 10;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.fillStyle = this.color;
      c.fill();

      c.closePath();

      c.restore();
    };
  }


  function Explosion(cannonball) {
    this.particles = [];	
    this.rings = [];
    this.source = cannonball;

    this.init = function() {
      for (var i = 0; i < 10; i++) {

        var dx = (Math.random() * 6) - 3;
        var dy = (Math.random() * 6) - 3;

        // var hue = (255 / 5) * i;
        // var color = "hsl(" + hue + ", 100%, 50%)";
        var randomColorIndex = Math.floor(Math.random() * this.source.particleColors.length);
        var randomParticleColor = this.source.particleColors[randomColorIndex];


          this.particles.push(new Particle(this.source.x, this.source.y, dx, dy, 1, randomParticleColor));
      }

      // Create ring once explosion is instantiated
        // this.rings.push(new Ring(this.source, "blue"));
    };

    this.init();

    this.update = function() {
      for (var i = 0; i < this.particles.length; i++) {
          this.particles[i].update();

          // Remove particles from scene one time to live is up
          if (this.particles[i].timeToLive < 0) {
            this.particles.splice(i, 1);
          }
      }

      // Render rings
      for (var j = 0; j < this.rings.length; j++) {
        this.rings[j].update();

        // Remove rings from scene one time to live is up
          if (this.rings[j].timeToLive < 0) {
            this.rings.splice(i, 1);
          }
      }
    };
  }

  var gravity = 0.08;
  var desiredAngle = 0;
  var cannon, cannonballs, explosions, colors;

  function initializeVariables() {
    cannon = new Cannon(canvas.width / 2, canvas.height, 20, 10, "white");
    cannonballs = [];
    explosions = [];
    colors = [
      // Red / Orange
      {
        cannonballColor: "#fff",
        particleColors: [
          "#ff4747",
          "#00ceed",
          "#fff",
        ]
      }
    ];
  }

  initializeVariables();

  var timer = 0;
  var isIntroComplete = false;
  var introTimer = 0;


  this.animate = function() {
    this.reqFrame = window.requestAnimationFrame(animate);

    c.fillStyle = "rgba(90, 90, 90, 0.1)";
    c.fillRect(0, 0, canvas.width, canvas.height);			
    cannon.update();

    if (isIntroComplete === false) {
      introTimer += 1;

      if (introTimer % 3 === 0) {
        var randomColor = Math.floor(Math.random() * colors.length);
        var color = colors[randomColor];

        cannonballs.push(new Cannonball(canvas.width / 2, canvas.height / 2, 2, 2, 4, color.cannonballColor, cannon, color.particleColors));
      }

      if (introTimer > 30) {
        isIntroComplete = true;
      }

    }


    // Render cannonballs
    for (var i = 0; i < cannonballs.length; i++) {
        cannonballs[i].update();

        if (cannonballs[i].timeToLive <= 0) {

          // Create particle explosion after time to live expires
          explosions.push(new Explosion(cannonballs[i]));

          cannonballs.splice(i, 1);

        }
    }

    // Render explosions
    for (var j = 0; j < explosions.length; j++) {
          //Do something
          explosions[j].update();

        // Remove explosions from scene once all associated particles are removed
        if (explosions[j].particles.length <= 0) {
          explosions.splice(j, 1);
        }
    }	


    if (isMouseDown === true) {
      timer += 1;
      if (timer % 3 === 0) {
        var randomParticleColorIndex = Math.floor(Math.random() * colors.length);
        var randomColors = colors[randomParticleColorIndex];

        cannonballs.push(new Cannonball(mouse.x, mouse.y, 2, 2, 4, randomColors.cannonballColor, cannon, randomColors.particleColors));
      }
    } else {
    }
  }

  this.start = function() {
    canvas.style.display = 'block';
    this.isMouseDown = true;
    if (this.reqFrame) return;
    this.animate();
  }
  this.stop = function () {
    canvas.style.display = 'none';
    this.isMouseDown = false;
    window.cancelAnimationFrame(this.reqFrame);
    this.reqFrame = null;
  }
  return this;
}

const effect = initEffect();
// effect.start()
