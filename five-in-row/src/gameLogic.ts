type Board = string[][]; // 'B' is black, 'W' is white, '' is empty
interface BoardDelta {
  row: number;
  col: number;
}
interface IState {
  board: Board;
  boardBeforeMove: Board;
  delta: BoardDelta; // [-1,-1] means a pass.

  // For the rule of KO:
  // One may not capture just one stone, if that stone was played on the previous move, and that move also captured just one stone.

}
interface IProposalData {
  delta: BoardDelta; // [-1,-1] means a pass.
  
}
type Points = number[][]; // A point (row,col) is represented as an array with 2 elements: [row,col].
//type Sets = {white: Points[]; black: Points[];}

import gameService = gamingPlatform.gameService;
import alphaBetaService = gamingPlatform.alphaBetaService;
import translate = gamingPlatform.translate;
import resizeGameAreaService = gamingPlatform.resizeGameAreaService;
import log = gamingPlatform.log;
import dragAndDropService = gamingPlatform.dragAndDropService;

module gameLogic {
  function isEqual<T>(object1: T, object2: T) {
    return angular.equals(object1, object2)
  }

  // returns a new [empty] wuziqi board
  export function createNewBoardWithElement<T>(dim: number, element: T): T[][] {
    let rows = dim;
    let cols = dim;
    let array: T[][] = [], row: T[] = [];
    while (cols--)
      row.push(element);
    while (rows--)
      array.push(row.slice());
    return array;
  }

  export function createNewBoard(dim: number): Board {
    return createNewBoardWithElement(dim, '');
  }

  // returns copy of JS object
  function copyObject<T>(object: T): T {
    return angular.copy(object);
  }

  //Helper for getSets

  function getWeb(color: string, row: number, col: number, board: Board, visited: Board): Points {
    let points: Points = [];
    let dim = board.length;

    function tryPoints(row: number, col: number) {
      points.push([row, col]);
      visited[row][col] = color;
      if (row - 1 >= 0 && visited[row - 1][col] === '' && board[row - 1][col] === color)
      { tryPoints(row - 1, col); }
      if (row + 1 < dim && visited[row + 1][col] === '' && board[row + 1][col] === color)
      { tryPoints(row + 1, col); }
      if (col + 1 < dim && visited[row][col + 1] === '' && board[row][col + 1] === color)
      { tryPoints(row, col + 1); }
      if (col - 1 >= 0 && visited[row][col - 1] === '' && board[row][col - 1] === color)
      { tryPoints(row, col - 1); }
    }

    tryPoints(row, col);
    return points;
  }
 
  // Changes all arr locations in board to '' (empty)
  function cleanBoard(board: Board, arr: Points) {
    let newboard = copyObject(board);
    for (let i = 0; i < arr.length; i++) {
      let row = arr[i][0];
      let col = arr[i][1];
      newboard[row][col] = '';
    }
    return newboard;
  }

 
  
  // evaluates WuZiQi board using union-find algorithm
  function evaluateBoard(board: Board, turn: number) {
    let boardAfterEval = copyObject(board);
    return boardAfterEval;
  }

