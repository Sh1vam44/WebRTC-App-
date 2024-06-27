import React,{useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/socketProvider";
import ReactPlayer from "react-player";
import peer from "../services/peer";

const Roompage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState();


    const handleUserJoined = useCallback(({email,id}) => {
        console.log(`Email ${email}`);
        setRemoteSocketId(id);
    },[]);
    
    const handleCallUser = useCallback(async () =>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", {to: remoteSocketId, offer});
        setMyStream(stream);
    },[remoteSocketId,socket]);

    const handleIncomingcall = useCallback(async (from, offer) => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        setRemoteSocketId(from);
        console.log('Incoming Call',from, offer);
        const ans = await peer.getAnswer(offer)
        socket.emit('call:accepted', {to:from, ans});
        setMyStream(stream);
    },[socket]);
    
    const sendStreams = useCallback( () =>{
        for (const track of myStream.getTracks()){
            peer.peer.addTrack(track, myStream)
        }
        
    },[myStream]);

    const handleCallAccepted = useCallback(({from, ans}) => {
        peer.setLocalDescription(ans);
        console.log("call Accepted");
        sendStreams();
    },[sendStreams]);

    const handleNegoNeeded = useCallback( async () =>{
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', {offer, to:remoteSocketId})          
    },[remoteSocketId, socket])
  
    useEffect(()=>{
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
        return () =>{
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
        }

    },[handleNegoNeeded]);

    const handleNegoNeededIncoming = useCallback(async ({from,offer}) => {
        const ans = await peer.getAnswer(offer);
        socket.emit('peer:nego:done',{to: from, ans});

    },[socket]);
    
    const handleNegoNeedFinal = useCallback(async ({ans}) => {
        await peer.setLocalDescription(ans)
    },[])
    


    useEffect(() =>{
        peer.peer.addEventListener('track',async ev =>{
            const remoteStream = ev.streams;
            console.log("GOT TRACKS")
            setRemoteStream(remoteStream[0]);
        })
    },[])

    useEffect(() =>{
        socket.on('user:joined',handleUserJoined);
        socket.on("incoming:call", handleIncomingcall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on('peer:nego:needed', handleNegoNeededIncoming);
        socket.on('peer:nego:final', handleNegoNeedFinal);

        return () => {  
            socket.off('user:joined',handleUserJoined);
            socket.off("incoming:call", handleIncomingcall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off('peer:nego:needed', handleNegoNeededIncoming);
            socket.off('peer:nego:final', handleNegoNeedFinal);
        };
    },['user:joined',handleUserJoined,handleIncomingcall,handleCallAccepted,handleNegoNeededIncoming,handleNegoNeedFinal]);

    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? "Connected": "NO one in room"}</h4>
            { myStream && <button onClick={sendStreams}> Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            {
                myStream && (
                    <>
                    <h1>My Stream</h1>
                    <ReactPlayer playing muted height='300px' width='300px' url={myStream}></ReactPlayer>
                    </>
                 )
            }
            {
                remoteStream && (
                    <>
                    <h1>Remote Stream</h1>
                    <ReactPlayer playing muted height='300px' width='300px' url={remoteStream}></ReactPlayer>
                    </>
                 )
            }
        </div>
    )
}

export default Roompage;