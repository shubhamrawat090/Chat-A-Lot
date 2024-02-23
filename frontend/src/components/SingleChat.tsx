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

const SingleChat = ({ fetchAgain, setFetchAgain }: SingleChatProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const toast = useToast();

  const { user, selectedChat, setSelectedChat } = ChatState();

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
      console.log("messagesssss: ", results);
      setMessages(results);
      setLoading(false);
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
  }, [fetchMessages, selectedChat]);

  const sendMessage = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newMessage) {
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
        console.log("message: ", results);

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

  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setNewMessage(newMessage);
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
