console.log(" main.js");

var mapPeers = {};

var UsernameInput = document.querySelector("#nombreUs");
var btnJoin = document.querySelector("#btnSalirLlamada");

var username = "Henry";
var video = sessionStorage.getItem("video");
var audio = sessionStorage.getItem("audio");

var webSocket;

function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);

    var peerUsername = parsedData["peer"];
    var action = parsedData["action"];

    if (username == peerUsername) {
        return;
    }

    var receiver_channel_name = parsedData["message"]["receiver_channel_name"];
    if (action == "new-peer") {
        createOfferer(peerUsername, receiver_channel_name);
        return;
    }

    if (action == "new-offer") {
        var offer = parsedData["message"]["sdp"];
        createAnswerer(offer, peerUsername, receiver_channel_name);
        return;
    }

    if (action == "new-answer") {
        var answer = parsedData["message"]["sdp"];
        var peer = mapPeers[peerUsername][0];
        peer.setRemoteDescription(answer);
        return;
    }
}

btnJoin.addEventListener("click", () => {
    console.log("username: ", username);

    if (username == "") {
        return;
    }

    UsernameInput.value = "";
    UsernameInput.disabled = true;
    UsernameInput.style.visibility = "hidden";

    btnJoin.disabled = true;
    btnJoin.style.visibility = "hidden";

    var loc = window.location;
    var wsStart = "ws://";

    if (loc.protocol == "https:") {
        wsStart = "wss://";
    }
    var endPoint = wsStart + loc.host + loc.pathname;
    console.log("endPoint: ", endPoint);

    webSocket = new WebSocket(endPoint);

    webSocket.onopen = function () {
        console.log("conexion abierta");
        sendSignal("new-peer", {});
    };

    webSocket.onmessage = function (mensaje) {
        console.log(webSocketOnMessage);
    };

    webSocket.onclose = function () {
        console.log("conexion cerrada");
    };

    webSocket.addEventListener("error", (e) => {
        console.log("conexion error");
    });
});

var localStream = new MediaStream();

const constraints = {
    video: true,
    audio: true,
};

const localvideo = document.querySelector("#local-video");

const btnMicrofono = document.querySelector("#btnMicrofono");
const btnCamara = document.querySelector("#btnCamara");

var userMedia = navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
        localStream = stream;
        localvideo.srcObject = localStream;
        localvideo.muted = true;

        var audioTraks = stream.getAudioTracks();
        var videoTraks = stream.getVideoTracks();

        audioTraks[0].enabled = true;
        videoTraks[0].enabled = true;

        btnMicrofono.addEventListener("click", () => {
            audioTraks[0].enabled = !audioTraks[0].enabled;
            if (!audioTraks[0].enabled) {
                document.getElementById("microphone").className =
                    "fas fa-microphone-slash";
            } else {
                document.getElementById("microphone").className =
                    "fas fa-microphone";
            }
        });
        btnCamara.addEventListener("click", () => {
            videoTraks[0].enabled = !videoTraks[0].enabled;
            if (!videoTraks[0].enabled) {
                document.getElementById("video").className =
                    "fas fa-video-slash";
            } else {
                document.getElementById("video").className = "fas fa-video";
            }
        });
    })
    .catch((error) => {
        console.log("Error accessing media devices", error);
    });

function sendSignal(action, message) {
    var jsonStr = JSON.stringify({
        peer: username,
        action: action,
        message: message,
    });

    webSocket.send(jsonStr);
}

function createOfferer(peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    var dc = peer.createDataChannel("channel");
    dc.addEventListener("open", () => {
        console.log("connection abierta");
    });

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener("iceconnectionstatechange", () => {
        var iceconnectionstate = peer.iceConnectionState;
        if (
            iceconnectionstate === "failed" ||
            iceconnectionstate === "disconnected" ||
            iceconnectionstate === "closed"
        ) {
            delete mapPeers[peerUsername];

            if (iceconnectionstate != "closed") {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            console.log(
                "new ice candidate: ",
                JSON.stringify(peer.localDescription)
            );
            return;
        }
        sendSignal("new-offer", {
            sdp: peer.localDescription,
            receiver_channel_name: receiver_channel_name,
        });
    });

    peer.createOffer()
        .then((o) => peer.setLocalDescription(o))
        .then(() => {
            console.log("Local description set succesfully");
        });
    //1:14:41
}
function createAnswerer(offer, peerUserName, receiver_channel_name) {
    var peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    var remoteVideo = createVideo(peerUserName);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener("datachannel", (e) => {
        peer.dc = e.channel;
        peer.dc.addEventListener("open", () => {
            console.log("connection opened");
        });
        peer.dc.addEventListener("message", dcOnMessage);
        mapPeers[peerUsername] = [peer, peer.dc];
    });

    peer.addEventListener("iceconnectionstatechange", () => {
        var iceconnectionstate = peer.iceConnectionState;
        if (
            iceconnectionstate === "failed" ||
            iceconnectionstate === "disconnected" ||
            iceconnectionstate === "closed"
        ) {
            delete mapPeers[peerUsername];

            if (iceconnectionstate != "closed") {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            console.log(
                "new ice candidate: ",
                JSON.stringify(peer.localDescription)
            );
            return;
        }
        sendSignal("new-answer", {
            sdp: peer.localDescription,
            receiver_channel_name: receiver_channel_name,
        });
    });
    peer.setRemoteDescription(offer)
        .then(() => {
            console.log(
                "Remorte description set succesfully for %s",
                peerUserName
            );
            return peer.createAnswer();
        })
        .then((a) => {
            console.log("Answer created!");
            peer.setLocalDescription(a);
        });
}
function addLocalTracks(peer) {
    localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
    });
    return;
}

function createVideo(peerUsername) {
    var videoContainer = document.querySelector("#external-videos");

    var p_relative = document.createElement("div");
    var remoteVideo = document.createElement("video");
    var usuarios_externos = document.createElement("div");

    p_relative.className = "p-relative";

    remoteVideo.id = peerUsername + "-video";
    remoteVideo.className = "external-v";
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    usuarios_externos.className = "usuario-externo";
    usuarios_externos.innerText = peerUsername;

    p_relative.appendChild(remoteVideo);
    p_relative.appendChild(usuarios_externos);
    videoContainer.appendChild(p_relative);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    var remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    peer.addEventListener("track", async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    });
}

function removeVideo(video) {
    var videoWrapper = video.parentNode;

    videoWrapper.parentNode.removeChild(videoWrapper);
}
