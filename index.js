var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.emit('setdata', {
        id: socket.id
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });

    socket.on('senddata', function (data) {
        io.emit('data', data);
    });

});

var port = 8080;

http.listen(8080, function () {
    console.log('listening on *:' + port);
});