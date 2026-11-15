import "../globals.css";
import type { ReactNode } from "react";
import { RootLayout } from "@payloadcms/next/layouts";
import config from "../../payload.config";
import { importMap } from "./admin/importMap.js";
import { handleServerFunctions } from "../../node_modules/@payloadcms/next/dist/utilities/handleServerFunctions.js";

import "@payloadcms/next/css";

type Args = {
  children: ReactNode;
};

export default async function PayloadLayout({ children }: Args) {
  const serverFunction = async (args: { name: string; args: Record<string, unknown> }) =>
    handleServerFunctions({
      name: args.name,
      args: args.args,
      config,
      importMap,
    });

  return <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>{children}</RootLayout>;
}
