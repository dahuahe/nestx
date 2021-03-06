"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const common_2 = require("./../../common");
const bson_1 = require("bson");
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 1 * 60 * 1000;
const SMS_VERIFICATION_CONTENT = `sms template {0}`;
let UsersService = class UsersService extends common_2.MongooseService {
    constructor(model, profileModel, veryCodeModel) {
        super(model);
        this.model = model;
        this.profileModel = profileModel;
        this.veryCodeModel = veryCodeModel;
        this.defaultQueryFields = [
            'username',
            'avatar',
            'email',
            'name',
            'mobile',
            'isAdmin',
            'isApproved',
            'expired',
        ];
    }
    querySearch(keyword, group, role, page, size, sort) {
        const _super = Object.create(null, {
            query: { get: () => super.query }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let groups, roles;
            if (group) {
                groups = { $in: group };
            }
            if (role) {
                roles = { $in: role };
            }
            return _super.query.call(this, page, size, {
                groups,
                roles,
            }, { keyword, field: 'name' }, this.defaultQueryFields, sort);
        });
    }
    register(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            entry.name = entry.name || entry.username;
            const { name, email, password, username, mobile, mobilePrefix } = entry;
            const instance = new this.model({
                name,
                email,
                password,
                username,
                mobile,
                mobilePrefix,
            });
            return yield instance.save();
        });
    }
    login(account, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = yield this.model.findOne({ username: account });
            if (instance) {
                return new Promise((resolve, reject) => {
                    instance.comparePassword(password, (err, isMatch) => {
                        if (err) {
                            return reject(err);
                        }
                        if (isMatch) {
                            resolve(instance);
                        }
                        resolve(false);
                    });
                });
            }
            return false;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.model.findById(id).exec();
            if (user) {
                user.name = user.name || user.username;
            }
            return user;
        });
    }
    removeUserFromRole(role, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (role && accountId) {
                yield this.model
                    .update({
                    _id: {
                        $in: accountId,
                    },
                }, { $pullAll: { roles: [role] } }, { multi: true })
                    .exec();
            }
            return { ok: true };
        });
    }
    addAccountsToRole(role, accountIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(accountIds) && bson_1.ObjectId.isValid(accountIds)) {
                accountIds = [accountIds];
            }
            if (role && Array.isArray(accountIds)) {
                const existIds = yield this.model
                    .find({
                    _id: {
                        $in: accountIds,
                    },
                    roles: {
                        $in: [role],
                    },
                }, { _id: 1 })
                    .exec();
                const exists = (existIds || []).map((item) => item._id.toString());
                const ids = accountIds.filter(id => {
                    return exists.indexOf(id) === -1;
                });
                const effects = yield this.model
                    .update({
                    _id: {
                        $in: ids,
                    },
                }, { $push: { roles: role } }, { multi: true })
                    .exec();
            }
            return { ok: true };
        });
    }
    updateProfile(userId, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const profileModel = yield this.profileModel
                .findOneAndUpdate({
                _id: userId,
            }, entry, { upsert: true, new: true })
                .exec();
            const profile = profileModel._id;
            const user = yield this.model
                .findOneAndUpdate({
                _id: userId,
            }, Object.assign({ profile }, entry), { new: true })
                .populate('profile')
                .exec();
            if (profile) {
                const instance = this.plainProfile(user);
                return instance;
            }
            return null;
        });
    }
    getProfile(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.model
                .findById(entry)
                .populate('profile')
                .exec();
            return this.plainProfile(user);
        });
    }
    sendVeryCode(mobile) {
        return __awaiter(this, void 0, void 0, function* () {
            const sms = yield this.veryCodeModel
                .findOne({
                mobile,
                lastSent: {
                    $gte: Date.now() - ONE_MINUTE,
                },
            })
                .exec();
            if (sms && process.env.NODE_ENV !== 'test') {
                return Promise.reject('Request too often.');
            }
            if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
                const date = Date.now();
                const code = '123456';
                yield new this.veryCodeModel({ mobile, code, lastSent: date }).save();
                return Promise.resolve(code);
            }
            const code = '123456';
            yield new this.veryCodeModel({ mobile, code }).save();
            return Promise.resolve(code);
        });
    }
    verifyCode(code, mobile) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
            const instance = yield this.veryCodeModel.findOne({
                code,
                mobile,
                lastSent: {
                    $gte: Date.now() - ONE_MINUTE,
                },
            });
            return instance ? true : false;
        });
    }
    plainProfile(user) {
        if (!user) {
            return null;
        }
        const doc = user.toObject();
        const instance = Object.assign({}, doc, doc.profile);
        instance.id = doc._id;
        delete instance.profile;
        delete instance._id;
        delete instance.__v;
        delete instance.password;
        instance.createdAt = doc.createdAt;
        return instance;
    }
};
UsersService = __decorate([
    common_1.Injectable(),
    __param(0, mongoose_2.InjectModel('User')),
    __param(1, mongoose_2.InjectModel('Profile')),
    __param(2, mongoose_2.InjectModel('VeryCode')),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map