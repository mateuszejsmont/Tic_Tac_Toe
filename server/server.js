const express = require("express")
const app = express()

const path = require("path")
const http = require("http")
const {Server} = require("socket.io")


const server = http.createServer(app) 
const bodyParser = require('body-parser');

const io = new Server(server , {
    cors: {
        methods: ["GET", "POST"]
    },
    pingInterval: 10000,
    pingTimeout: 5000,
})
app.use(bodyParser.json());

let gameQueueArray = []
let gamesArray = []

let socketsToUsernames = {} 

io.on("connection", (socket) => {
    socket.on("join_queue", (e) => {
        const nameTaken = Object.values(socketsToUsernames).some(usr => e.username == usr)

        if (nameTaken){
            io.emit("username_taken", {username: e.username})
        }
        else {
            gameQueueArray.push(e.username)
            socketsToUsernames[socket.id] = e.username

            io.emit("queue_joined", {username: e.username})
            
            if (gameQueueArray.length >= 2){
                let p1 = {
                    name: gameQueueArray[0],
                    sign: "X",
                    move: -1
                } 
                let p2 = {
                    name: gameQueueArray[1],
                    sign: "O",
                    move: -1
                } 

                let game = {
                    p1: p1,
                    p2: p2,
                    turn: 1
                }
                gamesArray.push(game)
                gameQueueArray.splice(0, 2)

                io.emit("game_found", {game: game})
            }
        }
    })

    socket.on("move", (e) => {
        let game;
        if (e.sign == "X"){
            game = gamesArray.find(g => g.p1.name == e.username)
            if (game == null)
                return

            game.p1.move = e.move
            game.turn++
        }
        else {
            game = gamesArray.find(g => g.p2.name == e.username)
            if (game == null)
                return

            game.p2.move = e.move
            game.turn++
        }

        io.emit("move_made", {game: game})
    })
    
    socket.on("disconnect", () => {
        const username = socketsToUsernames[socket.id]
        
        if (username != null){
            delete socketsToUsernames[socket.id]
            
            gameQueueArray = gameQueueArray.filter(n => n != username)
            
            const game = gamesArray.find(g => g.p2.name == username || g.p1.name == username)
            if (game != null){
                gamesArray = gamesArray.filter(g => g != game)
                io.emit("opponent_disconnected", {username: username})
            }
        }
    })

})

app.get("/api", (req, res) => {
    return res.json({
        "queuedPlayers": gameQueueArray, 
        "currentGames": gamesArray,
        "sockets": socketsToUsernames, 
        "hostname": http.request.headers.host,
    })
})

server.listen(8080, () => {
    console.log("Server started on 8080")
})