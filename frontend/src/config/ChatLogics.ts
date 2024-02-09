import { UserType } from "../Context/ChatProvider";

// whichever is not the loggedUser is the sender
export const getSender = (loggedUser: UserType, users: UserType[]) => {
  return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};
