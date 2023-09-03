import ContentfulPublisher from "main";
import { App, TFile, parseYaml } from "obsidian";
import { dateToMillis } from "./utilities";

export const updateEntry = async (app: App, plugin: ContentfulPublisher) => {
	const file = app.workspace.getActiveFile() as TFile;
	const rawBody = await app.vault.cachedRead(file);
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = rawBody.match(frontmatterRegex);
	const frontmatterRaw = match ? match[1] : ""; // Capture group 1 contains the frontmatter
	const frontMatter = parseYaml(frontmatterRaw);
	const body = match ? rawBody.slice(match[0].length) : rawBody;
	const title = file.basename;
	const mtime = file.stat.mtime;
	const entryID = frontMatter.entryId as string;
	const entry = await plugin.contentful.getEntry(entryID);
	const updatedAt = dateToMillis(entry.sys.updatedAt);
	const { bodyFieldIDs, titleFieldIDs, defaultLocale } = plugin.settings;
	const contentType = entry.sys.contentType.sys.id;

	if (updatedAt > mtime) {
		const err = new Error(file.basename);
		err.name = "OutOfSyncError";
		throw err;
	}

	for (const [key, value] of Object.entries(frontMatter)) {
		if (key !== "entryId" && key === entry.fields[key])
			entry.fields[key][defaultLocale] = value;
	}
	entry.fields[titleFieldIDs[contentType]][defaultLocale] = title;
	entry.fields[bodyFieldIDs[contentType]][defaultLocale] = body;

	//TODO: read content of file, upload images, get new links back, update content of the file with new link.

	await plugin.contentful.updatedEntry(entryID, entry);

	return title;
};
