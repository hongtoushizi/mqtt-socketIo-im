/**
 * Created by hongshuai.yuan on 15-3-31.
 */

var mysql = require('mysql');
var db_config = {
    host: 'localhost',
    user: 'kuulabu',
    password: 'kuulabu',
    database: 'Kuulabu',
    socketPath: '/var/run/mysqld/mysqld.sock'
};
// Create a MySQL connection pool with
// a max of 10 connections, a min of 2, and a 30 second max idle time
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name: 'mysql',
    create: function (callback) {
        var connection = require('mysql').createConnection(db_config);
        callback(null, connection);
    },
    destroy: function (client) {
        client.end();
    },
    max: 30,
    // optional. if you set this, make sure to drain() (see step 3)
    min: 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis: 30000,
    // if true, logs via console.log - can also be a function
    log: false
});


//var connection = mysql.createConnection(db_config);
//
//connection.connect(function (err) {
//	if (err) {
//		console.error('error connecting: ' + err.stack);
//		return;
//	}
//
//	console.log('connected as id ' + connection.threadId);
//});


exports.insertChatMessage = function (packet, client, callback) {
//	console.log("我们自己发送的消息。");
//	console.log('Published----packet.topic----', packet.topic);
//	console.log('Published----packet.payloay----', packet.payload);
//	console.log('Published----packet.qos----', packet.qos);
//	console.log('Published----packet.messageId----', packet.messageId);
//	console.log('published---- client', client.id);
    accepter = packet.topic.split("/");
    sendUser = client.id.split("/");
    if (accepter[0] == 'USER_TO_USER') {
        var sendUserId = sendUser[sendUser.length - 1];
        var accepterId = accepter[accepter.length - 1];

        var message = packet.payload;
        var msg = JSON.parse(message).lastMsg;
        console.log("msg---lastMsg---------------" + msg);

        var sendTime = Date.parse(new Date()) / 1000;
        var accepterRoom = accepterId + "_" + sendUserId;
        var sendUserRoom = sendUserId + "_" + accepterId;
        var post = {sendUserId: sendUserId, message: msg, sendTime: sendTime};
        pool.acquire(function (err, connection) {
            if (err) {
                // handle error - this is generally the err from your
                // factory.create function
            }
            else {
                //connection.query("select * from ChatMessage", [], function() {
                //    // return object back to pool
                //    pool.release(connection);
                //});

                connection.beginTransaction(function (err) {
                    if (err) {
                        throw err;
                    }
                    connection.query('INSERT INTO ChatMessage SET ?', post, function (err, result) {
                        if (err) {
                            connection.rollback(function () {
                                throw err;
                            });
                        }
                        var log = 'Post ' + result.insertId + ' added';
                        var data = {accepterUserId: accepterId, chatMessageId: result.insertId, room: accepterRoom};
                        console.log("data----------" + data);
                        connection.query('INSERT INTO UserChatMessage SET ?', data, function (err, result) {
                            if (err) {
                                connection.rollback(function () {
                                    throw err;
                                });
                            }
                        });
                        var data = {accepterUserId: sendUserId, chatMessageId: result.insertId, room: sendUserRoom};
                        console.log("data----------" + data);
                        connection.query('INSERT INTO UserChatMessage SET ?', data, function (err, result) {
                            if (err) {
                                connection.rollback(function () {
                                    throw err;
                                });
                            }
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                console.log('success!');
                            });
                        });
                    });
                });
                pool.release(connection);

            }
        });

    } else if (sendUser[0] == "CLUB") {
        console.log();
    }
}


exports.name = function () {
    console.log('My name is Lemmy Kilmister');
};





