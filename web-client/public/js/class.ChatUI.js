// JavaScript Document
//===== BEGIN: class FriendsFinderUI =====//
function ChatUI(domSelector, activityId, clubId) {
    this.domSelector = domSelector;
    this.userId = '';
    this.username = '';
    this.activityId = activityId;
    this.clubId = clubId;
    this.userProfilePhotoUrl = '';
    this.activityUsers = {};
    this.userFriends = {};
    this.clubUsers = {};
    this.windowFriendsList = {};
    this.roomActivity = 'activity-';
    this.roomClub = 'club-';
    this.roomUsersGroup = 'group-';
    this.roomUserToUser = 'userTouser-';
    this.beatfunc = null;
    this.chatMessage = new Array();
    this.isConnectServer = false;
//    this.isSupportContentEditable = !$.isSupportContentEditable();
    this.isSupportContentEditable = true;
    this.imFace = null;
    this.localeNoCharset = "zh_CN";
    this.domReady();
};
ChatUI.prototype.domReady = function () {
    thisObj = this;
    console.log("aaaa");
    var localeNoCharset = thisObj.localeNoCharset;
    //获取登录用户的基本信息。
    $.ajax({
//        url: "http://ldev.www.kuulabu.com/app_dev.php/services/User-getUserInfo.json",
        url: "User-getUserInfo.json",
        async: false,//同步获取
//        dataType: 'jsonp',
        dataType: 'json',
        success: function (userInfo) {
            thisObj.userId = userInfo.userId;
            thisObj.username = userInfo.username;
            thisObj.userProfilePhotoUrl = userInfo.userProfilePhotoUrl;
        }
    });

    var theApp = new App();
    if(theApp.get('imFaceJsonFile'))
    {
        thisObj.imFace = theApp.get('imFaceJsonFile');
    }else{
        $.ajax({
            url: './public/IM.json',
            type: 'GET',
            async: false,
            dataType: 'json',
            success: function (data) {
                thisObj.imFace = data;
                theApp.set('imFaceJsonFile',data);
            }
        });
    }


    var roomActivity = 'activity-';
    var roomClub = 'club-';
    var roomUsersGroup = 'group-';
    var roomUserToUser = 'userTouser-';

    var roomActivity = thisObj.roomActivity;
    var roomClub = thisObj.roomClub;
    var roomUsersGroup = thisObj.roomUsersGroup;
    var roomUserToUser = thisObj.roomUserToUser;


//	 var useruserId =    {{ app.session.get('userId') }}
//      console.log('useruserId:'+useruserId);
    var toActivity, toUserId, toClubId;
    var userInfo = '';
    var insertHtml = '';
    var informUserLoginInHtml = ''; //提示那个用户登录的显示框
    thisObj.createChatBatButton();
    thisObj.createFriendsWindow();
    thisObj.createChatFrame();


    if (thisObj.activityId == '' && thisObj.clubId == '') {
        room = '';
    } else {
        if (thisObj.activityId != '') {
            room = thisObj.activityId;  //加入的房间。及活动的id.  (必须为字符串，否则报错。)
            room = roomActivity + room.toString();
            groupname = $('[name=chatAllFriends] a[name=activitySecondLevel]').find('span[target_activityId=' + thisObj.activityId + ']').text();
            thisObj.createGroupChat(thisObj.activityId, groupname, 'activity');  //讨论是否需要在进入活动页面的时候默认打开聊天窗口。
            $('[name=bottombar]  [name=chatBlock]').each(function () {
                if ($(this).find('[name=room]').val() == room) {
                    $(this).find('[name=chatRoom]').hide();
                }
            });
        } else {
            room = thisObj.clubId;  //加入的房间。及活动的id.  (必须为字符串，否则报错。)
            room = roomClub + room.toString();
            groupname = $('[name=chatAllFriends] a[name=clubSecondLevel]').find('span[target_clubId=' + thisObj.clubId + ']').text();
            thisObj.createGroupChat(thisObj.clubId, groupname, 'club');  //讨论是否需要在进入活动页面的时候默认打开聊天窗口。
            $('[name=bottombar]  [name=chatBlock]').each(function () {
                if ($(this).find('[name=room]').val() == room) {
                    $(this).find('[name=chatRoom]').hide();
                }
            });
        }
    }
    host = window.location.host;
//	  var socket = io.connect('http://180.153.223.89:5000');
    if (host == 'ldev.www.kuulabu.com/app_dev.php') {
        var socket = io.connect('http://180.153.223.89:5000');
        var socket = io.connect('http://kate.b4fter.com:5000');


//		  console.log('线上')
    } else {
        var socket = io.connect('http://127.0.0.1:5000');
//		  console.log("线下");
    }

//	  var socket = io.connect('http://127.0.0.1:5000');
    var str_cookie = document.cookie;
    var arr_cookie = str_cookie.split("; ");
    var php_session;
    var chatMessage = thisObj.chatMessage;
    //遍历 arr_cookie 数组
    for (var i = 0; i < arr_cookie.length; i++) {
        var arr = arr_cookie[i].split("=");
        //找到名称为userId的cookie
        if ("PHPSESSID" == arr[0]) {
            php_session = arr[1];
            break;
        }
    }
//	  var  socket = thisObj.socket;
//      var str ={'userId':'"+thisObj.userId+"','username':'"+thisObj.username+"','userProfilePhotoUrl':'"+thisObj.userProfilePhotoUrl+"','phpsession':'"+php_session+"'};

    var strObj = {'userId': '"' + thisObj.userId + '"', 'username': '"' + thisObj.username + '"', 'userProfilePhotoUrl': '"' + thisObj.userProfilePhotoUrl + '"', 'phpsession': '"' + php_session + '"'};
    strObj.userId = thisObj.userId;
    strObj.username = thisObj.username;
    strObj.userProfilePhotoUrl = thisObj.userProfilePhotoUrl;
    strObj.phpsession = php_session;
    str = JSON.stringify(strObj);
//	  console.log(str);
    //socket start
    socket.on('connect', function () {
        thisObj.isConnectServer = true;
        socket.emit('subscribe', {topic: room, payload: str});
    });

    socket.on('mqtt', function (data) {
        userInfo = eval('(' + data.payload + ')');
        //判断是否打开了信息的聊天窗口。
        $isHasOpenTheRoom = false; //打开过，跟是否隐藏没有关系,此处处理提醒模块的闪动的数字的变化。
        $isOpenedTheRoom = false; //判断用户是否打开过此room的聊天窗口。此处处理用户未打开的聊天室的提醒信息的显示。
        $('[name=chatBlock] [name=room]').each(function () {
            if ($(this).val() == data.room) {
                if (!$(this).closest('[name=chatBlock]').is(":hidden")) {
                    $isHasOpenTheRoom = true;
                }
                $isOpenedTheRoom = true;
                insertNode = $(this).closest('[name=chatBlock]').find('[name=chat_detail] [name=chatHistoryPane]');
                thisObj.insertMessage(insertNode, data.room, userInfo, false);
            }
        });

        /**
         * 如果没有打开过，就将此room的信息存储下载，以便后期打开room显示数据。
         */
        //没有打开过的信息，已对象形式存储在客户端。
        if (!$isOpenedTheRoom) {
            room = data.room;
            if (chatMessage.hasOwnProperty(room)) {
                chatMessage[room].push(userInfo);
            } else {
                chatMessage[room] = new Array();
                chatMessage[room].push(userInfo);
            }
        }

//	   	  console.log('chatMessage start:');
//	   	  console.log(chatMessage);
//	   	  console.log('chatMessage end ;');
        if (!$isHasOpenTheRoom) {
//	    		 console.log('提醒：room:'+data.room);
            room = data.room;

            //插入提醒信息。
            thisObj.insertNoticeInfo(room);
        }
    });

    //上线提
    socket.on('online', function (data) {
        //将刚上线的人显示为已经在线。
        var userId = data.payload;
        thisObj.noticeUserHasOnline(userId);
    });
    //离线提醒
    socket.on('offline', function (data) {
        //将刚离线的用户显示为离线。
        var userId = data.payload;
        thisObj.noticeUserHasOffline(userId);
    });

    socket.on('connect_failed', function () {
        thisObj.isConnectServer = false;
//    	  console.log('connecting !!!');
    });

    socket.on('reconnect_failed', function () {
        thisObj.isConnectServer = false;
//    	  console.log('reconnect_failed !!!');
    });

    // reconnecting  ->  connection  -> reconnect
    socket.on('reconnecting', function () {
        thisObj.isConnectServer = false;
//    	  console.log('reconnecting !!!');
    });

    socket.on('connecting', function () {
        thisObj.isConnectServer = false;
//    	  console.log('connecting !!!');
    });

    socket.on('reconnect', function () {
//    	  console.log('reconnect !!!');
        thisObj.isConnectServer = true;
        socket.emit('subscribe', {topic: room, payload: str});  //  subscribe again
    });

    socket.on('disconnect', function () {
        thisObj.isConnectServer = false;
//    	  console.log('disconnect !!!');
    });

    socket.on('error', function () {
        thisObj.isConnectServer = false;
//    	  console.log('socket has donetimed !!!');
    });

    //socket end


    $('[name=chat_send]').live('click', function () {
        if (thisObj.isSupportContentEditable) {
            $chat_content = $.trim($(this).closest('[name=chat_detail]').find('[name=chat_toWriteContent]').html());
        } else {
            $chat_content = $.trim($(this).closest('[name=chat_detail]').find('[name=chat_toWriteContent]').val());
        }

        room = $(this).closest('[name=chatBlock]').find('input[name=room]').val();

        if (!thisObj.isConnectServer) {
            alert('与服务器断开链接，请稍等！');
            return true;
        }

        if ($chat_content != '') {
            if (thisObj.isSupportContentEditable) {
                $(this).closest('[name=chat_detail]').find('[name=chat_toWriteContent]').html('');


            } else {
                $(this).closest('[name=chat_detail]').find('[name=chat_toWriteContent]').val('');
            }

            $type = $(this).attr('type');
            if ($type == "userTouser") {
                var send_content = {'userId': '"' + thisObj.userId + '"', 'username': '"' + thisObj.username + '"', 'userProfilePhotoUrl': '"' + thisObj.userProfilePhotoUrl + '"', 'msg': '"' + $chat_content + '"'};
                send_content.userId = thisObj.userId;
                send_content.username = thisObj.username;
                send_content.userProfilePhotoUrl = thisObj.userProfilePhotoUrl;
                send_content.msg = $chat_content;
                send_content_str = JSON.stringify(send_content);
//	     		   console.log(send_content_str);
                socket.emit('userTouser-publish', {topic: room, payload: send_content_str});
            } else {
//		           str ="{userId:'"+thisObj.userId+"','username':'"+thisObj.username+"','userProfilePhotoUrl':'"+thisObj.userProfilePhotoUrl+"','msg':'"+$chat_content+"'}";
                var send_content = {'userId': '"' + thisObj.userId + '"', 'username': '"' + thisObj.username + '"', 'userProfilePhotoUrl': '"' + thisObj.userProfilePhotoUrl + '"', 'msg': '"' + $chat_content + '"'};
                send_content.userId = thisObj.userId;
                send_content.username = thisObj.username;
                send_content.userProfilePhotoUrl = thisObj.userProfilePhotoUrl;
                send_content.msg = $chat_content;
                send_content_str = JSON.stringify(send_content);
//	     		   console.log(send_content_str); 
                socket.emit('publish', {topic: room, payload: send_content_str});
            }

            //用户发送完消息后，实现在自己的窗口显示自己发送的消息。
            $('[name=chatBlock] [name=room]').each(function () {
                if ($(this).val() == room) {
                    insertNode = $(this).closest('[name=chatBlock]').find('[name=chat_detail] [name=chatHistoryPane]');
                    thisObj.insertMessage(insertNode, room, send_content, true);
                }
            });
        }
    });


    //enter响应时间。
    $('[name=chat_toWriteContent]').live('keydown', function (e) {
        var key = e.which;
        if (key == 13) {
            e.preventDefault();
            $(this).closest('[name=chat_detail]').find('[name=chat_send]').click();
        }
    });
    /**
     * 好友列表的整个隐藏。
     */
    $('[name=chatAllClose]').click(function () {
        $('[name=chatAllFriends]').hide();
    });

    /**
     * 全部好友列表的显示与关闭
     */
    $('[name=chatBarbutton]').click(function () {
        $('[name=chatAllFriends]').toggle('fast');

    });
    /**
     * 关闭聊天窗口，并且将此room从页面上remove掉。
     */
    $('[name=chat_del]').live('click', function () {
//		  $(this).closest('[name=chatBlock]').hide();
        $(this).closest('[name=chatBlock]').remove();
    });
    /**
     * 聊天窗口的隐藏。
     */
    $('[name=chat_narrow]').live('click', function () {
        $(this).closest('[name=chatBlock]').find('[name=chatRoom]').hide();
    });


    //好友列表的伸缩
    $('[name=chatAllFriends] [name=firstLevel],[name=barSelect]').toggle(
        function () {
            $(this).closest('li').find('ul').toggle('slow');
            $(this).closest('li').find('[name=barSelect]').removeClass('open').addClass('close');
        },
        function () {
            $(this).closest('li').find('ul').toggle('slow');
            $(this).closest('li').find('[name=barSelect]').removeClass('close').addClass('open');
        }
    );

    $('[name=chatAllFriends] a[name=userSecondLevel]').live('click', function () {
        toUserId = $(this).find('span[name=friendName]').attr('target_userId');
        room = roomUserToUser + toUserId;
        username = $(this).find('span[name=friendName]').text();
//    	  socket.emit('subscribe',{topic: room,payload:str});
        //删除已经打开的节点
        if ($(this).closest('li').find('[name=noticeNum]').length > 0) {
            $(this).closest('li').remove();
            thisObj.noticeTotal();
        }
        $isHasOpenTheRoom = false;
        $('[name=chatBlock] [name=room]').each(function () {
            if ($(this).val() == room) {
                $isHasOpenTheRoom = true;
                $('[name=chatRoom]').each(function () {
                    $(this).hide();
                });
                $(this).closest('[name=chatBlock]').find('[name=chatRoom]').show();
            }
        });

        if (!$isHasOpenTheRoom) {
            thisObj.createSingleChat(toUserId, username);
            $('[name=chatBlock] [name=room]').each(function () {
                if ($(this).val() == room) {
                    insertNode = $(this).closest('[name=chatBlock]').find('[name=chat_detail] [name=chatHistoryPane]');
                }
            });
            if (chatMessage.hasOwnProperty(room)) {
                for (i = 0; i < chatMessage[room].length; i++) {
                    thisObj.insertMessage(insertNode, room, chatMessage[room][i], true);
                }
            }
        }
        thisObj.showActivityBar(room);
    });

    $('[name=chatAllFriends] a[name=clubSecondLevel]').live('click', function () {
        toClubId = $(this).find('span').attr('target_clubId');
        room = roomClub + toClubId;
        groupname = $(this).find('span').text();
        //删除已经打开的节点
        if ($(this).closest('li').find('[name=noticeNum]').length > 0) {
            $(this).closest('li').remove();
            thisObj.noticeTotal();
        }
        $(this).closest('li').find('[name=noticeNum]').text('');
//    	  socket.emit('subscribe',{topic: room,payload:str});
        $isHasOpenTheRoom = false;
        $('[name=chatBlock] [name=room]').each(function () {
            if ($(this).val() == room) {
                $isHasOpenTheRoom = true;
                $('[name=chatRoom]').each(function () {
                    $(this).hide();
                });
                $(this).closest('[name=chatBlock]').find('[name=chatRoom]').show();
            }
        });

        if (!$isHasOpenTheRoom) {
            thisObj.createGroupChat(toClubId, groupname, 'club');
            $('[name=chatBlock] [name=room]').each(function () {
                if ($(this).val() == room) {
                    insertNode = $(this).closest('[name=chatBlock]').find('[name=chat_detail] [name=chatHistoryPane]');
                }
            });
            if (chatMessage.hasOwnProperty(room)) {
                for (i = 0; i < chatMessage[room].length; i++) {
                    thisObj.insertMessage(insertNode, room, chatMessage[room][i], true);
                }
            }
        }
        thisObj.showActivityBar(room);
    });

    $('[name=chatAllFriends] a[name=activitySecondLevel]').live('click', function () {
        toActivity = $(this).find('span').attr('target_activityId');
        room = roomActivity + toActivity;
        groupname = $(this).find('span').text();
        //删除已经打开的节点
        if ($(this).closest('li').find('[name=noticeNum]').length > 0) {
            $(this).closest('li').remove();
            thisObj.noticeTotal();
        }
//    	  socket.emit('subscribe',{topic: room,payload:str});
//    	  thisObj.createGroupChat(toActivity,'activity');
        $isHasOpenTheRoom = false;
        $('[name=chatBlock] [name=room]').each(function () {
            if ($(this).val() == room) {
                $isHasOpenTheRoom = true;
                $('[name=chatRoom]').each(function () {
                    $(this).hide();
                });
                $(this).closest('[name=chatBlock]').find('[name=chatRoom]').show();
            }
        });
        if (!$isHasOpenTheRoom) {
//    		  thisObj.createGroupChat(toClubId,'club');	
            thisObj.createGroupChat(toActivity, groupname, 'activity');
            $('[name=chatBlock] [name=room]').each(function () {
                if ($(this).val() == room) {
                    insertNode = $(this).closest('[name=chatBlock]').find('[name=chat_detail] [name=chatHistoryPane]');
                }
            });
            if (chatMessage.hasOwnProperty(room)) {
                for (i = 0; i < chatMessage[room].length; i++) {
                    thisObj.insertMessage(insertNode, room, chatMessage[room][i], true);
                }
            }
        }
        thisObj.showActivityBar(room);
    });

    $('[name=chatBlock] [name=chat_tool_bar] [name=chat_faceButton]').live('click', function () {
        $(this).closest('[name=chat_tool_bar]').find('[name=facePanel]').toggle();
    });

    //点击不是表情的地方，自动将表情的div关闭。
    $(document).bind("click", function (e) {
        var target = $(e.target);
        if ($(target).closest('[name=chat_tool_bar]').length == 0) {
            $('[name=chatBlock]  [name=facePanel]').hide();
        }
    });
    //在textarea中插入图片后自动将光标移动到文件的最后面。
    var moveEnd = function (obj) {
        if (typeof obj == 'string') obj = document.getElementById(obj);
        obj.focus();
        if (obj.createTextRange) {//ie
            var rtextRange = obj.createTextRange();
            rtextRange.moveStart('character', obj.value.length);
            rtextRange.collapse(true);
            rtextRange.select();
        }
        else if (obj.selectionStart) {//chrome "<input>"ã€"<textarea>"
            obj.selectionStart = obj.value.length;
        } else if (window.getSelection) {

            var sel = window.getSelection();

            var tempRange = document.createRange();
            tempRange.setStart(obj.firstChild, obj.firstChild.length);
            sel.removeAllRanges();
            sel.addRange(tempRange);
            //obj.focus();
        }
    }

    $('[name=chatBlock] [name=chat_tool_bar]  a[name=faceIcon]').live('click', function () {
        elem = document.getElementById('chat_toWriteContent');//This is the element that you want to move the caret to the end of

        var cursorObj = $(this).closest('[name=chatBlock]').find('[name=chat_toWriteContent]');

        var cc = new CursorControl(cursorObj[0]);

        cc.insertText($(this).html());

//            var facecode = $(this).attr('facecode');
//            var content = thisObj.imFace[facecode];
//           cc.insertText(content[localeNoCharset]);

        $(elem).focus();
        $(elem).mouseup();
        $('[name=chatBlock]  [name=facePanel]').hide();
//            moveEnd("chat_toWriteContent");   // 在有表情图的情况下有问题。  ？？？？
        elem = document.getElementById('chat_toWriteContent');//This is the element that you want to move the caret to the end of
        $.setEndOfContenteditable(elem);
    });


    //好友列别和新的消息的tab切换效果。
    $('[name=chatAllFriends]  li[name=friends_li]').live('click', function () {
        $('[name=chatAllFriends]  [name=new_notice_list]').hide();
        $('[name=chatAllFriends]  [name=friendUiList]').show();
        $('[name=chatAllFriends]  [name=friends_li]').css({ 'border-left': "1px solid #F6F6F6", 'border-bottom': "1px solid #F6F6F6" });
        $('[name=chatAllFriends]  [name=notice_li]').css({'border-left': "1px solid #DDDDDD", 'border-bottom': "1px solid #DDDDDD"});
    });
    $('[name=chatAllFriends]  li[name=notice_li]').live('click', function () {
        $('[name=chatAllFriends]  [name=new_notice_list]').show();
        $('[name=chatAllFriends]  [name=friendUiList]').hide();
        $('[name=chatAllFriends]  [name=notice_li]').css({ 'border-left': "1px solid #F6F6F6", 'border-bottom': "1px solid #F6F6F6" });
        $('[name=chatAllFriends]  [name=friends_li]').css({'border-right': "1px solid #DDDDDD", 'border-bottom': '1px solid #DDDDDD'});
    });

    //点击用户的bar，显示对应的聊天窗口。
    $('[name=panelbarbutton]').live('click', function () {
        $('[name=chatRoom]').each(function () {
            $(this).hide();
        });
        room = $(this).closest('[name=chatBlock]').find('[name=room]').val();
        thisObj.showActivityBar(room);
    });

    $('[name=panelbarbutton]').live('hover', function () {
        $('[name=panelbarbutton]  [name=chat_del]').each(function () {
            $(this).hide();
        });
        $(this).find('[name=chat_del]').show();
    });


    /**
     * 鼠标滚动事件的临时解决方案。
     */
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
    $("[name=chatHistoryPane]").live(mousewheelevt, function (e) {
        // do my position stuff
        //加载历史信息。
        if ($(this).scrollTop() == 0) {
            room = $(this).closest('[name=chatBlock]').find('[name=room]').val();
            groupType = room.split("-"); //字符分割

        }


    });
};

