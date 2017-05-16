interface SupportedLanguages {
  en: string, iw: string,
  pt: string, zh: string,
  el: string, fr: string,
  hi: string, es: string,
};

interface Score {
  white: number, black: number;
}

module game {
  export let isModalShown = false;
  export let modalTitle = "";
  export let modalBody = "";
  export let $rootScope: angular.IScope = null;
  export let $timeout: angular.ITimeoutService = null;
  export let currentUpdateUI: IUpdateUI = null;
  export let didMakeMove: boolean = false; // You can only make one move per updateUI
  export let turnIndex: number;
  export let board: Board = null;
  export let boardBeforeMove: Board = null;
  export let moveToConfirm: BoardDelta = null;
  export let delta: BoardDelta = null;
  export let posJustCapturedForKo: BoardDelta = null;
  export let score: Score = {white: 0, black: 0};
  // For community games.
  export let playerIdToProposal: IProposals = null;
  export let proposals: number[][] = null;
  export let yourPlayerInfo: IPlayerInfo = null;

  export let hidePassButtonForTesting = location.search == "?hidePassButtonForTesting"; // only locally to create printscreens of just the board.

  export let hasDim = false;
  export let dim = 9;
  export function rowsPercent() {
    return 100/dim;
  }
  export function dotX(m: number) {
    return -rowsPercent()/2 + (rowsPercent())*((dim == 9 ? 2 : 3) +
        (dim == 19 ? 6 : dim == 13 ? 3 : 2)*m+1);
  }

