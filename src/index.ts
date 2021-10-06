import { Client, Message, MessageReaction, User, PartialMessageReaction, PartialUser, GuildMember } from 'discord.js'
import * as dotenv from 'dotenv'

dotenv.config()

const prefix = '!'

process.on('uncaughtException', function(err) {
    console.log(err)
})

const client = new Client({
    intents: 32767,
})

client.once('ready', () => {
    console.log('Ready.')
    if (client.user) {
        console.log(client.user.tag)
        client.user.setActivity('kotebotv2', { type: 'LISTENING' })
    }
})

client.on('messageCreate', async (message: Message) => {
    if (!message.content.startsWith(prefix)) {
        return
    }
    const [command, ...args] = message.content.slice(prefix.length).split(' ')
    switch (command) {
        case 'ping': {
            message.channel.send('Pong!')
            break
        }

        case '募集': {
            const match_type_list = ['ランクマ', 'スタンダード', 'クイック', 'カスタム', 'カジュアル']
            const require_member = Number(args[0]) // 必須
            let match_type = args[1] // Option
            let others = args.slice(2).join('\n') // Option
            if (isNaN(require_member)) {
                const err_embed = {
                    color: 0xff0000,
                    title: 'エラー:引数不足',
                    description: `募集人数が指定されていません。\n\`${prefix}募集 [募集人数] (マッチタイプ) (備考)\``
                }
                message.channel.send({ embeds: [err_embed] })
                break
            }

            if (!match_type_list.includes(match_type) || match_type.length === 0) {
                match_type = 'なんでもOK'
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

            const send_message = await message.channel.send({content: `<@${message.member?.id}> が募集を開始しました！`, embeds: [boshu_Embed] })
            await send_message.react('✋')
                .then(() => send_message.react('🚫'))
                .then(() => send_message.react('📢'))
        }
    }
})

client.on('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const emoji_arr: string[] = ['✋', '🚫', '📢']
    if (user.bot) {
        return
    }

    const boshu_Embed = reaction.message.embeds[0]
    const reaction_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${user.id}`)
    const boshu_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${boshu_Embed.footer?.text!.slice(5,23)}`)
    const boshu_member_displayname = boshu_Embed.title?.slice(0, -3)

    if (emoji_arr.includes(reaction.emoji.name!)) {
        if (reaction_member?.displayName !== boshu_member_displayname) { // 募集者でない場合
            if (reaction.emoji.name === emoji_arr[0]) {  // 募集者以外が✋を付けた時
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) - 1
                if (require_member === 0) {
                    boshu_Embed.fields[0].value = '締切'
                    boshu_Embed.fields[2].value += `,${reaction_member?.displayName}`
                } else if (require_member < 0) {
                    reaction.message.reactions.cache.get(emoji_arr[0])?.users.remove(reaction_member)
                    return
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
                // reaction.message.reactions.cache.get(emoji_arr[1])?.users.remove(reaction_member)
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
            }
        }
    }
})

client.on('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    const emoji_arr: string[] = ['✋', '🚫', '📢']
    if (user.bot) {
        return
    }

    const boshu_Embed = reaction.message.embeds[0]
    const reaction_member: GuildMember | undefined = await reaction.message.guild?.members.fetch(`${user.id}`)
    if (emoji_arr.includes(reaction.emoji.name!)) {
        if (reaction.emoji.name === emoji_arr[0]) {
            if (reaction_member) {
                const remove_user_display_name = reaction_member?.displayName
                const regExp = new RegExp(`,${remove_user_display_name}`, 'g')
                const require_member = Number(boshu_Embed.fields[0].value.slice(2, -1)) + 1
                boshu_Embed.fields[0].value = `あと${require_member}人`
                boshu_Embed.fields[2].value = boshu_Embed.fields[2].value.replace(regExp, '')
                reaction.message.edit({embeds: [boshu_Embed]})
            }
        }
    }
})

client.login(process.env.DISCORD_TOKEN)
