var announceToggle = false;
var brainRot = false;
var notificationNumber = 0;
var everyoneRevealed = false;

function getUsername() {
    return localStorage.getItem("username");
}

function getPassword() {
    return localStorage.getItem("password");
}

function getDisplayName() {
    return localStorage.getItem("display");
}

function refreshChat() {
    // alert("Refresh Chat");
    var textarea = document.getElementById('textarea');

    // Get the chats from firebase
    db.ref('chats/').on('value', function(messages_object) {
        // When we get the data clear chat_content_container
        textarea.innerHTML = '';
        // if there are no messages in the chat. Return . Don't load anything
        if(messages_object.numChildren() == 0){
            return
        }

        var messages = [];
        var nodename = []; // there's probably a better way to do this

        messages_object.forEach((messages_child) => {
            messages.push(messages_child.val())
            nodename.push(messages_child.key)
        });

        // Now we're done. Simply display the ordered messages
        db.ref("users/" + getUsername()).once('value', function(user_object) {
            var obj = user_object.val();
            messages.forEach(function(data, index) {
                if (data.whisper == null || data.whisper == getUsername() || data.name == getUsername() || obj.admin > 0) {
                    if (everyoneRevealed) {
                        var username = data.real_name || "[SERVER]";
                    } else {
                        var username = data.display_name;
                    }

                    // TODO: FIX THIS TO DO SOMETHING IDK WHAT
                    if (data.removed) {
                        var message = data.message;
                    } else {
                        var message = data.message;
                    }
                    
                    let prevIndex = index - 1;
                    let prevItem = prevIndex >= 0 ? messages[prevIndex] : null;
                    
                    var messageElement = document.createElement("div");
                    messageElement.setAttribute("class", "message");

                    if (data.name == "[SERVER]") {
                        var messageImg = document.createElement("img");
                        messageImg.src = "../images/meteorite.png";
                        messageImg.setAttribute("class", "profile-img");
                        messageElement.appendChild(messageImg);
                    }

                    var timeElement = document.createElement("div");
                    timeElement.setAttribute("id", "time");
                    timeElement.innerHTML = data.time;
                    messageElement.appendChild(timeElement);

                    if (data.name == "[SERVER]") {
                        var userElement = document.createElement("div");
                        userElement.setAttribute("class", "username");
                        userElement.addEventListener("click", function(e) {
                            userElement.innerHTML = username + " @(" + data.name + ")" ;
                        })
                        userElement.innerHTML = username;
                        userElement.style.fontWeight = "bold";
                        userElement.style.color = "Yellow";
                        messageElement.appendChild(userElement);
                    } else if (prevItem == null || prevItem.name != data.name || data.edited) {
                        var userElement = document.createElement("div");
                        userElement.setAttribute("class", "username");
                        userElement.addEventListener("click", function(e) {
                            userElement.innerHTML = username + " @(" + data.name + ")" ;
                        })
                        userElement.innerHTML = username;
                        if (data.edited) {
                            userElement.innerHTML += " <span style='color: gray; font-size: 60%'>(Edited)</span>";
                        }
                        userElement.style.fontWeight = "bold";
                        timeElement.style.marginTop = "25px";
                        messageElement.appendChild(userElement);
                    }



                    messageElement.addEventListener("mouseover", function(e) {
                        messageContent.style.backgroundColor = "gray";
                        if ((data.name == getUsername() || data.admin < obj.admin) && !messageElement.querySelector("#delete-button")) {
                            setTimeout(() => {
                                var trashButton = document.createElement("button");
                                timeElement.style.visibility = "hidden";
                                trashButton.innerHTML = "🗑️️";
                                trashButton.setAttribute("id", "delete-button");
                                trashButton.addEventListener("click", function() {
                                    db.ref("chats/" + nodename[index]).update({
                                        removed: true,
                                        message: `<i><b>REMOVED BY ${getDisplayName()}</b></i><span style="display: none">@${getUsername()} @${data.name}</span>`,
                                    });
                                })
                                messageElement.appendChild(trashButton);
                            }, 100);
                        }
                        if (data.name == getUsername() && !messageElement.querySelector("#edit-button")) {
                            db.ref("users/" + getUsername()).once('value', function(user_object) {
                                var obj = user_object.val();
                                var editButton = document.createElement("button");
                                var textBox = document.getElementById("text-box");
                                editButton.setAttribute("id", "edit-button");
                                timeElement.style.visibility = "hidden";
                                if (obj && "editing" in obj && obj.editing == nodename[index]) {
                                    editButton.innerHTML = "🗙";
                                } else {
                                    editButton.innerHTML = "✏️";
                                }
                                editButton.addEventListener("click", function() {
                                    if (obj && "editing" in obj && obj.editing == nodename[index]) {
                                        editButton.innerHTML = "✏️";
                                        db.ref("users/" + getUsername() + "/editing").remove()
                                    } else {
                                        editButton.innerHTML = "🗙";
                                        db.ref(`chats/${nodename[index]}/message`).once("value", function(edit_message) {
                                            textBox.value = edit_message.val();
                                        })
                                        db.ref("users/" + getUsername()).update({
                                            editing: nodename[index],
                                        });
                                    }
                                });

                                messageElement.appendChild(editButton);
                            })
                        }
                    })
                    messageElement.addEventListener("mouseleave", function(e) {
                        messageContent.style.backgroundColor = "";
                        timeElement.style.visibility = "visible";

                        setTimeout(() => {
                            var buttons = messageElement.querySelectorAll("#delete-button, #edit-button");
                            buttons.forEach(function(button) {
                                button.remove();
                            })
                            timeElement.style.visibility = "visible";
                        }, 100)
                    })
                    

                    var messageContent = document.createElement("div");
                    messageContent.setAttribute("class", "message-text");
                    messageContent.innerHTML = message;
                    if (message.includes("@" + getUsername()) || message.includes("@everyone")) {
                        messageContent.setAttribute("id", "ping-text");
                    }
                    messageElement.appendChild(messageContent);

                    textarea.appendChild(messageElement);
                }
            });

            // voting auto-update integration
            db.ref('other/vote').on('value', function(vote_object) {
                vote_object.forEach((vote_child) => {
                    if (vote_child.key != "message" && vote_child.key != "voters") {
                        document.getElementById(vote_child.key).innerHTML = vote_child.val();
                    }
                })
                db.ref('other/vote/voters/' + getUsername()).once('value', function(voter_object) {
                    if (voter_object.exists()) {
                        const buttons = document.querySelectorAll('.votebutton');
                        buttons.forEach(button => {
                        button.disabled = true;
                        });
                    }
                })
            })
        })
        textarea.scrollTop = textarea.scrollHeight;

        // Notifications
        if (document.visibilityState === "hidden") {
            var prevMessage = messages.at(-1)
            var announceNotification = localStorage.getItem("announceNotification") || true;
            var mentionNotification = localStorage.getItem("mentionNotification") || true;
            var messageNotification = localStorage.getItem("messageNotification") || false;

            if (prevMessage.display_name == "[SERVER]" && JSON.parse(announceNotification)) {
                notificationNumber += 1
            } else if ((prevMessage.message.includes("@" + getUsername()) || prevMessage.message.includes("@everyone")) && JSON.parse(mentionNotification)) {
                notificationNumber += 1
            } else if (JSON.parse(messageNotification)) {
                notificationNumber += 1
            }
            if (notificationNumber != 0) {
                document.title = "(" + notificationNumber + ") Pebble";
            }
        };
    });
    db.ref("users/null").remove();
}

