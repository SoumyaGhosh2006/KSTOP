// Parent <-> Mentor live chat using Socket.IO.
// Does not modify Prisma schema or existing Express routes.

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prismaClient");

const {
  ensureDevParentAccount,
  ensureDevMentorAccount,
} = require("../lib/devAccounts");

const MAX_STUDENTS_PER_MENTOR = 70;

// Development quick-login tokens.
// These are NOT JWT tokens.
const DEV_TOKENS = {
  "dev-token-parent": {
    id: "parent-test-123",
    role: "parent",
  },

  "dev-token-mentor": {
    id: "mentor-test-123",
    role: "mentor",
  },
};

// Get token from Socket.IO connection
function getToken(socket) {
  const tokenFromAuth = socket.handshake.auth?.token;

  if (tokenFromAuth) {
    return tokenFromAuth;
  }

  const authorization = socket.handshake.headers?.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }

  return null;
}

// Verify normal JWT OR development token
function verifySocketToken(token) {
  if (!token) {
    throw new Error("Authentication token missing.");
  }

  // Development quick-login token
  const devUser = DEV_TOKENS[token];

  if (
    (process.env.NODE_ENV || "development") === "development" &&
    devUser
  ) {
    return devUser;
  }

  // Normal JWT
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Get parent -> child -> assigned mentor
async function getParentConversation(parentId) {
  const parent = await prisma.user.findUnique({
    where: {
      id: parentId,
    },
  });

  if (!parent || parent.role !== "parent") {
    throw new Error("Parent not found.");
  }

  if (!parent.childRollNumber) {
    throw new Error("Parent is not linked to a student.");
  }

  // Parent.childRollNumber
  //        ↓
  // Student.rollNumber
  const student = await prisma.user.findUnique({
    where: {
      rollNumber: parent.childRollNumber,
    },
  });

  if (!student || student.role !== "student") {
    throw new Error("Linked student not found.");
  }

  // Student.mentorName
  //        ↓
  // Mentor.name
  if (!student.mentorName) {
    throw new Error("Student does not have an assigned mentor.");
  }

  const mentor = await prisma.user.findFirst({
    where: {
      role: "mentor",
      name: {
        equals: student.mentorName.trim(),
        mode: "insensitive",
      },
    },
  });

  if (!mentor) {
    throw new Error("Assigned mentor not found.");
  }

  return {
    parent,
    student,
    mentor,
  };
}

// Check that the mentor really belongs to this parent/student
async function verifyMentorParentConversation(
  mentorId,
  parentId
) {
  const conversation = await getParentConversation(parentId);

  if (conversation.mentor.id !== mentorId) {
    throw new Error(
      "You are not the assigned mentor for this student's parent."
    );
  }

  return conversation;
}

// Setup Socket.IO
function setupParentMentorChat(io) {
  console.log(
    "✅ Parent-Mentor Socket.IO chat initialized"
  );

  // ==================================================
  // SOCKET AUTHENTICATION
  // ==================================================

  io.use((socket, next) => {
    try {
      const token = getToken(socket);

      console.log("🔌 Socket authentication attempt");
      console.log("Token received:", !!token);

      const decoded = verifySocketToken(token);

      console.log("Authenticated user:", {
        id: decoded.id,
        role: decoded.role,
      });

      if (
        !decoded.id ||
        !["parent", "mentor"].includes(decoded.role)
      ) {
        return next(
          new Error(
            "Only parents and mentors can use this chat."
          )
        );
      }

      socket.user = decoded;

      next();
    } catch (error) {
      console.error(
        "❌ Socket authentication failed:",
        error.message
      );

      next(
        new Error(
          `Socket authentication failed: ${error.message}`
        )
      );
    }
  });

  // ==================================================
  // CONNECTION
  // ==================================================

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    const role = socket.user.role;

    console.log(
      `🟢 Socket connected: ${role} ${userId}`
    );

    socket.join(`user:${userId}`);

    try {
      // ================================================
      // PARENT
      // ================================================

      if (role === "parent") {
        // Make sure development parent exists
        await ensureDevParentAccount(userId);

        const {
          parent,
          student,
          mentor,
        } = await getParentConversation(userId);

        console.log(
          `💬 Parent chat ready: ${parent.name} -> ${student.name} -> ${mentor.name}`
        );

        socket.emit("chat-ready", {
          role: "parent",

          parent: {
            id: parent.id,
            name: parent.name,
          },

          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
          },

          mentor: {
            id: mentor.id,
            name: mentor.name,
          },
        });
      }

      // ================================================
      // MENTOR
      // ================================================

      if (role === "mentor") {
        // Make sure development mentor exists
        await ensureDevMentorAccount(userId);

        const mentor = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

        if (!mentor) {
          throw new Error("Mentor not found.");
        }

        const studentCount =
          await prisma.user.count({
            where: {
              role: "student",

              mentorName: {
                equals: mentor.name,
                mode: "insensitive",
              },
            },
          });

        socket.emit("chat-ready", {
          role: "mentor",
          studentCount,
          maxStudents: MAX_STUDENTS_PER_MENTOR,
        });

        console.log(
          `💬 Mentor chat ready: ${mentor.name}`
        );
      }
    } catch (error) {
      console.error(
        "❌ Chat initialization failed:",
        error.message
      );

      socket.emit("chat-error", {
        message: error.message,
      });
    }

    // ==================================================
    // PARENT SENDS MESSAGE
    // ==================================================

    socket.on(
      "send-parent-message",
      async (data) => {
        try {
          if (role !== "parent") {
            return;
          }

          const message =
            String(data?.message || "").trim();

          if (!message) {
            return;
          }

          // Automatically find:
          //
          // Parent
          //   ↓ childRollNumber
          // Student
          //   ↓ mentorName
          // Mentor

          const {
            parent,
            student,
            mentor,
          } = await getParentConversation(userId);

          const savedMessage =
            await prisma.parentMessage.create({
              data: {
                parentId: parent.id,
                mentorId: mentor.id,
                studentId: student.id,
                message,
              },
            });

          const payload = {
            ...savedMessage,

            senderRole: "parent",
            senderId: parent.id,

            parentName: parent.name,

            studentName: student.name,
            studentRollNumber: student.rollNumber,
          };

          // Send back to parent
          io.to(`user:${parent.id}`).emit(
            "parent-mentor-message",
            payload
          );

          // Send to the assigned mentor
          io.to(`user:${mentor.id}`).emit(
            "parent-mentor-message",
            payload
          );

          console.log(
            `📨 Parent message: ${parent.name} -> ${mentor.name}`
          );
        } catch (error) {
          console.error(
            "❌ Parent message error:",
            error.message
          );

          socket.emit("chat-error", {
            message: error.message,
          });
        }
      }
    );

    // ==================================================
    // MENTOR SENDS REPLY
    // ==================================================

    socket.on(
      "send-mentor-message",
      async (data) => {
        try {
          if (role !== "mentor") {
            return;
          }

          const message =
            String(data?.message || "").trim();

          const parentId =
            String(data?.parentId || "").trim();

          if (!message || !parentId) {
            return;
          }

          // Verify:
          //
          // Mentor
          //   ↓
          // Student
          //   ↓
          // Parent

          const {
            parent,
            student,
          } =
            await verifyMentorParentConversation(
              userId,
              parentId
            );

          const savedMessage =
            await prisma.parentMessage.create({
              data: {
                parentId: parent.id,
                mentorId: userId,
                studentId: student.id,
                message,
              },
            });

          const payload = {
            ...savedMessage,

            senderRole: "mentor",
            senderId: userId,

            parentName: parent.name,

            studentName: student.name,
            studentRollNumber: student.rollNumber,
          };

          // Send to mentor
          io.to(`user:${userId}`).emit(
            "parent-mentor-message",
            payload
          );

          // Send to exact parent
          io.to(`user:${parent.id}`).emit(
            "parent-mentor-message",
            payload
          );

          console.log(
            `📨 Mentor reply sent to parent: ${parent.name}`
          );
          } catch (error) {
          console.error(
            "❌ Mentor message error:",
            error.message
          );

          socket.emit("chat-error", {
            message: error.message,
          });
        }
      }
    );

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on("disconnect", (reason) => {
      console.log(
        `🔴 Socket disconnected: ${role} ${userId}. Reason: ${reason}`
      );
    });
  });
}



module.exports = {
  setupParentMentorChat,
};