  let clickToDragPiece: HTMLImageElement;
  let draggingLines: HTMLElement;
  let horizontalDraggingLine: HTMLElement;
  let verticalDraggingLine: HTMLElement;
  export let gameArea: HTMLElement;
  export let boardArea: HTMLElement;

  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isModalShown = false;
    }
    return true;
  }

  function getTranslations(): Translations {
    return {
      "MODAL_BUTTON_CLOSE": {
        "en": "Close",
        "iw": "סגור",
        "pt": "Fechar",
        "zh": "关闭",
        "el": "Κλείσιμο",
        "fr": "fermer",
        "hi": "बंद करे",
        "es": "Cerrar"
      },
     
      "OPPONENT_CHOOSE_BOARD_SIZE": {
        "en": "Opponent is choosing the board size, and making the first move.",
        "iw": "יריב הוא בחירת גודל הלוח, ועושה את הצעד הראשון.",
        "pt": "Adversário é escolher o tamanho da placa e fazer o primeiro movimento.",
        "zh": "对手选择棋盘大小，并下子。",
        "el": "Αντίπαλος είναι η επιλογή του μεγέθους του σκάφους, και να κάνει την πρώτη κίνηση.",
        "fr": "Adversaire est de choisir la taille du conseil d'administration, et de faire le premier pas.",
        "hi": "प्रतिद्वन्दी बोर्ड आकार का चयन किया जाता है, और पहला कदम बना रही है।",
        "es": "Oponente es elegir el tamaño del tablero, y dar el primer paso."
      },
      "CHOOSE_BOARD_SIZE": {
        "en": "Choose board size",
        "iw": "בחר את גודל הלוח",
        "pt": "Escolha do tamanho da placa",
        "zh": "选择棋盘大小",
        "el": "Επιλέξτε το μέγεθος του σκάφους",
        "fr": "Choisissez la taille du conseil",
        "hi": "बोर्ड आकार चुनें",
        "es": "Elija el tamaño del tablero"
      },
      "CONFIRM": {
        "en": "CONFIRM",
        "iw": "אשר",
        "pt": "CONFIRMAR",
        "zh": "确 认",
        "el": "ΕΠΙΒΕΒΑΙΏΝΩ",
        "fr": "CONFIRMER",
        "hi": "पुष्टि करें",
        "es": "CONFIRMAR"
      },
      "GAME_OVER": {
        "en": "Game over! Black: {{BLACK_SCORE}}, White: {{WHITE_SCORE}}",
        "iw": "סוף המשחק! שחור: {{BLACK_SCORE}}, לבן: {{WHITE_SCORE}}",
        "pt": "Fim de jogo! Preto: {{BLACK_SCORE}}, White: {{WHITE_SCORE}}",
        "zh": "游戏结束！黑色：{{BLACK_SCORE}}，白{{WHITE_SCORE}}",
        "el": "Τέλος παιχνιδιού! Μαύρο: {{BLACK_SCORE}}, Λευκά: {{WHITE_SCORE}}",
        "fr": "Jeu terminé! Noir: {{BLACK_SCORE}}, Blanc: {{WHITE_SCORE}}",
        "hi": "खेल खत्म! ब्लैक: {{BLACK_SCORE}}, व्हाइट: {{WHITE_SCORE}}",
        "es": "¡Juego terminado! Negro: {{BLACK_SCORE}}, blanco: {{WHITE_SCORE}}"
      }
    };
  }

  export function init($rootScope_: angular.IScope, $timeout_: angular.ITimeoutService) {
    $rootScope = $rootScope_;
    $timeout = $timeout_;
    draggingLines = document.getElementById("draggingLines");
    horizontalDraggingLine = document.getElementById("horizontalDraggingLine");
    verticalDraggingLine = document.getElementById("verticalDraggingLine");
    clickToDragPiece = <HTMLImageElement>document.getElementById("clickToDragPiece");
    gameArea = document.getElementById("gameArea");
    boardArea = document.getElementById("boardArea");
    translate.setTranslations(getTranslations());
    translate.setLanguage('en');
    resizeGameAreaService.setWidthToHeight(hidePassButtonForTesting ? 1 : 0.8);
    dragAndDropService.addDragListener("boardArea", handleDragEvent);
    gameService.setGame({
      updateUI: updateUI,
      getStateForOgImage: getStateForOgImage,
    });
  }

  export function getStateForOgImage(): string {
    if (!currentUpdateUI || !currentUpdateUI.state) {
      log.warn("Got stateForOgImage without currentUpdateUI!");
      return '';
    }
    let state: IState = currentUpdateUI.state;
    if (!state || !hasDim) return '';
    let board: string[][] = state.board;
    if (!board) return '';
    let boardStr: string = '';
    for (let row = 0 ; row < dim; row++) {
      for (let col = 0 ; col < dim; col++) {
        boardStr += board[row][col] == 'W' ? 'w' : board[row][col] == 'B' ? 'b' : 'x';
      }
    }
    return boardStr;
  }  

  export function showContinuePlayingOrAgreeButtons() {
    return isMyTurn();
  }

  export function continuePlayingClicked() {
    if (!showContinuePlayingOrAgreeButtons()) return;
    log.info("continuePlayingClicked");
    score = {white: 0, black: 0};
  }

  export function showConfirmButton() {
    return moveToConfirm != null;
  }
  export function confirmClicked() {
    if (!showConfirmButton()) return;
    cellClicked(moveToConfirm.row, moveToConfirm.col);
    clearClickToDrag();
    moveToConfirm = null;
  }

  function showModal(titleId: string, bodyId: string) {
    if (!isMyTurn()) return;
    log.info("showModal: ", titleId);
    isModalShown = true;
    modalTitle = translate(titleId);
    modalBody = translate(bodyId);
  }

  let cacheIntegersTill: number[][] = [];
  export function getIntegersTill(number: any): number[] {
    if (cacheIntegersTill[number]) return cacheIntegersTill[number]; 
    let res: number[] = [];
    for (let i = 0; i < number; i++) {
      res.push(i);
    }
    cacheIntegersTill[number] = res;
    return res;
  }
  let cacheMatrixTill: number[][][] = [];
  export function getMatrixTill(number: any): number[][] {
    if (cacheMatrixTill[number]) return cacheMatrixTill[number]; 
    let res: number[][] = [];
    for (let i = 0; i < number; i++) {
      for (let j = 0; j < number; j++) {
        res.push([i,j]);
      }
    }
    cacheMatrixTill[number] = res;
    return res;
  }

  function handleDragEvent(type: any, clientX: any, clientY: any) {
    if (!isHumanTurn()) {
      return; // if the game is over, do not display dragging effect
    }
    if (type === "touchstart" && moveToConfirm != null) {
      moveToConfirm = null;
      $rootScope.$apply();
    }
    // Center point in boardArea
    let x = clientX - boardArea.offsetLeft - gameArea.offsetLeft;
    let y = clientY - boardArea.offsetTop - gameArea.offsetTop;
    // Is outside boardArea?
    let button = document.getElementById("button");
    if (x < 0 || x >= boardArea.clientWidth || y < 0 || y >= boardArea.clientHeight) {
      clearClickToDrag();
      return;
    }
    // Inside boardArea. Let's find the containing square's row and col
    let col = Math.floor(dim * x / boardArea.clientWidth);
    let row = Math.floor(dim * y / boardArea.clientHeight);
    // if the cell is not empty, don't preview the piece, but still show the dragging lines
    if (board[row][col] !== '') {
      clearClickToDrag();
      return;
    }
    clickToDragPiece.style.display =  "inline";
    draggingLines.style.display = "inline";
    let centerXY = getSquareCenterXY(row, col);
    verticalDraggingLine.setAttribute("x1", "" + centerXY.x);
    verticalDraggingLine.setAttribute("x2", "" + centerXY.x);
    horizontalDraggingLine.setAttribute("y1", "" + centerXY.y);
    horizontalDraggingLine.setAttribute("y2", "" + centerXY.y);
    // show the piece
    //let cell = document.getElementById('board' + row + 'x' + col).className = $scope.turnIndex === 0 ? 'black' : 'white';

    let topLeft = getSquareTopLeft(row, col);
    clickToDragPiece.style.left = topLeft.left + "px";
    clickToDragPiece.style.top = topLeft.top + "px";
    if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
      // drag ended
      dragDone(row, col);
    }
  }

  function clearClickToDrag() {
    clickToDragPiece.style.display = "none";
    draggingLines.style.display = "none";
  }

  function getSquareTopLeft(row: number, col: number) {
    let size = getSquareWidthHeight();
    return { top: row * size.height, left: col * size.width }
  }
  function getSquareWidthHeight() {
    let boardArea = document.getElementById("boardArea");
    return {
      width: boardArea.clientWidth / (dim),
      height: boardArea.clientHeight / (dim)
    };
  }
  function getSquareCenterXY(row: number, col: number) {
    let size = getSquareWidthHeight();
    return {
      x: col * size.width + size.width / 2,
      y: row * size.height + size.height / 2
    };
  }
  function dragDone(row: number, col: number) {
    $rootScope.$apply(function () {
    moveToConfirm = {row: row, col: col};
    });
  }


  export function setDim(d: number) {
    dim = d;
    hasDim = true;
    board = gameLogic.createNewBoard(dim);
    boardBeforeMove = gameLogic.createNewBoard(dim);
  }
  
  export function getBoardPiece(row: number, col: number): string {
    let piece = game.board[row][col];
    let pieceBefore = game.boardBeforeMove[row][col]; 
    let isProposal = proposals && proposals[row][col] > 0;
    return isProposal ? (currentUpdateUI.turnIndex == 0 ? 'B' : 'W') :
        !piece && !pieceBefore ? '' : (piece == 'B'  || pieceBefore == 'B' ? 'B' : 'W');
  } 

  export function getCellStyle(row: number, col: number): Object {
    if (!proposals) return {};
    let count = proposals[row][col];
    if (count == 0) return {};
    // proposals[row][col] is > 0
    let countZeroBased = count - 1;
    let maxCount = currentUpdateUI.numberOfPlayersRequiredToMove - 2;
    let ratio = maxCount == 0 ? 1 : countZeroBased / maxCount; // a number between 0 and 1 (inclusive).
    // scale will be between 0.6 and 0.8.
    let scale = 0.6 + 0.2 * ratio;
    // opacity between 0.5 and 0.7
    let opacity = 0.5 + 0.2 * ratio;
    return {
      transform: `scale(${scale}, ${scale})`,
      opacity: "" + opacity,
    };
  }

  function updateProposals() {
    // This must be after calling updateUI, because we nullify things there (like proposals)
    didMakeMove = !!playerIdToProposal[yourPlayerInfo.playerId];
    proposals = gameLogic.createNewBoardWithElement(19, 0); // Community matches are always 19x19.
    proposals[-1] = [];
    proposals[-1][-1] = 0; // number of times we proposed to pass.
    for (let playerId in playerIdToProposal) {
      let proposal = playerIdToProposal[playerId];
      let delta = proposal.data.delta;
      proposals[delta.row][delta.col]++;
    }
  }

  function updateUI(params: IUpdateUI) {
    log.info("Game got updateUI:", params);
    didMakeMove = false; // Only one move per updateUI
    yourPlayerInfo = params.yourPlayerInfo;
    playerIdToProposal = params.playerIdToProposal;
    proposals = null;
    if (playerIdToProposal) {
      updateProposals();
      // If only proposals changed, then return.
      // I don't want to disrupt the player if he's in the middle of a move.
      params.playerIdToProposal = null;
      if (currentUpdateUI && angular.equals(currentUpdateUI, params)) return;
    }

    currentUpdateUI = params;
    score = {white: 0, black: 0};
    clearClickToDrag();
    moveToConfirm = null;
    if (isFirstMove()) {
      hasDim = false;
      delta = null;
      board = gameLogic.createNewBoard(dim);
      boardBeforeMove = gameLogic.createNewBoard(dim);
      if (playerIdToProposal) setDim(19); // Community matches are always 19x19.
    } else {
      let state = params.state;
      board = state.board;
      hasDim = true;
      dim = board.length;
      boardBeforeMove = state.boardBeforeMove;
      delta = state.delta;
    }
    turnIndex = params.turnIndex;
    clickToDragPiece.src = "imgs/" + (turnIndex === 0 ? 'black' : 'white') + "Stone.svg";
    if (isComputerTurn()) {
      $timeout(maybeSendComputerMove, 500);
    }
  }