ChatUI.prototype.createChatBatButton = function () {
//    var chatBarbutton = '\
//    	<div  class="chatBarbutton" name="chatBarbutton" style=" ">\
//    	   <p class="" style="" >'+_('Instant Message')+'<span class="noticeTotalNum" name="noticeTotalNum"></span></p>\
//    	</div>\
//       	  ';

    var chatBarbutton = '\
    	<div class="chatBarbutton" name="chatBarbutton">\
    		<div style="position:relative;float:left;left:50%;">\
		       <div style="position:relative;float:left;left:-50%;">\
	             <div class="chat_code" name="chat_code">\
		            聊天室  <span class="noticeTotalNum" name="noticeTotalNum"></span>\
	             </div>\
		      </div>\
	       </div>\
      </div>\
    				';
    $('body').append(chatBarbutton);
};

ChatUI.prototype.createChatFrame = function () {
    var chatBarbutton = '\
    	<div  class="chatFrame" name="chatFrame" style="z-index:100;">\
    	</div>\
       	  ';
    $('body').append(chatBarbutton);
};

ChatUI.prototype.createFriendsWindow = function () {
    thisObj = this;
    windowFriendsList = new Array();
    myFriendsList = new Array();
    activityList = new Array();
    clubsList = new Array();
    windowFriendsList = thisObj.getWindowFriendsList();
    myFriendsList = windowFriendsList.friendsList;
    activityList = windowFriendsList.activityList;
    clubsList = windowFriendsList.clubsList;
    //我的好友列表
    myFriendLabelHtml = '<ul>';
    if (myFriendsList) {
        for (i = 0; i < myFriendsList.length; i++) {
            if (myFriendsList[i].isOnline) {
                style = 'online';
                $onlineHtml = "<span style='status' name='status'>(在线)</span>";
            } else {
                style = 'offline';
                $onlineHtml = "";
            }

            myFriendLabelHtml += '\
		      <li>\
		        <span class="secondLevelSpan"  ></span>\
		        <a class="secondLevel  ' + style + ' " name="userSecondLevel" >\
		            <span  name="friendName" target_userId=' + myFriendsList[i].userId + '>' + myFriendsList[i].username + '</span>\
		            ' + $onlineHtml + '\
		        </a>\
		      </li>\
	      ';
        }
        myFriendLabelHtml += '</ul>';
    } else {
        myFriendLabelHtml = '';
    }
    //我参加的活动列表
    if (clubsList) {
        clubsListHtml = '<ul>';
        for (j = 0; j < clubsList.length; j++) {
            clubsListHtml += '\
		      <li>\
		        <span class="secondLevelSpan"  ></span>\
		        <a class="secondLevel" name="clubSecondLevel" >\
		            <span  target_clubId=' + clubsList[j].kuulabuId + '>' + clubsList[j].name + '</span>\
		        </a>\
		      </li>\
	      ';
        }
        clubsListHtml += '</ul>';
    } else {
        clubsListHtml = '';
    }


    //我参加的俱乐部列表
    if (activityList) {
        activityListHtml = '<ul>';
        for (k = 0; k < activityList.length; k++) {

            if (activityList[k].subject) {
                activityListHtml += '\
		      <li>\
		        <span class="secondLevelSpan"  ></span>\
		        <a class="secondLevel" name="activitySecondLevel" >\
		            <span  target_activityId=' + activityList[k].activityId + '>' + activityList[k].subject + '</span>\
		        </a>\
		      </li>\
	      ';
            }
        }
        activityListHtml += '</ul>';
    } else {
        activityListHtml = '';
    }


    windowFriendsListHtml = '\
	  <div class="chatAllFriends" name="chatAllFriends" >\
	      <div class="chatAllTop" >\
	          <input   value="搜索好友" name="friendName" /> <span class="addDiscuss" > <em class="jia" >+</em>讨论组 </span>\
	          <div class="chatAllClose" name="chatAllClose"></div>\
	      </div>\
	      <ul class="chat_tab">\
	         <li class="friends_li" name="friends_li">好友列表</li>\
	         <li class="notice_li"  name="notice_li">新的消息</li>\
	      </ul>\
	      <div class="friendUiList" name="friendUiList" style="height:80%;">\
	           <ul class="friendList">\
	              <li name="myFriendsList">\
	                <span class="open" name="barSelect" ></span>\
	                <a class="firstLevel" name="firstLevel" >\
	                    <span >我的好友</span>\
	                </a>\
	                ' + myFriendLabelHtml + '\
	              </li>\
	              <li>\
	                <span class="close" name="barSelect" ></span>\
	                <a class="firstLevel" name="firstLevel" >\
	                    <span >我的俱乐部</span>\
	                </a>\
	                 ' + clubsListHtml + '\
	              </li>\
	              <li>\
	                <span class="close" name="barSelect"  ></span>\
	                <a class="firstLevel" name="firstLevel" >\
	                    <span >我将要参加的活动</span>\
	                </a>\
	                 ' + activityListHtml + '\
	              </li>\
	           </ul>\
	      </div>\
	      <div class="new_notice_list" name="new_notice_list">\
	               <ul class="userTouserNotice"  name="userTouserNotice"><span class="noticeTab" >我的好友</span></ul>\
	               <ul class="clubNotice"  name="clubNotice"><span class="noticeTab" >我的俱乐部</span></ul>\
	               <ul class="activityNotice"  name="activityNotice"><span class="noticeTab" >我的活动</span></ul>\
	      </div>\
       </div>\
	   <div class="bottombar" name="bottombar"></div>\
	  ';
    $('body').append(windowFriendsListHtml);
};

