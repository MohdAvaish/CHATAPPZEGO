import React, { useState, useEffect, useRef } from "react";
import { ZIM } from 'zego-zim-web';
import bg from "./assets/bg.jpg";

function App() {
  const [zimInstance, setZimInstance] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState("Avaish");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ❗ Yahan apna App ID daalein
  const appID = 673527856; 
  
  // ❗ Zego Cloud se generate karke yahan apna naya TOKEN A (Avaish ke liye) paste karein
  const tokenA = "04AAAAAGiofpQADBIBOUnvyiedGYJOuwCvkP9TLdSpnNWFYyKLUbSf5kOZiSWbg8R7QB29cwYgc4hiiL57fvujFVHE5IWyOogVUFCgN39YvdQqfM9SAJc/Fph0ybbxaCkAuAkxE2QK1SmV+8O6+ufZtxkz/5lAPVbwuIU+4/dR4U7H33vdr6u/znSG7Z0Xae2ccwL15DTEqSeJuX29UwQOaoGxci1UaQTp08Km6d2XMfnrhXI4O7YeWDymIDgECLFM164cPTqgUQE=";

  // ❗ Zego Cloud se generate karke yahan apna naya TOKEN B (Adil ke liye) paste karein
  const tokenB = "04AAAAAGiofuIADDzPcLWs7UdZFydevgCuakKAxpctFvw2XSH/IOlHGOj8MRZ5uj+AR+tp2cmjQ2m1LKULmQ6ea00uGisaWE2QaL7A/zOUCs/vWQktTAyhyHr/g0gd0oevDTtoi2c+19i3KT3/WZldNpwlHcs3DjLHOgRWQdMhSWPlqY6aMguSYGIXqcKjTurJtPG9EyQjOrZ+1lJSRkfgBmP9qYfmP++fkYD+D9SmKO+u5a9FpPdmDSaGYv7PtQ6PuOKPLkawAQ==";

  const messageEndRef = useRef(null);

  useEffect(() => {
    const instance = ZIM.create(appID);
    setZimInstance(instance);

    instance.on("error", (zim, errorInfo) => {
      console.log("error", errorInfo.code, errorInfo.message);
    });

    instance.on("connectionStateChanged", (zim, { state, event }) => {
      console.log("connectionStateChanged", state, event);
    });

    instance.on("peerMessageReceived", function (zim, { messageList }) {
      setMessages(prev => [...prev, ...messageList]);
    });

    instance.on("tokenWillExpire", function (zim, { second }) {
      console.log("tokenWillExpire", second);
      zim.renewToken(selectedUser === "Avaish" ? tokenA : tokenB)
        .then(() => console.log("token-renewed"))
        .catch((err) => console.log(err));
    });

    return () => {
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleLogin = () => {
    const info = { userID: selectedUser, userName: selectedUser };
    setUserInfo(info);
    const loginToken = selectedUser === "Avaish" ? tokenA : tokenB;
    
    if (zimInstance) {
      zimInstance.login(info, loginToken)
        .then(() => {
          console.log("✅ Logged in successfully!");
          setIsLoggedIn(true);
        })
        .catch((err) => {
          console.error("❌ Login failed!");
          // Yeh aapko Zego se exact error batayega
          console.error("ZIM Login Error Details:", err); 
        });
    } else {
      console.log("Instance error");
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return; // Khali message na bhejein

    const toConversationID = selectedUser === "Avaish" ? "Adil" : "Avaish";
    const conversationType = 0; // Peer-to-peer chat
    const config = { priority: 1 };
    
    const messageObj = { type: 1, message: messageText };

    // Optimistic UI: Message ko turant screen par dikhayein
    const localMessage = {
      ...messageObj,
      senderUserID: userInfo.userID,
      timeStamp: Date.now(),
      // Ek temporary ID de dein, taaki key unique rahe
      localMessageID: Date.now().toString() 
    };
    setMessages(prev => [...prev, localMessage]);
    setMessageText("");

    zimInstance.sendMessage(messageObj, toConversationID, conversationType, config)
      .then(({ message }) => {
        // Server se aaye message se local message ko replace karein (optional but good practice)
        setMessages(prev => prev.map(msg => 
          msg.localMessageID === localMessage.localMessageID ? message : msg
        ));
        console.log("Message sent successfully", message);
      })
      .catch((err) => {
        console.error("Failed to send message", err);
      });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-screen flex flex-col items-center p-5"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
      
      <h1 className="text-white font-bold text-3xl mb-5">Real Time Chat App</h1>

      {!isLoggedIn ? (
        <div className="w-full max-w-md h-[400px] p-5 backdrop-blur shadow-2xl bg-[#00000030] rounded-xl flex flex-col items-center justify-center gap-8 border-2 border-gray-700">
          <h1 className='text-3xl font-semibold text-white'>Select User</h1>
          <select
            className='w-3/4 text-center rounded-xl p-2 bg-[#1f2525] text-white'
            onChange={(e) => setSelectedUser(e.target.value)}
            value={selectedUser}>
            <option value="Avaish">Avaish Rayeen</option>
            <option value="Adil">Adil Rayeen</option>
          </select>
          <button
            className='p-3 bg-white font-semibold cursor-pointer text-black rounded-lg w-1/2'
            onClick={handleLogin}>
            Login
          </button>
        </div>
      ) : (
        <div className='w-full max-w-3xl h-full flex flex-col backdrop-blur shadow-2xl bg-[#00000030] rounded-xl border-2 border-gray-700 overflow-hidden'>
          
          <div className="p-4 border-b border-gray-700">
            <h2 className='text-white text-xl text-center'>
              {userInfo.userName}{" "}
              <span className='text-gray-400'>chatting with </span>
              {selectedUser === "Avaish" ? "Adil" : "Avaish"}
            </h2>
          </div>
          
          <div className='flex-grow p-5 flex flex-col gap-3 overflow-y-auto'>
            {messages.map((msg, i) => {
              const isOwnMessage = msg.senderUserID === userInfo.userID;
              return (
                <div key={msg.localMessageID || msg.messageID || i} className={`w-full flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2 shadow-lg text-white ${isOwnMessage
                      ? "bg-[#0f1010] rounded-t-2xl rounded-bl-2xl"
                      : "bg-[#1c2124] rounded-t-2xl rounded-br-2xl"}`}>
                    <div>{msg.message}</div>
                    <div className='text-xs text-gray-400 text-right mt-1'>
                      {formatTime(msg.timestamp || msg.timeStamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>

          <div className='p-4 flex items-center gap-4 border-t border-gray-700'>
            <input
              type="text"
              placeholder='Type a message...'
              className='flex-grow rounded-2xl bg-gray-700 outline-none text-white px-4 py-2 placeholder-gray-400'
              onChange={(e) => setMessageText(e.target.value)}
              value={messageText}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              className='p-2 bg-white text-black rounded-full w-24 font-semibold'
              onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;