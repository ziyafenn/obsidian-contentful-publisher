import { Vault, stringifyYaml } from "obsidian";
import {
	ContentTypes,
	Entries,
	ObsidianParamTypes,
	allowedFieldTypes,
} from "./types";
import { writeToTypes, mapContentfulTypesToObsidian } from "./writeToTypes";

type FieldIDs = Record<string, string>;

export const addTemplateFrontMatter = (
	vault: Vault,
	contentType: ContentTypes[number],
	titleFieldIDs: FieldIDs,
	bodyFieldIDs: FieldIDs
) => {
	const parameters: Map<string, unknown> = new Map();
	const fieldTypes: Map<string, ObsidianParamTypes> = new Map();
	const contentTypeId = contentType.sys.id;

	contentType.fields.forEach((field) => {
		const fieldType = field.type as (typeof allowedFieldTypes)[number];
		const currentDate = new Date();
		const formattedDate = currentDate.toISOString().slice(0, 16);
		if (
			titleFieldIDs[contentTypeId] !== field.id &&
			bodyFieldIDs[contentTypeId] !== field.id
		) {
			if (fieldType === "Boolean") parameters.set(field.id, false);
			else if (fieldType === "Integer" || fieldType === "Number")
				parameters.set(field.id, 0);
			else if (fieldType === "Date")
				parameters.set(field.id, formattedDate);
			else parameters.set(field.id, "");

			fieldTypes.set(field.id, mapContentfulTypesToObsidian(fieldType));
		}
	});

	const yaml = stringifyYaml(Object.fromEntries(parameters));
	const mdParams = `---\n${yaml}---\n`;

	writeToTypes(vault, fieldTypes);
	return mdParams;
};

export const addEntryFrontMatter = (
	entry: Entries[number],
	titleFieldIDs: FieldIDs,
	bodyFieldIDs: FieldIDs,
	defaultLocale: string
) => {
	const contentTypeId = entry.sys.contentType.sys.id;
	const entryId = entry.sys.id;
	const parameters: Map<string, unknown> = new Map([["entryId", entryId]]);

	for (const [key, value] of Object.entries(entry.fields)) {
		if (
			titleFieldIDs[contentTypeId] !== key &&
			bodyFieldIDs[contentTypeId] !== key
		)
			parameters.set(key, value[defaultLocale]);
	}

	const yaml = stringifyYaml(Object.fromEntries(parameters));
	const mdParams = `---\n${yaml}---\n`;
	return mdParams;
};
