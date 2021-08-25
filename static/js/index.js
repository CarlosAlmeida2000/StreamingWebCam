var UsernameInput = document.querySelector("#nombreUsuario");
var btnJoin = document.querySelector("#btnEntrarStreaming");
var btnCamara = document.querySelector("#btnCamara");
var btnMicrofono = document.querySelector("#btnMicrofono");

var username;

var webSocket;

function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);
    var message = parsedData["message"];
    console.log("mensaje :", message);
}

btnJoin.addEventListener("click", () => {
    username = UsernameInput.value;

    console.log("username: ", username);

    if (username == "") {
        return;
    }

    UsernameInput.value = "";
    UsernameInput.disabled = true;
    UsernameInput.getElementsByClassName.visibility = "hidden";

    btnJoin.disabled = true;
    btnJoin.getElementsByClassName.visibility = "hidden";

    /*var loc=window.location;
    var wsStart='ws://';

    if(loc.protocol == 'https:'){
        wsStart='wss://';
    }
    var endPoint=wsStart+loc.host+loc.pathname;
    console.log('endPoint: ',endPoint);
    
    webSocket =new WebSocket(endPoint);

    webSocket.addEventListener('open',(e)=>{
        console.log('conexion abierta');
        var jsonStr = JSON.stringify({
            'message':'Este es un mensaje',
        });

        webSocket.send(jsonStr);
    });

    webSocket.addEventListener('message',webSocketOnMessage);

    webSocket.addEventListener('close',(e)=>{
        console.log('conexion cerrada')
    });

    webSocket.addEventListener('error',(e)=>{
        console.log('conexion error')
    });*/
});

var localStream = new MediaStream();

const constraints = {
    video: true,
    audio: true,
};

const localvideo = document.querySelector("#local-video");

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
