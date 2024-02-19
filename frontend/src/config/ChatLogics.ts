import { UserType } from "../Context/ChatProvider";

// whichever is not the loggedUser is the sender
export const getSender = (loggedUser: UserType | null, users: UserType[]) => {
  if (loggedUser === null) return null;
  return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
};

// same as above, just returns the entire user object instead of just name
export const getSenderFull = (
  loggedUser: UserType | null,
  users: UserType[]
) => {
  if (loggedUser === null) return null;
  return users[0]._id === loggedUser._id ? users[1] : users[0];
};