ChatUI.prototype.createSingleChat = function (toUserId, username) {
    var roomUserToUser = thisObj.roomUserToUser;
    room = roomUserToUser + toUserId;
    var html = '\
		<div  class="chatSingleBlock" name="chatBlock" >\
			<div class="panelbarbutton"  name="panelbarbutton">\
		        <div class="chatbar_del"  name="chat_del" ><img src="/webIM/public/img/message-delete.gif"></div>\
		        <span  title=' + username + '>' + username + '</span>\
		    </div>\
			<div class="chatRoom"  name="chatRoom"  >\
				<div  class="chat_top"  >\
					<div class="chat_title"  >' + username + '</div>\
					<div class="chat_del"  name="chat_del" ><img src="/webIM/public/img/del.png"></div>\
					<div class="chat_narrow"  name="chat_narrow" ><img src="/webIM/public/img/im-narrow.png"></div>\
				</div> \
		        <div class="chat_content"  >\
		            <div class="chat_online_content">\
						<div class="chat_detail"  name="chat_detail" >\
							<div name="chatHistoryPane" \
								style="height:400px;border:1px solid #cccccc;\
								background-color:#ffffff;padding-right:15px;overflow-y:scroll;">\
							</div>\
							<div  class="chat_send" >\
		                        <div class="chat_tool_bar" name="chat_tool_bar">\
		                           <div class="facePanel" name="facePanel">\
                                        <a class="faceIcon" name="faceIcon" facecode="[face0]" title="[face0]" href="javascript:void(0);"><img class="faceImg" facecode="[face0]" src="/webIM/public/img/im_img/chijing.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face1]" title="[face1]" href="javascript:void(0);"><img class="faceImg" facecode="[face1]" src="/webIM/public/img/im_img/dai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face2]" title="[face2]" href="javascript:void(0);"><img class="faceImg" facecode="[face2]" src="/webIM/public/img/im_img/han.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face3]" title="[face3]" href="javascript:void(0);"><img class="faceImg" facecode="[face3]" src="/webIM/public/img/im_img/jiong.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face4]" title="[face4]" href="javascript:void(0);"><img class="faceImg" facecode="[face4]" src="/webIM/public/img/im_img/kuangxiao.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face5]" title="[face5]" href="javascript:void(0);"><img class="faceImg" facecode="[face5]" src="/webIM/public/img/im_img/leibeng.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face6]" title="[face6]" href="javascript:void(0);"><img class="faceImg" facecode="[face6]" src="/webIM/public/img/im_img/lihai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face7]" title="[face7]" href="javascript:void(0);"><img class="faceImg" facecode="[face7]" src="/webIM/public/img/im_img/shuai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face8]" title="[face8]" href="javascript:void(0);"><img class="faceImg" facecode="[face8]" src="/webIM/public/img/im_img/tiaopi.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face9]" title="[face9]" href="javascript:void(0);"><img class="faceImg" facecode="[face9]" src="/webIM/public/img/im_img/yun.gif" /></a>\
								   </div>\
		                           <div class="chat_faceButton" name="chat_faceButton" title="表情"><img src="/webIM/public/img/im_biaoqing/smile.png"/></div>\
		                        </div>\
								<div name="chat_send" class="chat_send_button" type="userTouser"></div>\
								<div name= "changeDivToTextareaDiv">\
								    <div class="chat_toWriteContent" name="chat_toWriteContent" contenteditable="true" id ="chat_toWriteContent" placeholder="请输入。。。">\
								</div>\
							    </div>\
						   </div>\
				     	</div>\
			     	</div>\
		        </div>\
			</div>\
		  <input type="hidden" name="room" value=' + room + ' />\
        </div>\
		';
    thisObj.createChatRoom(html);
    thisObj.ChatChangeDivToTextarea();
    thisObj.blindAtWhoplugin();
};


