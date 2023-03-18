#!/usr/bin/env node
import { promises as fs } from "fs";
import cac from "cac";
import path from "path";
import chalk from "chalk";
import latestVersion from "latest-version";
import {
  match,
  getAttendance,
  removeUserInfo,
  getGPA,
  getInfo,
  getTasks,
  getMaterials,
  saveGoogleCalendarCSV,
  withLogin,
  configKeys,
  getUserData,
  zoom,
  updateUserConfig,
  GetInfoOptions,
  syncAll,
  attend,
} from "@dhu/core";
import {
  renderLogo,
  renderLogin,
  renderAttendance,
  renderGPA,
  renderTaskMap,
  renderMaterialMap,
  renderFS,
  renderZoom,
} from "./view";
import pkg from "./package.json";

const cli = cac();

cli.command("", "Log logo").action(renderLogo);

cli.command("login", "Save login info to local data path").action(renderLogin);

cli
  .command("logout", "Remove login info from local data path")
  .action(removeUserInfo);

cli
  .command("gpa", "Get GPA")
  .option("--head", "launch headfully")
  .action(async (option) =>
    match(await withLogin(getGPA, { headless: !option.head }), {
      ok: renderGPA,
    })
  );

cli
  .command("atte", "Get attendance")
  .option("--head", "launch headfully")
  .option("-q <q>", "quarter 1/2/3/4")
  .action(async (option) => {
    option.q &&= parseInt(option.q);
    const result = await withLogin((page) => getAttendance(page, option.q), {
      headless: !option.head,
    });
    await match(result, {
      ok: renderAttendance,
    });
  });

cli
  .command("info", "Get info")
  .option("--all", "retrieve all info")
  .option("--head", "launch headfully")
  .option("-r,--includeRead", "include read info")
  .option("-c,--content", "get content info")
  .option("-d,--download", "download attachments")
  .option("--dir <dir>", "path to save download attachments")
  .action(async (option) => {
    const { all, download, includeRead, content, dir } = option;
    const getInfoOptions: GetInfoOptions = {
      listAll: Boolean(all),
      skipRead: !includeRead,
      content: Boolean(content),
      attachmentOptions: {
        download: Boolean(download),
        dir: dir ?? process.cwd(),
      },
    };
    const data = await withLogin(
      async (page) => getInfo(page, getInfoOptions),
      {
        headless: !option.head,
      }
    );
    await match(data, {
      ok: (data) => console.log(JSON.stringify(data, null, 4)),
    });
  });

cli
  .command("fs", "Get fs")
  .option("--head", "launch headfully")
  .action(async (option) => {
    await withLogin(renderFS.write, { headless: !option.head });
  });

cli
  .command("task", "Get tasks")
  .option("--head", "launch headfully")
  .option("--end", "show end tasks")
  .option("--empty", "show empty tasks")
  .option("-q <q>", "quarter 1/2/3/4")
  .action(async (option) => {
    const result = await withLogin(
      (ctx) => getTasks(ctx, parseInt(option.q, 10)),
      { headless: !option.head }
    );
    await match(result, {
      ok(data) {
        const renderOptions = { showEmpty: option.empty, showEnd: option.end };
        renderTaskMap(data, renderOptions);
      },
    });
  });

cli
  .command("matl", "Get Materials")
  .option("--head", "launch headfully")
  .option("--dir <dir>", "path to save download attachments")
  .action(async (option) => {
    const getDir = async () => {
      if (option.dir) return option.dir;
      const data = await getUserData();
      if (data?.config?.syncDir) return data.config.syncDir;
      return path.join(process.cwd(), ".dhu-sync");
    };

    const dir = await getDir();
    console.log(chalk`syncing data with {cyan ${dir}}`);

    const result = await withLogin(
      (ctx) => getMaterials(ctx, { download: true, dir }),
      {
        headless: !option.head,
      }
    );

    await match(result, {
      ok(data) {
        renderMaterialMap(data);
      },
    });
  });

cli
  .command("sync", "Sync all")
  .option("--head", "launch headfully")
  .option("--dir <dir>", "path to save download attachments")
  .action(async (option) => {
    await syncAll(option.dir, { headless: !option.head });
  });

cli
  .command("config [...kv]", "Set config")
  .option("-s,--show", "Show key")
  .option("-d,--delete", "Show key")
  .action(async (kv: string[], option) => {
    if (kv.length < 1) {
      console.log(`usage: dhu config --show key`);
      console.log(`       dhu config key value`);
      return;
    }

    const [k, v] = kv;

    if (!configKeys.has(k)) {
      console.error(
        `unknown key ${k}, expected: ${Array.from(configKeys.keys()).join()}`
      );
      return;
    }

    if (option.show) {
      const data = await getUserData();
      console.log(data?.config?.[k as keyof typeof data["config"]]);
      return;
    }

    if (option.delete) {
      await updateUserConfig(k, undefined);
      return;
    }

    if (!v) {
      console.log(`dhu config key value`);
      return;
    }

    await updateUserConfig(k, v);
  });

cli
  .command("timetable", "Download timetable csv")
  .option("--head", "launch headfully")
  .option("-q <q>", "quarter 1/2/3/4?")
  .option("-s, --start <start>", "first monday when quarter start")
  .action(async (option) => {
    await withLogin(
      async (ctx) => {
        const csv = await saveGoogleCalendarCSV(ctx, option.q, option.start);
        await fs.writeFile(
          `${process.cwd()}/dhu-timetable-${option.start}.csv`,
          csv,
          { encoding: "utf-8" }
        );
      },
      {
        headless: !option.head,
      }
    );
    console.log("✨done");
  });

cli
  .command("zoom", "Open zoom")
  .option("--import-url", "Import zoom info by url from web")
  .option("--import-file", "Import zoom info by local file")
  .action(async (option) => {
    if (option.importUrl) {
      return zoom.importFromUrl(option.importUrl);
    }

    if (option.importFile) {
      return zoom.importFromFile(option.importFile);
    }

    await renderZoom();
  });

cli
  .command("attend <code>", "Attend with code")
  .option("--head", "launch headfully")
  .action(async (code, option) => {
    const { data, error } = await attend(
      { code, onMessage: console.log },
      {
        headless: !option.head,
      }
    );
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(data);
  });

cli.help();
cli.version(pkg.version);

async function checkVersion() {
  const ver = await latestVersion(pkg.name);
  if (ver === pkg.version) return;
  console.log(
    chalk.yellow
      .bold`A new version of ${pkg.name} {cyan.bold ${ver}} (currently ${pkg.version}) has been released, try run {cyan.bold \`pnpm add @dhu/cli --global\`} to upgrade.`
  );
}

async function run() {
  console.log(
    chalk.cyan.bold`
 ________________________________________________
/\\                                               \\
\\_|  {bgYellow.black Looking for maintainers.}                    |
  |                                              |
  |  Author of this tool will no longer maintain |
  |  this tool and the {bgYellow.black @dhu} name scope.          |
  |                                              |
  |  If you are interested in maintaining this   |
  |  repo or the using the @dhu name scope,      |
  |  please contact via github issues.           |
  |   ___________________________________________|_
   \\_/____________________________________________/`
  );

  await checkVersion();
  cli.parse();
}

run();
