var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import mongoose from "mongoose";
import env from "../services/env.js";
import MessageModel from "./models/messageModel.js";
import UserModel from "./models/userModel.js";
import SortModel from "./models/sortModel.js";
import jwt from "jsonwebtoken";
import AIOModel from "./models/aIOModel.js";
import OngoingModel from "./models/ongoingModel.js";
import { HindiDramaModel } from "./models/aIOModel.js";
import { InviteService } from "./inviteService.js";
import TokenModel from "./models/tokenModel.js";
import { sendToLogGroup } from "../utils/sendToCollection.js";
var MongoDB = /** @class */ (function () {
    function MongoDB() {
        this.db = mongoose;
        this.MessageModel = MessageModel;
        this.UserModel = UserModel;
        this.SortModel = SortModel;
        this.AIOModel = AIOModel;
        this.TokenModel = TokenModel;
        this.OngoingModel = OngoingModel;
        this.HindiDramaModel = HindiDramaModel;
        this.databaseUrl = env.databaseUrl || "";
        this.inviteService = new InviteService();
    }
    MongoDB.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.connect(this.databaseUrl)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.saveMessages = function (shareId, messageIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new this.MessageModel({
                            shareId: shareId,
                            messageIds: messageIds,
                        }).save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, shareId];
                }
            });
        });
    };
    MongoDB.prototype.saveUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.UserModel.findOne({ id: Number(user.id) })];
                    case 1:
                        existingUser = _a.sent();
                        if (!!existingUser) return [3 /*break*/, 3];
                        return [4 /*yield*/, new this.UserModel(user).save()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, user];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error saving user:", error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, user];
                }
            });
        });
    };
    MongoDB.prototype.getAllUserIds = function () {
        return __awaiter(this, void 0, void 0, function () {
            var users, userIds, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, UserModel.find().select("id")];
                    case 1:
                        users = _a.sent();
                        userIds = users.map(function (user) { return user.id; });
                        return [2 /*return*/, userIds];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Error fetching user IDs:", error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.isUserExist = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userExists, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.UserModel.findOne({ id: Number(userId) })];
                    case 1:
                        userExists = _a.sent();
                        console.log(userExists);
                        return [2 /*return*/, (userExists === null || userExists === void 0 ? void 0 : userExists.id) ? true : false];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error checking user existence:", error_3);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.countUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var itemCount, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.UserModel.countDocuments()];
                    case 1:
                        itemCount = _a.sent();
                        return [2 /*return*/, ": ".concat(itemCount)];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, "Error counting users"];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.saveSort = function (sort) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new this.SortModel(sort).save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, sort];
                }
            });
        });
    };
    MongoDB.prototype.getFirstItem = function () {
        return __awaiter(this, void 0, void 0, function () {
            var document_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.findOne({}, { sort: { $slice: 1 } })];
                    case 1:
                        document_1 = _a.sent();
                        if (!document_1 || document_1.sort.length === 0) {
                            console.log("No document found or the sort array is empty.");
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, document_1];
                    case 2:
                        err_1 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.getMessages = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.MessageModel.findOne({ shareId: shareId })];
                    case 1: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.messageIds];
                }
            });
        });
    };
    MongoDB.prototype.getAIOMessages = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.AIOModel.findOne({ shareId: shareId })];
                    case 1: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.messageIds];
                }
            });
        });
    };
    MongoDB.prototype.getOngoingMessages = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.OngoingModel.findOne({ shareId: shareId })];
                    case 1: return [2 /*return*/, (_a.sent()) || undefined];
                }
            });
        });
    };
    MongoDB.prototype.saveAIO = function (aio) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new this.AIOModel(aio).save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, aio];
                }
            });
        });
    };
    MongoDB.prototype.createOngoing = function (ong) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new this.OngoingModel(ong).save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ong];
                }
            });
        });
    };
    MongoDB.prototype.addOngoing = function (shareId, messageIds) {
        return __awaiter(this, void 0, void 0, function () {
            var ongoingDocument;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.OngoingModel.findOne({ shareId: shareId })];
                    case 1:
                        ongoingDocument = _a.sent();
                        if (!ongoingDocument) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.OngoingModel.findByIdAndUpdate(ongoingDocument.id, { $push: { messageIds: { $each: messageIds } } }, { new: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    // async saveOngoing(ong: OngoingDocument) {
    //   await new this.OngoingModel(ong).save();
    //   return ong;
    // }
    MongoDB.prototype.getHindiMessages = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.HindiDramaModel.findOne({ shareId: shareId })];
                    case 1: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.messageIds];
                }
            });
        });
    };
    MongoDB.prototype.saveHindiDrama = function (aio) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new this.HindiDramaModel(aio).save()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, aio];
                }
            });
        });
    };
    MongoDB.prototype.searchAIO = function (criteria, messageIdLink) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedTitle, first20Chars, query, specialQuery, keywords, regexPattern, results, _a, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!criteria.aIOTitle || criteria.aIOTitle.length < 2) {
                            console.log("Please provide a valid search criteria.");
                            return [2 /*return*/, undefined];
                        }
                        normalizedTitle = criteria.aIOTitle;
                        first20Chars = normalizedTitle.slice(0, 20);
                        query = {
                            aIOTitle: { $regex: new RegExp(first20Chars, "i") },
                        };
                        specialQuery = {};
                        if (first20Chars.length > 4) {
                            keywords = first20Chars
                                .replace(/\s+/g, " ")
                                .split(" ")
                                .map(function (keyword) { return "(?=.*".concat(keyword, ")"); })
                                .join("");
                            regexPattern = new RegExp("^".concat(keywords), "i");
                            specialQuery = {
                                aIOTitle: { $regex: regexPattern },
                            };
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.AIOModel.find(query)];
                    case 2:
                        results = _b.sent();
                        if (!(results.length === 0 && Object.keys(specialQuery).length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.AIOModel.find(specialQuery)];
                    case 3:
                        results = _b.sent();
                        _b.label = 4;
                    case 4:
                        if (!(results.length === 0)) return [3 /*break*/, 8];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, sendToLogGroup(env.logGroupId, "not found: ".concat(normalizedTitle, " [View Message](").concat(messageIdLink || "https://www.telegram.org/", ")"))];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _a = _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, results];
                    case 9:
                        err_2 = _b.sent();
                        console.error("Error executing the query:", err_2);
                        return [2 /*return*/, undefined];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.searchHindiDrama = function (criteria) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedTitle, first20Chars, query, specialQuery, keywords, regexPattern, results, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!criteria.aIOTitle || criteria.aIOTitle.length < 2) {
                            console.log("Please provide a valid search criteria.");
                            return [2 /*return*/, undefined];
                        }
                        normalizedTitle = criteria.aIOTitle;
                        first20Chars = normalizedTitle.slice(0, 20);
                        query = {
                            aIOTitle: { $regex: new RegExp(first20Chars, "i") },
                        };
                        specialQuery = {};
                        if (first20Chars.length > 4) {
                            keywords = first20Chars
                                .replace(/\s+/g, " ")
                                .split(" ")
                                .map(function (keyword) { return "(?=.*".concat(keyword, ")"); })
                                .join("");
                            regexPattern = new RegExp("^".concat(keywords), "i");
                            specialQuery = {
                                aIOTitle: { $regex: regexPattern },
                            };
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.HindiDramaModel.find(query)];
                    case 2:
                        results = _a.sent();
                        if (!(results.length === 0 && Object.keys(specialQuery).length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.HindiDramaModel.find(specialQuery)];
                    case 3:
                        results = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, results];
                    case 5:
                        err_3 = _a.sent();
                        console.error("Error executing the query:", err_3);
                        return [2 /*return*/, undefined];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.addAIO = function (shareId, messageIds) {
        return __awaiter(this, void 0, void 0, function () {
            var aioDocument;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.AIOModel.findOne({ shareId: shareId })];
                    case 1:
                        aioDocument = _a.sent();
                        if (!aioDocument) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.AIOModel.findByIdAndUpdate(aioDocument.id, { $push: { messageIds: { $each: messageIds } } }, { new: true })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    MongoDB.prototype.deleteAIO = function (shareId) {
        return __awaiter(this, void 0, void 0, function () {
            var animeDocument;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.AIOModel.findOne({ shareId: shareId })];
                    case 1:
                        animeDocument = _a.sent();
                        if (!animeDocument) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.AIOModel.findByIdAndDelete(animeDocument.id)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    MongoDB.prototype.updateAIOAttribute = function (shareId, updateQuery) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, AIOModel.updateOne({ shareId: shareId }, { $set: updateQuery })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Error updating drama attribute:", error_5);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //invite
    MongoDB.prototype.addInvite = function (userId, invitedUsername, invitedUserId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.inviteService.addInvite(userId, invitedUsername, invitedUserId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.getInviteUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.inviteService.getInviteUser(userId)];
            });
        });
    };
    MongoDB.prototype.canRequest = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.inviteService.canRequest(userId)];
            });
        });
    };
    MongoDB.prototype.useRequest = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.inviteService.useRequest(userId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.getTopInviters = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.inviteService.getTopInviters()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MongoDB.prototype.updateInviteUsed = function (userId, newUsedInvites) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.inviteService.updateInviteUsed(userId, newUsedInvites)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MongoDB.prototype.getInviteStatus = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.inviteService.getInviteStatus(userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // token
    MongoDB.prototype.hasGeneratedToken = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenData, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 1:
                        tokenData = _a.sent();
                        return [2 /*return*/, tokenData !== null];
                    case 2:
                        error_6 = _a.sent();
                        console.error("Error checking if token exists for user:", error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.verifyAndValidateToken = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenData, newToken, expiresAt, newTokenData, decoded, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 1:
                        tokenData = _a.sent();
                        if (!!tokenData) return [3 /*break*/, 3];
                        newToken = jwt.sign({ userId: userId }, env.jwtSecret, { expiresIn: "24h" });
                        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        newTokenData = new this.TokenModel({
                            userId: userId,
                            token: newToken,
                            expiresAt: expiresAt,
                        });
                        return [4 /*yield*/, newTokenData.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        decoded = jwt.verify(tokenData.token, env.jwtSecret);
                        if (new Date() > tokenData.expiresAt) {
                            console.error("Token has expired");
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_7 = _a.sent();
                        if (error_7 instanceof jwt.TokenExpiredError) {
                            console.error("Token has expired");
                        }
                        else if (error_7 instanceof jwt.JsonWebTokenError) {
                            console.error("Invalid token");
                        }
                        else {
                            console.error("Unexpected error during token verification:", error_7);
                        }
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.generateNewToken = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var newToken, expiresAt, existingToken, newTokenData, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newToken = jwt.sign({ userId: userId }, env.jwtSecret, { expiresIn: "24h" });
                        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 2:
                        existingToken = _a.sent();
                        if (!existingToken) return [3 /*break*/, 4];
                        existingToken.token = newToken;
                        existingToken.expiresAt = expiresAt;
                        return [4 /*yield*/, existingToken.save()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        newTokenData = new this.TokenModel({ userId: userId, token: newToken, expiresAt: expiresAt });
                        return [4 /*yield*/, newTokenData.save()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, newToken];
                    case 7:
                        error_8 = _a.sent();
                        console.error("Error generating or saving token:", error_8);
                        throw error_8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.manageToken = function (userId, token) {
        return __awaiter(this, void 0, void 0, function () {
            var hasToken, newToken, isValid, newToken, newToken, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 11, , 12]);
                        return [4 /*yield*/, this.hasGeneratedToken(userId)];
                    case 1:
                        hasToken = _a.sent();
                        if (!!hasToken) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.generateNewToken(userId)];
                    case 2:
                        newToken = _a.sent();
                        return [2 /*return*/, { token: newToken, message: "No token found. New token generated." }];
                    case 3:
                        if (!token) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.verifyAndValidateToken(userId)];
                    case 4:
                        isValid = _a.sent();
                        if (!isValid) return [3 /*break*/, 5];
                        return [2 /*return*/, { token: token, message: "Token is valid." }];
                    case 5: return [4 /*yield*/, this.generateNewToken(userId)];
                    case 6:
                        newToken = _a.sent();
                        return [2 /*return*/, { token: newToken, message: "Token expired or invalid. New token generated." }];
                    case 7: return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, this.generateNewToken(userId)];
                    case 9:
                        newToken = _a.sent();
                        return [2 /*return*/, { token: newToken, message: " New token generated." }];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_9 = _a.sent();
                        console.error("Error managing token:", error_9);
                        throw error_9;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    // bot premium
    MongoDB.prototype.checkBotPremiumStatus = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenData, expiresAt, error_10;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 1:
                        tokenData = _c.sent();
                        if (!tokenData || !((_a = tokenData.bot_premium) === null || _a === void 0 ? void 0 : _a.is_bot_premium)) {
                            return [2 /*return*/, false];
                        }
                        expiresAt = (_b = tokenData.bot_premium) === null || _b === void 0 ? void 0 : _b.expires_at;
                        if (!(expiresAt && new Date() > expiresAt)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.TokenModel.updateOne({ userId: userId }, { $set: { "bot_premium.is_bot_premium": false } } // Update here
                            )];
                    case 2:
                        _c.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/, true];
                    case 4:
                        error_10 = _c.sent();
                        console.error("Error checking bot premium status:", error_10);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.addBotPremium = function (userId, duration) {
        return __awaiter(this, void 0, void 0, function () {
            var regex, match, value, unit, durationMs, subscriptionType, expiresAt, tokenData, newTokenData, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        regex = /^(\d+)([smhd])$/;
                        match = duration.match(regex);
                        if (!match) {
                            console.error("Invalid duration format. Please use a format like 1h, 2d, etc.");
                            return [2 /*return*/, "Invalid duration format. Please use a format like 1h, 2d, etc."];
                        }
                        value = parseInt(match[1]);
                        unit = match[2].toLowerCase();
                        durationMs = void 0;
                        switch (unit) {
                            case "s":
                                durationMs = value * 1000;
                                break;
                            case "m":
                                durationMs = value * 60 * 1000;
                                break;
                            case "h":
                                durationMs = value * 60 * 60 * 1000;
                                break;
                            case "d":
                                durationMs = value * 24 * 60 * 60 * 1000;
                                break;
                            default:
                                console.error("Invalid time unit. Use s, m, h, or d.");
                                return [2 /*return*/, "Invalid time unit. Use s, m, h, or d."];
                        }
                        if (durationMs < 1 * 24 * 60 * 60 * 1000) {
                            console.error("The minimum duration for premium is 1 day.");
                            return [2 /*return*/, "The minimum duration for premium is 1 day."];
                        }
                        subscriptionType = "Other";
                        if (durationMs <= 30 * 24 * 60 * 60 * 1000) {
                            subscriptionType = "Gold";
                        }
                        else if (durationMs <= 90 * 24 * 60 * 60 * 1000) {
                            subscriptionType = "Silver";
                        }
                        else {
                            subscriptionType = "Platinum";
                        }
                        expiresAt = new Date(Date.now() + durationMs);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 1:
                        tokenData = _a.sent();
                        if (!!tokenData) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.manageToken(userId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 3:
                        newTokenData = _a.sent();
                        if (!newTokenData) {
                            console.error("Failed to retrieve token after generation in addBotPremium.");
                            return [2 /*return*/, "Failed to add premium. Please try again later."];
                        }
                        tokenData = newTokenData; // Assign the newly created/fetched tokenData
                        _a.label = 4;
                    case 4:
                        tokenData.bot_premium = {
                            is_bot_premium: true,
                            subscriptionType: subscriptionType ? subscriptionType : "Other",
                            duration: value,
                            expires_at: expiresAt,
                            activated_at: new Date(),
                            details: "".concat(value, " ").concat(unit),
                        };
                        return [4 /*yield*/, tokenData.save()];
                    case 5:
                        _a.sent();
                        console.log("Premium added for ".concat(userId, ", subscription type: ").concat(subscriptionType, ", expires at ").concat(expiresAt));
                        return [2 /*return*/, "Premium successfully added for ".concat(userId, ". Subscription type: ").concat(subscriptionType, ". Premium will expire on ").concat(expiresAt.toLocaleString(), ".")];
                    case 6:
                        error_11 = _a.sent();
                        console.error("Error adding bot premium:", error_11);
                        return [2 /*return*/, "Error adding bot premium:  + ".concat(error_11)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.getPremiumDetails = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenData, _a, subscriptionType, duration, expires_at, activated_at, details, currentTime, remainingTimeMs, remainingDays, error_12;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.TokenModel.findOne({ userId: userId })];
                    case 1:
                        tokenData = _b.sent();
                        if (!tokenData || !tokenData.bot_premium || !tokenData.bot_premium.is_bot_premium) {
                            return [2 /*return*/, "You do not have an active premium subscription."];
                        }
                        _a = tokenData.bot_premium, subscriptionType = _a.subscriptionType, duration = _a.duration, expires_at = _a.expires_at, activated_at = _a.activated_at, details = _a.details;
                        if (!expires_at) {
                            return [2 /*return*/, "Premium subscription details are incomplete."];
                        }
                        currentTime = new Date();
                        remainingTimeMs = new Date(expires_at).getTime() - currentTime.getTime();
                        remainingDays = Math.ceil(remainingTimeMs / (24 * 60 * 60 * 1000));
                        if (remainingTimeMs <= 0) {
                            return [2 /*return*/, "Your premium subscription of type '".concat(subscriptionType, "' has expired. Duration was ").concat(duration, " days.")];
                        }
                        return [2 /*return*/, "Premium Details:\n    - Subscription Type: ".concat(subscriptionType, "\n    - Total Duration: ").concat(duration, " days\n    - Remaining Time: ").concat(remainingDays, " day(s)\n    - Activated At: ").concat(activated_at.toLocaleDateString(), "\n    - Expires At: ").concat(new Date(expires_at).toLocaleDateString(), "\n    - Additional Details: ").concat(details)];
                    case 2:
                        error_12 = _b.sent();
                        console.error("Error fetching premium details:", error_12);
                        return [2 /*return*/, "An error occurred while retrieving premium details. Please try again."];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    //////////////////////////
    MongoDB.prototype.addLinkToFirstSort = function (newLink) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.updateOne({}, { $push: { sort: { $each: [newLink], $position: 0 } } })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.modifiedCount > 0];
                    case 2:
                        error_13 = _a.sent();
                        console.error("Error adding link to first sort:", error_13);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Function to get the first item in the sort array
    MongoDB.prototype.getFirstSortItem = function () {
        return __awaiter(this, void 0, void 0, function () {
            var document_2, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.findOne({}, { sort: { $slice: 1 } })];
                    case 1:
                        document_2 = _a.sent();
                        if (!document_2 || document_2.sort.length === 0) {
                            console.log("No document found or the sort array is empty.");
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, document_2];
                    case 2:
                        error_14 = _a.sent();
                        console.error("Error retrieving first sort item:", error_14);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Function to set the current active share ID
    MongoDB.prototype.setActiveShareId = function (newActiveShareId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.updateOne({}, { $set: { currentActivePath: newActiveShareId } })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.modifiedCount > 0];
                    case 2:
                        error_15 = _a.sent();
                        console.error("Error setting active share ID:", error_15);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Function to update both the first sort and the current active path atomically
    MongoDB.prototype.updateFirstSortAndActivePath = function (newLink, newActiveShareId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.updateOne({}, {
                                $push: { sort: { $each: [newLink], $position: 0 } },
                                $set: { currentActivePath: newActiveShareId },
                            }, { upsert: true } // This creates a new document if none exists
                            )];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.modifiedCount > 0 || result.upsertedCount > 0];
                    case 2:
                        error_16 = _a.sent();
                        console.error("Error updating first sort and active path:", error_16);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MongoDB.prototype.deleteAllSortData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, SortModel.deleteMany({})];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount > 0];
                    case 2:
                        error_17 = _a.sent();
                        console.error("Error deleting all sort data:", error_17);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MongoDB;
}());
var mongoDB = new MongoDB();
export default mongoDB;