ChatUI.prototype.createGroupChat = function (toId, groupname, type) {
    var userList = {};
    //创建好友列表。
    var userList = thisObj.createUserList(toId, type);
    var roomActivity = thisObj.roomActivity;
    var roomClub = thisObj.roomClub;
    var roomUsersGroup = thisObj.roomUsersGroup;

//	room =roomUserToUser+toUserId;
//	room = roomClub+toClubId;
//	room = roomActivity+toActivity;
    var room = '';
    switch (type) {
        case 'club':
            room = roomClub + toId;
            break;
        case 'activity':
            room = roomActivity + toId;
            break;
        default:
            room = '';
    }

    var html = '\
		<div  class="chatGroupBlock" name="chatBlock" >\
			<div class="panelbarbutton" name="panelbarbutton">\
				<div class="chatbar_del"  name="chat_del" ><img src="/webIM/public/img/message-delete.gif"></div>\
		        <span  title=' + groupname + '>' + groupname + '</span>\
		    </div>\
			<div class="chatRoom"  name="chatRoom"  >\
				<div  class="chat_top"  >\
					<div class="chat_title"  >' + groupname + ' </div>\
					<div class="chat_del"  name="chat_del" ><img src="/webIM/public/img/del.png"></div>\
					<div class="chat_narrow"  name="chat_narrow" ><img src="/webIM/public/img/im-narrow.png"></div>\
				</div> \
		        <div class="chat_content"  >\
					<div class="chat_people" >\
		              <div style="display:block;height:15px;width:100%;"></div>\
				      ' + userList + '\
				    </div>\
		            <div class="chat_online_content">\
						<div class="chat_detail"  name="chat_detail" >\
							<div name="chatHistoryPane" \
								style="height:400px;border:1px solid #cccccc;\
								background-color:#ffffff;padding-right:15px;overflow-y:scroll;">\
							</div>\
							<div  class="chat_send" >\
								<div class="chat_tool_bar" name="chat_tool_bar">\
								   <div class="facePanel" name="facePanel">\
                                        <a class="faceIcon" name="faceIcon" facecode="[face0]" title="[face0]" href="javascript:void(0);"><img class="faceImg" facecode="[face0]"  src="/img/im_img/chijing.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face1]" title="[face1]" href="javascript:void(0);"><img class="faceImg" facecode="[face1]" src="/img/im_img/dai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face2]" title="[face2]" href="javascript:void(0);"><img class="faceImg" facecode="[face2]" src="/img/im_img/han.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face3]" title="[face3]" href="javascript:void(0);"><img class="faceImg" facecode="[face3]" src="/img/im_img/jiong.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face4]" title="[face4]" href="javascript:void(0);"><img class="faceImg" facecode="[face4]" src="/img/im_img/kuangxiao.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face5]" title="[face5]" href="javascript:void(0);"><img class="faceImg" facecode="[face5]" src="/img/im_img/leibeng.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face6]" title="[face6]" href="javascript:void(0);"><img class="faceImg" facecode="[face6]" src="/img/im_img/lihai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face7]" title="[face7]" href="javascript:void(0);"><img class="faceImg" facecode="[face7]" src="/img/im_img/shuai.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face8]" title="[face8]" href="javascript:void(0);"><img class="faceImg" facecode="[face8]" src="/img/im_img/tiaopi.gif"  /></a>\
                                        <a class="faceIcon" name="faceIcon" facecode="[face9]" title="[face9]" href="javascript:void(0);"><img class="faceImg" facecode="[face9]" src="/img/im_img/yun.gif" /></a>\
								   </div>\
		                           <div class="chat_faceButton" name="chat_faceButton" title="表情"><img src="/img/im_biaoqing/smile.png"/></div>\
		                        </div>\
								<div name="chat_send" class="chat_send_button" type="group"></div>\
								<div name= "changeDivToTextareaDiv">\
		                            <div  class="chat_toWriteContent" name="chat_toWriteContent"  contenteditable="true" placeholder="请输入。。。">\
							    </div>\
							    </div>\
						   </div>\
				     	</div>\
			     	</div>\
		        </div>\
			</div>\
		  <input type="hidden" name="room" value=' + room + ' />\
        </div>\
		';
    thisObj.createChatRoom(html);
    thisObj.ChatChangeDivToTextarea();
    thisObj.blindAtWhoplugin();
};

