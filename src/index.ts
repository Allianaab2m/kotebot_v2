import { Client, Message, MessageReaction, User, PartialMessageReaction, PartialUser, GuildMember } from 'discord.js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config()

const prefix = 'こてぼっと '

process.on('uncaughtException', function(err) {
    console.log(err)
})

const client = new Client({
    intents: 32767,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
})

client.once('ready', () => {
    console.log('Ready.')
    if (client.user) {
        console.log(client.user.tag)
        client.user.setActivity('こてぼっとv2', { type: 'LISTENING' })
    }
})

client.on('messageCreate', async (message: Message) => {
    if (!message.content.startsWith(prefix)) { // prefixから始まっていないメッセージは無視する
        return
    }
    const [command, ...args] = message.content.slice(prefix.length).split(' ') // command: コマンド自体 args: 引数すべて
    switch (command) { // コマンドに応じて処理を切り替え
        case 'ping': { // pingコマンド
            message.channel.send('Pong!')
            break
        }

        case '募集': { // 募集コマンド
            const match_type_list = ['ランクマ', 'スタンダード', 'クイック', 'カスタム', 'カジュアル']
            const require_member = Number(args[0]) // 必須
            let match_type = args[1] // Option
            let others = args.slice(2).join('\n') // Option
            if (isNaN(require_member)) { // 必須引数が不足している場合
                const err_embed = {
                    color: 0xff0000,
                    title: 'エラー:引数不足',
                    description: `エラーが発生しました。以下の理由が挙げられます。\n・募集人数が指定されていない\n\`${prefix}募集 [募集人数] (マッチタイプ) (備考)\``
                }
                message.channel.send({ embeds: [err_embed] })
                break
            }

            if (!match_type_list.includes(match_type) || match_type.length === 0) {
                match_type = 'なんでもOK' // オプション引数がない場合，Embedに入れる文字列を用意する
            }

            if (others.length === 0) {
                others = '特になし'
            }

            const boshu_Embed = {
                color: 0x0099ff,
                title: `${message.member?.displayName}の募集`,
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
                        value: `${message.member?.displayName}`,
                        inline: true,
                    },
                    {
                        name: '備考',
                        value: `${others}`,
                        inline: true
                    }
                ],
                footer: {
                    text: `meta:${message.member?.id}\n✋を付けて参加，外すと参加取り消し\n募集者のみ🚫を付けるとキャンセル\n募集者のみ📢で招集が可能。`
                },
                timestamp: new Date(),
            }

            const send_message = await message.channel.send({content: `${message.member?.user.tag}が募集を開始しました！`, embeds: [boshu_Embed] })
            await send_message.react('✋') // リアクションによって操作
                .then(() => send_message.react('🚫'))
                .then(() => send_message.react('📢'))
            break
        }

        case '追加': { // 追加コマンド
            const add_list = [] // jsonに格納する
            const err_embed = {
                color: 0xff0000,
                title: 'エラー:引数不足',
                description: `エラーが発生しました。以下の理由が挙げられます。\n・引数が指定されていない\n\`${prefix}追加 [キャラ]\``,
                timestamp: new Date()
            }
            if (args.length === 0) {
                message.channel.send({ embeds: [err_embed] })
                return
            }
            const json = fs.readFileSync('./lib/poke_list.json', 'utf8')
            const poke_name_convert_object = JSON.parse(json)
            const poke_keys = Object.keys(poke_name_convert_object)
            for (let i = 0, len = args.length; i < len; i++){
                if (poke_keys.includes(args[i])) {
                    add_list.push(poke_name_convert_object[`${args[i]}`])
                }
            }
            const json_data = { 'chara': add_list, 'time': new Date() }
            const chara_str = add_list.join('\n')
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
            }
            fs.writeFileSync(`./.data/chara/${message.author?.id}.json`, JSON.stringify(json_data))
            message.channel.send({embeds: [normal_Embed]})
            break
        }

        case '参照': {
            args[0] = args.join(' ')
            const request_member = message.guild?.members.cache.find(member => member.displayName === args[0] || member.user.username === args[0])
            const err_embed = {
                color: 0xff0000,
                title: 'エラー:参照対象不明',
                description: `エラーが発生しました。以下の理由が挙げられます。\n・参照対象が追加コマンドを実行していない\n・参照対象が指定されていない\n・このサーバー上で参照対象が見つからない\n\`${prefix}参照 [ニックネーム|名前]\``,
                timestamp: new Date()
            }
            if (!request_member) {
                message.channel.send({embeds: [err_embed]})
                return
            }
            if (fs.existsSync(`./.data/chara/${request_member.id}.json`)) {
                const json = fs.readFileSync(`./.data/chara/${request_member?.id}.json`, 'utf8')
                const json_data = JSON.parse(json)
                const chara_str = json_data['chara'].join('\n')
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
                }
                message.channel.send({embeds: [chara_Embed]})
            } else {
                message.channel.send({embeds: [err_embed]})
                return
            }
            break
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
            }
            message.channel.send({embeds: [help_Embed]})
            break
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
            }
            message.channel.send({ embeds: [repo_Embed] })
            break
        }
    }
    console.log(`Command Handled: ${command}\nRequested by: ${message.author.tag}\nArgs: ${args}`)
})