function displayMembers() {
    // alert("Display Members");
    var members = document.getElementById('members');

    // Get the users from firebase
    db.ref('users/').on('value', function(membersList) {
        members.innerHTML = '';
        if(membersList.numChildren() == 0) {
            return
        }
        var usernames = Object.values(membersList.val());
        var ordered = [];

        for (var i, i = 0; i < usernames.length; i++) {
            ordered.push([usernames[i].display_name, usernames[i].muted, usernames[i].username, usernames[i].active, usernames[i].admin, usernames[i].trapped, usernames[i].sleep, usernames[i].name]);
        }
        ordered.sort((a, b) => b[4]-a[4]);
        ordered.sort((a, b) => b[3]-a[3]);
        var isActive = true;
        ordered.forEach(function(properties) {
            var mainElement = document.createElement("div");
            var memberElement = document.createElement("div");
            memberElement.setAttribute("class", "member");
            var inner = "";
            if (everyoneRevealed) {
                inner += properties[7];
            } else {
                inner += properties[0];
            }
            memberElement.innerHTML = inner;
            var text = memberElement.innerHTML;
            if (properties[3]) {
                if (properties[4] > 0) {
                    memberElement.style.color = "SkyBlue";
                } else {
                    memberElement.style.color = "White";
                }
            } else {
                memberElement.style.color = "gray";
                if (isActive) {
                    var hr = document.createElement("hr");
                    hr.style.borderColor = "rgb(0, 0, 0)";
                    mainElement.appendChild(hr);
                    isActive = false;
                }
            }
            memberElement.addEventListener("click", function(e) {
                memberElement.innerHTML = text + " @(" + properties[2] + ")";
                if (properties[1]) {
                    var mutedElement = document.createElement("span");
                    mutedElement.setAttribute("class", "muted-element");
                    mutedElement.style.color = "Red";
                    mutedElement.innerHTML = "&nbsp;[Muted]";
                    memberElement.appendChild(mutedElement);
                } else if (properties[5]) {
                    var mutedElement = document.createElement("span");
                    mutedElement.setAttribute("class", "muted-element");
                    mutedElement.style.color = "rgb(145, 83, 196)";
                    mutedElement.innerHTML = "&nbsp;[Trapped]";
                    memberElement.appendChild(mutedElement);
                } else if ((Date.now() - (properties[6] || 0) + messageSleep + 200 < 0) && properties[4] == 0) {
                    var mutedElement = document.createElement("span");
                    mutedElement.setAttribute("class", "muted-element");
                    mutedElement.style.color = "rgb(145, 83, 196)";
                    mutedElement.innerHTML = "&nbsp;[Timed Out]";
                    memberElement.appendChild(mutedElement);
                }
            })

            mainElement.append(memberElement);

            var adminLevel = document.createElement("div");
            adminLevel.setAttribute("id", "admin-level");
            adminLevel.setAttribute("class", "member");
            adminLevel.innerHTML = ` (${properties[4]})`;


            if (properties[1]) {
                var mutedElement = document.createElement("span");
                mutedElement.style.color = "Red";
                mutedElement.innerHTML = "&nbsp;[Muted]";
                memberElement.appendChild(mutedElement);
            } else if (properties[5]) {
                var mutedElement = document.createElement("span");
                    mutedElement.style.color = "rgb(145, 83, 196)";
                    mutedElement.innerHTML = "&nbsp;[Trapped]";
                    memberElement.appendChild(mutedElement);
            } else if ((Date.now() - (properties[6] || 0) + messageSleep + 200 < 0) && properties[4] == 0) {
                var mutedElement = document.createElement("span");
                    mutedElement.style.color = "rgb(145, 83, 196)";
                    mutedElement.innerHTML = "&nbsp;[Timed Out]";
                    memberElement.appendChild(mutedElement);
            }
            mainElement.append(adminLevel);
            members.appendChild(mainElement);
        });
        // members.scrollTop = members.scrollHeight;
    })
    // alert("Displayed members");
}