ChatUI.prototype.createUserList = function (toId, type) {
    var userList = {};
    if (toId != '') {
        if (type == 'activity') {
            thisObj.getActivityUsers(toId);   //活动的参与人列表的加载。
            userList = thisObj.activityUsers;
        } else {
            thisObj.getClubUsers(toId);   //活动的参与人列表的加载。
            userList = thisObj.clubUsers;
        }
    } else {
        return false;
    }
    userHtml = '\
			   <div  class="chat_online_num"   >\
				   <span name="chat_now_online_num">0</span>/' + userList.length + ' in chat room\
			  </div>\
		      <ul>';
    for (i = 0; i < userList.length; i++) {
        username = userList[i].username ? userList[i].username : userList[i].defaultNickname;
        if (userList[i].isOnline) {
            $style = "online";
        } else {
            $style = "offline";
        }
        userHtml += '\
		        <li class="' + $style + '"  target_userId="' + userList[i].userId + '" >' + username + '</li>\
    		  ';
    }
    userHtml += '</ul>';
    return userHtml;
};


ChatUI.prototype.getWindowFriendsList = function () {
    thisObj = this;
    $.ajax({
//        url: "http://ldev.www.kuulabu.com/app_dev.php/zh_CN/services/chatIo-getUserListAndclubsAndActivitys.json",
        url: "chatIo-getUserListAndclubsAndActivitys.json",
        type: 'GET',
        async: false,
        dataType: 'json',
        success: function (msg) {
            thisObj.windowFriendsList = msg;
        }
    });
    return thisObj.windowFriendsList;
};

