// Creamos una variable que nos guarda todo los cliente que se conextan
// al la sala.
var mapPeers = {};

var btnJoin = document.querySelector("#btnSalirLlamada");

// Obtenemos los datos que se guardaron en sesión
var username = sessionStorage.getItem("nombre");
var video = sessionStorage.getItem("video");
var audio = sessionStorage.getItem("audio");

// Declaramos una variable para utilizar WebSocket
var webSocket;

// Obtenemos los mensajes que nos envía el WebSocket y creamos toda la conexión
// para transmitir video mediante WebRTC
function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);

    var peerUsername = parsedData["peer"];
    var action = parsedData["action"];

    // Verificamos si el p2p ese el mismo
    if (username == peerUsername) {
        return;
    }

    // Añadimos el nuevo p2p
    var receiver_channel_name = parsedData["message"]["receiver_channel_name"];
    if (action == "new-peer") {
        //
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

// Salir de la reunión
btnJoin.addEventListener("click", () => {
    location.href = "/";
});

//
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
        window.stream = stream;
        localStream = stream;
        localvideo.srcObject = localStream;
        localvideo.muted = true;

        var audioTraks = stream.getAudioTracks();
        var videoTraks = stream.getVideoTracks();

        console.log(audio + " " + video);

        audioTraks[0].enabled = audio == "true";
        videoTraks[0].enabled = video == "true";
        if (!audioTraks[0].enabled) {
            document.getElementById("microphone").className =
                "fas fa-microphone-slash";
        } else {
            document.getElementById("microphone").className =
                "fas fa-microphone";
        }
        if (!videoTraks[0].enabled) {
            document.getElementById("video").className = "fas fa-video-slash";
        } else {
            document.getElementById("video").className = "fas fa-video";
        }

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

// Crear nueva p2p y establecer conexión.
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
            console.log("Entro un nuevo candidato");
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
}

// Crear más usuario p2p
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
    });

    peer.addEventListener("iceconnectionstatechange", () => {
        var iceconnectionstate = peer.iceConnectionState;
        if (
            iceconnectionstate === "failed" ||
            iceconnectionstate === "disconnected" ||
            iceconnectionstate === "closed"
        ) {
            if (iceconnectionstate != "closed") {
                peer.close();
            }
            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
            console.log("Entro un nuevo candidato");
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

// Crear div para mostrar el video del usuario p2p
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

// Establecer conexón cuando carga la página
window.addEventListener("load", () => {
    const session = sessionStorage.length;
    if (session <= 1) {
        location.href = "/";
    }
    document.getElementById("nombreUsuario").innerHTML = username;
    setTimeout(function () {
        var loc = window.location;
        var wsStart = "ws://";
        // if (loc.protocol == "https:") {
        //     wsStart = "wss://";
        // }
        var endPoint = wsStart + loc.host + loc.pathname;
        console.log("endPoint: ", endPoint);
        webSocket = new WebSocket(endPoint);
        webSocket.addEventListener("open", (e) => {
            console.log("conexion abierta");
            sendSignal("new-peer", {});
        });
        webSocket.addEventListener("message", webSocketOnMessage);
        webSocket.addEventListener("close", (e) => {
            console.log("conexion cerrada");
        });
        webSocket.addEventListener("error", (e) => {
            console.log("conexion error");
        });
    }, 2000);
});

// Eliminar todas las sesiones del navegardor
window.addEventListener("beforeunload", () => {
    sessionStorage.clear();
});
