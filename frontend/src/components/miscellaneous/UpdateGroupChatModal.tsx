import { ViewIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChatState, ChatType, UserType } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import { apiConnector } from "../../services/axiosInstance";
import { AxiosError } from "axios";
import UserListItem from "../UserAvatar/UserListItem";

interface UpdateGroupChatModalProps {
  fetchAgain: boolean;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
}

const UpdateGroupChatModal = ({
  fetchAgain,
  setFetchAgain,
}: UpdateGroupChatModalProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const { selectedChat, setSelectedChat, user } = ChatState();

  const toast = useToast();

  const handleRemove = async (userToRemove: UserType | null) => {
    // is user is not present then do not proceed
    if (!userToRemove || !selectedChat || !user) return;

    // if logged in user is NOT AN ADMIN && they are trying to remove someone other than themselves
    if (
      selectedChat.groupAdmin._id !== user._id &&
      userToRemove._id !== user._id
    ) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "PUT",
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: userToRemove._id,
        },
        headers
      );

      const result = data as ChatType;

      // If the user has themselves remove the chat then we don't want them to see the chats anymore
      userToRemove._id === user._id
        ? setSelectedChat(null)
        : setSelectedChat(result);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      if (error.response?.data && Object.keys(error.response.data).length > 0) {
        toast({
          title: "Error Occurred!",
          description: (error.response.data as { message: string }).message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error Occurred!",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
      }
    }
  };

  const handleAddUser = async (userToAdd: UserType | null) => {
    // is user is not present then do not proceed
    if (!userToAdd || !selectedChat || !user) return;

    // Check if selected user is already in the chat's added users
    if (selectedChat?.users.find((u) => u._id === userToAdd._id)) {
      toast({
        title: "User Already in group!",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    // If LOGGED IN USER is not an Admin
    if (selectedChat?.groupAdmin._id !== user?._id) {
      toast({
        title: "Only admins can add someone!",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "PUT",
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: userToAdd._id,
        },
        headers
      );

      const result = data as ChatType;
      setSelectedChat(result);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      if (error.response?.data && Object.keys(error.response.data).length > 0) {
        toast({
          title: "Error Occurred!",
          description: (error.response.data as { message: string }).message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error Occurred!",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
      setLoading(false);
    }
  };

  // SHOULD PROBABLY DEBOUNCE/THROTTLE THIS SEARCH API CALL ON EACH KEYSTROKE
  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query || !query.trim()) {
      return;
    }

    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "GET",
        `/api/user?search=${search}`,
        undefined,
        headers
      );
      const results: UserType[] = data as UserType[];

      console.log(results);
      setLoading(false);
      setSearchResult(results);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load the search results",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  /*
    NOTE: 
    Can have the input for chat name autofilled with the existing group name. 
    handleRemame can have a check for same group name as current.
  */
  const handleRename = async () => {
    if (!groupChatName) return;

    try {
      setRenameLoading(true);

      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "PUT",
        `/api/chat/rename`,
        {
          chatId: selectedChat?._id,
          chatName: groupChatName,
        },
        headers
      );

      const result = data as ChatType;
      setSelectedChat(result);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      if (error.response?.data && Object.keys(error.response.data).length > 0) {
        toast({
          title: "Error Occurred!",
          description: (error.response.data as { message: string }).message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error Occurred!",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
      setRenameLoading(false);
    }

    setGroupChatName(""); // clear the input state after api request is completed
  };

  return (
    <>
      <IconButton
        display={{ base: "flex" }}
        onClick={onOpen}
        icon={<ViewIcon />}
        aria-label="View Update Profile Modal Button"
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize={"2.18rem"}
            fontFamily={"Work sans"}
            display={"flex"}
            justifyContent={"center"}
          >
            {selectedChat?.chatName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box w={"100%"} display={"flex"} flexWrap={"wrap"} pb={3}>
              {selectedChat?.users.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleRemove(u)}
                />
              ))}
            </Box>
            <FormControl display={"flex"}>
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant={"solid"}
                colorScheme="teal"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            {loading ? (
              <Spinner size={"lg"} />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => handleAddUser(user)}
                />
              ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" onClick={() => handleRemove(user)}>
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
