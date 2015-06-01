var express = require('express');
var mosca = require('mosca');
var mysql = require('./models/mysql.js');
var redis = require('./models/redis.js');
var packetInfo = {};
var ascoltatore = {
	type: 'redis',
	redis: require('redis'),
	db: 12,
	port: 6379,
	password:"111111",
	return_buffers: false, // to handle binary payloads
	host: "localhost"
};
var moscaSettings = {
	port: 1883,
	backend: ascoltatore,
	keepalive: 10,
	clean: false,
	persistence: {
		factory: mosca.persistence.Redis,
		host   : 'localhost',
		port   :  6379,
		password:"111111",
	}
};

var server = new mosca.Server(moscaSettings);
function  setPacket  (chatType,topic,payload)
{
    console.log("setPacket--------payload---"+payload);
    if(chatType == 'USER_TO_USER'){
        packetInfo.topic = chatType+"/"+topic;
        packetInfo.payload = payload;
    }else if(chatType == "push"){
        packetInfo.topic = chatType+"/"+topic;
        if(payload){
            var topicMsg ={
                "type":"event",
                "name":payload.name,
                "content":payload.lastMsg,
                "avatar":payload.avatar,
                "id":payload.userId
            };
        }else{

            var topicMsg ={
                "type":"event",
                "name":"yuan",
                "content":"wo lai le ",
                "avatar":"https://getfirebug.com/img/mozilla-logo.jpg",
                "id":96
            };
        }

        packetInfo.payload = JSON.stringify(topicMsg);
        console.log("push----packetInfo.topic----------"+packetInfo.topic);
        console.log("push----packetInfo.payload----------"+packetInfo.payload);
//        packetInfo.payload  = payload;
    }else{
        console.log("暂时只支持点对点单聊。");
    }
    packetInfo.qos = 1;
    packetInfo.retain = 0;
    return packetInfo;
}
server.on('ready', setup);
server.on('clientConnected', function (client) {
    var connectUser = client.id.split("/");
    if(connectUser[0] != "push")
    {
        console.log('client connected--------', client.id);
    }
    redis.setOnlineClient(client.id, function () {
//        console.log("onLineUserIds--------------"+redis.onLineUserIds);
    });
//    //发送push信息。
//    packetInfo = setPacket('push', connectUser[connectUser.length - 2], '');
//    server.publish(packetInfo, null, function () {
//        console.log('push successed....');
//    });
//向用户发送离线消息。
//    var connectUser = client.id.split("/");
    var userId = connectUser[connectUser.length - 1];
    if(redis.onLineUserIds.indexOf(userId) ==-1) {
        redis.getOfflineMessage(userId, client, function (err, replay) {
            for (i = 0; i < replay.length; i++) {
                var payload = replay[i];
                //发送离线消息。
                packetInfo = setPacket('USER_TO_USER', userId, payload);
                server.publish(packetInfo, client, function () {
                    console.log("offline message has received");
                });
                //发送push信息。
                packetInfo = setPacket('push', connectUser[connectUser.length - 2], '');
                server.publish(packetInfo, null, function () {
                   console.log('push successed....');
               });
                //删除离线消息。
                redis.delOffineMessage(userId, payload, client, function (err, reply) {
                    console.log("删除" + i + "条离线消息。");
                });
            }

//"{\"avatar\":\"http://usr.kuulabu.com/3a656f27a05b2d9d41ed34de5eccbcc0af01a5ed.png\",\"lastMsg\":\"fasdf\",\"name\":\"yuanyuan\",\"type\":\"FRIEND\",\"userId\":\"96\"}"
        });
    }
});

// fired when a message is received
server.on('published', function (packet, client)
{
	var sendUser =  new Array();
	var accepter =  new Array();
	if(packet.messageId){

		console.log("我自己发送的消息。");
		console.log('Published----packet.topic----', packet.topic);
		console.log('Published----packet.payloay----', packet.payload);
		console.log('Published----packet.qos----', packet.qos);
		console.log('Published----packet.messageId----', packet.messageId);
		console.log('published---- client', client.id);
		mysql.insertChatMessage(packet, client,function(result){
			console.log("result----------------"+result);
		});
        //目前只考虑了点对点。暂未处理群聊。
        var publishToUser  = packet.topic.split("/");
        var userId = publishToUser[publishToUser.length-1];
        if(redis.onLineUserIds.indexOf(userId) ==-1)
        {
            //插入离线消息.
            redis.setOffLineMessage(userId,packet.payload,function()
            {
                console.log("插入离线消息成功！");
            });
        }
// 死循环了。
//        server.publish(packet, client,function(){
//
//        });
	}else{
        if(packet.topic)
        {
            var topic = packet.topic.split("/");
            if(topic[0]!=="$SYS"){
                console.log('Published----packet.topic----', packet.topic);
                console.log('Published----packet.payloay----', packet.payload);
                console.log('Published----packet.qos----', packet.qos);
            }else{
                //为系统的新的连接和订阅功能产生的publish信息，不是自己主动publish的信息。
            }

        }else{
            //		console.log("系统订阅发送的消息。");
        }

	}
});

server.on('subscribed', function (topic, client) {
//	console.log('subscribed----topic-------',topic);
//	console.log('subscribed---- client', client.id);
});



server.on('unsubscribed', function (topic, client) {
//	console.log('unsubscribed----topic-------',topic);
//	console.log('unsubscribed---- client', client.id);
});

// fired when a client disconnects
server.on('clientDisconnected', function (client) {
//	console.log('Client Disconnected:', client.id);
    redis.delOfflineClient(client.id);
});
// fired when the mqtt server is ready
function setup() {
	console.log('Mosca server is up and running')

//    packetInfo = setPacket('push',"60ff5415ebe621ba",'');
//    console.log("packetInfo----"+packetInfo);
//    server.publish(packetInfo,null,function(){
//        console.log( 'push successed....');
//    });


}
