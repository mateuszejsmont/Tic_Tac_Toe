import './App.css'
import React, {useEffect, useState} from 'react'
import io from 'socket.io-client'; 

const socket = io.connect(':8080')

function App() {
  const [inQueue, setInQueue] = useState(false)
  const [inGame, setInGame] = useState(false)
  const [username, setUsername] = useState('')
  const [userSign, setUserSign] = useState('')
  const [opponent, setOpponent] = useState('')
  const [canMove, setCanMove] = useState(false)
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', ''])
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const handleQueueJoined = (e) => {
      if (e.username == username && !inQueue) {
        setInQueue(true)
      }
    }
    const handleUsernameTaken = (e) => {
      if (e.username == username && !inQueue){
        alert("This username is already taken!")
      }
    }
    const handleGameFound = (e) => {
      if (inQueue && !inGame) {
        if (e.game.p1.name == username || e.game.p2.name == username){
          const oppName = e.game.p1.name == username ? e.game.p2.name : e.game.p1.name
          const sign = e.game.p1.name == username ? e.game.p1.sign : e.game.p2.sign

          setOpponent(oppName)
          setUserSign(sign)
          setCanMove(e.game.p1.name == username)
          setInGame(true)
        }
      }
    } 
    const handleMoveMade = (e) => {
      if (e.game.p1.name == username || e.game.p2.name == username){
        if (e.game.p1.move != -1)
          board[e.game.p1.move] = e.game.p1.sign        
        if (e.game.p2.move != -1)
          board[e.game.p2.move] = e.game.p2.sign        

        setBoard(board)
        setCanMove((e.game.turn % 2 == 0 && userSign == "O") || (e.game.turn % 2 == 1 && userSign == "X"))
      }

      checkForWinner(e.game.turn)
    }
    const handleOpponentDisconnected = (e) => {
      if (inGame && !ended && (username == e.username || opponent == e.username)){
          endGame("Your opponent disconnected!")
      }
    }

    socket.on("queue_joined", handleQueueJoined)
    socket.on("username_taken", handleUsernameTaken)
    socket.on("game_found", handleGameFound)
    socket.on("move_made", handleMoveMade)
    socket.on("opponent_disconnected", handleOpponentDisconnected)

    return () => {
      socket.off("queue_joined", handleQueueJoined);
      socket.off("username_taken", handleUsernameTaken);
      socket.off("game_found", handleGameFound);
      socket.off("move_made", handleMoveMade);
      socket.off("opponent_disconnected", handleOpponentDisconnected);
    };
      
  }, [username, inGame, inQueue, board, opponent, ended])

  const handleSearchClick = () => {
    if (username == ''){
      alert("Enter a name!")
    }
    else {
      socket.emit("join_queue", {username: username})
      console.log(username)
    }
  }
  const handleTileClick = (id) => {
    if (!ended && canMove && board[id] == ''){
      board[id] = userSign
      setBoard(board)

      socket.emit("move", {username: username, sign: userSign, move: id})
    }
  }
  const checkForWinner = (turn) => {
    const someoneWon = ((board[0] == board[1] && board[1] == board[2] && board[0] != '') || (board[3] == board[4] && board[4] == board[5] && board[3] != '') || (board[6] == board[7] && board[7] == board[8] && board[6] != '') || (board[0] == board[3] && board[3] == board[6] && board[0] != '') || (board[1] == board[4] && board[4] == board[7] && board[1] != '') || (board[2] == board[5] && board[5] == board[8] && board[2] != '') || (board[0] == board[4] && board[4] == board[8] && board[0] != '') || (board[2] == board[4] && board[4] == board[6] && board[2] != '')) 
        
    if (someoneWon || turn == 10) {
        let alertText = !someoneWon ? "Draw!" : turn % 2 == 0 ? "The winner is X!" : "The winner is O!"
        endGame(alertText)
    }
  }
  const endGame = (alertText) => {
    setEnded(true)
    setTimeout(() => {
      alert(alertText)
      
      setTimeout(() => {
        window.location.reload(); // Odświeża stronę
      }, 5000); 
    }, 100)
}

  return (
    <div>
      <h1>Tic Tac Toe</h1>
       {inGame ? (
        <div>
          <div id="nicknamesCont">
            <p id="userCont">You : {username} </p>
            <p id="oppCont">Opponent : {opponent} </p>
          </div>
          <br/>
          <p id="userSignCont">You are playing as {userSign}</p>
          <br/>
          <p id="whosTurn">{canMove ? "Your Turn" : "Opponent's Turn"}</p>            
          <div id="bigCont" class="centerContent">
            <div id="cont">
                <button class="btn" onClick={() => handleTileClick(0)}>{board[0]}</button>
                <button class="btn" onClick={() => handleTileClick(1)}>{board[1]}</button>
                <button class="btn" onClick={() => handleTileClick(2)}>{board[2]}</button>
                <button class="btn" onClick={() => handleTileClick(3)}>{board[3]}</button>
                <button class="btn" onClick={() => handleTileClick(4)}>{board[4]}</button>
                <button class="btn" onClick={() => handleTileClick(5)}>{board[5]}</button>
                <button class="btn" onClick={() => handleTileClick(6)}>{board[6]}</button>
                <button class="btn" onClick={() => handleTileClick(7)}>{board[7]}</button>
                <button class="btn" onClick={() => handleTileClick(8)}>{board[8]}</button>
            </div>
          </div>
        </div>
       ) : (
        <div>
          {inQueue ? (
            <p>Searching for player...</p>
          ) : (
            <div>
              <div class="centerContent">
                  <p id="enterName">Enter your name : </p>
                  <input type="text" placeholder="Name" id="name" autocomplete="off" onChange={(e) => setUsername(e.target.value)}/>
              </div>
              <div class="centerContent">
                <button id="find" onClick={handleSearchClick}>Seach for a player</button>
              </div>
            </div>
          )}
        </div>
       )}
    </div>
  );
}

export default App;
