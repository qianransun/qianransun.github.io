;
var game;
(function (game) {
    game.isModalShown = false;
    game.modalTitle = "";
    game.modalBody = "";
    game.$rootScope = null;
    game.$timeout = null;
    game.currentUpdateUI = null;
    game.didMakeMove = false; // You can only make one move per updateUI
    game.board = null;
    game.boardBeforeMove = null;
    game.moveToConfirm = null;
    game.delta = null;
    game.posJustCapturedForKo = null;
    game.score = { white: 0, black: 0 };
    // For community games.
    game.playerIdToProposal = null;
    game.proposals = null;
    game.yourPlayerInfo = null;
    game.hidePassButtonForTesting = location.search == "?hidePassButtonForTesting"; // only locally to create printscreens of just the board.
    game.hasDim = false;
    game.dim = 9;
    function rowsPercent() {
        return 100 / game.dim;
    }
    game.rowsPercent = rowsPercent;
    function dotX(m) {
        return -rowsPercent() / 2 + (rowsPercent()) * ((game.dim == 9 ? 2 : 3) +
            (game.dim == 19 ? 6 : game.dim == 13 ? 3 : 2) * m + 1);
    }
    game.dotX = dotX;
    var clickToDragPiece;
    var draggingLines;
    var horizontalDraggingLine;
    var verticalDraggingLine;
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
    function getTranslations() {
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
                "zh": "对手选择棋盘大小，并下子",
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
                "zh": "确认",
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
    function init($rootScope_, $timeout_) {
        game.$rootScope = $rootScope_;
        game.$timeout = $timeout_;
        draggingLines = document.getElementById("draggingLines");
        horizontalDraggingLine = document.getElementById("horizontalDraggingLine");
        verticalDraggingLine = document.getElementById("verticalDraggingLine");
        clickToDragPiece = document.getElementById("clickToDragPiece");
        game.gameArea = document.getElementById("gameArea");
        game.boardArea = document.getElementById("boardArea");
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        resizeGameAreaService.setWidthToHeight(game.hidePassButtonForTesting ? 1 : 0.8);
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
        gameService.setGame({
            updateUI: updateUI,
            getStateForOgImage: getStateForOgImage,
        });
    }
    game.init = init;
    function getStateForOgImage() {
        if (!game.currentUpdateUI || !game.currentUpdateUI.state) {
            log.warn("Got stateForOgImage without currentUpdateUI!");
            return '';
        }
        var state = game.currentUpdateUI.state;
        if (!state || !game.hasDim)
            return '';
        var board = state.board;
        if (!board)
            return '';
        var boardStr = '';
        for (var row = 0; row < game.dim; row++) {
            for (var col = 0; col < game.dim; col++) {
                boardStr += board[row][col] == 'W' ? 'w' : board[row][col] == 'B' ? 'b' : 'x';
            }
        }
        return boardStr;
    }
    game.getStateForOgImage = getStateForOgImage;
    function showContinuePlayingOrAgreeButtons() {
        return isMyTurn();
    }
    game.showContinuePlayingOrAgreeButtons = showContinuePlayingOrAgreeButtons;
    function continuePlayingClicked() {
        if (!showContinuePlayingOrAgreeButtons())
            return;
        log.info("continuePlayingClicked");
        game.score = { white: 0, black: 0 };
    }
    game.continuePlayingClicked = continuePlayingClicked;
    function showConfirmButton() {
        return game.moveToConfirm != null;
    }
    game.showConfirmButton = showConfirmButton;
    function confirmClicked() {
        if (!showConfirmButton())
            return;
        cellClicked(game.moveToConfirm.row, game.moveToConfirm.col);
        clearClickToDrag();
        game.moveToConfirm = null;
    }
    game.confirmClicked = confirmClicked;
    function showModal(titleId, bodyId) {
        if (!isMyTurn())
            return;
        log.info("showModal: ", titleId);
        game.isModalShown = true;
        game.modalTitle = translate(titleId);
        game.modalBody = translate(bodyId);
    }
    var cacheIntegersTill = [];
    function getIntegersTill(number) {
        if (cacheIntegersTill[number])
            return cacheIntegersTill[number];
        var res = [];
        for (var i = 0; i < number; i++) {
            res.push(i);
        }
        cacheIntegersTill[number] = res;
        return res;
    }
    game.getIntegersTill = getIntegersTill;
    var cacheMatrixTill = [];
    function getMatrixTill(number) {
        if (cacheMatrixTill[number])
            return cacheMatrixTill[number];
        var res = [];
        for (var i = 0; i < number; i++) {
            for (var j = 0; j < number; j++) {
                res.push([i, j]);
            }
        }
        cacheMatrixTill[number] = res;
        return res;
    }
    game.getMatrixTill = getMatrixTill;
    function handleDragEvent(type, clientX, clientY) {
        if (!isHumanTurn()) {
            return; // if the game is over, do not display dragging effect
        }
        if (type === "touchstart" && game.moveToConfirm != null) {
            game.moveToConfirm = null;
            game.$rootScope.$apply();
        }
        // Center point in boardArea
        var x = clientX - game.boardArea.offsetLeft - game.gameArea.offsetLeft;
        var y = clientY - game.boardArea.offsetTop - game.gameArea.offsetTop;
        // Is outside boardArea?
        var button = document.getElementById("button");
        if (x < 0 || x >= game.boardArea.clientWidth || y < 0 || y >= game.boardArea.clientHeight) {
            clearClickToDrag();
            return;
        }
        // Inside boardArea. Let's find the containing square's row and col
        var col = Math.floor(game.dim * x / game.boardArea.clientWidth);
        var row = Math.floor(game.dim * y / game.boardArea.clientHeight);
        // if the cell is not empty, don't preview the piece, but still show the dragging lines
        if (game.board[row][col] !== '') {
            clearClickToDrag();
            return;
        }
        clickToDragPiece.style.display = "inline";
        draggingLines.style.display = "inline";
        var centerXY = getSquareCenterXY(row, col);
        verticalDraggingLine.setAttribute("x1", "" + centerXY.x);
        verticalDraggingLine.setAttribute("x2", "" + centerXY.x);
        horizontalDraggingLine.setAttribute("y1", "" + centerXY.y);
        horizontalDraggingLine.setAttribute("y2", "" + centerXY.y);
        // show the piece
        //let cell = document.getElementById('board' + row + 'x' + col).className = $scope.turnIndex === 0 ? 'black' : 'white';
        var topLeft = getSquareTopLeft(row, col);
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
    function getSquareTopLeft(row, col) {
        var size = getSquareWidthHeight();
        return { top: row * size.height, left: col * size.width };
    }
    function getSquareWidthHeight() {
        var boardArea = document.getElementById("boardArea");
        return {
            width: boardArea.clientWidth / (game.dim),
            height: boardArea.clientHeight / (game.dim)
        };
    }
    function getSquareCenterXY(row, col) {
        var size = getSquareWidthHeight();
        return {
            x: col * size.width + size.width / 2,
            y: row * size.height + size.height / 2
        };
    }
    function dragDone(row, col) {
        game.$rootScope.$apply(function () {
            game.moveToConfirm = { row: row, col: col };
        });
    }
    function setDim(d) {
        game.dim = d;
        game.hasDim = true;
        game.board = gameLogic.createNewBoard(game.dim);
        game.boardBeforeMove = gameLogic.createNewBoard(game.dim);
    }
    game.setDim = setDim;
    function getBoardPiece(row, col) {
        var piece = game.board[row][col];
        var pieceBefore = game.boardBeforeMove[row][col];
        var isProposal = game.proposals && game.proposals[row][col] > 0;
        return isProposal ? (game.currentUpdateUI.turnIndex == 0 ? 'B' : 'W') :
            !piece && !pieceBefore ? '' : (piece == 'B' || pieceBefore == 'B' ? 'B' : 'W');
    }
    game.getBoardPiece = getBoardPiece;
    function getCellStyle(row, col) {
        if (!game.proposals)
            return {};
        var count = game.proposals[row][col];
        if (count == 0)
            return {};
        // proposals[row][col] is > 0
        var countZeroBased = count - 1;
        var maxCount = game.currentUpdateUI.numberOfPlayersRequiredToMove - 2;
        var ratio = maxCount == 0 ? 1 : countZeroBased / maxCount; // a number between 0 and 1 (inclusive).
        // scale will be between 0.6 and 0.8.
        var scale = 0.6 + 0.2 * ratio;
        // opacity between 0.5 and 0.7
        var opacity = 0.5 + 0.2 * ratio;
        return {
            transform: "scale(" + scale + ", " + scale + ")",
            opacity: "" + opacity,
        };
    }
    game.getCellStyle = getCellStyle;
    function updateProposals() {
        // This must be after calling updateUI, because we nullify things there (like proposals)
        game.didMakeMove = !!game.playerIdToProposal[game.yourPlayerInfo.playerId];
        game.proposals = gameLogic.createNewBoardWithElement(19, 0); // Community matches are always 19x19.
        game.proposals[-1] = [];
        game.proposals[-1][-1] = 0; // number of times we proposed to pass.
        for (var playerId in game.playerIdToProposal) {
            var proposal = game.playerIdToProposal[playerId];
            var delta_1 = proposal.data.delta;
            game.proposals[delta_1.row][delta_1.col]++;
        }
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.didMakeMove = false; // Only one move per updateUI
        game.yourPlayerInfo = params.yourPlayerInfo;
        game.playerIdToProposal = params.playerIdToProposal;
        game.proposals = null;
        if (game.playerIdToProposal) {
            updateProposals();
            // If only proposals changed, then return.
            // I don't want to disrupt the player if he's in the middle of a move.
            params.playerIdToProposal = null;
            if (game.currentUpdateUI && angular.equals(game.currentUpdateUI, params))
                return;
        }
        game.currentUpdateUI = params;
        game.score = { white: 0, black: 0 };
        clearClickToDrag();
        game.moveToConfirm = null;
        if (isFirstMove()) {
            game.hasDim = false;
            game.delta = null;
            game.board = gameLogic.createNewBoard(game.dim);
            game.boardBeforeMove = gameLogic.createNewBoard(game.dim);
            if (game.playerIdToProposal)
                setDim(19); // Community matches are always 19x19.
        }
        else {
            var state = params.state;
            game.board = state.board;
            game.hasDim = true;
            game.dim = game.board.length;
            game.boardBeforeMove = state.boardBeforeMove;
            game.delta = state.delta;
        }
        game.turnIndex = params.turnIndex;
        clickToDragPiece.src = "imgs/" + (game.turnIndex === 0 ? 'black' : 'white') + "Stone.svg";
        if (isComputerTurn()) {
            game.$timeout(maybeSendComputerMove, 500);
        }
    }


    /*
    function calcScore() {
        game.score = { white: 0, black: 0 };
        var liveBoard = angular.copy(game.board);
        var emptyBoard = gameLogic.createNewBoard(game.dim); // has 'W' in all empty places.
        for (var row = 0; row < game.dim; row++) {
            for (var col = 0; col < game.dim; col++) {
                if (liveBoard[row][col] == '')
                    emptyBoard[row][col] = 'W';
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
    game.calcScore = calcScore;

    */
    function updateColor(color, neighborColor) {
        return color == '' ? neighborColor : (neighborColor == color || neighborColor == '' ? color : 'Both');
    }
    function maybeSendComputerMove() {
        if (!isComputerTurn())
            return;
        var move = gameLogic.createComputerMove(game.board, game.turnIndex);
        log.info("Computer move: ", move);
        makeMove(move);
    }
    function makeMove(move) {
        if (game.didMakeMove) {
            return;
        }
        game.didMakeMove = true;
        var delta = move.state.delta;
        var chatDescription = indexToLetter(delta.col) + indexToNumber(delta.row);
        if (!game.proposals) {
            gameService.makeMove(move, null, chatDescription);
        }
        else {
            var myProposal = {
                data: {
                    delta: delta,
                },
                playerInfo: game.yourPlayerInfo,
            };
            // Decide whether we make a move or not.
            if (game.proposals[delta.row][delta.col] < game.currentUpdateUI.numberOfPlayersRequiredToMove - 1) {
                move = null;
            }
            else {
                var chosenDeadBoardProposal = gameLogic.createNewBoardWithElement(game.dim, false);
            }
            gameService.makeMove(move, myProposal, chatDescription);
        }
    }
    function isFirstMove() {
        return !game.currentUpdateUI.state;
    }
    function yourPlayerIndex() {
        return game.currentUpdateUI.yourPlayerIndex;
    }
    function isComputer() {
        var playerInfo = game.currentUpdateUI.playersInfo[game.currentUpdateUI.yourPlayerIndex];
        return playerInfo && playerInfo.playerId === '';
    }
    function isComputerTurn() {
        return isMyTurn() && isComputer();
    }
    game.isComputerTurn = isComputerTurn;
    function isHumanTurn() {
        return isMyTurn() && !isComputer();
    }
    game.isHumanTurn = isHumanTurn;
    function isMyTurn() {
        return !game.didMakeMove &&
            game.currentUpdateUI.turnIndex >= 0 &&
            game.currentUpdateUI.yourPlayerIndex === game.currentUpdateUI.turnIndex; // it's my turn
    }
    game.isMyTurn = isMyTurn;
    function passClicked() {
        //Clicking on the PASS button triggers this function
        //It will increment the number of passes.
        log.log(["Clicked on pass.", null]);
        game.moveToConfirm = { row: -1, col: -1 };
        clearClickToDrag();
    }
    game.passClicked = passClicked;
    function getButtonValue() {
        if (game.currentUpdateUI.endMatchScores) {
            if (game.currentUpdateUI.endMatchScores[0] === 1 && game.currentUpdateUI.endMatchScores[1] === 0) {
                game.score.black = 1;
                game.score.white = 0;
                return translate('GAME_OVER', { BLACK_SCORE: '' + game.score.black, WHITE_SCORE: '' + game.score.white });
            }
            if (game.currentUpdateUI.endMatchScores[1] === 1) {
                game.score.black = 0;
                game.score.white = 1;
                return translate('GAME_OVER', { BLACK_SCORE: '' + game.score.black, WHITE_SCORE: '' + game.score.white });
            }
        }
    }
    game.getButtonValue = getButtonValue;
    function cellClicked(rrow, ccol) {
        log.log(["Clicked on cell:", rrow, ccol]);
        if (!isHumanTurn()) {
            return;
        }
        try {
            var delta_2 = { row: rrow, col: ccol };
            var move = gameLogic.createMove(game.board, delta_2, game.turnIndex);
            makeMove(move);
        }
        catch (e) {
            log.log(["Cannot make move:", rrow, ccol, e]);
            return;
        }
    }
    function shouldSlowlyDrop(rrow, ccol) {
        return game.delta &&
            game.delta.row === rrow &&
            game.delta.col === ccol;
    }
    game.shouldSlowlyDrop = shouldSlowlyDrop;
    function shouldExplode(row, col) {
        return game.boardBeforeMove[row][col] && !game.board[row][col];
    }
    game.shouldExplode = shouldExplode;
    // Returns "A" ... (but skip over "I"), see http://www.5z.com/psp/goboard.jpg
    function indexToNumber(i) {
        return game.dim - i;
    }
    game.indexToNumber = indexToNumber;
    function indexToLetter(i) {
        return String.fromCharCode(65 + (i < 8 ? i : i + 1));
    }
    game.indexToLetter = indexToLetter;
    function fontSizePx() {
        // for iphone4 (min(width,height)=320) it should be 8.
        return 8 * Math.min(window.innerWidth, window.innerHeight) / 320;
    }
    game.fontSizePx = fontSizePx;
})(game || (game = {}));
angular.module('myApp', ['gameServices'])
    .run(['$rootScope', '$timeout',
    function ($rootScope, $timeout) {
        $rootScope['game'] = game;
        game.init($rootScope, $timeout);
    }]);