ChatUI.prototype.getActivityUsers = function (toActivityId) {
    thisObj = this;
    if (toActivityId != '') {
        $.ajax({
//            url: "http://ldev.www.kuulabu.com/app_dev.php/zh_CN/services/chatIo-getActivityUsersList.json",
            url: "chatIo-getActivityUsersList.json",
            data: {
                activityId: toActivityId
            },
            type: 'GET',
            async: false,
            dataType: 'json',
            success: function (msg) {
                thisObj.activityUsers = msg;
            }
        });
    }
    return thisObj.activityUsers;
};

ChatUI.prototype.getClubUsers = function (toKuulabuId) {
    thisObj = this;
    if (toKuulabuId != '') {
        $.ajax({
//            url: "http://ldev.www.kuulabu.com/app_dev.php/zh_CN/services/chatIo-getClubUserList.json",
            url: "chatIo-getClubUserList.json",
            data: {
                kuulabuId: toKuulabuId
            },
            type: 'GET',
            async: false,
            dataType: 'json',
            success: function (msg) {
                thisObj.clubUsers = msg;
            }
        });
    }
    return thisObj.clubUsers;
};

ChatUI.prototype.blindAtWhoplugin = function () {

    var data = ["Jacob", "Isabella", "Ethan", "Emma", "Michael", "Olivia", "Alexander", "Sophia", "William", "Ava", "Joshua", "Emily", "Daniel", "Madison", "Jayden", "lepture", "Abigail", "Noah", "Chloe", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "你好", "你你你", "高富帅"
    ];
    emojis = ["tup1", "tup2", "tup3", "tup4", "tup5", "tup6", "tup7", "tup8", "tup9", "tup10", "tup11", "tup12", "tup13", "tup14", "tup15", "tup16", "tup17", "tup18", "tup19", "tup20", "tup21", "tup22", "tup23", "tup24", "tup25"];
    emojis = $.map(emojis, function (value, i) {
        return {id: i, 'nickname': value}
    })
    data = $.map(data, function (value, i) {
        return {id: i, 'name': value, 'email': value + "@email.com"};
    });
    $('[name="chat_toWriteContent"]', '[name=chatFrame]').atwho({
        at: ":",
        alias: "emojis",
        search_key: "nickname",
        tpl: "<li data-value=':${nickname}:'>${nickname} <img src='/img/im_img/${nickname}.png'  height='20' width='20' /></li>", insert_tpl: "<img src='/img/im_img/${nickname}.png'  height='20' width='20' />", 'data': emojis, show_the_at: false, 'start_with_space': false
    }).one('focus',function (e) {
        $(this).atwho('load', "at-mentions", data);
    }).one('matched-at-mentions.atwho',function (e, key, query) {
//      console.log("matched.at-mentions", e.namespace, key, query)
    }).one('matched-emojis.atwho',function (e) {
//      console.log("matched emojis", e.namespace)
        inputor.atwho('load', ":", data).atwho('run')
    }).one('matched.atwho', function (e) {
//      console.log(e.type, e.namespace)
    });
};

