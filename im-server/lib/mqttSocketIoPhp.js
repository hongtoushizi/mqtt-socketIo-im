var http = require('http');
var sys = require('sys');
var net = require('net');
global.mqtt = require('mqtt');

//由于mysql版本问题，暂时屏蔽。

 //var mysql = require('mysql');
 //var db_config = {
 //host: 'localhost',
 //user: 'kuulabu',
 //password: 'kuulabu',
 //database: 'Kuulabu'
 //};
 //
 //var connection;
 //
 //function handleDisconnect() {
 //connection = mysql.createConnection(db_config); // Recreate the connection, since
 //// the old one cannot be reused.
 //connection.connect(function(err) {              // The server is either down
 //if(err) {                                     // or restarting (takes a while sometimes).
 //console.log('error when connecting to db:', err);
 //setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
 //}                                     // to avoid a hot loop, and to allow our node script to
 //});                                     // process asynchronous requests in the meantime.
 //// If you're also serving http, display a 503 error.
 //connection.on('error', function(err) {
 //console.log('db error', err);
 //if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
 //handleDisconnect();                         // lost due to either server restart, or a
 //} else {                                      // connnection idle timeout (the wait_timeout
 //throw err;                                  // server variable configures this)
 //}
 //});
 //}
 //
 //handleDisconnect();
 
Array.prototype.indexOf = function (val) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == val) return i;
	}
	return -1;
};
Array.prototype.remove = function (val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};

Array.prototype.in_array = function (e) {
	for (i = 0; i < this.length && this[i] != e; i++);
	return !(i == this.length);
}

var util = require('util');
//var client = mqtt.connect();
var host = 'localhost';
var client =  mqtt.connect({ port: 1883, host: host, keepalive: 10000});

global.io = require('socket.io');
var Memcached = require('memcached');
var memcached = new Memcached('localhost:11211');
//var PHPUnserialize = require('php-unserialize');
//var sessionecode =  require('./session_decode.js');
server = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('node shell\n');
});
server.listen(5000);
io = io.listen(server);
//var createMqttServer = require('./createMqttServer.js');
var roomOnlineNum = new Array();
var obj = {};
var onlineUsersId = new Array();
var socketMap = {};
//var roomUserToUser = 'userTouser-';
var userClients = new Array();
var msg = '';
var portrait = '';
var mqttContent = '';
var sql = '';
var roomActivity = 'activity-';
var roomClub = 'club-';
var roomUsersGroup = 'group-';
var roomUserToUser = 'userTouser-';
var socketArr = new Array();
var new_data = new Array();
function stripscript(s) {
	var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）&mdash;—|{}【】‘；：”“'。，、？]");
	var rs = "";
	for (var i = 0; i < s.length; i++) {
		rs = rs + s.substr(i, 1).replace(pattern, '');
	}
	return rs;
}


