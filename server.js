//
const express = require('express');
const app = express();
const path = require('path');
const httpServer = require('http').Server(app);
const io = require('socket.io').listen(httpServer);

let users = [];

let messages = [];

httpServer.listen(process.env.PORT || 3000, function () {
    console.log('listening on *:3000');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (request, respond) {
    respond.sendFile(path.join(__dirname, +'public/index.html'));
});

// Event handler on the connection event for socket.io.
// When someone connects to the app, give reference to that socket and do whatever with it
io.sockets.on('connection', function (socket) {

    const username = '_' + Math.random().toString(36).substr(2, 9);

    socket.on('returning user', function (user, color) {

        if (user !== "") {
            socket.username = user;
            socket.color = color;
            socket.emit('new user', socket.username, socket.color, messages, false);
        } else {
            socket.username = username;
            socket.color = "black";
            socket.emit('new user', socket.username, socket.color, messages, false);

        }

        users.push(socket.username);

        io.sockets.emit('update users', users);

    });


    socket.on('send message', function (message) {

        let isValidColor = false;

        if (message.includes("/nickcolor") && message.length === 17) {

            isValidColor = /^[0-9A-F]{6}$/i.test(message.split(" ")[1]);

            if (isValidColor) {
                socket.color = "#" + message.split(" ")[1];
                socket.emit("set cookie", "color", socket.color);

            } else
                socket.emit('color error');

        } else if (message.includes("/nickcolor"))
            socket.emit('color error');

        else if (message.trim().includes("/nick") && message.trim().length > 6) {

            let nickName = message.slice(message.indexOf("/") + 5);

            let unique = true;

            for (let i = 0; i < users.length; i++) {

                if (users[i].toLowerCase() === nickName.toLowerCase()) {
                    socket.emit('name error');
                    unique = false;
                    break;
                }
            }

            if (unique) {
                let index = users.indexOf(socket.username);
                if (index !== -1) {
                    socket.username = nickName;
                    users[index] = socket.username;
                    socket.emit("new user", nickName, socket.color, messages, true);
                    io.sockets.emit('update users', users);
                    socket.emit("set cookie", "username", socket.username);
                }
            }
        } else {
            let date = new Date();
            let time = (date.getHours() + ":" + date.getMinutes());

            let messageDetail = {user: socket.username, msg: message, time: time, color: socket.color};

            messages.push(messageDetail);

            // Emit an event with the tag new message
            io.sockets.emit('new message', messageDetail);
        }
    });


    socket.on('disconnect', function (data) {
        users.splice(users.indexOf(socket.username), 1);
        if (duplicates(users, socket.username) === 0)
            io.sockets.emit('update users', users);
    });


});


function duplicates(users, username) {

    let count = 0;

    for (let i = 0; i < users.length; i++) {
        if (users[i] === username)
            count++;
    }

    return count;

}
