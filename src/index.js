const path = require('path')
const http = require('http')
const express = require('express')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server)
const cors = require('cors')

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))
app.use(cors())

io.on('connection', (socket) => {
    socket.on('join', (options, reset) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return reset(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        reset()
    })

    socket.on('sendMessage', (message, reset) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        reset()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
// echo "# Lets-Chat" >> README.md
// git init
// git add README.mdgit 
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/tanyaas19/Lets-Chat.git
// git push -u origin main