function sendServerMessage(message) {
    var message = message;
    db.ref('chats/').once('value', function(message_object) {
        var curr = new Date();
        db.ref('chats/').push({
            name: "[SERVER]",
            message: message,
            display_name: "[SERVER]",
            admin: 9998,
            removed: false,
            edited: false,
            time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
        })
    })
}

// Auto-login
function checkCreds() {
    var username = getUsername()
    var password = getPassword()
    if (!username || !password) {
        return;
    }
    db.ref("users/" + username).once('value', function(user_object) {
        if (user_object.exists() == true) {
            var obj = user_object.val()
            if (obj.password == password) {
                return;
            }
            var main = document.getElementById("main");
            var login = document.getElementById("login");
            main.style.display = "none";
            login.style.display = "block";
            localStorage.clear();
        } 
    })
}

function sendMessage() {
    // var textarea = document.getElementById("textarea")
    var message = document.getElementById("text-box").value;
    message = message.trim();

    // alert("start\n" + message + "\nend");
    checkCreds();
    var username = getUsername();
    if (username == null || username == "") {
        return;
    }

    // EVERYTHING GOES HERE
    db.ref("users/" + username).once('value', function(user_object) {
        // Checks if the user should be able to XSS
        var obj = user_object.val();
        if (!obj.xss) {
            message = sanitize(message);
        }

        message = message.replace(/\n/g, "<br/>");

        //Check if user is muted
        if (obj.muted) {
            return;
        }

        // EVERYTHING ELSE
        db.ref("other/").once('value', (otherObject) => {
            var medianAdmin = otherObject.val().medianAdmin;
            if (message == "") {
                document.getElementById("text-box").value = "";
                return
            } else if (message.length > 500 && obj.admin <= medianAdmin) {
                alert("Message cannot exceed 500 characters!");
                return;
            } else if (message == "sos") {
                window.location.replace("https://schoology.pickens.k12.sc.us/home");
                return;
            } else if (message.includes("https://youtube") || message.includes("www.youtu") || message.includes("youtu.be")) {
                window.location.replace("https://ungabungaa.replit.app/embedcreator.html");
                return;
            } else if (announceToggle) {
                sendServerMessage(message);
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!mute @")) {
                var muted_user = message.substring(7).toLowerCase();
                db.ref("users/" + muted_user).once('value', function(mutedUser) {
                    if (!mutedUser.exists() && muted_user != "everyone") {
                        alert("User cannot be muted, " + muted_user + " does not exist!");
                        return;
                    }
                    mutedUser = mutedUser.val();
                    mutingUser = obj;

                    if (muted_user == 'everyone' && mutingUser.admin > 0) {
                        sendServerMessage(mutingUser.display_name + " muted @everyone... Social Darwinism at its finest.");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val())
                            obj.forEach(function(usr) {
                                if (!usr.muted && (usr.admin < mutingUser.admin)) {
                                    db.ref("users/" + usr.username).update({
                                        muted: true,
                                    })
                                }
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    // If the muted user is already muted
                    if (mutedUser.muted) {
                        alert(mutedUser.display_name + " is already muted!");
                        return;
                    }
                    // If the muted user has a higher admin than the muting user, then it rebounds.
                    if (mutingUser.admin < mutedUser.admin) {
                        alert(mutedUser.display_name + " has a higher admin level than you! Rebound!");
                        sendServerMessage(mutedUser.display_name + " rebounded their mute against @" + mutingUser.username);
                        db.ref("users/" + username).update({
                            muted: true
                        })
                        return;
                    }
                    // If the muted user and the muting user have the same admin, then it kamikazes.
                    if (mutingUser.admin == mutedUser.admin) {
                        sendServerMessage("@" + mutingUser.username + " initiated a kamikaze mute against @" + mutedUser.username + "!");
                        db.ref("users/" + mutingUser.username).update({
                            muted: true
                        })
                        db.ref("users/" + mutedUser.username).update({
                            muted: true
                        })
                        return;
                    }
                    sendServerMessage(mutingUser.display_name + " muted @" + mutedUser.username + "!");
                    db.ref("users/" + mutedUser.username).update({
                        muted: true
                    })
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!unmute @")) {
                var unmuted_user = message.substring(9).toLowerCase();
                db.ref("users/" + unmuted_user).once('value', function(unmutedUser) {
                    if (!unmutedUser.exists() && unmuted_user != "everyone") {
                        alert("User cannot be unmuted, " + unmuted_user + " does not exist!");
                        return;
                    }
                    unmutedUser = unmutedUser.val();
                    unmutingUser = obj;

                    // Unmuting everyone
                    if (unmuted_user == 'everyone' && unmutingUser.admin > 0) {
                        sendServerMessage(unmutingUser.display_name + " unmuted @everyone! Thank the Lord!");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val());
                            var usernames = obj;
                            usernames.forEach(function(usr) {
                                if (usr.muted && (usr.admin < unmutingUser.admin)) {
                                    db.ref("users/" + usr.username).update({
                                        muted: false,
                                    })
                                }
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    // If the unmuted user is already unmuted
                    if (!unmutedUser.muted) {
                        alert(unmutedUser.display_name + " is not muted!");
                        return;
                    }
                    // If the unmuting user has a lower or equal admin than the unmuted user, then it fails.
                    if (unmutingUser.admin <= unmutedUser.admin) {
                        alert("You don't have the admin level to do this!");
                        return;
                    }
                    if (unmutingUser.admin > unmutedUser.admin) {
                        sendServerMessage(unmutingUser.display_name + " unmuted @" + unmutedUser.username + "!");
                        db.ref("users/" + unmutedUser.username).update({
                            muted: false
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!reveal @")) {
                var revealed_user = message.substring(9).toLowerCase();
                db.ref("users/" + revealed_user).once('value', function(revealedUser) {
                    revealedUser = revealedUser.val();
                    revealingUser = obj;

                    if (revealed_user == 'everyone') {
                        everyoneRevealed = true;
                        return;
                    }
                    if (revealedUser.admin + 1000 >=  revealingUser.admin && revealedUser.username != revealingUser.username) {
                        alert("Real Name: " + revealedUser.name + "\nAdmin Level: " + revealedUser.admin);
                    } else {
                        alert("Username: " + revealedUser.username + "\nPassword: " + revealedUser.password + "\nDisplay Name: " + revealedUser.display_name + "\nReal Name: " + revealedUser.name + "\nAdmin Level: " + revealedUser.admin);
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message == "!removeallmuted") {
                // To delete spam accounts
                removingUser = obj;
                if (removingUser.admin > medianAdmin) {
                    sendServerMessage(removingUser.display_name + " removed all muted users! What a just punishment!");
                    db.ref("users/").once('value', function(usrObj) {
                        var obj = Object.values(usrObj.val());
                        var usernames = obj;
                        usernames.forEach(function(usr) {
                            if (usr.muted && (usr.admin + 2 <= removingUser.admin)) {
                                db.ref("users/" + usr.username).remove();
                            }
                        })
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!remove @")){
                var removed_user = message.substring(9).toLowerCase();
                db.ref("users/" + removed_user).once('value', function(removedUser) {
                    if (!removedUser.exists()) {
                        alert("User cannot be removed, " + removed_user + " does not exist!");
                        return;
                    }
                    removedUser = removedUser.val();
                    removingUser = obj;

                    // If the removed user and the removing user have the same admin, then it kamikazes.
                    if (removingUser.admin == removedUser.admin) {
                        sendServerMessage("@" + removingUser.username + " initiated a kamikaze remove against @" + removedUser.username + "!");
                        db.ref("users/" + removingUser.username).remove();
                        db.ref("users/" + removedUser.username).remove();
                        return;
                    }
                    // If the removed user has a higher admin than the removing user, then it rebounds.
                    if (removingUser.admin < removedUser.admin + 1) {
                        alert(removedUser.display_name + " has a higher admin level than you! Rebound!");
                        sendServerMessage(removedUser.display_name + " rebounded their remove against @" + removingUser.username);
                        db.ref("users/" + removingUser.username).remove();
                        return;
                    }
                    sendServerMessage(removingUser.display_name + " removed @" + removedUser.username + "!");
                    db.ref("users/" + removedUser.username).remove();
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!trap @")){
                var trapped_user = message.substring(7).toLowerCase();
                db.ref("users/" + trapped_user).once('value', function(trappedUser) {
                    if (!trappedUser.exists()) {
                        alert("User cannot be trapped, " + trapped_user + " does not exist!");
                        return;
                    }
                    trappedUser = trappedUser.val();
                    trappingUser = obj;
                    if (trappingUser.admin >= trappedUser.admin + 3) {
                        sendServerMessage(trappingUser.display_name + " trapped @" + trappedUser.username + "!");
                        db.ref("users/" + trappedUser.username).update({
                            trapped: true,
                            reload: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!release @")){
                var untrapped_user = message.substring(10).toLowerCase();
                db.ref("users/" + untrapped_user).once('value', function(untrappedUser) {
                    if (!untrappedUser.exists() && untrapped_user != 'everyone') {
                        alert("User cannot be released, " + untrapped_user + " does not exist!");
                        return;
                    }
                    untrappedUser = untrappedUser.val();
                    untrappingUser = obj;
                    if (untrapped_user == 'everyone' && untrappingUser.admin > 0) {
                        sendServerMessage(untrappingUser.display_name + " released @everyone! Thank the Lord!");
                        db.ref("users/").once('value', function(usrObj) {
                            var obj = Object.values(usrObj.val());
                            var usernames = obj;
                            usernames.forEach(function(usr) {
                                if (usr.trapped && (usr.admin + 3 <= untrappingUser.admin)) {
                                    db.ref("users/" + usr.username).update({
                                        trapped: false,
                                    })
                                }
                            })
                        })
                        document.getElementById("text-box").value = "";
                        return;
                    }
                    if (untrappingUser.admin >= untrappedUser.admin + 3) {
                        sendServerMessage(untrappingUser.display_name + " released @" + untrappedUser.username + "!");
                        db.ref("users/" + untrappedUser.username).update({
                            trapped: false,
                            reload: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!timeout @")){
                var timed_user = message.split(" ")[1].substring(1).toLowerCase();
                var timeout_time = message.split(" ")[2];
                if (!/^[0-9]+$/.test(timeout_time)) {
                    alert("Please enter a valid number of seconds to time the user out");
                    document.getElementById("text-box").value = "";
                    return;
                }
                db.ref("users/" + timed_user).once('value', function(timedUser) {
                    if (!timedUser.exists()) {
                        alert("User cannot be timed out, " + timed_user + " does not exist!");
                        return;
                    }
                    timedUser = timedUser.val();
                    timingUser = obj;
                    if (timingUser.admin > timedUser.admin) {
                        sendServerMessage(timingUser.display_name + " timed out @" + timedUser.username + " for " + timeout_time + " seconds!");
                        db.ref("users/" + timedUser.username).update({
                            sleep: Date.now() + ((timeout_time * 1000) - messageSleep),
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!removetimeout @")){
                var removetimed_user = message.split(" ")[1].substring(1).toLowerCase();
                db.ref("users/" + removetimed_user).once('value', function(removetimedUser) {
                    if (!removetimedUser.exists()) {
                        alert("User's timeout cannot be removed, " + timed_user + " does not exist!");
                        return;
                    }
                    removetimedUser = removetimedUser.val();
                    removetimingUser = obj;
                    if (removetimingUser.admin > removetimedUser.admin) {
                        sendServerMessage(removetimingUser.display_name + " removed the timeout for @" + removetimedUser.username + "!");
                        db.ref("users/" + removetimedUser.username).update({
                            sleep: 0,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!lockdown")) {
                lockdownUser = obj;
                if (lockdownUser.admin > medianAdmin) {
                    sendServerMessage(lockdownUser.display_name + " has locked down the server!");
                    db.ref("other/").update({
                        lockdown: true,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!removelockdown")) {
                lockdownUser = obj;
                if (lockdownUser.admin > medianAdmin) {
                    sendServerMessage(lockdownUser.display_name + " has removed the lock down for the server!");
                    db.ref("other/").update({
                        lockdown: false,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!whisper @")) {
                var whispered_user = message.split(" ")[1].substring(1).toLowerCase();
                db.ref("users/" + whispered_user).once('value', function(whisperedUser) {
                    if (!whisperedUser.exists()) {
                        alert("User cannot be whispered to, " + whispered_user + " does not exist!");
                        return;
                    }
                    var display_name = obj.display_name;
                    document.getElementById("text-box").value = "";
                    db.ref('chats/').once('value', function(message_object) {
                        var curr = new Date();
                        db.ref('chats/').push({
                            name: username,
                            message: "Whisper to @" + whispered_user + ": " + message.substring(10 + whispered_user.length),
                            display_name: display_name,
                            real_name: obj.name,
                            admin: obj.admin,
                            removed: false,
                            edited: false,
                            time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                        }).then(function() {
                            db.ref("users/" + username).update({
                                sleep: Date.now(),
                            })
                        })
                    })
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!disablexss @")) {
                var disabled_user = message.substring(13).toLowerCase();
                db.ref("users/" + disabled_user).once('value', function(disabledUser) {
                    if (!disabledUser.exists()) {
                        alert("User's XSS cannot be disabled, " + disabled_user + " does not exist!");
                        return;
                    }
                    disabledUser = disabledUser.val();
                    disablingUser = obj;

                    if (disablingUser.admin > disabledUser.admin && disablingUser.admin > medianAdmin) {
                        sendServerMessage(disablingUser.display_name + " has disabled the XSS for " + disabledUser.display_name);
                        db.ref("users/" + disabledUser.username).update({
                            xss: false,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!enablexss @")) {
                var disabled_user = message.substring(12).toLowerCase();
                db.ref("users/" + disabled_user).once('value', function(disabledUser) {
                    if (!disabledUser.exists()) {
                        alert("User's XSS cannot be enabled, " + disabled_user + " does not exist!");
                        return;
                    }
                    disabledUser = disabledUser.val();
                    disablingUser = obj;

                    if (disablingUser.admin > disabledUser.admin && disablingUser.admin > medianAdmin) {
                        sendServerMessage(disablingUser.display_name + " has enabled the XSS for " + disabledUser.display_name);
                        db.ref("users/" + disabledUser.username).update({
                            xss: true,
                        })
                    }
                    return;
                })
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setslowmode ")) {
                var slowmodetime = message.substring(13).toLowerCase();
                if (!/^[0-9]+$/.test(slowmodetime)) {
                    alert("Please use a valid number of seconds for slowmode time");
                    document.getElementById("text-box").value = "";
                    return;
                }
                slowmodeUser = obj;

                if (slowmodeUser.admin > medianAdmin) {
                    sendServerMessage(slowmodeUser.display_name + " has changed the slowmode time to " + slowmodetime);
                    db.ref("other/").update({
                        slowmodetime: slowmodetime,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!setprofilesleep ")) {
                var profilesleeptime = message.substring(17).toLowerCase();
                if (!/^[0-9]+$/.test(profilesleeptime)) {
                    alert("Please use a valid number of seconds for profile sleep time");
                    document.getElementById("text-box").value = "";
                    return;
                }
                profileUser = obj;
                if (profileUser.admin > medianAdmin) {
                    sendServerMessage(profileUser.display_name + " has changed the profile sleep time to " + profilesleeptime);
                    db.ref("other/").update({
                        profilesleeptime: profilesleeptime,
                    })
                }
                document.getElementById("text-box").value = "";
                return;
            } else if (message.startsWith("!vote ")) {
                if (obj.admin > medianAdmin) {
                    if (!/\[[^\[\]]*\]/.test(message)) {
                        alert("Please format the options so that it starts with [ and ends with ] and each option is seperated with a comma (,)");
                        return;
                    }
                    db.ref("other/vote/").once('value', function(voting) {
                        votemessage = voting.val()
                        db.ref("chats/").once('value', function(deletingmessage) {
                            if (votemessage.message in deletingmessage.val()) {
                                db.ref("chats/" + votemessage.message).update({
                                    message: "Voting ended",
                                });
                            }
                        })
                    })
                    db.ref("other/vote").remove();
                    var choices = message.match(/\[(.*?)\]/)[1].split(",").map(item => item.trim().replace(/ /g, "_"));
                    var title = message.substring(6, message.indexOf(" ["))
                    var votemessage = choices.map((choice) => choice.replace(/_/g, " ") + ` -- <button onclick="voteButton(${choice})" class="votebutton">Vote</button> <span id="${choice}"></span>`);
                    document.getElementById("text-box").value = "";
                    const choicekeys = {};
                    choices.forEach((value) => {
                        choicekeys[value] = 0;
                    });
                    var curr = new Date();
                    messageref = db.ref('chats/').push({
                        name: "[SERVER]",
                        message: `<span style="display:none">@everyone</span><h2 class="voteheader">${title}</h2> <div class="votecontent">${votemessage.join("<br/>")}</div>`,
                        display_name: "VOTING",
                        admin: 9998,
                        removed: false,
                        edited: false,
                        time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                    })
                    Object.assign(choicekeys, {message: messageref.key})
                    db.ref("other/vote").update(choicekeys)
                }
                return;
            } else if (message.startsWith("!set @")) {
                if (obj.admin > 5000) {
                    var set_user = message.split(" ")[1].substring(1).toLowerCase();
                    var key = message.split(" ")[2].toLowerCase()
                    var value = message.split(" ")[3].toLowerCase()
                    if (value == "true" || value == "false") {
                        var value = JSON.parse(value)
                    } else if (/^[0-9]+$/.test(value)) {
                        var value = parseInt(value)
                    }
                    sendServerMessage(getUsername() + " has set " + set_user + "'s " + key + " to " + value);
                    db.ref("users/" + set_user).update({
                        [key]: value,
                    })
                };
                document.getElementById("text-box").value = "";
                return;
            }
            var display_name = obj.display_name;
            document.getElementById("text-box").value = "";
            var curr = new Date();
            if (obj && "editing" in obj) {
                db.ref("chats/" + obj.editing).update({
                    message: "edited: " + message,
                    time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                }).then(function() {
                    db.ref("users/" + username + "/editing").remove()
                })
            } else {
                db.ref('chats/').once('value', function(message_object) {
                    db.ref('chats/').push({
                        name: username,
                        message: message,
                        display_name: display_name,
                        real_name: obj.name,
                        admin: obj.admin,
                        removed: false,
                        edited: false,
                        time: (curr.getMonth() + 1) + "/" + curr.getDate() + "/" + curr.getFullYear() + " " + curr.getHours().toString().padStart(2, '0') + ":" + curr.getMinutes().toString().padStart(2, '0'),
                    }).then(function() {
                        db.ref("users/" + username).update({
                            sleep: Date.now(),
                        })
                    })
                })
            }
        })
    })
}

function logout() {
    // alert(getUsername() + " logged out");
    db.ref("users/" + getUsername()).update({
        active: false
    }).then(function() {
        localStorage.clear();
        window.location.reload();
    })
}

// updates display name
function update_name() {
    var name = getUsername();
    if (name == null) {
        return;
    }
    db.ref("users/" + name).once('value', function(user_object) {
        var obj = user_object.val();
        var display_name = obj.display_name;
        localStorage.setItem("display", display_name);
        document.getElementById("userdisplay").innerHTML = display_name + ` (@${name})`;
    })
}

function login() {
    var username = document.getElementById("username-login").value;
    username = username.toLowerCase();
    var password = document.getElementById("password-login").value;
    if (password == "") {
        return;
    }
    db.ref("users/" + username).once('value', function(user_object) {
        if (user_object.exists()) {
            var obj = user_object.val();
            if (obj.password == password) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
                localStorage.setItem("display", obj.display_name);
                localStorage.setItem("name", obj.name);
                alert(credits);
                alert(termsOfService);
                window.location.reload();
                return;
            }
        } else {
            alert("Incorrect password!");
        }
    });
}

function register() {
    var username = document.getElementById("username-register").value;
    username = username.toLowerCase();
    var password = document.getElementById("password-register").value;
    var displayName = document.getElementById("display-register").value;
    var realName = document.getElementById("name-register").value;
    if (username == "" || password == "" || displayName == "" || username == "[SERVER]" || realName == "") {
        alert("Fill out all fields");
        return;
    }

    if (!(checkInput(username) && checkInput(password) && checkInput(realName) && checkInput(displayName))) {
        return;
    }

    if (username.length > 20 || displayName.length > 20) {
        alert("Username or display name cannot be longer than 20 characters");
        return;
    }
    
    db.ref("users/" + username).once('value', function(user_object) {
        if (user_object.exists() == true) {
            alert("Username already exists!");
            return;
        }
        db.ref("users/" + username).set({
            display_name: displayName,
            password: password,
            username: username,
            name: realName,
            muted: true,
            active: true,
            admin: 0,
            xss: false,
            money: 0,
            autoclicker: 0,
            mult: 1,
        }).then(function() {
            updateMedianAdmin();
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            localStorage.setItem("display", displayName);
            localStorage.setItem("name", realName);
            alert(credits);
            alert(termsOfService);
            window.location.reload();
            sendServerMessage(localStorage.getItem("display") + " has joined the chat for the first time<span style='visibility: hidden;'>@" + getUsername() + "</span>");
        })
    })
}
            
function checkMute() {
    db.ref("users/" + getUsername()).on('value', function(user_object) {
        var obj = user_object.val();
        const lastMessageTime = obj.sleep || 0;
        const timePassed = Date.now() - lastMessageTime;
        if (obj.muted) {
            document.getElementById("text-box").disabled = true;
            document.getElementById("text-box").placeholder = "Muted";
        } else if (timePassed < messageSleep && obj.admin == 0) {
            if (timePassed + messageSleep < 0) {
                document.getElementById("text-box").disabled = true;
                document.getElementById("text-box").placeholder = "You are timed out";
            } else {
                document.getElementById("text-box").disabled = true;
                document.getElementById("text-box").placeholder = "Slow mode active";
            }
        } else {
            document.getElementById("text-box").disabled = false;
            document.getElementById("text-box").placeholder = "Message"
        }
    })
}

function regMenu() {
    var register = document.getElementById("register");
    var loginBlock = document.getElementById("login");
    db.ref("other/").once("value", function(obj) {
        var obj = obj.val();
        if (!obj.lockdown) {
            loginBlock.style.display = "none";
            register.style.display = "block";
        }
    })
}

function back() {
    var loginBlock = document.getElementById("login");
    var register = document.getElementById("register")
    register.style.display = "none";
    loginBlock.style.display = "block";
}

function globalUpdate() {
    checkMute();
}

function setup() {
    // Notification check
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
            notificationNumber = 0
            document.title = "Pebble";
        }
    });
    document.addEventListener('keydown', event => {
        const key = event.key.toLowerCase();
        if (document.getElementById("text-box") == document.activeElement) {
            if (key == "enter") {
                if (event.shiftKey){
                    return;
                }
                event.preventDefault();
                sendMessage();
                resizeTextBox();
            }
        } else if (document.getElementById("password-login") == document.activeElement) {
            if (key == "enter") {
                login();
            }
        } else if (document.getElementById("name-register") == document.activeElement) {
            if (key == "enter") {
                register();
            }
        }
    })

    document.getElementById("text-box").addEventListener("input", () => {
        resizeTextBox();
    });
    slowMode();
    checkCreds();
    update_name();
    // Login and Register Screens
    var main = document.getElementById("main");
    var loginBlock = document.getElementById("login");
    if (getUsername() != null) {
        main.style.display = "block";
        loginBlock.style.display = "none";
        db.ref("users/" + getUsername()).once('value').then(snapshot => {
            var obj = snapshot.val();
            const lastMessageTime = obj.sleep || 0;
            const timePassed = Date.now() - lastMessageTime;
            let params = new URLSearchParams(document.location.search);
            if (((!obj.muted && !(timePassed < messageSleep) && !obj.trapped) || obj.admin > 0) && !(JSON.parse(params.get("ignore")) || false)) {
                sendServerMessage(localStorage.getItem("display") + " has joined the chat<span style='visibility: hidden;'>@" + getUsername() + "</span>");
            }
        })
    } else {
        main.style.display = "none";
        loginBlock.style.display = "block";
        return;
    }

    checkAdmin();
    checkTrapped();
    checkActive();
    reloadTrapped();
    refreshChat();
    displayMembers()
    checkMute()
    setInterval(globalUpdate, 1000);
    
    var textarea = document.getElementById("textarea");
    setTimeout(() => {
        textarea.scrollTop = textarea.scrollHeight;
    }, 500);
}

function checkAdmin() {
    db.ref("users/" + getUsername()).once('value', function(user_object) {
        var obj = user_object.val();
        if (obj.admin > 0) {
            document.getElementById("adminControls").style.display = "block";
        } else {
            document.getElementById("admin-controls").style.display = "none";
        }
    })
}

function checkTrapped() {
    db.ref("users/" + getUsername()).on('value', function(user_object) {
        var obj = user_object.val();
        if (!obj.trapped) {
            document.getElementById("logoutButton").style.display = "block";
        } else {
            document.getElementById("logoutButton").style.display = "none";
            document.getElementById("messagebox").style.display = "none";
        }
    })
}

function reloadTrapped() {
    db.ref("users/" + getUsername() +"/reload").on("value", (snapshot) => {
        if (snapshot.val() === true) {
            location.reload();
            db.ref("users/" + getUsername() +"/reload").set(false);
        }
    });
    
}

function toggleMenu() {
    db.ref("users/" + getUsername()).once('value', function(user_object) {
        var obj = user_object.val();
        db.ref("other/").once('value', function(userObject) {
            if (obj.admin > userObject.val().medianAdmin) {
                document.getElementById("adminMenu").classList.toggle("show");
            } else {
                document.getElementById("userMenu").classList.toggle("show");
            }
        })
    })
}

function wipeChat() {
    var name = localStorage.getItem("display");
    db.ref("wipeMessage").on("value", function(message) {
        var wipeMessage = message.val();
        db.ref("chats/").remove();
        sendServerMessage("<span style='display: none'>@everyone</span>" + name + " wiped the chat<br/>" + wipeMessage);
    })
    
}

function announce() {
    announceToggle = !announceToggle;
    if (announceToggle) {
        document.getElementById("announce-toggle").innerHTML = ' ✓';
    } else {
        document.getElementById("announce-toggle").innerHTML = '';
    }
}

function brainRotToggle() {
    brainRot = !brainRot;
    var brainrot = document.getElementById("brainrot");
    if (brainRot) {
        brainrot.innerHTML = `<iframe
                                src="https://www.youtube.com/embed/zZ7AimPACzc?autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&playlist=zZ7AimPACzc"
                                frameborder="0"
                                allow="autoplay; encrypted-media"
                                allowfullscreen="false"
                                class="subway-surfers-clips">
                            </iframe>
                            <iframe
                                src="https://www.youtube.com/embed/mYKDaxLXVSg?autoplay=1&loop=1&controls=0&modestbranding=1&rel=0&disablekb=1&mute=1&playlist=mYKDaxLXVSg"
                                frameborder="0"
                                allow="autoplay; encrypted-media"
                                allowfullscreen="false"
                                class="family-guy-clips">
                            </iframe>
                            <div class="brainrot-frame"></div>`
        document.getElementById("brainrot-toggle").innerHTML = ' ✓';
        document.getElementById("cover").style.display = "block";
        document.getElementById("channels").style.visibility = "hidden";
        document.getElementById("permaAnnouncements").style.visibility = "hidden";
        // alert("BRAINROT")
    } else {
        brainrot.innerHTML = "";
        document.getElementById("brainrot-toggle").innerHTML = '';
        document.getElementById("cover").style.display = "none";
        document.getElementById("channels").style.visibility = "visible";
        document.getElementById("permaAnnouncements").style.visibility = "visible";
    }
}

function slowmodeToggle() {
    db.ref("other/").once("value", function(obj) {
        var obj = obj.val();
        var slowmode = obj.slowmode;
        slowmode = !slowmode;
        db.ref("other/").update({
            slowmode: slowmode
        });
        if (slowmode) {
            document.getElementById("slowmode-toggle").innerHTML = ' ✓';
            sendServerMessage("Slowmode has been enabled");
        } else {
            document.getElementById("slowmode-toggle").innerHTML = '';
            sendServerMessage("Slowmode has been disabled");
        }
    })
}

function slowMode() {
    db.ref("other/").on("value", function(obj) {
        var obj = obj.val();
        if (obj.slowmode) {
            messageSleep = parseInt(obj.slowmodetime) * 1000;
        } else {
            messageSleep = 0;
        }
    })
}

function checkCommands() {
    const commandsArray = commands.split("/");
    var newComms = "<ul>";
    commandsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ul>"
    showPopUp("Admin Commands", newComms);
}

function userCommands() {
    const commandsArray = usrCommands.split("/");
    var newComms = "<ul>";
    commandsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ul>"
    showPopUp("Commands", newComms);
}

function commandments() {
    const commandmentsArray = tenCommandments.split("/");
    var newComms = "<ol>";
    commandmentsArray.forEach(command => {
        newComms += "<li>";
        newComms += command;
        newComms += "</li>";
    })
    newComms += "</ol>"
    showPopUp("Admin Commands", newComms);
}

function updateMedianAdmin() {
    // Get the chats from firebase
    db.ref("users/").once("value", function(memberList) {
        var admins = [];
        var median = 0;
        if (memberList.numChildren() == 0) {
            median = 0;
        }
        var members = Object.values(memberList.val());
        members.forEach((member) => {
            admins.push(parseFloat(member.admin));
        })
        admins.sort((a, b) => a - b);
        // alert(admins);
        var size = admins.length;
        // alert(size);
        if (size % 2 == 1) {
            median = admins[Math.floor(size / 2)];
        } else {
            median = (admins[size / 2] + admins[size / 2 + 1]) / 2;
        }
        db.ref("other/").update({
            medianAdmin: median,
        })
    })
}

function voteButton(choice) {
    var count = parseInt(choice.textContent) || 0;
    count++;
    
    choice.innerHTML = count;
    db.ref("other/vote/").update({
        [choice.id]: count,
    })
    db.ref("other/vote/voters").update({
        [getUsername()]: true,
    })
}

function checkActive() {
    db.ref(".info/connected").on("value", (snapshot) => {
        if (snapshot.val()) {
            db.ref("users/" + getUsername()).update({
                active: true,
            })
            db.ref("users/" + getUsername()).onDisconnect().update({
                active: false,
            })
        }
    })
}

function resizeTextBox() {
    // const textarea = document.getElementById("box-message");
    // const textwrapper = document.getElementById("downbar");
    // textwrapper.style.height = "10%"; // Reset height
    // textwrapper.style.height = Math.min(textarea.scrollHeight, 2000) + "px";
    // textwrapper.style.transform = `translateY(${-(newHeight - 40)}px)`;
    // textarea.style.height = "auto"; // Reset height
    // textarea.style.height = Math.min(textarea.scrollHeight, 2000) + "px";
    // textarea.style.transform = `translateY(${-(newHeight - 40)}px)`;
}


window.onload = function() {
    try {
        setup();
    } catch(err) {
        alert(err);
    }
};

db.ref("other/").on('value', (obj) => {
    obj = obj.val();
    document.getElementById("medianAdmin").innerHTML = obj.medianAdmin;
})