/**
 * 插入提醒信息。
 */
ChatUI.prototype.insertNoticeInfo = function (room) {
    groupType = room.split("-"); //字符分割
    switch (groupType['0']) {
        case  'club':
            target = 'target_clubid';
            name = 'clubSecondLevel';
            insertObj = 'clubNotice';
            break;
        case  'activity':
            target = 'target_activityid';
            name = 'activitySecondLevel';
            insertObj = 'activityNotice';
            break;
        case  'group':
            target = 'target_groupid';
            name = 'groupSecondLevel';
            insertObj = 'groupNotice';
            break;
        case  'userTouser':
            target = 'target_userid';
            name = 'userSecondLevel';
            insertObj = 'userTouserNotice';
            break;
        default:
            break;
    }
    if (thisObj.beatfunc == null) {
//		 thisObj.textBeat($('[name=notice_li]'));  //暂时屏蔽，已避免需要停止两个定时的操作的问题。
        thisObj.textBeat($('[name=chatBarbutton]  [name=chat_code]'));
//		 console.log('bian le ');
    }
    thisObj.noticeTotal('add');

    //判断是否已经存在此提醒记录。
    if ($("[name=new_notice_list] [name='" + name + "' ]").find('span[' + target + '=' + groupType['1'] + ']').length > 0) {
        noticeNum = $("[name=new_notice_list] [name='" + name + "' ]").find('span[' + target + '=' + groupType['1'] + ']').closest('li').find('[name=noticeNum]').text();
        noticeNum = parseInt(noticeNum);
        $("[name=new_notice_list] [name='" + name + "' ]").find('span[' + target + '=' + groupType['1'] + ']').closest('li').find('[name=noticeNum]').text(noticeNum + 1);
    } else {
        insertHtml = $("[name=chatAllFriends]  [name='" + name + "' ]").find('span[' + target + '=' + groupType['1'] + ']').closest('li').html();
        insertHtml = '<li>' + insertHtml + '<span class="noticeNum" name="noticeNum" >1</span></li>';
        $('[name=chatAllFriends]  [name=new_notice_list] ul[name=' + insertObj + ']').append(insertHtml);
    }

    $('[name=chatAllFriends]  li[name=notice_li]').click();
    //在线的消息记录。

};
//文字跳动效果。
ChatUI.prototype.textBeat = function (textObj) {
    i = 0;
    thisObj = this;
    var color = [ '#000000', 'red'];
    thisObj.beatfunc = setInterval(function () {
        $(textObj).css("color", color[i % 6]);
        i++;
    }, 500);
//    console.log('zheng zai bian');	 
};

