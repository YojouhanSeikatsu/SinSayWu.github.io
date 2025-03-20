const firebaseConfig = {
    apiKey: "AIzaSyDOAj76E00Rg8Qyc5DQndWXHtCy2umC6vA",
    authDomain: "chatter-97e8c.firebaseapp.com",
    projectId: "chatter-97e8c",
    storageBucket: "chatter-97e8c.appspot.com",
    messagingSenderId: "281722915171",
    appId: "1:281722915171:web:3b136d8a0b79389f2f6b56",
    measurementId: "G-4CGJ1JFX58",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function getUsername() {
    return localStorage.getItem("username");
}

function getPassword() {
    return localStorage.getItem("password");
}

function getDisplayName() {
    return localStorage.getItem("name");
}

function checkInput(input) {
    if (input == "") {
        alert("Cannot be blank");
        return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(input)) {
        alert("Invalid Characters. Only alphanumeric characters allowed.")
        return false;
    }
    if (input.includes("everyone")) {
        alert("No mention of everyone allowed.");
        return false;
    }
    if (input.includes("admin")) {
        alert("No impersonating admins");
        return false;
    }
    return true;
}

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}

/**
 * Shows a popup window.
 * @param {string} heading - The header element.
 * @param {string} content - The body element.
 * @param {[string, function][]} [buttonList = []] - All the buttons in the bar [label, function]
 * @param {float} [height=800] - The height of the popup
 * @param {float} [width=800] - The width of the popup
 * @returns {null} wow this param feature is kinda cool
 */
function showPopUp(heading, content, buttonList = [], height=800, width=800) {
    parent = document.body;
    
    // Create the overlay
    var overlay = document.createElement("div");
    overlay.setAttribute("class", "overlay");
    overlay.setAttribute("id", "popup");

    // Create the popup
    var popUp = document.createElement("div");
    popUp.setAttribute("class", "popUp");
    popUp.style.height = height + "px";
    popUp.style.width = width + "px";

    // Create the header and body
    var header = document.createElement("h1");
    header.setAttribute("class", "popup-heading");
    var body = document.createElement("div");
    body.setAttribute("class", "popup-body");

    // Create the buttons
    var buttons = document.createElement("div");
    buttons.setAttribute("class", "popup-buttons");
    buttonList.forEach(([label, action]) => {
        var newButton = document.createElement("button");
        newButton.setAttribute("class", "popup-button");
        newButton.onclick = action;
        newButton.innerHTML = label;
        buttons.appendChild(newButton);
    })
    var closeButton = document.createElement("button");
    closeButton.setAttribute("class", "popup-button");
    closeButton.onclick = () => {
        var popup = document.getElementById("popup");
        popup.remove();
    }
    closeButton.innerHTML = "Close";
    buttons.appendChild(closeButton);

    // Append header and body to popup
    var hr = document.createElement("hr");
    hr.setAttribute("class", "heading-hr");
    header.appendChild(hr);
    popUp.appendChild(header);
    popUp.appendChild(body);
    popUp.appendChild(buttons);
    
    // Append popup to overlay
    overlay.appendChild(popUp);
    
    // Append overlay to the parent element
    parent.appendChild(overlay);

    // Set the content of header and body
    header.innerHTML = heading;
    body.innerHTML = content;
}