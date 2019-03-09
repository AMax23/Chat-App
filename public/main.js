$(function () {

    const socket = io();

    let aliases = getAliases();
    let username = getCookie("username");
    let color = getCookie("color");

    socket.emit("returning user", username, color);

    const $messageForm = $('#messageForm');
    const $msgContent = $('#messageContent');
    const $chat = $('.messages');
    const $user = $('.newUser');
    let $currentUser = $('.currentUserText');


    const createMessage = (message) => {

        let msgType = '';

        if (aliases.includes(message.user)) {
            msgType = "right";
            message.user = username;
        }

        return `
                <div class="messageContainer ${msgType}">
                    <div class="username" style="color:${message.color}">
                        <p>${message.user}</p>
                    </div>
                    <div class="textMessage">
                        <div class="chatBubble"></div>
                        <div class="innerMessage">
                            <p>${message.msg}</p>
                        </div>
                    </div>
                    <div class="timestamp">
                        <p>${formatTime(message.time)}</p>
                    </div>
                </div>
            `;
    };


    $messageForm.submit(function (e) {
        e.preventDefault();

        if ($msgContent.val().trim().length !== 0)
            socket.emit('send message', $msgContent.val().trim());

        // Clear the input box after sending the message.
        $msgContent.val('');
    });

    socket.on('new message', function (message) {


        color = message.color;
        if (message.msg.trim().length > 0)
            $chat.append(createMessage(message));

        // Chat window is always scrolled to bottom.
        $chat.scrollTop($chat[0].scrollHeight);
    });

    socket.on('new user', function (user, color, allMessages, nameChange) {

        this.color = color;
        if (username !== "" && nameChange === false) {
            $currentUser.html('You are ' + username);
            aliases.push(username);
        } else {
            $currentUser.html('You are ' + user);
            setCookie("username", user);
            setCookie("color", color);
            aliases.push(user);
        }

        $chat.empty();
        displayMessages(allMessages);

    });

    socket.on('update users', function (user) {
        $user.html(displayUsers([...new Set(user)]));
    });

    socket.on('color error', function () {
        alert("Error in changing color. That is not a valid format. Try /nickcolor RRGGBB");
    });

    socket.on('name error', function () {
        alert("The username is already taken. Don't steal someone else's identity.");
    });

    socket.on("set cookie", function (name, value) {
        setCookie(name, value);
    });

    function formatTime(time) {

        let hours = time.slice(0, time.indexOf(":"));
        let min = time.slice(time.indexOf(":") + 1);

        let period = (hours >= 12 ? 'PM' : 'AM');

        hours = hours % 12;
        hours = hours ? hours : 12;
        min = min < 10 ? '0' + min : min;

        return (hours + ':' + min + ' ' + period);
    }

    function displayUsers(users) {

        let allUsers = '';

        for (let i = 0; i < users.length; i++) {
            allUsers += (`<li><p>${users[i]}</p></li>`);
        }

        return allUsers;
    }

    function displayMessages(allMessages) {

        for (let i = 0; i < allMessages.length; i++) {
            $chat.append(createMessage(allMessages[i]));
        }
        $chat.scrollTop($chat[0].scrollHeight);

    }

    function setCookie(name, value) {

        if (name === "username")
            username = value;
        else
            color = value;

        document.cookie = name + "=" + encodeURIComponent(value) + "; " + "expires=" + 60 * 60 * 24 + "; ";

    }

    function getCookie(name) {

        let cookiesArray = decodeURIComponent(document.cookie).split("; ");

        let value = '';

        for (let i = 0; i < cookiesArray.length; i++) {

            value = cookiesArray[i].substring(0, cookiesArray[i].indexOf("="));

            if (name === value)
                return cookiesArray[i].substring(cookiesArray[i].indexOf("=") + 1);
        }

        return '';
    }

    function getAliases() {

        let cookiesArray = decodeURIComponent(document.cookie).split("; ");

        let value = '';

        let add = [];

        for (let i = 0; i < cookiesArray.length; i++) {

            value = cookiesArray[i].substring(0, cookiesArray[i].indexOf("="));

            if ("username" === value)
                add.push(cookiesArray[i].substring(cookiesArray[i].indexOf("=") + 1));
        }

        return add;
    }

});

