import { Badge, Box } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge = ({ count }: NotificationBadgeProps) => {
  return (
    <Box position="relative">
      <motion.div
        animate={{
          scale: [1, 0.8, 1], // Scale animation keyframes
        }}
        transition={{
          duration: 2, // Duration of each animation loop
          repeat: Infinity, // Repeat the animation infinitely
          ease: "easeInOut", // Easing function
        }}
        style={{ display: "inline-block" }}
      >
        <Badge
          bg="red.500" // Background color red
          color="white" // Text color white
          borderRadius="full"
          h={5}
          w={5}
          fontSize="sm"
          lineHeight="none"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
        >
          {count}
        </Badge>
      </motion.div>
    </Box>
  );
};

export default NotificationBadge;