/*
  export function calcScore() {
    score = {white: 0, black: 0};
    let liveBoard = angular.copy(board); 
    let emptyBoard = gameLogic.createNewBoard(dim); // has 'W' in all empty places.
    for (let row = 0 ; row < dim; row++) {
      for (let col = 0 ; col < dim; col++) {
         if (liveBoard[row][col] == '') emptyBoard[row][col] = 'W';
      }
    }
    /*
   // for (let set of sets.white) score.white += set.length;
    //for (let set of sets.black) score.black += set.length;
    let emptySets = null;
    // For each empty group, decide if it's surrounded by black/white/both.
    for (let emptySet of emptySets) {
      let neighborColor: string = '';
      for (let point of emptySet) {
        let row = point[0];
        let col = point[1];
        neighborColor = updateColor(row - 1 >= 0 ? liveBoard[row - 1][col] : '', neighborColor);
        neighborColor = updateColor(row + 1 < dim ? liveBoard[row + 1][col] : '', neighborColor);
        neighborColor = updateColor(col - 1 >= 0 ? liveBoard[row][col - 1] : '', neighborColor);
        neighborColor = updateColor(col + 1 < dim ? liveBoard[row][col + 1] : '', neighborColor);
        if (neighborColor == 'Both') break;
      }
     // if (neighborColor == 'W') score.white += emptySet.length;
      //else if (neighborColor == 'B') score.black += emptySet.length;
    }
    
  }

  */
  function updateColor(color: string, neighborColor: string) {
    return color == '' ? neighborColor : (neighborColor == color || neighborColor == '' ? color : 'Both'); 
  }

  function maybeSendComputerMove() {
    if (!isComputerTurn()) return;
    let move = gameLogic.createComputerMove(board, turnIndex);
    log.info("Computer move: ", move);
    makeMove(move);
  }

  function makeMove(move: IMove) {
    if (didMakeMove) { // Only one move per updateUI
      return;
    }
    didMakeMove = true;
    let delta = move.state.delta;
    let chatDescription = indexToLetter(delta.col) + indexToNumber(delta.row);
    if (!proposals) {
      gameService.makeMove(move, null, chatDescription);
    } else {
      let myProposal:IProposal = {
        data: {
          delta: delta,
        },
        playerInfo: yourPlayerInfo,
      };
      // Decide whether we make a move or not.
      if (proposals[delta.row][delta.col] < currentUpdateUI.numberOfPlayersRequiredToMove - 1) {
        move = null;
      } else {
          let chosenDeadBoardProposal = gameLogic.createNewBoardWithElement(dim, false);
      }
      gameService.makeMove(move, myProposal, chatDescription);
    }
  }

  function isFirstMove() {
    return !currentUpdateUI.state;
  }

  function yourPlayerIndex() {
    return currentUpdateUI.yourPlayerIndex;
  }

  function isComputer() {
    let playerInfo = currentUpdateUI.playersInfo[currentUpdateUI.yourPlayerIndex];
    return playerInfo && playerInfo.playerId === '';
  }

  export function isComputerTurn() {
    return isMyTurn() && isComputer();
  }

  export function isHumanTurn() {
    return isMyTurn() && !isComputer();
  }

  export function isMyTurn() {
    return !didMakeMove && // you can only make one move per updateUI.
      currentUpdateUI.turnIndex >= 0 && // game is ongoing
      currentUpdateUI.yourPlayerIndex === currentUpdateUI.turnIndex; // it's my turn
  }

  export function passClicked() {
    //Clicking on the PASS button triggers this function
    //It will increment the number of passes.
    log.log(["Clicked on pass.", null]);
    moveToConfirm = {row: -1, col: -1};
    clearClickToDrag();
  }

  export function getButtonValue() {
    if (game.currentUpdateUI.endMatchScores) {
        if (game.currentUpdateUI.endMatchScores[0] === 1 && game.currentUpdateUI.endMatchScores[1] === 0) { 
            score.black = 1;
            score.white = 0;
          return translate('GAME_OVER', { BLACK_SCORE: '' + game.score.black, WHITE_SCORE: '' + game.score.white });
        }
        if (game.currentUpdateUI.endMatchScores[1] === 1) { 
            score.black = 0;
            score.white = 1;
          return translate('GAME_OVER', { BLACK_SCORE: '' + game.score.black, WHITE_SCORE: '' + game.score.white });
        }
      }
  }

  function cellClicked(rrow: number, ccol: number) {
    log.log(["Clicked on cell:", rrow, ccol]);
    if (!isHumanTurn()) {
      return;
    }
    try {
      let delta = { row: rrow, col: ccol };
      let move = gameLogic.createMove(board, delta, turnIndex);
      makeMove(move);
    } catch (e) {
      log.log(["Cannot make move:", rrow, ccol, e]);
      return;
    }
  }

  export function shouldSlowlyDrop(rrow: number, ccol: number) {
    return delta &&
      delta.row === rrow &&
      delta.col === ccol;
  }

  export function shouldExplode(row: number, col: number) {
    return boardBeforeMove[row][col] && !board[row][col];
  }

  // Returns "A" ... (but skip over "I"), see http://www.5z.com/psp/goboard.jpg
  export function indexToNumber(i: number): number {
    return dim - i;
  }
  export function indexToLetter(i: number): string {
    return String.fromCharCode(65+(i<8 ? i : i+1));
  }
  export function fontSizePx(): number {
    // for iphone4 (min(width,height)=320) it should be 8.
    return 8*Math.min(window.innerWidth, window.innerHeight) / 320;
  }
}

angular.module('myApp', ['gameServices'])
  .run(['$rootScope', '$timeout', 
  function ($rootScope: angular.IScope, $timeout: angular.ITimeoutService) {
    $rootScope['game'] = game;
    game.init($rootScope, $timeout);
  }]);
