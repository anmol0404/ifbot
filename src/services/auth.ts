import env from "./env.js";

//   another ID is for new updates so that bot owner can broadcast new updates to users
class Auth {
  isAdmin(userId: number) {
    return env.adminIds.includes(userId);
  }

  isOwner(userId: number) {
    return env.ownerId === userId;
  }
}

const auth = new Auth();
export default auth;
