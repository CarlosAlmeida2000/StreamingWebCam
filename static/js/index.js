console.log(' main.js');

var UsernameInput=document.querySelector('#nombreUsuario');
var btnJoin=document.querySelector('#btnEntrarStreaming');

var username;

var webSocket;

function webSocketOnMessage(event){
    var parsedData= JSON.parse(event.data);
    var message= parsedData['message'];
    console.log('mensaje :', message)
}

btnJoin.addEventListener('click',()=>{
    username=UsernameInput.value;

    console.log('username: ',username);

    if(username == ''){
        return;
    }
    
    UsernameInput.value='';
    UsernameInput.disabled=true;
    UsernameInput.getElementsByClassName.visibility='hidden';

    btnJoin.disabled=true;
    btnJoin.getElementsByClassName.visibility='hidden';

    var loc=window.location;
    var wsStart='ws://';

    if(loc.protocol == 'https:'){
        wsStart='wss://';
    }
    var endPoint=wsStart+loc.host+loc.pathname;
    console.log('endPoint: ',endPoint);
    
    webSocket =new WebSocket(endPoint);

    webSocket.addEventListener('open',(e)=>{
        console.log('conexion abierta')
    });

    webSocket.addEventListener('message',webSocketOnMessage);

    webSocket.addEventListener('close',(e)=>{
        console.log('conexion cerrada')
    });

    webSocket.addEventListener('error',(e)=>{
        console.log('conexion error')
    });

});