import { useCallback, useEffect, useState } from "react";
import { ChatState, ChatType, UserType } from "../Context/ChatProvider";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/react";
import { apiConnector } from "../services/axiosInstance";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "./ChatLoading";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./miscellaneous/GroupChatModal";

interface MyChatsProps {
  fetchAgain: boolean;
}

const MyChats = ({ fetchAgain }: MyChatsProps) => {
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

  const [loggedUser, setLoggedUser] = useState<UserType>({} as UserType);

  const toast = useToast();

  const fetchChats = useCallback(async () => {
    try {
      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "GET",
        "/api/chat",
        undefined,
        headers
      );

      const results: ChatType[] = data as ChatType[];
      console.log("chats: ", results);

      setChats(results);
    } catch (err) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  }, [user?.token, setChats, toast]);

  useEffect(() => {
    const cache = localStorage.getItem("userInfo");
    if (cache) {
      setLoggedUser(JSON.parse(cache));
    } else {
      setLoggedUser({} as UserType);
    }
    fetchChats();
  }, [fetchAgain, fetchChats]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir={"column"}
      alignItems={"center"}
      p={3}
      bg={"white"}
      w={{ base: "100%", md: "31%" }}
      borderRadius={"lg"}
      borderWidth={"1px"}
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily={"Work sans"}
        display={"flex"}
        w={"100%"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        My Chats
        <GroupChatModal>
          <Button
            display={"flex"}
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display={"flex"}
        flexDir={"column"}
        p={3}
        bg="#F8F8F8"
        w={"100%"}
        h={"100%"}
        borderRadius={"lg"}
        overflowY={"hidden"}
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat: ChatType) => (
              <Box
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                cursor={"pointer"}
                bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                color={selectedChat === chat ? "white" : "black"}
                px={3}
                py={2}
                borderRadius={"lg"}
              >
                <Text>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