  function isBoardFull(board: Board) {
    let dim = board.length;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        if (!board[i][j]) return false;
      }
    }
    return true;
  }

 export function createComputerMove(board: Board, turnIndexBeforeMove: number) {
    let possibleMoves: IMove[] = [];
    let dim = board.length;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        let delta = { row: i, col: j };
        try {
          let testmove = createMove(board, delta, turnIndexBeforeMove);
          possibleMoves.push(testmove);
        } catch (e) {
          // cell in that position was full
        }
      }
    }
    try {
      let delta = { row: -1, col: -1 };
      let testmove = createMove(board, delta, turnIndexBeforeMove);
      possibleMoves.push(testmove);
    } catch (e) {
      // Couldn't add pass as a move?
    }
    let randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    return randomMove;
  }



 // find whether there are five chesses, if so, end game
    // up and down
    function udCount(dim: number, board: Board, temp: string, x: number, y: number) {
        var count = 0;
        console.warn("SQR's home = " + board[x][y]);
        console.warn("SQR's fake home = " + temp);
        for (var i = x - 1; i >= 0; i--) {
            //console.warn("SQR's home = " + board[i][y]);
            if (angular.equals(board[i][y], temp)) {
                //count++;
                ++count;
                console.warn("SQR00 = " + count);
            } else {
                break;
            }
        }
        for (var i = x + 1; i < dim; i++) {
            if (angular.equals(board[i][y], temp)) {
                //count++;
                ++count;
                console.warn("SQR11 = " + count);
            } else {
                console.warn("SQR bad bad! ");
                break;
            }
        }
        console.warn("lr count: " + count);
        return count;
    }

    // left and right
    function lrCount(dim: number, board: Board, temp: string, x: number, y: number) {
        var count = 0;
        for (var i = y - 1; i >= 0; i--) {
            if (angular.equals(board[x][i], temp)) {
                //count++;
                ++count;
            } else {
                break;
            }
        }
        for (var i = y + 1; i < dim; i++) {
            if (angular.equals(board[x][i], temp)) {
                ++count;
                //count++;
            } else {
                break;
            }
        }
        return count;
    }

    // right down and left up
    function rdCount(dim: number, board: Board, temp: string, x: number, y: number) {
        var count = 0;
        for (var i = x + 1, j = y - 1; i < dim && j >= 0;) {
            if (angular.equals(board[i][j], temp)) {
                //count++;
                ++count;
            } else {
                break;
            }
            i++;
            j--;
        }
        for (var i = x - 1, j = y + 1; i >= 0 && j < dim;) {
            if (angular.equals(board[i][j], temp)) {
                ++count;
                //count++;
            } else {
                break;
            }
            i--;
            j++;
        }
        return count;
    }

    // left down and right up
    function ldCount(dim: number, board: Board, temp: string, x: number, y: number) {
        var count = 0;

        for (var i = x - 1, j = y - 1; i >= 0 && j >= 0;) {
            if (angular.equals(board[i][j], temp)) {
                ++count;
                //count++;
            } else {
                break;
            }
            i--;
            j--;
        }
        for (var i = x + 1, j = y + 1; i < dim && j < dim;) {
            if (angular.equals(board[i][j], temp)) {
                ++count;
                //count++;
            } else {
                break;
            }
            i++;
            j++;
        }
        return count;
    }

    // check whether one has won
    function isWin(dim: number, board: Board, turnIndex: number, x: number, y: number) {
        var count = 0;
        var temp = 'B'; //default:black 
        if (turnIndex === 0) {
            temp = 'W';
        } //白色  
        //console.warn("llllllllllll: " + temp);
        // console.log("temp=" + temp);
        if (udCount(dim, board, temp, x, y) === 4) {
            count = udCount(dim, board, temp, x, y);
        }
        else if (lrCount(dim, board, temp, x, y) === 4) {
            count = lrCount(dim, board, temp, x, y);
        }
        else if (rdCount(dim, board, temp, x, y) === 4) {
            count = rdCount(dim, board, temp, x, y);
        }
        else if (ldCount(dim, board, temp, x, y) === 4) {
            count = ldCount(dim, board, temp, x, y);
        }
        //console.warn("is_wim count: " + count);
        return count;
    }




  export function createMove(board: Board, delta: BoardDelta, turnIndexBeforeMove: number): IMove {
    let dim = board.length;
    let boardAfterMove = copyObject(board);
    let row = delta.row;
    let col = delta.col;
    if (boardAfterMove[row][col] !== '') {
      // if space isn't '' then bad move
      throw Error('Space is not empty!');
    } 
      boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'B' : 'W';
      // evaluate board
      boardAfterMove = evaluateBoard(boardAfterMove, turnIndexBeforeMove);


    if (angular.equals(board, boardAfterMove))
      throw Error("don’t allow a move that brings the game back to stateBeforeMove.");
  
    
    let endMatchScores: number[] = null;
    let turnIndexAfterMove = 1 - turnIndexBeforeMove;
    var countAfterMove = isWin(dim, boardAfterMove, turnIndexAfterMove, row, col);
     if (countAfterMove === 4) {
            //throw Error('Win');
            console.warn("win: " + turnIndexBeforeMove);
            if (turnIndexAfterMove === 0) {
                endMatchScores = [0, 1];
            }
            else {
                endMatchScores = [1, 0];
            }
            turnIndexAfterMove = -1;
            console.warn("Make A Move, the next: " + turnIndexAfterMove);
        } else {
            if (isBoardFull(boardAfterMove)) {
                endMatchScores = [-1, -1];
                turnIndexAfterMove = -1;
            }
        }
        console.error("end the judge");

    return {
        endMatchScores: endMatchScores,
        turnIndex: turnIndexAfterMove,
        state: {
            board: boardAfterMove,
            boardBeforeMove: board,
            delta: delta,
        },
    };
  }

}
