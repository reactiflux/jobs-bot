import type { LoaderArgs, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LabelHTMLAttributes } from "react";
import {
  Sparklines,
  SparklinesBars,
  SparklinesReferenceLine,
} from "react-sparklines";
import { getTopParticipants } from "~/models/activity.server";

export const loader = async ({ request, context, params }: LoaderArgs) => {
  // const user = await getUser(request);
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return json(null, { status: 400 });
  }

  const REACTIFLUX_GUILD_ID = "102860784329052160";
  const output = await getTopParticipants(
    REACTIFLUX_GUILD_ID,
    start,
    end,
    [],
    ["Need Help", "React General", "Advanced Topics"],
  );

  return json(output);
};

export const action: ActionFunction = async ({ request }) => {
  console.log({ request });
};

const Label = (props: LabelHTMLAttributes<Element>) => (
  <label {...props} className={`${props.className ?? ""} m-4`}>
    {props.children}
  </label>
);

export default function DashboardPage() {
  const data = useLoaderData<typeof loader>();

  console.log(data);
  return (
    <div>
      <div className="flex min-h-full justify-center">
        <div>test butts</div>
        <form method="GET">
          <Label>
            Start date
            <input name="start" type="date" />
          </Label>
          <Label>
            End date
            <input name="end" type="date" />
          </Label>
          <input type="submit" value="Submit" />
        </form>
      </div>
      <div>
        <ShittyTable data={data} />
        {/* <ShittyTable data={data.dailyParticipation} /> */}
      </div>
    </div>
  );
}

const ShittyTable = ({ data }) => {
  const keys = Object.keys(data[0]);
  return (
    <div>
      <p>{data.length} entries</p>
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={keys.reduce((o, k) => o + d[k], "")}>
              {keys.map((k) => (
                <td key={d[k].toString() + k}>
                  {Array.isArray(d[k]) ? (
                    <Sparklines
                      svgHeight={26}
                      svgWidth={240}
                      data={d[k].map(({ word_count }) => word_count)}
                    >
                      <SparklinesBars barWidth={5} />
                      <SparklinesReferenceLine
                        type="median"
                        style={{ strokeWidth: 3 }}
                      />
                    </Sparklines>
                  ) : (
                    // <pre className="max-w-xs  overflow-scroll">
                    //   <code>{JSON.stringify(d[k])}</code>
                    // </pre>
                    d[k]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
