import type { GuildMember, Message, Role, TextChannel } from "discord.js";

import { fetchSettings, SETTINGS } from "~/models/guilds.server";
import {
  constructDiscordLink,
  escapeDisruptiveContent,
  quoteMessageContent,
} from "~/helpers/discord";
import { simplifyString } from "~/helpers/string";

export const enum ReportReasons {
  anonReport = "anonReport",
  userWarn = "userWarn",
  userDelete = "userDelete",
  mod = "mod",
  spam = "spam",
  ping = "ping",
}
interface Report {
  reason: ReportReasons;
  message: Message;
  extra?: string;
  staff?: GuildMember[];
  members?: GuildMember[];
}

const warningMessages = new Map<
  string,
  { warnings: number; message: Message }
>();
export const reportUser = async ({
  reason,
  message,
  extra,
  staff = [],
  members = [],
}: Report) => {
  const { guild } = message;
  if (!guild) throw new Error("Tried to report a message without a guild");
  const simplifiedContent = `${message.author.id}${simplifyString(
    message.content,
  )}`;
  const cached = warningMessages.get(simplifiedContent);

  const { moderator: moderatorId } = await fetchSettings(guild, [
    SETTINGS.moderator,
  ]);

  const staffRole = (await guild.roles.fetch(moderatorId)) as Role;

  const logBody = constructLog({
    reason,
    message,
    staffRole,
    extra,
    staff,
    members,
  });

  if (cached) {
    // If we already logged for ~ this message, edit the log
    const { message, warnings: oldWarnings } = cached;
    const warnings = oldWarnings + 1;

    const finalLog = logBody.replace(
      /warned \d times/,
      `warned ${warnings} times`,
    );

    message.edit(finalLog);
    warningMessages.set(simplifiedContent, { warnings, message });
    return warnings;
  } else {
    // If this is new, send a new message
    const { modLog: modLogId } = await fetchSettings(guild, [SETTINGS.modLog]);

    const modLog = (await guild.channels.fetch(modLogId)) as TextChannel;
    modLog.send(logBody).then((warningMessage) => {
      warningMessages.set(simplifiedContent, {
        warnings: 1,
        message: warningMessage,
      });
    });
    return 1;
  }
};

// Discord's limit for message length
const maxMessageLength = 2000;
export const truncateMessage = (
  message: string,
  maxLength = maxMessageLength - 500,
) => {
  if (message.length > maxLength) return `${message.slice(0, maxLength)}…`;

  return message;
};

const constructLog = ({
  reason,
  message,
  staffRole,
  extra: origExtra = "",
  staff = [],
  members = [],
}: Report & { staffRole: Role }): string => {
  const modAlert = `<@${staffRole.id}>`;
  const preface = `<@${message.author.id}> in <#${message.channel.id}> warned 1 times`;
  const extra = origExtra ? `${origExtra}\n` : "";
  const postfix = `Link: ${constructDiscordLink(message)}

${
  members.length
    ? `Reactors: ${members.map(({ user }) => user.username).join(", ")}\n`
    : ""
}${
    staff.length
      ? `Staff: ${staff.map(({ user }) => user.username).join(", ")}`
      : ""
  }
`;
  const reportedMessage = truncateMessage(
    escapeDisruptiveContent(quoteMessageContent(message.content)),
  );

  switch (reason) {
    case ReportReasons.mod:
      return `${preface}:
${extra}
${reportedMessage}

${postfix}`;

    case ReportReasons.userWarn:
      return `${modAlert} – ${preface}, met the warning threshold for the message:
${extra}
${reportedMessage}

${postfix}`;

    case ReportReasons.userDelete:
      return `${modAlert} – ${preface}, met the deletion threshold for the message:
${extra}
${reportedMessage}

${postfix}`;

    case ReportReasons.spam:
      return `${preface}, reported for spam:
${extra}
${reportedMessage}

${postfix}`;

    case ReportReasons.ping:
      return `${preface}, pinged everyone:
${extra}
${reportedMessage}

${postfix}`;

    case ReportReasons.anonReport:
      return `${preface}, reported anonymously:
${extra}
${reportedMessage}

${postfix}`;
  }
};
