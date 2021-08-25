var UsernameInput = document.querySelector("#nombreUsuario");
var btnJoin = document.querySelector("#btnEntrarStreaming");
var btnCamara = document.querySelector("#btnCamara");
var btnMicrofono = document.querySelector("#btnMicrofono");

var username;
var video = true;
var audio = true;

const sesiones = sessionStorage;

btnJoin.addEventListener("click", () => {
    username = UsernameInput.value;
    if (username != "") {
        sesiones.clear();
        sesiones.setItem("nombre", username);
        sesiones.setItem("audio", audio);
        sesiones.setItem("video", video);
        UsernameInput.value = "";
        UsernameInput.disabled = true;
        UsernameInput.getElementsByClassName.visibility = "hidden";

        btnJoin.disabled = true;
        btnJoin.getElementsByClassName.visibility = "hidden";
        location.href = "sala";
    } else {
        alert("Debe colocar un nombre para entrar a la reunión grupal");
    }
});

var localStream = new MediaStream();
("use strict");
const constraints = {
    video: true,
    audio: true,
};

const localvideo = document.querySelector("#local-video");

var userMedia = navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
        window.stream = stream;
        localStream = stream;
        localvideo.srcObject = localStream;
        localvideo.muted = true;
        var audioTraks = stream.getAudioTracks();
        var videoTraks = stream.getVideoTracks();

        audioTraks[0].enabled = true;
        videoTraks[0].enabled = true;

        btnMicrofono.addEventListener("click", () => {
            audioTraks[0].enabled = !audioTraks[0].enabled;
            audio = audioTraks[0].enabled;
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
            video = videoTraks[0].enabled;
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
