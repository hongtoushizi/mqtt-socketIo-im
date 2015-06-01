/**
 * Created by hongshuai.yuan on 15-3-30.
 */
//

var redis = require("redis"),
    PORT = 6379,
    HOST = '127.0.0.1',
    PWD = '111111',
    DB = 0,
    OPTS = {auth_pass: PWD, selected_db:DB};
var redisClient = redis.createClient(PORT, HOST, OPTS);


var poolModule = require('generic-pool');
var onLineUserIds= new Array();
var pool = poolModule.Pool({
	name     : 'redisPool',
	create   : function(callback) {
	    redisClient = redis.createClient(PORT, HOST, OPTS);
		callback(null, redisClient);
	},
	destroy  : function(redisClient) {
		redisClient.quit();
	},
	max      : 100,
	min      : 5,
	idleTimeoutMillis : 30000,
	log      : false
});

redisClient.on("error", function (err) {
	console.log("error event - " + redisClient.host + ":" + redisClient.port + " - " + err);
});

//认证
redisClient.auth(PWD,function(){
    console.log('Redis Auth Successful! > redis_db:'+ DB);
});


exports.setOnlineClient = function(clientId,callback)
{
    var connectUser  = clientId.split("/");
//    console.log("connectUser[connectUser.length]----typeof-----"+typeof (connectUser[connectUser.length-1]));
    var userId = connectUser[connectUser.length-1];
    if(!isNaN(userId)&&userId !=""&&userId != undefined){
        console.log("connectUser[connectUser.length]---------"+connectUser[connectUser.length-1]);
//        redisClient.lrange("onLineUserIds", 0, -1, function(err, reply) {
//            if(reply){
//                redisClient.rpush(["onLineUserIds", connectUser[connectUser.length-1]],function(err, reply)
//                {
//                    onLineUserIds = reply;
//                });//list的设置方法。reply
//            }
//        });
	redisClient.sadd("onLineUserIds",connectUser[connectUser.length-1],function(err,reply)
	{
		console.log("sadd-------onLineUserIds-------reply----"+reply);		
	});
	redisClient.smembers("onLineUserIds",function(err,reply)
	{
		console.log("smembers----onLineUserIds----"+reply);
		onLineUserIds = reply;
	});
    }
}

exports.delOfflineClient = function(clientId,callback)
{
    var connectUser  = clientId.split("/");
    var userId = connectUser[connectUser.length-1];
//    console.log("function----delOfflineClient--start");
    if(!isNaN(userId)&&userId !=""&&userId != undefined) {
//        console.log("connectUser[connectUser.length]---------" + connectUser[connectUser.length - 1]);
//        redisClient.lrem("onLineUserIds", 0,userId,  function(err,reply) {
////            console.log("reply-----" + reply);
//            onLineUserIds = reply;
//        });//list的设置方法。
//        //for test ,is not use
//        redisClient.lrange('onLineUserIds', 0, -1, function (err, reply) {
////            console.log(reply);
//            onLineUserIds = reply;
//        });
	redisClient.srem("onLineUserIds",userId,function(err,reply){
		console.log("srem--------onLineUserIds-----"+reply);
	});
	redisClient.smembers("onLineUserIds",function(err,reply){
		console.log("smembers ----onLineUserIds----"+reply);
		onLineUserIds = reply;
	});
    }
//    console.log("function----delOfflineClient---end");
}

exports.setOffLineMessage = function(userId,payload,callback)
{
//    var connectUser  = clientId.split("/");
//    var userId = connectUser[connectUser.length-1];

//hash只能存储一个键值对，不同实现键对应一个list。
//    redisClient.hmset("offlineMessage"+userId, {
//        'payload': payload
//    });
//    redisClient.hgetall("offlineMessage"+userId,function(err, object)
//    {
//        console.log("offlineMessage--"+userId+"::object"+object);
//
//    });
    var key  = "offlineMessage:"+userId;
    redisClient.lrange(key, 0, -1, function(err, reply) {
        if(reply){
            redisClient.rpush([key, payload],function(err, reply)
            {
//                console.log("reply-----"+reply);
                console.log("setOffLineMessage-------offlineMessage"+userId);
            });//list的设置方法。reply
        }
    });
}

exports.getOfflineMessage = function(userId,client,callback)
{
//    console.log("getOfflineMessage------------start-------offlineMessage:"+userId);
    var key  = "offlineMessage:"+userId;
    redisClient.lrange(key, 0, -1, function(err, reply) {
//        console.log("getOfflineMessage---------"+reply);
//        console.log("getOfflineMessage-----callback--------end");
//        client.publish(96, reply[0]);
        callback(err,reply);

    });
//    console.log("getOfflineMessage-------------end");
}

exports.delOffineMessage = function(userId,payload,client,callback)
{
    var key  = "offlineMessage:"+userId;
    console.log("delOffineMessage----key--:"+key);
    redisClient.lrem(key, -1,payload,  function(err,reply) {
        console.log("lrem-----offlineMessage:4--------" + reply);
    });//list的设置方法。
}

exports.onLineUserIds = onLineUserIds;
