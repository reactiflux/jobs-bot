import type { AnyThreadChannel } from "discord.js";
import type { UserInfo } from "reacord";
import { Button } from "reacord";

import type { Resolution } from "~/helpers/modResponse";
import { humanReadableResolutions } from "~/helpers/modResponse";
import { resolutions, useVotes } from "~/helpers/modResponse";

const VOTES_TO_APPROVE = 3;

export const ModResponse = ({
  votesRequired = VOTES_TO_APPROVE,
  onVote,
  onResolve,
  modRoleId,
}: {
  votesRequired?: number;
  onVote: (result: { vote: Resolution; user: UserInfo }) => void;
  onResolve: (result: Resolution) => Promise<void>;
  modRoleId: string;
}) => {
  const { votes, recordVote } = useVotes();

  const renderButton = (
    votes: Record<Resolution, string[]>,
    resolution: Resolution,
    label: string,
    style: "secondary" | "primary" | "success" | "danger" = "secondary",
  ) => (
    <Button
      label={label}
      style={style}
      onClick={async (event) => {
        if (!event.guild?.member.roles?.includes(modRoleId)) {
          return;
        }
        try {
          onVote({ vote: resolution, user: event.user });
        } catch (e) {
          // do nothing
        }

        const { leader, voteCount } = recordVote(
          votes,
          resolution,
          event.user.id,
        );

        if (leader && voteCount >= votesRequired) {
          await onResolve(leader);
        }
      }}
    />
  );

  return (
    <>
      {`After ${votesRequired} or more votes, the leading resolution will be automatically enforced.`}
      {/* TODO: show vote in progress, reveal votes and unvoted mods */}
      {renderButton(
        votes,
        resolutions.okay,
        humanReadableResolutions[resolutions.okay],
        "success",
      )}
      {renderButton(
        votes,
        resolutions.track,
        humanReadableResolutions[resolutions.track],
      )}
      {renderButton(
        votes,
        resolutions.timeout,
        humanReadableResolutions[resolutions.timeout],
      )}
      {renderButton(
        votes,
        resolutions.nudge,
        humanReadableResolutions[resolutions.nudge],
        "primary",
      )}
      {renderButton(
        votes,
        resolutions.warning,
        humanReadableResolutions[resolutions.warning],
      )}
      {renderButton(
        votes,
        resolutions.restrict,
        humanReadableResolutions[resolutions.restrict],
      )}
      {renderButton(
        votes,
        resolutions.kick,
        humanReadableResolutions[resolutions.kick],
      )}
      {renderButton(
        votes,
        resolutions.ban,
        humanReadableResolutions[resolutions.ban],
        "danger",
      )}
    </>
  );
};

export const Confirmation = ({
  thread,
  modRoleId,
  onNotify,
}: {
  thread: AnyThreadChannel;
  modRoleId: string;
  onNotify: () => void;
}) => {
  return (
    <>
      Discussion thread created
      <Button
        label="Notify mods"
        style="success"
        onClick={async (event) => {
          await thread.send(
            `<@${event.user.id}> indicated this is urgent. <@&${modRoleId}> please respond`,
          );
          await onNotify();
        }}
      />
    </>
  );
};