io.sockets.on('connection', function (socket) {
	var topic = '';

	for (sessionId in io.clients) {
		io.clients[sessionId].send(JSON.stringify(update));
	}


	socket.on('subscribe', function (data) {
		var count = 1;
		socket.topic = data.topic;
		socket.payload = data.payload;
		room = data.topic;
		userInfo = JSON.parse(data.payload);
		phpsession = userInfo.phpsession + '_userId';

		socketArr[socket.id] = userInfo.userId;
		console.log('socketArr');
		console.log(socketArr);
		console.log('socketArr');
		socketMap[roomUserToUser + userInfo.userId] = socket;

		sql = "select activityId from ActivityUserInvitation where inviteeUserId= " + connection.escape(userInfo.userId);
		connection.query(sql, function (err, results) {
			for (i = 0; i < results.length; i++) {
				socket.join(roomActivity + results[i].activityId);
			}
		});
		sql = "select kuulabuId from KuulabuUser where userId= " + connection.escape(userInfo.userId);
		connection.query(sql, function (err, results) {
			for (i = 0; i < results.length; i++) {
				socket.join(roomClub + results[i].kuulabuId);
			}
		});

		console.log('clientId:' + socket.id);
		var userClientArr = new Array();

		memcached.get(userInfo.userId, function (err, result) {
			if (result) {
				result = new String(result);
				data = result.split(",");
				console.log('testtest-----test-----');
				for (i = 0; i < data.length; i++) {
					console.log("data  " + i + ":" + data[i]);
				}
				console.log('testtest-----test-----');
				if (!data.in_array(socket.id)) {
					data.push(socket.id);
					userClients = data.join(",");
					console.log("userClients:" + userClients);
					memcached.set(userInfo.userId, userClients, 10000, function (err, result) {
						if (err) console.error(err);
						console.dir(result);
						console.log('stop aaaaa===========================');
					});
				}
			} else {
				userClientArr.push(socket.id);
				userClients = userClientArr.join(",");
				memcached.set(userInfo.userId, userClients, 10000, function (err, result) {
					if (err) console.error(err);
					console.dir(result);
				});
				console.log('data start ');
				console.log(data);
				console.log('data end! ');
			}
		});

		sql = "select friendUserId from UserFriend where isAuthorized=1 and  userId =  " + connection.escape(userInfo.userId);
		connection.query(sql, function (err, results) {
			for (i = 0; i < results.length; i++) {

				roomMyFriends = roomUserToUser + results[i].friendUserId;
				if (socketMap.hasOwnProperty(roomMyFriends)) {

					socketFriend = socketMap[roomMyFriends];

					socketFriend.emit('online', {'topic': roomMyFriends,
						'room': roomMyFriends,
						'payload': String(userInfo.userId)});
				}
			}
		});


//              socket.join(data.topic);
		client.subscribe(data.topic);


		userTouserNonReadMessageSql = 'select u.userId,u.defaultNickname,ut.message,ut.createTime  ' +
			'from UserTouserChatRecord  ut ,User u ' +
			'where  ut.accepterUserId= ' + connection.escape(userInfo.userId) + ' and ut.isRead=0  and u.userId=ut.senderUserId ';
		console.log('userTouserNonReadMessageSql:' + userTouserNonReadMessageSql);
		connection.query(userTouserNonReadMessageSql, function (err, results) {
			for (i = 0; i < results.length; i++) {
				var strObj = {
					'userId': '',
					'username': '',
					'userProfilePhotoUrl': '',
					'msg': ''
				};
				strObj.userId = results[i].userId;
				strObj.username = results[i].defaultNickname;
				strObj.msg = results[i].message;
				console.log('strobj');
				console.log(strObj);
				console.log('strObj end ');
				noticeRoom = roomUserToUser + results[i].userId;
				console.log("noticeRoom" + noticeRoom);
				socket.emit('mqtt', {'topic': String(roomUserToUser + results[i].userId),
					'room': noticeRoom,
					'payload': JSON.stringify(strObj)
				});
			}
		});

		groupNonReadMessageSql = 'select u.userId,u.defaultNickname, gcr.message,gcr.activityId,gcr.clubId,gcr.senderUserId, gcr.createTime ' +
			' from GroupChatUserReadStatus gcs ,GroupChatRecord gcr,User u  ' +
			' where  gcs.accepterUserId= ' + connection.escape(userInfo.userId) +
			' and gcs.isRead=0  and gcr.groupChatRecordId = gcs.groupChatRecordId  and gcr.senderUserId = u.userId';
		connection.query(groupNonReadMessageSql, function (err, results) {
			for (i = 0; i < results.length; i++) {
				var strObj = {
					'userId': '',
					'username': '',
					'userProfilePhotoUrl': '',
					'msg': ''
				};
				strObj.userId = results[i].userId;
				strObj.username = results[i].defaultNickname;
				strObj.msg = results[i].message;
				room = null;
				if (results[i].activityId != null) {
					room = roomActivity + results[i].activityId;
				} else {
					if (results[i].clubId != null) {
						room = roomClub + results[i].clubId;
					}
				}
				socket.emit('mqtt', {'topic': room,
					'room': room,
					'payload': JSON.stringify(strObj)
				});
			}
		});


		updateUserTouser = "update  UserTouserChatRecord  set isRead = 1 where isRead=0 and accepterUserId =" + connection.escape(userInfo.userId);
		updateGroup = "update  GroupChatUserReadStatus set isRead = 1 where isRead=0 and accepterUserId =" + connection.escape(userInfo.userId);
		connection.query(updateUserTouser, function (err, results) {
			if (err) {
				connection.rollback(function () {
					throw err;
				});
			}
		});
		connection.query(updateGroup, function (err, results) {
			if (err) {
				connection.rollback(function () {
					throw err;
				});
			}
		});

//              memcached.get(phpsession, function (err, data) {
//            		console.log('session jin ru ');  
//            		console.log(typeof(data));
//            		console.log(data);
//            	    console.log('session tui chu');
//            	    io.sockets.in(data.topic).emit('mqtt',{'topic': String(data.topic),
//  	                  'room':room,
//  	                  'payload':String(data)});
//  	          	    
//            	});
	});
	socket.on('publish', function (data) {

		room = data.topic;
		io.sockets.in(data.topic).emit('mqtt', {'topic': String(data.topic),
			'room': room,
			'payload': String(data.payload)});
//		  userInfo =  eval('(' + data.payload + ')');
		userInfo = JSON.parse(data.payload);
		msg = stripscript(userInfo.msg);
		timestamp = new Date().getTime();
		groupChatInfo = room.split("-");
		toGroupId = groupChatInfo[1];
		portrait = userInfo.userProfilePhotoUrl;

		groupType = room.split("-");
		console.log("groupType");
		console.log(groupType);
		switch (groupType['0']) {
			case 'club':
				sql = "select userClientId,userId from UserClient where userId in( select userId from  KuulabuUser where kuulabuId = " + connection.escape(groupType['1']) + ")";
				insertGroupChatRecord = "insert into  GroupChatRecord (message,createTime,clubId,senderUserId) values(" +
					"'" + msg + "'," +
					timestamp + "," +
					toGroupId + "," +
					userInfo.userId +
					")";
				groupUsersSql = " select userId from  KuulabuUser where kuulabuId = " + connection.escape(groupType['1']);
				break;
			case 'activity':
				sql = "select userClientId,userId from UserClient where userId in( select inviteeUserId from  ActivityUserInvitation where activityId = " + connection.escape(groupType['1']) + ")";
				insertGroupChatRecord = "insert into  GroupChatRecord (message,createTime,activityId,senderUserId) values(" +
					"'" + msg + "'," +
					timestamp + "," +
					toGroupId + "," +
					userInfo.userId +
					")";
				groupUsersSql = " select inviteeUserId as userId from  ActivityUserInvitation where activityId = " + connection.escape(groupType['1']);
				break;
			case 'group':
				break;
			default:
				sql = '';
		}
		console.log("sql:" + sql);
		mqttContent = '{"isSuccess":true,"message":"' + msg + '","type":"CHAT_ROOM","portrait":"' + portrait + '"}';

		connection.query(insertGroupChatRecord, function (err, results) {
			if (err) {
				connection.rollback(function () {
					throw err;
				});
			}
			insertId = results.insertId;
			connection.query(groupUsersSql, function (err, results) {
				console.log(results);
				for (i = 0; i < results.length; i++) {
//        			if(results[i]['userId'] ==userInfo.userId ){
//		        		 isRead = true;
//		        		 timestamp=new Date().getTime();
//        			}else{
//        				 isRead = false;
//        				 timestamp = 0;
//        			}

					groupUser = roomUserToUser + results[i]['userId'];
					if (socketMap.hasOwnProperty(groupUser)) {
						isRead = true;
						timestamp = new Date().getTime();
					} else {
						isRead = false;
						timestamp = 0;
					}
					insertGroupChatUserReadStatus = "insert into  GroupChatUserReadStatus (isRead,readTime,groupChatRecordId,accepterUserId) values(" +
						isRead + "," +
						timestamp + "," +
						insertId + "," +
						results[i]['userId'] +
						")";
					console.log(insertGroupChatUserReadStatus);
					connection.query(insertGroupChatUserReadStatus, function (err, results) {
						if (err) {
							connection.rollback(function () {
								throw err;
							});
						}
					})
				}
			})

			connection.query(sql, function (err, results) {
				for (i = 0; i < results.length; i++) {
					client.publish('chat/' + results[i]['userClientId'], mqttContent);
				}
			});
		})
//		client.publish('chat/630e80953e11ac25',mqttContent);
	});
	socket.on('userTouser-publish', function (data) {
		console.log('--- publish to ' + data.topic + ' msg:' + data.payload);
//		  userInfo =  eval('(' + data.payload + ')');
		userInfo = JSON.parse(data.payload);
		message = stripscript(userInfo.msg);
		console.log('message');
		console.log(stripscript(message));
		console.log('message end');
		roomA = data.topic;
		console.log("roomA:" + roomA);
		roomB = roomUserToUser + userInfo.userId;
		timestamp = new Date().getTime();
		toUserInfo = roomA.split("-");
		toUserId = toUserInfo[1];
		if (socketMap.hasOwnProperty(roomA)) {

			socketuserA = socketMap[roomA];

			socketuserA.emit('mqtt', {'topic': String(data.topic),
				'room': roomB,
				'payload': String(data.payload)});

			$insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
				"'" + message + "'," + +timestamp + ',' + +timestamp + "," +
				true + "," + +userInfo.userId + "," + +toUserId +
				")";
			connection.query($insertSql, function (err, result) {
				if (err) {
					connection.rollback(function () {
						throw err;
					});
				}
			})

		} else {

			$insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
				"'" + message + "'," + +timestamp + ',' + +timestamp + "," +
				false + "," + +userInfo.userId + "," + +toUserId +
				")";
			console.log('insertSql');
			console.log($insertSql);
			console.log('insertSql  end ----');
			connection.query($insertSql, function (err, result) {
				if (err) {
					connection.rollback(function () {
						throw err;
					});
				}
			})
		}

		socketuserB = socketMap[roomB];
		socketuserB.emit('mqtt', {'topic': String(data.topic),
			'room': roomA,
			'payload': String(data.payload)});


		$insertSql = "insert into UserTouserChatRecord(message,createTime,readTime,isRead,senderUserId,accepterUserId) values(" +
			"'" + message + "'," + +timestamp + ',' + +timestamp + "," +
			true + "," + +userInfo.userId + "," + +userInfo.userId +
			")";
		connection.query($insertSql, function (err, result) {
			if (err) {
				connection.rollback(function () {
					throw err;
				});
			}
		})

		userInfo = eval('(' + data.payload + ')');
		msg = userInfo.msg;
		portrait = userInfo.userProfilePhotoUrl;
		mqttConten_jsonObj = {'isSuccess': true, 'message': '"' + msg + '"', 'type': 'CHAT_ROOM', 'portrait': '"' + portrait + '"'};
		mqttConten_jsonObj.portrait = portrait;
		mqttConten_jsonObj.message = msg;
		mqttContent = JSON.stringify(mqttConten_jsonObj);
		client.publish('chat/630e80953e11ac25', mqttContent);
	});

	socket.on('disconnect', function () {
		obj[socket.topic]--;
		userId = socketArr[socket.id];
		console.log("userId:" + userId);

		memcached.get(userId, function (err, result) {
			console.log("socket.id:" + socket.id);
			console.log(result);
			console.log("data");
			var new_data = new Array();
			result = new String(result);
			data = result.split(",");
			if (data) {
				if (data.in_array(socket.id)) {
					for (i = 0; i < data.length; i++) {
						console.log("i:" + i);
						console.log(data[i]);

						if (data[i] == socket.id) {
							console.log("cun zai xiang deng de !");
						} else {
							console.log('jin lai le ');
							new_data.push(data[i]);
						}
					}

					if (new_data.length == 0) {
						memcached.del(userId, function (err) {
							// stuff
						});
						delete socketMap[roomUserToUser + userId];
					} else {
						userClients = new_data.join(",");
						memcached.set(userId, new_data, 10000, function (err, result) {
							if (err) console.error(err);
							console.dir(result);
						});
					}
				}
				console.log('new_data exist start ');
				for (i = 0; i < new_data.length; i++) {
					console.log("new_data  i=" + new_data[i]);
				}
				console.log('new_data exist end! ');
			} else {
				//if  data  is null or empty object or array
			}
		});

		memcached.get(userId, function (err, data) {
			console.log('shan chu hou de ');
//    		for(i=0;i<data.length;i++){
//				 console.log("new_data  i="+data[i]);
//			 }
			console.log(data);
//    		console.log("data.length:"+data.length);
		});
		delete socketArr[socket.id];

		sql = "select friendUserId from UserFriend where isAuthorized=1 and  userId =  " + connection.escape(userInfo.userId);
		connection.query(sql, function (err, results) {
			for (i = 0; i < results.length; i++) {

				roomMyFriends = roomUserToUser + results[i].friendUserId;
				if (socketMap.hasOwnProperty(roomMyFriends)) {
					socketFriend = socketMap[roomMyFriends];
					socketFriend.emit('offline', {'topic': roomMyFriends,
						'room': roomMyFriends,
						'payload': String(userId)});
				}
			}
		});

	});
});

//client.on('message', function(topic, payload){
//   console.log('teststest');
//   console.log("topic"+topic)
//   console.log(payload);
//   sys.puts(topic+'='+payload);
//   io.sockets.in(topic).emit('mqtt',{'topic': String(topic),
//	   'room':43,
//    'payload':String(payload)});
//});
