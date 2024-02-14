import { Box } from "@chakra-ui/react";
import { SearchResultType } from "../miscellaneous/SideDrawer";
import { CloseIcon } from "@chakra-ui/icons";

interface UserBadgeItemProps {
  user: SearchResultType;
  handleFunction: () => void;
}

const UserBadgeItem: React.FC<UserBadgeItemProps> = ({
  user,
  handleFunction,
}) => {
  return (
    <Box
      px={2}
      py={1}
      borderRadius={"lg"}
      m={1}
      mb={2}
      fontSize={12}
      fontWeight={"bold"}
      textTransform={"uppercase"}
      backgroundColor="purple.500"
      color="white"
      cursor={"pointer"}
      onClick={handleFunction}
    >
      {user.name}
      <CloseIcon pl={1} />
    </Box>
  );
};

export default UserBadgeItem;