ChatUI.prototype.noticeTotal = function (type) {
    thisObj = this;

    //计算当前未读信息的总数
    noticeTotalNum = 0;
    if ($('[name=new_notice_list]  [name=noticeNum]').length > 0) {
        $('[name=new_notice_list]  [name=noticeNum]').each(function () {
            noticeTotalNum += parseInt($(this).text()) + 1;
        });
    } else {
        if (type == 'add') {
            noticeTotalNum = 1;
        }
    }
    if (noticeTotalNum == 0) {
        clearInterval(thisObj.beatfunc);
        thisObj.beatfunc = null;
        $('[name=chatBarbutton] [name=noticeTotalNum]').hide();
        $('[name=chatAllFriends] [name=friends_li]').click();
    } else {
        $('[name=chatBarbutton] [name=noticeTotalNum]').show();
        $('[name=chatBarbutton] [name=noticeTotalNum]').text(noticeTotalNum);

    }
};
/**
 * paramer  insertNode  要插入的结点  注意，此处js不支持默认值的情况。
 * paramer  room  要插入的
 * paramer  isInsertOwer 是否将自己发送的信息再显示一遍
 */
ChatUI.prototype.insertMessage = function (insertNode, room, userInfo, isInsertOwer) {
//	   console.log(userInfo);
//	   console.log('room:'+room);
    if (userInfo.userId == thisObj.userId) {
        if (isInsertOwer) {
            //如果是自己。
            insertHtml = '\
			    	    	    <div  class="chat_from_me" name="chat_from_me" >\
			                          <a  class="send_from_me" href="javascript:void(0);">me</a> \
			                          <label name="chat_from_me_content" >' + userInfo.msg + '</label>\
			                          <span class="send_time" ></span>\
						        </div>\
	 	    	   ';
            $(insertNode).append(insertHtml);
            $(insertNode)[0].scrollTop = $(insertNode)[0].scrollHeight;
        }
    } else {
        //如果不是自己。
        insertHtml = '\
	    	    		 <div class="chat_from_otherPeople" name="chat_from_otherPeople" >\
				           <a  class="send_from_people" href="javascript:void(0);">' + userInfo.username + '</a>\
	    	    		   <label name="chat_from_me_content" >' + userInfo.msg + '</label>\
				           <span class="send_time" ></span>\
						</div>\
	    		     ';
        $(insertNode).append(insertHtml);
        $(insertNode)[0].scrollTop = $(insertNode)[0].scrollHeight;
    }
};

ChatUI.prototype.noticeUserHasOnline = function (userId) {
    //更改好友列表中的好友的状态。
    if ($('[name=friendUiList] ul ul a.online ').find('span[target_userId=' + userId + ']').length <= 0) {
        $onlineUserObj = $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('li');
        $onlineHtml = "<span style='status' name='status'>(在线)</span>";
        $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('a[name=userSecondLevel]').append($onlineHtml);
        $onlineUserHtml = "<li>" + $onlineUserObj.html() + "</li>";
        $onlineUserObj.remove();
        $('[name=myFriendsList]  ul li ').first().before($onlineUserHtml);
        $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('a[name=userSecondLevel]').addClass('online').removeClass('offline');
//		 console.log('noticeUserHasOnline chu lai le ');
    } else {
//		 $('[name=friendUiList]  a[name=userSecondLevel] ').find('span[target_userId='+userId+']').css('color','blue');
        // 将css改成online。否则报错。
    }

    //更改用户已经打开的群的列表中的好友状态。
    $groupOnlineObj = $('[name=chatBlock] ul li[target_userId=' + userId + ']').closest('li');
//	 $groupOnlineHtml= "<li target_userId="+userId+" >"+$groupOnlineObj.html()+"</li>";
//	 $groupOnlineObj.remove();
//	 $('[name=chatBlock] ul li').first().before($groupOnlineHtml);
//	 $('[name=chatBlock] ul li[target_userId='+userId+']').addClass('online').removeClass('offline');

    $groupOnlineObj.each(function (i, thisDom) {
        $groupOfflineHtml = "<li target_userId=" + userId + " >" + $(thisDom).html() + "</li>";
        $(thisDom).closest('[name=chatBlock]').find('ul li').first().before($groupOfflineHtml);
        $(thisDom).closest('[name=chatBlock]').find('ul li[target_userId=' + userId + ']').addClass('online').removeClass('offline');
        $(thisDom).remove();
    });
};

ChatUI.prototype.noticeUserHasOffline = function (userId) {
    //更改好友列表中的好友的状态
    $offlineUserObj = $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('li');
    $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('a[name=userSecondLevel]').find('span[name=status]').remove();
    if ($offlineUserObj.html()) {
        $offlineUserHtml = "<li>" + $offlineUserObj.html() + "</li>";
        $offlineUserObj.remove();
        $('[name=myFriendsList]  ul li ').last().after($offlineUserHtml);
        $('[name=myFriendsList]  a[name=userSecondLevel] ').find('span[target_userId=' + userId + ']').closest('a[name=userSecondLevel]').addClass('offline').removeClass('online');
    }
    //更改用户已经打开的群的列表中的好友状态。
    $groupOfflineObj = $('[name=chatBlock] ul li[target_userId=' + userId + ']').closest('li');
    $groupOfflineObj.each(function (i, thisDom) {
        $groupOfflineHtml = "<li target_userId=" + userId + " >" + $(thisDom).html() + "</li>";
        $(thisDom).closest('[name=chatBlock]').find('ul li').last().after($groupOfflineHtml);
        $(thisDom).closest('[name=chatBlock]').find('ul li[target_userId=' + userId + ']').addClass('offline').removeClass('online');
        $(thisDom).remove();
    });
};

/*个人和群聊的共用的聊天窗口插入html代码*/
ChatUI.prototype.createChatRoom = function (html) {
    if ($('[name=chatBlock]').length == 0) {
        $('[name=bottombar]').append(html);
    } else {

        $('[name=chatRoom]').each(function () {
            $(this).hide();
        });
        $('[name=chatBlock]').first().before(html);
    }
};
/*显示当前激活的聊天的bar*/
ChatUI.prototype.showActivityBar = function (room) {
    $('[name=chatBlock] [name=room]').each(function () {
        if ($(this).val() == room) {
            $(this).closest('[name=chatBlock]').find('[name=chatRoom]').show();
            $('[name=panelbarbutton]').each(function () {
                $(this).removeClass('online');
            });
            $(this).closest('[name=chatBlock]').find('[name=panelbarbutton]').addClass('online');
        }
    });
};

ChatUI.prototype.ChatChangeDivToTextarea = function () {
    thisObj = this;
    $('[name=chat_toWriteContent]:first').changeDivToTextarea({
        isSupportContentEditable: thisObj.isSupportContentEditable
    });
}

