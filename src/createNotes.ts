import { TFile, Vault } from "obsidian";
import { addEntryFrontMatter, addTemplateFrontMatter } from "./addFrontMatter";
import { getTemplatesFolderName } from "./getTemplatesFolderName";
import { ContentTypes, Entries, PluginSettings } from "./types";
import { dateToMillis, millisToFileNameDate } from "./utilities";

export const createTemplatesFromTypes = async (
	contentTypes: ContentTypes,
	vault: Vault,
	settings: PluginSettings
) => {
	for (const contentType of contentTypes) {
		const { bodyFieldIDs, titleFieldIDs } = settings;
		const templatesFolderName = getTemplatesFolderName(vault)!.replace(
			"/",
			""
		);
		const name = contentType.name;
		const templateParams = addTemplateFrontMatter(
			vault,
			contentType,
			titleFieldIDs,
			bodyFieldIDs
		);
		const path = !templatesFolderName
			? `${name}.md`
			: `${templatesFolderName}/${name}.md`;
		const file = vault.getAbstractFileByPath(path);
		const templateFolder = vault.getAbstractFileByPath(templatesFolderName);

		if (!file) {
			if (!templateFolder) await vault.createFolder(templatesFolderName);
			await vault.create(path, templateParams);
		} else if (file instanceof TFile) vault.modify(file, templateParams);
	}
};

export const createNotesFromEntries = async (
	entries: Entries,
	vault: Vault,
	settings: PluginSettings
) => {
	const outOfSyncFiles: string[] = [];
	for (const entry of entries) {
		const { bodyFieldIDs, titleFieldIDs, defaultLocale } = settings;
		const contentType = entry.sys.contentType.sys.id;
		const fields = entry.fields;

		if (!fields[titleFieldIDs[contentType]]) {
			throw new Error(
				`Entry ID ${entry.sys.id} is missing the entry title`
			);
		}

		const name = fields[titleFieldIDs[contentType]][defaultLocale];
		const bodyField = fields[bodyFieldIDs[contentType]][defaultLocale];
		const bodyFieldProcessed = bodyField.replace(/\/\//g, "https://");
		const noteParams = addEntryFrontMatter(
			entry,
			titleFieldIDs,
			bodyFieldIDs,
			defaultLocale
		);
		const path = `${contentType}/${name}.md`;
		const createdAt = dateToMillis(entry.sys.createdAt);
		const updatedAt = dateToMillis(entry.sys.updatedAt);
		const file = vault.getAbstractFileByPath(path);
		const folder = vault.getAbstractFileByPath(contentType);

		if (!file) {
			if (!folder) await vault.createFolder(contentType);
			await vault.create(path, `${noteParams}${bodyFieldProcessed}`, {
				ctime: createdAt,
				mtime: updatedAt,
			});
		} else if (file instanceof TFile && updatedAt > file.stat.mtime) {
			// TODO: create copy and/or overwrite
			const copy = await createCopyAndOverwrite(
				file,
				entry,
				vault,
				noteParams,
				bodyFieldProcessed,
				createdAt,
				updatedAt
			);
			outOfSyncFiles.push(copy);
		}
	}

	return outOfSyncFiles;
};

const createCopyAndOverwrite = async (
	file: TFile,
	entry: Entries[number],
	vault: Vault,
	noteParams: string,
	bodyField: string,
	createdAt: number,
	updatedAt: number
) => {
	const contentType = entry.sys.contentType.sys.id;

	const time = millisToFileNameDate(file.stat.mtime);
	const newPath = `${contentType}/[COPY-${time}]${file.name}`;
	await vault.copy(file, newPath);
	await vault.modify(file, `${noteParams}${bodyField}`, {
		ctime: createdAt,
		mtime: updatedAt,
	});

	return file.basename;
};
