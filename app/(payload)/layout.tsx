import type { ReactNode } from "react";
import { RootLayout } from "@payloadcms/next/layouts";
import { handleServerFunctions } from "@payloadcms/next/layouts";
import configPromise from "../../payload.config";
import { importMap } from "./admin/importMap.js";

import "@payloadcms/next/css";

type Args = {
  children: ReactNode;
};

const serverFunction = async (args: { name: string; args: Record<string, unknown> }) => {
  "use server";
  return handleServerFunctions({
    name: args.name,
    args: args.args,
    config: configPromise,
    importMap,
  });
};

export default function PayloadLayout({ children }: Args) {
  return (
    <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction as any}>
      {children}
    </RootLayout>
  );
}
