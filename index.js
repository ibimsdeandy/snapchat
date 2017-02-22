var app = require('express')();
var express = require('express');
var md5 = require('js-md5');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var gag = require('node-9gag');
var jsonfile = require('jsonfile')
var users = {};
var data = {
    id: null,
    username: null
};

var players = [];

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/register', function (req, res) {
    res.sendFile(__dirname + '/register.html');
});


io.sockets.on('connection', function (socket) {

    users[socket.id] = {
        name: socket.id,
        isTyping: null,
        state: 'online',
        status: ''
    };

    data.id = socket.id;

    /**
     * JOIN
     */

    socket.on('Join', function (data) {

        var file = 'accounts/' + data.username + '.json'

        jsonfile.readFile(file, function (err, obj) {

            if (err == null) {

                if (data.password == 'autologin' || obj.password == md5(data.password)) {

                    obj.id = socket.id;

                    return socket.emit('Join', {
                        state: true,
                        data: obj
                    });
                }

                return socket.emit('Join', {
                    state: false,
                    container: 'password',
                    text: 'Wrong password'
                });

            }

            return socket.emit('Join', {
                state: false,
                container: 'username',
                text: 'Wrong user'
            });

        });

    });

    /**
     * Register
     */

    socket.on('Register', function (d) {

        var file = 'accounts/' + d.username + '.json'

        jsonfile.readFile(file, function (err, obj) {

            if (err == null) {
                return socket.emit('Register', false);
            }

            obj = {
                username: d.username,
                password: md5(d.password),
                isTyping: false,
                state: 'online',
                status: ''
            };

            jsonfile.writeFile(file, obj, function (err) {
                return socket.emit('Register', true);
            });

            socket.emit('Register', true);

        });

    });

    socket.emit('SetData', data);

    io.emit('GetUserList', users);

    socket.on('FindPlayers', function (id) {
        players.push(id);
        io.emit('FindPlayers', players);
    });

    socket.on('IsTyping', function (data) {
        users[data[0]].isTyping = data[1];
        io.emit('GetUserList', users);
    });

    socket.on('SetStatusText', function (data) {

        console.log(data);

        var file = 'accounts/' + data.user.username + '.json';

        jsonfile.readFile(file, function (err, obj) {

            obj.status = data.text;

            jsonfile.writeFile(file, obj, function (err) {
                console.log(err);
            });

        });

    });

    socket.on('SetState', function (data) {
        users[data[0]].state = data[1];
        io.emit('GetUserList', users);
    });

    socket.on('SetUsername', function (data) {
        users[data.id].name = data.name;
        io.emit('GetUserList', users);
    });

    socket.on('9gag', function (data) {
        gag.find(data, function (err, res) {
            socket.emit('9gag', res.result);
        });
    });

    socket.on('ChatMessage', function (data) {
        data.name = users[data.id].name;
        io.emit('ChatMessage', data);
    });

    socket.on('disconnect', function () {
        delete users[socket.id];
        //sendSystemMessage(io, socket.id + ' has disconnected', 'danger');
        io.emit('GetUserList', users);
    });


});

function sendSystemMessage(io, text, type) {
    io.emit('ChatMessage', {
        id: 's',
        date: new Date(),
        text: text,
        type: (typeof type === undefined ? 'warning' : type)
    });
}


http.listen(3000, function () {
    console.log('listening on *:3000');
});