client.on('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const emoji_arr: string[] = ['✋', '🚫', '📢']
    if (user.bot) {
        return
    }
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (error) {
            console.log(error)
            return
        }
    }

    const boshu_Embed = reaction.message.embeds[0]
    if (!boshu_Embed.footer) { // 募集メッセージじゃない場合
        return
    }
    const reaction_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${user.id}`)
    const boshu_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${boshu_Embed.footer?.text!.slice(5,23)}`)
    const boshu_member_displayname = boshu_Embed.title?.slice(0, -3)

    if (emoji_arr.includes(reaction.emoji.name!)) {
        if (reaction_member?.displayName !== boshu_member_displayname) { // 募集者でない場合
            if (reaction.emoji.name === emoji_arr[0]) {  // 募集者以外が✋を付けた時
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) - 1
                if (boshu_Embed.fields[0].value === '締切') {
                    reaction.message.reactions.cache.get(emoji_arr[0])?.users.remove(reaction_member)
                    return
                } else if (require_member === 0) {
                    boshu_Embed.fields[0].value = '締切'
                    boshu_Embed.fields[2].value += `,${reaction_member?.displayName}`
                } else {
                    boshu_Embed.fields[0].value = `あと${require_member}人`
                    boshu_Embed.fields[2].value += `,${reaction_member?.displayName}`
                }
                reaction.message.edit({ embeds: [boshu_Embed] })
                const notice_Embed = {
                    color: 0x0099ff,
                    title: `${reaction_member?.displayName}がサーバー${reaction.message.guild?.name}で参加リアクションを押しました！`,
                    description: `[募集メッセージリンク](https://discord.com/channels/${reaction.message.guildId}/${reaction.message.channelId}/${reaction.message.id})`
                }
                await boshu_member?.send({embeds: [notice_Embed]}) // 募集者にDM
            }
            if (reaction.emoji.name === emoji_arr[2] || reaction.emoji.name === emoji_arr[1]) { // 募集者専用コマンドのスルー
                reaction.message.reactions.cache.get(emoji_arr[1])?.users.remove(reaction_member)
                reaction.message.reactions.cache.get(emoji_arr[2])?.users.remove(reaction_member)
            }
        } else { // 募集者が押した場合
            if (reaction.emoji.name === emoji_arr[0]) { // 募集者の✋を消す(あるとややこしいので)
                reaction.message.reactions.cache.get(emoji_arr[0])?.users.remove(reaction_member)
            }
            if (reaction.emoji.name === emoji_arr[1]) { // 募集者の🚫を処理 募集削除
                const del_Embed = {
                    color: 0x00ff00,
                    title: '募集を削除しました。',
                    footer: {
                        text: 'このメッセージは30秒後に削除されます。'
                    },
                    timestamp: new Date(),
                }
                await reaction.message.reply({embeds: [del_Embed] })
                    .then(msg => {
                        setTimeout(() => msg.delete(), 30000)
                    })
                await reaction.message.delete()
            }
            if (reaction.emoji.name === emoji_arr[2]) { // 募集者の📢を処理 参加者全員にメンション
                const reacted_user_id: string[] = []
                let mention_str = ''
                reaction.message.reactions.cache.get(emoji_arr[0])?.users.cache.filter(user => !user.bot).each(user => reacted_user_id.push(user.id))
                if (reacted_user_id.length === 0) {
                    return
                }
                for (let i = 0, len = reacted_user_id.length; i < len; i++){
                    mention_str += `<@${reacted_user_id[i]}>,`
                }
                mention_str += '募集への招集がかかっています！'
                reaction.message.channel.send(mention_str)
                reaction.message.reactions.cache.get(emoji_arr[2])?.users.remove(reaction_member)
            }
        }
    }
})

client.on('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const emoji_arr: string[] = ['✋', '🚫', '📢']
    const boshu_Embed = reaction.message.embeds[0]
    if (user.tag === reaction.message.content?.slice(0, -11)) { // 募集者が押した時，無視する
        return
    }
    if (reaction.partial) {
        try {
            await reaction.fetch()
        } catch (error) {
            console.log(error)
            return
        }
    }

    const reaction_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${user.id}`)
    if (reaction.emoji.name === emoji_arr[0]) { // ✋の場合
        if (reaction_member) {
            const remove_user_display_name = reaction_member?.displayName // ニックネームを取得
            const regExp = new RegExp(`,${remove_user_display_name}`, 'g') // 置き換え(よくわからん)
            if (boshu_Embed.fields[2].value.indexOf(`${remove_user_display_name}`) != -1) { // 参加者として含まれている人がリアクションを外した時のみ処理
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) + 1 // あとX人表記を+1(締切の場合は必ず1になってくれる)
                boshu_Embed.fields[0].value = `あと${require_member}人` // 募集人数fieldのアップデート
                boshu_Embed.fields[2].value = boshu_Embed.fields[2].value.replace(regExp, '') // 参加者fieldのアップデート
                reaction.message.edit({ embeds: [boshu_Embed] })
            }
        }
    }
})

client.login(process.env.DISCORD_TOKEN)