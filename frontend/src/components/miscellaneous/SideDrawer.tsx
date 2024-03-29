import { BellIcon, SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChatState, ChatType, UserType } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { useNavigate } from "react-router-dom";
import { apiConnector } from "../../services/axiosInstance";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UserAvatar/UserListItem";
import { AxiosError } from "axios";
import { getSender } from "../../config/ChatLogics";
import NotificationBadge from "./NotificationBadge";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const toast = useToast();

  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-left",
      });
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

  const accessChat = async (userId: string) => {
    try {
      setLoadingChat(true);

      const headers = {
        Authorization: `Bearer ${user?.token}`,
      };

      const { data } = await apiConnector(
        "POST",
        "/api/chat",
        { userId },
        headers
      );

      const result: ChatType = data as ChatType;

      // If the current chat is not present then it will put it on top of all the chats
      if (!chats?.find((c: ChatType) => c._id === result._id)) {
        if (chats) {
          setChats([result, ...chats]);
        }
      }

      setSelectedChat(result);
      setLoadingChat(false);
      onClose();
    } catch (err) {
      const error = err as AxiosError;
      console.error(error);
      if (error.response?.data && Object.keys(error.response.data).length > 0) {
        toast({
          title: "Error fetching the chat",
          description: (error.response.data as { message: string }).message,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error fetching the chat",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
      setLoadingChat(false);
    }
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="0.31rem 0.62rem 0.31rem 0.62rem"
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button variant="ghost">
            <SearchIcon />
            <Text
              display={{ base: "none", md: "flex" }}
              px="4"
              onClick={onOpen}
            >
              Search User
            </Text>
          </Button>
        </Tooltip>

        <Text fontSize={"2xl"} fontFamily={"Work sans"}>
          Chat-A-Lot
        </Text>

        <div>
          {/* Notifications */}
          <Menu>
            <MenuButton position={"relative"} p={1} pr={4}>
              {notification.length !== 0 && (
                <Box position={"absolute"} top={"-0.2rem"} right={"0.65rem"}>
                  <NotificationBadge count={notification.length} />
                </Box>
              )}
              <BellIcon fontSize={"2xl"} m={1} />
            </MenuButton>
            <MenuList px={2}>
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat); // Open the chat associated with the notification
                    setNotification(notification.filter((n) => n !== notif)); // Remove that notification
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              <Avatar
                size={"sm"}
                cursor={"pointer"}
                name={user?.name}
                src={user?.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>

      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth={"1px"}>Search Users</DrawerHeader>
          <DrawerBody>
            <Box display={"flex"} pb={2}>
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml={"auto"} display={"flex"} />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
