import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

export type UserType = {
  email: string;
  name: string;
  pic: string;
  token: string;
  _id: string;
};

export type ChatType = {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: UserType[];
  latestMessage: unknown;
  groupAdmin: UserType;
};

interface ChatContextType {
  user: UserType | null;
  setUser: Dispatch<SetStateAction<UserType | null>>;
  selectedChat: ChatType | null;
  setSelectedChat: Dispatch<SetStateAction<ChatType | null>>;
  chats: ChatType[] | null;
  setChats: Dispatch<SetStateAction<ChatType[]>>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [chats, setChats] = useState<ChatType[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const cache = localStorage.getItem("userInfo");
    const userInfo = cache ? JSON.parse(cache) : null;
    setUser(userInfo);

    // If user info not present the will redirect to HomePage route
    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <ChatContext.Provider
      value={{ user, setUser, selectedChat, setSelectedChat, chats, setChats }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
