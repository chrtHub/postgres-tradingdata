"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.__esModule = true;
//-- AWS client(s) --//
var client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
var client_s3_1 = require("@aws-sdk/client-s3");
var client_s3_2 = require("@aws-sdk/client-s3");
var retry = require("async-retry");
var openai_1 = require("openai");
//-- Utility Functions --//
//-- Types --//
//-- AWS Client(s) config --//
var secretsManager_client = new client_secrets_manager_1.SecretsManagerClient({
    region: "us-east-1"
});
var s3_client = new client_s3_1.S3Client({
    region: "us-east-1"
});
console.log("----- before main -----"); // DEV
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var getOpenAI_API_Key, OPENAI_API_KEY, configuration, OpenAIClient, styles, animals, emotions, styleLoopStopper, animallLoopStopper, emotionLoopStopper, _loop_1, emotionIdx;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("----- main -----"); // DEV
                    getOpenAI_API_Key = function () { return __awaiter(_this, void 0, void 0, function () {
                        var OPENAI_API_KEY, err_1;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    OPENAI_API_KEY = "";
                                    console.log("----- getOpenAI_API_Key -----"); // DEV
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, retry(function () { return __awaiter(_this, void 0, void 0, function () {
                                            var res, SecretStringJSON;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        console.log("AWS Secrets Manager - fetching OpenAI API Key");
                                                        return [4 /*yield*/, secretsManager_client.send(new client_secrets_manager_1.GetSecretValueCommand({
                                                                SecretId: "OpenAI/APIKey/0tRy",
                                                                VersionStage: "AWSCURRENT"
                                                            }))];
                                                    case 1:
                                                        res = _a.sent();
                                                        //-- Parse Secret String in res as JSON --//
                                                        if (res.SecretString) {
                                                            SecretStringJSON = JSON.parse(res.SecretString);
                                                            //-- Set Open API Key value --//
                                                            OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
                                                        }
                                                        else {
                                                            throw new Error("OpenAI SecretString is empty");
                                                        }
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); }, {
                                            retries: 2,
                                            minTimeout: 1000,
                                            factor: 2
                                        })];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    console.log(err_1);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/, OPENAI_API_KEY];
                            }
                        });
                    }); };
                    return [4 /*yield*/, getOpenAI_API_Key()];
                case 1:
                    OPENAI_API_KEY = _a.sent();
                    configuration = new openai_1.Configuration({
                        apiKey: OPENAI_API_KEY
                    });
                    OpenAIClient = new openai_1.OpenAIApi(configuration);
                    styles = [
                        "claymation",
                        "award winning 4K photography",
                        "flat art",
                        "geometric",
                        "anime",
                        "minimalism",
                        "3D illustration",
                        "futurism",
                        "synthwave",
                        "vector",
                    ];
                    animals = [
                        "dog",
                        "cat",
                        "squirrel",
                        "cow",
                        "koala bear",
                        "penguin",
                        "sloth",
                    ];
                    emotions = [
                        "sad",
                        "perplexed",
                        "confused",
                        "disappointed",
                        "frustrated",
                        "furious",
                        "irritated",
                    ];
                    styleLoopStopper = styles.length;
                    animallLoopStopper = animals.length;
                    emotionLoopStopper = emotions.length;
                    _loop_1 = function (emotionIdx) {
                        var emotion, _loop_2, animalIdx;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    emotion = emotions[emotionIdx];
                                    _loop_2 = function (animalIdx) {
                                        var animal, _loop_3, styleIdx;
                                        return __generator(this, function (_c) {
                                            switch (_c.label) {
                                                case 0:
                                                    animal = animals[animalIdx];
                                                    _loop_3 = function (styleIdx) {
                                                        var style, bucket, key, err_2;
                                                        return __generator(this, function (_d) {
                                                            switch (_d.label) {
                                                                case 0:
                                                                    style = styles[styleIdx];
                                                                    bucket = "sad-animal-404-images";
                                                                    key = "".concat(style, "/").concat(animal, "/").concat(emotion);
                                                                    console.log("about to create image for ".concat(style, ", ").concat(animal, ", ").concat(emotion));
                                                                    _d.label = 1;
                                                                case 1:
                                                                    _d.trys.push([1, 3, , 4]);
                                                                    return [4 /*yield*/, retry(function () { return __awaiter(_this, void 0, void 0, function () {
                                                                            var response, base64JSON, error_1;
                                                                            var _this = this;
                                                                            return __generator(this, function (_a) {
                                                                                switch (_a.label) {
                                                                                    case 0: return [4 /*yield*/, OpenAIClient.createImage({
                                                                                            prompt: "a cute ".concat(animal, " that is feeling ").concat(emotion, " because its computer crashed, ").concat(style),
                                                                                            n: 1,
                                                                                            size: "512x512",
                                                                                            response_format: "b64_json"
                                                                                        })];
                                                                                    case 1:
                                                                                        response = _a.sent();
                                                                                        base64JSON = response.data.data[0].b64_json;
                                                                                        console.log("saving to s3");
                                                                                        if (!base64JSON) return [3 /*break*/, 5];
                                                                                        _a.label = 2;
                                                                                    case 2:
                                                                                        _a.trys.push([2, 4, , 5]);
                                                                                        return [4 /*yield*/, retry(function () { return __awaiter(_this, void 0, void 0, function () {
                                                                                                var base64Buffer;
                                                                                                return __generator(this, function (_a) {
                                                                                                    switch (_a.label) {
                                                                                                        case 0:
                                                                                                            base64Buffer = Buffer.from(base64JSON, "base64");
                                                                                                            return [4 /*yield*/, s3_client.send(new client_s3_2.PutObjectCommand({
                                                                                                                    Body: base64Buffer,
                                                                                                                    Bucket: bucket,
                                                                                                                    Key: key
                                                                                                                }))];
                                                                                                        case 1:
                                                                                                            _a.sent();
                                                                                                            return [2 /*return*/];
                                                                                                    }
                                                                                                });
                                                                                            }); }, {
                                                                                                retries: 2,
                                                                                                minTimeout: 1000,
                                                                                                factor: 2
                                                                                            })];
                                                                                    case 3:
                                                                                        _a.sent();
                                                                                        console.log("success!");
                                                                                        return [3 /*break*/, 5];
                                                                                    case 4:
                                                                                        error_1 = _a.sent();
                                                                                        console.log("s3 error");
                                                                                        console.log(error_1);
                                                                                        return [3 /*break*/, 5];
                                                                                    case 5: return [2 /*return*/];
                                                                                }
                                                                            });
                                                                        }); }, {
                                                                            retries: 1,
                                                                            minTimeout: 1000,
                                                                            factor: 2
                                                                        })];
                                                                case 2:
                                                                    _d.sent();
                                                                    return [3 /*break*/, 4];
                                                                case 3:
                                                                    err_2 = _d.sent();
                                                                    console.log("generate image error");
                                                                    console.log(err_2);
                                                                    return [3 /*break*/, 4];
                                                                case 4: return [2 /*return*/];
                                                            }
                                                        });
                                                    };
                                                    styleIdx = 1;
                                                    _c.label = 1;
                                                case 1:
                                                    if (!(styleIdx < styleLoopStopper)) return [3 /*break*/, 4];
                                                    return [5 /*yield**/, _loop_3(styleIdx)];
                                                case 2:
                                                    _c.sent();
                                                    _c.label = 3;
                                                case 3:
                                                    styleIdx++;
                                                    return [3 /*break*/, 1];
                                                case 4: return [2 /*return*/];
                                            }
                                        });
                                    };
                                    animalIdx = 0;
                                    _b.label = 1;
                                case 1:
                                    if (!(animalIdx < animallLoopStopper)) return [3 /*break*/, 4];
                                    return [5 /*yield**/, _loop_2(animalIdx)];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3:
                                    animalIdx++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    emotionIdx = 0;
                    _a.label = 2;
                case 2:
                    if (!(emotionIdx < emotionLoopStopper)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(emotionIdx)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    emotionIdx++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (err) { return console.error(err); });
