import startHandler from "./start.js";
import reqAIOHandler from "./reqAIO.js";
import addAIOHandler from "./addAIO.js";
import editAIOHandler from "./editAIO.js";
import invitesHandler from "./myInvites.js";
import totalUsersHandler from "./totalUsers.js";
import myBroadcastHandler from "./broadcast.js";
import addOngoingHandler from "./addOngoing.js";
import replyHandler from "./reply.js";
export default {
    startHandler: startHandler,
    replyHandler: replyHandler,
    reqAIOHandler: reqAIOHandler,
    addAIOHandler: addAIOHandler,
    editAIOHandler: editAIOHandler,
    invitesHandler: invitesHandler,
    addOngoingHandler: addOngoingHandler,
    totalUsersHandler: totalUsersHandler,
    myBroadcastHandler: myBroadcastHandler,
};
