import axiosInstance from "../services/axiosInstance";
import { useEffect, useState } from "react";

const ChatPage = () => {
  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    const { data } = await axiosInstance.get("/api/chat");
    setChats(data);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div>
      {chats.map((chat) => (
        <div key={chat["_id"]}>{chat["chatName"]}</div>
      ))}
    </div>
  );
};

export default ChatPage;
