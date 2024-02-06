import { apiConnector } from "../services/axiosInstance";
import { useEffect, useState } from "react";

const ChatPage = () => {
  // When chat is created the write the correct type for them as well
  const [chats, setChats] = useState<any>([]);

  const fetchChats = async () => {
    const { data } = await apiConnector("GET", "/api/chat");
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
