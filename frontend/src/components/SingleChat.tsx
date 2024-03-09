import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ChatState, ChatType, UserType } from "../Context/ChatProvider";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { useCallback, useEffect, useState } from "react";
import { apiConnector } from "../services/axiosInstance";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import { Socket, io } from "socket.io-client";
import Lottie from "lottie-react";
import animationData from "../animations/typing.json";

interface SingleChatProps {
  fetchAgain: boolean;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface MessageType {
  sender: UserType;
  content: string;
  chat: ChatType;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// URL of our backend(where websocket logic resides) for websocket connection
const ENDPOINT = "http://localhost:5000";
let socket: Socket;
let selectedChatCompare: ChatType | null;

const SingleChat = ({ fetchAgain, setFetchAgain }: SingleChatProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const toast = useToast();

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();

  // Initially when a chat is opened then we connect to our websocket
  useEffect(() => {
    // Establishes websocket connection with the client
    socket = io(ENDPOINT);
    // We emit to the "setup" listener which creates a room for THIS CLIENT
    socket.emit("setup", user);
    // Basically, when a room for THIS CLIENT is created then the backend emits a message "connected" which the client listens to in order to confirm the establishment of a successful connection
    socket.on("connected", () => setSocketConnected(true));
    // We toggle the isTyping flag depending on whether we get "typing" or "stop typing" from the server socket
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      setLoading(true);

      const { data } = await apiConnector(
        "GET",
        `/api/message/${selectedChat._id}`,
        undefined,
        headers
      );

      const results = data as MessageType[];
      setMessages(results);
      setLoading(false);

      // Since, we have fetched all the messages for this chat/conversation
      // We will now do emit/tell the "join room" event to create a 1-1 conversation room for THIS CLIENT and other users that are part of that chat
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  }, [selectedChat, toast, user?.token]); // These dependencies were added to get out of warning

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat; // Keep a track of the selected chat to identify whether to send the emit the message or give a notification instead
  }, [fetchMessages, selectedChat]);

  // Every time the component is changed we fire up this useEffect
  useEffect(() => {
    socket.on("message received", (newMessageReceived: MessageType) => {
      // If no chat is opened OR the opened chat is NOT the chat for which this new message is intended then we simply give notification for that chat
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        // give notification
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain); // Fetch all of the chats again
        }
      } else {
        // The new message is intended for out chat so we append it in out array
        setMessages([...messages, newMessageReceived]);
      }
    });
  });

  const sendMessage = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newMessage) {
      // NOTE: This is REALLY IMPORTANT to emit stop typing inside the if condition as we only stop typing when ENTER is pressed and the messages is sent
      socket.emit("stop typing", selectedChat?._id); // once we send the message/hit enter we stop the typing indicator
      try {
        const headers = {
          Authorization: `Bearer ${user?.token}`,
        };

        setNewMessage("");

        const { data } = await apiConnector(
          "POST",
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat?._id,
          },
          headers
        );

        const results: MessageType = data as MessageType;

        // Emit the websocket and let it know that a new message has been sent so that it can send it to others as well
        socket.emit("new message", results);
        setMessages([...messages, results]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  // TASK: Need to keep a track of who is typing so that in a group chat we can understand who is typing
  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setNewMessage(newMessage);

    // Typing Indicator logic
    if (!socketConnected) return;

    if (!typing) {
      // If we weren't typing before then we set the the typing flag and emit to websocket that we are typing
      // We emit the websocket well indicating that we are typing
      setTyping(true);
      socket.emit("typing", selectedChat?._id);
    }

    //////// SOME ISSUE WITH THIS FUNCTIONALITY: What if we keep on typing after 3 seconds also.
    /// NEED TO CHECK OUT WHETHER TO DEBOUNCE OR THROTTLE
    // Throttle like function which after 3 seconds checks if we have stopped typing then it indicates that to the websocket
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000; // after 3 seconds we stop the typing
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;

      // If 3 seconds have passed and the typing flag is still true
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat?._id);
        setTyping(false);
      }
    }, timerLength);
  };

  //   If any chat is selected then select that chat. Otherwise, show empty screen
  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "1.75rem", md: "30px" }}
            pb={3}
            px={2}
            w={"100%"}
            fontFamily={"Work sans"}
            display={"flex"}
            justifyContent={{ base: "space-between" }}
            alignItems={"center"}
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat(null)}
              aria-label="Close Chat button"
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>

          {/* Messages Here */}
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            {/* Input tag to enter, send chat */}
            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping ? (
                <div
                  style={{
                    marginBottom: 15,
                    width: "max-content",
                  }}
                >
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    width={70}
                  />
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg={"#E0E0E0"}
                placeholder="Enter a message..."
                onChange={typingHandler}
                value={newMessage}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          h={"100%"}
        >
          <Text fontSize={"3xl"} pb={3} fontFamily={"Work sans"}>
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
