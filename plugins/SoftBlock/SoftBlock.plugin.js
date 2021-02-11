/**
 * @name SoftBlock
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/Notavone/BDAddons
 * @source https://raw.githubusercontent.com/Notavone/BDAddons/master/plugins/SoftBlock/SoftBlock.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"main":"index.js","info":{"name":"SoftBlock","authors":[{"name":"Notavone","github_username":"notavone"}],"version":"1.0.0","description":"Désactive l'affichage des messages des gens que vous appréciez assez pour ne pas les bloquer","github":"https://github.com/Notavone/BDAddons","github_raw":"https://raw.githubusercontent.com/Notavone/BDAddons/master/plugins/SoftBlock/SoftBlock.plugin.js"},"changelog":[],"defaultConfig":[{"type":"textbox","id":"blocked","name":"Bloqués","note":"Identifiants des personnes à bloquer séparés par \",\"","value":"","placeholder":"178896511378259968, 416275248153886720"},{"type":"textbox","id":"servers","name":"Serveurs impactés","note":"Identifiants des serveurs à impacter séparés par \",\"","value":"","placeholder":"727082219318935562, 700448965661032550"},{"type":"switch","id":"useEverywhere","name":"Activer partout","note":"Outrepasse les permissions des serveurs impactés","value":true},{"type":"switch","id":"showDm","name":"Afficher les DM","note":"Laisser visible les messages dans les messages privés","value":false},{"type":"switch","id":"showGuild","name":"Afficher dans les serveurs","note":"Laisser visible les messages dans les salons des serveurs","value":false},{"type":"switch","id":"showTyping","name":"Afficher \"en train d'écrire\"","note":"Laisser visible qui est en train d'écrire","value":true},{"type":"switch","id":"showReplies","name":"Afficher les réponses","note":"Laisser visible les réponses aux messages","value":false},{"type":"switch","id":"showMembers","name":"Afficher dans la liste des membres","note":"Laisser visible les personnes bloqués dans la liste des membres","value":false}]};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

    const {Logger, Patcher, DiscordAPI} = Library;

    return class SoftBlock extends Plugin {
        removeTyping(guild, channel, blocked) {
            let typingElement = Array.from(document.querySelectorAll("div[class^='typing']"))[0];
            if (typingElement) {
                let membersSpan = typingElement.children[1];
                Array.from(membersSpan.children).filter((child) => child.tagName === "STRONG").forEach((strongElement) => {
                    let guildMember = guild.members.find((member) => member.name === strongElement.innerText);
                    if (blocked.includes(guildMember.userId)) {
                        strongElement.style.display = "none";
                    }
                    if (Array.from(membersSpan.children).filter((child) => child.style.display !== "none").length === 0) typingElement.style.display = "none";
                })
            }
        }

        removeReplies(guild, blocked) {
            let replies = Array.from(document.querySelectorAll("div[class^='repliedMessage']"));
            replies.forEach((reply) => {
                let presumeSpan = reply.children.length > 3 ? reply.children[2] : reply.children[1];
                if (presumeSpan.tagName === "SPAN") {
                    let fullText = presumeSpan.innerText;
                    let nick = fullText.startsWith("@") ? fullText.substring(1) : fullText;
                    let dMember = guild.members.find((member) => member.name === nick && blocked.includes(member.userId));
                    if (dMember) reply.style.display = "none"
                }
            })
        }

        removeMembers(guild, blocked) {
            let members = document.querySelectorAll("div[class^='member-']");
            members.forEach((memberElement) => {
                let nick = memberElement.children[0].children[1].children[0].children[0].children[0].innerText;
                let guildMember = guild.members.find((member) => member.name === nick || member.nickname === nick);
                if (blocked.includes(guildMember.userId)) {
                    let previousSibling = memberElement.previousSibling;
                    memberElement.style.display = "none";
                    while (previousSibling.tagName !== 'H2') previousSibling = previousSibling.previousSibling;
                    // let memberCount = previousSibling.firstChild.innerText.split("").pop();
                    // if (memberCount === "1" || previousSibling.nextSibling.tagName === "H2") {
                    //     previousSibling.style.display = "none"
                    // }
                    let nextNode = previousSibling.nextSibling ? previousSibling.nextSibling : previousSibling;
                    let elements = [];
                    while (nextNode.tagName !== 'H2') {
                        elements.push(nextNode);
                        if (nextNode.nextSibling) nextNode = nextNode.nextSibling;
                        else break
                    }
                    if (elements.filter((elem) => elem.style.display !== "none").length === 0) previousSibling.style.display = "none";
                }
            })
        }

        removeTextMessages(channel, blocked) {
            let blockedMessage = channel.messages.filter((message) => message.author !== null && blocked.includes(message.author.id));
            blockedMessage.forEach((message) => {
                let elem = document.getElementById("chat-messages-" + message.id);
                if (elem) elem.style.display = "none"
            })
        }

        onStart() {
            Logger.log("Started");
            Patcher.before(Logger, "log", (t, a) => {
                a[0] = "Patched Message: " + a[0];
            });
        }

        onStop() {
            Logger.log("Stopped");
            Patcher.unpatchAll();
        }

        getSettingsPanel() {
            const panel = this.buildSettingsPanel();
            return panel.getElement();
        }

        async observer() {
            try {

                let blocked = this.settings["blocked"].split(/,\s?/);
                let servers = this.settings["servers"].split(/,\s?/);
                let {showDm, showGuild, showTyping, showReplies, showMembers, useEverywhere} = this.settings;
                let channel = DiscordAPI.currentChannel;
                let guild = DiscordAPI.currentGuild;

                if (useEverywhere || (guild && servers.includes(guild.id))) {
                    if (!showTyping) await this.removeTyping(guild, channel, blocked);
                    if (!showMembers) await this.removeMembers(guild, blocked);
                    if (!showReplies) await this.removeReplies(guild, blocked);

                    if (channel) {
                        let canExecuteInDM = !showDm && channel.type === "GUILD_TEXT";
                        let canExecuteInGuild = !showGuild && channel.type === "GUILD_TEXT";
                        if (canExecuteInDM || canExecuteInGuild) {
                            await this.removeTextMessages(channel, blocked)
                        }
                    }
                }
            } catch (e) {
                return console.log(e);
            }
        }
    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/