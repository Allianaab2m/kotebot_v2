"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prefix = '!';
process.on('uncaughtException', function (err) {
    console.log(err);
});
const client = new discord_js_1.Client({
    intents: 32767,
});
client.once('ready', () => {
    console.log('Ready.');
    if (client.user) {
        console.log(client.user.tag);
        client.user.setActivity('kotebotv2', { type: 'LISTENING' });
    }
});
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!message.content.startsWith(prefix)) {
        return;
    }
    const [command, ...args] = message.content.slice(prefix.length).split(' ');
    switch (command) {
        case 'ping': {
            message.channel.send('Pong!');
            break;
        }
        case '募集': {
            const match_type_list = ['ランクマ', 'スタンダード', 'クイック', 'カスタム', 'カジュアル'];
            const require_member = Number(args[0]); // 必須
            let match_type = args[1]; // Option
            let others = args.slice(2).join('\n'); // Option
            if (isNaN(require_member)) {
                const err_embed = {
                    color: 0xff0000,
                    title: 'エラー:引数不足',
                    description: `募集人数が指定されていません。\n\`${prefix}募集 [募集人数] (マッチタイプ) (備考)\``
                };
                message.channel.send({ embeds: [err_embed] });
                break;
            }
            if (!match_type_list.includes(match_type) || match_type.length === 0) {
                match_type = 'なんでもOK';
            }
            if (others.length === 0) {
                others = '特になし';
            }
            const boshu_Embed = {
                color: 0x0099ff,
                title: `${(_a = message.member) === null || _a === void 0 ? void 0 : _a.displayName}の募集`,
                fields: [
                    {
                        name: '募集人数',
                        value: `あと${require_member}人`,
                        inline: true
                    },
                    {
                        name: '試合形式',
                        value: `${match_type}`,
                        inline: true,
                    },
                    {
                        name: '参加者',
                        value: `${(_b = message.member) === null || _b === void 0 ? void 0 : _b.displayName}`,
                        inline: true,
                    },
                    {
                        name: '備考',
                        value: `${others}`,
                        inline: true
                    }
                ],
                footer: {
                    text: `meta:${(_c = message.member) === null || _c === void 0 ? void 0 : _c.id}\n✋を付けて参加，外すと参加取り消し\n募集者のみ🚫を付けるとキャンセル\n募集者のみ📢で招集が可能。`
                },
                timestamp: new Date(),
            };
            const send_message = yield message.channel.send({ content: `<@${(_d = message.member) === null || _d === void 0 ? void 0 : _d.id}> が募集を開始しました！`, embeds: [boshu_Embed] });
            yield send_message.react('✋')
                .then(() => send_message.react('🚫'))
                .then(() => send_message.react('📢'));
        }
    }
}));
client.on('messageReactionAdd', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const emoji_arr = ['✋', '🚫', '📢'];
    if (user.bot) {
        return;
    }
    const boshu_Embed = reaction.message.embeds[0];
    const reaction_member = yield ((_e = reaction.message.guild) === null || _e === void 0 ? void 0 : _e.members.fetch(`${user.id}`));
    const boshu_member = yield ((_f = reaction.message.guild) === null || _f === void 0 ? void 0 : _f.members.fetch(`${(_g = boshu_Embed.footer) === null || _g === void 0 ? void 0 : _g.text.slice(5, 23)}`));
    const boshu_member_displayname = (_h = boshu_Embed.title) === null || _h === void 0 ? void 0 : _h.slice(0, -3);
    if (emoji_arr.includes(reaction.emoji.name)) {
        if ((reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName) !== boshu_member_displayname) { // 募集者でない場合
            if (reaction.emoji.name === emoji_arr[0]) { // 募集者以外が✋を付けた時
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) - 1;
                if (require_member === 0) {
                    boshu_Embed.fields[0].value = '締切';
                    boshu_Embed.fields[2].value += `,${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}`;
                }
                else if (require_member < 0) {
                    (_j = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _j === void 0 ? void 0 : _j.users.remove(reaction_member);
                    return;
                }
                else {
                    boshu_Embed.fields[0].value = `あと${require_member}人`;
                    boshu_Embed.fields[2].value += `,${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}`;
                }
                reaction.message.edit({ embeds: [boshu_Embed] });
                const notice_Embed = {
                    color: 0x0099ff,
                    title: `${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}がサーバー${(_k = reaction.message.guild) === null || _k === void 0 ? void 0 : _k.name}で参加リアクションを押しました！`,
                    description: `[募集メッセージリンク](https://discord.com/channels/${reaction.message.guildId}/${reaction.message.channelId}/${reaction.message.id})`
                };
                yield (boshu_member === null || boshu_member === void 0 ? void 0 : boshu_member.send({ embeds: [notice_Embed] })); // 募集者にDM
            }
            if (reaction.emoji.name === emoji_arr[2] || reaction.emoji.name === emoji_arr[1]) { // 募集者専用コマンドのスルー
                // reaction.message.reactions.cache.get(emoji_arr[1])?.users.remove(reaction_member)
                (_l = reaction.message.reactions.cache.get(emoji_arr[2])) === null || _l === void 0 ? void 0 : _l.users.remove(reaction_member);
            }
        }
        else { // 募集者が押した場合
            if (reaction.emoji.name === emoji_arr[0]) { // 募集者の✋を消す(あるとややこしいので)
                (_m = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _m === void 0 ? void 0 : _m.users.remove(reaction_member);
            }
            if (reaction.emoji.name === emoji_arr[1]) { // 募集者の🚫を処理 募集削除
                const del_Embed = {
                    color: 0x00ff00,
                    title: '募集を削除しました。',
                    footer: {
                        text: 'このメッセージは30秒後に削除されます。'
                    },
                    timestamp: new Date(),
                };
                yield reaction.message.reply({ embeds: [del_Embed] })
                    .then(msg => {
                    setTimeout(() => msg.delete(), 30000);
                });
                yield reaction.message.delete();
            }
            if (reaction.emoji.name === emoji_arr[2]) { // 募集者の📢を処理 参加者全員にメンション
                const reacted_user_id = [];
                let mention_str = '';
                (_o = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _o === void 0 ? void 0 : _o.users.cache.filter(user => !user.bot).each(user => reacted_user_id.push(user.id));
                if (reacted_user_id.length === 0) {
                    return;
                }
                for (let i = 0, len = reacted_user_id.length; i < len; i++) {
                    mention_str += `<@${reacted_user_id[i]}>,`;
                }
                mention_str += '募集への招集がかかっています！';
                reaction.message.channel.send(mention_str);
            }
        }
    }
}));
client.on('messageReactionRemove', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _p;
    const emoji_arr = ['✋', '🚫', '📢'];
    if (user.bot) {
        return;
    }
    const boshu_Embed = reaction.message.embeds[0];
    const reaction_member = yield ((_p = reaction.message.guild) === null || _p === void 0 ? void 0 : _p.members.fetch(`${user.id}`));
    if (emoji_arr.includes(reaction.emoji.name)) {
        if (reaction.emoji.name === emoji_arr[0]) {
            if (reaction_member) {
                const remove_user_display_name = reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName;
                const regExp = new RegExp(`,${remove_user_display_name}`, 'g');
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) + 1;
                boshu_Embed.fields[0].value = `あと${require_member}人`;
                boshu_Embed.fields[2].value = boshu_Embed.fields[2].value.replace(regExp, '');
                reaction.message.edit({ embeds: [boshu_Embed] });
            }
        }
    }
}));
client.login(process.env.DISCORD_TOKEN);
