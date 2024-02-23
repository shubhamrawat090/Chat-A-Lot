import { UserType } from "../Context/ChatProvider";
import { MessageType } from "../components/SingleChat";

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

/*
  This is used to check the last message by the same user because on that we are displaying a the user picture

      1. msg by ram
      2. msg by ram
      3. msg by ram
  😒  4. msg by ram

      5. msg by ravi
      6. msg by ravi
  🫥  7. msg by ravi

                                                        8. msg by loginUser
                                                        9. msg by loginUser
                                                        10. msg by loginUser

  In this we are trying to find till when the messages are sent by the same user only.
  Example 1, 2, 3 will be sent by the same sender as their next messages we sent by the same sender as well.

  NOTE: the loginUser's image in not visible so this function will ignore the login user
*/
export const isSameSender = (
  allMsgs: MessageType[],
  currMsg: MessageType,
  currMsgIdx: number,
  loginUserId: string | undefined
) => {
  return (
    currMsgIdx < allMsgs.length - 1 &&
    (allMsgs[currMsgIdx + 1].sender._id !== currMsg.sender._id ||
      allMsgs[currMsgIdx + 1].sender._id === undefined) &&
    allMsgs[currMsgIdx].sender._id !== loginUserId
  );
};

/* 
  Should be the last element in array.
  The sender should not be the loginUser.
  The sender's id should exist.
*/
export const isLastMessage = (
  allMsgs: MessageType[],
  currMsgIdx: number,
  loginUserId: string | undefined
) => {
  return (
    currMsgIdx === allMsgs.length - 1 &&
    allMsgs[allMsgs.length - 1].sender._id &&
    allMsgs[allMsgs.length - 1].sender._id !== loginUserId
  );
};

export const isSameSenderMargin = (
  allMsgs: MessageType[],
  currMsg: MessageType,
  currMsgIdx: number,
  loginUserId: string | undefined
) => {
  let margin: number | string;
  if (
    currMsgIdx < allMsgs.length - 1 &&
    allMsgs[currMsgIdx + 1].sender._id === currMsg.sender._id &&
    allMsgs[currMsgIdx].sender._id !== loginUserId
  ) {
    margin = 33;
  } else if (
    (currMsgIdx < allMsgs.length - 1 &&
      allMsgs[currMsgIdx + 1].sender._id !== currMsg.sender._id &&
      allMsgs[currMsgIdx].sender._id !== loginUserId) ||
    (currMsgIdx === allMsgs.length - 1 &&
      allMsgs[currMsgIdx].sender._id !== loginUserId)
  ) {
    margin = 0;
  } else {
    margin = "auto";
  }
  console.log(currMsgIdx, "margin: ", margin);
  return margin;
};

export const isSameUser = (
  allMsgs: MessageType[],
  currMsg: MessageType,
  currMsgIdx: number
) => {
  return (
    currMsgIdx > 0 && allMsgs[currMsgIdx - 1].sender._id === currMsg.sender._id
  );
};
