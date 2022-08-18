
class AiManager {
  constructor() {
    // todo
  }
  static NAMES = ['カンナ', 'ユリ', 'キキ', 'ネモ'];

  /**
   * 
   * @param {SocketManage} socket socket manage
   * @param {number} userNo user number
   * @param {number} aiNo 
   */
  static setLogin(socket, userNo, aiNo) {
    const self = this;
    console.log(`### ai set login`, userNo, aiNo);
    socket.onStep.push(function(data) {
      // {player: 0 or 1, stdout: '5', stdin: 'x x x\n.....\n'}
      if (userNo != data.player) return;
      console.log('ai play start', userNo);
      setTimeout(() => {
        socket.send({
          call: 'step',
          stdout: self.aiProc(aiNo, data.stdin) + '',
          stdin: data.stdin,
          player: userNo
        });
      }, 3000);
    });
  }

  /**
   * 
   * @param {number} ai ai number
   * @param {string} stdin stdin
   * @returns {number}
   */
  static aiProc(ai, stdin) {
    const rs = stdin.split(/\n|\\n/g);
    const meta = rs.shift().split(' ').map(function(p) {return Number(p);});
    const state = rs.map(function(row) {
      return row.split('');
    });
    let res = checkGoal(state, meta[0], meta[1], 3);
    console.log('+++ check goal 3:', res);
    if (res >= 0) return res;
    res = checkGoal(state, meta[0], meta[1], 2);
    console.log('+++ check goal 2:', res);
    if (res >= 0) return res;
    res = checkVacant(state);
    console.log('+++ check vacant:', res);
    if (res >= 0) return res;
    return 1;
  }
}

/**
 * 
 * @param {string[][]} state 
 */
function checkVacant(state) {
  for (let row = state.length - 1; row >= 0; --row) {
    const bl = state[row].reduce(function (p,c,i) { if (c==='.') p.push(i); return p; }, []);
    if (bl.length) {
      const t = bl.pop();
      return bl.pop() || t;
    }
  }
  return -1;
}

function checkGoal(state, mcol, mrow, goal) {
  let res = checkRow(state, mcol, mrow, goal);
  if (res < 0) res = checkCol(state, mcol, mrow, goal);
  return res;
}
/**
 * 
 * @param {string[][]} state 
 * @param {number} mcol 
 * @param {number} mrow 
 * @param {number} goal 
 * @returns {number}
 */
function checkRow(state, mcol, mrow, goal) {
  // check row(-)
  for (let row = 0; row < mrow; ++row) {
    for (let col = 0; col < mcol - goal + 1; ++col) {
      if (state[row][col] === '.') continue;
      const res = state[row].slice(col + 1, col + goal).findIndex(function(val) {
        return val != state[row][col];
      });
      if (res < 0) {
        if (col > 0 && state[row][col-1] === '.') return col-1;
        else if (mcol > col+goal && state[row][col+goal] === '.') return col+goal;
        // return state[row][col];
      }
    }
  }
  return -1;
}

function checkCol(state, mcol, mrow, goal) {
  for (let col = 0; col < mcol; ++col) {
    for (let row = 0; row < mrow - goal + 1; ++row) {
      if (state[row][col] === '.') continue;
      let res = state[row][col];
      for (let r = 1; r < goal; ++r) {
        if (state[row + r][col] == res) continue;
        res = -1;
        break;
      }
      if (res >= 0){
        if (row > 0 && state[row-1][col] === '.') return col;
        else if (mrow > row+goal && state[row+goal][col] === '.') return col;
      }
    }
  }
  return -1;
}

function checkSlash(state, mcol, mrow, goal) {

}
function checkBs(state, mcol, mrow, goal) {
  
}
