import type { ActionFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { logout } from "~/models/session.server";

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};

export default function Logout({
  errors,
}: {
  errors?: { [k: string]: string };
}) {
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <button
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Log out
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {Object.values(errors || {}).map((error) => (
                <p key={error} className="text-red-500">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
