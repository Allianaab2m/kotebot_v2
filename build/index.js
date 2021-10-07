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
const fs = __importStar(require("fs"));
dotenv.config();
const prefix = 'こてぼっと ';
process.on('uncaughtException', function (err) {
    console.log(err);
});
const client = new discord_js_1.Client({
    intents: 32767,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
client.once('ready', () => {
    console.log('Ready.');
    if (client.user) {
        console.log(client.user.tag);
        client.user.setActivity('こてぼっとv2', { type: 'LISTENING' });
    }
});
client.on('messageCreate', (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (!message.content.startsWith(prefix)) { // prefixから始まっていないメッセージは無視する
        return;
    }
    const [command, ...args] = message.content.slice(prefix.length).split(' '); // command: コマンド自体 args: 引数すべて
    switch (command) { // コマンドに応じて処理を切り替え
        case 'ping': { // pingコマンド
            message.channel.send('Pong!');
            break;
        }
        case '募集': { // 募集コマンド
            const match_type_list = ['ランクマ', 'スタンダード', 'クイック', 'カスタム', 'カジュアル'];
            const require_member = Number(args[0]); // 必須
            let match_type = args[1]; // Option
            let others = args.slice(2).join('\n'); // Option
            if (isNaN(require_member)) { // 必須引数が不足している場合
                const err_embed = {
                    color: 0xff0000,
                    title: 'エラー:引数不足',
                    description: `エラーが発生しました。以下の理由が挙げられます。\n・募集人数が指定されていない\n\`${prefix}募集 [募集人数] (マッチタイプ) (備考)\``
                };
                message.channel.send({ embeds: [err_embed] });
                break;
            }
            if (!match_type_list.includes(match_type) || match_type.length === 0) {
                match_type = 'なんでもOK'; // オプション引数がない場合，Embedに入れる文字列を用意する
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
            const send_message = yield message.channel.send({ content: `${(_d = message.member) === null || _d === void 0 ? void 0 : _d.user.tag}が募集を開始しました！`, embeds: [boshu_Embed] });
            yield send_message.react('✋') // リアクションによって操作
                .then(() => send_message.react('🚫'))
                .then(() => send_message.react('📢'));
            break;
        }
        case '追加': { // 追加コマンド
            const add_list = []; // jsonに格納する
            const err_embed = {
                color: 0xff0000,
                title: 'エラー:引数不足',
                description: `エラーが発生しました。以下の理由が挙げられます。\n・引数が指定されていない\n\`${prefix}追加 [キャラ]\``,
                timestamp: new Date()
            };
            if (args.length === 0) {
                message.channel.send({ embeds: [err_embed] });
                return;
            }
            const json = fs.readFileSync('./lib/poke_list.json', 'utf8');
            const poke_name_convert_object = JSON.parse(json);
            const poke_keys = Object.keys(poke_name_convert_object);
            for (let i = 0, len = args.length; i < len; i++) {
                if (poke_keys.includes(args[i])) {
                    add_list.push(poke_name_convert_object[`${args[i]}`]);
                }
            }
            const json_data = { 'chara': add_list, 'time': new Date() };
            const chara_str = add_list.join('\n');
            const normal_Embed = {
                color: 0x0099ff,
                title: '追加完了',
                fields: [
                    {
                        name: '使用キャラ',
                        value: `${chara_str}`,
                        inline: true
                    }
                ],
                timestamp: new Date()
            };
            fs.writeFileSync(`./.data/chara/${(_e = message.author) === null || _e === void 0 ? void 0 : _e.id}.json`, JSON.stringify(json_data));
            message.channel.send({ embeds: [normal_Embed] });
            break;
        }
        case '参照': {
            args[0] = args.join(' ');
            const request_member = (_f = message.guild) === null || _f === void 0 ? void 0 : _f.members.cache.find(member => member.displayName === args[0] || member.user.username === args[0]);
            const err_embed = {
                color: 0xff0000,
                title: 'エラー:参照対象不明',
                description: `エラーが発生しました。以下の理由が挙げられます。\n・参照対象が追加コマンドを実行していない\n・参照対象が指定されていない\n・このサーバー上で参照対象が見つからない\n\`${prefix}参照 [ニックネーム|名前]\``,
                timestamp: new Date()
            };
            if (!request_member) {
                message.channel.send({ embeds: [err_embed] });
                return;
            }
            if (fs.existsSync(`./.data/chara/${request_member.id}.json`)) {
                const json = fs.readFileSync(`./.data/chara/${request_member === null || request_member === void 0 ? void 0 : request_member.id}.json`, 'utf8');
                const json_data = JSON.parse(json);
                const chara_str = json_data['chara'].join('\n');
                const chara_Embed = {
                    color: 0x0099ff,
                    thumbnail: {
                        url: `${request_member.user.displayAvatarURL()}`
                    },
                    title: `参照:${request_member.displayName}`,
                    fields: [
                        {
                            name: '使用キャラ',
                            value: `${chara_str}`,
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };
                message.channel.send({ embeds: [chara_Embed] });
            }
            else {
                message.channel.send({ embeds: [err_embed] });
                return;
            }
            break;
        }
        case 'ヘルプ': {
            const help_Embed = {
                color: 0x0099ff,
                title: 'ヘルプコマンド',
                description: '[詳細はこちら](https://allianaab2m.github.io/topics/Tech/teamupbot_reference)',
                fields: [
                    {
                        name: '募集 [募集人数] (マッチタイプ) (備考)',
                        value: '募集を行います。',
                        inline: true
                    },
                    {
                        name: '追加 [キャラ]',
                        value: '使えるキャラの追加を行います。キャラは半角スペースで繋ぐことで複数追加できます。',
                        inline: true
                    },
                    {
                        name: '参照 [名前]',
                        value: '引数に指定した人の使えるキャラを参照します。',
                        inline: true
                    },
                    {
                        name: 'ヘルプ',
                        value: 'このヘルプを表示します。',
                        inline: true
                    },
                    {
                        name: 'レポジトリ',
                        value: 'GitHubレポジトリへのリンクを表示します。',
                        inlune: true
                    }
                ],
                timestamp: new Date()
            };
            message.channel.send({ embeds: [help_Embed] });
            break;
        }
        case 'レポジトリ': {
            const repo_Embed = {
                color: 0x0099ff,
                title: 'こてぼっとのコードはこちら',
                url: 'https://github.com/allianaab2m/kotebot_v2',
                footer: {
                    text: '宣伝:絶賛リファクタリング，PR募集中です。'
                },
                timestamp: new Date()
            };
            message.channel.send({ embeds: [repo_Embed] });
            break;
        }
    }
    console.log(`Command Handled: ${command}\nRequested by: ${message.author.tag}\nArgs: ${args}`);
}));
client.on('messageReactionAdd', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const emoji_arr = ['✋', '🚫', '📢'];
    if (user.bot) {
        return;
    }
    if (reaction.partial) {
        try {
            yield reaction.fetch();
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
    const boshu_Embed = reaction.message.embeds[0];
    if (!boshu_Embed.footer) { // 募集メッセージじゃない場合
        return;
    }
    const reaction_member = yield ((_g = reaction.message.guild) === null || _g === void 0 ? void 0 : _g.members.fetch(`${user.id}`));
    const boshu_member = yield ((_h = reaction.message.guild) === null || _h === void 0 ? void 0 : _h.members.fetch(`${(_j = boshu_Embed.footer) === null || _j === void 0 ? void 0 : _j.text.slice(5, 23)}`));
    const boshu_member_displayname = (_k = boshu_Embed.title) === null || _k === void 0 ? void 0 : _k.slice(0, -3);
    if (emoji_arr.includes(reaction.emoji.name)) {
        if ((reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName) !== boshu_member_displayname) { // 募集者でない場合
            if (reaction.emoji.name === emoji_arr[0]) { // 募集者以外が✋を付けた時
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) - 1;
                if (boshu_Embed.fields[0].value === '締切') {
                    (_l = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _l === void 0 ? void 0 : _l.users.remove(reaction_member);
                    return;
                }
                else if (require_member === 0) {
                    boshu_Embed.fields[0].value = '締切';
                    boshu_Embed.fields[2].value += `,${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}`;
                }
                else {
                    boshu_Embed.fields[0].value = `あと${require_member}人`;
                    boshu_Embed.fields[2].value += `,${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}`;
                }
                reaction.message.edit({ embeds: [boshu_Embed] });
                const notice_Embed = {
                    color: 0x0099ff,
                    title: `${reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName}がサーバー${(_m = reaction.message.guild) === null || _m === void 0 ? void 0 : _m.name}で参加リアクションを押しました！`,
                    description: `[募集メッセージリンク](https://discord.com/channels/${reaction.message.guildId}/${reaction.message.channelId}/${reaction.message.id})`
                };
                yield (boshu_member === null || boshu_member === void 0 ? void 0 : boshu_member.send({ embeds: [notice_Embed] })); // 募集者にDM
            }
            if (reaction.emoji.name === emoji_arr[2] || reaction.emoji.name === emoji_arr[1]) { // 募集者専用コマンドのスルー
                (_o = reaction.message.reactions.cache.get(emoji_arr[1])) === null || _o === void 0 ? void 0 : _o.users.remove(reaction_member);
                (_p = reaction.message.reactions.cache.get(emoji_arr[2])) === null || _p === void 0 ? void 0 : _p.users.remove(reaction_member);
            }
        }
        else { // 募集者が押した場合
            if (reaction.emoji.name === emoji_arr[0]) { // 募集者の✋を消す(あるとややこしいので)
                (_q = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _q === void 0 ? void 0 : _q.users.remove(reaction_member);
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
                (_r = reaction.message.reactions.cache.get(emoji_arr[0])) === null || _r === void 0 ? void 0 : _r.users.cache.filter(user => !user.bot).each(user => reacted_user_id.push(user.id));
                if (reacted_user_id.length === 0) {
                    return;
                }
                for (let i = 0, len = reacted_user_id.length; i < len; i++) {
                    mention_str += `<@${reacted_user_id[i]}>,`;
                }
                mention_str += '募集への招集がかかっています！';
                reaction.message.channel.send(mention_str);
                (_s = reaction.message.reactions.cache.get(emoji_arr[2])) === null || _s === void 0 ? void 0 : _s.users.remove(reaction_member);
            }
        }
    }
}));
client.on('messageReactionRemove', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _t, _u;
    const emoji_arr = ['✋', '🚫', '📢'];
    const boshu_Embed = reaction.message.embeds[0];
    if (user.tag === ((_t = reaction.message.content) === null || _t === void 0 ? void 0 : _t.slice(0, -11))) { // 募集者が押した時，無視する
        return;
    }
    if (reaction.partial) {
        try {
            yield reaction.fetch();
        }
        catch (error) {
            console.log(error);
            return;
        }
    }
    const reaction_member = yield ((_u = reaction.message.guild) === null || _u === void 0 ? void 0 : _u.members.fetch(`${user.id}`));
    if (reaction.emoji.name === emoji_arr[0]) { // ✋の場合
        if (reaction_member) {
            const remove_user_display_name = reaction_member === null || reaction_member === void 0 ? void 0 : reaction_member.displayName; // ニックネームを取得
            const regExp = new RegExp(`,${remove_user_display_name}`, 'g'); // 置き換え(よくわからん)
            if (boshu_Embed.fields[2].value.indexOf(`${remove_user_display_name}`) != -1) { // 参加者として含まれている人がリアクションを外した時のみ処理
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) + 1; // あとX人表記を+1(締切の場合は必ず1になってくれる)
                boshu_Embed.fields[0].value = `あと${require_member}人`; // 募集人数fieldのアップデート
                boshu_Embed.fields[2].value = boshu_Embed.fields[2].value.replace(regExp, ''); // 参加者fieldのアップデート
                reaction.message.edit({ embeds: [boshu_Embed] });
            }
        }
    }
}));
client.login(process.env.DISCORD_TOKEN);
