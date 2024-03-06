import {
  Box,
  Button,
  FormControl,
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
import { ReactNode, useState } from "react";
import { ChatState, ChatType, UserType } from "../../Context/ChatProvider";
import { apiConnector } from "../../services/axiosInstance";
import UserListItem from "../UserAvatar/UserListItem";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import { AxiosError } from "axios";

interface GroupChatModalProps {
  children: ReactNode;
}

const GroupChatModal = ({ children }: GroupChatModalProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const { user, chats, setChats } = ChatState();

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

  const handleSubmit = async () => {
    if (!groupChatName || selectedUsers.length === 0) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "POST",
        `/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        headers
      );

      const result = data as ChatType;

      if (!chats) {
        setChats([result]); // first chat
      } else {
        setChats([result, ...chats]);
      }

      onClose();

      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      if (error.response?.data && Object.keys(error.response.data).length > 0) {
        toast({
          title: "Failed to Create the Chat!",
          description: (error.response.data as { message: string }).message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Failed to Create the Chat!",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const handleGroup = (userToAdd: UserType) => {
    if (selectedUsers.find((user) => user._id === userToAdd._id)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (userToDelete: UserType) => {
    setSelectedUsers(
      selectedUsers.filter(
        (selectedUser) => selectedUser._id !== userToDelete._id
      )
    );
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize={"2.19rem"}
            fontFamily={"Work sans"}
            display={"flex"}
            justifyContent={"center"}
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display={"flex"} flexDir={"column"} alignItems={"center"}>
            <FormControl>
              <Input
                placeholder="Chat Name"
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users e.g: Betty, Josh, Rajan"
                mb={3}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            {/* selected users list */}
            <Box w={"100%"} display="flex" flexWrap="wrap">
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleDelete(u)}
                />
              ))}
            </Box>

            {/* render searched users - show top 4 results only */}
            {loading ? (
              <Spinner size={"lg"} />
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleGroup(user)}
                  />
                ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;
